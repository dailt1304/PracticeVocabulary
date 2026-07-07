import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { FiArrowLeft } from 'react-icons/fi';
import useGameLoop from './hooks/useGameLoop';
import Meteorite from './components/Meteorite';
import GameOverlay from './components/GameOverlay';
import './WordInvaders.css';

// ── Helpers ──

/** Mask a word by hiding ~35% of characters, always keeping the first letter */
const maskWord = (word) => {
  if (word.length <= 2) return word[0] + '_';
  const chars = word.split('');
  const indicesToHide = [];

  // Determine how many chars to hide (30-40%)
  const hideCount = Math.max(1, Math.round(chars.length * (0.3 + Math.random() * 0.1)));

  // Build candidate indices (skip index 0 = first letter)
  const candidates = [];
  for (let i = 1; i < chars.length; i++) {
    if (/[a-zA-Z]/.test(chars[i])) candidates.push(i);
  }

  // Shuffle and pick
  const shuffled = candidates.sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(hideCount, shuffled.length); i++) {
    indicesToHide.push(shuffled[i]);
  }

  return chars.map((ch, idx) => (indicesToHide.includes(idx) ? '_' : ch)).join('');
};

/** Generate a unique ID */
let idCounter = 0;
const uid = () => `m_${Date.now()}_${idCounter++}`;

// ── Level Config ──
const LEVEL_CONFIG = [
  { destroyedThreshold: 0,  speed: 8,  spawnInterval: 3.0, maxOnScreen: 2 },
  { destroyedThreshold: 8,  speed: 10, spawnInterval: 2.5, maxOnScreen: 3 },
  { destroyedThreshold: 16, speed: 12, spawnInterval: 2.0, maxOnScreen: 4 },
  { destroyedThreshold: 24, speed: 14, spawnInterval: 1.5, maxOnScreen: 5 },
];

const getLevelConfig = (destroyedCount) => {
  for (let i = LEVEL_CONFIG.length - 1; i >= 0; i--) {
    if (destroyedCount >= LEVEL_CONFIG[i].destroyedThreshold) return { ...LEVEL_CONFIG[i], level: i + 1 };
  }
  return { ...LEVEL_CONFIG[0], level: 1 };
};

// ── Main Component ──

const WordInvaders = () => {
  const { id } = useParams();
  const { user, updateSessionResults } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Data
  const [topic, setTopic] = useState(null);
  const [vocabulary, setVocabulary] = useState([]);
  const [loading, setLoading] = useState(true);

  // Game state
  const [gamePhase, setGamePhase] = useState('idle'); // idle | playing | paused | gameover
  const [hp, setHp] = useState(3);
  const [score, setScore] = useState(0);
  const [destroyedCount, setDestroyedCount] = useState(0);
  const [totalSpawned, setTotalSpawned] = useState(0);
  const [meteorites, setMeteorrites] = useState([]);
  const [typedText, setTypedText] = useState('');
  const [xpAwarded, setXpAwarded] = useState(false);

  // Refs for game loop (avoid stale closures)
  const meteoritesRef = useRef([]);
  const hpRef = useRef(3);
  const destroyedRef = useRef(0);
  const totalSpawnedRef = useRef(0);
  const vocabularyRef = useRef([]);
  const spawnTimerRef = useRef(0);
  const scoreRef = useRef(0);

  // Keep refs in sync
  useEffect(() => { meteoritesRef.current = meteorites; }, [meteorites]);
  useEffect(() => { hpRef.current = hp; }, [hp]);
  useEffect(() => { destroyedRef.current = destroyedCount; }, [destroyedCount]);
  useEffect(() => { totalSpawnedRef.current = totalSpawned; }, [totalSpawned]);
  useEffect(() => { vocabularyRef.current = vocabulary; }, [vocabulary]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  // ── Fetch Data ──
  useEffect(() => {
    if (!user || !id) return;

    const fetchData = async () => {
      const [topicRes, vocabRes] = await Promise.all([
        supabase.from('topics').select('*').eq('id', id).single(),
        supabase.from('vocabulary').select('*').eq('topic_id', id),
      ]);

      if (topicRes.error) {
        toast.error('Không tìm thấy chủ đề');
        navigate('/topics');
        return;
      }

      if (!vocabRes.data || vocabRes.data.length < 5) {
        toast.error('Cần ít nhất 5 từ vựng để chơi Word Invaders!');
        navigate(`/topics/${id}`);
        return;
      }

      setTopic(topicRes.data);
      setVocabulary(vocabRes.data);
      setLoading(false);
    };

    fetchData();
  }, [user, id]);

  // ── Speak Word ──
  const speakWord = useCallback((text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    speechSynthesis.speak(utterance);
  }, []);

  // ── Spawn Meteorite ──
  const spawnMeteorite = useCallback(() => {
    const vocab = vocabularyRef.current;
    if (vocab.length === 0) return;

    const config = getLevelConfig(destroyedRef.current);
    const currentMets = meteoritesRef.current.filter((m) => !m.isExploding);

    // Don't exceed max on screen
    if (currentMets.length >= config.maxOnScreen) return;

    // Pick a random word not already on screen
    const onScreenWords = new Set(currentMets.map((m) => m.word));
    const available = vocab.filter((v) => !onScreenWords.has(v.word));
    const pool = available.length > 0 ? available : vocab;
    const chosen = pool[Math.floor(Math.random() * pool.length)];

    const newMet = {
      id: uid(),
      word: chosen.word,
      meaning: chosen.meaning,
      maskedWord: maskWord(chosen.word),
      x: 5 + Math.random() * 80, // 5% to 85%
      y: -8,
      speed: config.speed + (Math.random() * 2 - 1), // slight variation
      isExploding: false,
    };

    setMeteorrites((prev) => [...prev, newMet]);
    setTotalSpawned((prev) => prev + 1);
  }, []);

  // ── Run Game Loop ──
  const gameLoopCallback = useCallback((deltaTime) => {
    const config = getLevelConfig(destroyedRef.current);

    // 1. Move meteorites
    const currentMets = meteoritesRef.current;
    const updated = [];
    let hpLost = 0;

    for (const met of currentMets) {
      if (met.isExploding) {
        updated.push(met); // keep exploding ones
        continue;
      }
      const newY = met.y + met.speed * deltaTime;
      if (newY >= 100) {
        // Hit the ground
        hpLost++;
      } else {
        updated.push({ ...met, y: newY });
      }
    }

    setMeteorrites(updated);

    if (hpLost > 0) {
      setHp((prevHp) => {
        const newHp = Math.max(0, prevHp - hpLost);
        if (newHp <= 0) {
          setGamePhase('gameover');
        }
        return newHp;
      });
    }

    // 2. Spawn timer
    spawnTimerRef.current += deltaTime;
    if (spawnTimerRef.current >= config.spawnInterval) {
      spawnTimerRef.current = 0;
      spawnMeteorite();
    }
  }, [spawnMeteorite]);

  // ── Run Game Loop ──
  useGameLoop(gameLoopCallback, gamePhase === 'playing');

  // ── Handle Typing & Matching ──
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setTypedText(value);

    if (!value.trim()) return;

    // Find matching meteorite (prioritize the one closest to bottom)
    const activeMets = meteoritesRef.current
      .filter((m) => !m.isExploding)
      .sort((a, b) => b.y - a.y); // highest y first = closest to ground

    const matched = activeMets.find(
      (m) => m.word.toLowerCase() === value.trim().toLowerCase()
    );

    if (matched) {
      // Mark as exploding
      setMeteorrites((prev) =>
        prev.map((m) => (m.id === matched.id ? { ...m, isExploding: true } : m))
      );

      // Update score
      const config = getLevelConfig(destroyedRef.current);
      setScore((prev) => prev + 10 * config.level);
      setDestroyedCount((prev) => prev + 1);

      // Speak the word
      speakWord(matched.word);

      // Clear input
      setTypedText('');

      // Remove exploding meteorite after animation
      setTimeout(() => {
        setMeteorrites((prev) => prev.filter((m) => m.id !== matched.id));
      }, 400);

      // Small confetti burst at position
      confetti({
        particleCount: 15,
        spread: 40,
        startVelocity: 15,
        origin: { x: matched.x / 100, y: matched.y / 100 },
        colors: ['#667eea', '#764ba2', '#f5576c', '#4facfe'],
      });
    }
  }, [speakWord]);

  // ── Keyboard: Escape to pause ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (gamePhase === 'playing') {
          setGamePhase('paused');
        } else if (gamePhase === 'paused') {
          setGamePhase('playing');
          inputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gamePhase]);

  // ── Auto-focus input when playing ──
  useEffect(() => {
    if (gamePhase === 'playing') {
      inputRef.current?.focus();
    }
  }, [gamePhase]);

  // ── Game Over: Award XP ──
  useEffect(() => {
    if (gamePhase !== 'gameover' || xpAwarded) return;

    const awardXP = async () => {
      const baseXP = destroyedRef.current * 2;
      const accuracy = totalSpawnedRef.current > 0
        ? destroyedRef.current / totalSpawnedRef.current
        : 0;
      const bonusXP = accuracy >= 0.8 ? 10 : 0;
      const totalXP = baseXP + bonusXP;

      if (totalXP > 0) {
        await updateSessionResults({
          xpGained: totalXP,
          progressUpdates: [],
        });
        toast.success(`Bạn nhận được +${totalXP} XP! 🏆`);
      }

      // Big confetti for great accuracy
      if (accuracy >= 0.8 && destroyedRef.current >= 5) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      }

      setXpAwarded(true);
    };

    awardXP();
  }, [gamePhase, xpAwarded, updateSessionResults]);

  // ── Actions ──
  const handleStart = () => {
    setHp(3);
    setScore(0);
    setDestroyedCount(0);
    setTotalSpawned(0);
    setMeteorrites([]);
    setTypedText('');
    setXpAwarded(false);
    spawnTimerRef.current = 0;
    setGamePhase('playing');
    // Spawn first meteorite immediately
    setTimeout(() => spawnMeteorite(), 300);
  };

  const handleResume = () => {
    setGamePhase('playing');
    inputRef.current?.focus();
  };

  const handleRestart = () => {
    handleStart();
  };

  const handleExit = () => {
    navigate(`/topics/${id}`);
  };

  // ── Computed ──
  const currentConfig = getLevelConfig(destroyedCount);
  const earnedXP = destroyedCount * 2 + (totalSpawned > 0 && destroyedCount / totalSpawned >= 0.8 ? 10 : 0);

  // ── Render ──
  if (loading) {
    return (
      <div className="word-invaders-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu trò chơi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="word-invaders-page">
      {/* Header */}
      <div className="invaders-header">
        <button className="back-btn" onClick={handleExit}>
          <FiArrowLeft /> Thoát
        </button>

        <div className="hp-display">
          {[1, 2, 3].map((i) => (
            <span key={i} className={`hp-heart ${hp >= i ? 'alive' : 'dead'}`}>
              ❤️
            </span>
          ))}
        </div>

        <div className="score-display">
          <span className="score-value">Score: {score}</span>
          <span className="level-badge">Lv.{currentConfig.level}</span>
        </div>
      </div>

      {/* Game Area */}
      <div className="game-area" onClick={() => inputRef.current?.focus()}>
        {/* Starfield background dots */}
        <div className="starfield" />

        {/* Meteorites */}
        {meteorites.map((met) => (
          <Meteorite key={met.id} meteorite={met} />
        ))}

        {/* Danger line */}
        <div className="danger-line" />
      </div>

      {/* Input Area */}
      <div className="input-area">
        <input
          ref={inputRef}
          type="text"
          className="invaders-input"
          value={typedText}
          onChange={handleInputChange}
          placeholder={gamePhase === 'playing' ? 'Gõ từ tiếng Anh để bắn...' : 'Nhấn Bắt đầu để chơi'}
          disabled={gamePhase !== 'playing'}
          autoComplete="off"
          spellCheck={false}
        />
        {typedText && (
          <span className="typing-preview">{typedText}</span>
        )}
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {(gamePhase === 'idle' || gamePhase === 'paused' || gamePhase === 'gameover') && (
          <GameOverlay
            phase={gamePhase}
            topic={topic}
            vocabCount={vocabulary.length}
            score={score}
            destroyedCount={destroyedCount}
            totalSpawned={totalSpawned}
            earnedXP={earnedXP}
            onStart={handleStart}
            onResume={handleResume}
            onRestart={handleRestart}
            onExit={handleExit}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default WordInvaders;

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import {
  FiArrowLeft,
  FiVolume2,
  FiRotateCw,
  FiCheck,
  FiX,
  FiAward,
  FiBookOpen,
} from 'react-icons/fi';
import './Flashcard.css';

const getWordTypeLabel = (type) => {
  const map = {
    noun: 'n',
    verb: 'v',
    adjective: 'adj',
    adverb: 'adv',
    preposition: 'prep',
    conjunction: 'conj',
    pronoun: 'pron',
    interjection: 'interj',
    determiner: 'det',
    phrase: 'phr',
  };
  return map[type] || type;
};

const Flashcard = () => {
  const { id } = useParams(); // Topic ID
  const { user, profile, updateSessionResults } = useAuth();
  const navigate = useNavigate();

  const [topic, setTopic] = useState(null);
  const [vocabulary, setVocabulary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Track learning progress during session
  const [learnedWords, setLearnedWords] = useState([]); // Array of word IDs marked as "easy/mastered"
  const [reviewWords, setReviewWords] = useState([]); // Array of word IDs marked as "hard/review"
  const [isFinished, setIsFinished] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);

  // New learning mode selection states
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [rawVocabulary, setRawVocabulary] = useState([]);
  const [masteredIds, setMasteredIds] = useState(new Set());
  const [stats, setStats] = useState({ total: 0, mastered: 0, learning: 0, new: 0 });

  const fetchTopicAndVocab = async () => {
    try {
      const [topicRes, vocabRes] = await Promise.all([
        supabase.from('topics').select('*').eq('id', id).single(),
        supabase.from('vocabulary').select('*').eq('topic_id', id)
      ]);

      if (topicRes.error) {
        toast.error('Không tìm thấy chủ đề');
        navigate('/topics');
        return;
      }

      if (!vocabRes.data || vocabRes.data.length === 0) {
        toast.error('Chủ đề này chưa có từ vựng để học!');
        navigate(`/topics/${id}`);
        return;
      }

      setTopic(topicRes.data);
      const rawVocab = vocabRes.data;
      setRawVocabulary(rawVocab);

      // Fetch user progress for these words
      const vocabIds = rawVocab.map(v => v.id);
      const { data: progressData, error: progressError } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('vocabulary_id', vocabIds);

      if (progressError) throw progressError;

      const progressMap = {};
      const masteredSet = new Set();
      let masteredCount = 0;
      let learningCount = 0;

      (progressData || []).forEach((p) => {
        progressMap[p.vocabulary_id] = p.status;
        if (p.status === 'mastered') {
          masteredSet.add(p.vocabulary_id);
          masteredCount++;
        } else if (p.status === 'learning') {
          learningCount++;
        }
      });

      const newCount = rawVocab.length - masteredCount - learningCount;
      setMasteredIds(masteredSet);
      setStats({
        total: rawVocab.length,
        mastered: masteredCount,
        learning: learningCount,
        new: newCount
      });

      // If there are mastered words, show learning mode selection screen
      if (masteredCount > 0) {
        setShowModeSelection(true);
      } else {
        // Shuffle and start studying all words
        const shuffled = [...rawVocab].sort(() => Math.random() - 0.5);
        setVocabulary(shuffled);
        setShowModeSelection(false);
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleStartLearningMode = (onlyRemaining) => {
    let targetList = [...rawVocabulary];
    if (onlyRemaining) {
      targetList = rawVocabulary.filter(v => !masteredIds.has(v.id));
    }
    
    if (targetList.length === 0) {
      toast.error('Không có từ vựng nào để học!');
      return;
    }

    const shuffled = targetList.sort(() => Math.random() - 0.5);
    setVocabulary(shuffled);
    setCurrentIndex(0);
    setLearnedWords([]);
    setReviewWords([]);
    setShowModeSelection(false);
  };

  useEffect(() => {
    if (user && id) {
      fetchTopicAndVocab();
    }
  }, [user, id]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isFinished || showModeSelection) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        handleMarkLearned();
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        handleMarkReview();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, vocabulary, isFlipped, isFinished, showModeSelection]);

  const speakWord = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    speechSynthesis.speak(utterance);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const nextCard = async (isMastered) => {
    const currentWord = vocabulary[currentIndex];
    
    // Save learning progress immediately in real-time
    try {
      await supabase.from('learning_progress').upsert({
        user_id: user.id,
        vocabulary_id: currentWord.id,
        status: isMastered ? 'mastered' : 'learning',
        last_reviewed_at: new Date().toISOString()
      }, { onConflict: 'user_id,vocabulary_id' });
    } catch (err) {
      console.error('Failed to save learning progress in real-time:', err);
    }

    if (isMastered) {
      setLearnedWords((prev) => [...prev, currentWord.id]);
    } else {
      setReviewWords((prev) => [...prev, currentWord.id]);
    }

    if (currentIndex < vocabulary.length - 1) {
      setIsFlipped(false);
      // Small timeout for flip animation to complete before changing data
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 200);
    } else {
      handleFinishSession();
    }
  };

  const handleMarkLearned = () => {
    nextCard(true);
  };

  const handleMarkReview = () => {
    nextCard(false);
  };

  const handleFinishSession = async () => {
    setIsFinished(true);
    // Fire confetti!
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    });

    // Award XP and Save Progress
    if (!xpAwarded && user) {
      const earnedXP = 15; // Base XP for completing flashcard session

      await updateSessionResults({
        xpGained: earnedXP,
        progressUpdates: [] // Progress already updated in real-time during session!
      });

      setXpAwarded(true);
      toast.success(`Chúc mừng! Bạn đã nhận được +${earnedXP} XP! 🏆`);
    }
  };

  if (loading) {
    return (
      <div className="flashcard-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Đang chuẩn bị bộ thẻ học...</p>
        </div>
      </div>
    );
  }

  const currentVocab = vocabulary[currentIndex];
  const progressPercent = ((currentIndex) / vocabulary.length) * 100;

  return (
    <div className="flashcard-page">
      {/* Header */}
      <div className="flashcard-header">
        <button className="back-btn" onClick={() => navigate(`/topics/${id}`)}>
          <FiArrowLeft /> Quay lại chủ đề
        </button>
        <span className="topic-badge" style={{ backgroundColor: topic?.color || '#667eea' }}>
          {topic?.icon} {topic?.name}
        </span>
      </div>

      {showModeSelection ? (
        <div className="mode-selection-container">
          <motion.div 
            className="mode-selection-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="mode-title">Chế độ học Flashcard</h2>
            <p className="mode-subtitle">Chọn phạm vi từ vựng bạn muốn học lần này</p>
            
            <div className="mode-stats-grid">
              <div className="mode-stat-item total">
                <span className="value">{stats.total}</span>
                <span className="label">Tổng số từ</span>
              </div>
              <div className="mode-stat-item mastered">
                <span className="value">{stats.mastered}</span>
                <span className="label">Đã thuộc</span>
              </div>
              <div className="mode-stat-item remaining">
                <span className="value">{stats.total - stats.mastered}</span>
                <span className="label">Chưa thuộc</span>
              </div>
            </div>

            <div className="mode-options">
              {stats.total > stats.mastered && (
                <button 
                  className="mode-btn primary-btn"
                  onClick={() => handleStartLearningMode(true)}
                >
                  <span className="mode-btn-icon">🚀</span>
                  <div className="mode-btn-text">
                    <span className="title">Học tiếp các từ còn lại</span>
                    <span className="desc">Chỉ học {stats.total - stats.mastered} từ chưa thuộc</span>
                  </div>
                </button>
              )}
              
              <button 
                className={`mode-btn ${stats.total === stats.mastered ? 'primary-btn' : ''}`}
                onClick={() => handleStartLearningMode(false)}
              >
                <span className="mode-btn-icon">🔄</span>
                <div className="mode-btn-text">
                  <span className="title">Ôn tập lại tất cả</span>
                  <span className="desc">Học lại toàn bộ {stats.total} từ của chủ đề</span>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      ) : !isFinished ? (
        <div className="flashcard-container">
          {/* Progress bar */}
          <div className="flashcard-progress">
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <div className="progress-text">
              Thẻ {currentIndex + 1} / {vocabulary.length}
            </div>
          </div>

          {/* Flip Card */}
          <div className="card-wrapper" onClick={handleFlip}>
            <div className={`flash-card ${isFlipped ? 'flipped' : ''}`}>
              {/* Mặt trước */}
              <div className="card-face card-front">
                <div className="card-hint-top">NHẤP VÀO ĐỂ LẬT THẺ</div>
                <div className="card-body">
                  <h2 className="card-word">{currentVocab?.word}</h2>
                  {currentVocab?.word_type && (
                    <div className="card-word-types">
                      {currentVocab.word_type.split(',').map((t) => t.trim()).filter(Boolean).map((type) => (
                        <span key={type} className={`word-type-badge type-${type}`}>
                          {getWordTypeLabel(type)}
                        </span>
                      ))}
                    </div>
                  )}
                  {currentVocab?.pronunciation && (
                    <p className="card-ipa">/{currentVocab.pronunciation}/</p>
                  )}
                  <button
                    className="card-audio-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      speakWord(currentVocab?.word);
                    }}
                  >
                    <FiVolume2 /> Nghe phát âm
                  </button>
                </div>
                <div className="card-instruction">
                  <FiRotateCw /> Click vào thẻ hoặc bấm <strong>Space</strong> để lật
                </div>
              </div>

              {/* Mặt sau */}
              <div className="card-face card-back">
                <div className="card-hint-top">NHẤP VÀO ĐỂ LẬT THẺ</div>
                <div className="card-body">
                  <h3 className="card-meaning">{currentVocab?.meaning}</h3>
                  {currentVocab?.example_sentence && (
                    <div className="card-example-box">
                      <span className="example-label">Ví dụ:</span>
                      <p className="card-example-text">{currentVocab.example_sentence}</p>
                    </div>
                  )}
                </div>
                <div className="card-instruction">
                  <FiRotateCw /> Click vào thẻ hoặc bấm <strong>Space</strong> để lật lại
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flashcard-actions">
            <motion.button
              className="action-btn-learn need-review"
              onClick={handleMarkReview}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Chưa nhớ từ này"
            >
              <FiX /> Ôn lại (A)
            </motion.button>
            <motion.button
              className="action-btn-learn mastered"
              onClick={handleMarkLearned}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Đã nhớ từ này"
            >
              <FiCheck /> Đã thuộc (D)
            </motion.button>
          </div>
        </div>
      ) : (
        /* Finished State */
        <motion.div
          className="finished-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
        >
          <div className="finished-badge-icon">🎉</div>
          <h2>Tuyệt vời!</h2>
          <p>Bạn đã hoàn thành lượt học Flashcard của chủ đề này.</p>

          <div className="finish-stats">
            <div className="finish-stat-box green">
              <span className="num">{learnedWords.length}</span>
              <span className="lbl">Đã thuộc</span>
            </div>
            <div className="finish-stat-box orange">
              <span className="num">{reviewWords.length}</span>
              <span className="lbl">Cần ôn lại</span>
            </div>
            <div className="finish-stat-box xp">
              <span className="num">+15</span>
              <span className="lbl">XP nhận được</span>
            </div>
          </div>

          <div className="finished-buttons">
            <button className="btn-primary-finish" onClick={() => navigate(`/topics/${id}`)}>
              Quay lại chủ đề
            </button>
            <button
              className="btn-secondary-finish"
              onClick={() => {
                setIsFinished(false);
                setXpAwarded(false);
                setCurrentIndex(0);
                setIsFlipped(false);
                setLearnedWords([]);
                setReviewWords([]);
                fetchTopicAndVocab();
              }}
            >
              <FiBookOpen /> Học lại từ đầu
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Flashcard;

import { motion } from 'framer-motion';
import { FiPlay, FiPause, FiRotateCcw, FiArrowLeft } from 'react-icons/fi';

const GameOverlay = ({
  phase,          // 'idle' | 'paused' | 'gameover'
  topic,
  vocabCount,
  score,
  destroyedCount,
  totalSpawned,
  earnedXP,
  onStart,
  onResume,
  onRestart,
  onExit,
}) => {
  if (phase === 'idle') {
    return (
      <motion.div
        className="game-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="overlay-card">
          <div className="overlay-icon">🚀</div>
          <h2 className="overlay-title">Word Invaders</h2>
          <p className="overlay-subtitle">Gõ từ diệt thiên thạch</p>

          <div className="overlay-topic-info">
            <span className="overlay-topic-badge" style={{ backgroundColor: topic?.color || '#667eea' }}>
              {topic?.icon} {topic?.name}
            </span>
            <span className="overlay-vocab-count">{vocabCount} từ vựng</span>
          </div>

          <div className="overlay-instructions">
            <h4>Hướng dẫn chơi</h4>
            <ul>
              <li>🌑 Thiên thạch chứa từ vựng sẽ rơi từ trên xuống</li>
              <li>⌨️ Gõ đúng từ tiếng Anh để bắn nổ thiên thạch</li>
              <li>❤️ Bạn có 3 mạng — thiên thạch chạm đất sẽ mất 1 mạng</li>
              <li>⚡ Tốc độ sẽ tăng dần theo cấp độ</li>
              <li>⏸️ Nhấn Escape để tạm dừng</li>
            </ul>
          </div>

          <p className="overlay-tip">💡 Trải nghiệm tốt nhất trên máy tính có bàn phím vật lý</p>

          <button className="overlay-btn primary" onClick={onStart}>
            <FiPlay /> Bắt đầu chơi
          </button>
        </div>
      </motion.div>
    );
  }

  if (phase === 'paused') {
    return (
      <motion.div
        className="game-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="overlay-card">
          <div className="overlay-icon">⏸️</div>
          <h2 className="overlay-title">Tạm dừng</h2>
          <p className="overlay-subtitle">Nhấn Escape hoặc nút bên dưới để tiếp tục</p>

          <div className="overlay-actions">
            <button className="overlay-btn primary" onClick={onResume}>
              <FiPlay /> Tiếp tục
            </button>
            <button className="overlay-btn secondary" onClick={onExit}>
              <FiArrowLeft /> Thoát game
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (phase === 'gameover') {
    const accuracy = totalSpawned > 0 ? Math.round((destroyedCount / totalSpawned) * 100) : 0;
    const isGreat = accuracy >= 80;

    return (
      <motion.div
        className="game-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="overlay-card">
          <div className="overlay-icon">{isGreat ? '👑' : '💥'}</div>
          <h2 className="overlay-title">{isGreat ? 'Xuất sắc!' : 'Game Over'}</h2>
          <p className="overlay-subtitle">
            {isGreat ? 'Bạn đã chiến đấu rất tốt!' : 'Đừng nản chí, hãy thử lại nhé!'}
          </p>

          <div className="gameover-stats">
            <div className="gameover-stat">
              <span className="gameover-stat-value">{score}</span>
              <span className="gameover-stat-label">Điểm số</span>
            </div>
            <div className="gameover-stat">
              <span className="gameover-stat-value">{destroyedCount}</span>
              <span className="gameover-stat-label">Từ bắn hạ</span>
            </div>
            <div className="gameover-stat">
              <span className="gameover-stat-value">{accuracy}%</span>
              <span className="gameover-stat-label">Chính xác</span>
            </div>
            <div className="gameover-stat xp">
              <span className="gameover-stat-value">+{earnedXP}</span>
              <span className="gameover-stat-label">XP</span>
            </div>
          </div>

          <div className="overlay-actions">
            <button className="overlay-btn primary" onClick={onRestart}>
              <FiRotateCcw /> Chơi lại
            </button>
            <button className="overlay-btn secondary" onClick={onExit}>
              <FiArrowLeft /> Quay về chủ đề
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
};

export default GameOverlay;

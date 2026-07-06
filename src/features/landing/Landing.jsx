import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiArrowRight, 
  FiBookOpen, 
  FiAward, 
  FiZap, 
  FiCheckCircle, 
  FiEdit3, 
  FiTrendingUp, 
  FiLayers 
} from 'react-icons/fi';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const [activeFlipped, setActiveFlipped] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  };

  return (
    <div className="landing-container">
      {/* Background Orbs */}
      <div className="bg-orbs-wrapper">
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>
        <div className="bg-orb orb-3"></div>
      </div>

      {/* Header */}
      <header className="landing-header">
        <div className="header-logo">
          <span className="logo-icon">🚀</span>
          <h2>Vocab<span className="gradient-text">Practice</span></h2>
        </div>
        <nav className="header-nav">
          <a href="#features">Tính năng</a>
          <a href="#methodology">Phương pháp</a>
          <a href="#stats">Thống kê</a>
        </nav>
        <div className="header-actions">
          <button className="btn-ghost" onClick={() => navigate('/login')}>
            Đăng nhập
          </button>
          <button className="btn-glow-nav" onClick={() => navigate('/register')}>
            Học thử ngay
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="hero-badge"
          >
            <span className="badge-icon">🔥</span> Phiên bản Beta 2.0 đã ra mắt
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="hero-title"
          >
            Chinh phục từ vựng <br />
            <span className="gradient-text-hero">TOEIC & Tiếng Anh</span> thông minh
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hero-subtitle"
          >
            Học từ vựng nhanh gấp 3 lần với phương pháp Flashcard 3D sinh động, 
            trắc nghiệm phản xạ và điền từ thách thức. Theo dõi tiến độ học tập thời gian thực.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hero-ctas"
          >
            <button className="btn-primary-hero" onClick={() => navigate('/register')}>
              Bắt đầu miễn phí <FiArrowRight className="cta-icon" />
            </button>
            <a href="#features" className="btn-secondary-hero">
              Khám phá tính năng
            </a>
          </motion.div>
        </div>

        {/* Floating Showcase Mockup */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="hero-showcase"
        >
          <div className="mockup-window">
            <div className="window-header">
              <div className="window-dots">
                <span className="dot dot-red"></span>
                <span className="dot dot-yellow"></span>
                <span className="dot dot-green"></span>
              </div>
              <div className="window-url">practice-vocabulary-beta.vercel.app</div>
            </div>
            <div className="mockup-content">
              {/* Mock Dashboard UI */}
              <div className="mock-sidebar">
                <div className="mock-logo">🚀 Vocab</div>
                <div className="mock-menu-item active">📈 Dashboard</div>
                <div className="mock-menu-item">📚 Chủ đề</div>
                <div className="mock-menu-item">🏆 Huy hiệu</div>
              </div>
              <div className="mock-main">
                <div className="mock-header">
                  <div className="mock-welcome">Chào mừng trở lại, Learner! 👋</div>
                  <div className="mock-badge">Level 3</div>
                </div>
                <div className="mock-grid">
                  <div className="mock-card card-xp">
                    <div className="card-label">Tổng XP</div>
                    <div className="card-value">1,250 XP</div>
                    <div className="card-sub">+120 XP hôm nay</div>
                  </div>
                  <div className="mock-card card-streak">
                    <div className="card-label">Chuỗi ngày học</div>
                    <div className="card-value">🔥 7 Ngày</div>
                    <div className="card-sub">Giữ vững phong độ!</div>
                  </div>
                  <div className="mock-card card-progress">
                    <div className="card-label">Từ vựng đã học</div>
                    <div className="card-value">148 / 300</div>
                    <div className="mock-progress-bar"><div className="fill" style={{ width: '49%' }}></div></div>
                  </div>
                </div>
                <div className="mock-chart-card">
                  <div className="card-label">Tiến trình học tập gần đây</div>
                  <div className="mock-chart">
                    <div className="bar" style={{ height: '40%' }}></div>
                    <div className="bar" style={{ height: '60%' }}></div>
                    <div className="bar" style={{ height: '55%' }}></div>
                    <div className="bar" style={{ height: '80%' }}></div>
                    <div className="bar active" style={{ height: '95%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Bento Grid Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2 className="section-title">Học sâu nhớ lâu với 3 chế độ học tập</h2>
          <p className="section-subtitle">Phương pháp tương tác đa giác quan được tối ưu hóa cho việc ghi nhớ từ vựng tiếng Anh dài hạn.</p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="bento-grid"
        >
          {/* Card 1: Flashcard 3D */}
          <motion.div variants={itemVariants} className="bento-card card-large card-flashcard">
            <div className="card-badge">Chế độ 1</div>
            <div className="bento-card-content">
              <h3>Flashcard 3D Lật Mặt</h3>
              <p>Học phát âm chuẩn kèm hình ảnh minh họa sinh động. Phân loại từ vựng thành từ đã nhớ và từ cần ôn tập dễ dàng.</p>
              
              {/* Interactive Mock Card */}
              <div className="interactive-demo">
                <div 
                  className={`demo-card ${activeFlipped ? 'flipped' : ''}`}
                  onClick={() => setActiveFlipped(!activeFlipped)}
                >
                  <div className="demo-card-front">
                    <span className="card-emoji">🌇</span>
                    <h4>Perspective</h4>
                    <p className="pronunciation">/pəˈspek.tɪv/</p>
                    <span className="click-hint">Bấm để lật xem nghĩa</span>
                  </div>
                  <div className="demo-card-back">
                    <h4>Góc nhìn, viễn cảnh</h4>
                    <p className="example">"A different perspective on life."</p>
                    <span className="click-hint">Bấm để lật lại</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Quiz */}
          <motion.div variants={itemVariants} className="bento-card card-medium card-quiz">
            <div className="card-badge">Chế độ 2</div>
            <div className="bento-card-icon"><FiCheckCircle /></div>
            <h3>Trắc nghiệm Phản xạ</h3>
            <p>Rèn luyện tư duy phản xạ nhanh thông qua câu hỏi trắc nghiệm đa dạng lựa chọn và âm thanh củng cố.</p>
            <div className="quiz-options-mock">
              <div className="option-mock correct">A. Perspective (Đúng)</div>
              <div className="option-mock">B. Retrospect</div>
              <div className="option-mock">C. Prospect</div>
            </div>
          </motion.div>

          {/* Card 3: Fill Blank */}
          <motion.div variants={itemVariants} className="bento-card card-medium card-fill">
            <div className="card-badge">Chế độ 3</div>
            <div className="bento-card-icon"><FiEdit3 /></div>
            <h3>Gõ từ & Điền vào ô trống</h3>
            <p>Rèn luyện kỹ năng chính tả và nhớ chính xác cách viết của từ. Hệ thống tích hợp gợi ý âm thanh và gợi ý ký tự thông minh.</p>
            <div className="fill-mock-input">
              <span>P</span>
              <span>e</span>
              <span className="blink-cursor">_</span>
              <span>s</span>
              <span>p</span>
              <span>e</span>
              <span>c</span>
              <span>t</span>
              <span>i</span>
              <span>v</span>
              <span>e</span>
            </div>
          </motion.div>

          {/* Card 4: Achievements & Badges */}
          <motion.div variants={itemVariants} className="bento-card card-large card-achievements">
            <div className="card-badge">Động lực học</div>
            <div className="bento-card-content">
              <h3>Phần thưởng & Huy hiệu Danh giá</h3>
              <p>Duy trì ngọn lửa học tập với chuỗi ngày liên tục (Streaks) và mở khóa các bộ sưu tập huy hiệu độc đáo khi đạt được các mốc học tập đáng nhớ.</p>
              
              <div className="badges-showcase-mock">
                <div className="badge-mock-item unlocked">
                  <div className="badge-mock-icon">🔥</div>
                  <span>Chăm Chỉ I</span>
                </div>
                <div className="badge-mock-item unlocked">
                  <div className="badge-mock-icon">🎓</div>
                  <span>Học Giả I</span>
                </div>
                <div className="badge-mock-item unlocked">
                  <div className="badge-mock-icon">🏆</div>
                  <span>Trùm Điền Từ</span>
                </div>
                <div className="badge-mock-item locked">
                  <div className="badge-mock-icon">👑</div>
                  <span>Bậc Thầy</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Methodology Section */}
      <section id="methodology" className="methodology-section">
        <div className="methodology-content">
          <h2>Học hiệu quả hơn với khoa học trí nhớ</h2>
          <div className="methodology-grid">
            <div className="method-item">
              <div className="method-num">01</div>
              <h4>Lặp lại ngắt quãng (SRS)</h4>
              <p>Hệ thống tự động tính toán thời điểm vàng để ôn tập lại từ vựng cũ, đảm bảo kiến thức được lưu vào vùng trí nhớ dài hạn.</p>
            </div>
            <div className="method-item">
              <div className="method-num">02</div>
              <h4>Học đa phương thức</h4>
              <p>Kết hợp giữa thẻ Flashcard trực quan, bài thi Trắc nghiệm phản xạ, gõ từ chính xác cùng phát âm chuẩn bản xứ.</p>
            </div>
            <div className="method-item">
              <div className="method-num">03</div>
              <h4>Thống kê chi tiết</h4>
              <p>Mỗi câu trả lời của bạn đều được phân tích để chỉ ra các từ bạn thường gặp khó khăn, giúp bạn tập trung ôn tập hiệu quả nhất.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="stats-section">
        <div className="stat-box">
          <div className="stat-num">10,000+</div>
          <div className="stat-desc">Từ vựng TOEIC & phổ dụng</div>
        </div>
        <div className="stat-box">
          <div className="stat-num">95%</div>
          <div className="stat-desc">Người học ghi nhớ từ lâu hơn</div>
        </div>
        <div className="stat-box">
          <div className="stat-num">3</div>
          <div className="stat-desc">Chế độ học sâu chuyên biệt</div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Sẵn sàng chinh phục đỉnh cao từ vựng?</h2>
          <p>Tham gia học ngay hôm nay để nhận quyền truy cập vào tất cả các chủ đề từ vựng TOEIC hoàn toàn miễn phí.</p>
          <button className="btn-primary-large" onClick={() => navigate('/register')}>
            Đăng ký học thử ngay <FiArrowRight className="cta-icon" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-logo">
          <span>🚀</span> VocabPractice
        </div>
        <p>© 2026 VocabPractice. Học từ vựng thông minh. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;

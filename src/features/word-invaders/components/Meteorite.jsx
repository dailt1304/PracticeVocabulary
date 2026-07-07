import { motion } from 'framer-motion';

const Meteorite = ({ meteorite }) => {
  const { meaning, maskedWord, x, y, isExploding } = meteorite;

  // Determine danger level based on vertical position
  const isDanger = y > 75;

  return (
    <div
      className="meteorite-wrapper"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        zIndex: isExploding ? 15 : 10,
      }}
    >
      <motion.div
        className={`meteorite ${isDanger ? 'danger' : ''} ${isExploding ? 'exploding' : ''}`}
        initial={isExploding ? { scale: 1, opacity: 1 } : { opacity: 0, scale: 0.5 }}
        animate={isExploding ? { scale: 1.4, opacity: 0 } : { opacity: 1, scale: 1 }}
        transition={isExploding ? { duration: 0.4, ease: 'easeOut' } : { duration: 0.3 }}
      >
        <span className="meteorite-meaning">{meaning}</span>
        <span className="meteorite-word">{maskedWord}</span>
        {isExploding && <div className="explosion-ring" />}
        {isDanger && !isExploding && <div className="danger-pulse" />}
      </motion.div>
    </div>
  );
};

export default Meteorite;

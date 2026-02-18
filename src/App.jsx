import React, { useState } from 'react';
import StarSlider from './components/StarSlider';
import BirthdayExperience from './components/BirthdayExperience';
import SpotifyPlayer from './components/SpotifyPlayer';
import { motion, AnimatePresence } from 'framer-motion';

// Move star generation outside to ensure purity and avoid lint errors
const STATIC_STARS = [...Array(50)].map((_, i) => ({
  id: i,
  size: Math.random() * 3,
  left: Math.random() * 100,
  top: Math.random() * 100,
  duration: 2 + Math.random() * 4
}));

function App() {
  const [stage, setStage] = useState('welcome'); // welcome, birthday
  const [birthYear, setBirthYear] = useState(2007);
  const [isPlaying, setIsPlaying] = useState(false);

  const startBirthday = (year) => {
    setBirthYear(year);
    setStage('birthday');
    setIsPlaying(true);
  };

  const togglePlay = () => setIsPlaying(!isPlaying);



  return (
    <div className="relative min-h-screen text-white overflow-x-hidden">
      {/* Visual background elements */}
      <div className="galaxy-container">
        {/* Latar Belakang Rasi Bintang Pisces */}
        <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center">
          <svg width="800" height="800" viewBox="0 0 100 100" className="w-[80vw] h-[80vw] max-w-[600px] max-h-[600px]">
            <motion.path
              d="M 90 10 L 70 45 L 40 55 L 15 90 M 40 55 L 10 30"
              stroke="white"
              strokeWidth="0.5"
              fill="none"
              strokeDasharray="2 2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            />
            {/* Constellation Stars */}
            {[
              {x: 90, y: 10}, {x: 70, y: 45}, {x: 40, y: 55}, 
              {x: 15, y: 90}, {x: 10, y: 30}
            ].map((p, i) => (
              <motion.circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="0.8"
                fill="white"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
              />
            ))}
          </svg>
        </div>

        {STATIC_STARS.map((star) => (
          <div 
            key={star.id} 
            className="star" 
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              left: `${star.left}%`,
              top: `${star.top}%`,
              '--duration': `${star.duration}s`
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {stage === 'welcome' ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 0.8 }}
          >
            <StarSlider onStart={startBirthday} />
          </motion.div>
        ) : (
          <motion.div
            key="birthday"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <BirthdayExperience birthYear={birthYear} />
          </motion.div>
        )}
      </AnimatePresence>

      {(stage === 'birthday' || isPlaying) && (
        <SpotifyPlayer isPlaying={isPlaying} togglePlay={togglePlay} />
      )}
    </div>
  );
}

export default App;

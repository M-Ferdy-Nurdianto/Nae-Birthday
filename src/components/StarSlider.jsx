import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { Star, Sparkles, Crosshair } from 'lucide-react';

const Crab = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M16 20V15a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2v5" />
    <path d="M20 19v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <path d="M5 8V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v1" />
    <circle cx="12" cy="9" r="2" />
    <path d="M18 11V5a2 2 0 0 0-2-2" />
    <path d="M6 11V5a2 2 0 0 1 2-2" />
  </svg>
);



const getStarVertices = (outerRadius, innerRadius) => {
  const points = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    points.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
  }
  return points;
};

const StarSlider = ({ onStart }) => {
  const [selectedYear, setSelectedYear] = useState(2007);
  const [showOtherYearInput, setShowOtherYearInput] = useState(false);
  const [customYear, setCustomYear] = useState('');
  const containerRef = useRef(null);
  
  // Motion values for the central analog
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  const starConfig = useMemo(() => {
    const v = getStarVertices(140, 60);
    const yearPosMap = {
      2003: v[6], // Bottom Left
      2004: v[8], // Left
      2005: v[0], // Top
      2006: v[2], // Right
      2007: v[4], // Bottom Right
    };
    const starPath = `M ${v[0].x} ${v[0].y} L ${v[4].x} ${v[4].y} L ${v[8].x} ${v[8].y} L ${v[2].x} ${v[2].y} L ${v[6].x} ${v[6].y} Z`;
    return { yearPosMap, starPath, vertices: v };
  }, []);

  const handleDrag = (_, info) => {
    const x = info.offset.x;
    const y = info.offset.y;
    
    // Constrain to circle (Radius 60)
    const distance = Math.sqrt(x * x + y * y);
    const maxRadius = 60;
    
    if (distance > maxRadius) {
      const ratio = maxRadius / distance;
      dragX.set(x * ratio);
      dragY.set(y * ratio);
    } else {
      dragX.set(x);
      dragY.set(y);
    }
    
    // Calculate angle to find nearest vertex
    const angle = Math.atan2(y, x) * (180 / Math.PI);
    
    // Star vertices angles are roughly:
    // Top: -90
    // Right: -18
    // Bottom Right: 54
    // Bottom Left: 126
    // Left: 198 (or -162)
    
    let nearestYear = selectedYear;
    let minDiff = Infinity;

    Object.entries(starConfig.yearPosMap).forEach(([year, pos]) => {
      const vAngle = Math.atan2(pos.y, pos.x) * (180 / Math.PI);
      let diff = Math.abs(angle - vAngle);
      if (diff > 180) diff = 360 - diff;
      
      if (diff < minDiff) {
        minDiff = diff;
        nearestYear = parseInt(year);
      }
    });

    // Only change if dragged far enough from center
    const dist = Math.sqrt(x*x + y*y);
    if (dist > 30) {
      setSelectedYear(nearestYear);
    }
  };

  const handleStart = () => {
    onStart(selectedYear);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden relative select-none">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 text-center mb-6"
      >
        <h1 className="text-5xl font-black mb-1 bg-linear-to-b from-orange-300 via-orange-500 to-orange-800 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(255,140,0,0.5)]">
          BINTANG PISCES
        </h1>
        <p className="text-orange-200/60 tracking-[0.2em] uppercase text-[10px] font-bold">
          "Geser Analog untuk Memilih"
        </p>
      </motion.div>

      <div className="relative w-full max-w-2xl h-[380px] flex items-center justify-center" ref={containerRef}>
        {/* SVG Star Shape */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="-200 -200 400 400">
           <motion.path 
             d={starConfig.starPath}
             fill="rgba(255,140,0,0.05)"
             stroke="rgba(255,140,0,0.2)"
             strokeWidth="2"
             initial={{ pathLength: 0, opacity: 0 }}
             animate={{ pathLength: 1, opacity: 1 }}
             transition={{ duration: 1.5 }}
           />
        </svg>

        {/* Crab Constellation Accents */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 pointer-events-none"
        >
          <div className="absolute top-10 left-10 opacity-20 transform -rotate-12">
            <Crab className="w-8 h-8 text-orange-400" />
          </div>
          <div className="absolute bottom-20 right-10 opacity-20 transform rotate-45">
            <Crab className="w-12 h-12 text-orange-500" />
          </div>
        </motion.div>

        {/* Central Analog Base */}
        <div className="absolute w-32 h-32 rounded-full border-2 border-orange-500/20 bg-orange-500/5 flex items-center justify-center">
           <div className="w-24 h-24 rounded-full border border-orange-500/10 animate-pulse" />
        </div>

        {/* Draggable Handle (Analog) */}
        <motion.div
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.8}
          onDrag={handleDrag}
          style={{ x: dragX, y: dragY }}
          whileDrag={{ scale: 1.1 }}
          className="absolute z-20 w-16 h-16 bg-white rounded-full shadow-[0_0_40px_rgba(255,140,0,0.8)] cursor-grab active:cursor-grabbing flex items-center justify-center text-orange-600 border-4 border-orange-500/20"
        >
          <div className="relative">
             <Crosshair className="w-8 h-8" />
             <div className="absolute inset-0 w-full h-full bg-orange-500/20 blur-xl rounded-full" />
          </div>
        </motion.div>

        {/* Year Stars */}
        {Object.entries(starConfig.yearPosMap).map(([year, pos]) => (
          <motion.div
            key={year}
            style={{ 
              left: `calc(50% + ${pos.x}px)`, 
              top: `calc(50% + ${pos.y}px)` 
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
          >
            <div className={`relative flex flex-col items-center
                ${selectedYear === parseInt(year) ? 'scale-125' : 'scale-100 opacity-40'} transition-all duration-500`}
            >
              <div className={`p-1.5 rounded-full
                ${selectedYear === parseInt(year) 
                  ? 'bg-orange-500 shadow-[0_0_30px_rgba(255,140,0,1)]' 
                  : 'bg-white/10'}`}
              >
                 <Star 
                   className={`w-5 h-5 ${selectedYear === parseInt(year) ? 'text-white' : 'text-orange-400/50'}`} 
                   fill={selectedYear === parseInt(year) ? "white" : "none"}
                 />
              </div>

              <div className={`absolute -top-7 font-black text-sm
                ${selectedYear === parseInt(year) ? 'text-white opacity-100' : 'text-orange-400/20 opacity-0'} transition-opacity`}
              >
                {year}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div 
        className="mt-4 z-10 flex flex-col items-center gap-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex flex-col items-center gap-0.5">
           <span className="text-orange-400/50 text-[8px] tracking-[0.4em] uppercase font-bold">Orbit Terpilih</span>
           <div className="text-5xl font-black text-white drop-shadow-[0_0_10px_rgba(255,140,0,0.8)]">
              {selectedYear}
           </div>
        </div>

        <motion.button
          onClick={handleStart}
          whileHover={{ scale: 1.05, boxShadow: "0 0 60px rgba(255,140,0,0.6)" }}
          whileTap={{ scale: 0.95 }}
          className="bg-white text-orange-600 px-16 py-3 rounded-full text-xl font-black shadow-2xl flex items-center gap-3 group transition-all"
        >
          MULAI
          <Sparkles className="w-5 h-5 animate-pulse" />
        </motion.button>

        <button 
          onClick={() => setShowOtherYearInput(true)}
          className="text-orange-400/50 hover:text-orange-400 text-sm font-bold tracking-widest uppercase transition-colors"
        >
          Bukan Tahun Ini? [Klik Sini]
        </button>
      </motion.div>


      <AnimatePresence>
        {showOtherYearInput && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card p-10 max-w-sm w-full border-orange-500/30 flex flex-col gap-6 text-center"
            >
              <div className="flex justify-center">
                 <Sparkles className="text-orange-400 w-10 h-10 animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold bg-linear-to-b from-orange-300 to-orange-600 bg-clip-text text-transparent">
                Input Tahun Orbit
              </h3>
              <div className="relative">
                <input 
                  type="number"
                  placeholder="Contoh: 1998"
                  value={customYear}
                  onChange={(e) => setCustomYear(e.target.value)}
                  className="w-full bg-white/5 border border-orange-500/30 rounded-xl px-4 py-4 text-center text-3xl font-black text-white focus:outline-none focus:border-orange-500 transition-all"
                  autoFocus
                />
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowOtherYearInput(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={() => {
                    if (customYear && !isNaN(customYear)) {
                      setSelectedYear(parseInt(customYear));
                      setShowOtherYearInput(false);
                    }
                  }}
                  className="flex-1 py-3 rounded-xl bg-linear-to-r from-orange-600 to-orange-400 text-white font-bold"
                >
                  Terapkan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Galaxy Decorations */}
      <div className="fixed inset-0 pointer-events-none">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/5 rounded-full blur-[150px] animate-pulse" />
      </div>
    </div>
  );
};

export default StarSlider;

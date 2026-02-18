import React from 'react';
import { motion } from 'framer-motion';

const BirthdayCake = () => {
  const [isBlown, setIsBlown] = React.useState(false);

  return (
    <div className="relative flex flex-col items-center">
      {/* Increased hit area for easier interaction */}
      <motion.div 
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsBlown(!isBlown)}
        className="relative w-64 h-64 flex items-center justify-center cursor-pointer select-none group"
      >
        {/* Background glow when hovered */}
        <div className="absolute inset-0 bg-orange-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Cake Base */}
        <motion.div 
          initial={{ scale: 0, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
          className="relative"
        >
          {/* Bottom Layer */}
          <div className="w-48 h-24 bg-orange-600 rounded-t-3xl shadow-xl border-b-8 border-orange-800" />
          {/* Top Layer */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-16 bg-orange-400 rounded-t-2xl shadow-lg border-b-6 border-orange-700" />
          
          {/* Candles */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 flex gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="relative flex flex-col items-center">
                {/* Flame */}
                <motion.div 
                  initial={false}
                  animate={{ 
                    scale: isBlown ? 0 : [1, 1.2, 1],
                    opacity: isBlown ? 0 : [0.8, 1, 0.8],
                    rotate: isBlown ? 0 : [0, 5, -5, 0]
                  }}
                  transition={{ 
                    scale: { duration: 0.3 },
                    opacity: { duration: 0.3 },
                    rotate: { duration: 0.5, repeat: isBlown ? 0 : Infinity }
                  }}
                  className="w-4 h-6 bg-yellow-400 rounded-full blur-[2px] shadow-[0_0_15px_rgba(255,255,0,0.8)]"
                />
                {/* Wick/Candle */}
                <div className="w-2 h-8 bg-white rounded-full mt-[-2px]" />
              </div>
            ))}
          </div>

          {/* Drip/Frosting */}
          <div className="absolute top-0 left-0 w-full flex justify-around px-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="w-4 h-8 bg-orange-300/80 rounded-full -mt-2 blur-[1px]" />
            ))}
          </div>
        </motion.div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-4 text-orange-200 font-bold tracking-widest uppercase text-[10px] text-center px-4"
      >
        {isBlown ? (
          <span className="text-orange-400">Lilin sudah mati! ✨ Ketuk untuk nyalakan lagi</span>
        ) : (
          "Ketuk kue untuk tiup lilin ya! 🎂"
        )}
      </motion.div>
    </div>
  );
};

export default BirthdayCake;

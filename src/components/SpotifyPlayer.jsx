import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, AlertCircle } from 'lucide-react';

const SpotifyPlayer = ({ isPlaying, togglePlay }) => {
  const audioRef = useRef(null);
  const [audioError, setAudioError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying && !audioError) {
        audioRef.current.play().catch(e => {
          console.log("Audio play blocked or file missing", e);
          setAudioError(true);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, audioError]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-50">
      {/* Real Audio Element */}
      <audio 
        ref={audioRef} 
        src="/music/Bertemu.mp3" 
        loop 
        onEnded={() => togglePlay(false)}
        onError={() => setAudioError(true)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />

      <div className="max-w-2xl mx-auto glass-card flex flex-col md:flex-row items-center gap-4 px-6 py-4 shadow-2xl border-orange-500/20">
        {/* Simplified Info Section */}
        <div className="flex flex-col items-center md:items-start min-w-[120px]">
          <h4 className="text-xs font-black text-white uppercase tracking-widest">
            {audioError ? 'Audio Error!' : 'Bertemu'}
          </h4>
          <p className="text-[10px] text-orange-500 font-bold uppercase tracking-wider">
            {audioError ? 'File Tidak Ada' : 'Stellaria'}
          </p>
        </div>

        {/* Player Controls & Progress */}
        <div className="flex-1 flex flex-col items-center gap-2 w-full">
          <div className="flex items-center gap-6">
            <SkipBack className="w-4 h-4 text-white/20 cursor-not-allowed" />
            <button 
              onClick={togglePlay}
              disabled={audioError}
              className={`w-10 h-10 bg-white rounded-full flex items-center justify-center transition-transform ${audioError ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-90'}`}
            >
              {isPlaying && !audioError ? (
                <Pause className="w-5 h-5 text-black fill-black" />
              ) : (
                <Play className="w-5 h-5 text-black fill-black ml-1" />
              )}
            </button>
            <SkipForward className="w-4 h-4 text-white/20 cursor-not-allowed" />
          </div>
          
          <div className="flex items-center gap-3 w-full">
             <span className="text-[9px] tabular-nums text-white/30 font-bold">{formatTime(currentTime)}</span>
             <div className="flex-1 h-1 bg-white/10 rounded-full relative overflow-hidden">
                <motion.div 
                  initial={false}
                  animate={{ width: `${progress}%` }}
                  className="absolute top-0 left-0 h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]"
                />
             </div>
             <span className="text-[9px] tabular-nums text-white/30 font-bold">{formatTime(duration)}</span>
          </div>
        </div>

        {audioError && (
          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 rounded-full">
            <AlertCircle className="w-3 h-3 text-red-500" />
            <span className="text-[8px] text-red-500 font-black uppercase">Troubleshoot Audio</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpotifyPlayer;

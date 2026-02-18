import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Star, Camera, RefreshCw, X } from 'lucide-react';
import BirthdayCake from './BirthdayCake';

// Stable random-like configs for stickers
const STICKER_CONFIGS = [...Array(100)].map((_, i) => ({
  scale: 1.0 + (i % 5) * 0.1,
  rotation: (i % 40) - 20
}));

const STAR_POSITIONS = [...Array(40)].map((_, i) => ({
  left: `${(i * 13) % 100}%`,
  top: `${(i * 17) % 100}%`,
  size: 1 + (i % 3),
  duration: 3 + (i % 4)
}));

const CRAB_STARDUST = [...Array(10)].map((_, i) => ({
  left: `${(i * 27) % 100}%`,
  top: `${(i * 31) % 100}%`,
  duration: 20 + i * 2,
  size: 15 + (i % 5) * 5
}));

// Robust Photo Scrambling Logic
const SHUFFLED_MEMORIES = (() => {
  const ids = [...Array(12)].map((_, i) => i + 1);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.map((id, i) => ({
    id: id,
    filename: `nae-${id}.webp`,
    rotation: (i % 2 === 0 ? -3 : 3) + (Math.random() * 2 - 1),
  }));
})();

const PHOTO_SLOTS = (() => {
  const slots = [];
  for (let i = 0; i < 6; i++) {
    slots.push([SHUFFLED_MEMORIES[i * 2], SHUFFLED_MEMORIES[i * 2 + 1]]);
  }
  // Scramble the slots order too
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  return slots;
})();

const BirthdayExperience = ({ birthYear }) => {
  const [stickers, setStickers] = React.useState([]);
  const [selectedSticker, setSelectedSticker] = React.useState('🦀');
  const [focusedPhoto, setFocusedPhoto] = React.useState(null);
  const [polaroidText, setPolaroidText] = React.useState('');
  const [cameraActive, setCameraActive] = React.useState(false);
  const [capturedImage, setCapturedImage] = React.useState(null);
  const [cameraError, setCameraError] = React.useState(null);
  const [showSecurityToast, setShowSecurityToast] = React.useState(false);
  const [stream, setStream] = React.useState(null);
  const [slotIndices, setSlotIndices] = React.useState([0, 0, 0, 0, 0, 0]);
  const polaroidRef = React.useRef(null);
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);

  // Auto-cycling logic for the slots: Sequential 1-by-1 from left
  useEffect(() => {
    let currentSlot = 0;
    const intervalId = setInterval(() => {
      setSlotIndices(prev => {
        const next = [...prev];
        next[currentSlot] = next[currentSlot] === 0 ? 1 : 0;
        return next;
      });
      currentSlot = (currentSlot + 1) % PHOTO_SLOTS.length;
    }, 1000); // Cycle one slot every second

    return () => clearInterval(intervalId);
  }, []);

  // Auto-cleanup camera stream on unmount or tab close
  useEffect(() => {
    const handleUnload = () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload();
    };
  }, [stream]);
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;

  const startCamera = async () => {
    setCameraError(null);
    setShowSecurityToast(true);
  };

  const confirmCamera = async () => {
    setShowSecurityToast(false);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 640 } 
      });
      setStream(mediaStream);
      setCameraActive(true);
    } catch (err) {
      console.error("Camera access denied:", err);
      setCameraError("Akses kamera ditolak. Pastikan browser memberi izin.");
    }
  };

  // Attach stream to video element when active
  useEffect(() => {
    if (cameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [cameraActive, stream]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const downloadPolaroid = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Higher res for quality download
    canvas.width = 1200;
    canvas.height = 1500;
    
    // Background (White Polaroid Frame)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Photo dimensions & offset
    const margin = 80;
    const photoWidth = canvas.width - (margin * 2);
    const photoHeight = 1100;
    
    // Helper to draw image
    const drawPhoto = (img) => {
      const scale = Math.max(photoWidth / img.width, photoHeight / img.height);
      const x = (photoWidth / 2) - (img.width / 2) * scale;
      const y = (photoHeight / 2) - (img.height / 2) * scale;
      
      ctx.save();
      ctx.beginPath();
      ctx.rect(margin, margin, photoWidth, photoHeight);
      ctx.clip();
      ctx.drawImage(img, margin + x, margin + y, img.width * scale, img.height * scale);
      ctx.restore();
    };

    try {
      // Get the current image source
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      if (focusedPhoto === 'CAMERA') {
        img.src = capturedImage;
      } else {
        img.src = `/photos/nae-${focusedPhoto}.webp`;
      }

      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = () => {
          // Fallback if local image fails
          img.src = `https://placehold.co/600x800/222/ffa500?text=NAE_${focusedPhoto}`;
          img.onload = resolve;
        };
      });

      drawPhoto(img);

      // Draw Stickers
      ctx.save();
      ctx.font = '100px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const currentStickers = stickers.filter(s => s.photoId === focusedPhoto);
      currentStickers.forEach(s => {
        // UI dimensions were 280x340. Map x,y to the canvas scale.
        const scaleX = photoWidth / 280;
        const scaleY = photoHeight / 340;
        
        ctx.save();
        ctx.translate(margin + (s.x * scaleX), margin + (s.y * scaleY));
        ctx.rotate((s.rotation * Math.PI) / 180);
        ctx.scale(s.scale * 1.5, s.scale * 1.5); // Slightly larger on download
        ctx.fillText(s.emoji, 0, 0);
        ctx.restore();
      });
      ctx.restore();

      // Draw Typography (Handwritten)
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 80px "Permanent Marker", cursive, sans-serif';
      ctx.textAlign = 'center';
      
      const text = polaroidText || "Happy Birthday Nae! ✨";
      ctx.fillText(text, canvas.width / 2, 1350);

      // Download trigger
      const link = document.createElement('a');
      link.download = `Polariod_Nae_${Date.now()}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();

      // Confetti effect
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });

    } catch (err) {
      console.error("Download failed:", err);
      alert("Gagal mengunduh foto. Silakan coba lagi.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      const data = canvasRef.current.toDataURL('image/jpeg');
      setCapturedImage(data);
      setFocusedPhoto('CAMERA'); // Special ID for camera shots
      stopCamera();
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ffffff', '#ffa500']
      });
    }
  };

  const handleFocusPhoto = (id) => {
    setFocusedPhoto(id);
    setTimeout(() => {
      polaroidRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Constellation Drift Logic is handled via framer-motion props in the JSX below
  // This keeps the component pure and performant.

  const addSticker = (e) => {
    if (!focusedPhoto) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const config = STICKER_CONFIGS[stickers.length % 100];
    const newSticker = {
      id: Date.now(),
      photoId: focusedPhoto,
      x,
      y,
      emoji: selectedSticker,
      scale: config.scale,
      rotation: config.rotation
    };
    setStickers([...stickers, newSticker]);
    
    confetti({
      particleCount: 20,
      spread: 60,
      origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
      colors: ['#ff8c00', '#ffd700', '#ff69b4'],
    });
  };

  useEffect(() => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  // No more auto-scroll logic, we will use CSS/Motion for the carousel loop


  return (
    <div className="min-h-screen pt-20 pb-40 px-6 flex flex-col items-center relative overflow-hidden">
      {/* Huge Background Typography */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center z-10 mb-8 flex flex-col items-center"
      >
        <div className="text-3xl md:text-5xl font-black text-orange-400 tracking-tighter flex overflow-hidden">
          {"HAPPY BIRTHDAY".split("").map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.2 }}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </div>
      </motion.div>

      {/* Main Celebration Card: Premium Glassmorphism */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="w-full max-w-2xl z-10"
      >
        <div className="glass-card p-1 items-center justify-center flex flex-col relative group">
           {/* Inner Border Animation Effect */}
           <div className="absolute inset-0 rounded-3xl border border-white/10 group-hover:border-orange-500/30 transition-colors duration-500" />
           
           <div className="w-full p-10 md:p-16 flex flex-col items-center text-center gap-8">
              {/* Simplified Heading */}
              <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
                HBD NAE KE-<span className="text-orange-500 drop-shadow-[0_0_10px_rgba(255,140,0,0.5)]">{age}</span>
              </h3>

              {/* Minimalist Message */}
              <div className="max-w-md w-full h-px bg-white/10" />
              
              <div className="space-y-8 text-left md:text-center">
                <p className="text-xl md:text-2xl font-bold leading-relaxed">
                  Wish-nya semoga makin keren di Stellaria <br className="hidden md:block"/>
                  & cosplay-nya makin ajib. ✨
                </p>

                <p className="text-lg text-white/80 leading-relaxed italic">
                  "Salut banget sama Nae, bisa tetap maksimal pas ngidol dan cosplay padahal di RL lagi sibuk-sibuknya. Jaga kesehatan ya, Naweee! Keep strong and stay pretty!"
                </p>

                <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-2xl">
                  <p className="text-sm text-orange-200">
                    Btw maaf banget aku kelupaan ikut PO cheki birthday kemarin 😭 nyesel parah huhu. Next time pasti gercep deh!
                  </p>
                </div>

              </div>

              {/* Birthday Cake Integration */}
              <div className="mt-4 scale-75 md:scale-90">
                 <BirthdayCake />
              </div>
           </div>
        </div>
      </motion.div>

      {/* Cosmic 3x3 Album Grid Section */}
      <div className="mt-40 w-full relative min-h-[700px] flex items-center justify-center overflow-hidden">
        {/* Deep Nebula Background Layer (Crab Stardust moved here) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-orange-500/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full" />
          
          {STAR_POSITIONS.map((pos, i) => (
            <motion.div
              key={i}
              className="absolute bg-white rounded-full"
              animate={{ opacity: [0.1, 0.4, 0.1], scale: [1, 1.3, 1] }}
              transition={{ duration: pos.duration, repeat: Infinity, delay: i * 0.1 }}
              style={{ left: pos.left, top: pos.top, width: pos.size, height: pos.size }}
            />
          ))}

          {CRAB_STARDUST.map((pos, i) => (
            <motion.div
              key={`crab-${i}`}
              className="absolute pointer-events-none opacity-10 select-none grayscale contrast-200"
              animate={{ x: [0, 100, 0], y: [0, -50, 0], rotate: [0, 360] }}
              transition={{ duration: pos.duration, repeat: Infinity, ease: "linear" }}
              style={{ left: pos.left, top: pos.top, fontSize: pos.size }}
            >
              🦀
            </motion.div>
          ))}
        </div>

        {/* Auto-Panning Album Grid */}
        <div className="relative z-10 w-full flex flex-col items-center">
            <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             className="text-center mb-16"
           >
             <h4 className="text-5xl font-black italic tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,140,0,0.4)]">
                <span className="text-orange-500">ALBUM</span> NAE 📖
             </h4>
             <p className="text-orange-200/40 text-[10px] font-bold uppercase tracking-[0.6em] mt-3">
                Cosmic Memory Repository
             </p>
           </motion.div>

           <div className="w-full max-w-5xl px-4 perspective-[2000px] overflow-visible">
             <motion.div 
                animate={{ 
                  rotateX: [1, -1, 1],
                  rotateY: [-1, 1, -1]
                }}
                transition={{ 
                  duration: 15, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
                className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-16 p-4 md:p-12 overflow-visible"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {PHOTO_SLOTS.map((slot, i) => {
                  const currentPhoto = slot[slotIndices[i]];
                  return (
                    <motion.div
                      key={`slot-${i}`}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      animate={{
                        y: [0, -10 - (i % 3) * 5, 0],
                        rotateZ: [(i % 2 === 0 ? -3 : 3), (i % 2 === 0 ? -2 : 4), (i % 2 === 0 ? -4 : 2), (i % 2 === 0 ? -3 : 3)]
                      }}
                      whileHover={{ 
                        scale: 1.1, 
                        z: 100,
                        rotateZ: 0,
                        transition: { duration: 0.3 }
                      }}
                      onClick={() => handleFocusPhoto(currentPhoto.id)}
                      className="cursor-pointer relative transform-style-3d group"
                    >
                      {/* Physical depth & Ambient Glow */}
                      <div className="absolute inset-4 bg-orange-500/5 blur-2xl rounded-full opacity-40 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-2 bg-black/60 blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
                      
                      <div className="bg-[#fdfbf7] p-2 pb-8 shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative transition-all duration-500 border border-white/10 overflow-hidden">
                        {/* Subtle Paper Texture Overlay */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] z-30" />
                        
                        <div className="aspect-square bg-gray-200 relative shadow-inner overflow-hidden">
                          <AnimatePresence mode="wait">
                            <motion.img 
                              key={currentPhoto.id}
                              initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                              exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
                              transition={{ duration: 0.8, ease: "easeInOut" }}
                              src={`/photos/${currentPhoto.filename}`} 
                              alt="Memo" 
                              className="w-full h-full object-cover contrast-[1.05] brightness-[1.02]"
                              onError={(e) => {
                                e.target.src = `https://placehold.co/400x500/222/ffa500?text=NAE_${currentPhoto.id}`;
                              }}
                            />
                          </AnimatePresence>
                          {/* Subtle inner shadow for the photo area */}
                          <div className="absolute inset-0 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] pointer-events-none z-20" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
             </motion.div>
           </div>
        </div>
      </div>

        {/* Bottom Fade Gradient for continuity */}
        <div className="absolute bottom-0 inset-x-0 h-40 bg-linear-to-t from-black to-transparent z-20 pointer-events-none" />

      {/* Polaroid Studio Section (The Printer) */}
      <div 
        ref={polaroidRef}
        className="w-full max-w-4xl mt-40 z-20 px-4 scroll-mt-20"
      >
        <div className="text-center mb-12">
           <h4 className="text-4xl font-black italic tracking-tighter text-white">
              <span className="text-orange-500">FOTO</span> POLAROID 🦀
           </h4>
           <p className="text-orange-200/40 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">
              Pilih foto di atas & cetak cheki custom-mu
           </p>
        </div>

        <div className="glass-card p-6 md:p-12 border-2 border-white/5 bg-black/40 relative overflow-hidden">
           {/* Crab Mascot Decoration */}
           <motion.div 
             animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
             transition={{ duration: 4, repeat: Infinity }}
             className="absolute -top-6 -right-6 text-6xl opacity-20 pointer-events-none"
           >
             🦀
           </motion.div>

           {/* Security & Privacy Notice */}
           {!cameraActive && !capturedImage && (
              <div className="absolute top-4 left-6 flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <p className="text-[10px] text-white font-bold uppercase tracking-widest leading-none">
                     Koneksi: Aman & Privat. Akses kamera hanya lokal.
                  </p>
              </div>
           )}

           {(!focusedPhoto && !cameraActive) ? (
             <div className="h-[500px] flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl gap-8 group">
                <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center animate-bounce group-hover:bg-orange-500/20 transition-all">
                   <Star className="text-orange-500 w-10 h-10" />
                </div>
                <div className="text-center space-y-2">
                   <p className="text-white font-bold uppercase tracking-widest text-sm">
                      Belum ada foto yang dipilih...
                   </p>
                   <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold">
                      Pilih memori di atas atau ambil foto baru
                   </p>
                </div>
                
                <button 
                  onClick={startCamera}
                  className="px-10 py-4 bg-orange-500 text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_10px_30px_rgba(249,115,22,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                >
                  Buka Kamera 📸
                </button>
             </div>
           ) : (
             <div className="flex flex-col md:flex-row gap-12 items-center md:items-start">
               {/* The Polaroid Frame */}
                <motion.div 
                  initial={{ y: 50, opacity: 0, rotate: -5 }}
                  animate={{ y: 0, opacity: 1, rotate: 2 }}
                  key={focusedPhoto || 'camera-frame'}
                  className="shrink-0 bg-[#fdfbf7] p-4 pb-12 shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative transform hover:rotate-0 transition-all duration-500 border border-white/10"
                >
                  {/* Paper Texture */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
                  
                  {/* Subtle Ambient Glow */}
                  <div className="absolute -inset-10 bg-orange-500/10 blur-3xl opacity-30 pointer-events-none" />
                  
                  <div className="relative w-[280px] h-[340px] bg-gray-900 overflow-hidden mb-8 group shadow-inner">
                    {cameraActive ? (
                       <video 
                         ref={videoRef} 
                         autoPlay 
                         playsInline 
                         className="w-full h-full object-cover"
                         style={{ transform: 'scaleX(-1)' }} // Mirror effect
                       />
                    ) : (focusedPhoto === 'CAMERA' && capturedImage) ? (
                       <img 
                         src={capturedImage} 
                         alt="Captured" 
                         className="w-full h-full object-cover"
                       />
                    ) : focusedPhoto !== 'CAMERA' ? (
                       <img 
                         src={`/photos/nae-${focusedPhoto}.webp`} 
                         alt="Polaroid" 
                         className="w-full h-full object-cover"
                         onError={(e) => {
                           e.target.src = `https://placehold.co/600x800/222/ffa500?text=NAE_${focusedPhoto}`;
                         }}
                       />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-950 text-white/20 gap-4">
                          <div className="relative">
                             <Camera className="w-12 h-12 animate-pulse" />
                             <motion.div 
                               animate={{ rotate: 360 }}
                               transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                               className="absolute -inset-2 border-2 border-dashed border-orange-500/20 rounded-full"
                             />
                          </div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-center px-4">Menginisialisasi Kamera...</p>
                        </div>
                     )}
                   
                    {/* Capture Flash Overlay */}
                    {cameraActive && (
                       <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-2 z-50">
                          <button 
                            onClick={capturePhoto}
                            className="w-16 h-16 rounded-full border-4 border-white bg-white/20 backdrop-blur-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,140,0,0.5)]"
                          >
                             <div className="w-12 h-12 rounded-full bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,1)] flex items-center justify-center">
                               <Camera className="text-black w-6 h-6" />
                             </div>
                          </button>
                          <p className="text-[10px] text-white font-black uppercase tracking-widest drop-shadow-md">
                            Klik untuk jepret 📸
                          </p>
                       </div>
                    )}

                   {/* Applied Stickers on Polaroid */}
                   {stickers.filter(s => s.photoId === focusedPhoto).map(sticker => (
                    <motion.div
                      key={sticker.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: sticker.scale, rotate: sticker.rotation }}
                      style={{ left: sticker.x, top: sticker.y }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 text-3xl pointer-events-none drop-shadow-md"
                    >
                      {sticker.emoji}
                    </motion.div>
                  ))}

                   {!cameraActive && (
                     <div 
                        onClick={addSticker}
                        className="absolute inset-0 cursor-crosshair"
                     />
                   )}
                   
                   <canvas ref={canvasRef} className="hidden" />
                 </div>
                 
                 {/* Handwritten Caption Area */}
                <div className="px-2 min-h-[80px] flex items-center justify-center">
                  <p className="text-black font-['Permanent_Marker',cursive] text-xl md:text-2xl text-center leading-tight wrap-break-word max-w-[240px]">
                    {polaroidText || "Selamat Ulang Tahun Nae! ✨"}
                  </p>
                </div>
                 
                 <div className="absolute bottom-2 right-4 opacity-5">
                    <Star className="text-black w-8 h-8 fill-current" />
                 </div>
               </motion.div>

               {/* Design Controls */}
               <div className="flex-1 space-y-8 w-full">
                  <div className="space-y-4">
                    <h5 className="text-xl font-black text-white italic">TULIS PESAN ✍️</h5>
                   <input 
                     type="text" 
                     value={polaroidText}
                     onChange={(e) => setPolaroidText(e.target.value)}
                     placeholder="Tulis pesanmu di sini..."
                     className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 transition-all font-bold"
                     maxLength={30}
                   />
                   <p className="text-[10px] text-white/30 uppercase tracking-widest pl-2">Maksimal 30 karakter</p>
                 </div>

                  <div className="space-y-4">
                    <h5 className="text-xl font-black text-white italic">HIAS DENGAN STIKER ✨</h5>
                   <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                      {['🦀', '🎂', '🎁', '🎈', '🧡', '✨', '⭐', '💫', '🧁', '🍰', '🍭', '💖'].map(emoji => (
                       <button
                         key={emoji}
                         onClick={() => setSelectedSticker(emoji)}
                         className={`h-12 flex items-center justify-center text-2xl rounded-xl transition-all border ${selectedSticker === emoji ? 'bg-orange-500 border-white scale-110 shadow-[0_0_15px_rgba(249,115,22,0.5)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                       >
                         {emoji}
                       </button>
                     ))}
                   </div>
                   <p className="text-[10px] text-orange-400/60 font-bold animate-pulse uppercase tracking-[0.2em]">
                      Klik di foto untuk menempel stiker!
                   </p>
                 </div>

                 <div className="flex flex-col gap-4 pt-4 border-t border-white/5">
                   {cameraError && (
                      <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider text-center">{cameraError}</p>
                   )}
                   
                   <div className="flex gap-4">
                     {!cameraActive ? (
                       <button 
                         onClick={startCamera}
                         className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest text-orange-400 hover:bg-orange-500/10 transition-all flex items-center justify-center gap-2"
                       >
                         Buka Kamera 📸
                       </button>
                     ) : (
                       <button 
                         onClick={stopCamera}
                         className="flex-1 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl font-black text-xs uppercase tracking-widest text-red-500 hover:bg-red-500/20 transition-all"
                       >
                         Batal Kamera
                       </button>
                     )}

                      <button 
                        onClick={() => setStickers(stickers.filter(s => s.photoId !== focusedPhoto))}
                        className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white/50 hover:bg-red-500/20 hover:text-white transition-all"
                      >
                        Reset Hiasan
                      </button>
                   </div>

                    <button 
                      onClick={downloadPolaroid}
                      className="w-full py-4 bg-orange-500 text-black rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_10px_30px_rgba(249,115,22,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Download Cheki 📸
                    </button>
                 </div>
               </div>
             </div>
           )}
        </div>
      </div>

      {/* Camera Security Toast Overlay */}
      {showSecurityToast && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="fixed inset-0 z-200 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
        >
          <div className="bg-black/90 backdrop-blur-2xl border-2 border-orange-500/50 p-8 rounded-4xl max-w-sm w-full shadow-[0_0_100px_rgba(249,115,22,0.4)] relative">
            {/* Close Button */}
            <button 
              onClick={() => setShowSecurityToast(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-all text-xl"
            >
              ×
            </button>

            <div className="flex flex-col items-center text-center gap-6">
               <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center text-4xl border border-orange-500/30 animate-pulse">
                  🛡️
               </div>
               
               <div className="space-y-2">
                  <h6 className="text-2xl font-black text-white italic uppercase tracking-tighter">KEAMANAN_PRIVASI.V1</h6>
                  <p className="text-orange-400 text-[10px] uppercase font-bold tracking-[0.3em]">Hanya Pengambilan Lokal</p>
               </div>

                 <p className="text-white/80 text-sm leading-relaxed">
                  Kami sangat menjaga privasi Anda. Akses kamera digunakan **hanya** untuk mengambil foto Polaroid secara lokal. <br/><br/>
                  <span className="text-orange-400 font-bold italic">"Akses hardware otomatis terputus dan mati total saat Anda menutup web ini."</span> 🛡️
                </p>

                <div className="w-full flex flex-col gap-3">
                   <button 
                     onClick={confirmCamera}
                     className="w-full py-4 bg-orange-500 text-black rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_10px_30px_rgba(249,115,22,0.4)] hover:scale-[1.03] active:scale-95 transition-all"
                   >
                     IZINKAN & LANJUTKAN 🚀
                   </button>
                   <button 
                     onClick={() => setShowSecurityToast(false)}
                     className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-all underline underline-offset-4 decoration-orange-500/20"
                   >
                      Nanti Saja
                   </button>
                </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default BirthdayExperience;

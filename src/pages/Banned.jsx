import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldOff, Mail, ArrowRight, Sparkles, Network } from 'lucide-react';
import { motion } from 'framer-motion';

const Banned = () => {
  const { logout } = useAuth();
  const [userIp, setUserIp] = useState('Loading...');


  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(response => response.json())
      .then(data => setUserIp(data.ip))
      .catch(error => {
        console.error('Error fetching IP:', error);
        setUserIp('Unable to retrieve');
      });
  }, []);


  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
        type: 'spring',
        stiffness: 80
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  const glitchAnimation = {
    x: [0, -2, 2, -1, 1, 0],
    y: [0, 1, -1, 2, -2, 0],
    transition: {
      duration: 0.4,
      repeat: Infinity,
      repeatDelay: 3.5, 
      ease: "linear"
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050509] p-4 relative overflow-hidden font-sans selection:bg-red-500/30">
      
 
      <div className="absolute inset-0 opacity-[0.03]" style={{ 
        backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />


      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-red-900/20 blur-[150px] rounded-full animate-pulse-slow" />
      <div className="relative w-[95vw] max-w-[600px] aspect-square flex items-center justify-center">
        
   
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-dashed border-red-500/20 shadow-[0_0_30px_rgba(220,38,38,0.1)]"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 sm:inset-4 rounded-full border border-red-800/30 border-t-red-500/60 border-l-red-500/30"
        />


        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="absolute inset-5 sm:inset-8 bg-[#0a0a12]/85 backdrop-blur-2xl rounded-full border border-red-950/80 shadow-2xl shadow-black flex flex-col items-center justify-center p-6 sm:p-12 text-center overflow-hidden"
        >
  
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.08)_0%,transparent_60%)] pointer-events-none" />
          <div className="relative z-10 w-full max-w-[320px] flex flex-col items-center">
            
          
            <motion.div variants={itemVariants} className="relative mb-6 sm:mb-8">
              <motion.div
                animate={glitchAnimation}
                className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-red-600 via-red-700 to-black rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(220,38,38,0.4)] border border-red-500/40 relative z-10"
              >
                <ShieldOff size={40} className="text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.5)] sm:w-[48px] sm:h-[48px]" />
                <div className="absolute -top-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-400/50 border-2 border-[#0a0a12]">
                  <Sparkles size={14} color="white" className="sm:w-[16px] sm:h-[16px]" />
                </div>
              </motion.div>
            </motion.div>

          
            <motion.h1
              variants={itemVariants}
              className="text-3xl sm:text-4xl font-black bg-gradient-to-b from-white via-red-200 to-red-600 bg-clip-text text-transparent mb-3 tracking-tighter uppercase"
            >
              Account Banned
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xs sm:text-sm text-slate-300/80 leading-relaxed mb-6 font-light px-4"
            >
              System security protocols have restricted this account. 
              Immediate action is required to review your status.
            </motion.p>

            <motion.div 
              variants={itemVariants}
              className="bg-black/50 rounded-lg px-4 py-2 border border-red-950 inline-flex items-center gap-2 mb-6 sm:mb-8 shadow-inner"
            >
              <Network size={14} className="text-red-500/80" />
              <span className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest">Sys IP:</span>
              <span className="text-xs sm:text-sm text-red-300 font-mono font-bold tracking-wider bg-red-950/60 px-2 py-0.5 rounded">
                {userIp}
              </span>
            </motion.div>
            

            <motion.div variants={itemVariants} className="flex flex-col w-full gap-3 px-2 sm:px-0">
            
              <a
                href="https://talk.visualcodepo.my.id"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 rounded-xl p-3 sm:p-4 flex items-center justify-between group transition-all duration-300"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-600 to-orange-700 rounded-lg flex items-center justify-center shadow-md">
                    <Mail size={16} color="white" className="sm:w-[20px] sm:h-[20px]" />
                  </div>
                  <div className="text-left">
                    <div className="text-[9px] sm:text-[11px] text-slate-400 uppercase tracking-widest font-semibold mb-0.5">
                      Appeal Restriction
                    </div>
                    <div className="text-xs sm:text-sm text-white group-hover:text-red-300 transition-colors font-mono tracking-tight">
                      talk.visualcodepo.my.id
                    </div>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-600 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
              </a>

             
              <button
                onClick={logout}
                className="w-full py-3 sm:py-4 bg-transparent border border-white/5 hover:border-white/10 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white text-xs sm:text-sm font-bold tracking-widest uppercase cursor-pointer flex justify-center items-center gap-2 transition-all duration-300"
              >
                Sign Out
                <ArrowRight size={14} />
              </button>
            </motion.div>

          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1) translate(-50%, -50%); opacity: 0.8; }
          50% { transform: scale(1.1) translate(-45%, -45%); opacity: 0.5; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
          transform-origin: top left;
        }
      `}</style>
    </div>
  );
};

export default Banned;
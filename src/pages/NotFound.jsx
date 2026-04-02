import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, ArrowLeft, Wifi, Zap, Target, 
  Cpu, RefreshCw, Terminal, Lock, Globe 
} from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info'); // info, game, speed
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [isTesting, setIsTesting] = useState(false);

 
 const startSpeedTest = () => {
  setIsTesting(true);
  setSpeed(0);
  const finalTarget = Math.floor(Math.random() * (950 - 100 + 1)) + 100;
  
  let current = 0;
  
  const interval = setInterval(() => {
    const acceleration = Math.random() * 25; 
    const fluctuation = (Math.random() - 0.5) * 5; 
    
    current += acceleration + fluctuation;
    if (current >= finalTarget) {
      const finalResult = (finalTarget + Math.random()).toFixed(1);
      setSpeed(parseFloat(finalResult));
      setIsTesting(false);
      clearInterval(interval);
    } else {
      setSpeed(current < 0 ? 0 : current);
    }
  }, 40); 
};

  return (
    <div className="min-h-[100dvh] bg-[#020205] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-rose-500/30">

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.08)_0%,transparent_50%)]" />
        <div className="absolute -top-[20%] -right-[10%] w-[50vw] h-[50vw] bg-rose-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[50vw] h-[50vw] bg-indigo-500/5 blur-[120px] rounded-full" />

        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      </div>

      <div className="z-20 mb-8 bg-white/5 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl flex gap-2">
        {[
          { id: 'info', icon: Terminal, label: 'Error Logs' },
          { id: 'game', icon: Target, label: 'Data Breach' },
          { id: 'speed', icon: Wifi, label: 'Network Probe' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <tab.icon size={14} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="w-full max-w-lg relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'info' && (
            <motion.div key="info" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center">
              <div className="relative inline-block mb-6">
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 bg-rose-500/20 blur-3xl rounded-full" />
                <div className="w-24 h-24 bg-[#0a0a0f] border border-rose-500/30 rounded-[32px] flex items-center justify-center relative z-10 shadow-2xl">
                  <ShieldAlert size={48} className="text-rose-500" />
                </div>
              </div>
              <h1 className="text-8xl font-black text-white mb-2 tracking-tighter italic drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">404</h1>
              <div className="bg-[#0a0a0f]/60 backdrop-blur-2xl border border-white/5 p-6 rounded-[28px] mb-8 shadow-2xl relative overflow-hidden text-left">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" />
                <p className="text-rose-400 font-mono text-[9px] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" /> Connection Interrupted
                </p>
                <p className="text-slate-400 text-[13px] leading-relaxed font-medium">
                  Sistem <span className="text-indigo-400 font-bold">ChatSSLock Hanz</span> gagal memvalidasi alamat rute. Node ini mungkin telah dihancurkan (Purged) atau protokol URL tidak valid atau ilegal.
                </p>
              </div>
            </motion.div>
          )}


          {activeTab === 'game' && (
            <motion.div key="game" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center bg-[#0a0a0f]/80 p-8 rounded-[40px] border border-white/10 shadow-2xl">
              <h3 className="text-white font-black uppercase tracking-widest text-xs mb-8 flex items-center justify-center gap-2">
                <Zap size={14} className="text-yellow-400" /> Decrypt Data Packets
              </h3>
              <div className="flex flex-col items-center gap-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setScore(s => s + 1)}
                  className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.4)] relative border-4 border-white/10 group"
                >
                  <Lock size={40} className="text-white group-active:scale-125 transition-transform" />
                  <motion.div className="absolute -inset-4 border border-indigo-500/30 rounded-full" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} />
                </motion.button>
                <div className="space-y-1">
                  <div className="text-4xl font-black text-white font-mono">{score}</div>
                  <div className="text-[9px] text-indigo-400 uppercase font-black tracking-widest">Encrypted Nodes Breached</div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'speed' && (
            <motion.div key="speed" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="bg-[#0a0a0f]/80 p-8 rounded-[40px] border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-10">
                  <div className="text-left">
                    <h3 className="text-white font-black uppercase text-xs tracking-widest">Network Probe</h3>
                    <p className="text-[9px] text-slate-500 font-mono">Location: Secure Relay Node</p>
                  </div>
                  <Wifi className={isTesting ? 'text-emerald-400 animate-pulse' : 'text-slate-600'} />
                </div>
                
                <div className="flex flex-col items-center gap-6">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                      <motion.circle 
                        cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" 
                        strokeDasharray="440" 
                        animate={{ strokeDashoffset: 440 - (speed / 1000) * 440 }}
                        className="text-indigo-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]" 
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-white font-mono">{speed.toFixed(1)}</span>
                      <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Mbps</span>
                    </div>
                  </div>

                  <button 
                    onClick={startSpeedTest}
                    disabled={isTesting}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isTesting ? 'Scanning Network...' : 'Start Probe'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 items-center justify-center">
          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-[0_10px_30px_rgba(79,70,229,0.3)] group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Re-initialize System
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto p-4 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white rounded-2xl transition-all"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="absolute bottom-6 left-0 w-full px-6 flex justify-between items-center opacity-30 pointer-events-none">
        <div className="flex items-center gap-2">
           <Cpu size={12} className="text-indigo-400" />
           <p className="font-mono text-[8px] text-white uppercase tracking-[0.3em]">Core.v2.404.Protocol</p>
        </div>
        <p className="font-mono text-[8px] text-white uppercase tracking-[0.5em] hidden sm:block">Visualcodepo Architecture</p>
      </div>

      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%] z-50" />
    </div>
  );
};

export default NotFound;
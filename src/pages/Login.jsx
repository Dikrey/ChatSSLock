import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  MessageCircle,
  Sparkles,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Cpu,
  Wifi,
  BatteryCharging,
  Clock,
  TerminalSquare,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Login = () => {

  const [uniqueId, setUniqueId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!uniqueId || !password) {
      setError("Please enter your ID and password");
      setLoading(false);
      return;
    }

    const result = await login(uniqueId, password);

    if (result.success) {
      navigate("/");
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const [time, setTime] = useState("");
  const [battery, setBattery] = useState("100%");
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then((batt) => {
        const updateBattery = () => setBattery(`${Math.round(batt.level * 100)}%`);
        updateBattery();
        batt.addEventListener('levelchange', updateBattery);
      });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030305] p-4 relative overflow-hidden font-sans selection:bg-indigo-500/30">
      

      <div className="absolute top-0 left-0 w-full bg-black/40 backdrop-blur-md border-b border-white/5 py-1.5 px-4 flex justify-between items-center z-50 text-[10px] sm:text-xs text-indigo-200/70 font-mono tracking-widest uppercase">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><TerminalSquare size={12} className="text-indigo-400" /> SYS.LOGIN.01</span>
          <span className="hidden sm:flex items-center gap-1.5"><Cpu size={12} className="text-emerald-400" /> KERNEL OPTIMIZED</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <span className="flex items-center gap-1.5"><Wifi size={12} className="text-cyan-400 animate-pulse" /> ONLINE</span>
          <span className="flex items-center gap-1.5"><BatteryCharging size={12} className="text-green-400" /> {battery}</span>
          <span className="flex items-center gap-1.5"><Clock size={12} className="text-purple-400" /> {time}</span>
        </div>
      </div>


      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-indigo-900/20 blur-[150px] rounded-full animate-rotate" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-purple-900/20 blur-[150px] rounded-full animate-rotate-reverse" />

     
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, type: "spring", stiffness: 100 }}
        className="w-full max-w-[420px] bg-[#0a0a0f]/80 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 border border-white/10 shadow-[0_0_50px_rgba(79,70,229,0.15)] relative z-10"
      >
     
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_15px_rgba(99,102,241,0.8)]" />

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute -top-4 right-8 bg-black/60 backdrop-blur-md border border-indigo-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg shadow-indigo-500/20"
        >
          <ShieldCheck size={12} className="text-emerald-400" />
          <span className="text-[9px] text-emerald-400/90 font-mono tracking-widest font-bold">ANTI-BRUTEFORCE</span>
        </motion.div>

        {/* Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", damping: 15 }}
          className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 relative border border-white/20"
        >
          <MessageCircle size={36} color="white" />
          <div className="absolute -bottom-2 -right-2 bg-[#0a0a0f] rounded-full p-1.5 border border-white/10">
            <Sparkles size={16} className="text-cyan-400 animate-pulse" />
          </div>
        </motion.div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-black bg-gradient-to-br from-white via-indigo-200 to-purple-400 bg-clip-text text-transparent mb-2 tracking-tight">
            ChatSSLock
          </h1>
          <p className="text-indigo-200/50 text-xs font-mono tracking-widest uppercase">
            Encrypted Communication
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
       
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <label className="block text-[10px] font-bold text-indigo-300/70 mb-2 tracking-widest uppercase flex items-center justify-between">
              <span>Secure ID</span>
            </label>
            <div className="relative bg-[#050508] rounded-xl border border-white/5 transition-all duration-300 focus-within:border-indigo-500/50 focus-within:shadow-[0_0_20px_rgba(79,70,229,0.15)] overflow-hidden group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400/50 group-focus-within:text-indigo-400 transition-colors">
                <User size={18} />
              </div>
              <input
                type="text"
                placeholder="Enter unique ID"
                value={uniqueId}
                onChange={(e) => setUniqueId(e.target.value.toUpperCase())}
                className="w-full pl-12 pr-4 py-4 bg-transparent border-none text-white text-sm outline-none font-mono tracking-wider placeholder:text-white/20"
                autoComplete="off"
              />
            </div>
          </motion.div>

    
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <label className="block text-[10px] font-bold text-indigo-300/70 mb-2 tracking-widest uppercase flex items-center justify-between">
              <span>Passkey</span>
              <span className="text-[8px] text-emerald-400 flex items-center gap-1"><Lock size={8}/> 256-BIT ENCRYPTED</span>
            </label>
            <div className="relative bg-[#050508] rounded-xl border border-white/5 transition-all duration-300 focus-within:border-purple-500/50 focus-within:shadow-[0_0_20px_rgba(168,85,247,0.15)] overflow-hidden group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400/50 group-focus-within:text-purple-400 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-transparent border-none text-white text-sm outline-none font-mono tracking-widest placeholder:text-white/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </motion.div>

       
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.9 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.9 }}
                className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-3"
              >
                <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                <span className="text-red-400/90 text-xs font-medium leading-relaxed">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="space-y-4 pt-2">
            
        
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border-none rounded-xl text-white text-sm font-bold tracking-widest uppercase cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
            >
            
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shine" />
              
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Initialize Connection
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

          
            <button
              type="button"
              onClick={() => setShowSignUpModal(true)}
              className="w-full py-4 bg-transparent border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-xl text-slate-300 hover:text-white text-xs font-bold tracking-widest uppercase cursor-pointer transition-all duration-300"
            >
              Request Account
            </button>
          </motion.div>
        </form>
      </motion.div>


      <AnimatePresence>
        {showSignUpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-[#0a0a0f] border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
              
              <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4 border border-indigo-500/20">
                <ShieldCheck size={24} className="text-indigo-400" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Restricted Access</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Pembuatan akun bersifat tertutup. Silahkan request pembuatan account Anda melalui portal administrator.
              </p>
              
              <a
                href="https://talk.visualcodepo.my.id"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 rounded-xl text-indigo-300 font-mono text-xs flex items-center justify-center gap-2 transition-all group"
              >
                talk.visualcodepo.my.id
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </a>

              <button
                onClick={() => setShowSignUpModal(false)}
                className="mt-4 w-full py-2 text-xs text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shine {
          100% { transform: translateX(100%); }
        }
        .animate-rotate {
          animation: rotate 30s linear infinite;
        }
        .animate-rotate-reverse {
          animation: rotate 25s linear infinite reverse;
        }
        .animate-shine {
          animation: shine 1.5s infinite;
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active{
            -webkit-box-shadow: 0 0 0 30px #050508 inset !important;
            -webkit-text-fill-color: white !important;
            transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </div>
  );
};

export default Login;
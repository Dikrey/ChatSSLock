import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import {
  ArrowLeft,
  ShieldAlert,
  BadgeInfo,
  Calendar,
  Ban,
  MessageCircle,
  Info,
  Share2,
  Download,
  Copy,
  Check,
  Zap,
  Globe,
  Hash,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import QRCode from "react-qr-code"; // npm install react-qr-code
import * as htmlToImage from "html-to-image"; // npm install html-to-image

export default function UserProfile() {
  const { unique_id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { selectConversation, getOrCreateConversation } = useChat();
  const qrRef = useRef(null);

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const profileUrl = `${window.location.origin}/user/${unique_id}`;

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("unique_id", unique_id)
          .single();
        if (error) throw error;
        setProfileUser(data);
      } catch (err) {
        setError("Node jaringan tidak ditemukan.");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [unique_id]);

  const handleDownloadQR = async () => {
    if (qrRef.current === null) return;
    const dataUrl = await htmlToImage.toPng(qrRef.current);
    const link = document.createElement("a");
    link.download = `QR-Node-${unique_id}.png`;
    link.href = dataUrl;
    link.click();
  };

  const shareTo = (platform) => {
    const text = `Connect with me on LockChat! Node ID: ${unique_id}`;
    const urls = {
      wa: `https://wa.me/?text=${encodeURIComponent(text + " " + profileUrl)}`,
      fb: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
      tw: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`,
    };
    if (platform === "copy") {
      navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      window.open(urls[platform], "_blank");
    }
    setShowShareMenu(false);
  };

  const handleChatNow = async () => {
    if (!profileUser) return;
    try {
      const result = await getOrCreateConversation(profileUser.id);
      if (result.success) {
        selectConversation({ ...result.conversation, otherUser: profileUser });
        navigate("/");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading)
    return (
      <div className="flex h-[100dvh] bg-[#030308] items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );

  if (error || !profileUser)
    return (
      <div className="flex flex-col h-[100dvh] bg-[#030308] items-center justify-center p-6">
        <ShieldAlert size={64} className="text-rose-500 mb-4 animate-bounce" />
        <h2 className="text-white text-2xl font-black italic tracking-tighter">
          NODE 404
        </h2>
        <p className="text-slate-500 font-mono text-sm mb-8 mt-2">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-bold hover:bg-white/10 transition-all"
        >
          Back to Network
        </button>
      </div>
    );

  const isOwner = profileUser.role === "owner";

  return (
    <div className="flex h-[100dvh] bg-[#030308] text-slate-100 overflow-hidden font-sans relative w-full">
      {/* CYBER BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div
           animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
           transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
           className="absolute top-[-10%] left-[-10%] w-[70vw] max-w-[500px] aspect-square bg-indigo-600/15 blur-[120px] rounded-full mix-blend-screen"
        />
        <motion.div
           animate={{ scale: [1, 1.3, 1], x: [0, -40, 0], y: [0, 40, 0] }}
           transition={{ repeat: Infinity, duration: 25, ease: "easeInOut" }}
           className="absolute bottom-[-10%] right-[-10%] w-[80vw] max-w-[600px] aspect-square bg-rose-600/10 blur-[130px] rounded-full mix-blend-screen"
        />
        <motion.div
           animate={{ scale: [1, 1.5, 1], rotate: [0, -180, -360] }}
           transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
           className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] max-w-[400px] aspect-square bg-purple-600/10 blur-[120px] rounded-full"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.15)_0%,transparent_50%)]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: "30px 30px",
          }}
        />
      </div>

      {/* FLOATING ACTION HEADER (FIX FOR MOBILE) */}
      <div className="fixed top-0 left-0 w-full z-[100] px-4 py-4 flex justify-between items-center pointer-events-none">
        <button
          onClick={() => navigate(-1)}
          className="w-12 h-12 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-white shadow-2xl pointer-events-auto active:scale-90 transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <button
          onClick={() => setShowShareMenu(true)}
          className="w-12 h-12 bg-indigo-600 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] pointer-events-auto active:scale-90 transition-all"
        >
          <Share2 size={22} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 pt-24 pb-12">
        <div className="max-w-[450px] mx-auto px-6">
          {/* PROFILE CARD CARD */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            {/* AVATAR NODE */}
            <div className="relative mb-8">
              <div
                className={`relative ${isOwner ? "w-36 h-36" : "w-32 h-32"}`}
              >
                {isOwner && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 4,
                      ease: "linear",
                    }}
                    className="absolute -inset-2 rounded-[2.5rem] bg-[conic-gradient(from_0deg,transparent,#6366f1,#ec4899,#f43f5e,transparent)] blur-[4px]"
                  />
                )}
                <div className="absolute inset-0 rounded-[2.2rem] bg-[#030308] z-[5]" />
                <img
                  src={
                    profileUser.avatar_url ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${profileUser.username}`
                  }
                  className={`w-full h-full object-cover relative z-10 p-1.5 ${isOwner ? "rounded-[2.2rem]" : "rounded-[2rem] border-2 border-white/10"}`}
                  alt="Profile"
                />
                <div
                  className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-[#030308] z-20 ${profileUser.is_online ? "bg-emerald-400 shadow-[0_0_15px_#10b981]" : "bg-slate-600"}`}
                />
              </div>
            </div>

            {/* IDENTITY INFO */}
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-3xl font-black text-white tracking-tighter flex items-center justify-center gap-2">
                {profileUser.username}
                {isOwner && (
                  <Zap
                    size={24}
                    className="text-indigo-400 fill-indigo-400/20"
                  />
                )}
              </h2>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
                <span className="text-[10px] font-black text-indigo-400 font-mono tracking-[0.2em]">
                  NODE_ID: {profileUser.unique_id}
                </span>
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="grid grid-cols-2 gap-3 w-full mb-8">
              <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-4 text-center">
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  Clearance
                </div>
                <div
                  className={`text-xs font-bold uppercase ${isOwner ? "text-rose-500" : "text-indigo-400"}`}
                >
                  {profileUser.role}
                </div>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-4 text-center">
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  Link Status
                </div>
                <div
                  className={`text-xs font-bold uppercase ${profileUser.is_online ? "text-emerald-400" : "text-slate-500"}`}
                >
                  {profileUser.is_online ? "ACTIVE" : "OFFLINE"}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {currentUser && currentUser.id !== profileUser.id && (
              <button
                onClick={handleChatNow}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 transition-all text-white font-bold py-4 rounded-2xl shadow-[0_10px_30px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2 text-sm uppercase tracking-widest mt-auto mb-8"
              >
                <MessageCircle size={18} /> Chat Now
              </button>
            )}

            {/* QR CODE NODE (MODERN UI) */}
            <div className="w-full bg-[#0a0a0f] border border-indigo-500/20 rounded-[35px] p-8 mb-8 relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Hash size={100} />
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="mb-6 text-center">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2 flex items-center justify-center gap-2">
                    <Globe size={12} /> Secure Access Token
                  </p>
                  <p className="text-xs text-slate-500 font-mono truncate max-w-[250px]">
                    {profileUrl}
                  </p>
                </div>

                <div
                  ref={qrRef}
                  className="p-4 bg-white rounded-[2rem] shadow-[0_0_40px_rgba(99,102,241,0.3)] mb-6 transition-transform hover:scale-105 duration-500"
                >
                  <QRCode value={profileUrl} size={150} level="H" />
                </div>

                <div className="flex gap-2 w-full">
                  <button
                    onClick={handleDownloadQR}
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    <Download size={14} /> Download QR
                  </button>
                  <button
                    onClick={() => shareTo("copy")}
                    className="flex-1 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-2xl py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    {copied ? (
                      <Check size={14} />
                    ) : (
                      <>
                        <Copy size={14} /> Copy Link
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* BIO & STATS */}
            <div className="w-full space-y-4 mb-8">
              <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-3 text-slate-400">
                  <Info size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Biography
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-300 leading-relaxed italic">
                  "
                  {profileUser.bio ||
                    "Node ini belum mendefinisikan protokol biografinya..."}
                  "
                </p>
              </div>

              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-3xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      Protocol Start
                    </div>
                    <div className="text-sm font-bold text-slate-200">
                      {format(
                        new Date(profileUser.created_at),
                        "dd MMMM yyyy",
                        { locale: id },
                      )}
                    </div>
                  </div>
                </div>
                <BadgeInfo size={20} className="text-indigo-900" />
              </div>
            </div>

            {/* FINAL ACTION */}
            {currentUser && currentUser.id !== profileUser.id ? (
              <button
                onClick={handleChatNow}
                className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right transition-all duration-500 text-white font-black py-5 rounded-[2rem] shadow-[0_15px_35px_rgba(99,102,241,0.4)] flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] active:scale-95"
              >
                <MessageCircle size={20} /> Initiate Secure Session
              </button>
            ) : (
              <div className="w-full p-5 bg-white/5 border border-white/10 rounded-[2rem] text-center text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
                Verified Digital Identity (Your Node)
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* SHARE MODAL MENU */}
      <AnimatePresence>
        {showShareMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareMenu(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 w-full bg-[#0a0a0f] border-t border-white/10 rounded-t-[40px] z-[120] p-8"
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
              <h3 className="text-center text-white font-black text-xs uppercase tracking-[0.3em] mb-8">
                Propagate Node Link
              </h3>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { id: "wa", label: "WA", color: "bg-emerald-500" },
                  { id: "fb", label: "FB", color: "bg-blue-600" },
                  { id: "tw", label: "X", color: "bg-slate-800" },
                  { id: "copy", label: "Copy", color: "bg-indigo-600" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => shareTo(item.id)}
                    className="flex flex-col items-center gap-3 group"
                  >
                    <div
                      className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-white shadow-xl transition-transform group-active:scale-90`}
                    >
                      {item.id === "copy" ? (
                        <Copy size={20} />
                      ) : (
                        <Share2 size={20} />
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowShareMenu(false)}
                className="w-full mt-10 py-4 text-xs font-black text-slate-500 uppercase tracking-widest"
              >
                Abort
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .pt-safe { padding-top: env(safe-area-inset-top); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
}

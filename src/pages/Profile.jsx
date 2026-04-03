import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadFile } from '../lib/storage';
import { 
  User, Calendar, Shield, Edit3, Camera, X, LogOut, 
  Save, Globe, Copy, Check, Zap, Hash, Share2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code'; // Pastikan sudah install: npm install react-qr-code

const Profile = ({ onClose }) => {
  const { user, logout, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const profileUrl = `${window.location.origin}/user/${user?.unique_id}`;

  const [formData, setFormData] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    avatar_url: user?.avatar_url || '',
    avatarFile: null,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({ ...formData, avatar_url: event.target.result, avatarFile: file });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    let avatarUrl = formData.avatar_url;
    if (formData.avatarFile) {
      const uploadResult = await uploadFile(formData.avatarFile);
      if (uploadResult.success) avatarUrl = uploadResult.url;
    }
    await updateProfile(user.id, {
      username: formData.username,
      bio: formData.bio,
      avatar_url: avatarUrl,
    });
    setEditing(false);
    setSaving(false);
  };

  if (!user) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#030308]/90 backdrop-blur-xl flex items-center justify-center z-[100] p-0 md:p-4 overflow-y-auto"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20, opacity: 0 }} 
        animate={{ scale: 1, y: 0, opacity: 1 }}
        className="bg-[#0a0a0f]/80 w-full max-w-[480px] min-h-screen md:min-h-0 md:rounded-[40px] border-x md:border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
      >
        {/* TOP NAVBAR (FIXED AT MOBILE) */}
        <div className="sticky top-0 z-30 p-6 flex justify-between items-center bg-[#0a0a0f]/60 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <User size={16} className="text-indigo-400" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Identity Node</h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-500 flex items-center justify-center transition-all border border-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTENT SCROLL AREA */}
        <div className="p-6 md:p-8 space-y-8 pb-32">
          
          {/* AVATAR & HEADER */}
          <div className="relative flex flex-col items-center">
             <div className="relative group">
                <div className="absolute inset-0 bg-indigo-600 blur-[30px] opacity-20 group-hover:opacity-40 transition-opacity rounded-full" />
                <img 
                  src={formData.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${formData.username}`} 
                  alt={formData.username}
                  className="w-28 h-28 md:w-32 md:h-32 rounded-[35%] object-cover border-2 border-indigo-500/30 relative z-10 p-1 bg-[#0a0a0f]" 
                />
                {editing && (
                  <label className="absolute bottom-1 right-1 z-20 bg-indigo-600 p-2.5 rounded-xl cursor-pointer hover:scale-110 transition-transform shadow-xl border border-white/20">
                    <Camera size={18} className="text-white" />
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                )}
             </div>
             <div className="mt-6 text-center">
                {editing ? (
                  <input 
                    type="text" name="username" value={formData.username} onChange={handleInputChange}
                    className="bg-white/5 border border-indigo-500/30 rounded-xl p-3 text-center text-xl font-bold w-full focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                ) : (
                  <h3 className="text-2xl font-black text-white tracking-tight">{user.username}</h3>
                )}
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-mono text-indigo-400 border border-white/5 uppercase tracking-widest">
                    <Hash size={10} className="inline mr-1"/> {user.unique_id}
                  </span>
                  {user.role === 'owner' && (
                    <span className="px-3 py-1 bg-rose-500/10 rounded-lg text-[10px] font-black text-rose-500 border border-rose-500/20 uppercase tracking-widest flex items-center gap-1">
                      <Shield size={10} /> Admin
                    </span>
                  )}
                </div>
             </div>
          </div>

          {/* SHARED IDENTITY (URL & QR) */}
          <div className="bg-gradient-to-br from-indigo-600/10 to-purple-600/5 rounded-[32px] p-6 border border-indigo-500/20 relative overflow-hidden group">
             <div className="flex flex-col md:flex-row items-center gap-6">
                {/* QR CODE SECTION */}
                <div className="p-3 bg-white rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.3)] group-hover:scale-105 transition-transform duration-500">
                  <QRCode value={profileUrl} size={100} level="H" />
                </div>
                
                <div className="flex-1 space-y-3 text-center md:text-left">
                   <div className="flex items-center gap-2 justify-center md:justify-start text-indigo-400 font-black text-[10px] uppercase tracking-widest">
                      <Zap size={12} /> Global Access Link
                   </div>
                   <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-2 gap-2">
                      <input 
                        readOnly value={profileUrl} 
                        className="bg-transparent text-[11px] font-mono text-slate-400 flex-1 outline-none px-2 truncate"
                      />
                      <button 
                        onClick={handleCopy}
                        className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                   </div>
                </div>
             </div>
          </div>

          {/* BIO SECTION */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 px-1">
                <Globe size={14} className="text-slate-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Biography</span>
             </div>
             <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                {editing ? (
                  <textarea 
                    name="bio" value={formData.bio} onChange={handleInputChange} 
                    rows="3" className="w-full bg-transparent text-sm resize-none outline-none text-white"
                    placeholder="Tell the network who you are..."
                  />
                ) : (
                  <p className="text-sm leading-relaxed text-slate-300 font-medium">
                    {user.bio || 'This agent remains mysterious...'}
                  </p>
                )}
             </div>
          </div>

          {/* INFO GRID */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Joined Date</div>
                <div className="text-xs font-black text-white">{new Date(user.created_at).toLocaleDateString('en-GB')}</div>
             </div>
             <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Clearance</div>
                <div className="text-xs font-black text-indigo-400 uppercase tracking-tighter">{user.role || 'User'}</div>
             </div>
          </div>

        </div>

        {/* BOTTOM ACTION BAR (STICKY) */}
        <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f] to-transparent pt-10">
          <div className="flex gap-3">
            {editing ? (
              <>
                <button 
                  onClick={() => setEditing(false)} 
                  className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave} disabled={saving} 
                  className="flex-[2] py-4 bg-indigo-600 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-[0_10px_30px_rgba(79,70,229,0.4)] hover:bg-indigo-500 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {saving ? 'Encrypting...' : <><Save size={16}/> Save Profile</>}
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setEditing(true)} 
                  className="flex-1 py-4 bg-indigo-600 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white shadow-xl hover:bg-indigo-500 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Edit3 size={16}/> Edit Identity
                </button>
                <button 
                  onClick={logout} 
                  className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-lg active:scale-90"
                >
                  <LogOut size={20}/>
                </button>
              </>
            )}
          </div>
        </div>

      </motion.div>
    </motion.div>
  );
};

export default Profile;
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadFile } from '../lib/storage';
import { User, Mail, Calendar, Shield, Edit3, Camera, X, LogOut, Save } from 'lucide-react';
import { motion } from 'framer-motion';

const Profile = ({ onClose }) => {
  const { user, logout, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    avatar_url: user?.avatar_url || '',
    avatarFile: null,
  });

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
      if (uploadResult.success) {
        avatarUrl = uploadResult.url;
      }
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-8 w-full max-w-md border border-white/10">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Profile</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><X size={20} /></button>
        </div>

        <div className="text-center mb-6">
          <div className="relative inline-block">
            <img src={formData.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${formData.username}`} alt={formData.username}
              className="w-24 h-24 rounded-full object-cover border-4 border-white/10" />
            {editing && (
              <label className="absolute bottom-0 right-0 bg-indigo-500 rounded-full p-2 cursor-pointer hover:bg-indigo-600">
                <Camera size={16} />
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            )}
          </div>
          <div className="mt-3">
            {editing ? (
              <input type="text" name="username" value={formData.username} onChange={handleInputChange} className="bg-black/30 rounded-lg p-2 text-center text-xl font-bold w-full max-w-xs mx-auto outline-none focus:ring-2 focus:ring-indigo-500" />
            ) : (
              <h3 className="text-xl font-bold">{user.username}</h3>
            )}
            <div className="text-sm text-white/50 mt-1">{user.unique_id}</div>
            {user.role === 'owner' && (
              <span className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-pink-500/20 text-pink-400">
                <Shield size={12} /> Owner
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-xs text-white/50 mb-2 font-semibold tracking-wider uppercase">Account Info</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <User size={14} className="text-white/50"/>
                <span className="text-white/50 w-20">Username</span>
                {editing ? (
                  <input type="text" name="username" value={formData.username} onChange={handleInputChange} className="bg-black/30 rounded-md p-1.5 flex-1 outline-none focus:ring-2 focus:ring-indigo-500" />
                ) : (
                  <span>{user.username}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Mail size={14} className="text-white/50"/>
                <span className="text-white/50 w-20">Unique ID</span>
                <span>{user.unique_id}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={14} className="text-white/50"/>
                <span className="text-white/50 w-20">Joined</span>
                <span>{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-xs text-white/50 mb-2 font-semibold tracking-wider uppercase">Bio</h4>
            {editing ? (
              <textarea name="bio" value={formData.bio} onChange={handleInputChange} placeholder="Write something about yourself..." rows="3"
                className="w-full bg-black/30 rounded-md p-1.5 text-sm resize-none outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
            ) : (
              <p className={`text-sm ${user.bio ? 'text-white' : 'text-white/50'}`}>{user.bio || 'No bio yet'}</p>
            )}
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="w-full py-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all font-semibold flex items-center justify-center gap-2">
                {saving ? 'Saving...' : <><Save size={16}/> Save Changes</>}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="w-full py-3 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all font-semibold flex items-center justify-center gap-2">
                <Edit3 size={16}/> Edit Profile
              </button>
              <button onClick={logout} className="py-3 px-4 bg-red-500/10 rounded-lg text-red-400 hover:bg-red-500/20 transition-all">
                <LogOut size={18}/>
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Profile;

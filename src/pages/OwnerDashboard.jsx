import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Users, UserPlus, Shield, ShieldOff, Trash2, LogOut, Search, Upload, Check, Edit, Eye, EyeOff, Activity, Globe, RefreshCw, MessageSquareX, TerminalSquare, Cpu, Wifi, Filter, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { uploadFile } from '../lib/storage';

const OwnerDashboard = () => {
  const { user, logout, getAllUsers, createUser, banUser, unbanUser, deleteUser, isOwner, updateProfile } = useAuth();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // NEW FEATURE: Quick Filters
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deletingAllMessages, setDeletingAllMessages] = useState(false);
  const [time, setTime] = useState(''); // NEW FEATURE: Live Clock

  // Live Clock Effect
  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'user',
    bio: '',
    avatar_url: '',
    is_online: false,
    avatarFile: null
  });

  useEffect(() => {
    if (!isOwner) {
      navigate('/');
      return;
    }
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, navigate]);

  const loadUsers = async () => {
    setIsRefreshing(true);
    const result = await getAllUsers();
    if (result.success) {
      setUsers(result.users);
    }
    setLoading(false);
    setIsRefreshing(false);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({ ...formData, avatar_url: event.target.result, avatarFile: file });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const resetFormData = () => {
    setFormData({ username: '', password: '', role: 'user', bio: '', avatar_url: '', is_online: false, avatarFile: null });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    let avatarUrl = formData.avatar_url;
    if (formData.avatarFile) {
      const uploadResult = await uploadFile(formData.avatarFile);
      if (uploadResult.success) {
        avatarUrl = uploadResult.url;
      }
    }
    
    const { username, password, role, bio } = formData;
    await createUser(username, password, role, bio, avatarUrl);
    
    loadUsers();
    setShowCreateModal(false);
    resetFormData();
  };

  const handleEditUser = (userToEdit) => {
    setEditingUser(userToEdit);
    setFormData({
      username: userToEdit.username,
      password: '',
      role: userToEdit.role,
      bio: userToEdit.bio || '',
      avatar_url: userToEdit.avatar_url || '',
      is_online: userToEdit.is_online || false,
      avatarFile: null
    });
    setShowEditModal(true);
  };
  
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    let avatarUrl = formData.avatar_url;
    if (formData.avatarFile) {
      const uploadResult = await uploadFile(formData.avatarFile);
      if (uploadResult.success) {
        avatarUrl = uploadResult.url;
      }
    }
    
    const updates = {
      username: formData.username,
      role: formData.role,
      bio: formData.bio,
      avatar_url: avatarUrl,
      is_online: formData.is_online
    };
    if (formData.password) {
      updates.password = formData.password;
    }
    
    await updateProfile(editingUser.id, updates);
    
    loadUsers();
    setShowEditModal(false);
    resetFormData();
    setEditingUser(null);
  };

  const togglePasswordVisibility = (userId) => {
    setUsers(users.map(u => u.id === userId ? { ...u, showPassword: !u.showPassword } : u));
  };

  // NEW FEATURE: Added Filter Logic
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.unique_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterMode === 'all' ? true :
                          filterMode === 'online' ? u.is_online && !u.is_banned :
                          filterMode === 'banned' ? u.is_banned :
                          filterMode === 'admin' ? u.role === 'owner' : true;
    return matchesSearch && matchesFilter;
  });

  const onlineCount = users.filter(u => u.is_online && !u.is_banned).length;
  const bannedCount = users.filter(u => u.is_banned).length;
  const adminCount = users.filter(u => u.role === 'owner').length;
  const newGlobalAccounts = [...users].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);

  const handleDeleteAllMessages = async () => {
    setDeletingAllMessages(true);
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      setShowDeleteAllModal(false);
    } catch (err) {
      console.error('Failed to delete all messages:', err);
    } finally {
      setDeletingAllMessages(false);
    }
  };

  // Chart Data Array
  const chartData = [
    { name: 'Total', count: users.length, fill: '#6366f1' },
    { name: 'Admins', count: adminCount, fill: '#ec4899' },
    { name: 'Online', count: onlineCount, fill: '#10b981' },
    { name: 'Banned', count: bannedCount, fill: '#ef4444' },
  ];

  if (!isOwner) return null;

  return (
    <div className="min-h-screen bg-[#030308] text-slate-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden pb-20">
      
      {/* Top System Bar (Cyber Vibe) */}
      <div className="hidden md:flex w-full bg-black/60 border-b border-white/5 py-1 px-4 justify-between items-center z-50 text-[10px] text-indigo-300/70 font-mono tracking-widest uppercase">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><TerminalSquare size={12} className="text-indigo-500" /> ADMIN.KERNEL.V2</span>
          <span className="flex items-center gap-1.5"><Cpu size={12} className="text-emerald-500" /> SYSTEM NORMAL</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5"><Wifi size={12} className="text-cyan-500 animate-pulse" /> NETWORK CONNECTED</span>
          <span className="flex items-center gap-1.5"><Clock size={12} className="text-purple-400" /> {time}</span>
        </div>
      </div>

      {/* Background Effects */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-700/10 blur-[150px] pointer-events-none z-0 animate-pulse-slow" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-700/10 blur-[150px] pointer-events-none z-0" />

      {/* Header NavBar */}
      <div className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-2xl border-b border-white/5 shadow-2xl">
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)] flex-shrink-0 relative">
                <Shield className="text-white" size={24} />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#0a0a0f] rounded-full flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                </div>
             </div>
             <div>
                <h1 className="text-xl md:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-purple-400 tracking-tight">OVERSEER PANEL</h1>
                <p className="text-indigo-400/60 text-[10px] md:text-xs font-mono tracking-widest uppercase mt-0.5">God Mode Activated</p>
             </div>
          </div>
          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 gap-1.5 w-full md:w-auto overflow-x-auto custom-scrollbar shadow-inner">
            <button onClick={() => setShowCreateModal(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 hover:bg-white/10 rounded-xl text-xs md:text-sm font-bold transition-all text-slate-300 hover:text-white whitespace-nowrap border border-transparent hover:border-white/10">
              <UserPlus size={16} className="text-indigo-400"/> Provision User
            </button>
            <button onClick={() => navigate('/')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 hover:bg-white/10 rounded-xl text-xs md:text-sm font-bold transition-all text-slate-300 hover:text-white whitespace-nowrap border border-transparent hover:border-white/10">
              <Activity size={16} className="text-emerald-400"/> Enter Chat
            </button>
            <button onClick={() => setShowDeleteAllModal(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 hover:bg-red-500/20 rounded-xl text-xs md:text-sm font-bold transition-all text-red-400 hover:text-red-300 whitespace-nowrap border border-transparent hover:border-red-500/30">
              <MessageSquareX size={16}/> Purge Msgs
            </button>
            <button onClick={logout} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 hover:bg-white/10 rounded-xl text-xs md:text-sm font-bold transition-all text-slate-400 hover:text-white whitespace-nowrap ml-1 md:ml-2">
              <LogOut size={16} /> Exit
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 relative z-10 flex flex-col lg:flex-row gap-6 lg:gap-8">
        
        {/* Main Content Area */}
        <div className="flex-1 space-y-6 lg:space-y-8 min-w-0">
          
          {/* Dashboard Stats & Chart Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Stat Cards (Left side on desktop) */}
            <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-6">
              {[
                { label: 'Total Registrations', value: users.length, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
                { label: 'Active Sessions', value: onlineCount, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                { label: 'Admin Accounts', value: adminCount, icon: Shield, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
                { label: 'Restricted (Banned)', value: bannedCount, icon: ShieldOff, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
              ].map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1, type: "spring" }}
                  className={`bg-white/[0.02] backdrop-blur-md rounded-3xl p-6 border ${stat.border} shadow-xl relative overflow-hidden group hover:bg-white/[0.05] transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-slate-400 text-[10px] md:text-xs font-mono font-bold uppercase tracking-widest mb-2">{stat.label}</div>
                      <div className="text-4xl md:text-5xl font-black text-white tracking-tight">{stat.value}</div>
                    </div>
                    <div className={`w-12 h-12 md:w-14 md:h-14 ${stat.bg} rounded-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 border border-white/5`}>
                      <stat.icon size={24} className={`md:w-7 md:h-7 ${stat.color}`} />
                    </div>
                  </div>
                  <div className={`absolute -bottom-6 -right-6 w-32 h-32 ${stat.bg} rounded-full blur-3xl opacity-40 group-hover:opacity-80 transition-opacity duration-500`} />
                </motion.div>
              ))}
            </div>

            {/* NEW FEATURE: Visual Analytics Chart */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} 
              className="md:col-span-4 bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-6">System Distribution</h3>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#0a0a0f', borderColor: '#333', borderRadius: '12px' }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* User Management Table Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-[#0a0a0f]/80 backdrop-blur-2xl rounded-3xl border border-white/5 shadow-2xl overflow-hidden flex flex-col w-full relative">
            
            {/* Table Header & Controls */}
            <div className="p-6 md:p-8 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-gradient-to-b from-white/[0.02] to-transparent border-b border-white/5 w-full">
              <div className="flex items-center gap-4">
                 <div>
                    <h2 className="text-xl md:text-2xl font-black flex items-center gap-3">
                      User Database 
                      <button onClick={loadUsers} className={`${isRefreshing ? 'animate-spin text-emerald-400' : 'text-indigo-400'} hover:text-white transition-colors bg-white/5 p-2 rounded-xl border border-white/10`} title="Refresh Database">
                        <RefreshCw size={18}/>
                      </button>
                    </h2>
                    <p className="text-xs md:text-sm text-slate-500 mt-1.5 font-mono">Manage accounts, security protocols, and credentials.</p>
                 </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
                {/* NEW FEATURE: Filter Chips */}
                <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/10 overflow-x-auto custom-scrollbar">
                  {['all', 'online', 'banned', 'admin'].map((f) => (
                    <button 
                      key={f}
                      onClick={() => setFilterMode(f)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap ${filterMode === f ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-64 flex-shrink-0">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search ID/Name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600 font-mono"
                  />
                </div>
              </div>
            </div>
            
            {/* Desktop Table View (Scrollable horizontally) */}
            <div className="overflow-x-auto w-full px-2 custom-scrollbar pb-4 hidden md:block">
              <table className="w-full text-left border-separate border-spacing-y-2 min-w-[900px] px-4">
                <thead>
                  <tr className="text-xs text-slate-500 uppercase font-mono tracking-widest font-bold">
                    <th className="px-6 py-5">Profile</th>
                    <th className="px-6 py-5">Sys ID</th>
                    <th className="px-6 py-5">Clearance</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5">Passkey</th>
                    <th className="px-6 py-5 text-right">Override</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {loading ? (
                      <tr><td colSpan={6} className="text-center p-16"><div className="w-10 h-10 border-2 border-white/10 border-t-indigo-500 rounded-full animate-spin mx-auto"/></td></tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr><td colSpan={6} className="text-center p-16 text-slate-500 font-mono">No entities found matching parameters.</td></tr>
                    ) : (
                      filteredUsers.map((u, idx) => (
                        <motion.tr layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} key={u.id} 
                          className="bg-white/[0.015] hover:bg-white/[0.04] transition-colors rounded-2xl group">
                          <td className="px-6 py-4 rounded-l-2xl border-y border-l border-white/5 group-hover:border-indigo-500/20">
                             <div className="flex items-center gap-4">
                               <div className="relative flex-shrink-0">
                                 <img src={u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${u.username}`} alt={u.username} className="w-12 h-12 rounded-xl object-cover ring-2 ring-transparent group-hover:ring-indigo-500/30 transition-all"/>
                                 <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0a0a0f] ${u.is_online && !u.is_banned ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-slate-600'}`} />
                               </div>
                               <div className="min-w-0">
                                 <div className="font-bold text-slate-100 text-base truncate">{u.username}</div>
                                 <div className="text-xs text-slate-500 mt-0.5 truncate font-mono">Created: {new Date(u.created_at).toLocaleDateString()}</div>
                               </div>
                             </div>
                          </td>
                          <td className="px-6 py-4 border-y border-white/5 group-hover:border-indigo-500/20">
                             <span className="font-mono text-sm bg-black/40 px-3 py-1.5 rounded-lg text-indigo-300 tracking-wider border border-white/5">{u.unique_id}</span>
                          </td>
                          <td className="px-6 py-4 border-y border-white/5 group-hover:border-indigo-500/20">
                            <span className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border inline-block ${u.role === 'owner' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>{u.role}</span>
                          </td>
                          <td className="px-6 py-4 border-y border-white/5 group-hover:border-indigo-500/20">
                            <span className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border flex items-center w-max gap-2 ${u.is_banned ? 'bg-red-500/10 text-red-400 border-red-500/20' : u.is_online ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${u.is_banned ? 'bg-red-500' : u.is_online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                              {u.is_banned ? 'Restricted' : u.is_online ? 'Active' : 'Offline'}
                            </span>
                          </td>
                          <td className="px-6 py-4 border-y border-white/5 group-hover:border-indigo-500/20">
                            <div className="flex items-center gap-3 bg-black/40 p-2 rounded-xl border border-white/5 w-max">
                               <span className="font-mono text-sm text-slate-300 w-24 truncate text-center">{u.showPassword ? u.password : '••••••••'}</span>
                               <button onClick={() => togglePasswordVisibility(u.id)} className="text-slate-500 hover:text-indigo-400 transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-md">
                                 {u.showPassword ? <EyeOff size={14}/> : <Eye size={14}/>}
                               </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 rounded-r-2xl border-y border-r border-white/5 group-hover:border-indigo-500/20 text-right">
                            {u.id !== user.id && (
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => handleEditUser(u)} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-indigo-500/20 flex items-center justify-center text-slate-400 hover:text-indigo-400 transition-all border border-transparent hover:border-indigo-500/30 hover:scale-110" title="Edit Config">
                                  <Edit size={16} />
                                </button>
                                {u.is_banned ? 
                                  <button onClick={() => unbanUser(u.id)} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-emerald-500/20 flex items-center justify-center text-slate-400 hover:text-emerald-400 transition-all border border-transparent hover:border-emerald-500/30 hover:scale-110" title="Restore Access">
                                    <Check size={16} />
                                  </button> :
                                  <button onClick={() => banUser(u.id)} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-orange-500/20 flex items-center justify-center text-slate-400 hover:text-orange-400 transition-all border border-transparent hover:border-orange-500/30 hover:scale-110" title="Revoke Access">
                                    <ShieldOff size={16} />
                                  </button>
                                }
                                <button onClick={() => deleteUser(u.id)} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-slate-400 hover:text-red-400 transition-all border border-transparent hover:border-red-500/30 hover:scale-110" title="Terminate Data">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (Displays instead of table on small screens) */}
            <div className="md:hidden flex flex-col gap-4 p-4">
               {loading ? (
                 <div className="flex justify-center p-10"><div className="w-8 h-8 border-2 border-white/10 border-t-indigo-500 rounded-full animate-spin"/></div>
               ) : filteredUsers.length === 0 ? (
                 <div className="text-center p-10 text-slate-500 font-mono text-sm">No entities found.</div>
               ) : (
                 filteredUsers.map((u) => (
                   <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} key={u.id} 
                     className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex flex-col gap-4 shadow-lg">
                     {/* Header Card */}
                     <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                           <div className="relative">
                             <img src={u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${u.username}`} alt="" className="w-12 h-12 rounded-xl object-cover"/>
                             <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#12121a] ${u.is_online && !u.is_banned ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                           </div>
                           <div>
                             <div className="font-bold text-base text-white">{u.username}</div>
                             <div className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 inline-block mt-1">{u.unique_id}</div>
                           </div>
                        </div>
                        <span className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md border ${u.role === 'owner' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : 'bg-white/5 text-slate-400 border-white/10'}`}>{u.role}</span>
                     </div>
                     {/* Password & Status */}
                     <div className="flex justify-between items-center bg-black/40 rounded-xl p-2.5 border border-white/5">
                        <span className={`text-[10px] font-bold uppercase flex items-center gap-1.5 ${u.is_banned ? 'text-red-400' : u.is_online ? 'text-emerald-400' : 'text-slate-500'}`}>
                           <div className={`w-1.5 h-1.5 rounded-full ${u.is_banned ? 'bg-red-500' : u.is_online ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                           {u.is_banned ? 'Banned' : u.is_online ? 'Online' : 'Offline'}
                        </span>
                        <div className="flex items-center gap-2">
                           <span className="font-mono text-xs text-slate-300">{u.showPassword ? u.password : '••••••••'}</span>
                           <button onClick={() => togglePasswordVisibility(u.id)} className="text-slate-500 bg-white/5 p-1 rounded">
                             {u.showPassword ? <EyeOff size={12}/> : <Eye size={12}/>}
                           </button>
                        </div>
                     </div>
                     {/* Actions */}
                     {u.id !== user.id && (
                       <div className="flex gap-2 pt-2 border-t border-white/5">
                         <button onClick={() => handleEditUser(u)} className="flex-1 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-bold flex items-center justify-center gap-2 border border-indigo-500/20"><Edit size={14}/> Edit</button>
                         {u.is_banned ? 
                           <button onClick={() => unbanUser(u.id)} className="flex-1 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 border border-emerald-500/20"><Check size={14}/> Unban</button> :
                           <button onClick={() => banUser(u.id)} className="flex-1 py-2 rounded-lg bg-orange-500/10 text-orange-400 text-xs font-bold flex items-center justify-center gap-2 border border-orange-500/20"><ShieldOff size={14}/> Ban</button>
                         }
                         <button onClick={() => deleteUser(u.id)} className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold flex items-center justify-center gap-2 border border-red-500/20"><Trash2 size={14}/> Del</button>
                       </div>
                     )}
                   </motion.div>
                 ))
               )}
            </div>
          </motion.div>
        </div>

        {/* Global Accounts Sidebar (Sticky on desktop, flows naturally on mobile) */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
          className="w-full lg:w-[350px] flex-shrink-0 bg-[#0a0a0f]/80 backdrop-blur-2xl rounded-3xl border border-white/5 shadow-2xl overflow-hidden flex flex-col h-[500px] lg:h-[calc(100vh-140px)] lg:sticky lg:top-28">
           
           <div className="p-6 border-b border-white/5 flex items-center gap-4 relative overflow-hidden bg-gradient-to-br from-indigo-500/10 to-transparent">
             <div className="absolute -top-10 -right-10 opacity-10 rotate-12">
                <Globe size={150} />
             </div>
             <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30 relative z-10 shadow-[0_0_15px_rgba(79,70,229,0.2)]">
                <Globe size={24} />
             </div>
             <div className="relative z-10">
                <h3 className="font-black text-lg text-white">Global Network</h3>
                <p className="text-[10px] uppercase font-mono tracking-widest font-bold text-emerald-400 mt-1 flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/>Live Feed</p>
             </div>
           </div>

           <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar bg-black/20">
              {loading ? (
                 <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
              ) : newGlobalAccounts.length === 0 ? (
                 <div className="flex h-full items-center justify-center text-slate-500 text-sm font-mono">Network Empty</div>
              ) : (
                 <div className="flex flex-col gap-3">
                   {newGlobalAccounts.map((gAcct, i) => (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + (i * 0.05) }} key={gAcct.id} 
                        className="bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-indigo-500/30 rounded-2xl p-3 flex items-center gap-4 transition-all duration-300 cursor-pointer group"
                        onClick={() => handleEditUser(gAcct)}
                      >
                         <img src={gAcct.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${gAcct.username}`} className="w-12 h-12 rounded-xl object-cover ring-2 ring-transparent group-hover:ring-indigo-500/50 transition-all shadow-lg" />
                         <div className="flex-1 min-w-0">
                            <div className="font-bold text-white text-sm truncate flex justify-between items-center mb-1">
                               {gAcct.username}
                               {gAcct.role === 'owner' && <Shield size={14} className="text-pink-400 drop-shadow-[0_0_5px_rgba(244,114,182,0.5)]" />}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-indigo-300 font-mono tracking-widest truncate border border-white/10 bg-black/40 px-2 py-0.5 rounded">{gAcct.unique_id}</span>
                              <span className={`text-[8px] uppercase font-bold tracking-wider ${gAcct.is_online ? 'text-emerald-400' : 'text-slate-500'}`}>{gAcct.is_online ? 'ON' : 'OFF'}</span>
                            </div>
                         </div>
                      </motion.div>
                   ))}
                 </div>
              )}
           </div>
        </motion.div>
      </div>
      
      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || showEditModal) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => {setShowCreateModal(false); setShowEditModal(false); resetFormData();}}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 pt-10 pb-[env(safe-area-inset-bottom)] overflow-y-auto">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} onClick={(e) => e.stopPropagation()}
              className="bg-[#0a0a0f] rounded-[32px] p-6 md:p-8 w-full max-w-lg border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden my-auto">
              
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <h2 className="text-2xl md:text-3xl font-black mb-1 tracking-tight text-white">{showCreateModal ? 'Provision User' : 'Edit Configuration'}</h2>
              <p className="text-xs text-slate-400 font-mono mb-8 uppercase tracking-widest">{showCreateModal ? 'Create new network entity' : 'Modify entity parameters'}</p>
              
              <form onSubmit={showCreateModal ? handleCreateUser : handleUpdateUser} className="relative z-10">
                <div className="flex justify-center mb-8">
                  <div className="relative group cursor-pointer">
                    <div className="absolute inset-0 bg-indigo-500/20 rounded-3xl blur-xl group-hover:bg-indigo-500/40 transition-all" />
                    <img src={formData.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${formData.username || 'U'}`} alt="Avatar" className="relative w-24 h-24 md:w-28 md:h-28 rounded-3xl object-cover border-2 border-white/10 group-hover:border-indigo-400 transition-colors shadow-2xl"/>
                    <label className="absolute -bottom-3 -right-3 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 rounded-xl p-3 cursor-pointer shadow-lg transition-transform hover:scale-110 border border-white/20">
                      <Upload size={16} className="text-white" />
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden"/>
                    </label>
                  </div>
                </div>

                <div className="space-y-5 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 block flex items-center gap-2"><UserPlus size={12}/> Username</label>
                      <input type="text" name="username" value={formData.username} onChange={handleInputChange} className="w-full bg-black/50 rounded-xl p-3.5 text-sm font-bold border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" required/>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 block flex items-center gap-2"><Shield size={12}/> Passkey</label>
                      <input type="text" name="password" value={formData.password} onChange={handleInputChange} placeholder={showEditModal ? "Leave blank to keep" : "Secure password..."} className="w-full bg-black/50 rounded-xl p-3.5 text-sm font-mono border border-white/10 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all placeholder:text-slate-600" required={showCreateModal}/>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 block">Biography Data</label>
                    <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows="2" className="w-full bg-black/50 rounded-xl p-3.5 text-sm border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none transition-all custom-scrollbar" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 block">Clearance Level</label>
                      <select name="role" value={formData.role} onChange={handleInputChange} className="w-full bg-black/50 rounded-xl p-3.5 text-sm font-bold border border-white/10 focus:border-indigo-500 outline-none transition-all appearance-none text-white cursor-pointer">
                        <option value="user" className="bg-[#12121a]">Standard Entity</option>
                        <option value="owner" className="bg-[#12121a] text-pink-400">Administrator</option>
                      </select>
                    </div>
                    {showEditModal && (
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 block">State Override</label>
                        <select name="is_online" value={formData.is_online} onChange={(e) => setFormData({...formData, is_online: e.target.value === 'true'})} className="w-full bg-black/50 rounded-xl p-3.5 text-sm font-bold border border-white/10 focus:border-emerald-500 outline-none transition-all appearance-none text-white cursor-pointer">
                          <option value="false" className="bg-[#12121a]">Force Offline</option>
                          <option value="true" className="bg-[#12121a] text-emerald-400">Force Online</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-white/5">
                  <button type="button" onClick={() => {setShowCreateModal(false); setShowEditModal(false); resetFormData();}} className="flex-1 py-4 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-colors uppercase tracking-widest border border-white/5">Abort</button>
                  <button type="submit" className="flex-[2] py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-white text-xs font-bold transition-transform hover:scale-[1.02] shadow-[0_0_20px_rgba(79,70,229,0.4)] uppercase tracking-widest">
                    {showCreateModal ? 'Initialize' : 'Commit Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete All Messages Confirmation Modal */}
      <AnimatePresence>
        {showDeleteAllModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => !deletingAllMessages && setShowDeleteAllModal(false)}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
              transition={{ type: 'spring', damping: 22, stiffness: 350 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-[#0a0a0f] rounded-[32px] border border-red-500/30 shadow-[0_0_80px_rgba(239,68,68,0.2)] overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-700 via-rose-500 to-red-700" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-red-500/20 blur-3xl pointer-events-none" />
              
              <div className="p-8 text-center relative z-10">
                <motion.div
                  animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-24 h-24 bg-gradient-to-br from-red-500/20 to-red-900/40 border-2 border-red-500/50 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-6 shadow-[0_0_40px_rgba(239,68,68,0.3)] backdrop-blur-md"
                >
                  <MessageSquareX size={48} />
                </motion.div>
                
                <h3 className="font-black text-white text-2xl mb-3 tracking-tight">GLOBAL PURGE</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6 font-mono">
                  Initiating complete eradication of message database. All user communications will be permanently destroyed.
                </p>
                
                <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-4 mb-8 text-left relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                  <p className="text-xs text-red-400 font-black uppercase tracking-widest mb-1.5 flex items-center gap-2">⚠️ CRITICAL WARNING</p>
                  <p className="text-[11px] text-red-300/80 font-mono">This action is <strong>IRREVERSIBLE</strong>. Data from table <code className="bg-black/50 px-1.5 py-0.5 rounded text-red-400 border border-red-500/20">messages</code> will be wiped completely.</p>
                </div>
                
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowDeleteAllModal(false)}
                    disabled={deletingAllMessages}
                    className="flex-[1] py-4 bg-transparent border border-white/10 hover:bg-white/5 rounded-xl text-xs font-bold text-slate-400 uppercase tracking-widest transition-colors disabled:opacity-50"
                  >Abort</button>
                  <button
                    onClick={handleDeleteAllMessages}
                    disabled={deletingAllMessages}
                    className="flex-[2] py-4 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 active:scale-95 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {deletingAllMessages
                      ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Purging...</>
                      : <><Trash2 size={16} /> Execute Purge</>
                    }
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.8);
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default OwnerDashboard;
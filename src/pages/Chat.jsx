import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { supabase } from '../lib/supabase';
import EmojiPicker from 'emoji-picker-react';
import { format, isToday, isYesterday } from 'date-fns';
import {
  MessageCircle, Send, Image, VideoIcon, Mic, MapPin, Smile, MoreVertical,
  Edit3, Trash2, Phone, Users, LogOut, Search, ArrowLeft, EyeOff, Eye, Menu, X, Shield, Lock, Zap, Globe, Activity, Reply, Pin, ShieldAlert, ShieldOff, RefreshCw, Copy, Check, ExternalLink, Radio, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadFile } from '../lib/storage';

const Chat = () => {
  const { user, logout, logoutAllSessions, isOwner, searchUserByUniqueId, getAllUsers, passwordChanged, handlePasswordChangedAck } = useAuth();
  const {
    conversations, currentConversation, messages, loading: chatLoading, getOrCreateConversation,
    selectConversation, sendMessage, editMessage, deleteMessage
  } = useChat();

  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const voiceRecorderRef = useRef(null);

  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSidebar, setShowSidebar] = useState(window.innerWidth >= 768);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sendError, setSendError] = useState('');
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [viewOnceImage, setViewOnceImage] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [showViewOnceHint, setShowViewOnceHint] = useState(false);
  // New State for Copy Feature
  const [copiedId, setCopiedId] = useState(null);

  // Empty State Dashboard Data
  const [globalUsers, setGlobalUsers] = useState([]);
  const [loadingGlobal, setLoadingGlobal] = useState(true);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages, currentConversation]);

  useEffect(() => {
    if (!user || currentConversation) return;

    const fetchGlobalUsers = async () => {
      const res = await getAllUsers();
      if (res.success) {
        const others = res.users.filter(u => u.id !== user?.id);
        const latest = others.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 15);
        setGlobalUsers(latest);
      }
      setLoadingGlobal(false);
    };

    fetchGlobalUsers();

    const channel = supabase
      .channel('global-relay-nodes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, () => fetchGlobalUsers())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' }, () => fetchGlobalUsers())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user, currentConversation, getAllUsers]);

  useEffect(() => {
  const handleResize = () => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    
    if (!mobile) {
      setShowSidebar(true);
    }
  };
  handleResize(); 

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

  const formatMessageTime = (date) => {
    const msgDate = new Date(date);
    if (isToday(msgDate)) return format(msgDate, 'HH:mm');
    if (isYesterday(msgDate)) return 'Yesterday ' + format(msgDate, 'HH:mm');
    return format(msgDate, 'MMM d, HH:mm');
  };

  const formatConversationTime = (date) => {
    if (!date) return '';
    const msgDate = new Date(date);
    if (isToday(msgDate)) return format(msgDate, 'HH:mm');
    if (isYesterday(msgDate)) return 'Yesterday';
    return format(msgDate, 'MMM d');
  };

  // Copy Logic
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Link Detection Logic
  const renderTextWithLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={i} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-indigo-300 underline hover:text-indigo-100 transition-colors inline-flex items-center gap-1"
            onClick={(e) => e.stopPropagation()} // Prevent opening message actions
          >
            {part.length > 30 ? part.substring(0, 30) + '...' : part}
            <ExternalLink size={10} className="mb-1" />
          </a>
        );
      }
      return part;
    });
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && !mediaPreview) return;

    try {
      setSendError('');
      let mediaUrl = null;
      let messageType = 'text';

      if (mediaPreview) {
        const uploadResult = await uploadFile(mediaPreview.file);
        if (uploadResult.success) {
          mediaUrl = uploadResult.url;
          messageType = mediaPreview.type;
          if (isViewOnce && messageType === 'image') {
            messageType = 'image_once';
          }
        } else {
          throw new Error(`Upload failed: ${uploadResult.error}`);
        }
      }

      const result = await sendMessage(
        messageText.trim(),
        messageType,
        mediaUrl,
        replyingTo?.id || null
      );

      if (result.success) {
        setMessageText('');
        setReplyingTo(null);
        setMediaPreview(null);
        setIsViewOnce(false);
      } else {
        throw new Error(result.error || 'Send failed');
      }
    } catch (error) {
      console.error('Send error:', error);
      setSendError(error.message);
      setTimeout(() => setSendError(''), 5000);
    }
  };

  const handleEmojiClick = (emoji) => {
    setMessageText(prev => prev + emoji.emoji);
  };

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setMediaPreview({ url: event.target.result, file, type });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const startRecording = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          const mediaRecorder = new MediaRecorder(stream);
          voiceRecorderRef.current = { mediaRecorder, stream, chunks: [] };
          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              voiceRecorderRef.current.chunks.push(e.data);
            }
          };
          mediaRecorder.onstop = () => {
            const blob = new Blob(voiceRecorderRef.current.chunks, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(blob);
            setMediaPreview({ url: audioUrl, file: blob, type: 'voice' });
            stream.getTracks().forEach(track => track.stop());
          };
          mediaRecorder.start();
          setIsRecording(true);
        })
        .catch((error) => console.error('Error accessing microphone:', error));
    }
  };

  const stopRecording = () => {
    if (voiceRecorderRef.current && isRecording) {
      voiceRecorderRef.current.mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleSearchUser = async (query) => {
    setSearchQuery(query);
    if (!query) { setSearchResults([]); return; }
    setSearching(true);
    const result = await searchUserByUniqueId(query);
    if (result.success && result.users) {
      const filtered = result.users.filter(u => u.id !== user?.id);
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
    setSearching(false);
  };

  const handleStartConversation = async (searchedUser) => {
  try {
    const { data: latestUserData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', searchedUser.id)
      .single();

    if (userError) throw userError;
    const result = await getOrCreateConversation(latestUserData.id);
    
    if (result.success) {

      const updatedConversation = {
        ...result.conversation,
        otherUser: latestUserData 
      };

      selectConversation(updatedConversation);
      setSearchQuery('');
      setSearchResults([]);
      
      if (isMobile) setShowSidebar(false);
    }
  } catch (error) {
    console.error("Link re-initialization failed:", error.message);
  }
};
  const canEdit = (msg) => {
    if (msg.sender_id !== user?.id) return false;
    if (msg.message_type !== 'text') return false;
    if (msg.is_deleted) return false;
    return (Date.now() - new Date(msg.created_at).getTime()) < 60000;
  };

  const handleEditMessage = (message) => {
    setEditModal({ message, newText: message.content });
  };

  const handleConfirmEdit = async () => {
    if (!editModal?.newText.trim() || editModal.newText.trim() === editModal.message.content) {
      setEditModal(null); return;
    }
    const oldContent = editModal.message.content;
    const newStr = editModal.newText.trim();
    const formatted = `📝 Pesan lama: ${oldContent}\n✨ Pesan baru: ${newStr}`;
    await editMessage(editModal.message.id, formatted);
    setEditModal(null);
  };

  const handleDeleteMessage = (message) => setDeleteModal(message);

  const handleConfirmDelete = async () => {
    if (deleteModal) {
      await deleteMessage(deleteModal.id);
      setDeleteModal(null);
    }
  };
  
  const handleOpenViewOnce = (message) => {
    setViewOnceImage({ id: message.id, url: message.media_url });
  };
  
  const handleCloseViewOnce = async () => {
    if (viewOnceImage?.id) {
      await deleteMessage(viewOnceImage.id);
    }
    setViewOnceImage(null);
  };

  const renderMessageContent = (message) => {
    if (message.is_deleted) return <em className="text-white/50 italic flex items-center gap-2"><Trash2 size={14}/> Message deleted</em>;

    switch (message.message_type) {
      case 'image':
        return <img src={message.media_url} alt="Shared" className="rounded-xl w-auto max-h-60 shadow-lg cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setMediaPreview({ url: message.media_url, type: 'image' })} />;
      case 'image_once':
        if (message.sender_id === user.id) {
            return <div className="flex items-center gap-2 text-indigo-300 bg-black/20 p-2 md:p-3 rounded-xl border border-indigo-500/30 text-xs md:text-sm"><EyeOff size={16}/> <span>1x View Photo sent</span></div>;
        }
        return (
            <button onClick={() => handleOpenViewOnce(message)} className="flex items-center gap-3 text-white bg-gradient-to-r from-pink-500 to-indigo-500 p-2 md:p-3 rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold text-xs md:text-sm">
                <Eye size={18}/> <span>View Photo (1x)</span>
            </button>
        );
      case 'video':
        return <video src={message.media_url} controls className="rounded-xl w-auto max-h-60 shadow-lg border border-white/10" />;
      case 'voice':
        return <VoiceMessage mediaUrl={message.media_url} />;
      case 'location':
        return (
          <a href={message.content} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-emerald-400 font-medium hover:underline bg-emerald-500/10 p-3 rounded-xl">
            <MapPin size={18} />
            <span>View Location</span>
          </a>
        );
      default:
        return <span className="whitespace-pre-wrap">{renderTextWithLinks(message.content)}</span>;
    }
  };

  return (
    <div className="flex h-[100dvh] bg-[#09090e] text-slate-100 overflow-hidden font-sans selection:bg-indigo-500/30 w-full relative">
      
      {/* Background Animated Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex z-0">
         <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 150, ease: "linear" }} className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-indigo-600/10 blur-[100px]" />
         <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 200, ease: "linear" }} className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className={`w-full md:w-80 lg:w-96 bg-[#0a0a0f]/95 md:bg-[#12121e]/80 backdrop-blur-3xl border-r border-indigo-500/10 flex flex-col absolute md:relative z-[60] h-[100dvh] shadow-2xl`}
          >
            {/* Header */}
            <div className="p-3 md:p-4 border-b border-indigo-500/10 bg-white/[0.01] relative overflow-hidden">
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'linear', repeatDelay: 3 }}
                className="absolute top-0 left-0 h-[1px] w-1/3 bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent pointer-events-none"
              />
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)] relative overflow-hidden">
                     <MessageCircle className="text-white relative z-10" size={20} />
                     <div className="absolute inset-0 rounded-xl bg-indigo-500 animate-ping opacity-20"></div>
                   </div>
                   <div>
                     <h1 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-300">LockChat</h1>
                     <p className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold mt-0.5"><Lock size={8} className="inline mr-1"/>Secure Link</p>
                   </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="flex items-center gap-1.5 h-9 px-3 bg-white/5 hover:bg-indigo-500/20 rounded-xl transition-all border border-white/10 md:hidden text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider"
                  ><X size={14} /> Close</button>
                  {isOwner && <button onClick={() => navigate('/owner')} className="w-9 h-9 bg-pink-500/10 hover:bg-pink-500/20 rounded-xl flex items-center justify-center transition-all border border-pink-500/20 shadow-lg"><Users size={16} className="text-pink-400" /></button>}
                </div>
              </div>
              
              {/* Search Box */}
              <div className="relative group z-50">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400/50 group-focus-within:text-indigo-400 transition-colors" />
                <input type="text" placeholder="Global Search (ID or Name)..." value={searchQuery} onChange={(e) => handleSearchUser(e.target.value)} className="w-full bg-[#050508]/50 border border-indigo-500/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium shadow-inner" />
              </div>
              
              {/* Search Dropdown */}
              <AnimatePresence>
                {searchQuery && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className="fixed left-0 right-0 md:left-auto md:right-auto md:w-80 lg:w-96 top-[130px] bg-[#1a1a2e]/98 backdrop-blur-2xl border border-indigo-500/30 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.95)] z-[200]">
                    {searching ? <div className="p-4 text-center text-indigo-400 text-sm animate-pulse flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div> Scanning Network...</div> :
                      searchResults.length > 0 ? (
                        <div className="max-h-72 overflow-y-auto custom-scrollbar p-1">
                        {searchResults.map((result, i) => (
                          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} key={result.id} onClick={() => handleStartConversation(result)} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-indigo-500/20 transition-all rounded-xl border border-transparent hover:border-indigo-500/30">
                            <div className="relative flex-shrink-0">
                              <img src={result.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${result.username}`} alt={result.username} className="w-11 h-11 rounded-xl object-cover" />
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1a1a2e] ${result.is_online ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm text-white flex items-center gap-2 truncate">{result.username} {result.role === 'owner' && <Shield size={11} className="text-pink-400 flex-shrink-0" />}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-indigo-300 font-mono tracking-wider bg-black/40 px-1.5 py-0.5 rounded border border-indigo-500/20">{result.unique_id}</span>
                                <span className={`text-[9px] font-bold uppercase ${result.is_online ? 'text-emerald-400' : 'text-slate-500'}`}>{result.is_online ? '● online' : 'offline'}</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        </div>
                      ) : <div className="p-5 text-center text-rose-400 text-xs font-bold uppercase tracking-widest bg-rose-500/5"><Search size={24} className="mx-auto mb-2 opacity-50"/> No Match Found on Global Network</div>
                    }
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Conversations */}
            <div className="flex-1 overflow-y-auto p-2 md:p-3 space-y-1 custom-scrollbar z-10 relative">
              {conversations.length === 0 && !searchQuery ? (
                 <div className="h-[80%] flex flex-col items-center justify-center text-center opacity-60 px-4">
                    <MessageCircle size={40} className="mb-3 text-indigo-500/40" />
                    <p className="text-sm font-semibold text-slate-400">No active links</p>
                    <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest text-center max-w-[200px]">Use Global Search to find secure nodes</p>
                 </div>
              ) : null}

              {conversations.map((conv, i) => (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} key={conv.id} onClick={() => { selectConversation(conv); if (isMobile) setShowSidebar(false); }} className={`group flex items-center gap-3 p-2.5 rounded-[20px] cursor-pointer transition-all duration-300 border ${currentConversation?.id === conv.id ? 'bg-gradient-to-r from-indigo-500/10 to-transparent border-l-2 border-l-indigo-500 border-y-transparent border-r-transparent' : 'border-transparent hover:bg-white/[0.02]'}`}>
                  <div className="relative">
                    <img src={conv.otherUser?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${conv.otherUser?.username}`} alt={conv.otherUser?.username} className="w-12 h-12 rounded-[18px] object-cover shadow-inner" />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#12121e] md:border-[#0a0a0f] transition-colors ${conv.otherUser?.is_online ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]' : 'bg-slate-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className={`font-bold text-[13px] md:text-sm truncate ${currentConversation?.id === conv.id ? 'text-indigo-400' : 'text-slate-200 group-hover:text-white'}`}>{conv.otherUser?.username}</span>
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest whitespace-nowrap ml-2">{formatConversationTime(conv.lastMessage?.created_at)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[12px] text-slate-400 truncate pr-2 font-medium">{conv.lastMessage?.content || <span className="italic opacity-50">Encrypted link established</span>}</span>
                      {conv.unreadCount > 0 && <span className="min-w-[18px] h-[18px] bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full text-[9px] font-black text-white flex items-center justify-center px-1 shadow-[0_0_10px_rgba(99,102,241,0.5)]">{conv.unreadCount}</span>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Bottom Current User Profile */}
            <div className="px-3 pb-3 pt-2 bg-gradient-to-t from-[#050508] to-transparent z-20 space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <motion.div animate={{ scale: [1,1.3,1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  <span className="text-[9px] text-emerald-400/80 font-bold uppercase tracking-widest">
                    {conversations.filter(c => c.otherUser?.is_online).length} online
                  </span>
                </div>
                <span className="text-[9px] text-slate-600 font-mono">{conversations.length} link{conversations.length !== 1 ? 's' : ''}</span>
              </div>

              <button
                onClick={logoutAllSessions}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-amber-500/8 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 rounded-xl text-amber-400 text-[10px] font-bold uppercase tracking-widest transition-all group"
                title="Keluar dari semua sesi aktif"
              >
                <ShieldOff size={12} className="group-hover:animate-pulse" />
                Logout Semua Sesi
              </button>

              <div className="bg-[#12121e] border border-white/5 p-2 rounded-[20px] flex items-center justify-between shadow-xl hover:border-indigo-500/20 transition-colors">
                <div className="flex items-center gap-3 min-w-0 pr-2 pl-1">
                   <div className="relative">
                     <img src={user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}`} className="w-10 h-10 rounded-[14px] border border-indigo-500/20 object-cover flex-shrink-0"/>
                     <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#12121e] bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                   </div>
                   <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="text-[13px] font-bold truncate text-white leading-tight">{user?.username}</div>
                      <div className="text-[9px] text-indigo-400 font-mono tracking-widest uppercase truncate mt-0.5 flex items-center gap-1">
                        <span className="text-emerald-400/70">●</span> {user?.unique_id}
                      </div>
                   </div>
                </div>
                <button onClick={logout} className="w-10 h-10 flex-shrink-0 bg-red-500/5 hover:bg-red-500/20 rounded-xl text-red-500 flex items-center justify-center transition-colors" title="Disconnect">
                  <LogOut size={16} className="translate-x-[-1px]"/>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container Area */}
      <div className={`flex-1 flex flex-col relative transition-all duration-300 z-10 h-[100dvh] overflow-hidden`}>
        
        {/* Mobile Menu Button - Only shown on Home screen now */}
        {isMobile && !showSidebar && !currentConversation && (
           <div className="absolute top-4 left-4 z-[55]">
             <button
               onClick={() => setShowSidebar(true)}
               className="flex items-center gap-2 h-13 px-3 bg-black/60 backdrop-blur-3xl border border-white/15 rounded-xl text-white shadow-2xl hover:bg-white/10 transition-colors"
             >
               <Menu size={25} />
               <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Menu</span>
             </button>
           </div>
        )}



        {currentConversation ? (
          <div className="flex flex-col h-full w-full bg-[#0a0a12] relative z-10 overflow-hidden">
            
            {/* Continuous Animated Background */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
               <motion.div animate={{ x:[0,50,0,-50,0], y:[0,-40,20,-20,0] }} transition={{ repeat:Infinity, duration:20, ease:'easeInOut' }} className="absolute top-[5%] left-[5%] w-[35vw] h-[35vw] rounded-full bg-indigo-600/12 blur-[90px]" />
               <motion.div animate={{ x:[0,-30,25,-15,0], y:[0,30,-25,15,0] }} transition={{ repeat:Infinity, duration:25, ease:'easeInOut' }} className="absolute bottom-[10%] right-[5%] w-[30vw] h-[30vw] rounded-full bg-pink-600/10 blur-[80px]" />
               <motion.div animate={{ x:[0,20,-20,10,0] }} transition={{ repeat:Infinity, duration:18, ease:'easeInOut' }} className="absolute top-[45%] left-[40%] w-[20vw] h-[20vw] rounded-full bg-purple-500/6 blur-[70px]" />
               <motion.div animate={{ scale:[1,1.8,1] }} transition={{ repeat:Infinity, duration:3.5, ease:'easeInOut' }} className="absolute top-[30%] left-[15%] w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,1)] opacity-60" />
               <motion.div animate={{ scale:[1,2,1] }} transition={{ repeat:Infinity, duration:4, ease:'easeInOut', delay:1.2 }} className="absolute top-[65%] right-[20%] w-1 h-1 rounded-full bg-pink-400 shadow-[0_0_12px_rgba(236,72,153,1)] opacity-50" />
               <motion.div animate={{ scale:[1,1.5,1] }} transition={{ repeat:Infinity, duration:5.5, ease:'easeInOut', delay:2 }} className="absolute top-[20%] right-[28%] w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)] opacity-40" />
               <div className="absolute inset-0 opacity-15" style={{backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(99,102,241,0.04) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(99,102,241,0.04) 40px)'}} />
            </div>

            {/* Chat Header */}
   
<div className="px-3 md:px-5 pt-16 pb-4 md:py-3 bg-[#0a0a10]/95 backdrop-blur-xl border-b border-indigo-500/10 flex items-center justify-between gap-2 z-20 shadow-md sticky top-0">
  
  <div className="flex items-center gap-2 mt-3 md:mt-0"> {/* mt-2 untuk tambahan jarak internal */}
      {/* Tombol Back */}
      <button 
        onClick={() => { selectConversation(null); if (isMobile) setShowSidebar(false); }} 
        className="w-10 h-10 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all text-slate-300 flex-shrink-0"
      >
        <ArrowLeft size={20} />
      </button>

      {/* Profile Info */}
      <div className="flex items-center gap-3 cursor-pointer group">
        <div className="relative flex-shrink-0">
          <img 
            src={currentConversation.otherUser?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${currentConversation.otherUser?.username}`} 
            alt={currentConversation.otherUser?.username} 
            className="w-11 h-11 md:w-10 md:h-10 rounded-xl object-cover ring-1 ring-white/10 group-hover:ring-indigo-500/50 transition-all shadow-lg" 
          />
          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0a0a12] ${currentConversation.otherUser?.is_online ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-500'}`} />
        </div>
        <div className="min-w-0">
          <div className="font-extrabold text-slate-100 text-[15px] md:text-[14px] truncate max-w-[140px] leading-tight">
            {currentConversation.otherUser?.username}
          </div>
          <div className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${currentConversation.otherUser?.is_online ? 'text-emerald-400' : 'text-slate-500'}`}>
            {currentConversation.otherUser?.is_online ? '● Online' : 'Offline'}
          </div>
        </div>
      </div>
  </div>

  {/* Action Buttons */}
  <div className="flex items-center gap-1.5 mt-2 md:mt-0">
    <button className="w-10 h-10 bg-indigo-500/5 hover:bg-indigo-500/20 border border-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 transition-colors">
      <Phone size={16} />
    </button>
    <button className="w-10 h-10 bg-indigo-500/5 hover:bg-indigo-500/20 border border-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 transition-colors">
      <VideoIcon size={16} />
    </button>
    <button className="w-10 h-10 bg-indigo-500/5 hover:bg-indigo-500/20 border border-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 transition-colors">
      <MoreVertical size={16} />
    </button>
  </div>
</div>
            {/* Messages Output */}
            <div className="flex-1 overflow-y-auto px-3 md:px-8 py-4 flex flex-col gap-3 relative z-10 custom-scrollbar scroll-smooth">
              
              {/* E2E Encryption Banner - Full */}
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-lg mb-5 mt-3">
                 <div className="bg-amber-500/8 border border-amber-500/25 rounded-2xl px-4 py-3 shadow-[0_4px_20px_rgba(245,158,11,0.07)] backdrop-blur-xl">
                    <div className="flex items-center justify-center gap-2 mb-1.5">
                       <Lock size={13} className="text-amber-400 flex-shrink-0" />
                       <p className="text-[10px] text-amber-400 font-black uppercase tracking-widest">Encrypted Secure Channel</p>
                    </div>
                    <p className="text-[9px] md:text-[10px] text-amber-400/70 font-medium leading-relaxed tracking-wide text-center">
                       🔒 Seluruh pesan, foto, video &amp; suara dienkripsi <strong>End-to-End</strong> oleh sistem keamanan <strong>RAIHAN_OFFICIAL0307 × VISUALCODEPO</strong>. Tidak ada pihak ketiga — termasuk server kami — yang dapat membaca atau menyadap percakapan ini. Pesan Anda aman dari pengintaian, peretasan, dan kebocoran data. Privasi 100% terjaga.
                    </p>
                 </div>
              </motion.div>

              {chatLoading && (
                <div className="m-auto flex flex-col items-center gap-3 opacity-50 my-10">
                   <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                   <span className="text-[10px] font-bold tracking-widest text-indigo-300 uppercase">Syncing Node...</span>
                </div>
              )}
              
              {!chatLoading && messages.map((message, i) => (
                <motion.div key={message.id} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: i * 0.02, ease: "easeOut" }} className={`flex gap-2 w-full max-w-[90%] md:max-w-2xl group ${message.sender_id === user.id ? 'self-end flex-row-reverse' : 'self-start'}`}>
                  {message.sender_id !== user.id && <img src={message.sender?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${message.sender?.username}`} alt={message.sender?.username} className="w-7 h-7 md:w-8 md:h-8 rounded-[10px] object-cover self-end mb-1 shadow-md flex-shrink-0 ring-1 ring-white/10" />}
                  
                  <div className={`p-3 md:p-3.5 rounded-[20px] relative backdrop-blur-md shadow-lg transition-transform flex flex-col ${message.sender_id === user.id ? 'bg-indigo-600/90 rounded-br-[6px] text-white border border-indigo-500/50' : 'bg-[#1a1a24]/90 border border-white/5 rounded-bl-[6px] text-slate-200'}`}>
                  {message.reply_to && (
    <div 
      className={`mb-2 p-2 rounded-xl border-l-4 text-[11px] cursor-pointer group/reply ${
        message.sender_id === user.id 
        ? 'bg-black/20 border-indigo-300' 
        : 'bg-white/5 border-indigo-500'
      }`}
      onClick={() => {
        const target = document.getElementById(`msg-${message.reply_to}`);
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }}
    >
      <div className="font-bold text-indigo-400 text-[9px] uppercase tracking-tighter">
        Replying to message
      </div>
      <div className="truncate opacity-60 line-clamp-1">
        {messages.find(m => m.id === message.reply_to)?.content || "Media content"}
      </div>
    </div>
  )}


        
        {/* Quick actions popup - Adjusted Spacing */}
<div className={`
  absolute top-1/2 -translate-y-1/2 flex items-center gap-1.5 transition-all duration-300 z-[40]
  ${message.sender_id === user.id 
    ? '-left-[9.8rem] md:-left-[11rem]' // Pesan kita: Geser lebih ke KIRI (menjauh dari bubble)
    : '-right-[5.8rem] md:-right-[7.5rem]' // Pesan orang: Geser lebih ke KANAN
  }
  ${isMobile ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'}
`}>
  {/* Copy Button */}
  <button 
    onClick={(e) => { e.stopPropagation(); handleCopy(message.content, message.id); }} 
    className="w-7.5 h-7.5 rounded-lg bg-[#0a0a10]/90 md:bg-white/10 flex items-center justify-center text-slate-300 backdrop-blur-xl border border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.4)] active:scale-90 transition-transform"
  >
    {copiedId === message.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
  </button>
  
  {/* Reply Button */}
  <button 
    onClick={(e) => { e.stopPropagation(); setReplyingTo(message); }} 
    className="w-7.5 h-7.5 rounded-lg bg-[#0a0a10]/90 md:bg-white/10 flex items-center justify-center text-slate-300 backdrop-blur-xl border border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.4)] active:scale-90 transition-transform"
  >
    <Reply size={11} />
  </button>

  {/* Edit Button */}
  {canEdit(message) && (
    <button 
      onClick={(e) => { e.stopPropagation(); handleEditMessage(message); }} 
      className="w-7.5 h-7.5 rounded-lg bg-indigo-600/40 flex items-center justify-center text-indigo-100 border border-indigo-400/30 shadow-lg active:scale-90 transition-transform"
    >
      <Edit3 size={11} />
    </button>
  )}

  {/* Delete Button */}
  {message.sender_id === user.id && !message.is_deleted && (
    <button 
      onClick={(e) => { e.stopPropagation(); handleDeleteMessage(message); }} 
      className="w-7.5 h-7.5 rounded-lg bg-red-600/40 flex items-center justify-center text-red-100 border border-red-400/30 shadow-lg active:scale-90 transition-transform"
    >
      <Trash2 size={11} />
    </button>
  )}
</div>
        
        {message.sender_id !== user.id && <div className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">{message.sender?.username}</div>}
        <div className="text-[13px] md:text-[14px] leading-relaxed break-words font-medium">{renderMessageContent(message)}</div>
        
        <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] md:text-[10px] font-bold tracking-widest ${message.sender_id === user.id ? 'text-indigo-200/70' : 'text-slate-500'}`}>
          <span>{formatMessageTime(message.created_at)}</span>
          {message.is_edited && <span className="opacity-60">• edited</span>}
        </div>
      </div>
    </motion.div>
  ))}
  <div ref={messagesEndRef} className="pb-1" />
</div>

            {/* Compact Fast Action Bar */}
            <div className="px-3 py-1.5 bg-transparent z-20 flex gap-2 overflow-x-auto custom-scrollbar opacity-70 hover:opacity-100 transition-opacity">
               <button className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-indigo-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-300 transition-colors border border-white/5 flex-shrink-0"><MapPin size={10}/> Location</button>
               {replyingTo && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-indigo-300 border border-indigo-500/30 flex-shrink-0">
                     <Reply size={10}/> Replying: <span className="truncate max-w-[100px] lowercase font-mono">{replyingTo.content.substring(0,15)}</span>
                     <button onClick={() => setReplyingTo(null)} className="ml-1 text-indigo-300 hover:text-white"><X size={12}/></button>
                  </div>
               )}
            </div>

            {/* Media Preview before send */}
            <AnimatePresence>
              {mediaPreview && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-20 left-3 md:left-6 z-[60]">
                  <div className="bg-[#12121e]/95 backdrop-blur-2xl border border-white/10 rounded-[20px] p-2 shadow-2xl relative">
                    <button onClick={() => setMediaPreview(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 hover:bg-rose-600 rounded-full flex items-center justify-center text-white shadow-lg transition-colors z-10"><X size={12} /></button>
                    {mediaPreview.type === 'image' && <img src={mediaPreview.url} alt="Preview" className="h-24 md:h-32 rounded-[14px] object-cover" />}
                    {mediaPreview.type === 'video' && <video src={mediaPreview.url} controls className="h-24 md:h-32 rounded-[14px]" />}
                    {mediaPreview.type === 'voice' && <audio src={mediaPreview.url} controls className="h-10 w-[180px]" />}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {sendError && <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.5)] z-50 whitespace-nowrap animate-bounce">{sendError}</div>}
            
          {/* Input Form Wrapper - FIXED FOR MOBILE BOTTOM */}
<div className="px-2 md:px-4 py-2 md:py-3 bg-[#0a0a10]/95 backdrop-blur-xl border-t border-white/5 relative z-20 w-full safe-bottom">
  <div className="max-w-5xl mx-auto flex items-end gap-1 md:gap-2 bg-[#14141e] border border-white/5 rounded-[20px] md:rounded-[24px] p-1 shadow-2xl focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
    
    <div className="flex gap-0.5 pb-1 pl-1">
      <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="w-9 h-9 flex items-center justify-center text-indigo-400 hover:bg-white/5 rounded-full transition-colors flex-shrink-0"><Smile size={20} /></button>
      <button onClick={() => fileInputRef.current?.click()} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:bg-white/5 rounded-full transition-colors flex-shrink-0"><Image size={20} /></button>
    </div>
    
    <textarea 
      rows={1}
      style={{ height: 'auto' }}
      placeholder="Type message..." 
      value={messageText} 
      onChange={(e) => setMessageText(e.target.value)} 
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) { 
          e.preventDefault(); 
          handleSendMessage(); 
        }
      }} 
      className="flex-1 bg-transparent text-[14px] md:text-[15px] font-medium text-slate-200 placeholder:text-slate-600 outline-none resize-none py-2.5 max-h-[120px] custom-scrollbar overflow-y-auto" 
    />
    
    <div className="flex items-center gap-1 pb-1 pr-1">
      <button 
  onClick={() => {
    const newState = !isViewOnce;
    setIsViewOnce(newState);
    if (newState) {
      setShowViewOnceHint(true);
      // Popup otomatis hilang setelah 4 detik
      setTimeout(() => setShowViewOnceHint(false), 4000);
    }
  }} 
  className={`h-9 px-2.5 flex items-center gap-1.5 justify-center rounded-xl text-[10px] font-black tracking-wider transition-colors border flex-shrink-0 ${isViewOnce ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'text-slate-500 border-transparent hover:bg-white/5'}`}
  title="1x View"
>
    <EyeOff size={14}/> <span className="hidden sm:inline">1x</span>
</button>
      
      <button onMouseDown={startRecording} onMouseUp={stopRecording} onMouseLeave={stopRecording} className={`w-9 h-9 flex items-center justify-center rounded-full transition-all border flex-shrink-0 ${isRecording ? 'bg-red-500 text-white border-red-500 animate-pulse' : 'text-slate-400 border-transparent hover:text-red-400'}`}><Mic size={18} /></button>
      <button onClick={handleSendMessage} disabled={(!messageText.trim() && !mediaPreview) || loadingGlobal} className="w-9 h-9 flex items-center justify-center bg-indigo-500 hover:bg-indigo-400 rounded-xl text-white disabled:opacity-50 transition-all active:scale-90 shadow-lg shadow-indigo-500/20 flex-shrink-0"><Send size={16} /></button>
    </div>
  </div>

<AnimatePresence>
  {showViewOnceHint && (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm"
    >
      <div className="bg-[#0f0f1a]/95 backdrop-blur-2xl border border-rose-500/30 p-4 rounded-[24px] shadow-[0_10px_40px_rgba(225,29,72,0.2)] relative overflow-hidden">
        {/* Glow Decoration */}
        <div className="absolute -top-10 -right-10 w-20 h-20 bg-rose-500/10 blur-2xl rounded-full" />
        
        <div className="flex items-start gap-4 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-500 shrink-0 border border-rose-500/20">
            <EyeOff size={20} />
          </div>
          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-widest mb-1">
              View-Once Protocol Active
            </h4>
            <p className="text-slate-400 text-[11px] leading-relaxed font-medium">
              Pesan 1x lihat telah diaktifkan. Anda dapat mengirim foto yang akan <span className="text-rose-400 font-bold">langsung terhapus</span> dari node jaringan setelah dilihat oleh penerima.
            </p>
            <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
              <span className="text-[8px] font-mono text-indigo-400/60 tracking-tighter uppercase">
                Secured by Raihan_Official0307 × Visualcodepo
              </span>
              <button 
                onClick={() => setShowViewOnceHint(false)}
                className="text-[9px] font-black text-rose-400 uppercase tracking-widest hover:text-rose-300"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>
              
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="absolute bottom-16 left-2 md:left-4 z-[70] shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 rounded-2xl overflow-hidden">
                    <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" skinTonesDisabled />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          
          <div className="flex-1 flex flex-col items-center justify-start md:justify-center p-4 md:p-6 relative z-10 bg-[#050508] w-full min-h-[100dvh] overflow-y-auto custom-scrollbar pt-28 pb-10 md:pt-0">

            {/* Elaborate Animated Background */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-40">
               <div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vw] bg-indigo-500/10 blur-[120px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
               <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] bg-pink-500/10 blur-[100px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '6s' }} />
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)]" />
               <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0covL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgMjAgMTAgTSAxMCAwIEwgMTAgMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
            </div>

            {/* Interconnected Nodes Animation effect */}
            <div className="absolute top-20 md:top-40 left-10 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_15px_indigo] opacity-40 animate-ping" />
            <div className="absolute bottom-40 right-20 w-3 h-3 bg-pink-500 rounded-full shadow-[0_0_15px_pink] opacity-40 animate-ping" style={{ animationDuration: '3s' }} />
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-10" xmlns="http://www.w3.org/2000/svg">
               <line x1="10%" y1="20%" x2="50%" y2="50%" stroke="#6366f1" strokeWidth="1" />
               <line x1="90%" y1="70%" x2="50%" y2="50%" stroke="#ec4899" strokeWidth="1" />
            </svg>

            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: 'spring', damping: 25 }} className="w-full max-w-[1000px] flex flex-col md:flex-row items-center justify-center gap-6 lg:gap-10 relative z-10 my-auto">
               
               {/* Left Intro Card */}
<div className="flex-1 w-full backdrop-blur-2xl bg-[#0a0a0f]/80 border border-white/5 rounded-[32px] p-6 lg:p-10 shadow-2xl relative overflow-hidden group">
  <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
    <Globe className="w-64 h-64 text-indigo-500 animate-[spin_60s_linear_infinite]" />
  </div>

  <div className="flex justify-between items-start mb-6">
    <div className="flex items-center gap-4">
      {/* Icon Shield */}
      <div className="w-23 h-16 bg-white/[0.03] rounded-2xl flex items-center justify-center relative shadow-inner border border-white/5">
        <Shield size={28} className="text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
        <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[8px] px-2 py-0.5 rounded shadow-lg uppercase font-black tracking-widest border border-white/20">V 2.0</div>
      </div>


<button 
  onClick={() => {
  
    console.log("Re-initializing Secure Node...");
    window.location.href = window.location.pathname + window.location.search;
  }} 
  className="group/refresh w-25 h-12 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 transition-all active:scale-90 shadow-lg shadow-indigo-500/5"
  title="Hard Refresh Node"
>
  <RefreshCw size={20} className="group-hover/refresh:rotate-180 transition-transform duration-700 ease-in-out" />Refresh
        
      </button>
    </div>
  </div>
  
  <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-3 tracking-tight text-white leading-tight">
    Global Encrypted<br/>
    <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400">Secure Network</span>
  </h2>
  
  <p className="text-slate-400 text-[13px] md:text-[14px] leading-relaxed mb-8 font-medium">
    Bypass conventional limits. Connect anonymously with users worldwide through military-grade secured nodes.
  </p>
  
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {/* Grid Content Tetap Sama... */}
    <div className="bg-[#12121e]/80 border border-indigo-500/10 p-4 rounded-xl flex items-start gap-3 hover:bg-[#1a1a2e] transition-colors">
        <Lock size={16} className="text-emerald-400 mt-0.5 shrink-0"/>
        <div><div className="text-[11px] font-bold text-white uppercase tracking-wider mb-1">True E2E</div><div className="text-[10px] text-slate-500 font-medium leading-relaxed">No logs. No traces. Total anonymity for your data.</div></div>
    </div>
    <div className="bg-[#12121e]/80 border border-indigo-500/10 p-4 rounded-xl flex items-center justify-between gap-4 hover:bg-[#1a1a2e] transition-all group/card shadow-lg shadow-black/20">
    <div className="flex items-start gap-3">
        <div className="relative shrink-0 mt-1">
            <Menu size={16} className="text-indigo-400 group-hover/card:scale-110 transition-transform relative z-10"/>
            <div className="absolute inset-0 bg-indigo-500/20 blur-md rounded-full animate-pulse" />
        </div>
        <div>
            <div className="text-[11px] font-black text-white uppercase tracking-[0.1em] mb-1 flex items-center gap-2">
                UI Recovery Assistant
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
            </div>
            <div className="text-[10px] text-slate-400 font-bold leading-relaxed max-w-[200px] md:max-w-none">
                Jika <span className="text-indigo-300">Tombol Menu</span> menghilang pada tampilan mobile, silakan tekan tombol refresh untuk memulihkan navigasi.
            </div>
        </div>
    </div>

    {/* TOMBOL REFRESH SEBAGAI FIX MENU */}
    <button 
        onClick={() => window.location.reload()} 
        className="flex-shrink-0 w-12 h-12 bg-indigo-600/10 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-xl flex flex-col items-center justify-center text-indigo-400 transition-all active:scale-75 shadow-xl group/btn"
        title="Restore Navigation Menu"
    >
        <RefreshCw size={18} className="group-hover/btn:rotate-180 transition-transform duration-700 ease-in-out" />
        <span className="text-[7px] font-black mt-1 uppercase tracking-tighter text-indigo-300">Reload</span>
    </button>
</div>
    <div className="bg-[#12121e]/80 border border-rose-500/10 p-4 rounded-xl flex items-start gap-3 hover:bg-[#1a1a2e] transition-colors">
        <EyeOff size={16} className="text-rose-400 mt-0.5 shrink-0"/>
        <div><div className="text-[11px] font-bold text-white uppercase tracking-wider mb-1">1x View Protocol</div><div className="text-[10px] text-slate-500 font-medium leading-relaxed">Photos vanish from servers after being viewed once.</div></div>
    </div>
    <div className="bg-[#12121e]/80 border border-amber-500/10 p-4 rounded-xl flex items-start gap-3 sm:col-span-2 hover:bg-[#1a1a2e] transition-colors">
        <Zap size={16} className="text-amber-400 mt-0.5 shrink-0"/>
        <div><div className="text-[11px] font-bold text-white uppercase tracking-wider mb-1">Hyper Syne Sync</div><div className="text-[10px] text-slate-500 font-medium leading-relaxed">Message latency reduced by realtime WebSocket tunneling across global regions.</div></div>
    </div>
  </div>
                  

                  {/* NEW: Interactive Status Widget */}
                  <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                              <Radio className="text-indigo-400 animate-pulse" size={18} />
                          </div>
                          <div>
                              <h4 className="text-xs font-bold text-white">System Status</h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                                  <span className="text-[10px] text-emerald-400 font-semibold uppercase">All Systems Operational</span>
                              </div>
                          </div>
                      </div>
                      <div className="text-right">
                           <div className="text-xs text-slate-400 font-mono">Latency</div>
                           <div className="text-xs font-bold text-white">24ms</div>
                      </div>
                  </div>
               </div>

              {/* Right Quick Global Menu */}
<div className="w-full md:w-80 backdrop-blur-3xl bg-[#12121e]/60 border border-white/5 rounded-[32px] flex flex-col shadow-2xl overflow-hidden h-[450px] shrink-0 border-t border-t-indigo-500/20">
  <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/40 relative">
    <div className="flex items-center gap-2">
      <Globe size={16} className="text-indigo-400" />
      <div>
        <h3 className="font-bold text-white text-[13px]">Global Relay Nodes</h3>
        <p className="text-[9px] text-emerald-400 font-bold tracking-widest uppercase mt-0.5">Live Feed • Top 15</p>
      </div>
    </div>
    <span className="flex h-2 w-2 relative rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse"></span>
  </div>
  
  {/* NEW: Animated Tips Ticker */}
  <div className="bg-indigo-500/5 py-2 px-3 border-b border-white/5 overflow-hidden">
    <motion.div 
      animate={{ x: ['0%', '-100%'] }} 
      transition={{ repeat: Infinity, duration: 20, ease: 'linear' }} 
      className="flex whitespace-nowrap"
    >
      <span className="text-[10px] text-indigo-300 font-medium flex items-center gap-2 mx-4"><Sparkles size={10} className="text-yellow-400"/> Tip: Click a user to start a secure session.</span>
      <span className="text-[10px] text-indigo-300 font-medium flex items-center gap-2 mx-4"><Lock size={10} className="text-emerald-400"/> Tip: Messages are deleted after 1 hour for privacy.</span>
      <span className="text-[10px] text-indigo-300 font-medium flex items-center gap-2 mx-4"><Shield size={10} className="text-rose-400"/> Tip: Use 1x View for sensitive photos.</span>
    </motion.div>
  </div>

  <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
    {loadingGlobal ? (
      <div className="flex justify-center items-center h-full">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    ) : globalUsers.length === 0 ? (
      <div className="p-6 text-center text-slate-500 text-[11px] uppercase tracking-widest">Awaiting Nodes</div>
    ) : (
      <div className="flex flex-col gap-1">
        {globalUsers.map((gUser, i) => (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.1 + (i * 0.05) }} 
            key={gUser.id}
            onClick={() => handleStartConversation(gUser)}
            className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.01] hover:bg-indigo-500/20 border border-transparent hover:border-indigo-500/30 cursor-pointer transition-all hover:scale-[1.02] group"
          >
            <div className="relative">
              <img 
                /* Logic Fallback Avatar agar tidak pernah kosong */
                src={gUser.avatar_url && gUser.avatar_url !== '' 
                  ? gUser.avatar_url 
                  : `https://api.dicebear.com/7.x/initials/svg?seed=${gUser.username}`
                } 
                className="w-10 h-10 rounded-[14px] object-cover ring-1 ring-white/10 group-hover:ring-indigo-500/50 transition-all" 
              />
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#12121e] ${gUser.is_online ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-slate-500'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white text-[13px] truncate flex items-center gap-1 group-hover:text-indigo-300 transition-colors">
                {gUser.username} 
                {gUser.role === 'owner' && <span className="bg-pink-500/20 text-pink-400 text-[8px] px-1 py-[1px] rounded uppercase font-black tracking-tighter">Admin</span>}
              </div>
              <div className="text-[9px] text-indigo-300/60 font-bold font-mono tracking-widest mt-1 bg-black/40 px-1 inline-block rounded border border-white/5">
                {gUser.unique_id}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    )}
  </div>
</div>
            </motion.div>
          </div>
        )}
      </div>

      <input type="file" ref={fileInputRef} accept="image/*" onChange={(e) => handleFileSelect(e, 'image')} className="hidden" />
      <input type="file" ref={videoInputRef} accept="video/*" onChange={(e) => handleFileSelect(e, 'video')} className="hidden" />
      
      {/* 1x View Modal */}
      <AnimatePresence>
        {viewOnceImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl">
             <button onClick={handleCloseViewOnce} className="absolute top-6 right-6 md:top-8 md:right-8 w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-rose-500/50 rounded-full flex items-center justify-center text-white transition-all hover:rotate-90 z-[110]"><X size={20}/></button>
             <div className="p-4 text-center w-full max-w-5xl h-[100dvh] flex flex-col justify-center items-center">
                <p className="text-rose-400 font-bold mb-4 md:mb-6 flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] md:text-xs shadow-black drop-shadow-xl bg-black/50 py-2 px-6 rounded-full border border-rose-500/20"><EyeOff size={16}/> View Once - Secure Image Link</p>
                <img src={viewOnceImage.url} alt="View Once" className="w-auto h-auto max-w-full max-h-[75vh] object-contain rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 select-none touch-none" onContextMenu={(e) => e.preventDefault()} />
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Message Modal */}
      <AnimatePresence>
        {editModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setEditModal(null)}
            className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, y: 50, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 50, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-[#12121e] rounded-[28px] border border-indigo-500/20 shadow-[0_0_80px_rgba(99,102,241,0.2)] overflow-hidden">
              <div className="h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                    <Edit3 size={18}/>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-[16px] leading-tight">Edit Pesan</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-widest font-semibold">Dapat diedit dalam 1 menit pertama</p>
                  </div>
                </div>
                <div className="bg-black/30 rounded-xl p-3 mb-3 border border-white/5">
                  <p className="text-[9px] text-indigo-400 uppercase tracking-widest mb-1.5 font-bold">📝 Pesan Lama</p>
                  <p className="text-[13px] text-slate-400 font-medium break-words leading-relaxed">{editModal.message.content}</p>
                </div>
                <div className="mb-5">
                  <p className="text-[9px] text-emerald-400 uppercase tracking-widest mb-1.5 font-bold">✨ Pesan Baru</p>
                  <textarea
                    value={editModal.newText}
                    onChange={e => setEditModal(prev => ({ ...prev, newText: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleConfirmEdit(); } }}
                    autoFocus rows={3}
                    className="w-full bg-black/40 border border-indigo-500/30 rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-slate-600 outline-none resize-none focus:ring-2 focus:ring-indigo-500/50 transition-all custom-scrollbar"
                    placeholder="Ketik pesan baru..."
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setEditModal(null)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold text-slate-400 transition-colors border border-white/5">Batal</button>
                  <button onClick={handleConfirmEdit} className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-400 rounded-xl text-sm font-bold text-white transition-colors shadow-lg shadow-indigo-500/30 active:scale-95">Simpan ✓</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDeleteModal(null)}
            className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, y: 50, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 50, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-[#12121e] rounded-[28px] border border-red-500/20 shadow-[0_0_60px_rgba(239,68,68,0.15)] overflow-hidden">
              <div className="h-[2px] bg-gradient-to-r from-rose-600 via-red-500 to-rose-600" />
              <div className="p-6 text-center">
                <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-400 mx-auto mb-5">
                  <Trash2 size={28}/>
                </motion.div>
                <h3 className="font-bold text-white text-[17px] mb-2">Hapus Pesan?</h3>
                <p className="text-[12px] text-slate-400 mb-3 leading-relaxed">Pesan ini akan dihapus permanen untuk semua orang dalam percakapan ini.</p>
                {deleteModal.content && !deleteModal.is_deleted && (
                  <div className="bg-black/30 rounded-xl p-2 mb-5 border border-white/5 text-left">
                    <p className="text-[11px] text-slate-500 italic truncate">"{deleteModal.content.substring(0, 70)}{deleteModal.content.length > 70 ? '…' : ''}"</p>
                  </div>
                )}
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setDeleteModal(null)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-sm font-bold text-slate-400 transition-colors">Batal</button>
                  <button onClick={handleConfirmDelete} className="flex-1 py-3 bg-red-500 hover:bg-red-600 active:scale-95 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-red-500/20">Hapus ✓</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

<style>{`
  /* Pastikan container utama menghormati area aman HP */
  :root {
    --sat: env(safe-area-inset-top);
  }

  .chat-header-container {
    /* Padding-top dinamis: Safe area + manual offset */
    padding-top: calc(var(--sat, 0px) + 20px) !important;
  }

  @media (max-width: 768px) {
    .chat-header-container {
      padding-top: calc(var(--sat, 0px) + 40px) !important;
      min-height: 120px;
    }
  }

  /* Perbaikan agar layout tidak melompat saat keyboard muncul */
  .main-viewport {
    height: 100vh;
    height: 100dvh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
    .safe-bottom {
    /* env(safe-area-inset-bottom) akan memberikan jarak hanya jika HP memiliki home bar */
    padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 8px) !important;
  }

  @media (max-width: 768px) {
    /* Pastikan container chat mengisi penuh layar tanpa sisa */
    .main-viewport {
      height: 100dvh !important;
    }
    
    /* Menghilangkan padding yang tidak perlu di mobile wrapper */
    .pb-2.md:pb-3 {
      padding-bottom: 0px !important;
    }
  }
`}</style>

const VoiceMessage = ({ mediaUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (mediaUrl) {
      audioRef.current = new Audio(mediaUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    return () => audioRef.current?.pause(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaUrl]);

  const togglePlay = () => {
    if (audioRef.current) {
      isPlaying ? audioRef.current.pause() : audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="flex items-center gap-2 md:gap-3 p-1 bg-black/40 rounded-full border border-white/5 min-w-[150px] md:min-w-[180px]">
      <button onClick={togglePlay} className="w-8 h-8 md:w-9 md:h-9 flex-shrink-0 bg-indigo-500 hover:bg-indigo-400 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.4)] text-white transition-transform active:scale-95">
        {isPlaying ? <Pause size={12} /> : <Play size={12} className="translate-x-[1px]" />}
      </button>
      <div className="flex items-center gap-1 h-4 md:h-5 flex-1 px-1 md:px-2">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="flex-1 bg-indigo-300/50 rounded-full transition-all duration-150" style={{ height: isPlaying ? `${Math.random() * 80 + 20}%` : '20%'}} />
        ))}
      </div>
    </div>
  );
};

// Custom minimal SVG icons
const Pause = ({ size, className }) => (
   <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}><rect width="4" height="16" x="6" y="4" rx="1"/><rect width="4" height="16" x="14" y="4" rx="1"/></svg>
)
const Play = ({ size, className }) => (
   <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M5 3l14 9-14 9V3z"/></svg>
)



export default Chat;
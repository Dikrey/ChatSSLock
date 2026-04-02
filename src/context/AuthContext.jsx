import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, TABLES } from '../lib/supabase';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const STORAGE_KEY = 'chatsslock_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false); // security alert state

  // Load user from localStorage on mount
  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEY);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // Verify user still exists in database
          const { data, error } = await supabase
            .from(TABLES.USERS)
            .select('*')
            .eq('id', parsedUser.id)
            .single();

          if (error || !data) {
            // User no longer exists, clear storage
            localStorage.removeItem(STORAGE_KEY);
            setUser(null);
          } else {
            // User exists, update with latest data and set online
            await supabase
              .from(TABLES.USERS)
              .update({ is_online: true })
              .eq('id', data.id);

            setUser({ ...data, is_online: true });
            setIsBanned(data.is_banned);
          }
        }
      } catch (error) {
        console.error('Error loading stored user:', error);
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setLoading(false);
      }
    };

    loadStoredUser();

    // Listen to real-time changes for the current user (ban enforcement + password change detection)
    let userChannel;
    const setupRealtime = () => {
      const storedUser = localStorage.getItem(STORAGE_KEY);
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        userChannel = supabase
          .channel('public:users:security')
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: TABLES.USERS, filter: `id=eq.${parsed.id}` },
            (payload) => {
              const updated = payload.new;
              // 1. Ban enforcement
              if (updated.is_banned) {
                supabase.from(TABLES.USERS).update({ is_online: false }).eq('id', parsed.id).then();
                localStorage.removeItem(STORAGE_KEY);
                setUser(null);
                setIsBanned(true);
                return;
              }
              // 2. Password change detection — if password differs from stored
              if (updated.password && updated.password !== parsed.password) {
                // Show password-changed security modal, then force logout
                setPasswordChanged(true);
                return;
              }
              // 3. Force logout flag (set by admin or logout-all-sessions)
              if (updated.force_logout_at && updated.force_logout_at !== parsed.force_logout_at) {
                supabase.from(TABLES.USERS).update({ is_online: false }).eq('id', parsed.id).then();
                localStorage.removeItem(STORAGE_KEY);
                setUser(null);
              }
            }
          )
          .subscribe();
      }
    };
    setupRealtime();

    // Cleanup on unmount - set user offline
    return () => {
      if (userChannel) supabase.removeChannel(userChannel);
      // Removed the offline logic here because strict mode in React unmounts quickly on mount
      // better to rely on beforeunload or ping logic, but skipping for demo purpose to prevent false offline statuses during dev.
    };
  }, []);

  const generateUniqueId = useCallback(() => {
    const prefix = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                   String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const num = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `${prefix}-${num}`;
  }, []);

  const checkUniqueIdExists = useCallback(async (uniqueId) => {
    const { data } = await supabase
      .from(TABLES.USERS)
      .select('id')
      .eq('unique_id', uniqueId)
      .single();
    return !!data;
  }, []);

  const getUniqueId = useCallback(async () => {
    let uniqueId = generateUniqueId();
    while (await checkUniqueIdExists(uniqueId)) {
      uniqueId = generateUniqueId();
    }
    return uniqueId;
  }, [generateUniqueId, checkUniqueIdExists]);

  const login = async (uniqueId, password) => {
    try {
      const cleanId = uniqueId?.trim().toUpperCase();
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .ilike('unique_id', cleanId)
        .eq('password', password)
        .single();

      if (error) {
        console.error("Supabase Login Error:", error);
        throw new Error('Invalid credentials: ' + error.message);
      }
      if (data.is_banned) {
        setIsBanned(true);
        // Don't save banned user to localStorage
        throw new Error('Account has been banned');
      }

      // Update online status
      await supabase
        .from(TABLES.USERS)
        .update({ is_online: true })
        .eq('id', data.id);

      const userWithOnline = { ...data, is_online: true };
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userWithOnline));
      
      setUser(userWithOnline);
      setIsBanned(false);
      return { success: true, user: userWithOnline };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async (userId) => {
    const targetId = userId || user?.id;
    if (targetId) {
      await supabase
        .from(TABLES.USERS)
        .update({ is_online: false })
        .eq('id', targetId);
    }
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setIsBanned(false);
    setPasswordChanged(false);
  };

  // Logout all sessions: stamp force_logout_at so all active sessions detect and auto-logout
  const logoutAllSessions = async () => {
    if (!user) return;
    await supabase
      .from(TABLES.USERS)
      .update({ force_logout_at: new Date().toISOString(), is_online: false })
      .eq('id', user.id);
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  // Called after user clicks OK on the password-changed modal
  const handlePasswordChangedAck = async () => {
    setPasswordChanged(false);
    await logout();
  };

  const createUser = async (username, password, role = 'user', bio = '', avatar_url = '') => {
    try {
      const uniqueId = await getUniqueId();
      
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .insert([{
          unique_id: uniqueId,
          username,
          password,
          role,
          bio,
          avatar_url,
          is_online: false,
          is_banned: false
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, user: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const getAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, users: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const banUser = async (userId) => {
    try {
      const { error } = await supabase
        .from(TABLES.USERS)
        .update({ is_banned: true, is_online: false })
        .eq('id', userId);

      if (error) throw error;
      
      // If banning current user, logout
      if (user && user.id === userId) {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
        setIsBanned(true);
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const unbanUser = async (userId) => {
    try {
      const { error } = await supabase
        .from(TABLES.USERS)
        .update({ is_banned: false })
        .eq('id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const deleteUser = async (userId) => {
    try {
      const { error } = await supabase
        .from(TABLES.USERS)
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
      // If deleting current user, logout
      if (user && user.id === userId) {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateProfile = async (userId, updates) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      
      if (user && user.id === userId) {
        const updatedUser = { ...user, ...data };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
      
      return { success: true, user: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const searchUserByUniqueId = async (query) => {
    try {
      const cleanSearch = query?.trim() || '';
      if (!cleanSearch) return { success: true, users: [] };
      
      // Search by unique_id OR username using Supabase OR filter
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('id, unique_id, username, avatar_url, is_online, bio, role')
        .or(`unique_id.ilike.%${cleanSearch}%,username.ilike.%${cleanSearch}%`)
        .limit(15);

      if (error) throw new Error('Error searching users');
      return { success: true, users: data || [] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const getUserById = async (userId) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { success: true, user: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    isBanned,
    passwordChanged,
    handlePasswordChangedAck,
    login,
    logout,
    logoutAllSessions,
    createUser,
    getAllUsers,
    banUser,
    unbanUser,
    deleteUser,
    updateProfile,
    searchUserByUniqueId,
    getUserById,
    isOwner: user?.role === 'owner'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

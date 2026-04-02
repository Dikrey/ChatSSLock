import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, TABLES } from '../lib/supabase';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get or create conversation with another user
  const getOrCreateConversation = async (otherUserId) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from(TABLES.CONVERSATION_PARTICIPANTS)
        .select(`
          conversation_id,
          conversations:conversation_id (
            id,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id);

      if (existingConv && existingConv.length > 0) {
        // Find conversation with the other user
        for (const conv of existingConv) {
          const { data: otherParticipant } = await supabase
            .from(TABLES.CONVERSATION_PARTICIPANTS)
            .select('user_id')
            .eq('conversation_id', conv.conversation_id)
            .eq('user_id', otherUserId)
            .single();

          if (otherParticipant) {
            const { data: conversation } = await supabase
              .from(TABLES.CONVERSATIONS)
              .select('*')
              .eq('id', conv.conversation_id)
              .single();
            return { success: true, conversation };
          }
        }
      }

      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from(TABLES.CONVERSATIONS)
        .insert([{}])
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      await supabase
        .from(TABLES.CONVERSATION_PARTICIPANTS)
        .insert([
          { conversation_id: newConv.id, user_id: user.id },
          { conversation_id: newConv.id, user_id: otherUserId }
        ]);

      return { success: true, conversation: newConv };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Get all conversations for current user
  const getConversations = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from(TABLES.CONVERSATION_PARTICIPANTS)
        .select(`
          conversation_id,
          conversations:conversation_id (
            id,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      // Get other participants for each conversation
      const conversationsWithParticipants = await Promise.all(
        data.map(async (item) => {
          const { data: participants } = await supabase
            .from(TABLES.CONVERSATION_PARTICIPANTS)
            .select('user_id')
            .eq('conversation_id', item.conversation_id);

          const otherUserId = participants.find(p => p.user_id !== user.id)?.user_id;
          
          if (otherUserId) {
            const { data: otherUser } = await supabase
              .from(TABLES.USERS)
              .select('id, unique_id, username, avatar_url, is_online, bio')
              .eq('id', otherUserId)
              .single();

            // Get last message
            const { data: lastMessage } = await supabase
              .from(TABLES.MESSAGES)
              .select('*')
              .eq('conversation_id', item.conversation_id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            // Get unread count
            const { count } = await supabase
              .from(TABLES.MESSAGES)
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', item.conversation_id)
              .neq('sender_id', user.id);

            return {
              ...item.conversations,
              otherUser,
              lastMessage,
              unreadCount: count || 0
            };
          }
          return null;
        })
      );

      setConversations(conversationsWithParticipants.filter(Boolean));
    } catch (error) {
      console.error('Error getting conversations:', error);
    }
  }, [user]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(TABLES.MESSAGES)
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get user info for each message
      const messagesWithUsers = await Promise.all(
        data.map(async (msg) => {
          const { data: sender } = await supabase
            .from(TABLES.USERS)
            .select('id, unique_id, username, avatar_url')
            .eq('id', msg.sender_id)
            .single();

          // Get reply message if exists
          let replyMessage = null;
          if (msg.reply_to) {
            const { data: reply } = await supabase
              .from(TABLES.MESSAGES)
              .select('content, sender_id')
              .eq('id', msg.reply_to)
              .single();
            replyMessage = reply;
          }

          return { ...msg, sender, replyMessage };
        })
      );

      setMessages(messagesWithUsers);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Send a message
  const sendMessage = async (content, messageType = 'text', mediaUrl = null, replyTo = null) => {
    if (!currentConversation || !user) return { success: false, error: 'Not in conversation' };

    try {
      const { data, error } = await supabase
        .from(TABLES.MESSAGES)
        .insert([{
          conversation_id: currentConversation.id,
          sender_id: user.id,
          content,
          message_type: messageType,
          media_url: mediaUrl,
          reply_to: replyTo,
          is_pinned: false,
          is_edited: false,
          is_deleted: false
        }])
        .select()
        .single();

      if (error) throw error;

      // Update conversation updated_at
      await supabase
        .from(TABLES.CONVERSATIONS)
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentConversation.id);

      // Reload messages
      await loadMessages(currentConversation.id);

      return { success: true, message: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Edit a message
  const editMessage = async (messageId, newContent) => {
    try {
      const { error } = await supabase
        .from(TABLES.MESSAGES)
        .update({ 
          content: newContent, 
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;

      // Reload messages
      if (currentConversation) {
        await loadMessages(currentConversation.id);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Delete a message (soft delete)
  const deleteMessage = async (messageId) => {
    try {
      const { error } = await supabase
        .from(TABLES.MESSAGES)
        .update({ 
          content: 'Message deleted',
          is_deleted: true,
          media_url: null
        })
        .eq('id', messageId);

      if (error) throw error;

      // Reload messages
      if (currentConversation) {
        await loadMessages(currentConversation.id);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Pin/unpin message
  const pinMessage = async (messageId, isPinned) => {
    try {
      const { error } = await supabase
        .from(TABLES.MESSAGES)
        .update({ is_pinned: !isPinned })
        .eq('id', messageId);

      if (error) throw error;

      // Reload messages
      if (currentConversation) {
        await loadMessages(currentConversation.id);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Get pinned messages
  const getPinnedMessages = useCallback(async (conversationId) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.MESSAGES)
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('is_pinned', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, messages: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  // Select conversation
  const selectConversation = async (conversation) => {
    setCurrentConversation(conversation);
    if (conversation) {
      await loadMessages(conversation.id);
    }
  };

  // Subscribe to real-time messages
  useEffect(() => {
    if (!currentConversation?.id) return;

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: TABLES.MESSAGES,
          filter: `conversation_id=eq.${currentConversation.id}`
        },
        async (payload) => {
          // Reload messages when new message arrives
          await loadMessages(currentConversation.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentConversation?.id, loadMessages]);

  // Load conversations on user change
  useEffect(() => {
    if (user) {
      getConversations();
    }
  }, [user, getConversations]);

  const value = {
    conversations,
    currentConversation,
    messages,
    loading,
    getOrCreateConversation,
    getConversations,
    loadMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    pinMessage,
    getPinnedMessages,
    selectConversation
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

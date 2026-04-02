import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database schema will be created via Supabase dashboard
// Tables needed:
// - users: id, unique_id, username, password, role, avatar_url, bio, is_online, is_banned, created_at
// - conversations: id, created_at, updated_at
// - conversation_participants: id, conversation_id, user_id
// - messages: id, conversation_id, sender_id, content, message_type, media_url, reply_to, is_pinned, is_edited, created_at, updated_at

export const TABLES = {
  USERS: 'users',
  CONVERSATIONS: 'conversations',
  CONVERSATION_PARTICIPANTS: 'conversation_participants',
  MESSAGES: 'messages',
};

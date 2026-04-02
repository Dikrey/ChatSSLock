-- Database Schema for ChatSSLock
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unique_id VARCHAR(10) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('owner', 'user')),
  avatar_url TEXT,
  bio TEXT,
  is_online BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation participants table
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'voice', 'location', 'file', 'image_once')),
  media_url TEXT,
  reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_users_unique_id ON users(unique_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Note: Since this app uses a custom authentication system on top of local storage
-- without utilizing Supabase Auth, auth.uid() will be null.
-- For a real production app, you should migrate to Supabase Auth.
-- For this learning project, we allow public read/write, since the client app
-- enforces logic locally.

-- RLS Policies for users
DROP POLICY IF EXISTS "Users can view all users" ON users;
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only owner can insert users" ON users;
CREATE POLICY "Only owner can insert users" ON users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Owner can delete users" ON users;
CREATE POLICY "Owner can delete users" ON users FOR DELETE USING (true);

-- RLS Policies for conversations
DROP POLICY IF EXISTS "Authenticated users can view conversations" ON conversations;
CREATE POLICY "Authenticated users can view conversations" ON conversations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update conversations" ON conversations;
CREATE POLICY "Users can update conversations" ON conversations FOR UPDATE USING (true);

-- RLS Policies for conversation_participants
DROP POLICY IF EXISTS "Participants can view their conversations" ON conversation_participants;
CREATE POLICY "Participants can view their conversations" ON conversation_participants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can join conversations" ON conversation_participants;
CREATE POLICY "Users can join conversations" ON conversation_participants FOR INSERT WITH CHECK (true);

-- RLS Policies for messages
DROP POLICY IF EXISTS "Participants can view messages" ON messages;
CREATE POLICY "Participants can view messages" ON messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own messages" ON messages;
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete own messages" ON messages;
CREATE POLICY "Users can delete own messages" ON messages FOR DELETE USING (true);

-- Create function to generate unique ID
CREATE OR REPLACE FUNCTION generate_unique_id()
RETURNS TRIGGER AS $$
DECLARE
  prefix CHAR(2);
  random_num CHAR(4);
  new_unique_id VARCHAR(10);
BEGIN
  prefix := chr(65 + floor(random() * 26)::int) || chr(65 + floor(random() * 26)::int);
  random_num := floor(random() * 10000)::int::CHAR(4);
  random_num := lpad(random_num, 4, '0');
  new_unique_id := prefix || '-' || random_num;
  
  WHILE EXISTS (SELECT 1 FROM users WHERE unique_id = new_unique_id) LOOP
    random_num := floor(random() * 10000)::int::CHAR(4);
    random_num := lpad(random_num, 4, '0');
    new_unique_id := prefix || '-' || random_num;
  END LOOP;
  
  NEW.unique_id := new_unique_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Storage Setup Ensure bucket exists and has public bypass
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow any user insert media" ON storage.objects;
CREATE POLICY "Allow any user insert media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "Allow any user update media" ON storage.objects;
CREATE POLICY "Allow any user update media" ON storage.objects FOR UPDATE USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Allow any user select media" ON storage.objects;
CREATE POLICY "Allow any user select media" ON storage.objects FOR SELECT USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Allow any user delete media" ON storage.objects;
CREATE POLICY "Allow any user delete media" ON storage.objects FOR DELETE USING (bucket_id = 'media');

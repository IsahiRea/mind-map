-- Multi-User Support Migration
-- Run this SQL in your Supabase SQL Editor
-- This migration adds user ownership and visibility to topics

-- ============================================
-- STEP 1: ADD COLUMNS TO TOPICS TABLE
-- ============================================

-- Add user_id column (nullable initially for migration)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add is_public column (default to false for private topics)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Add index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_topics_user_id ON topics(user_id);

-- Add index for public topics queries
CREATE INDEX IF NOT EXISTS idx_topics_is_public ON topics(is_public) WHERE is_public = true;

-- ============================================
-- STEP 2: CREATE USER_PROFILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(255),
  avatar_url TEXT,
  auth_provider VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read any profile (for displaying topic owner info)
CREATE POLICY "Allow public read access on user_profiles" ON user_profiles
  FOR SELECT USING (true);

-- Users can only insert their own profile
CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 3: UPDATE TOPICS SELECT POLICY
-- ============================================

-- Drop old public read policy
DROP POLICY IF EXISTS "Allow public read access on topics" ON topics;

-- New policy: can read if topic is public OR user owns it
CREATE POLICY "Users can read public topics or their own" ON topics
  FOR SELECT USING (
    is_public = true
    OR user_id = (select auth.uid())
    OR user_id IS NULL  -- Allow reading topics during migration
  );

-- ============================================
-- STEP 4: UPDATE LEARNING_NODES SELECT POLICY
-- ============================================

-- Drop old public read policy
DROP POLICY IF EXISTS "Allow public read access on learning_nodes" ON learning_nodes;

-- New policy: can read nodes if parent topic is public OR user owns topic
CREATE POLICY "Users can read nodes in public or own topics" ON learning_nodes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM topics
      WHERE topics.id = topic_id
      AND (
        topics.is_public = true
        OR topics.user_id = (select auth.uid())
        OR topics.user_id IS NULL  -- Allow reading during migration
      )
    )
  );

-- ============================================
-- STEP 5: UPDATE NODE_CONNECTIONS SELECT POLICY
-- ============================================

-- Drop old public read policy
DROP POLICY IF EXISTS "Allow public read access on node_connections" ON node_connections;

-- New policy: can read connections if parent topic is public OR user owns topic
CREATE POLICY "Users can read connections in public or own topics" ON node_connections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM learning_nodes ln
      JOIN topics t ON t.id = ln.topic_id
      WHERE ln.id = from_node_id
      AND (
        t.is_public = true
        OR t.user_id = (select auth.uid())
        OR t.user_id IS NULL  -- Allow reading during migration
      )
    )
  );

-- ============================================
-- STEP 6: UPDATE VIEW TO INCLUDE NEW COLUMNS
-- ============================================

-- Drop and recreate the view with new columns
DROP VIEW IF EXISTS topics_with_counts;

CREATE VIEW topics_with_counts
WITH (security_invoker = true) AS
SELECT
  t.id,
  t.title,
  t.description,
  t.icon_bg_color,
  t.icon_color,
  t.user_id,
  t.is_public,
  t.created_at,
  t.updated_at,
  COUNT(ln.id)::INTEGER as node_count
FROM topics t
LEFT JOIN learning_nodes ln ON t.id = ln.topic_id
GROUP BY t.id;

-- ============================================
-- MIGRATION HELPER: Assign existing topics to admin
-- ============================================
-- After creating your first user account, run:
-- UPDATE topics SET user_id = '<your-user-id>' WHERE user_id IS NULL;
--
-- To find your user ID, check the auth.users table or run:
-- SELECT id FROM auth.users WHERE email = 'your@email.com';

-- ============================================
-- VERIFY MIGRATION
-- ============================================
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'topics'
ORDER BY ordinal_position;

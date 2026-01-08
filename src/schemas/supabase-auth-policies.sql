-- Secure RLS Policies for User-Owned Data
-- These policies ensure users can only access and modify their own data
-- Applied via Supabase migrations on 2026-01-07

-- ============================================
-- TOPICS TABLE
-- ============================================

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow all insert on topics" ON topics;
DROP POLICY IF EXISTS "Allow all update on topics" ON topics;
DROP POLICY IF EXISTS "Allow all delete on topics" ON topics;
DROP POLICY IF EXISTS "Authenticated users can insert topics" ON topics;
DROP POLICY IF EXISTS "Authenticated users can update topics" ON topics;
DROP POLICY IF EXISTS "Authenticated users can delete topics" ON topics;

-- Secure policies: users can only modify their own topics
CREATE POLICY "Users can insert their own topics" ON topics
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own topics" ON topics
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own topics" ON topics
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- LEARNING_NODES TABLE
-- ============================================

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow all insert on learning_nodes" ON learning_nodes;
DROP POLICY IF EXISTS "Allow all update on learning_nodes" ON learning_nodes;
DROP POLICY IF EXISTS "Allow all delete on learning_nodes" ON learning_nodes;
DROP POLICY IF EXISTS "Authenticated users can insert learning_nodes" ON learning_nodes;
DROP POLICY IF EXISTS "Authenticated users can update learning_nodes" ON learning_nodes;
DROP POLICY IF EXISTS "Authenticated users can delete learning_nodes" ON learning_nodes;

-- Secure policies: users can only modify nodes in topics they own
CREATE POLICY "Users can insert nodes in their own topics" ON learning_nodes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM topics
      WHERE topics.id = topic_id
      AND topics.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update nodes in their own topics" ON learning_nodes
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM topics
      WHERE topics.id = topic_id
      AND topics.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM topics
      WHERE topics.id = topic_id
      AND topics.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete nodes in their own topics" ON learning_nodes
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM topics
      WHERE topics.id = topic_id
      AND topics.user_id = auth.uid()
    )
  );

-- ============================================
-- NODE_CONNECTIONS TABLE
-- ============================================

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow all insert on node_connections" ON node_connections;
DROP POLICY IF EXISTS "Allow all update on node_connections" ON node_connections;
DROP POLICY IF EXISTS "Allow all delete on node_connections" ON node_connections;
DROP POLICY IF EXISTS "Authenticated users can insert node_connections" ON node_connections;
DROP POLICY IF EXISTS "Authenticated users can update node_connections" ON node_connections;
DROP POLICY IF EXISTS "Authenticated users can delete node_connections" ON node_connections;

-- Secure policies: users can only modify connections in topics they own
CREATE POLICY "Users can insert connections in their own topics" ON node_connections
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM learning_nodes ln
      JOIN topics t ON t.id = ln.topic_id
      WHERE ln.id = from_node_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update connections in their own topics" ON node_connections
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM learning_nodes ln
      JOIN topics t ON t.id = ln.topic_id
      WHERE ln.id = from_node_id
      AND t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM learning_nodes ln
      JOIN topics t ON t.id = ln.topic_id
      WHERE ln.id = from_node_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete connections in their own topics" ON node_connections
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM learning_nodes ln
      JOIN topics t ON t.id = ln.topic_id
      WHERE ln.id = from_node_id
      AND t.user_id = auth.uid()
    )
  );

-- ============================================
-- PUBLIC READ ACCESS (unchanged)
-- ============================================
-- These policies allow public read access for visitor mode:
-- - "Allow public read access on topics"
-- - "Allow public read access on learning_nodes"
-- - "Allow public read access on node_connections"

-- ============================================
-- VERIFY POLICIES
-- ============================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('topics', 'learning_nodes', 'node_connections')
ORDER BY tablename, policyname;

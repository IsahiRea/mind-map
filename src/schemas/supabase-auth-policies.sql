-- Update RLS Policies for Authenticated Users
-- Run this SQL in your Supabase SQL Editor to update authentication policies

-- First, drop the existing public write policies
DROP POLICY IF EXISTS "Allow all insert on topics" ON topics;
DROP POLICY IF EXISTS "Allow all update on topics" ON topics;
DROP POLICY IF EXISTS "Allow all delete on topics" ON topics;

DROP POLICY IF EXISTS "Allow all insert on learning_nodes" ON learning_nodes;
DROP POLICY IF EXISTS "Allow all update on learning_nodes" ON learning_nodes;
DROP POLICY IF EXISTS "Allow all delete on learning_nodes" ON learning_nodes;

DROP POLICY IF EXISTS "Allow all insert on node_connections" ON node_connections;
DROP POLICY IF EXISTS "Allow all update on node_connections" ON node_connections;
DROP POLICY IF EXISTS "Allow all delete on node_connections" ON node_connections;

-- Create new authenticated-only write policies
-- Topics: Only authenticated users can create, update, delete
CREATE POLICY "Authenticated users can insert topics" ON topics
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update topics" ON topics
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete topics" ON topics
  FOR DELETE TO authenticated
  USING (true);

-- Learning Nodes: Only authenticated users can create, update, delete
CREATE POLICY "Authenticated users can insert learning_nodes" ON learning_nodes
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update learning_nodes" ON learning_nodes
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete learning_nodes" ON learning_nodes
  FOR DELETE TO authenticated
  USING (true);

-- Node Connections: Only authenticated users can create, update, delete
CREATE POLICY "Authenticated users can insert node_connections" ON node_connections
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update node_connections" ON node_connections
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete node_connections" ON node_connections
  FOR DELETE TO authenticated
  USING (true);

-- Public read access policies remain unchanged
-- These were created in the initial schema:
-- - "Allow public read access on topics"
-- - "Allow public read access on learning_nodes"
-- - "Allow public read access on node_connections"

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('topics', 'learning_nodes', 'node_connections')
ORDER BY tablename, policyname;

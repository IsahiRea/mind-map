-- Mind-Map Application Database Schema
-- Run this SQL in your Supabase SQL Editor

-- IMPORTANT: Security Configuration (Configure in Supabase Dashboard)
-- 1. Enable "Leaked Password Protection" in Authentication > Settings
--    This checks passwords against HaveIBeenPwned.org to prevent compromised passwords

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Topics table
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon_bg_color VARCHAR(50) NOT NULL,
  icon_color VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning nodes table
CREATE TABLE learning_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Node connections table
CREATE TABLE node_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_node_id UUID NOT NULL REFERENCES learning_nodes(id) ON DELETE CASCADE,
  to_node_id UUID NOT NULL REFERENCES learning_nodes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_node_id, to_node_id),
  CHECK (from_node_id != to_node_id)
);

-- Indexes for performance
CREATE INDEX idx_learning_nodes_topic_id ON learning_nodes(topic_id);
CREATE INDEX idx_node_connections_from ON node_connections(from_node_id);
CREATE INDEX idx_node_connections_to ON node_connections(to_node_id);

-- View for topic with node count
-- Using SECURITY INVOKER to respect RLS policies of the querying user
CREATE VIEW topics_with_counts
WITH (security_invoker = true) AS
SELECT
  t.*,
  COUNT(ln.id)::INTEGER as node_count
FROM topics t
LEFT JOIN learning_nodes ln ON t.id = ln.topic_id
GROUP BY t.id;

-- Function to get node connection count
-- Using SECURITY INVOKER to respect RLS policies of the querying user
-- SET search_path prevents SQL injection through schema manipulation
CREATE OR REPLACE FUNCTION get_node_connection_count(node_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM node_connections
  WHERE from_node_id = node_id OR to_node_id = node_id;
$$;

-- Trigger function to update updated_at timestamp
-- SET search_path prevents SQL injection through schema manipulation
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_topics_updated_at
  BEFORE UPDATE ON topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_nodes_updated_at
  BEFORE UPDATE ON learning_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_connections ENABLE ROW LEVEL SECURITY;

-- Public read access (for visitor mode)
CREATE POLICY "Allow public read access on topics" ON topics
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access on learning_nodes" ON learning_nodes
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access on node_connections" ON node_connections
  FOR SELECT USING (true);

-- Public write access (since we don't have auth yet, allow all operations)
-- TODO: Restrict these policies once authentication is implemented
CREATE POLICY "Allow all insert on topics" ON topics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all update on topics" ON topics
  FOR UPDATE USING (true);

CREATE POLICY "Allow all delete on topics" ON topics
  FOR DELETE USING (true);

CREATE POLICY "Allow all insert on learning_nodes" ON learning_nodes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all update on learning_nodes" ON learning_nodes
  FOR UPDATE USING (true);

CREATE POLICY "Allow all delete on learning_nodes" ON learning_nodes
  FOR DELETE USING (true);

CREATE POLICY "Allow all insert on node_connections" ON node_connections
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all update on node_connections" ON node_connections
  FOR UPDATE USING (true);

CREATE POLICY "Allow all delete on node_connections" ON node_connections
  FOR DELETE USING (true);

-- Insert seed data
INSERT INTO topics (title, description, icon_bg_color, icon_color) VALUES
  ('Web Development', 'Learning modern web technologies', 'rgba(59, 130, 246, 0.13)', '#3b82f6'),
  ('Data Science', 'Exploring data analysis and ML', 'rgba(139, 92, 246, 0.13)', '#8b5cf6');

-- Get the topic IDs for seed data
DO $$
DECLARE
  web_dev_id UUID;
  react_basics_id UUID;
  hooks_id UUID;
  advanced_id UUID;
BEGIN
  -- Get Web Development topic ID
  SELECT id INTO web_dev_id FROM topics WHERE title = 'Web Development';

  -- Insert nodes for Web Development
  INSERT INTO learning_nodes (topic_id, title, description, position)
  VALUES
    (web_dev_id, 'React Basics', 'Learned about components, props, and state management. React is a powerful library for building user interfaces.', '{"x": 150, "y": 200}')
  RETURNING id INTO react_basics_id;

  INSERT INTO learning_nodes (topic_id, title, description, position)
  VALUES
    (web_dev_id, 'Hooks', 'Deep dive into useState, useEffect, and custom hooks. These allow functional components to have state and side effects.', '{"x": 400, "y": 180}')
  RETURNING id INTO hooks_id;

  INSERT INTO learning_nodes (topic_id, title, description, position)
  VALUES
    (web_dev_id, 'Advanced Patterns', 'Context API, composition, and performance optimization techniques.', '{"x": 650, "y": 250}')
  RETURNING id INTO advanced_id;

  -- Create connections
  INSERT INTO node_connections (from_node_id, to_node_id)
  VALUES
    (react_basics_id, hooks_id),
    (hooks_id, advanced_id);
END $$;

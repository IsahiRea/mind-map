-- Migration: Explore Public Topics
-- Description: Creates a view for efficiently querying public topics with owner information
-- Date: 2026-01-20

-- =============================================================================
-- VIEW: public_topics_with_owners
-- =============================================================================
-- This view joins topics_with_counts with user_profiles to provide
-- public topics with owner information in a single query.
--
-- Benefits:
-- - Single query instead of two separate queries
-- - Consistent data format for the explore feature
-- - RLS policies on underlying tables still apply
-- =============================================================================

DROP VIEW IF EXISTS public_topics_with_owners;

CREATE VIEW public_topics_with_owners
WITH (security_invoker = true) AS
SELECT
  t.id,
  t.title,
  t.description,
  t.icon_bg_color,
  t.icon_color,
  t.created_at,
  t.user_id,
  t.is_public,
  t.node_count,
  COALESCE(up.display_name, 'Anonymous') AS owner_display_name,
  up.avatar_url AS owner_avatar_url
FROM topics_with_counts t
LEFT JOIN user_profiles up ON t.user_id = up.id
WHERE t.is_public = true;

-- Grant access to authenticated and anonymous users (for visitor mode)
GRANT SELECT ON public_topics_with_owners TO authenticated;
GRANT SELECT ON public_topics_with_owners TO anon;

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON VIEW public_topics_with_owners IS
  'Public topics with owner profile information for the Explore feature';

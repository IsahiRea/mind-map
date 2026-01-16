# PRD: Multi-User Support

## Overview

Transform the mind-map application from a single-owner model to a multi-user platform where anyone can create an account and manage their own topics and mind maps.

**Status**: Planning
**Last Updated**: 2026-01-15

---

## Problem Statement

Currently, the application operates with a single owner and visitor mode. Only one person (the owner) can create and manage topics, while everyone else views content in read-only mode. This limits the application's utility and prevents others from using it for their own learning journeys.

---

## Goals

1. Allow multiple users to create accounts and authenticate
2. Support OAuth login via Google and GitHub (plus existing email/password)
3. Give each user ownership of their own topics and nodes
4. Enable configurable topic visibility (public/private)
5. Provide basic user profiles with name and avatar
6. Design for future sharing features

---

## User Requirements

| Requirement               | Priority | Notes                   |
| ------------------------- | -------- | ----------------------- |
| Google OAuth login        | P0       | Primary auth method     |
| GitHub OAuth login        | P0       | Alternative auth method |
| Email/password login      | P1       | Keep existing method    |
| User owns their topics    | P0       | Core multi-tenancy      |
| Public/private topics     | P0       | Configurable per topic  |
| Basic user profile        | P1       | Name, avatar from OAuth |
| Migrate existing data     | P1       | Assign to first admin   |
| Design for future sharing | P2       | Schema extensibility    |

---

## User Stories

### Authentication

- As a new user, I can sign up with my Google account so I don't need to remember another password
- As a new user, I can sign up with my GitHub account if I prefer
- As a user, I can still use email/password if I don't want OAuth
- As a user, I see my name and avatar in the header after signing in

### Topic Management

- As a user, I can create topics that only I can edit
- As a user, I can choose to make a topic public (viewable by anyone) or private (only me)
- As a user, I can toggle a topic's visibility at any time
- As a user, I can see all my topics (public + private) when signed in

### Visitor Experience

- As a visitor, I can view all public topics from any user
- As a visitor, I cannot see private topics
- As a visitor, I cannot edit any topics (read-only mode)

### Profile

- As a user, I can see my profile with name and avatar from OAuth
- As a user, I can update my display name

---

## Technical Requirements

### Database Schema Changes

**Add to `topics` table:**

```sql
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
is_public BOOLEAN DEFAULT false
```

**New `user_profiles` table:**

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  avatar_url TEXT,
  auth_provider VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### RLS Policy Updates

**Topics SELECT policy:**

- Allow viewing if `is_public = true` OR `user_id = auth.uid()`

**Topics INSERT/UPDATE/DELETE policies:**

- Require `user_id = auth.uid()` (already in supabase-auth-policies.sql)

**Cascade to nodes/connections:**

- Check topic ownership via JOIN to topics table

### OAuth Configuration (Supabase Dashboard)

**Google Provider:**

- Client ID and Client Secret from Google Cloud Console
- Redirect URL: `https://<project>.supabase.co/auth/v1/callback`

**GitHub Provider:**

- Client ID and Client Secret from GitHub Developer Settings
- Redirect URL: `https://<project>.supabase.co/auth/v1/callback`

---

## UI/UX Changes

### AuthModal Enhancements

- Add "Continue with Google" button with Google icon
- Add "Continue with GitHub" button with GitHub icon
- Add divider with "OR" text
- Keep existing email/password form below

### Header Updates

- Show user avatar (from OAuth provider) when signed in
- Show display name instead of email
- Add dropdown with "Profile" and "Sign Out" options

### Topic Card Updates

- Add visibility toggle (checkbox or switch)
- Show public/private indicator icon
- Only show toggle for topic owner

### NewTopicModal Updates

- Add "Make this topic public" checkbox
- Default to private

---

## Data Migration Plan

1. Add `user_id` and `is_public` columns to topics table
2. Create first admin user (sign up via OAuth or email)
3. Update existing topics: `SET user_id = <admin_id>, is_public = false`
4. Drop permissive RLS policies from supabase-schema.sql
5. Apply secure RLS policies from supabase-auth-policies.sql
6. Update SELECT policies to respect `is_public` flag

---

## Implementation Phases

### Phase 1: Database Foundation

- [ ] Run migration to add `user_id` and `is_public` to topics
- [ ] Create `user_profiles` table
- [ ] Update RLS policies for visibility
- [ ] Add database indexes for performance
- [ ] Create admin user and migrate existing data

### Phase 2: Supabase OAuth Setup

- [ ] Enable Google provider in Supabase dashboard
- [ ] Enable GitHub provider in Supabase dashboard
- [ ] Configure redirect URLs
- [ ] Test OAuth flow in development

### Phase 3: Auth Service Updates

- [ ] Add `signInWithOAuth(provider)` method to authService
- [ ] Add `signInWithGoogle()` wrapper to useAuth hook
- [ ] Add `signInWithGitHub()` wrapper to useAuth hook
- [ ] Handle OAuth redirect/callback

### Phase 4: User Profile Feature

- [ ] Create `src/features/users/` directory
- [ ] Implement userService.js for profile CRUD
- [ ] Implement useUserProfile hook with auto-creation
- [ ] Create UserProfileModal component
- [ ] Add profile sync on first OAuth login

### Phase 5: Auth UI Updates

- [ ] Add OAuth buttons to AuthModal
- [ ] Add OAuth button styles (Google blue, GitHub dark)
- [ ] Add Google and GitHub SVG icons
- [ ] Update Header with user dropdown and avatar

### Phase 6: Visibility Feature

- [ ] Create VisibilityToggle component
- [ ] Add useTopicVisibility hook
- [ ] Integrate toggle into TopicCard
- [ ] Add checkbox to NewTopicModal
- [ ] Update topicsService to handle is_public

### Phase 7: Testing & Polish

- [ ] Test all authentication flows
- [ ] Test RLS policy enforcement
- [ ] Test visibility toggle functionality
- [ ] Test visitor mode (only public topics visible)
- [ ] Add error handling and loading states

---

## Files to Modify

### New Files

| File                                                 | Purpose                 |
| ---------------------------------------------------- | ----------------------- |
| `src/schemas/multi-user-migration.sql`               | Database schema changes |
| `src/features/users/services/userService.js`         | User profile CRUD       |
| `src/features/users/hooks/useUserProfile.js`         | Profile management hook |
| `src/features/users/hooks/useTopicVisibility.js`     | Visibility toggle hook  |
| `src/features/users/components/UserProfileModal.jsx` | Edit profile modal      |
| `src/features/users/components/VisibilityToggle.jsx` | Public/private toggle   |
| `src/features/users/index.js`                        | Barrel exports          |
| `src/css/components/UserProfileModal.css`            | Profile modal styles    |
| `src/css/components/VisibilityToggle.css`            | Toggle styles           |
| `src/assets/icons/google.svg`                        | Google icon             |
| `src/assets/icons/github.svg`                        | GitHub icon             |

### Modified Files

| File                                               | Changes                             |
| -------------------------------------------------- | ----------------------------------- |
| `src/features/auth/services/authService.js`        | Add signInWithOAuth method          |
| `src/features/auth/hooks/useAuth.js`               | Add OAuth wrapper methods           |
| `src/features/auth/components/AuthModal.jsx`       | Add OAuth buttons                   |
| `src/css/components/AuthModal.css`                 | Add OAuth button styles             |
| `src/shared/components/Header.jsx`                 | Add user dropdown and profile modal |
| `src/css/components/Header.css`                    | Add dropdown styles                 |
| `src/features/topics/services/topicsService.js`    | Handle is_public field              |
| `src/features/topics/hooks/useTopics.js`           | Add isPublic to transform           |
| `src/features/topics/components/TopicCard.jsx`     | Add VisibilityToggle                |
| `src/features/topics/components/NewTopicModal.jsx` | Add visibility checkbox             |

---

## Security Considerations

1. **RLS Enforcement**: All data access controlled at database level via RLS policies
2. **OAuth Token Security**: Supabase stores tokens in httpOnly cookies (not accessible to JS)
3. **Default Privacy**: Topics default to private (opt-in to public)
4. **Cascading Permissions**: Node/connection access derived from topic ownership
5. **No Password Exposure**: OAuth users don't need to create/manage passwords

---

## Future Extensibility (Sharing)

The schema design allows for future sharing features:

```sql
-- Potential future tables
CREATE TABLE topic_collaborators (
  topic_id UUID REFERENCES topics(id),
  user_id UUID REFERENCES auth.users(id),
  permission VARCHAR(20), -- 'view', 'edit', 'admin'
  UNIQUE(topic_id, user_id)
);

CREATE TABLE topic_share_links (
  topic_id UUID REFERENCES topics(id),
  token VARCHAR(255) UNIQUE,
  expires_at TIMESTAMP
);
```

RLS policies can be extended to check collaborator access.

---

## Success Metrics

- Users can sign up and create accounts via Google/GitHub
- Each user has isolated topic ownership
- Visibility toggle works correctly (public topics visible to all, private only to owner)
- Existing data successfully migrated to admin user
- No regression in visitor mode functionality
- Performance remains acceptable with multi-user RLS policies

---

## Open Questions

1. Should we require email verification for email/password signups?
2. Should there be rate limiting on topic creation per user?
3. Do we need admin tools to manage users or content?

---

## Appendix: OAuth Provider Setup

### Google OAuth Setup

1. Go to Google Cloud Console > APIs & Services > Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `https://<project>.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret to Supabase dashboard

### GitHub OAuth Setup

1. Go to GitHub > Settings > Developer settings > OAuth Apps
2. Create new OAuth App
3. Set Authorization callback URL: `https://<project>.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret to Supabase dashboard

# Multi-User Support Implementation Plan

## Overview

This document outlines the step-by-step implementation plan for adding multi-user support to the mind-map application. For requirements and specifications, see [PRD.md](./PRD.md).

---

## Implementation Phases

### Phase 1: Database Foundation

#### 1.1 Create Migration File

**File**: `src/schemas/multi-user-migration.sql`

```sql
-- Multi-User Support Migration

-- 1. Add columns to topics table
ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- 2. Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  avatar_url TEXT,
  auth_provider VARCHAR(50) NOT NULL DEFAULT 'email',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_topics_user_id ON topics(user_id);
CREATE INDEX IF NOT EXISTS idx_topics_is_public ON topics(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- 4. RLS for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- 5. Update topics SELECT policy for visibility
DROP POLICY IF EXISTS "Allow public read access on topics" ON topics;

CREATE POLICY "View public topics or own topics" ON topics
  FOR SELECT USING (
    is_public = true
    OR user_id = (select auth.uid())
    OR (select auth.uid()) IS NULL AND is_public = true
  );

-- 6. Update learning_nodes SELECT policy
DROP POLICY IF EXISTS "Allow public read access on learning_nodes" ON learning_nodes;

CREATE POLICY "View nodes in accessible topics" ON learning_nodes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM topics
      WHERE topics.id = topic_id
      AND (topics.is_public = true OR topics.user_id = (select auth.uid()))
    )
  );

-- 7. Update node_connections SELECT policy
DROP POLICY IF EXISTS "Allow public read access on node_connections" ON node_connections;

CREATE POLICY "View connections in accessible topics" ON node_connections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM learning_nodes ln
      JOIN topics t ON t.id = ln.topic_id
      WHERE ln.id = from_node_id
      AND (t.is_public = true OR t.user_id = (select auth.uid()))
    )
  );

-- 8. Trigger for user_profiles updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### 1.2 Run Migration

- [ ] Execute SQL in Supabase SQL Editor
- [ ] Verify columns added: `SELECT * FROM topics LIMIT 1;`
- [ ] Verify table created: `SELECT * FROM user_profiles;`

#### 1.3 Migrate Existing Data

```sql
-- After first admin user signs up, run:
UPDATE topics SET user_id = '<admin_user_id>' WHERE user_id IS NULL;
UPDATE topics SET is_public = false WHERE is_public IS NULL;
```

---

### Phase 2: OAuth Configuration (Supabase Dashboard)

#### 2.1 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI:
   ```
   https://<your-project>.supabase.co/auth/v1/callback
   ```
4. Copy Client ID and Client Secret
5. In Supabase Dashboard > Authentication > Providers > Google:
   - Enable Google provider
   - Paste Client ID and Client Secret

#### 2.2 GitHub OAuth Setup

1. Go to GitHub > Settings > Developer settings > OAuth Apps
2. Create new OAuth App
3. Set Authorization callback URL:
   ```
   https://<your-project>.supabase.co/auth/v1/callback
   ```
4. Copy Client ID and Client Secret
5. In Supabase Dashboard > Authentication > Providers > GitHub:
   - Enable GitHub provider
   - Paste Client ID and Client Secret

---

### Phase 3: Auth Layer Updates

#### 3.1 Update authService.js

**File**: `src/features/auth/services/authService.js`

Add after existing methods:

```javascript
/**
 * Sign in with OAuth provider (Google or GitHub)
 * @param {'google' | 'github'} provider - OAuth provider
 * @returns {Promise<Object>} OAuth redirect data
 */
async signInWithOAuth(provider) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin,
    },
  })

  if (error) throw error
  return data
},
```

#### 3.2 Update useAuth.js

**File**: `src/features/auth/hooks/useAuth.js`

Add wrapper functions:

```javascript
async function signInWithGoogle() {
  try {
    setLoading(true)
    setError(null)
    await authService.signInWithOAuth('google')
  } catch (err) {
    setError(err.message)
    throw err
  } finally {
    setLoading(false)
  }
}

async function signInWithGitHub() {
  try {
    setLoading(true)
    setError(null)
    await authService.signInWithOAuth('github')
  } catch (err) {
    setError(err.message)
    throw err
  } finally {
    setLoading(false)
  }
}

// Add to return statement:
return {
  // ...existing
  signInWithGoogle,
  signInWithGitHub,
}
```

#### 3.3 Update AuthModal.jsx

**File**: `src/features/auth/components/AuthModal.jsx`

Add OAuth buttons above existing form:

```jsx
import googleIcon from '../../../assets/icons/google.svg'
import githubIcon from '../../../assets/icons/github.svg'

// In component:
const { signIn, signInWithGoogle, signInWithGitHub, loading } = useAuth()

// In JSX (before form):
<div className="auth-modal-oauth">
  <button
    type="button"
    className="auth-oauth-btn auth-oauth-google"
    onClick={signInWithGoogle}
    disabled={loading}
  >
    <img src={googleIcon} alt="" />
    <span>Continue with Google</span>
  </button>
  <button
    type="button"
    className="auth-oauth-btn auth-oauth-github"
    onClick={signInWithGitHub}
    disabled={loading}
  >
    <img src={githubIcon} alt="" />
    <span>Continue with GitHub</span>
  </button>
</div>

<div className="auth-modal-divider">
  <span>or</span>
</div>

{/* existing form */}
```

#### 3.4 Add OAuth Icons

**Files**:

- `src/assets/icons/google.svg`
- `src/assets/icons/github.svg`

#### 3.5 Update AuthModal.css

**File**: `src/css/components/AuthModal.css`

```css
.auth-modal-oauth {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.auth-oauth-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 24px;
  border: 1px solid var(--color-border-default);
  border-radius: 8px;
  background: var(--color-card-bg);
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.auth-oauth-btn:hover:not(:disabled) {
  background: var(--color-bg-secondary);
  border-color: var(--color-border-hover);
}

.auth-oauth-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-oauth-btn img {
  width: 20px;
  height: 20px;
}

.auth-modal-divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 24px 0;
  color: var(--color-text-tertiary);
  font-size: 12px;
  text-transform: uppercase;
}

.auth-modal-divider::before,
.auth-modal-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border-default);
}
```

---

### Phase 4: User Profile Feature

#### 4.1 Create Directory Structure

```
src/features/users/
├── services/
│   └── userService.js
├── hooks/
│   ├── useUserProfile.js
│   └── useTopicVisibility.js
├── components/
│   ├── UserProfileModal.jsx
│   └── VisibilityToggle.jsx
└── index.js
```

#### 4.2 Implement userService.js

**File**: `src/features/users/services/userService.js`

```javascript
import { supabase } from '../../../lib/supabase'

export const userService = {
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async createProfile({ userId, name, avatarUrl, provider }) {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([
        {
          user_id: userId,
          name,
          avatar_url: avatarUrl,
          auth_provider: provider,
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ name: updates.name })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async syncFromAuth(authUser) {
    const existing = await this.getProfile(authUser.id)
    if (existing) return existing

    return await this.createProfile({
      userId: authUser.id,
      name:
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.email?.split('@')[0],
      avatarUrl: authUser.user_metadata?.avatar_url,
      provider: authUser.app_metadata?.provider || 'email',
    })
  },
}
```

#### 4.3 Implement useUserProfile.js

**File**: `src/features/users/hooks/useUserProfile.js`

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '../../auth'
import { userService } from '../services/userService'

export function useUserProfile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => userService.getProfile(user.id),
    enabled: !!user,
  })

  // Auto-create profile on first sign-in
  useEffect(() => {
    if (user && !isLoading && !profile && !error) {
      userService.syncFromAuth(user).then(newProfile => {
        queryClient.setQueryData(['userProfile', user.id], newProfile)
      })
    }
  }, [user, profile, isLoading, error, queryClient])

  const updateMutation = useMutation({
    mutationFn: updates => userService.updateProfile(user.id, updates),
    onSuccess: updated => {
      queryClient.setQueryData(['userProfile', user.id], updated)
    },
  })

  return {
    profile,
    loading: isLoading,
    error: error?.message || null,
    updateProfile: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  }
}
```

#### 4.4 Implement useTopicVisibility.js

**File**: `src/features/users/hooks/useTopicVisibility.js`

```javascript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'

export function useTopicVisibility() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ topicId, isPublic }) => {
      const { data, error } = await supabase
        .from('topics')
        .update({ is_public: isPublic })
        .eq('id', topicId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: updated => {
      queryClient.setQueryData(
        ['topics'],
        old =>
          old?.map(t => (t.id === updated.id ? { ...t, isPublic: updated.is_public } : t)) || []
      )
    },
  })

  return {
    updateVisibility: mutation.mutateAsync,
    loading: mutation.isPending,
  }
}
```

#### 4.5 Implement VisibilityToggle.jsx

**File**: `src/features/users/components/VisibilityToggle.jsx`

```jsx
import { useState } from 'react'
import { useTopicVisibility } from '../hooks/useTopicVisibility'
import '../../../css/components/VisibilityToggle.css'

export default function VisibilityToggle({ topicId, isPublic, disabled }) {
  const [checked, setChecked] = useState(isPublic)
  const { updateVisibility, loading } = useTopicVisibility()

  const handleToggle = async () => {
    const newValue = !checked
    try {
      setChecked(newValue)
      await updateVisibility({ topicId, isPublic: newValue })
    } catch (error) {
      console.error('Failed to update visibility:', error)
      setChecked(!newValue) // Revert on error
    }
  }

  return (
    <button
      type="button"
      className={`visibility-toggle ${checked ? 'is-public' : 'is-private'}`}
      onClick={handleToggle}
      disabled={disabled || loading}
      aria-label={checked ? 'Make private' : 'Make public'}
    >
      <span className="visibility-toggle-icon">{checked ? '🌐' : '🔒'}</span>
      <span className="visibility-toggle-label">{checked ? 'Public' : 'Private'}</span>
    </button>
  )
}
```

#### 4.6 Implement UserProfileModal.jsx

**File**: `src/features/users/components/UserProfileModal.jsx`

```jsx
import { useState, useEffect } from 'react'
import { useUserProfile } from '../hooks/useUserProfile'
import { useAuth } from '../../auth'
import { Modal, Input } from '../../../shared'
import xIcon from '../../../assets/icons/x.svg'
import '../../../css/components/UserProfileModal.css'

export default function UserProfileModal({ isOpen, onClose }) {
  const { user } = useAuth()
  const { profile, updateProfile, loading, isUpdating } = useUserProfile()
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
    }
  }, [profile])

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      setError('')
      await updateProfile({ name })
      onClose()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="user-profile-modal">
        <button className="user-profile-close" onClick={onClose}>
          <img src={xIcon} alt="Close" />
        </button>

        <div className="user-profile-header">
          {user?.user_metadata?.avatar_url && (
            <img src={user.user_metadata.avatar_url} alt="" className="user-profile-avatar" />
          )}
          <h2>Your Profile</h2>
          {profile?.auth_provider && (
            <p className="user-profile-provider">Signed in with {profile.auth_provider}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="user-profile-form">
          {error && <div className="user-profile-error">{error}</div>}

          <Input
            label="Display Name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            disabled={loading || isUpdating}
          />

          <Input label="Email" value={user?.email || ''} disabled readOnly />

          <button type="submit" className="user-profile-submit" disabled={isUpdating || loading}>
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </Modal>
  )
}
```

#### 4.7 Create Barrel Export

**File**: `src/features/users/index.js`

```javascript
export { default as UserProfileModal } from './components/UserProfileModal'
export { default as VisibilityToggle } from './components/VisibilityToggle'
export { useUserProfile } from './hooks/useUserProfile'
export { useTopicVisibility } from './hooks/useTopicVisibility'
export { userService } from './services/userService'
```

#### 4.8 Add CSS Files

**File**: `src/css/components/VisibilityToggle.css`
**File**: `src/css/components/UserProfileModal.css`

---

### Phase 5: UI Integration

#### 5.1 Update Header.jsx

**File**: `src/shared/components/Header.jsx`

- Import UserProfileModal and useUserProfile
- Add state for profile modal
- Show avatar and name when signed in
- Add dropdown with Profile and Sign Out options

#### 5.2 Update TopicCard.jsx

**File**: `src/features/topics/components/TopicCard.jsx`

- Import VisibilityToggle from users feature
- Add `isPublic` prop
- Show VisibilityToggle for topic owner (not in visitor mode)

#### 5.3 Update NewTopicModal.jsx

**File**: `src/features/topics/components/NewTopicModal.jsx`

- Add `isPublic` state (default: false)
- Add Checkbox for "Make this topic public"
- Pass `isPublic` to create mutation

#### 5.4 Update topicsService.js

**File**: `src/features/topics/services/topicsService.js`

In `create()` method, add:

```javascript
is_public: topic.isPublic || false,
```

In `update()` method, add:

```javascript
if (updates.isPublic !== undefined) {
  updateData.is_public = updates.isPublic
}
```

#### 5.5 Update useTopics.js

**File**: `src/features/topics/hooks/useTopics.js`

In `transformTopic()` function, add:

```javascript
isPublic: topic.is_public || false,
```

---

## File Checklist

### New Files to Create

- [ ] `src/schemas/multi-user-migration.sql`
- [ ] `src/features/users/services/userService.js`
- [ ] `src/features/users/hooks/useUserProfile.js`
- [ ] `src/features/users/hooks/useTopicVisibility.js`
- [ ] `src/features/users/components/UserProfileModal.jsx`
- [ ] `src/features/users/components/VisibilityToggle.jsx`
- [ ] `src/features/users/index.js`
- [ ] `src/css/components/UserProfileModal.css`
- [ ] `src/css/components/VisibilityToggle.css`
- [ ] `src/assets/icons/google.svg`
- [ ] `src/assets/icons/github.svg`

### Files to Modify

- [ ] `src/features/auth/services/authService.js`
- [ ] `src/features/auth/hooks/useAuth.js`
- [ ] `src/features/auth/components/AuthModal.jsx`
- [ ] `src/css/components/AuthModal.css`
- [ ] `src/shared/components/Header.jsx`
- [ ] `src/css/components/Header.css`
- [ ] `src/features/topics/services/topicsService.js`
- [ ] `src/features/topics/hooks/useTopics.js`
- [ ] `src/features/topics/components/TopicCard.jsx`
- [ ] `src/features/topics/components/NewTopicModal.jsx`

---

## Testing Checklist

### Authentication

- [ ] Sign in with Google works
- [ ] Sign in with GitHub works
- [ ] Sign in with email/password still works
- [ ] Sign out works
- [ ] Session persists on page refresh

### User Profile

- [ ] Profile auto-created on first sign-in
- [ ] Avatar displays from OAuth provider
- [ ] Display name shows in header
- [ ] Can update display name
- [ ] Profile modal opens/closes

### Topic Visibility

- [ ] New topics default to private
- [ ] Can toggle topic to public
- [ ] Can toggle topic back to private
- [ ] Public topics visible when signed out
- [ ] Private topics hidden when signed out
- [ ] Own private topics visible when signed in

### RLS Policies

- [ ] Cannot edit another user's topic
- [ ] Cannot delete another user's topic
- [ ] Cannot add nodes to another user's topic
- [ ] Can view public topics from other users

### Data Migration

- [ ] Existing topics assigned to admin user
- [ ] Existing topics default to private
- [ ] All existing nodes/connections preserved

---

## Rollback Plan

If issues arise, rollback in reverse order:

1. **Revert code changes** via git
2. **Restore database** by running:

   ```sql
   -- Remove new columns
   ALTER TABLE topics DROP COLUMN IF EXISTS is_public;
   ALTER TABLE topics DROP COLUMN IF EXISTS user_id;

   -- Drop new table
   DROP TABLE IF EXISTS user_profiles;

   -- Restore original RLS policies
   -- (re-run supabase-schema.sql policies section)
   ```

3. **Disable OAuth providers** in Supabase dashboard

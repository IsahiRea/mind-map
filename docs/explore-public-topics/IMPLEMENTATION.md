# Implementation Guide: Explore Public Topics

This document provides step-by-step implementation details for the Explore Public Topics feature.

---

## Phase 1: Service Layer

### exploreService.js

Location: `src/features/explore/services/exploreService.js`

```javascript
import { supabase } from '../../../lib/supabase'

const PAGE_SIZE = 12

export const exploreService = {
  /**
   * Get paginated public topics with owner info
   * @param {Object} options - Query options
   * @param {string} options.search - Search term for title/description
   * @param {string} options.sortBy - Sort option (newest, oldest, title, nodes)
   * @param {number} options.page - Page number (0-indexed)
   * @returns {Promise<Object>} { topics, hasMore }
   */
  async getPublicTopics({ search = '', sortBy = 'newest', page = 0 } = {}) {
    let query = supabase
      .from('topics')
      .select(
        `
        id, title, description, icon_bg_color, icon_color, created_at, user_id,
        user_profiles!inner(display_name, avatar_url),
        nodes(count)
      `
      )
      .eq('is_public', true)

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply sorting
    switch (sortBy) {
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      case 'title':
        query = query.order('title', { ascending: true })
        break
      case 'nodes':
        // Sort by node count (requires post-processing)
        query = query.order('created_at', { ascending: false })
        break
      default: // newest
        query = query.order('created_at', { ascending: false })
    }

    // Apply pagination
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE
    query = query.range(from, to)

    const { data, error } = await query

    if (error) throw error

    // Transform data and check if more pages exist
    const topics = (data || []).slice(0, PAGE_SIZE).map(transformPublicTopic)
    const hasMore = (data || []).length > PAGE_SIZE

    // Sort by node count if requested
    if (sortBy === 'nodes') {
      topics.sort((a, b) => b.nodeCount - a.nodeCount)
    }

    return { topics, hasMore }
  },

  /**
   * Get a specific user's public topics
   * @param {string} userId - User UUID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} { topics, hasMore }
   */
  async getUserPublicTopics(userId, { sortBy = 'newest', page = 0 } = {}) {
    let query = supabase
      .from('topics')
      .select(
        `
        id, title, description, icon_bg_color, icon_color, created_at, user_id,
        nodes(count)
      `
      )
      .eq('is_public', true)
      .eq('user_id', userId)

    // Apply sorting
    switch (sortBy) {
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      case 'title':
        query = query.order('title', { ascending: true })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    // Apply pagination
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE
    query = query.range(from, to)

    const { data, error } = await query

    if (error) throw error

    const topics = (data || []).slice(0, PAGE_SIZE).map(topic => ({
      id: topic.id,
      title: topic.title,
      description: topic.description,
      iconBgColor: topic.icon_bg_color,
      iconColor: topic.icon_color,
      createdAt: topic.created_at,
      nodeCount: topic.nodes?.[0]?.count || 0,
    }))

    return { topics, hasMore: (data || []).length > PAGE_SIZE }
  },

  /**
   * Get public user profile info
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} User profile
   */
  async getPublicUserProfile(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, avatar_url')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found
        return null
      }
      throw error
    }

    return {
      userId: data.user_id,
      displayName: data.display_name || 'Anonymous',
      avatarUrl: data.avatar_url,
    }
  },
}

/**
 * Transform database topic to component format
 */
function transformPublicTopic(topic) {
  return {
    id: topic.id,
    title: topic.title,
    description: topic.description,
    iconBgColor: topic.icon_bg_color,
    iconColor: topic.icon_color,
    createdAt: topic.created_at,
    nodeCount: topic.nodes?.[0]?.count || 0,
    ownerId: topic.user_id,
    ownerDisplayName: topic.user_profiles?.display_name || 'Anonymous',
    ownerAvatarUrl: topic.user_profiles?.avatar_url || null,
  }
}
```

---

## Phase 2: Hooks

### useInfiniteScroll.js (Shared)

Location: `src/shared/hooks/useInfiniteScroll.js`

```javascript
import { useEffect, useRef, useCallback } from 'react'

/**
 * Hook for infinite scroll detection using IntersectionObserver
 * @param {Function} onLoadMore - Callback when load more is triggered
 * @param {Object} options - Options
 * @param {boolean} options.hasMore - Whether more items exist
 * @param {boolean} options.isLoading - Whether currently loading
 * @returns {Object} { sentinelRef }
 */
export function useInfiniteScroll(onLoadMore, { hasMore, isLoading }) {
  const sentinelRef = useRef(null)
  const observerRef = useRef(null)

  const handleIntersect = useCallback(
    entries => {
      const [entry] = entries
      if (entry.isIntersecting && hasMore && !isLoading) {
        onLoadMore()
      }
    },
    [onLoadMore, hasMore, isLoading]
  )

  useEffect(() => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: '100px',
      threshold: 0,
    })

    // Observe sentinel element
    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [handleIntersect])

  return { sentinelRef }
}
```

### useExploreTopics.js

Location: `src/features/explore/hooks/useExploreTopics.js`

```javascript
import { useInfiniteQuery } from '@tanstack/react-query'
import { exploreService } from '../services/exploreService'

/**
 * Hook for fetching paginated public topics
 * @param {Object} options - Query options
 * @param {string} options.search - Search term
 * @param {string} options.sortBy - Sort option
 * @returns {Object} Query state and methods
 */
export function useExploreTopics({ search = '', sortBy = 'newest' } = {}) {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, error, refetch } =
    useInfiniteQuery({
      queryKey: ['explore-topics', { search, sortBy }],
      queryFn: ({ pageParam = 0 }) =>
        exploreService.getPublicTopics({ search, sortBy, page: pageParam }),
      getNextPageParam: (lastPage, allPages) => (lastPage.hasMore ? allPages.length : undefined),
      staleTime: 5 * 60 * 1000, // 5 minutes
    })

  // Flatten paginated results
  const topics = data?.pages.flatMap(page => page.topics) || []

  return {
    topics,
    isLoading,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage,
    error: error?.message || null,
    refetch,
  }
}
```

### useUserPublicTopics.js

Location: `src/features/explore/hooks/useUserPublicTopics.js`

```javascript
import { useInfiniteQuery } from '@tanstack/react-query'
import { exploreService } from '../services/exploreService'

/**
 * Hook for fetching a user's public topics
 * @param {string} userId - User UUID
 * @param {Object} options - Query options
 * @returns {Object} Query state and methods
 */
export function useUserPublicTopics(userId, { sortBy = 'newest' } = {}) {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, error } =
    useInfiniteQuery({
      queryKey: ['user-public-topics', userId, { sortBy }],
      queryFn: ({ pageParam = 0 }) =>
        exploreService.getUserPublicTopics(userId, { sortBy, page: pageParam }),
      getNextPageParam: (lastPage, allPages) => (lastPage.hasMore ? allPages.length : undefined),
      enabled: !!userId,
      staleTime: 5 * 60 * 1000,
    })

  const topics = data?.pages.flatMap(page => page.topics) || []

  return {
    topics,
    isLoading,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage,
    error: error?.message || null,
  }
}
```

### usePublicUserProfile.js

Location: `src/features/explore/hooks/usePublicUserProfile.js`

```javascript
import { useQuery } from '@tanstack/react-query'
import { exploreService } from '../services/exploreService'

/**
 * Hook for fetching a user's public profile
 * @param {string} userId - User UUID
 * @returns {Object} Query state
 */
export function usePublicUserProfile(userId) {
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['public-user-profile', userId],
    queryFn: () => exploreService.getPublicUserProfile(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })

  return {
    profile,
    isLoading,
    error: error?.message || null,
    notFound: !isLoading && !profile,
  }
}
```

---

## Phase 3: Components

### OwnerBadge.jsx

Location: `src/features/explore/components/OwnerBadge.jsx`

```jsx
import { memo } from 'react'
import { Link } from 'react-router-dom'
import '../../../css/components/OwnerBadge.css'

function OwnerBadge({ userId, displayName, avatarUrl }) {
  return (
    <Link to={`/user/${userId}`} className="owner-badge">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="owner-badge-avatar" />
      ) : (
        <div className="owner-badge-avatar owner-badge-avatar-placeholder">
          {displayName?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
      <span className="owner-badge-name">{displayName || 'Anonymous'}</span>
    </Link>
  )
}

export default memo(OwnerBadge)
```

### ExploreTopicCard.jsx

Location: `src/features/explore/components/ExploreTopicCard.jsx`

```jsx
import { memo } from 'react'
import { Link } from 'react-router-dom'
import OwnerBadge from './OwnerBadge'
import '../../../css/components/ExploreTopicCard.css'

function ExploreTopicCard({
  id,
  title,
  description,
  nodeCount,
  iconBgColor,
  iconColor,
  ownerId,
  ownerDisplayName,
  ownerAvatarUrl,
  style,
}) {
  return (
    <article
      className="explore-topic-card"
      style={{ ...style, '--topic-color': iconColor, '--topic-bg': iconBgColor }}
    >
      <div className="explore-topic-card-inner">
        <header className="explore-topic-card-header">
          <div
            className="explore-topic-icon-wrapper"
            style={{ backgroundColor: iconBgColor, color: iconColor }}
          >
            <svg
              className="explore-topic-icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14.106 5.553C14.3836 5.69172 14.6897 5.76393 15 5.76393C15.3103 5.76393 15.6164 5.69172 15.894 5.553L19.553 3.723C19.7056 3.64676 19.8751 3.61081 20.0455 3.61857C20.2159 3.62633 20.3814 3.67754 20.5265 3.76733C20.6715 3.85712 20.7911 3.98251 20.874 4.13158C20.9569 4.28065 21.0003 4.44844 21 4.619V17.383C20.9999 17.5687 20.9481 17.7506 20.8504 17.9085C20.7528 18.0664 20.6131 18.194 20.447 18.277L15.894 20.554C15.6164 20.6927 15.3103 20.7649 15 20.7649C14.6897 20.7649 14.3836 20.6927 14.106 20.554L9.894 18.448C9.6164 18.3093 9.31033 18.2371 9 18.2371C8.68967 18.2371 8.3836 18.3093 8.106 18.448L4.447 20.278C4.29435 20.3543 4.12472 20.3902 3.95426 20.3824C3.78379 20.3746 3.61816 20.3233 3.47312 20.2334C3.32808 20.1435 3.20846 20.018 3.12565 19.8688C3.04283 19.7196 2.99958 19.5516 3 19.381V6.618C3.0001 6.43234 3.05188 6.25037 3.14955 6.09247C3.24722 5.93458 3.38692 5.80699 3.553 5.724L8.106 3.447C8.3836 3.30828 8.68967 3.23607 9 3.23607C9.31033 3.23607 9.6164 3.30828 9.894 3.447L14.106 5.553Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15 5.764V20.764"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 3.236V18.236"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="explore-topic-badge">
            <span className="explore-topic-badge-number">{nodeCount}</span>
            <span className="explore-topic-badge-label">nodes</span>
          </div>
        </header>

        <div className="explore-topic-card-body">
          <h3 className="explore-topic-title">{title}</h3>
          <p className="explore-topic-description">{description}</p>
        </div>

        <footer className="explore-topic-card-footer">
          <OwnerBadge userId={ownerId} displayName={ownerDisplayName} avatarUrl={ownerAvatarUrl} />
          <Link to={`/topic/${id}`} className="explore-topic-link">
            <span>View map</span>
            <svg
              className="explore-topic-arrow"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3.333 8h9.334M8.667 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </footer>
      </div>

      <div className="explore-topic-card-corner" aria-hidden="true"></div>
    </article>
  )
}

export default memo(ExploreTopicCard)
```

### ExploreFilters.jsx

Location: `src/features/explore/components/ExploreFilters.jsx`

```jsx
import { memo } from 'react'
import '../../../css/components/ExploreFilters.css'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'title', label: 'Title A-Z' },
  { value: 'nodes', label: 'Most nodes' },
]

function ExploreFilters({ search, onSearchChange, sortBy, onSortChange }) {
  return (
    <div className="explore-filters">
      <div className="explore-search-wrapper">
        <svg
          className="explore-search-icon"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17.5 17.5L13.875 13.875M15.833 9.167a6.667 6.667 0 11-13.333 0 6.667 6.667 0 0113.333 0z"
            stroke="currentColor"
            strokeWidth="1.667"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <input
          type="text"
          className="explore-search-input"
          placeholder="Search topics..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          aria-label="Search topics"
        />
      </div>

      <div className="explore-sort-wrapper">
        <label htmlFor="sort-select" className="explore-sort-label">
          Sort by:
        </label>
        <select
          id="sort-select"
          className="explore-sort-select"
          value={sortBy}
          onChange={e => onSortChange(e.target.value)}
        >
          {SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default memo(ExploreFilters)
```

### UserProfileHeader.jsx

Location: `src/features/explore/components/UserProfileHeader.jsx`

```jsx
import { memo } from 'react'
import '../../../css/components/UserProfileHeader.css'

function UserProfileHeader({ profile, topicCount, isLoading }) {
  if (isLoading) {
    return (
      <div className="user-profile-header user-profile-header-loading">
        <div className="user-profile-avatar-skeleton"></div>
        <div className="user-profile-info-skeleton">
          <div className="user-profile-name-skeleton"></div>
          <div className="user-profile-count-skeleton"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="user-profile-header">
      {profile?.avatarUrl ? (
        <img src={profile.avatarUrl} alt="" className="user-profile-avatar" />
      ) : (
        <div className="user-profile-avatar user-profile-avatar-placeholder">
          {profile?.displayName?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
      <div className="user-profile-info">
        <h1 className="user-profile-name">{profile?.displayName || 'Anonymous'}</h1>
        <p className="user-profile-topic-count">
          {topicCount} public {topicCount === 1 ? 'topic' : 'topics'}
        </p>
      </div>
    </div>
  )
}

export default memo(UserProfileHeader)
```

---

## Phase 4: Pages

### ExplorePage.jsx

Location: `src/features/explore/pages/ExplorePage.jsx`

```jsx
import { useState, useCallback } from 'react'
import { Header } from '../../../shared'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import { useInfiniteScroll } from '../../../shared/hooks/useInfiniteScroll'
import { useExploreTopics } from '../hooks/useExploreTopics'
import ExploreTopicCard from '../components/ExploreTopicCard'
import ExploreFilters from '../components/ExploreFilters'
import '../../../css/pages/ExplorePage.css'

export default function ExplorePage() {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  const debouncedSearch = useDebounce(search, 300)

  const { topics, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, error } =
    useExploreTopics({ search: debouncedSearch, sortBy })

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const { sentinelRef } = useInfiniteScroll(handleLoadMore, {
    hasMore: hasNextPage,
    isLoading: isFetchingNextPage,
  })

  return (
    <div className="explore-page">
      <Header />

      <main className="explore-main">
        <section className="explore-hero">
          <h1 className="explore-hero-title">Explore Public Topics</h1>
          <p className="explore-hero-subtitle">Discover learning journeys from the community</p>
        </section>

        <ExploreFilters
          search={search}
          onSearchChange={setSearch}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {error && (
          <div className="explore-error">
            <p>Failed to load topics: {error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="explore-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="explore-topic-card-skeleton" />
            ))}
          </div>
        ) : topics.length === 0 ? (
          <div className="explore-empty">
            <div className="explore-empty-icon">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="explore-empty-title">
              {debouncedSearch ? 'No results found' : 'No public topics yet'}
            </h2>
            <p className="explore-empty-description">
              {debouncedSearch
                ? 'Try adjusting your search terms'
                : 'Be the first to share your learning journey!'}
            </p>
          </div>
        ) : (
          <>
            <div className="explore-grid">
              {topics.map((topic, index) => (
                <ExploreTopicCard
                  key={topic.id}
                  {...topic}
                  style={{ '--card-index': index % 12 }}
                />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="explore-sentinel">
              {isFetchingNextPage && (
                <div className="explore-loading-more">
                  <div className="explore-spinner" />
                  <span>Loading more topics...</span>
                </div>
              )}
            </div>

            {!hasNextPage && topics.length > 0 && (
              <div className="explore-end">
                <p>You've seen all public topics</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
```

### UserProfilePage.jsx

Location: `src/features/explore/pages/UserProfilePage.jsx`

```jsx
import { useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Header, NotFoundPage } from '../../../shared'
import { useInfiniteScroll } from '../../../shared/hooks/useInfiniteScroll'
import { usePublicUserProfile } from '../hooks/usePublicUserProfile'
import { useUserPublicTopics } from '../hooks/useUserPublicTopics'
import UserProfileHeader from '../components/UserProfileHeader'
import ExploreTopicCard from '../components/ExploreTopicCard'
import '../../../css/pages/UserProfilePage.css'

export default function UserProfilePage() {
  const { userId } = useParams()
  const [sortBy, setSortBy] = useState('newest')

  const { profile, isLoading: profileLoading, notFound } = usePublicUserProfile(userId)

  const {
    topics,
    isLoading: topicsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useUserPublicTopics(userId, { sortBy })

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const { sentinelRef } = useInfiniteScroll(handleLoadMore, {
    hasMore: hasNextPage,
    isLoading: isFetchingNextPage,
  })

  if (notFound) {
    return <NotFoundPage />
  }

  return (
    <div className="user-profile-page">
      <Header />

      <main className="user-profile-main">
        <nav className="user-profile-breadcrumb">
          <Link to="/explore" className="user-profile-breadcrumb-link">
            Explore
          </Link>
          <span className="user-profile-breadcrumb-separator">/</span>
          <span className="user-profile-breadcrumb-current">{profile?.displayName || 'User'}</span>
        </nav>

        <UserProfileHeader
          profile={profile}
          topicCount={topics.length}
          isLoading={profileLoading}
        />

        <div className="user-profile-sort">
          <label htmlFor="user-sort" className="user-profile-sort-label">
            Sort by:
          </label>
          <select
            id="user-sort"
            className="user-profile-sort-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title">Title A-Z</option>
          </select>
        </div>

        {topicsLoading ? (
          <div className="user-profile-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="explore-topic-card-skeleton" />
            ))}
          </div>
        ) : topics.length === 0 ? (
          <div className="user-profile-empty">
            <p>This user hasn't shared any public topics yet.</p>
          </div>
        ) : (
          <>
            <div className="user-profile-grid">
              {topics.map((topic, index) => (
                <ExploreTopicCard
                  key={topic.id}
                  {...topic}
                  ownerId={userId}
                  ownerDisplayName={profile?.displayName}
                  ownerAvatarUrl={profile?.avatarUrl}
                  style={{ '--card-index': index % 12 }}
                />
              ))}
            </div>

            <div ref={sentinelRef} className="user-profile-sentinel">
              {isFetchingNextPage && (
                <div className="user-profile-loading-more">
                  <div className="explore-spinner" />
                  <span>Loading more topics...</span>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
```

---

## Phase 5: Routing Integration

### App.jsx Changes

```jsx
// Add lazy imports
const ExplorePage = lazy(() => import('./features/explore/pages/ExplorePage'))
const UserProfilePage = lazy(() => import('./features/explore/pages/UserProfilePage'))

// Add routes inside <Routes>
<Route path="/explore" element={<ExplorePage />} />
<Route path="/user/:userId" element={<UserProfilePage />} />
```

### Header.jsx Changes

Add navigation link to Explore page:

```jsx
import { Link, useLocation } from 'react-router-dom'
import exploreIcon from '../../assets/icons/explore.svg'

// In the header-actions div, before ThemeToggle:
const location = useLocation()
const isExplorePage = location.pathname === '/explore'

<Link
  to="/explore"
  className={`header-nav-link ${isExplorePage ? 'header-nav-link-active' : ''}`}
>
  <img src={exploreIcon} alt="" className="header-nav-icon" />
  <span>Explore</span>
</Link>
```

---

## Phase 6: Barrel Exports

### src/features/explore/index.js

```javascript
// Services
export { exploreService } from './services/exploreService'

// Hooks
export { useExploreTopics } from './hooks/useExploreTopics'
export { useUserPublicTopics } from './hooks/useUserPublicTopics'
export { usePublicUserProfile } from './hooks/usePublicUserProfile'

// Components
export { default as ExploreTopicCard } from './components/ExploreTopicCard'
export { default as OwnerBadge } from './components/OwnerBadge'
export { default as ExploreFilters } from './components/ExploreFilters'
export { default as UserProfileHeader } from './components/UserProfileHeader'

// Pages
export { default as ExplorePage } from './pages/ExplorePage'
export { default as UserProfilePage } from './pages/UserProfilePage'
```

### Update src/shared/index.js

Add export for useInfiniteScroll:

```javascript
export { useInfiniteScroll } from './hooks/useInfiniteScroll'
```

---

## Testing Checklist

### Explore Page

- [ ] Navigate to /explore
- [ ] Verify public topics from all users appear
- [ ] Test search functionality (debounced)
- [ ] Test all sort options (newest, oldest, title, most nodes)
- [ ] Test infinite scroll loads more topics
- [ ] Click topic → view mind map
- [ ] Test in visitor mode (not logged in)
- [ ] Test responsive design on mobile

### User Profile Page

- [ ] Click owner badge → navigate to /user/:userId
- [ ] Verify user's display name and avatar shown
- [ ] Verify only their public topics appear
- [ ] Test infinite scroll on user topics
- [ ] Test back navigation via breadcrumb

### Edge Cases

- [ ] No public topics exist (empty explore page)
- [ ] Search returns no results
- [ ] User has no public topics
- [ ] User profile not found (404 handling)
- [ ] Topics with missing owner profiles (show "Anonymous")

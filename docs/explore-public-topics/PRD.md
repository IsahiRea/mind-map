# PRD: Explore Public Topics

## Overview

Add a new "Explore" feature that allows users to browse and discover public topics from all users in the mind-map application. This feature enables community discovery and lets users learn from each other's mind maps.

**Status**: In Progress
**Last Updated**: 2026-01-20

---

## Problem Statement

Currently, users can only see their own topics or browse in visitor mode which shows all public topics without distinction of ownership. There is no way to:

- Discover public topics from specific users
- Browse all public topics in a dedicated exploration interface
- View a user's public profile and their shared topics

This limits the community aspect of the application and prevents knowledge sharing between users.

---

## Goals

1. Allow users to explore all public topics from the community
2. Enable discovery of topics by other users
3. Provide a dedicated public profile page for each user
4. Support search and filtering of public topics
5. Implement infinite scroll for smooth browsing experience

---

## User Requirements

| Requirement                  | Priority | Notes                            |
| ---------------------------- | -------- | -------------------------------- |
| Browse all public topics     | P0       | Core explore functionality       |
| Search topics by title/desc  | P0       | Essential for discovery          |
| See topic owner info         | P0       | Display name, avatar             |
| Navigate to owner's profile  | P0       | Click owner badge → profile page |
| View user's public topics    | P1       | Public profile page              |
| Sort topics                  | P1       | Newest, oldest, A-Z, most nodes  |
| Infinite scroll              | P1       | Better UX for browsing           |
| View public topic's mind map | P0       | Navigate to topic map            |

---

## User Stories

### Explore Page

- As a user, I can navigate to the Explore page to discover public topics from all users
- As a user, I can search topics by title or description
- As a user, I can sort topics by different criteria (newest, oldest, title, node count)
- As a user, I can see who created each topic (display name and avatar)
- As a user, I can click on a topic card to view its mind map
- As a user, I can click on the topic owner to view their public profile

### User Profile Page

- As a user, I can view another user's public profile page
- As a user, I can see all public topics created by a specific user
- As a user, I can navigate back to explore or to any of their topic maps

### Visitor Experience

- As a visitor (not logged in), I can browse the Explore page
- As a visitor, I can view any public user's profile
- As a visitor, I can view any public topic's mind map

---

## Technical Requirements

### New Service Methods

**exploreService.js:**

```javascript
// Fetch paginated public topics with owner info
getPublicTopics({ search, sortBy, page, pageSize })

// Fetch a specific user's public topics
getUserPublicTopics(userId, { sortBy, page, pageSize })

// Fetch public user profile info
getPublicUserProfile(userId)
```

### Database Queries

**Public Topics with Owner Info:**

```sql
SELECT
  t.id, t.title, t.description, t.icon_bg_color, t.icon_color,
  t.created_at, t.user_id,
  up.display_name as owner_display_name,
  up.avatar_url as owner_avatar_url,
  (SELECT COUNT(*) FROM nodes WHERE topic_id = t.id) as node_count
FROM topics t
LEFT JOIN user_profiles up ON t.user_id = up.user_id
WHERE t.is_public = true
ORDER BY t.created_at DESC
LIMIT 12 OFFSET 0;
```

### React Query Patterns

**Infinite Query for Explore:**

```javascript
useInfiniteQuery({
  queryKey: ['explore-topics', { search, sortBy }],
  queryFn: ({ pageParam = 0 }) =>
    exploreService.getPublicTopics({
      search,
      sortBy,
      page: pageParam,
    }),
  getNextPageParam: (lastPage, pages) => (lastPage.hasMore ? pages.length : undefined),
})
```

### Routing

| Route           | Component       | Description                |
| --------------- | --------------- | -------------------------- |
| `/explore`      | ExplorePage     | Browse all public topics   |
| `/user/:userId` | UserProfilePage | View user's public profile |

---

## UI/UX Changes

### Navigation

- Add "Explore" link to Header navigation
- Link appears for all users (logged in and visitors)

### Explore Page Layout

```
┌─────────────────────────────────────────┐
│  Header (with Explore link highlighted) │
├─────────────────────────────────────────┤
│                                         │
│    Explore Public Topics                │
│    Discover learning journeys from      │
│    the community                        │
│                                         │
│    ┌─────────────────┐  ┌──────────┐   │
│    │ Search topics...│  │ Sort: ▼  │   │
│    └─────────────────┘  └──────────┘   │
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Topic 1 │ │ Topic 2 │ │ Topic 3 │   │
│  │ by User │ │ by User │ │ by User │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Topic 4 │ │ Topic 5 │ │ Topic 6 │   │
│  │ by User │ │ by User │ │ by User │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│                                         │
│           [Loading more...]             │
└─────────────────────────────────────────┘
```

### ExploreTopicCard Component

Similar to TopicCard but includes:

- OwnerBadge showing avatar and display name
- No delete button or visibility toggle
- Clickable owner badge navigates to user profile

### User Profile Page Layout

```
┌─────────────────────────────────────────┐
│  Header                                 │
├─────────────────────────────────────────┤
│                                         │
│    ┌────┐                               │
│    │ 🧑 │  User Display Name            │
│    └────┘  X public topics              │
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Topic 1 │ │ Topic 2 │ │ Topic 3 │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│                                         │
│           [Loading more...]             │
└─────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Documentation

- [ ] Create PRD.md following multi-user support format
- [ ] Create IMPLEMENTATION.md with code snippets

### Phase 2: Service & Hook Layer

- [ ] Create exploreService.js with all methods
- [ ] Create useInfiniteScroll.js shared hook
- [ ] Create useExploreTopics.js with infinite query
- [ ] Create useUserPublicTopics.js with infinite query
- [ ] Create usePublicUserProfile.js

### Phase 3: Explore Page UI

- [ ] Create OwnerBadge component (clickable, links to /user/:id)
- [ ] Create ExploreTopicCard component
- [ ] Create ExploreFilters component
- [ ] Create ExplorePage with hero, search, grid, infinite scroll

### Phase 4: User Profile Page UI

- [ ] Create UserProfileHeader component
- [ ] Create UserProfilePage with header and topic grid

### Phase 5: Integration

- [ ] Add /explore route to App.jsx
- [ ] Add /user/:userId route to App.jsx
- [ ] Add Explore navigation link to Header
- [ ] Create explore icon

### Phase 6: Polish & Testing

- [ ] Add loading skeletons
- [ ] Add empty states
- [ ] Test search and filtering
- [ ] Test infinite scroll
- [ ] Test responsive design
- [ ] Test navigation flow (explore → user profile → topic)

---

## Files to Create

### New Files

| File                                                    | Purpose                         |
| ------------------------------------------------------- | ------------------------------- |
| `src/features/explore/services/exploreService.js`       | Public topics API               |
| `src/features/explore/hooks/useExploreTopics.js`        | Infinite query for explore      |
| `src/features/explore/hooks/useUserPublicTopics.js`     | Infinite query for user topics  |
| `src/features/explore/hooks/usePublicUserProfile.js`    | Fetch user profile              |
| `src/shared/hooks/useInfiniteScroll.js`                 | Intersection observer hook      |
| `src/features/explore/components/ExploreTopicCard.jsx`  | Topic card with owner           |
| `src/features/explore/components/OwnerBadge.jsx`        | Clickable user avatar component |
| `src/features/explore/components/ExploreFilters.jsx`    | Sort/filter controls            |
| `src/features/explore/components/UserProfileHeader.jsx` | User profile header             |
| `src/features/explore/pages/ExplorePage.jsx`            | Main explore page               |
| `src/features/explore/pages/UserProfilePage.jsx`        | Public user profile page        |
| `src/features/explore/index.js`                         | Barrel exports                  |
| `src/css/pages/ExplorePage.css`                         | Explore page styles             |
| `src/css/pages/UserProfilePage.css`                     | User profile page styles        |
| `src/css/components/ExploreTopicCard.css`               | Card styles                     |
| `src/css/components/OwnerBadge.css`                     | Badge styles                    |
| `src/css/components/UserProfileHeader.css`              | Profile header styles           |
| `src/css/components/ExploreFilters.css`                 | Filter controls styles          |
| `src/assets/icons/explore.svg`                          | Navigation icon                 |

### Modified Files

| File                               | Changes                       |
| ---------------------------------- | ----------------------------- |
| `src/App.jsx`                      | Add /explore and /user routes |
| `src/shared/components/Header.jsx` | Add Explore navigation link   |
| `src/css/components/Header.css`    | Style for explore link        |
| `src/shared/index.js`              | Export useInfiniteScroll hook |

---

## Data Transformations

**Database → Component Format:**

```javascript
{
  // From topics table
  id: topic.id,
  title: topic.title,
  description: topic.description,
  iconBgColor: topic.icon_bg_color,
  iconColor: topic.icon_color,
  createdAt: topic.created_at,

  // Computed
  nodeCount: topic.node_count || 0,

  // From user_profiles join
  ownerId: topic.user_id,
  ownerDisplayName: topic.owner_display_name || 'Anonymous',
  ownerAvatarUrl: topic.owner_avatar_url || null
}
```

---

## Edge Cases

| Scenario                   | Handling                             |
| -------------------------- | ------------------------------------ |
| No public topics exist     | Show "No topics yet" empty state     |
| Search returns no results  | Show "No results found" message      |
| User has no public topics  | Show "No public topics" on profile   |
| User profile not found     | Show 404 page                        |
| Topic owner has no profile | Show "Anonymous" with default avatar |
| Network error during load  | Show error message with retry button |
| Infinite scroll at end     | Stop loading, show end message       |

---

## Security Considerations

1. **RLS Enforcement**: Only fetch topics where `is_public = true`
2. **Profile Privacy**: Only expose display_name and avatar_url (no email)
3. **Query Limits**: Pagination prevents loading all data at once
4. **Input Sanitization**: Search query sanitized before database query

---

## Performance Considerations

1. **Pagination**: Load 12 topics per page
2. **Infinite Scroll**: Use IntersectionObserver for efficient detection
3. **React Query Caching**: 5-minute stale time for explore data
4. **Search Debounce**: 300ms debounce on search input
5. **Lazy Loading**: Explore and UserProfile pages lazy-loaded

---

## Success Metrics

- Users can browse all public topics from the community
- Search and sort functionality works correctly
- Owner info displays correctly on topic cards
- Navigation between explore, user profile, and topic map works
- Infinite scroll loads more topics seamlessly
- Mobile responsive design works on all screen sizes
- No performance degradation with large number of topics

---

## Open Questions

1. Should we add topic categories/tags for better filtering?
2. Should we show topic creation date on cards?
3. Should we add a "featured" or "trending" section?
4. Should users be able to "follow" other users?

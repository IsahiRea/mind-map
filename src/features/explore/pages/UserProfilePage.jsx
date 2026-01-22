import { useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Header } from '../../../shared'
import NotFoundPage from '../../../shared/components/NotFoundPage'
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

  const lastElementRef = useInfiniteScroll(handleLoadMore, hasNextPage, isFetchingNextPage)

  // Only show 404 if we have no profile AND no topics (after loading)
  const isFullyLoaded = !profileLoading && !topicsLoading
  const userNotFound = isFullyLoaded && notFound && topics.length === 0

  if (userNotFound) {
    return <NotFoundPage />
  }

  // Create a fallback profile if none exists
  const displayProfile = profile || { displayName: 'Anonymous', avatarUrl: null }

  return (
    <div className="user-profile-page">
      <Header />

      <main className="user-profile-main">
        <nav className="user-profile-breadcrumb">
          <Link to="/explore" className="user-profile-breadcrumb-link">
            Explore
          </Link>
          <span className="user-profile-breadcrumb-separator">/</span>
          <span className="user-profile-breadcrumb-current">
            {displayProfile.displayName || 'User'}
          </span>
        </nav>

        <UserProfileHeader
          profile={displayProfile}
          topicCount={topics.length}
          isLoading={profileLoading && topicsLoading}
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
              {topics.map((topic, index) => {
                const isLastElement = index === topics.length - 1
                return (
                  <div key={topic.id} ref={isLastElement ? lastElementRef : null}>
                    <ExploreTopicCard
                      {...topic}
                      ownerId={userId}
                      ownerDisplayName={displayProfile.displayName}
                      ownerAvatarUrl={displayProfile.avatarUrl}
                      style={{ '--card-index': index % 12 }}
                    />
                  </div>
                )
              })}
            </div>

            {isFetchingNextPage && (
              <div className="user-profile-loading-more">
                <div className="explore-spinner" />
                <span>Loading more topics...</span>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

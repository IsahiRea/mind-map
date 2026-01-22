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

  const lastElementRef = useInfiniteScroll(handleLoadMore, hasNextPage, isFetchingNextPage)

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
              {topics.map((topic, index) => {
                const isLastElement = index === topics.length - 1
                return (
                  <div key={topic.id} ref={isLastElement ? lastElementRef : null}>
                    <ExploreTopicCard {...topic} style={{ '--card-index': index % 12 }} />
                  </div>
                )
              })}
            </div>

            {isFetchingNextPage && (
              <div className="explore-loading-more">
                <div className="explore-spinner" />
                <span>Loading more topics...</span>
              </div>
            )}

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

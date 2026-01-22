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

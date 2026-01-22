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

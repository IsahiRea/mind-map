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

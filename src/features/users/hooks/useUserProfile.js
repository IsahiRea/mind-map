import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../auth/hooks/useAuth'
import { userService } from '../services/userService'

/**
 * Transform database format to component format
 */
function transformProfile(profile) {
  return {
    id: profile.id,
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url,
    authProvider: profile.auth_provider,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  }
}

/**
 * Custom hook for managing user profiles with React Query
 * Auto-creates profile on first auth if it doesn't exist
 * @returns {Object} Profile state and operations
 */
export function useUserProfile() {
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  // Fetch profile with React Query
  const {
    data: profile,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const data = await userService.getProfile(user.id)
      return data ? transformProfile(data) : null
    },
    enabled: isAuthenticated && !!user?.id,
  })

  // Sync profile from auth on first sign-in
  useEffect(() => {
    async function syncProfile() {
      if (isAuthenticated && user && profile === null) {
        try {
          await userService.syncFromAuth(user)
          refetch()
        } catch (err) {
          console.error('Error syncing profile:', err)
        }
      }
    }
    syncProfile()
  }, [isAuthenticated, user, profile, refetch])

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: updates => userService.updateProfile(user.id, updates),
    onSuccess: updated => {
      queryClient.setQueryData(['userProfile', user?.id], transformProfile(updated))
    },
  })

  return {
    profile,
    loading,
    error: error?.message || null,
    updateProfile: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    refresh: refetch,
  }
}

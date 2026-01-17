import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'

/**
 * Custom hook for managing topic visibility
 * @returns {Object} Visibility mutation operations
 */
export function useTopicVisibility() {
  const queryClient = useQueryClient()

  // Update visibility mutation
  const updateMutation = useMutation({
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
    onMutate: async ({ topicId, isPublic }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['topics'] })

      // Snapshot the previous value
      const previousTopics = queryClient.getQueryData(['topics'])

      // Optimistically update the cache
      queryClient.setQueryData(['topics'], old =>
        old?.map(topic => (topic.id === topicId ? { ...topic, isPublic } : topic))
      )

      return { previousTopics }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousTopics) {
        queryClient.setQueryData(['topics'], context.previousTopics)
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['topics'] })
    },
  })

  return {
    updateVisibility: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    error: updateMutation.error?.message || null,
  }
}

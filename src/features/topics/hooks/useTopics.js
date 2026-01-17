import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { topicsService } from '../services/topicsService'

/**
 * Transform database format to component format
 */
function transformTopic(topic) {
  return {
    id: topic.id,
    title: topic.title,
    description: topic.description,
    iconBgColor: topic.icon_bg_color,
    iconColor: topic.icon_color,
    nodeCount: topic.node_count || 0,
    isPublic: topic.is_public ?? false,
    userId: topic.user_id,
  }
}

/**
 * Custom hook for managing topics with React Query
 * @returns {Object} Topics state and operations
 */
export function useTopics() {
  const queryClient = useQueryClient()

  // Fetch topics with React Query
  const {
    data: topics = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['topics'],
    queryFn: async () => {
      const data = await topicsService.getAll()
      return data.map(transformTopic)
    },
  })

  // Create topic mutation
  const createMutation = useMutation({
    mutationFn: topicsService.create,
    onSuccess: newTopic => {
      // Optimistically update cache
      queryClient.setQueryData(['topics'], old => {
        const transformedTopic = transformTopic({
          ...newTopic,
          node_count: 0,
          is_public: newTopic.is_public ?? false,
        })
        return [transformedTopic, ...(old || [])]
      })
    },
  })

  // Delete topic mutation
  const deleteMutation = useMutation({
    mutationFn: topicsService.delete,
    onSuccess: (_, deletedId) => {
      // Optimistically update cache
      queryClient.setQueryData(['topics'], old => old?.filter(t => t.id !== deletedId) || [])
    },
  })

  // Update topic mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => topicsService.update(id, updates),
    onSuccess: (updated, { id }) => {
      // Optimistically update cache
      queryClient.setQueryData(
        ['topics'],
        old =>
          old?.map(t =>
            t.id === id
              ? {
                  ...t,
                  title: updated.title,
                  description: updated.description,
                  iconBgColor: updated.icon_bg_color,
                  iconColor: updated.icon_color,
                }
              : t
          ) || []
      )
    },
  })

  return {
    topics,
    loading,
    error: error?.message || null,
    createTopic: createMutation.mutateAsync,
    deleteTopic: deleteMutation.mutateAsync,
    updateTopic: (id, updates) => updateMutation.mutateAsync({ id, updates }),
    refresh: refetch,
  }
}

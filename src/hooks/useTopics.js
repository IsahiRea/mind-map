import { useState, useEffect } from 'react'
import { topicsService } from '../services/topicsService'

/**
 * Custom hook for managing topics
 * @returns {Object} Topics state and operations
 */
export function useTopics() {
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load topics on mount
  useEffect(() => {
    loadTopics()
  }, [])

  /**
   * Load all topics from database
   */
  async function loadTopics() {
    try {
      setLoading(true)
      setError(null)
      const data = await topicsService.getAll()

      // Transform database format to component format
      const transformedTopics = data.map(topic => ({
        id: topic.id,
        title: topic.title,
        description: topic.description,
        iconBgColor: topic.icon_bg_color,
        iconColor: topic.icon_color,
        nodeCount: topic.node_count || 0
      }))

      setTopics(transformedTopics)
    } catch (err) {
      console.error('Error loading topics:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Create a new topic
   * @param {Object} topicData - Topic data
   * @returns {Promise<Object>} Created topic
   */
  async function createTopic(topicData) {
    try {
      const newTopic = await topicsService.create(topicData)

      // Transform and add to local state
      const transformedTopic = {
        id: newTopic.id,
        title: newTopic.title,
        description: newTopic.description,
        iconBgColor: newTopic.icon_bg_color,
        iconColor: newTopic.icon_color,
        nodeCount: 0
      }

      setTopics(prev => [transformedTopic, ...prev])
      return transformedTopic
    } catch (err) {
      console.error('Error creating topic:', err)
      setError(err.message)
      throw err
    }
  }

  /**
   * Delete a topic
   * @param {string} id - Topic ID
   */
  async function deleteTopic(id) {
    try {
      await topicsService.delete(id)
      setTopics(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      console.error('Error deleting topic:', err)
      setError(err.message)
      throw err
    }
  }

  /**
   * Update a topic
   * @param {string} id - Topic ID
   * @param {Object} updates - Fields to update
   */
  async function updateTopic(id, updates) {
    try {
      const updated = await topicsService.update(id, updates)

      setTopics(prev =>
        prev.map(t =>
          t.id === id
            ? {
                ...t,
                title: updated.title,
                description: updated.description,
                iconBgColor: updated.icon_bg_color,
                iconColor: updated.icon_color
              }
            : t
        )
      )
      return updated
    } catch (err) {
      console.error('Error updating topic:', err)
      setError(err.message)
      throw err
    }
  }

  return {
    topics,
    loading,
    error,
    createTopic,
    deleteTopic,
    updateTopic,
    refresh: loadTopics
  }
}

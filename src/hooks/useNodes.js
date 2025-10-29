import { useState, useEffect, useCallback } from 'react'
import { nodesService } from '../services/nodesService'
import { connectionsService } from '../services/connectionsService'

/**
 * Custom hook for managing learning nodes and connections
 * @param {string} topicId - Topic UUID
 * @returns {Object} Nodes state and operations
 */
export function useNodes(topicId) {
  const [nodes, setNodes] = useState([])
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load nodes and connections
  const loadNodesAndConnections = useCallback(async () => {
    if (!topicId) return

    try {
      setLoading(true)
      setError(null)

      // Load nodes and connections in parallel
      const [nodesData, connectionsData] = await Promise.all([
        nodesService.getByTopicId(topicId),
        connectionsService.getByTopicId(topicId)
      ])

      // Transform nodes to component format
      const transformedNodes = nodesData.map(node => ({
        id: node.id,
        title: node.title,
        description: node.description,
        position: node.position,
        connectionCount: 0 // Will be calculated from connections
      }))

      // Calculate connection counts
      const connectionCounts = {}
      connectionsData.forEach(conn => {
        connectionCounts[conn.from_node_id] = (connectionCounts[conn.from_node_id] || 0) + 1
        connectionCounts[conn.to_node_id] = (connectionCounts[conn.to_node_id] || 0) + 1
      })

      // Update nodes with connection counts
      transformedNodes.forEach(node => {
        node.connectionCount = connectionCounts[node.id] || 0
      })

      // Transform connections to component format
      const transformedConnections = connectionsData.map(conn => ({
        id: conn.id,
        from: conn.from_node_id,
        to: conn.to_node_id
      }))

      setNodes(transformedNodes)
      setConnections(transformedConnections)
    } catch (err) {
      console.error('Error loading nodes and connections:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [topicId])

  useEffect(() => {
    loadNodesAndConnections()
  }, [loadNodesAndConnections])

  /**
   * Create a new node
   * @param {Object} nodeData - Node data
   * @param {Array} connectionIds - Array of node IDs to connect to
   * @returns {Promise<Object>} Created node
   */
  async function createNode(nodeData, connectionIds = []) {
    try {
      // Create the node
      const newNode = await nodesService.create({
        topicId,
        title: nodeData.title,
        description: nodeData.description || nodeData.notes,
        position: nodeData.position || { x: 300, y: 300 }
      })

      // Create connections if provided
      if (connectionIds.length > 0) {
        const connectionPromises = connectionIds.map(connectedNodeId =>
          connectionsService.create(newNode.id, connectedNodeId)
        )
        await Promise.all(connectionPromises)
      }

      // Reload to get fresh data with connection counts
      await loadNodesAndConnections()

      return newNode
    } catch (err) {
      console.error('Error creating node:', err)
      setError(err.message)
      throw err
    }
  }

  /**
   * Update a node
   * @param {string} id - Node ID
   * @param {Object} updates - Fields to update
   */
  async function updateNode(id, updates) {
    try {
      await nodesService.update(id, updates)

      setNodes(prev =>
        prev.map(n =>
          n.id === id ? { ...n, ...updates } : n
        )
      )
    } catch (err) {
      console.error('Error updating node:', err)
      setError(err.message)
      throw err
    }
  }

  /**
   * Update node position locally (for dragging)
   * @param {string} id - Node ID
   * @param {Object} position - New position {x, y}
   */
  function updateNodePositionLocal(id, position) {
    // Update local state immediately for smooth UX during dragging
    setNodes(prev =>
      prev.map(n =>
        n.id === id ? { ...n, position } : n
      )
    )
  }

  /**
   * Update node position and save to database
   * @param {string} id - Node ID
   * @param {Object} position - New position {x, y}
   */
  async function updateNodePosition(id, position) {
    try {
      // Update local state immediately for smooth UX
      setNodes(prev =>
        prev.map(n =>
          n.id === id ? { ...n, position } : n
        )
      )

      // Update in database
      await nodesService.updatePosition(id, position)
    } catch (err) {
      console.error('Error updating node position:', err)
      // Don't set error for position updates to avoid disrupting UX
    }
  }

  /**
   * Delete a node
   * @param {string} id - Node ID
   */
  async function deleteNode(id) {
    try {
      await nodesService.delete(id)

      // Remove from local state
      setNodes(prev => prev.filter(n => n.id !== id))
      setConnections(prev =>
        prev.filter(c => c.from !== id && c.to !== id)
      )
    } catch (err) {
      console.error('Error deleting node:', err)
      setError(err.message)
      throw err
    }
  }

  /**
   * Get connected nodes for a specific node
   * @param {string} nodeId - Node ID
   * @returns {Array} Array of connected nodes
   */
  function getConnectedNodes(nodeId) {
    const connectedNodeIds = connections
      .filter(conn => conn.from === nodeId || conn.to === nodeId)
      .map(conn => (conn.from === nodeId ? conn.to : conn.from))

    return nodes.filter(node => connectedNodeIds.includes(node.id))
  }

  /**
   * Get node by ID
   * @param {string} id - Node ID
   * @returns {Object|undefined} Node object
   */
  function getNodeById(id) {
    return nodes.find(node => node.id === id)
  }

  return {
    nodes,
    connections,
    loading,
    error,
    createNode,
    updateNode,
    updateNodePositionLocal,
    updateNodePosition,
    deleteNode,
    getConnectedNodes,
    getNodeById,
    refresh: loadNodesAndConnections
  }
}

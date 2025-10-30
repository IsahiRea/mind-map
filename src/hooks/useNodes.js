import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { nodesService } from '../services/nodesService'
import { connectionsService } from '../services/connectionsService'

/**
 * Transform and process nodes and connections data
 */
function transformNodesAndConnections(nodesData, connectionsData) {
  // Transform nodes to component format
  const transformedNodes = nodesData.map(node => ({
    id: node.id,
    title: node.title,
    description: node.description,
    position: node.position,
    connectionCount: 0, // Will be calculated from connections
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
    to: conn.to_node_id,
  }))

  return { nodes: transformedNodes, connections: transformedConnections }
}

/**
 * Custom hook for managing learning nodes and connections with React Query
 * @param {string} topicId - Topic UUID
 * @returns {Object} Nodes state and operations
 */
export function useNodes(topicId) {
  const queryClient = useQueryClient()

  // Fetch nodes and connections with React Query
  const {
    data = { nodes: [], connections: [] },
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['nodes', topicId],
    queryFn: async () => {
      if (!topicId) return { nodes: [], connections: [] }

      const [nodesData, connectionsData] = await Promise.all([
        nodesService.getByTopicId(topicId),
        connectionsService.getByTopicId(topicId),
      ])

      return transformNodesAndConnections(nodesData, connectionsData)
    },
    enabled: !!topicId,
  })

  const { nodes, connections } = data

  // Create node mutation
  const createNodeMutation = useMutation({
    mutationFn: async ({ nodeData, connectionIds }) => {
      const newNode = await nodesService.create({
        topicId,
        title: nodeData.title,
        description: nodeData.description || nodeData.notes,
        position: nodeData.position || { x: 300, y: 300 },
      })

      if (connectionIds.length > 0) {
        await Promise.all(
          connectionIds.map(connectedNodeId =>
            connectionsService.create(newNode.id, connectedNodeId)
          )
        )
      }

      return newNode
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes', topicId] })
    },
  })

  // Update node mutation
  const updateNodeMutation = useMutation({
    mutationFn: ({ id, updates }) => nodesService.update(id, updates),
    onMutate: async ({ id, updates }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['nodes', topicId] })
      const previousData = queryClient.getQueryData(['nodes', topicId])

      queryClient.setQueryData(['nodes', topicId], old => ({
        ...old,
        nodes: old.nodes.map(n => (n.id === id ? { ...n, ...updates } : n)),
      }))

      return { previousData }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['nodes', topicId], context.previousData)
    },
  })

  // Update node position mutation (for dragging)
  const updatePositionMutation = useMutation({
    mutationFn: ({ id, position }) => nodesService.updatePosition(id, position),
    onMutate: async ({ id, position }) => {
      // Optimistic update for smooth UX
      await queryClient.cancelQueries({ queryKey: ['nodes', topicId] })
      const previousData = queryClient.getQueryData(['nodes', topicId])

      queryClient.setQueryData(['nodes', topicId], old => ({
        ...old,
        nodes: old.nodes.map(n => (n.id === id ? { ...n, position } : n)),
      }))

      return { previousData }
    },
    onError: (err, variables, context) => {
      // Revert on error
      queryClient.setQueryData(['nodes', topicId], context.previousData)
    },
  })

  // Delete node mutation
  const deleteNodeMutation = useMutation({
    mutationFn: nodesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes', topicId] })
    },
  })

  // Connection mutations
  const addConnectionMutation = useMutation({
    mutationFn: ({ fromNodeId, toNodeId }) => connectionsService.create(fromNodeId, toNodeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes', topicId] })
    },
  })

  const removeConnectionMutation = useMutation({
    mutationFn: ({ fromNodeId, toNodeId }) => connectionsService.delete(fromNodeId, toNodeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes', topicId] })
    },
  })

  const updateConnectionsMutation = useMutation({
    mutationFn: async ({ nodeId, newConnectionIds }) => {
      const currentConnections = connections.filter(
        conn => conn.from === nodeId || conn.to === nodeId
      )

      const currentConnectionIds = currentConnections.map(conn =>
        conn.from === nodeId ? conn.to : conn.from
      )

      const toAdd = newConnectionIds.filter(id => !currentConnectionIds.includes(id))
      const toRemove = currentConnectionIds.filter(id => !newConnectionIds.includes(id))

      const addPromises = toAdd.map(id => connectionsService.create(nodeId, id))
      const removePromises = toRemove
        .map(id => {
          const conn = currentConnections.find(
            c => (c.from === nodeId && c.to === id) || (c.from === id && c.to === nodeId)
          )
          if (conn) {
            return connectionsService.delete(conn.from, conn.to)
          }
        })
        .filter(Boolean)

      await Promise.all([...addPromises, ...removePromises])
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes', topicId] })
    },
  })

  /**
   * Get connected nodes for a specific node
   */
  function getConnectedNodes(nodeId) {
    const connectedNodeIds = connections
      .filter(conn => conn.from === nodeId || conn.to === nodeId)
      .map(conn => (conn.from === nodeId ? conn.to : conn.from))

    return nodes.filter(node => connectedNodeIds.includes(node.id))
  }

  /**
   * Get node by ID
   */
  function getNodeById(id) {
    return nodes.find(node => node.id === id)
  }

  /**
   * Update node position locally (for smooth dragging UX)
   */
  function updateNodePositionLocal(id, position) {
    queryClient.setQueryData(['nodes', topicId], old => ({
      ...old,
      nodes: old.nodes.map(n => (n.id === id ? { ...n, position } : n)),
    }))
  }

  return {
    nodes,
    connections,
    loading,
    error: error?.message || null,
    createNode: (nodeData, connectionIds = []) =>
      createNodeMutation.mutateAsync({ nodeData, connectionIds }),
    updateNode: (id, updates) => updateNodeMutation.mutateAsync({ id, updates }),
    updateNodePositionLocal,
    updateNodePosition: (id, position) => updatePositionMutation.mutateAsync({ id, position }),
    deleteNode: deleteNodeMutation.mutateAsync,
    getConnectedNodes,
    getNodeById,
    addConnection: (fromNodeId, toNodeId) =>
      addConnectionMutation.mutateAsync({ fromNodeId, toNodeId }),
    removeConnection: (fromNodeId, toNodeId) =>
      removeConnectionMutation.mutateAsync({ fromNodeId, toNodeId }),
    updateConnections: (nodeId, newConnectionIds) =>
      updateConnectionsMutation.mutateAsync({ nodeId, newConnectionIds }),
    refresh: refetch,
  }
}

import { supabase } from '../lib/supabase'

export const connectionsService = {
  /**
   * Get all connections for a topic
   * @param {string} topicId - Topic UUID
   * @returns {Promise<Array>} Array of connections
   */
  async getByTopicId(topicId) {
    // First get all nodes for the topic
    const { data: nodes, error: nodesError } = await supabase
      .from('learning_nodes')
      .select('id')
      .eq('topic_id', topicId)

    if (nodesError) throw nodesError

    const nodeIds = nodes.map(n => n.id)

    if (nodeIds.length === 0) return []

    // Then get all connections where either from or to is in the node list
    const { data, error } = await supabase
      .from('node_connections')
      .select('*')
      .or(`from_node_id.in.(${nodeIds.join(',')}),to_node_id.in.(${nodeIds.join(',')})`)

    if (error) throw error
    return data || []
  },

  /**
   * Get connections for a specific node
   * @param {string} nodeId - Node UUID
   * @returns {Promise<Array>} Array of connections
   */
  async getByNodeId(nodeId) {
    const { data, error } = await supabase
      .from('node_connections')
      .select('*')
      .or(`from_node_id.eq.${nodeId},to_node_id.eq.${nodeId}`)

    if (error) throw error
    return data || []
  },

  /**
   * Create a new connection between nodes
   * @param {string} fromNodeId - Source node UUID
   * @param {string} toNodeId - Target node UUID
   * @returns {Promise<Object>} Created connection
   */
  async create(fromNodeId, toNodeId) {
    const { data, error } = await supabase
      .from('node_connections')
      .insert([
        {
          from_node_id: fromNodeId,
          to_node_id: toNodeId
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Create multiple connections at once
   * @param {Array} connections - Array of {fromNodeId, toNodeId} objects
   * @returns {Promise<Array>} Created connections
   */
  async createMany(connections) {
    const insertData = connections.map(conn => ({
      from_node_id: conn.fromNodeId || conn.from,
      to_node_id: conn.toNodeId || conn.to
    }))

    const { data, error } = await supabase
      .from('node_connections')
      .insert(insertData)
      .select()

    if (error) throw error
    return data || []
  },

  /**
   * Delete a specific connection
   * @param {string} fromNodeId - Source node UUID
   * @param {string} toNodeId - Target node UUID
   */
  async delete(fromNodeId, toNodeId) {
    const { error } = await supabase
      .from('node_connections')
      .delete()
      .eq('from_node_id', fromNodeId)
      .eq('to_node_id', toNodeId)

    if (error) throw error
  },

  /**
   * Delete all connections for a node (both from and to)
   * @param {string} nodeId - Node UUID
   */
  async deleteByNodeId(nodeId) {
    const { error } = await supabase
      .from('node_connections')
      .delete()
      .or(`from_node_id.eq.${nodeId},to_node_id.eq.${nodeId}`)

    if (error) throw error
  }
}

import { supabase } from '../../../lib/supabase'

export const nodesService = {
  /**
   * Get all nodes for a topic
   * @param {string} topicId - Topic UUID
   * @returns {Promise<Array>} Array of nodes
   */
  async getByTopicId(topicId) {
    const { data, error } = await supabase
      .from('learning_nodes')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get a single node by ID
   * @param {string} id - Node UUID
   * @returns {Promise<Object>} Node object
   */
  async getById(id) {
    const { data, error } = await supabase.from('learning_nodes').select('*').eq('id', id).single()

    if (error) throw error
    return data
  },

  /**
   * Create a new learning node
   * @param {Object} node - Node data
   * @param {string} node.topicId - Topic UUID
   * @param {string} node.title - Node title
   * @param {string} node.description - Node description
   * @param {Object} node.position - Position {x, y}
   * @returns {Promise<Object>} Created node
   */
  async create(node) {
    const { data, error } = await supabase
      .from('learning_nodes')
      .insert([
        {
          topic_id: node.topicId,
          title: node.title,
          description: node.description,
          position: node.position || { x: 300, y: 300 },
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a node
   * @param {string} id - Node UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated node
   */
  async update(id, updates) {
    const updateData = {}
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.position !== undefined) updateData.position = updates.position

    const { data, error } = await supabase
      .from('learning_nodes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update node position
   * @param {string} id - Node UUID
   * @param {Object} position - Position {x, y}
   * @returns {Promise<Object>} Updated node
   */
  async updatePosition(id, position) {
    return this.update(id, { position })
  },

  /**
   * Delete a node (will cascade delete all connections)
   * @param {string} id - Node UUID
   */
  async delete(id) {
    const { error } = await supabase.from('learning_nodes').delete().eq('id', id)

    if (error) throw error
  },

  /**
   * Get connection count for a node using database function
   * @param {string} nodeId - Node UUID
   * @returns {Promise<number>} Number of connections
   */
  async getConnectionCount(nodeId) {
    const { data, error } = await supabase.rpc('get_node_connection_count', { node_id: nodeId })

    if (error) throw error
    return data || 0
  },
}

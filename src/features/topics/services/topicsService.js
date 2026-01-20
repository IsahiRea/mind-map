import { supabase } from '../../../lib/supabase'

export const topicsService = {
  /**
   * Get all topics with node counts
   * @returns {Promise<Array>} Array of topics with node_count
   */
  async getAll() {
    const { data, error } = await supabase
      .from('topics_with_counts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Get a single topic by ID
   * @param {string} id - Topic UUID
   * @returns {Promise<Object>} Topic object
   */
  async getById(id) {
    const { data, error } = await supabase.from('topics').select('*').eq('id', id).single()

    if (error) throw error
    return data
  },

  /**
   * Create a new topic
   * @param {Object} topic - Topic data
   * @param {string} topic.title - Topic title
   * @param {string} topic.description - Topic description
   * @param {string} topic.iconBgColor - Background color for icon
   * @param {string} topic.iconColor - Icon color
   * @param {boolean} topic.isPublic - Whether the topic is public
   * @returns {Promise<Object>} Created topic
   */
  async create(topic) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error('Must be authenticated to create topics')

    const { data, error } = await supabase
      .from('topics')
      .insert([
        {
          title: topic.title,
          description: topic.description,
          icon_bg_color: topic.iconBgColor,
          icon_color: topic.iconColor,
          user_id: user.id,
          is_public: topic.isPublic ?? false,
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a topic
   * @param {string} id - Topic UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated topic
   */
  async update(id, updates) {
    const updateData = {}
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.iconBgColor !== undefined) updateData.icon_bg_color = updates.iconBgColor
    if (updates.iconColor !== undefined) updateData.icon_color = updates.iconColor
    if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic

    const { data, error } = await supabase
      .from('topics')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete a topic (will cascade delete all nodes and connections)
   * @param {string} id - Topic UUID
   */
  async delete(id) {
    const { error } = await supabase.from('topics').delete().eq('id', id)

    if (error) throw error
  },
}

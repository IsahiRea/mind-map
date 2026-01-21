import { supabase } from '../../../lib/supabase'

const PAGE_SIZE = 12

/**
 * Transform database topic to component format
 */
function transformPublicTopic(topic) {
  return {
    id: topic.id,
    title: topic.title,
    description: topic.description,
    iconBgColor: topic.icon_bg_color,
    iconColor: topic.icon_color,
    createdAt: topic.created_at,
    nodeCount: topic.node_count || 0,
    ownerId: topic.user_id,
    ownerDisplayName: topic.owner_display_name || 'Anonymous',
    ownerAvatarUrl: topic.owner_avatar_url || null,
  }
}

export const exploreService = {
  /**
   * Get paginated public topics with owner info
   * Uses public_topics_with_owners view for efficient single-query fetch
   * Falls back to topics_with_counts + separate profile query if view doesn't exist
   *
   * @param {Object} options - Query options
   * @param {string} options.search - Search term for title/description
   * @param {string} options.sortBy - Sort option (newest, oldest, title, nodes)
   * @param {number} options.page - Page number (0-indexed)
   * @returns {Promise<Object>} { topics, hasMore }
   */
  async getPublicTopics({ search = '', sortBy = 'newest', page = 0 } = {}) {
    // Try the optimized view first
    let query = supabase.from('public_topics_with_owners').select('*')

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply sorting
    switch (sortBy) {
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      case 'title':
        query = query.order('title', { ascending: true })
        break
      case 'nodes':
        query = query.order('node_count', { ascending: false })
        break
      default: // newest
        query = query.order('created_at', { ascending: false })
    }

    // Apply pagination - fetch one extra to check if more exist
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE
    query = query.range(from, to)

    const { data: topicsData, error: topicsError } = await query

    // If view doesn't exist, fall back to two-query approach
    if (topicsError?.code === '42P01') {
      return this._getPublicTopicsFallback({ search, sortBy, page })
    }

    if (topicsError) throw topicsError

    // Transform data and check if more pages exist
    const topics = (topicsData || []).slice(0, PAGE_SIZE).map(transformPublicTopic)
    const hasMore = (topicsData || []).length > PAGE_SIZE

    return { topics, hasMore }
  },

  /**
   * Fallback method using two queries (for when view doesn't exist)
   * @private
   */
  async _getPublicTopicsFallback({ search = '', sortBy = 'newest', page = 0 } = {}) {
    let query = supabase.from('topics_with_counts').select('*').eq('is_public', true)

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    switch (sortBy) {
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      case 'title':
        query = query.order('title', { ascending: true })
        break
      case 'nodes':
        query = query.order('node_count', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE
    query = query.range(from, to)

    const { data: topicsData, error: topicsError } = await query
    if (topicsError) throw topicsError

    // Fetch profiles separately
    const userIds = [...new Set((topicsData || []).map(t => t.user_id).filter(Boolean))]
    let profilesMap = {}

    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds)

      profilesMap = (profilesData || []).reduce((acc, profile) => {
        acc[profile.id] = profile
        return acc
      }, {})
    }

    const topics = (topicsData || []).slice(0, PAGE_SIZE).map(topic => {
      const profile = profilesMap[topic.user_id] || {}
      return {
        id: topic.id,
        title: topic.title,
        description: topic.description,
        iconBgColor: topic.icon_bg_color,
        iconColor: topic.icon_color,
        createdAt: topic.created_at,
        nodeCount: topic.node_count || 0,
        ownerId: topic.user_id,
        ownerDisplayName: profile.display_name || 'Anonymous',
        ownerAvatarUrl: profile.avatar_url || null,
      }
    })

    return { topics, hasMore: (topicsData || []).length > PAGE_SIZE }
  },

  /**
   * Get a specific user's public topics
   * @param {string} userId - User UUID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} { topics, hasMore }
   */
  async getUserPublicTopics(userId, { sortBy = 'newest', page = 0 } = {}) {
    // Try optimized view first
    let query = supabase.from('public_topics_with_owners').select('*').eq('user_id', userId)

    // Apply sorting
    switch (sortBy) {
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      case 'title':
        query = query.order('title', { ascending: true })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    // Apply pagination
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE
    query = query.range(from, to)

    const { data, error } = await query

    // Fallback if view doesn't exist
    if (error?.code === '42P01') {
      return this._getUserPublicTopicsFallback(userId, { sortBy, page })
    }

    if (error) throw error

    const topics = (data || []).slice(0, PAGE_SIZE).map(transformPublicTopic)
    return { topics, hasMore: (data || []).length > PAGE_SIZE }
  },

  /**
   * Fallback for user topics when view doesn't exist
   * @private
   */
  async _getUserPublicTopicsFallback(userId, { sortBy = 'newest', page = 0 } = {}) {
    let query = supabase
      .from('topics_with_counts')
      .select('*')
      .eq('is_public', true)
      .eq('user_id', userId)

    switch (sortBy) {
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      case 'title':
        query = query.order('title', { ascending: true })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE
    query = query.range(from, to)

    const { data, error } = await query
    if (error) throw error

    const topics = (data || []).slice(0, PAGE_SIZE).map(topic => ({
      id: topic.id,
      title: topic.title,
      description: topic.description,
      iconBgColor: topic.icon_bg_color,
      iconColor: topic.icon_color,
      createdAt: topic.created_at,
      nodeCount: topic.node_count || 0,
    }))

    return { topics, hasMore: (data || []).length > PAGE_SIZE }
  },

  /**
   * Get public user profile info
   * @param {string} userId - User UUID
   * @returns {Promise<Object|null>} User profile or null if not found
   */
  async getPublicUserProfile(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, display_name, avatar_url')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found
        return null
      }
      throw error
    }

    return {
      userId: data.id,
      displayName: data.display_name || 'Anonymous',
      avatarUrl: data.avatar_url,
    }
  },
}

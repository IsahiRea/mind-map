import { supabase } from '../../../lib/supabase'

export const userService = {
  /**
   * Get a user profile by ID
   * @param {string} userId - User UUID
   * @returns {Promise<Object|null>} User profile or null
   */
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  /**
   * Create a new user profile
   * @param {Object} profile - Profile data
   * @param {string} profile.id - User UUID
   * @param {string} profile.displayName - Display name
   * @param {string} profile.avatarUrl - Avatar URL
   * @param {string} profile.authProvider - Auth provider (google, github, email)
   * @returns {Promise<Object>} Created profile
   */
  async createProfile(profile) {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([
        {
          id: profile.id,
          display_name: profile.displayName,
          avatar_url: profile.avatarUrl,
          auth_provider: profile.authProvider,
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a user profile
   * @param {string} userId - User UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated profile
   */
  async updateProfile(userId, updates) {
    const updateData = {}
    if (updates.displayName !== undefined) updateData.display_name = updates.displayName
    if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Sync profile from auth user data (auto-create on first OAuth sign-in)
   * @param {Object} authUser - Supabase auth user object
   * @returns {Promise<Object>} User profile (existing or newly created)
   */
  async syncFromAuth(authUser) {
    // Check if profile exists
    const existing = await this.getProfile(authUser.id)
    if (existing) return existing

    // Extract profile data from auth user metadata
    const metadata = authUser.user_metadata || {}
    const provider = authUser.app_metadata?.provider || 'email'

    // Determine display name and avatar from metadata
    const displayName =
      metadata.full_name ||
      metadata.name ||
      metadata.preferred_username ||
      authUser.email?.split('@')[0] ||
      'User'

    const avatarUrl = metadata.avatar_url || metadata.picture || null

    // Create new profile
    return this.createProfile({
      id: authUser.id,
      displayName,
      avatarUrl,
      authProvider: provider,
    })
  },
}

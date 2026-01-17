import { useState, useEffect } from 'react'
import { authService } from '../services/authService'

/**
 * Custom hook for managing authentication state
 * @returns {Object} Auth state and operations
 */
export function useAuth() {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Get initial session
    authService
      .getSession()
      .then(session => {
        setSession(session)
        setUser(session?.user ?? null)
      })
      .catch(err => {
        console.error('Error getting session:', err)
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })

    // Listen for auth changes
    const subscription = authService.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event)
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  /**
   * Sign up a new user
   * @param {string} email - User email
   * @param {string} password - User password
   */
  async function signUp(email, password) {
    try {
      setLoading(true)
      setError(null)
      const data = await authService.signUp(email, password)
      return data
    } catch (err) {
      console.error('Error signing up:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Sign in an existing user
   * @param {string} email - User email
   * @param {string} password - User password
   */
  async function signIn(email, password) {
    try {
      setLoading(true)
      setError(null)
      const data = await authService.signIn(email, password)
      return data
    } catch (err) {
      console.error('Error signing in:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Sign out the current user
   */
  async function signOut() {
    try {
      setLoading(true)
      setError(null)
      await authService.signOut()
    } catch (err) {
      console.error('Error signing out:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Sign in with Google OAuth
   */
  async function signInWithGoogle() {
    try {
      setLoading(true)
      setError(null)
      const data = await authService.signInWithOAuth('google')
      return data
    } catch (err) {
      console.error('Error signing in with Google:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Sign in with GitHub OAuth
   */
  async function signInWithGitHub() {
    try {
      setLoading(true)
      setError(null)
      const data = await authService.signInWithOAuth('github')
      return data
    } catch (err) {
      console.error('Error signing in with GitHub:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    session,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    signInWithGitHub,
    isAuthenticated: !!user,
  }
}

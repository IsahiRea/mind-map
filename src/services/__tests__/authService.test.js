import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authService } from '../authService'
import { supabase } from '../../lib/supabase'

// Mock the supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}))

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signUp', () => {
    it('should successfully sign up a user', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockData = { user: mockUser, session: {} }

      supabase.auth.signUp.mockResolvedValue({ data: mockData, error: null })

      const result = await authService.signUp('test@example.com', 'password123')

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(result).toEqual(mockData)
    })

    it('should throw error when sign up fails', async () => {
      const mockError = new Error('Sign up failed')
      supabase.auth.signUp.mockResolvedValue({ data: null, error: mockError })

      await expect(authService.signUp('test@example.com', 'password123')).rejects.toThrow(
        'Sign up failed'
      )
    })
  })

  describe('signIn', () => {
    it('should successfully sign in a user', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockData = { user: mockUser, session: {} }

      supabase.auth.signInWithPassword.mockResolvedValue({ data: mockData, error: null })

      const result = await authService.signIn('test@example.com', 'password123')

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(result).toEqual(mockData)
    })

    it('should throw error when sign in fails', async () => {
      const mockError = new Error('Invalid credentials')
      supabase.auth.signInWithPassword.mockResolvedValue({ data: null, error: mockError })

      await expect(authService.signIn('test@example.com', 'wrongpassword')).rejects.toThrow(
        'Invalid credentials'
      )
    })
  })

  describe('signOut', () => {
    it('should successfully sign out', async () => {
      supabase.auth.signOut.mockResolvedValue({ error: null })

      await authService.signOut()

      expect(supabase.auth.signOut).toHaveBeenCalled()
    })

    it('should throw error when sign out fails', async () => {
      const mockError = new Error('Sign out failed')
      supabase.auth.signOut.mockResolvedValue({ error: mockError })

      await expect(authService.signOut()).rejects.toThrow('Sign out failed')
    })
  })

  describe('getSession', () => {
    it('should return current session', async () => {
      const mockSession = { user: { id: '123' }, access_token: 'token' }
      supabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null })

      const result = await authService.getSession()

      expect(supabase.auth.getSession).toHaveBeenCalled()
      expect(result).toEqual(mockSession)
    })

    it('should throw error when getting session fails', async () => {
      const mockError = new Error('Session error')
      supabase.auth.getSession.mockResolvedValue({ data: null, error: mockError })

      await expect(authService.getSession()).rejects.toThrow('Session error')
    })
  })

  describe('getUser', () => {
    it('should return current user', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })

      const result = await authService.getUser()

      expect(supabase.auth.getUser).toHaveBeenCalled()
      expect(result).toEqual(mockUser)
    })

    it('should throw error when getting user fails', async () => {
      const mockError = new Error('User error')
      supabase.auth.getUser.mockResolvedValue({ data: null, error: mockError })

      await expect(authService.getUser()).rejects.toThrow('User error')
    })
  })

  describe('onAuthStateChange', () => {
    it('should set up auth state change listener', () => {
      const mockCallback = vi.fn()
      const mockSubscription = { unsubscribe: vi.fn() }

      supabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: mockSubscription } })

      const result = authService.onAuthStateChange(mockCallback)

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled()
      expect(result).toEqual(mockSubscription)
    })
  })
})

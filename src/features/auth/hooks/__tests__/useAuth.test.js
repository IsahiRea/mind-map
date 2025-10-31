import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuth } from '../useAuth'
import { authService } from '../../services/authService'

// Mock the auth service
vi.mock('../../services/authService')

describe('useAuth', () => {
  let mockSubscription

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mocks
    mockSubscription = { unsubscribe: vi.fn() }
    authService.getSession.mockResolvedValue(null)
    authService.onAuthStateChange.mockReturnValue(mockSubscription)
  })

  it('should initialize with null user and loading state', () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
    expect(result.current.loading).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should load initial session on mount', async () => {
    const mockSession = {
      user: { id: '123', email: 'test@example.com' },
      access_token: 'token',
    }

    authService.getSession.mockResolvedValue(mockSession)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.session).toEqual(mockSession)
    expect(result.current.user).toEqual(mockSession.user)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('should handle error when loading session', async () => {
    const mockError = new Error('Session error')
    authService.getSession.mockRejectedValue(mockError)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Session error')
    expect(result.current.user).toBeNull()
  })

  it('should setup auth state change listener', () => {
    renderHook(() => useAuth())

    expect(authService.onAuthStateChange).toHaveBeenCalled()
  })

  it('should update state when auth state changes', async () => {
    let authStateCallback
    authService.onAuthStateChange.mockImplementation(callback => {
      authStateCallback = callback
      return mockSubscription
    })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Simulate auth state change
    const newSession = {
      user: { id: '456', email: 'new@example.com' },
      access_token: 'new-token',
    }

    act(() => {
      authStateCallback('SIGNED_IN', newSession)
    })

    expect(result.current.session).toEqual(newSession)
    expect(result.current.user).toEqual(newSession.user)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('should sign up a new user', async () => {
    const mockData = {
      user: { id: '123', email: 'test@example.com' },
      session: {},
    }

    authService.signUp.mockResolvedValue(mockData)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    let signUpResult
    await act(async () => {
      signUpResult = await result.current.signUp('test@example.com', 'password123')
    })

    expect(authService.signUp).toHaveBeenCalledWith('test@example.com', 'password123')
    expect(signUpResult).toEqual(mockData)
    expect(result.current.error).toBeNull()
  })

  it('should handle sign up error', async () => {
    const mockError = new Error('Sign up failed')
    authService.signUp.mockRejectedValue(mockError)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await expect(result.current.signUp('test@example.com', 'password123')).rejects.toThrow(
        'Sign up failed'
      )
    })

    expect(result.current.error).toBe('Sign up failed')
  })

  it('should sign in a user', async () => {
    const mockData = {
      user: { id: '123', email: 'test@example.com' },
      session: {},
    }

    authService.signIn.mockResolvedValue(mockData)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    let signInResult
    await act(async () => {
      signInResult = await result.current.signIn('test@example.com', 'password123')
    })

    expect(authService.signIn).toHaveBeenCalledWith('test@example.com', 'password123')
    expect(signInResult).toEqual(mockData)
    expect(result.current.error).toBeNull()
  })

  it('should handle sign in error', async () => {
    const mockError = new Error('Invalid credentials')
    authService.signIn.mockRejectedValue(mockError)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await expect(result.current.signIn('test@example.com', 'wrongpassword')).rejects.toThrow(
        'Invalid credentials'
      )
    })

    expect(result.current.error).toBe('Invalid credentials')
  })

  it('should sign out a user', async () => {
    authService.signOut.mockResolvedValue()

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.signOut()
    })

    expect(authService.signOut).toHaveBeenCalled()
    expect(result.current.error).toBeNull()
  })

  it('should handle sign out error', async () => {
    const mockError = new Error('Sign out failed')
    authService.signOut.mockRejectedValue(mockError)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await expect(result.current.signOut()).rejects.toThrow('Sign out failed')
    })

    expect(result.current.error).toBe('Sign out failed')
  })

  it('should unsubscribe from auth state changes on unmount', () => {
    const { unmount } = renderHook(() => useAuth())

    unmount()

    expect(mockSubscription.unsubscribe).toHaveBeenCalled()
  })
})

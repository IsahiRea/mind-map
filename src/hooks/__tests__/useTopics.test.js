import React from 'react'
import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTopics } from '../useTopics'
import { topicsService } from '../../services/topicsService'

// Mock the topics service
vi.mock('../../services/topicsService')

// Create a wrapper with QueryClientProvider
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useTopics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with empty topics and loading state', () => {
    topicsService.getAll.mockResolvedValue([])

    const { result } = renderHook(() => useTopics(), { wrapper: createWrapper() })

    expect(result.current.topics).toEqual([])
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('should load topics on mount', async () => {
    const mockTopics = [
      {
        id: '1',
        title: 'Topic 1',
        description: 'Description 1',
        icon_bg_color: '#4f46e5',
        icon_color: '#ffffff',
        node_count: 5,
      },
      {
        id: '2',
        title: 'Topic 2',
        description: 'Description 2',
        icon_bg_color: '#8b5cf6',
        icon_color: '#ffffff',
        node_count: 3,
      },
    ]

    topicsService.getAll.mockResolvedValue(mockTopics)

    const { result } = renderHook(() => useTopics(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.topics).toHaveLength(2)
    expect(result.current.topics[0]).toEqual({
      id: '1',
      title: 'Topic 1',
      description: 'Description 1',
      iconBgColor: '#4f46e5',
      iconColor: '#ffffff',
      nodeCount: 5,
    })
  })

  it('should handle loading error', async () => {
    const mockError = new Error('Failed to load topics')
    topicsService.getAll.mockRejectedValue(mockError)

    const { result } = renderHook(() => useTopics(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to load topics')
    expect(result.current.topics).toEqual([])
  })

  it('should create a new topic', async () => {
    topicsService.getAll.mockResolvedValue([])

    const newTopicData = {
      title: 'New Topic',
      description: 'New Description',
      iconBgColor: '#4f46e5',
      iconColor: '#ffffff',
    }

    const createdTopic = {
      id: '123',
      title: 'New Topic',
      description: 'New Description',
      icon_bg_color: '#4f46e5',
      icon_color: '#ffffff',
    }

    topicsService.create.mockResolvedValue(createdTopic)

    const { result } = renderHook(() => useTopics(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    let createdResult
    await act(async () => {
      createdResult = await result.current.createTopic(newTopicData)
    })

    expect(topicsService.create).toHaveBeenCalledWith(newTopicData)
    expect(result.current.topics).toHaveLength(1)
    expect(result.current.topics[0]).toEqual({
      id: '123',
      title: 'New Topic',
      description: 'New Description',
      iconBgColor: '#4f46e5',
      iconColor: '#ffffff',
      nodeCount: 0,
    })
    expect(createdResult).toEqual({
      id: '123',
      title: 'New Topic',
      description: 'New Description',
      iconBgColor: '#4f46e5',
      iconColor: '#ffffff',
      nodeCount: 0,
    })
  })

  it('should handle create topic error', async () => {
    topicsService.getAll.mockResolvedValue([])

    const mockError = new Error('Failed to create topic')
    topicsService.create.mockRejectedValue(mockError)

    const { result } = renderHook(() => useTopics(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await expect(
        result.current.createTopic({ title: 'Test', description: 'Test' })
      ).rejects.toThrow('Failed to create topic')
    })

    expect(result.current.error).toBe('Failed to create topic')
  })

  it('should delete a topic', async () => {
    const mockTopics = [
      {
        id: '1',
        title: 'Topic 1',
        description: 'Description 1',
        icon_bg_color: '#4f46e5',
        icon_color: '#ffffff',
        node_count: 5,
      },
      {
        id: '2',
        title: 'Topic 2',
        description: 'Description 2',
        icon_bg_color: '#8b5cf6',
        icon_color: '#ffffff',
        node_count: 3,
      },
    ]

    topicsService.getAll.mockResolvedValue(mockTopics)
    topicsService.delete.mockResolvedValue()

    const { result } = renderHook(() => useTopics(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.topics).toHaveLength(2)

    await act(async () => {
      await result.current.deleteTopic('1')
    })

    expect(topicsService.delete).toHaveBeenCalledWith('1')
    expect(result.current.topics).toHaveLength(1)
    expect(result.current.topics[0].id).toBe('2')
  })

  it('should handle delete topic error', async () => {
    topicsService.getAll.mockResolvedValue([])

    const mockError = new Error('Failed to delete topic')
    topicsService.delete.mockRejectedValue(mockError)

    const { result } = renderHook(() => useTopics(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await expect(result.current.deleteTopic('123')).rejects.toThrow('Failed to delete topic')
    })

    expect(result.current.error).toBe('Failed to delete topic')
  })

  it('should update a topic', async () => {
    const mockTopics = [
      {
        id: '1',
        title: 'Topic 1',
        description: 'Description 1',
        icon_bg_color: '#4f46e5',
        icon_color: '#ffffff',
        node_count: 5,
      },
    ]

    topicsService.getAll.mockResolvedValue(mockTopics)

    const updatedTopic = {
      id: '1',
      title: 'Updated Topic',
      description: 'Updated Description',
      icon_bg_color: '#8b5cf6',
      icon_color: '#000000',
    }

    topicsService.update.mockResolvedValue(updatedTopic)

    const { result } = renderHook(() => useTopics(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.updateTopic('1', {
        title: 'Updated Topic',
        description: 'Updated Description',
      })
    })

    expect(topicsService.update).toHaveBeenCalledWith('1', {
      title: 'Updated Topic',
      description: 'Updated Description',
    })
    expect(result.current.topics[0].title).toBe('Updated Topic')
    expect(result.current.topics[0].description).toBe('Updated Description')
  })

  it('should handle update topic error', async () => {
    topicsService.getAll.mockResolvedValue([])

    const mockError = new Error('Failed to update topic')
    topicsService.update.mockRejectedValue(mockError)

    const { result } = renderHook(() => useTopics(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await expect(result.current.updateTopic('123', { title: 'Test' })).rejects.toThrow(
        'Failed to update topic'
      )
    })

    expect(result.current.error).toBe('Failed to update topic')
  })

  it('should refresh topics', async () => {
    topicsService.getAll.mockResolvedValue([])

    const { result } = renderHook(() => useTopics(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const newMockTopics = [
      {
        id: '1',
        title: 'Topic 1',
        description: 'Description 1',
        icon_bg_color: '#4f46e5',
        icon_color: '#ffffff',
        node_count: 5,
      },
    ]

    topicsService.getAll.mockResolvedValue(newMockTopics)

    await act(async () => {
      await result.current.refresh()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.topics).toHaveLength(1)
  })

  it('should handle topics with zero node_count', async () => {
    const mockTopics = [
      {
        id: '1',
        title: 'Topic 1',
        description: 'Description 1',
        icon_bg_color: '#4f46e5',
        icon_color: '#ffffff',
        node_count: null,
      },
    ]

    topicsService.getAll.mockResolvedValue(mockTopics)

    const { result } = renderHook(() => useTopics(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.topics[0].nodeCount).toBe(0)
  })
})

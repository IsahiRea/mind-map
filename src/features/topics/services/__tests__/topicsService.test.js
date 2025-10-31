import { describe, it, expect, vi, beforeEach } from 'vitest'
import { topicsService } from '../topicsService'
import { supabase } from '../../lib/supabase'

// Mock the supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('topicsService', () => {
  let mockFrom
  let mockSelect
  let mockInsert
  let mockUpdate
  let mockDelete
  let mockEq
  let mockOrder
  let mockSingle

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mock chain
    mockSingle = vi.fn()
    mockEq = vi.fn(() => ({ single: mockSingle }))
    mockOrder = vi.fn()
    mockSelect = vi.fn()
    mockInsert = vi.fn(() => ({ select: mockSelect }))
    mockUpdate = vi.fn(() => ({ eq: mockEq }))
    mockDelete = vi.fn(() => ({ eq: mockEq }))

    mockFrom = vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    }))

    supabase.from.mockImplementation(mockFrom)
  })

  describe('getAll', () => {
    it('should return all topics ordered by created_at', async () => {
      const mockTopics = [
        { id: '1', title: 'Topic 1', node_count: 5 },
        { id: '2', title: 'Topic 2', node_count: 3 },
      ]

      mockOrder.mockResolvedValue({ data: mockTopics, error: null })
      mockSelect.mockReturnValue({ order: mockOrder })

      const result = await topicsService.getAll()

      expect(supabase.from).toHaveBeenCalledWith('topics_with_counts')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result).toEqual(mockTopics)
    })

    it('should return empty array when no topics exist', async () => {
      mockOrder.mockResolvedValue({ data: null, error: null })
      mockSelect.mockReturnValue({ order: mockOrder })

      const result = await topicsService.getAll()

      expect(result).toEqual([])
    })

    it('should throw error when query fails', async () => {
      const mockError = new Error('Database error')
      mockOrder.mockResolvedValue({ data: null, error: mockError })
      mockSelect.mockReturnValue({ order: mockOrder })

      await expect(topicsService.getAll()).rejects.toThrow('Database error')
    })
  })

  describe('getById', () => {
    it('should return a topic by id', async () => {
      const mockTopic = { id: '123', title: 'Test Topic' }

      mockSingle.mockResolvedValue({ data: mockTopic, error: null })
      mockEq.mockReturnValue({ single: mockSingle })
      mockSelect.mockReturnValue({ eq: mockEq })

      const result = await topicsService.getById('123')

      expect(supabase.from).toHaveBeenCalledWith('topics')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockEq).toHaveBeenCalledWith('id', '123')
      expect(result).toEqual(mockTopic)
    })

    it('should throw error when topic not found', async () => {
      const mockError = new Error('Topic not found')
      mockSingle.mockResolvedValue({ data: null, error: mockError })
      mockEq.mockReturnValue({ single: mockSingle })
      mockSelect.mockReturnValue({ eq: mockEq })

      await expect(topicsService.getById('999')).rejects.toThrow('Topic not found')
    })
  })

  describe('create', () => {
    it('should create a new topic', async () => {
      const topicInput = {
        title: 'New Topic',
        description: 'Description',
        iconBgColor: '#4f46e5',
        iconColor: '#ffffff',
      }

      const mockCreatedTopic = { id: '123', ...topicInput }

      mockSingle.mockResolvedValue({ data: mockCreatedTopic, error: null })
      mockSelect.mockReturnValue({ single: mockSingle })

      const result = await topicsService.create(topicInput)

      expect(supabase.from).toHaveBeenCalledWith('topics')
      expect(mockInsert).toHaveBeenCalledWith([
        {
          title: 'New Topic',
          description: 'Description',
          icon_bg_color: '#4f46e5',
          icon_color: '#ffffff',
        },
      ])
      expect(result).toEqual(mockCreatedTopic)
    })

    it('should throw error when creation fails', async () => {
      const mockError = new Error('Creation failed')
      mockSingle.mockResolvedValue({ data: null, error: mockError })
      mockSelect.mockReturnValue({ single: mockSingle })

      await expect(topicsService.create({ title: 'Test', description: 'Test' })).rejects.toThrow(
        'Creation failed'
      )
    })
  })

  describe('update', () => {
    it('should update a topic with provided fields', async () => {
      const updates = { title: 'Updated Title', description: 'Updated Description' }
      const mockUpdatedTopic = { id: '123', ...updates }

      mockSingle.mockResolvedValue({ data: mockUpdatedTopic, error: null })
      mockSelect.mockReturnValue({ single: mockSingle })
      mockEq.mockReturnValue({ select: mockSelect })

      const result = await topicsService.update('123', updates)

      expect(supabase.from).toHaveBeenCalledWith('topics')
      expect(mockUpdate).toHaveBeenCalledWith({
        title: 'Updated Title',
        description: 'Updated Description',
      })
      expect(mockEq).toHaveBeenCalledWith('id', '123')
      expect(result).toEqual(mockUpdatedTopic)
    })

    it('should only update provided fields', async () => {
      const updates = { title: 'Only Title' }
      const mockUpdatedTopic = { id: '123', title: 'Only Title' }

      mockSingle.mockResolvedValue({ data: mockUpdatedTopic, error: null })
      mockSelect.mockReturnValue({ single: mockSingle })
      mockEq.mockReturnValue({ select: mockSelect })

      await topicsService.update('123', updates)

      expect(mockUpdate).toHaveBeenCalledWith({ title: 'Only Title' })
    })

    it('should throw error when update fails', async () => {
      const mockError = new Error('Update failed')
      mockSingle.mockResolvedValue({ data: null, error: mockError })
      mockSelect.mockReturnValue({ single: mockSingle })
      mockEq.mockReturnValue({ select: mockSelect })

      await expect(topicsService.update('123', { title: 'Test' })).rejects.toThrow('Update failed')
    })
  })

  describe('delete', () => {
    it('should delete a topic by id', async () => {
      mockEq.mockResolvedValue({ error: null })

      await topicsService.delete('123')

      expect(supabase.from).toHaveBeenCalledWith('topics')
      expect(mockDelete).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalledWith('id', '123')
    })

    it('should throw error when delete fails', async () => {
      const mockError = new Error('Delete failed')
      mockEq.mockResolvedValue({ error: mockError })

      await expect(topicsService.delete('123')).rejects.toThrow('Delete failed')
    })
  })
})

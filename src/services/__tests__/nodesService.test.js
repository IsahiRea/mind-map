import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nodesService } from '../nodesService'
import { supabase } from '../../lib/supabase'

// Mock the supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}))

describe('nodesService', () => {
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
    mockOrder = vi.fn()
    mockEq = vi.fn()
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

  describe('getByTopicId', () => {
    it('should return all nodes for a topic', async () => {
      const mockNodes = [
        { id: '1', topic_id: 'topic-123', title: 'Node 1' },
        { id: '2', topic_id: 'topic-123', title: 'Node 2' },
      ]

      mockOrder.mockResolvedValue({ data: mockNodes, error: null })
      mockEq.mockReturnValue({ order: mockOrder })
      mockSelect.mockReturnValue({ eq: mockEq })

      const result = await nodesService.getByTopicId('topic-123')

      expect(supabase.from).toHaveBeenCalledWith('learning_nodes')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockEq).toHaveBeenCalledWith('topic_id', 'topic-123')
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: true })
      expect(result).toEqual(mockNodes)
    })

    it('should return empty array when no nodes exist', async () => {
      mockOrder.mockResolvedValue({ data: null, error: null })
      mockEq.mockReturnValue({ order: mockOrder })
      mockSelect.mockReturnValue({ eq: mockEq })

      const result = await nodesService.getByTopicId('topic-123')

      expect(result).toEqual([])
    })

    it('should throw error when query fails', async () => {
      const mockError = new Error('Database error')
      mockOrder.mockResolvedValue({ data: null, error: mockError })
      mockEq.mockReturnValue({ order: mockOrder })
      mockSelect.mockReturnValue({ eq: mockEq })

      await expect(nodesService.getByTopicId('topic-123')).rejects.toThrow('Database error')
    })
  })

  describe('getById', () => {
    it('should return a node by id', async () => {
      const mockNode = { id: '123', title: 'Test Node' }

      mockSingle.mockResolvedValue({ data: mockNode, error: null })
      mockEq.mockReturnValue({ single: mockSingle })
      mockSelect.mockReturnValue({ eq: mockEq })

      const result = await nodesService.getById('123')

      expect(supabase.from).toHaveBeenCalledWith('learning_nodes')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockEq).toHaveBeenCalledWith('id', '123')
      expect(result).toEqual(mockNode)
    })

    it('should throw error when node not found', async () => {
      const mockError = new Error('Node not found')
      mockSingle.mockResolvedValue({ data: null, error: mockError })
      mockEq.mockReturnValue({ single: mockSingle })
      mockSelect.mockReturnValue({ eq: mockEq })

      await expect(nodesService.getById('999')).rejects.toThrow('Node not found')
    })
  })

  describe('create', () => {
    it('should create a new node with provided position', async () => {
      const nodeInput = {
        topicId: 'topic-123',
        title: 'New Node',
        description: 'Description',
        position: { x: 100, y: 200 },
      }

      const mockCreatedNode = { id: '123', ...nodeInput }

      mockSingle.mockResolvedValue({ data: mockCreatedNode, error: null })
      mockSelect.mockReturnValue({ single: mockSingle })

      const result = await nodesService.create(nodeInput)

      expect(supabase.from).toHaveBeenCalledWith('learning_nodes')
      expect(mockInsert).toHaveBeenCalledWith([
        {
          topic_id: 'topic-123',
          title: 'New Node',
          description: 'Description',
          position: { x: 100, y: 200 },
        },
      ])
      expect(result).toEqual(mockCreatedNode)
    })

    it('should create a node with default position if not provided', async () => {
      const nodeInput = {
        topicId: 'topic-123',
        title: 'New Node',
        description: 'Description',
      }

      const mockCreatedNode = { id: '123', ...nodeInput }

      mockSingle.mockResolvedValue({ data: mockCreatedNode, error: null })
      mockSelect.mockReturnValue({ single: mockSingle })

      await nodesService.create(nodeInput)

      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          position: { x: 300, y: 300 },
        }),
      ])
    })

    it('should throw error when creation fails', async () => {
      const mockError = new Error('Creation failed')
      mockSingle.mockResolvedValue({ data: null, error: mockError })
      mockSelect.mockReturnValue({ single: mockSingle })

      await expect(
        nodesService.create({ topicId: 'topic-123', title: 'Test', description: 'Test' })
      ).rejects.toThrow('Creation failed')
    })
  })

  describe('update', () => {
    it('should update a node with provided fields', async () => {
      const updates = { title: 'Updated Title', description: 'Updated Description' }
      const mockUpdatedNode = { id: '123', ...updates }

      mockSingle.mockResolvedValue({ data: mockUpdatedNode, error: null })
      mockSelect.mockReturnValue({ single: mockSingle })
      mockEq.mockReturnValue({ select: mockSelect })

      const result = await nodesService.update('123', updates)

      expect(supabase.from).toHaveBeenCalledWith('learning_nodes')
      expect(mockUpdate).toHaveBeenCalledWith({
        title: 'Updated Title',
        description: 'Updated Description',
      })
      expect(mockEq).toHaveBeenCalledWith('id', '123')
      expect(result).toEqual(mockUpdatedNode)
    })

    it('should throw error when update fails', async () => {
      const mockError = new Error('Update failed')
      mockSingle.mockResolvedValue({ data: null, error: mockError })
      mockSelect.mockReturnValue({ single: mockSingle })
      mockEq.mockReturnValue({ select: mockSelect })

      await expect(nodesService.update('123', { title: 'Test' })).rejects.toThrow('Update failed')
    })
  })

  describe('updatePosition', () => {
    it('should update node position', async () => {
      const position = { x: 150, y: 250 }
      const mockUpdatedNode = { id: '123', position }

      mockSingle.mockResolvedValue({ data: mockUpdatedNode, error: null })
      mockSelect.mockReturnValue({ single: mockSingle })
      mockEq.mockReturnValue({ select: mockSelect })

      const result = await nodesService.updatePosition('123', position)

      expect(mockUpdate).toHaveBeenCalledWith({ position })
      expect(result).toEqual(mockUpdatedNode)
    })
  })

  describe('delete', () => {
    it('should delete a node by id', async () => {
      mockEq.mockResolvedValue({ error: null })

      await nodesService.delete('123')

      expect(supabase.from).toHaveBeenCalledWith('learning_nodes')
      expect(mockDelete).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalledWith('id', '123')
    })

    it('should throw error when delete fails', async () => {
      const mockError = new Error('Delete failed')
      mockEq.mockResolvedValue({ error: mockError })

      await expect(nodesService.delete('123')).rejects.toThrow('Delete failed')
    })
  })

  describe('getConnectionCount', () => {
    it('should return connection count for a node', async () => {
      supabase.rpc.mockResolvedValue({ data: 5, error: null })

      const result = await nodesService.getConnectionCount('node-123')

      expect(supabase.rpc).toHaveBeenCalledWith('get_node_connection_count', {
        node_id: 'node-123',
      })
      expect(result).toBe(5)
    })

    it('should return 0 when no connections exist', async () => {
      supabase.rpc.mockResolvedValue({ data: null, error: null })

      const result = await nodesService.getConnectionCount('node-123')

      expect(result).toBe(0)
    })

    it('should throw error when RPC call fails', async () => {
      const mockError = new Error('RPC error')
      supabase.rpc.mockResolvedValue({ data: null, error: mockError })

      await expect(nodesService.getConnectionCount('node-123')).rejects.toThrow('RPC error')
    })
  })
})

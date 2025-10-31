import { describe, it, expect, vi, beforeEach } from 'vitest'
import { connectionsService } from '../connectionsService'
import { supabase } from '../../lib/supabase'

// Mock the supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('connectionsService', () => {
  let mockFrom
  let mockSelect
  let mockInsert
  let mockDelete
  let mockEq
  let mockOr
  let mockSingle

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mock chain
    mockSingle = vi.fn()
    mockOr = vi.fn()
    mockEq = vi.fn()
    mockSelect = vi.fn()
    mockInsert = vi.fn(() => ({ select: mockSelect }))
    mockDelete = vi.fn(() => ({ eq: mockEq, or: mockOr }))

    mockFrom = vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      delete: mockDelete,
    }))

    supabase.from.mockImplementation(mockFrom)
  })

  describe('getByTopicId', () => {
    it('should return all connections for a topic', async () => {
      const mockNodes = [{ id: 'node-1' }, { id: 'node-2' }]
      const mockConnections = [{ from_node_id: 'node-1', to_node_id: 'node-2' }]

      // First call to get nodes
      mockEq.mockResolvedValueOnce({ data: mockNodes, error: null })
      mockSelect.mockReturnValueOnce({ eq: mockEq })

      // Second call to get connections
      mockOr.mockResolvedValueOnce({ data: mockConnections, error: null })
      mockSelect.mockReturnValueOnce({ or: mockOr })

      const result = await connectionsService.getByTopicId('topic-123')

      expect(supabase.from).toHaveBeenCalledWith('learning_nodes')
      expect(supabase.from).toHaveBeenCalledWith('node_connections')
      expect(result).toEqual(mockConnections)
    })

    it('should return empty array when no nodes exist', async () => {
      mockEq.mockResolvedValue({ data: [], error: null })
      mockSelect.mockReturnValue({ eq: mockEq })

      const result = await connectionsService.getByTopicId('topic-123')

      expect(result).toEqual([])
    })

    it('should return empty array when connections data is null', async () => {
      const mockNodes = [{ id: 'node-1' }]

      mockEq.mockResolvedValueOnce({ data: mockNodes, error: null })
      mockSelect.mockReturnValueOnce({ eq: mockEq })

      mockOr.mockResolvedValueOnce({ data: null, error: null })
      mockSelect.mockReturnValueOnce({ or: mockOr })

      const result = await connectionsService.getByTopicId('topic-123')

      expect(result).toEqual([])
    })

    it('should throw error when getting nodes fails', async () => {
      const mockError = new Error('Database error')
      mockEq.mockResolvedValue({ data: null, error: mockError })
      mockSelect.mockReturnValue({ eq: mockEq })

      await expect(connectionsService.getByTopicId('topic-123')).rejects.toThrow('Database error')
    })

    it('should throw error when getting connections fails', async () => {
      const mockNodes = [{ id: 'node-1' }]
      const mockError = new Error('Connection error')

      mockEq.mockResolvedValueOnce({ data: mockNodes, error: null })
      mockSelect.mockReturnValueOnce({ eq: mockEq })

      mockOr.mockResolvedValueOnce({ data: null, error: mockError })
      mockSelect.mockReturnValueOnce({ or: mockOr })

      await expect(connectionsService.getByTopicId('topic-123')).rejects.toThrow('Connection error')
    })
  })

  describe('getByNodeId', () => {
    it('should return all connections for a node', async () => {
      const mockConnections = [
        { from_node_id: 'node-1', to_node_id: 'node-2' },
        { from_node_id: 'node-2', to_node_id: 'node-1' },
      ]

      mockOr.mockResolvedValue({ data: mockConnections, error: null })
      mockSelect.mockReturnValue({ or: mockOr })

      const result = await connectionsService.getByNodeId('node-1')

      expect(supabase.from).toHaveBeenCalledWith('node_connections')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockOr).toHaveBeenCalledWith('from_node_id.eq.node-1,to_node_id.eq.node-1')
      expect(result).toEqual(mockConnections)
    })

    it('should return empty array when no connections exist', async () => {
      mockOr.mockResolvedValue({ data: null, error: null })
      mockSelect.mockReturnValue({ or: mockOr })

      const result = await connectionsService.getByNodeId('node-1')

      expect(result).toEqual([])
    })

    it('should throw error when query fails', async () => {
      const mockError = new Error('Database error')
      mockOr.mockResolvedValue({ data: null, error: mockError })
      mockSelect.mockReturnValue({ or: mockOr })

      await expect(connectionsService.getByNodeId('node-1')).rejects.toThrow('Database error')
    })
  })

  describe('create', () => {
    it('should create a new connection', async () => {
      const mockConnection = { from_node_id: 'node-1', to_node_id: 'node-2' }

      mockSingle.mockResolvedValue({ data: mockConnection, error: null })
      mockSelect.mockReturnValue({ single: mockSingle })

      const result = await connectionsService.create('node-1', 'node-2')

      expect(supabase.from).toHaveBeenCalledWith('node_connections')
      expect(mockInsert).toHaveBeenCalledWith([
        {
          from_node_id: 'node-1',
          to_node_id: 'node-2',
        },
      ])
      expect(result).toEqual(mockConnection)
    })

    it('should throw error when creation fails', async () => {
      const mockError = new Error('Creation failed')
      mockSingle.mockResolvedValue({ data: null, error: mockError })
      mockSelect.mockReturnValue({ single: mockSingle })

      await expect(connectionsService.create('node-1', 'node-2')).rejects.toThrow('Creation failed')
    })
  })

  describe('createMany', () => {
    it('should create multiple connections at once', async () => {
      const connections = [
        { fromNodeId: 'node-1', toNodeId: 'node-2' },
        { fromNodeId: 'node-2', toNodeId: 'node-3' },
      ]

      const mockCreatedConnections = [
        { from_node_id: 'node-1', to_node_id: 'node-2' },
        { from_node_id: 'node-2', to_node_id: 'node-3' },
      ]

      mockSelect.mockResolvedValue({ data: mockCreatedConnections, error: null })

      const result = await connectionsService.createMany(connections)

      expect(mockInsert).toHaveBeenCalledWith([
        { from_node_id: 'node-1', to_node_id: 'node-2' },
        { from_node_id: 'node-2', to_node_id: 'node-3' },
      ])
      expect(result).toEqual(mockCreatedConnections)
    })

    it('should handle connections with "from" and "to" properties', async () => {
      const connections = [{ from: 'node-1', to: 'node-2' }]

      mockSelect.mockResolvedValue({ data: [], error: null })

      await connectionsService.createMany(connections)

      expect(mockInsert).toHaveBeenCalledWith([{ from_node_id: 'node-1', to_node_id: 'node-2' }])
    })

    it('should return empty array when data is null', async () => {
      mockSelect.mockResolvedValue({ data: null, error: null })

      const result = await connectionsService.createMany([])

      expect(result).toEqual([])
    })

    it('should throw error when creation fails', async () => {
      const mockError = new Error('Bulk creation failed')
      mockSelect.mockResolvedValue({ data: null, error: mockError })

      await expect(
        connectionsService.createMany([{ fromNodeId: 'node-1', toNodeId: 'node-2' }])
      ).rejects.toThrow('Bulk creation failed')
    })
  })

  describe('delete', () => {
    it('should delete a specific connection', async () => {
      const mockEqChain = vi.fn().mockResolvedValue({ error: null })
      mockEq.mockReturnValueOnce({ eq: mockEqChain })

      await connectionsService.delete('node-1', 'node-2')

      expect(supabase.from).toHaveBeenCalledWith('node_connections')
      expect(mockDelete).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalledWith('from_node_id', 'node-1')
      expect(mockEqChain).toHaveBeenCalledWith('to_node_id', 'node-2')
    })

    it('should throw error when deletion fails', async () => {
      const mockError = new Error('Delete failed')
      const mockEqChain = vi.fn().mockResolvedValue({ error: mockError })
      mockEq.mockReturnValueOnce({ eq: mockEqChain })

      await expect(connectionsService.delete('node-1', 'node-2')).rejects.toThrow('Delete failed')
    })
  })

  describe('deleteByNodeId', () => {
    it('should delete all connections for a node', async () => {
      mockOr.mockResolvedValue({ error: null })

      await connectionsService.deleteByNodeId('node-1')

      expect(supabase.from).toHaveBeenCalledWith('node_connections')
      expect(mockDelete).toHaveBeenCalled()
      expect(mockOr).toHaveBeenCalledWith('from_node_id.eq.node-1,to_node_id.eq.node-1')
    })

    it('should throw error when deletion fails', async () => {
      const mockError = new Error('Delete failed')
      mockOr.mockResolvedValue({ error: mockError })

      await expect(connectionsService.deleteByNodeId('node-1')).rejects.toThrow('Delete failed')
    })
  })
})

import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useNodes } from '../useNodes'
import { nodesService } from '../../services/nodesService'
import { connectionsService } from '../../services/connectionsService'

// Mock the services
vi.mock('../../services/nodesService')
vi.mock('../../services/connectionsService')

describe('useNodes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with empty nodes and connections', () => {
    const { result } = renderHook(() => useNodes('topic-123'))

    expect(result.current.nodes).toEqual([])
    expect(result.current.connections).toEqual([])
    expect(result.current.loading).toBe(true)
  })

  it('should not load if no topicId is provided', async () => {
    const { result } = renderHook(() => useNodes(null))

    await waitFor(() => {
      expect(result.current.loading).toBe(true)
    })

    expect(nodesService.getByTopicId).not.toHaveBeenCalled()
    expect(connectionsService.getByTopicId).not.toHaveBeenCalled()
  })

  it('should load nodes and connections on mount', async () => {
    const mockNodes = [
      {
        id: 'node-1',
        title: 'Node 1',
        description: 'Description 1',
        position: { x: 100, y: 100 },
      },
      {
        id: 'node-2',
        title: 'Node 2',
        description: 'Description 2',
        position: { x: 200, y: 200 },
      },
    ]

    const mockConnections = [
      {
        id: 'conn-1',
        from_node_id: 'node-1',
        to_node_id: 'node-2',
      },
    ]

    nodesService.getByTopicId.mockResolvedValue(mockNodes)
    connectionsService.getByTopicId.mockResolvedValue(mockConnections)

    const { result } = renderHook(() => useNodes('topic-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(nodesService.getByTopicId).toHaveBeenCalledWith('topic-123')
    expect(connectionsService.getByTopicId).toHaveBeenCalledWith('topic-123')
    expect(result.current.nodes).toHaveLength(2)
    expect(result.current.connections).toHaveLength(1)
  })

  it('should calculate connection counts correctly', async () => {
    const mockNodes = [
      {
        id: 'node-1',
        title: 'Node 1',
        description: 'Description 1',
        position: { x: 100, y: 100 },
      },
      {
        id: 'node-2',
        title: 'Node 2',
        description: 'Description 2',
        position: { x: 200, y: 200 },
      },
      {
        id: 'node-3',
        title: 'Node 3',
        description: 'Description 3',
        position: { x: 300, y: 300 },
      },
    ]

    const mockConnections = [
      { id: 'conn-1', from_node_id: 'node-1', to_node_id: 'node-2' },
      { id: 'conn-2', from_node_id: 'node-1', to_node_id: 'node-3' },
    ]

    nodesService.getByTopicId.mockResolvedValue(mockNodes)
    connectionsService.getByTopicId.mockResolvedValue(mockConnections)

    const { result } = renderHook(() => useNodes('topic-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const node1 = result.current.nodes.find(n => n.id === 'node-1')
    const node2 = result.current.nodes.find(n => n.id === 'node-2')
    const node3 = result.current.nodes.find(n => n.id === 'node-3')

    expect(node1.connectionCount).toBe(2) // Connected to node-2 and node-3
    expect(node2.connectionCount).toBe(1) // Connected to node-1
    expect(node3.connectionCount).toBe(1) // Connected to node-1
  })

  it('should handle loading error', async () => {
    const mockError = new Error('Failed to load nodes')
    nodesService.getByTopicId.mockRejectedValue(mockError)

    const { result } = renderHook(() => useNodes('topic-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to load nodes')
  })

  it('should create a new node', async () => {
    nodesService.getByTopicId.mockResolvedValue([])
    connectionsService.getByTopicId.mockResolvedValue([])

    const { result } = renderHook(() => useNodes('topic-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const newNodeData = {
      title: 'New Node',
      description: 'New Description',
      position: { x: 150, y: 150 },
    }

    const createdNode = {
      id: 'node-new',
      topic_id: 'topic-123',
      title: 'New Node',
      description: 'New Description',
      position: { x: 150, y: 150 },
    }

    nodesService.create.mockResolvedValue(createdNode)

    // After create, reload will be called
    nodesService.getByTopicId.mockResolvedValue([createdNode])

    await act(async () => {
      await result.current.createNode(newNodeData)
    })

    expect(nodesService.create).toHaveBeenCalledWith({
      topicId: 'topic-123',
      title: 'New Node',
      description: 'New Description',
      position: { x: 150, y: 150 },
    })
  })

  it('should create node with connections', async () => {
    const existingNode = {
      id: 'node-1',
      title: 'Existing Node',
      description: 'Description',
      position: { x: 100, y: 100 },
    }

    nodesService.getByTopicId.mockResolvedValue([existingNode])
    connectionsService.getByTopicId.mockResolvedValue([])

    const { result } = renderHook(() => useNodes('topic-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const newNodeData = {
      title: 'New Node',
      description: 'New Description',
      position: { x: 150, y: 150 },
    }

    const createdNode = {
      id: 'node-new',
      topic_id: 'topic-123',
      title: 'New Node',
      description: 'New Description',
      position: { x: 150, y: 150 },
    }

    nodesService.create.mockResolvedValue(createdNode)
    connectionsService.create.mockResolvedValue({})

    await act(async () => {
      await result.current.createNode(newNodeData, ['node-1'])
    })

    expect(connectionsService.create).toHaveBeenCalledWith('node-new', 'node-1')
  })

  it('should update a node', async () => {
    const mockNodes = [
      {
        id: 'node-1',
        title: 'Node 1',
        description: 'Description 1',
        position: { x: 100, y: 100 },
      },
    ]

    nodesService.getByTopicId.mockResolvedValue(mockNodes)
    connectionsService.getByTopicId.mockResolvedValue([])
    nodesService.update.mockResolvedValue({})

    const { result } = renderHook(() => useNodes('topic-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.updateNode('node-1', { title: 'Updated Title' })
    })

    expect(nodesService.update).toHaveBeenCalledWith('node-1', { title: 'Updated Title' })
    expect(result.current.nodes[0].title).toBe('Updated Title')
  })

  it('should update node position locally', async () => {
    const mockNodes = [
      {
        id: 'node-1',
        title: 'Node 1',
        description: 'Description 1',
        position: { x: 100, y: 100 },
      },
    ]

    nodesService.getByTopicId.mockResolvedValue(mockNodes)
    connectionsService.getByTopicId.mockResolvedValue([])

    const { result } = renderHook(() => useNodes('topic-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    act(() => {
      result.current.updateNodePositionLocal('node-1', { x: 200, y: 200 })
    })

    expect(result.current.nodes[0].position).toEqual({ x: 200, y: 200 })
  })

  it('should delete a node', async () => {
    const mockNodes = [
      { id: 'node-1', title: 'Node 1', description: 'Desc 1', position: { x: 100, y: 100 } },
      { id: 'node-2', title: 'Node 2', description: 'Desc 2', position: { x: 200, y: 200 } },
    ]

    const mockConnections = [{ id: 'conn-1', from_node_id: 'node-1', to_node_id: 'node-2' }]

    nodesService.getByTopicId.mockResolvedValue(mockNodes)
    connectionsService.getByTopicId.mockResolvedValue(mockConnections)
    nodesService.delete.mockResolvedValue()

    const { result } = renderHook(() => useNodes('topic-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.deleteNode('node-1')
    })

    expect(nodesService.delete).toHaveBeenCalledWith('node-1')
    expect(result.current.nodes).toHaveLength(1)
    expect(result.current.connections).toHaveLength(0)
  })

  it('should get connected nodes', async () => {
    const mockNodes = [
      { id: 'node-1', title: 'Node 1', description: 'Desc 1', position: { x: 100, y: 100 } },
      { id: 'node-2', title: 'Node 2', description: 'Desc 2', position: { x: 200, y: 200 } },
      { id: 'node-3', title: 'Node 3', description: 'Desc 3', position: { x: 300, y: 300 } },
    ]

    const mockConnections = [
      { id: 'conn-1', from_node_id: 'node-1', to_node_id: 'node-2' },
      { id: 'conn-2', from_node_id: 'node-1', to_node_id: 'node-3' },
    ]

    nodesService.getByTopicId.mockResolvedValue(mockNodes)
    connectionsService.getByTopicId.mockResolvedValue(mockConnections)

    const { result } = renderHook(() => useNodes('topic-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const connectedNodes = result.current.getConnectedNodes('node-1')

    expect(connectedNodes).toHaveLength(2)
    expect(connectedNodes.map(n => n.id)).toEqual(['node-2', 'node-3'])
  })

  it('should get node by id', async () => {
    const mockNodes = [
      { id: 'node-1', title: 'Node 1', description: 'Desc 1', position: { x: 100, y: 100 } },
      { id: 'node-2', title: 'Node 2', description: 'Desc 2', position: { x: 200, y: 200 } },
    ]

    nodesService.getByTopicId.mockResolvedValue(mockNodes)
    connectionsService.getByTopicId.mockResolvedValue([])

    const { result } = renderHook(() => useNodes('topic-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const node = result.current.getNodeById('node-2')

    expect(node).toBeDefined()
    expect(node.title).toBe('Node 2')
  })

  it('should add a connection', async () => {
    const mockNodes = [
      { id: 'node-1', title: 'Node 1', description: 'Desc 1', position: { x: 100, y: 100 } },
      { id: 'node-2', title: 'Node 2', description: 'Desc 2', position: { x: 200, y: 200 } },
    ]

    nodesService.getByTopicId.mockResolvedValue(mockNodes)
    connectionsService.getByTopicId.mockResolvedValue([])
    connectionsService.create.mockResolvedValue({})

    const { result } = renderHook(() => useNodes('topic-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.addConnection('node-1', 'node-2')
    })

    expect(connectionsService.create).toHaveBeenCalledWith('node-1', 'node-2')
  })

  it('should remove a connection', async () => {
    const mockNodes = [
      { id: 'node-1', title: 'Node 1', description: 'Desc 1', position: { x: 100, y: 100 } },
      { id: 'node-2', title: 'Node 2', description: 'Desc 2', position: { x: 200, y: 200 } },
    ]

    const mockConnections = [{ id: 'conn-1', from_node_id: 'node-1', to_node_id: 'node-2' }]

    nodesService.getByTopicId.mockResolvedValue(mockNodes)
    connectionsService.getByTopicId.mockResolvedValue(mockConnections)
    connectionsService.delete.mockResolvedValue()

    const { result } = renderHook(() => useNodes('topic-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.removeConnection('node-1', 'node-2')
    })

    expect(connectionsService.delete).toHaveBeenCalledWith('node-1', 'node-2')
  })
})

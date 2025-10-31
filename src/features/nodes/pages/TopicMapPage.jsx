import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useVisitorMode } from '../../auth/context/VisitorModeContext'
import { useNodes } from '../hooks/useNodes'
import { useKeyboardShortcuts } from '../../../shared/hooks/useKeyboardShortcuts'
import { topicsService } from '../../topics/services/topicsService'
import MapNode from '../components/MapNode'
import ConnectionLine from '../components/ConnectionLine'
import AddNodeModal from '../components/AddNodeModal'
import NodeDetailsModal from '../components/NodeDetailsModal'
import { LoadingSpinner } from '../../../shared'
import backIcon from '../../../assets/icons/back.svg'
import zoomInIcon from '../../../assets/icons/zoom-in.svg'
import zoomOutIcon from '../../../assets/icons/zoom-out.svg'
import '../../../css/pages/TopicMapPage.css'

export default function TopicMapPage() {
  const navigate = useNavigate()
  const { topicId } = useParams()
  const { isVisitorMode } = useVisitorMode()
  const [zoom, setZoom] = useState(100)
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState(false)
  const [selectedNode, setSelectedNode] = useState(null)
  const [isNodeDetailsModalOpen, setIsNodeDetailsModalOpen] = useState(false)
  const [topic, setTopic] = useState(null)
  const [loadingTopic, setLoadingTopic] = useState(true)

  const {
    nodes,
    connections,
    loading: nodesLoading,
    error: nodesError,
    createNode,
    updateNode,
    updateNodePositionLocal,
    updateNodePosition,
    deleteNode,
    getConnectedNodes,
    getNodeById,
    updateConnections,
  } = useNodes(topicId)

  // Load topic data
  useEffect(() => {
    async function loadTopic() {
      try {
        setLoadingTopic(true)
        const topicData = await topicsService.getById(topicId)
        setTopic({
          id: topicData.id,
          title: topicData.title,
          description: topicData.description,
          iconBgColor: topicData.icon_bg_color,
          iconColor: topicData.icon_color,
        })
      } catch (err) {
        console.error('Error loading topic:', err)
        navigate('/')
      } finally {
        setLoadingTopic(false)
      }
    }

    if (topicId) {
      loadTopic()
    }
  }, [topicId, navigate])

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50))
  }

  const handleNodeDrag = (nodeId, newPosition) => {
    // Update local state only during drag for smooth visual feedback
    updateNodePositionLocal(nodeId, newPosition)
  }

  const handleNodeDragEnd = nodeId => {
    // Save final position to database when drag ends
    const node = getNodeById(nodeId)
    if (node) {
      updateNodePosition(nodeId, node.position)
    }
  }

  const handleAddNode = async nodeData => {
    try {
      await createNode(nodeData, nodeData.connections || [])
      setIsAddNodeModalOpen(false)
    } catch (err) {
      console.error('Failed to create node:', err)
      alert('Failed to create node. Please try again.')
    }
  }

  const handleNodeClick = nodeId => {
    const node = getNodeById(nodeId)
    if (node) {
      setSelectedNode(node)
      setIsNodeDetailsModalOpen(true)
    }
  }

  const handleSaveNode = async updates => {
    if (!selectedNode) return

    try {
      // Update node title and description
      const { connections: newConnections, ...nodeUpdates } = updates

      if (nodeUpdates.title || nodeUpdates.description) {
        await updateNode(selectedNode.id, nodeUpdates)
      }

      // Update connections if they changed
      if (newConnections !== undefined) {
        await updateConnections(selectedNode.id, newConnections)
      }

      // Update the selected node with new data
      setSelectedNode(prev => ({ ...prev, ...nodeUpdates }))
    } catch (err) {
      console.error('Failed to update node:', err)
      throw err // Re-throw to let modal handle the error
    }
  }

  const handleDeleteNode = async () => {
    if (!selectedNode) return

    try {
      await deleteNode(selectedNode.id)
      setIsNodeDetailsModalOpen(false)
      setSelectedNode(null)
    } catch (err) {
      console.error('Failed to delete node:', err)
      alert('Failed to delete node. Please try again.')
    }
  }

  // Memoize connection lines to avoid recalculating on every render
  const connectionLines = useMemo(() => {
    return connections
      .map((connection, index) => {
        const fromNode = getNodeById(connection.from)
        const toNode = getNodeById(connection.to)

        if (!fromNode || !toNode) return null

        return {
          key: `connection-${index}`,
          fromNode,
          toNode,
        }
      })
      .filter(Boolean)
  }, [connections, getNodeById])

  // Keyboard shortcuts
  useKeyboardShortcuts(
    {
      'Ctrl+n': () => {
        if (!isVisitorMode) {
          setIsAddNodeModalOpen(true)
        }
      },
      '+': () => handleZoomIn(),
      '=': () => handleZoomIn(), // Alternative for +
      '-': () => handleZoomOut(),
      Escape: () => {
        if (isAddNodeModalOpen) {
          setIsAddNodeModalOpen(false)
        }
        if (isNodeDetailsModalOpen) {
          setIsNodeDetailsModalOpen(false)
          setSelectedNode(null)
        }
      },
      Delete: () => {
        if (selectedNode && !isVisitorMode) {
          handleDeleteNode()
        }
      },
    },
    !loadingTopic && !nodesLoading
  )

  if (loadingTopic || nodesLoading) {
    return (
      <div className="topic-map-page">
        <header className="topic-map-header">
          <div className="header-left">
            <button className="back-btn" onClick={() => navigate('/')}>
              <img src={backIcon} alt="" className="back-icon" />
              <span>Back</span>
            </button>
          </div>
        </header>
        <main className="topic-map-canvas">
          <div className="canvas-container">
            <LoadingSpinner size="large" text="Loading topic map..." />
          </div>
        </main>
      </div>
    )
  }

  if (nodesError || !topic) {
    return (
      <div className="topic-map-page">
        <header className="topic-map-header">
          <div className="header-left">
            <button className="back-btn" onClick={() => navigate('/')}>
              <img src={backIcon} alt="" className="back-icon" />
              <span>Back</span>
            </button>
          </div>
        </header>
        <main className="topic-map-canvas">
          <div className="canvas-container">
            <p style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
              Error: {nodesError || 'Topic not found'}
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="topic-map-page">
      {/* Header */}
      <header className="topic-map-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/')}>
            <img src={backIcon} alt="" className="back-icon" />
            <span>Back</span>
          </button>

          <div className="header-divider"></div>

          <div className="topic-info">
            <div className="topic-info-icon" style={{ backgroundColor: topic.iconBgColor }}>
              <div
                className="topic-info-icon-inner"
                style={{ backgroundColor: topic.iconColor }}
              ></div>
            </div>
            <div className="topic-info-text">
              <h2 className="topic-info-title">{topic.title}</h2>
              <p className="topic-info-description">{topic.description}</p>
            </div>
          </div>
        </div>

        <div className="header-right">
          <button className="zoom-btn" onClick={handleZoomOut}>
            <img src={zoomOutIcon} alt="Zoom out" className="zoom-icon" />
          </button>

          <div className="zoom-display">
            <span>{zoom}%</span>
          </div>

          <button className="zoom-btn" onClick={handleZoomIn}>
            <img src={zoomInIcon} alt="Zoom in" className="zoom-icon" />
          </button>

          <div className="header-divider"></div>

          {!isVisitorMode && (
            <button className="add-node-btn" onClick={() => setIsAddNodeModalOpen(true)}>
              <svg
                className="add-node-icon"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="8"
                  cy="8"
                  r="7.5"
                  fill="white"
                  stroke={topic.iconColor}
                  strokeWidth="1"
                />
                <path
                  d="M3.33333 8H12.6667"
                  stroke={topic.iconColor}
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 3.33333V12.6667"
                  stroke={topic.iconColor}
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Add Node</span>
            </button>
          )}
        </div>
      </header>

      {/* Canvas */}
      <main className="topic-map-canvas">
        <div className="canvas-container">
          <div className="canvas-background">
            <div className="nodes-container" style={{ transform: `scale(${zoom / 100})` }}>
              {/* Render connection lines first (so they appear behind nodes) */}
              {connectionLines.map(({ key, fromNode, toNode }) => (
                <ConnectionLine key={key} fromNode={fromNode} toNode={toNode} />
              ))}

              {/* Render nodes */}
              {nodes.map(node => (
                <MapNode
                  key={node.id}
                  id={node.id}
                  title={node.title}
                  description={node.description}
                  connectionCount={node.connectionCount}
                  position={node.position}
                  onDrag={handleNodeDrag}
                  onDragEnd={handleNodeDragEnd}
                  onClick={() => handleNodeClick(node.id)}
                  isDraggingDisabled={isVisitorMode}
                  iconBgColor={topic.iconBgColor}
                  iconColor={topic.iconColor}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Add Node Modal */}
      <AddNodeModal
        isOpen={isAddNodeModalOpen}
        onClose={() => setIsAddNodeModalOpen(false)}
        onSubmit={handleAddNode}
        topicTitle={topic.title}
        topicIconBgColor={topic.iconBgColor}
        topicIconColor={topic.iconColor}
        existingNodes={nodes}
      />

      {/* Node Details Modal */}
      <NodeDetailsModal
        isOpen={isNodeDetailsModalOpen}
        onClose={() => {
          setIsNodeDetailsModalOpen(false)
          setSelectedNode(null)
        }}
        node={selectedNode}
        topicTitle={topic.title}
        topicIconBgColor={topic.iconBgColor}
        topicIconColor={topic.iconColor}
        connectedNodes={selectedNode ? getConnectedNodes(selectedNode.id) : []}
        availableNodes={nodes}
        onSave={handleSaveNode}
        onDelete={handleDeleteNode}
        isVisitorMode={isVisitorMode}
      />
    </div>
  )
}

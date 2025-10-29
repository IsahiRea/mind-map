import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useVisitorMode } from '../context/VisitorModeContext';
import { useNodes } from '../hooks/useNodes';
import { topicsService } from '../services/topicsService';
import MapNode from '../components/MapNode';
import ConnectionLine from '../components/ConnectionLine';
import AddNodeModal from '../components/AddNodeModal';
import NodeDetailsModal from '../components/NodeDetailsModal';
import backIcon from '../assets/icons/back.svg';
import zoomInIcon from '../assets/icons/zoom-in.svg';
import zoomOutIcon from '../assets/icons/zoom-out.svg';
import plusIcon from '../assets/icons/plus.svg';
import '../css/pages/TopicMapPage.css';

export default function TopicMapPage() {
  const navigate = useNavigate();
  const { topicId } = useParams();
  const { isVisitorMode } = useVisitorMode();
  const [zoom, setZoom] = useState(100);
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isNodeDetailsModalOpen, setIsNodeDetailsModalOpen] = useState(false);
  const [topic, setTopic] = useState(null);
  const [loadingTopic, setLoadingTopic] = useState(true);

  const {
    nodes,
    connections,
    loading: nodesLoading,
    error: nodesError,
    createNode,
    updateNodePositionLocal,
    updateNodePosition,
    deleteNode,
    getConnectedNodes,
    getNodeById
  } = useNodes(topicId);

  // Load topic data
  useEffect(() => {
    async function loadTopic() {
      try {
        setLoadingTopic(true);
        const topicData = await topicsService.getById(topicId);
        setTopic({
          id: topicData.id,
          title: topicData.title,
          description: topicData.description,
          iconBgColor: topicData.icon_bg_color,
          iconColor: topicData.icon_color
        });
      } catch (err) {
        console.error('Error loading topic:', err);
        navigate('/');
      } finally {
        setLoadingTopic(false);
      }
    }

    if (topicId) {
      loadTopic();
    }
  }, [topicId, navigate]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50));
  };

  const handleNodeDrag = (nodeId, newPosition) => {
    // Update local state only during drag for smooth visual feedback
    updateNodePositionLocal(nodeId, newPosition);
  };

  const handleNodeDragEnd = (nodeId) => {
    // Save final position to database when drag ends
    const node = getNodeById(nodeId);
    if (node) {
      updateNodePosition(nodeId, node.position);
    }
  };

  const handleAddNode = async (nodeData) => {
    try {
      await createNode(nodeData, nodeData.connections || []);
      setIsAddNodeModalOpen(false);
    } catch (err) {
      console.error('Failed to create node:', err);
      alert('Failed to create node. Please try again.');
    }
  };

  const handleNodeClick = (nodeId) => {
    const node = getNodeById(nodeId);
    if (node) {
      setSelectedNode(node);
      setIsNodeDetailsModalOpen(true);
    }
  };

  const handleDeleteNode = async () => {
    if (!selectedNode) return;

    try {
      await deleteNode(selectedNode.id);
      setIsNodeDetailsModalOpen(false);
      setSelectedNode(null);
    } catch (err) {
      console.error('Failed to delete node:', err);
      alert('Failed to delete node. Please try again.');
    }
  };

  const handleEditNode = () => {
    // Close details modal and open edit modal
    // For now, just close the details modal
    // TODO: Implement edit functionality
    setIsNodeDetailsModalOpen(false);
    alert('Edit functionality coming soon!');
  };

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
            <p style={{ padding: '2rem', textAlign: 'center' }}>Loading...</p>
          </div>
        </main>
      </div>
    );
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
    );
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
              <div className="topic-info-icon-inner" style={{ backgroundColor: topic.iconColor }}></div>
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
              <img src={plusIcon} alt="" className="add-node-icon" />
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
              {connections.map((connection, index) => {
                const fromNode = getNodeById(connection.from);
                const toNode = getNodeById(connection.to);
                if (fromNode && toNode) {
                  return (
                    <ConnectionLine
                      key={`connection-${index}`}
                      fromNode={fromNode}
                      toNode={toNode}
                    />
                  );
                }
                return null;
              })}

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
        existingNodes={nodes}
      />

      {/* Node Details Modal */}
      <NodeDetailsModal
        isOpen={isNodeDetailsModalOpen}
        onClose={() => {
          setIsNodeDetailsModalOpen(false);
          setSelectedNode(null);
        }}
        node={selectedNode}
        topicTitle={topic.title}
        connectedNodes={selectedNode ? getConnectedNodes(selectedNode.id) : []}
        onEdit={handleEditNode}
        onDelete={handleDeleteNode}
        isVisitorMode={isVisitorMode}
      />
    </div>
  );
}

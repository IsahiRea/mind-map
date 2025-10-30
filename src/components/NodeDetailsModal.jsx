import { useState, useEffect } from 'react';
import Modal from './Modal';
import xIcon from '../assets/icons/x.svg';
import '../css/components/NodeDetailsModal.css';

export default function NodeDetailsModal({
  isOpen,
  onClose,
  node,
  topicTitle,
  connectedNodes,
  availableNodes,
  onSave,
  onDelete,
  isVisitorMode = false
}) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedConnections, setEditedConnections] = useState([]);

  // Reset edit state when node changes or modal opens/closes
  useEffect(() => {
    if (node) {
      setEditedTitle(node.title || '');
      setEditedDescription(node.description || '');
      setEditedConnections((connectedNodes || []).map(n => n.id));
      setIsEditMode(false);
    }
  }, [node, isOpen, connectedNodes]);

  if (!node) return null;

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
    setEditedTitle(node.title || '');
    setEditedDescription(node.description || '');
    setEditedConnections((connectedNodes || []).map(n => n.id));
    setIsEditMode(false);
  };

  const handleSave = async () => {
    if (!editedTitle.trim()) {
      alert('Title cannot be empty');
      return;
    }

    try {
      await onSave({
        title: editedTitle.trim(),
        description: editedDescription.trim(),
        connections: editedConnections
      });
      setIsEditMode(false);
    } catch (err) {
      console.error('Failed to save node:', err);
      alert('Failed to save changes. Please try again.');
    }
  };

  const handleToggleConnection = (nodeId) => {
    setEditedConnections(prev => {
      if (prev.includes(nodeId)) {
        return prev.filter(id => id !== nodeId);
      } else {
        return [...prev, nodeId];
      }
    });
  };

  // Get nodes that can be connected (excluding self)
  const selectableNodes = (availableNodes || []).filter(n => n.id !== node.id);

  const handleClose = () => {
    handleCancel();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="node-details-modal">
        <button className="node-details-modal-close" onClick={handleClose}>
          <img src={xIcon} alt="Close" />
        </button>

        <div className="node-details-header">
          <div className="node-details-header-content">
            <div className="node-details-icon-wrapper">
              <div className="node-details-icon"></div>
            </div>
            <div className="node-details-title-section">
              {isEditMode ? (
                <input
                  type="text"
                  className="node-details-title-input"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  placeholder="Node title"
                  autoFocus
                />
              ) : (
                <h2 className="node-details-title">{node.title}</h2>
              )}
              <div className="node-details-topic-badge">
                {topicTitle}
              </div>
            </div>
          </div>

          {!isVisitorMode && !isEditMode && (
            <div className="node-details-actions">
              <button className="node-details-edit-btn" onClick={handleEdit} title="Edit node">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.334 2.00004C11.5091 1.82494 11.7169 1.68605 11.9457 1.59129C12.1745 1.49653 12.4197 1.44775 12.6673 1.44775C12.9149 1.44775 13.1601 1.49653 13.3889 1.59129C13.6177 1.68605 13.8256 1.82494 14.0007 2.00004C14.1757 2.17513 14.3146 2.383 14.4094 2.61178C14.5042 2.84055 14.5529 3.08575 14.5529 3.33337C14.5529 3.58099 14.5042 3.82619 14.4094 4.05497C14.3146 4.28374 14.1757 4.49161 14.0007 4.66671L5.00065 13.6667L1.33398 14.6667L2.33398 11L11.334 2.00004Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button className="node-details-delete-btn" onClick={onDelete} title="Delete node">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 4H3.33333H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5.33268 4.00004V2.66671C5.33268 2.31309 5.47316 1.97395 5.72321 1.7239C5.97325 1.47385 6.31239 1.33337 6.66602 1.33337H9.33268C9.68631 1.33337 10.0254 1.47385 10.2755 1.7239C10.5255 1.97395 10.666 2.31309 10.666 2.66671V4.00004M12.666 4.00004V13.3334C12.666 13.687 12.5255 14.0261 12.2755 14.2762C12.0254 14.5262 11.6863 14.6667 11.3327 14.6667H4.66602C4.31239 14.6667 3.97325 14.5262 3.72321 14.2762C3.47316 14.0261 3.33268 13.687 3.33268 13.3334V4.00004H12.666Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        <p className="node-details-modal-description">
          {isVisitorMode ? 'View learning node details' : isEditMode ? 'Edit your learning node' : 'View and edit learning node details'}
        </p>

        <div className="node-details-content">
          <div className="node-details-section">
            <label className="node-details-label">Learning Notes</label>
            {isEditMode ? (
              <textarea
                className="node-details-textarea"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Add notes about this concept..."
                rows={6}
              />
            ) : (
              <p className="node-details-text">
                {node.description || 'No notes added yet.'}
              </p>
            )}
          </div>

          <div className="node-details-section">
            <label className="node-details-label node-details-label-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 2L10 6L14 6.5L11 9.5L11.5 14L8 12L4.5 14L5 9.5L2 6.5L6 6L8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              Connected Nodes
            </label>

            {isEditMode ? (
              <div className="node-details-connections-edit">
                {selectableNodes.length > 0 ? (
                  selectableNodes.map(availableNode => (
                    <label key={availableNode.id} className="node-details-connection-checkbox">
                      <input
                        type="checkbox"
                        checked={editedConnections.includes(availableNode.id)}
                        onChange={() => handleToggleConnection(availableNode.id)}
                      />
                      <span className="node-details-connection-checkbox-label">
                        {availableNode.title}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="node-details-text">No other nodes available to connect.</p>
                )}
              </div>
            ) : (
              <div className="node-details-connections">
                {connectedNodes && connectedNodes.length > 0 ? (
                  connectedNodes.map(connectedNode => (
                    <div key={connectedNode.id} className="node-details-connection-badge">
                      {connectedNode.title}
                    </div>
                  ))
                ) : (
                  <p className="node-details-text">No connections yet.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {isEditMode && (
          <div className="node-details-footer">
            <button
              type="button"
              className="node-details-cancel-btn"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="node-details-save-btn"
              onClick={handleSave}
              disabled={!editedTitle.trim()}
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

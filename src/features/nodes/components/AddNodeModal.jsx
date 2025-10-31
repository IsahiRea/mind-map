import { useState } from 'react'
import { Modal } from '../../../shared'
import xIcon from '../../../assets/icons/x.svg'
import '../../../css/components/AddNodeModal.css'

export default function AddNodeModal({
  isOpen,
  onClose,
  onSubmit,
  topicTitle,
  topicIconBgColor,
  topicIconColor,
  existingNodes,
}) {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedConnections, setSelectedConnections] = useState([])

  const handleSubmit = e => {
    e.preventDefault()

    if (!title.trim()) return

    onSubmit({
      title: title.trim(),
      notes: notes.trim(),
      connections: selectedConnections,
    })

    // Reset form
    setTitle('')
    setNotes('')
    setSelectedConnections([])
    onClose()
  }

  const handleCancel = () => {
    setTitle('')
    setNotes('')
    setSelectedConnections([])
    onClose()
  }

  const toggleConnection = nodeId => {
    setSelectedConnections(prev =>
      prev.includes(nodeId) ? prev.filter(id => id !== nodeId) : [...prev, nodeId]
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={handleCancel}>
      <div className="add-node-modal">
        <button className="add-node-modal-close" onClick={handleCancel}>
          <img src={xIcon} alt="Close" />
        </button>

        <div className="add-node-modal-header">
          <div className="add-node-icon-wrapper" style={{ backgroundColor: topicIconBgColor }}>
            <div className="add-node-icon" style={{ backgroundColor: topicIconColor }}></div>
          </div>
          <div className="add-node-header-content">
            <input
              type="text"
              className="add-node-title-input"
              placeholder="Node title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
            <div
              className="add-node-topic-badge"
              style={{
                backgroundColor: topicIconBgColor,
                color: topicIconColor,
              }}
            >
              {topicTitle}
            </div>
          </div>
        </div>

        <p className="add-node-modal-description">Add a new learning node to your topic</p>

        <form onSubmit={handleSubmit} className="add-node-form">
          <div className="add-node-form-group">
            <label htmlFor="notes" className="add-node-label">
              Learning Notes
            </label>
            <textarea
              id="notes"
              className="add-node-textarea"
              placeholder="What did you learn?"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {existingNodes && existingNodes.length > 0 && (
            <div className="add-node-form-group">
              <label className="add-node-label add-node-label-icon">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 2L10 6L14 6.5L11 9.5L11.5 14L8 12L4.5 14L5 9.5L2 6.5L6 6L8 2Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
                Connected Nodes
              </label>
              <div className="add-node-connections">
                {existingNodes.map(node => (
                  <div key={node.id} className="add-node-connection-item">
                    <input
                      type="checkbox"
                      id={`connection-${node.id}`}
                      checked={selectedConnections.includes(node.id)}
                      onChange={() => toggleConnection(node.id)}
                      className="add-node-checkbox"
                    />
                    <label htmlFor={`connection-${node.id}`} className="add-node-connection-label">
                      {node.title}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="add-node-modal-footer">
            <button type="button" className="add-node-cancel-btn" onClick={handleCancel}>
              <img src={xIcon} alt="" className="btn-icon" />
              <span>Cancel</span>
            </button>
            <button type="submit" className="add-node-submit-btn" disabled={!title.trim()}>
              <svg
                className="btn-icon"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13 4L6 11L3 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

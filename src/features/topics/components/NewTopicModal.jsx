import { useState } from 'react'
import { Modal, Checkbox } from '../../../shared'
import xIcon from '../../../assets/icons/x.svg'
import '../../../css/components/NewTopicModal.css'

const COLOR_THEMES = [
  { name: 'blue', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.13)' },
  { name: 'violet', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.13)' },
  { name: 'pink', color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.13)' },
  { name: 'amber', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.13)' },
  { name: 'emerald', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.13)' },
  { name: 'cyan', color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.13)' },
  { name: 'red', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.13)' },
  { name: 'indigo', color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.13)' },
]

export default function NewTopicModal({ isOpen, onClose, onSubmit }) {
  const [topicName, setTopicName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedColor, setSelectedColor] = useState(COLOR_THEMES[0])
  const [isPublic, setIsPublic] = useState(false)

  const handleSubmit = e => {
    e.preventDefault()
    if (topicName.trim()) {
      onSubmit({
        title: topicName.trim(),
        description: description.trim(),
        iconBgColor: selectedColor.bgColor,
        iconColor: selectedColor.color,
        isPublic,
        nodeCount: 0,
      })
      // Reset form
      setTopicName('')
      setDescription('')
      setSelectedColor(COLOR_THEMES[0])
      setIsPublic(false)
      onClose()
    }
  }

  const handleClose = () => {
    setTopicName('')
    setDescription('')
    setSelectedColor(COLOR_THEMES[0])
    setIsPublic(false)
    onClose()
  }

  const isFormValid = topicName.trim().length > 0

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="new-topic-modal">
        <button className="new-topic-modal-close" onClick={handleClose} aria-label="Close">
          <img src={xIcon} alt="" />
        </button>

        <div className="new-topic-modal-header">
          <h2 className="new-topic-modal-title">Create New Topic</h2>
          <p className="new-topic-modal-subtitle">Add a new learning topic to your map</p>
        </div>

        <form onSubmit={handleSubmit} className="new-topic-modal-form">
          <div className="new-topic-form-field">
            <label htmlFor="topic-name" className="new-topic-form-label">
              Topic Name
            </label>
            <input
              id="topic-name"
              type="text"
              className="new-topic-form-input"
              placeholder="e.g., Machine Learning"
              value={topicName}
              onChange={e => setTopicName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="new-topic-form-field">
            <label htmlFor="description" className="new-topic-form-label">
              Description
            </label>
            <textarea
              id="description"
              className="new-topic-form-textarea"
              placeholder="Brief description of this topic..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="new-topic-form-field">
            <label className="new-topic-form-label">Color Theme</label>
            <div className="new-topic-color-grid">
              {COLOR_THEMES.map(theme => (
                <button
                  key={theme.name}
                  type="button"
                  className={`new-topic-color-button ${
                    selectedColor.name === theme.name ? 'selected' : ''
                  }`}
                  style={{ backgroundColor: theme.color }}
                  onClick={() => setSelectedColor(theme)}
                  aria-label={`Select ${theme.name} color`}
                />
              ))}
            </div>
          </div>

          <div className="new-topic-form-field new-topic-visibility-field">
            <Checkbox
              id="is-public"
              label="Make this topic public"
              checked={isPublic}
              onChange={e => setIsPublic(e.target.checked)}
            />
            <p className="new-topic-visibility-hint">
              Public topics can be viewed by anyone, even without signing in
            </p>
          </div>

          <div className="new-topic-modal-footer">
            <button type="button" className="new-topic-cancel-btn" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="new-topic-submit-btn" disabled={!isFormValid}>
              Create Topic
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

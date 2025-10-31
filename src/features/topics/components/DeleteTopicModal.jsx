import { Modal } from '../../../shared'
import xIcon from '../../../assets/icons/x.svg'
import '../../../css/components/DeleteTopicModal.css'

export default function DeleteTopicModal({ isOpen, onClose, onConfirm, topicTitle }) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="delete-topic-modal">
        <button className="delete-topic-modal-close" onClick={onClose} aria-label="Close">
          <img src={xIcon} alt="" />
        </button>

        <div className="delete-topic-modal-header">
          <h2 className="delete-topic-modal-title">Delete Topic</h2>
          <p className="delete-topic-modal-subtitle">
            Are you sure you want to delete <strong>{topicTitle}</strong>?
          </p>
        </div>

        <div className="delete-topic-modal-content">
          <p className="delete-topic-warning">
            All nodes and connections will be permanently deleted. This action cannot be undone.
          </p>
        </div>

        <div className="delete-topic-modal-footer">
          <button type="button" className="delete-topic-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="delete-topic-confirm-btn" onClick={handleConfirm}>
            Delete Topic
          </button>
        </div>
      </div>
    </Modal>
  )
}

import { useTopicVisibility } from '../hooks/useTopicVisibility'
import '../../../css/components/VisibilityToggle.css'

export default function VisibilityToggle({ topicId, isPublic, disabled = false }) {
  const { updateVisibility, isUpdating } = useTopicVisibility()

  const handleToggle = async e => {
    e.preventDefault()
    e.stopPropagation()

    try {
      await updateVisibility({ topicId, isPublic: !isPublic })
    } catch (err) {
      console.error('Failed to update visibility:', err)
    }
  }

  return (
    <button
      type="button"
      className={`visibility-toggle ${isPublic ? 'is-public' : 'is-private'}`}
      onClick={handleToggle}
      disabled={disabled || isUpdating}
      aria-label={isPublic ? 'Make private' : 'Make public'}
      title={isPublic ? 'Click to make private' : 'Click to make public'}
    >
      <span className="visibility-toggle-icon">
        {isPublic ? (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 5C5.636 5 2 12 2 12s3.636 7 10 7 10-7 10-7-3.636-7-10-7z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="12"
              cy="12"
              r="3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M1 1l22 22"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="visibility-toggle-label">{isPublic ? 'Public' : 'Private'}</span>
    </button>
  )
}

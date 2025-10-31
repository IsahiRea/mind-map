import { memo } from 'react'
import { Link } from 'react-router-dom'
import '../../../css/components/TopicCard.css'

function TopicCard({
  id,
  title,
  description,
  nodeCount,
  iconBgColor,
  iconColor,
  isVisitorMode = false,
  onDelete,
}) {
  return (
    <div className="topic-card">
      <div className="topic-card-header">
        <div
          className="topic-icon-wrapper"
          style={{ backgroundColor: iconBgColor, color: iconColor }}
        >
          <svg
            className="topic-icon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M14.106 5.553C14.3836 5.69172 14.6897 5.76393 15 5.76393C15.3103 5.76393 15.6164 5.69172 15.894 5.553L19.553 3.723C19.7056 3.64676 19.8751 3.61081 20.0455 3.61857C20.2159 3.62633 20.3814 3.67754 20.5265 3.76733C20.6715 3.85712 20.7911 3.98251 20.874 4.13158C20.9569 4.28065 21.0003 4.44844 21 4.619V17.383C20.9999 17.5687 20.9481 17.7506 20.8504 17.9085C20.7528 18.0664 20.6131 18.194 20.447 18.277L15.894 20.554C15.6164 20.6927 15.3103 20.7649 15 20.7649C14.6897 20.7649 14.3836 20.6927 14.106 20.554L9.894 18.448C9.6164 18.3093 9.31033 18.2371 9 18.2371C8.68967 18.2371 8.3836 18.3093 8.106 18.448L4.447 20.278C4.29435 20.3543 4.12472 20.3902 3.95426 20.3824C3.78379 20.3746 3.61816 20.3233 3.47312 20.2334C3.32808 20.1435 3.20846 20.018 3.12565 19.8688C3.04283 19.7196 2.99958 19.5516 3 19.381V6.618C3.0001 6.43234 3.05188 6.25037 3.14955 6.09247C3.24722 5.93458 3.38692 5.80699 3.553 5.724L8.106 3.447C8.3836 3.30828 8.68967 3.23607 9 3.23607C9.31033 3.23607 9.6164 3.30828 9.894 3.447L14.106 5.553Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15 5.764V20.764"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 3.236V18.236"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="topic-badge">
          <span>{nodeCount} nodes</span>
        </div>
      </div>

      <h3 className="topic-title">{title}</h3>

      <p className="topic-description">{description}</p>

      <div className="topic-card-footer">
        <Link to={`/topic/${id}`} className="topic-explore-link">
          Explore map →
        </Link>
        {!isVisitorMode && onDelete && (
          <button className="topic-delete-btn" onClick={() => onDelete(id)}>
            Delete
          </button>
        )}
      </div>
    </div>
  )
}

export default memo(TopicCard)

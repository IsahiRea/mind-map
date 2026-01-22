import { memo } from 'react'
import { Link } from 'react-router-dom'
import '../../../css/components/OwnerBadge.css'

function OwnerBadge({ userId, displayName, avatarUrl }) {
  return (
    <Link to={`/user/${userId}`} className="owner-badge">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="owner-badge-avatar" />
      ) : (
        <div className="owner-badge-avatar owner-badge-avatar-placeholder">
          {displayName?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
      <span className="owner-badge-name">{displayName || 'Anonymous'}</span>
    </Link>
  )
}

export default memo(OwnerBadge)

import { memo } from 'react'
import '../../../css/components/UserProfileHeader.css'

function UserProfileHeader({ profile, topicCount, isLoading }) {
  if (isLoading) {
    return (
      <div className="user-profile-header user-profile-header-loading">
        <div className="user-profile-avatar-skeleton"></div>
        <div className="user-profile-info-skeleton">
          <div className="user-profile-name-skeleton"></div>
          <div className="user-profile-count-skeleton"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="user-profile-header">
      {profile?.avatarUrl ? (
        <img src={profile.avatarUrl} alt="" className="user-profile-avatar" />
      ) : (
        <div className="user-profile-avatar user-profile-avatar-placeholder">
          {profile?.displayName?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
      <div className="user-profile-info">
        <h1 className="user-profile-name">{profile?.displayName || 'Anonymous'}</h1>
        <p className="user-profile-topic-count">
          {topicCount} public {topicCount === 1 ? 'topic' : 'topics'}
        </p>
      </div>
    </div>
  )
}

export default memo(UserProfileHeader)

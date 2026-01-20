import { useState } from 'react'
import { Modal } from '../../../shared'
import { useUserProfile } from '../hooks/useUserProfile'
import { useAuth } from '../../auth/hooks/useAuth'
import xIcon from '../../../assets/icons/x.svg'
import '../../../css/components/UserProfileModal.css'

export default function UserProfileModal({ isOpen, onClose }) {
  const { user, signOut } = useAuth()
  const { profile, updateProfile, isUpdating } = useUserProfile()
  const [localDisplayName, setLocalDisplayName] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Use local state if user has made edits, otherwise use profile value
  const displayName = localDisplayName ?? profile?.displayName ?? ''

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!displayName.trim()) {
      setError('Display name is required')
      return
    }

    try {
      await updateProfile({ displayName: displayName.trim() })
      setLocalDisplayName(null)
      setSuccess('Profile updated successfully')
    } catch (err) {
      setError(err.message || 'Failed to update profile')
    }
  }

  const handleClose = () => {
    setLocalDisplayName(null)
    setError('')
    setSuccess('')
    onClose()
  }

  const handleSignOut = async () => {
    await signOut()
    handleClose()
  }

  const getProviderLabel = provider => {
    switch (provider) {
      case 'google':
        return 'Google'
      case 'github':
        return 'GitHub'
      default:
        return 'Email'
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="profile-modal">
        <button className="profile-modal-close" onClick={handleClose}>
          <img src={xIcon} alt="Close" />
        </button>

        <div className="profile-modal-header">
          <h2 className="profile-modal-title">Your Profile</h2>
        </div>

        <div className="profile-modal-content">
          <div className="profile-avatar-section">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" className="profile-avatar" />
            ) : (
              <div className="profile-avatar-placeholder">
                {displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <p className="profile-avatar-hint">Avatar is managed by your sign-in provider</p>
          </div>

          <form className="profile-modal-form" onSubmit={handleSubmit}>
            {error && <div className="profile-modal-error">{error}</div>}
            {success && <div className="profile-modal-success">{success}</div>}

            <div className="profile-form-field">
              <label htmlFor="displayName" className="profile-form-label">
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                className="profile-form-input"
                value={displayName}
                onChange={e => setLocalDisplayName(e.target.value)}
                placeholder="Your name"
                disabled={isUpdating}
              />
            </div>

            <div className="profile-form-field">
              <label className="profile-form-label">Email</label>
              <p className="profile-form-value">{user?.email}</p>
            </div>

            <div className="profile-form-field">
              <label className="profile-form-label">Sign-in Method</label>
              <p className="profile-form-value">{getProviderLabel(profile?.authProvider)}</p>
            </div>

            <div className="profile-modal-actions">
              <button
                type="submit"
                className="profile-save-btn"
                disabled={isUpdating || displayName === profile?.displayName}
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" className="profile-signout-btn" onClick={handleSignOut}>
                Sign Out
              </button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  )
}

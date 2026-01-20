import { useState } from 'react'
import { useVisitorMode } from '../../features/auth/context/VisitorModeContext'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { AuthModal } from '../../features/auth'
import { UserProfileModal, useUserProfile } from '../../features/users'
import ThemeToggle from './ThemeToggle'
import logoIcon from '../../assets/icons/logo.svg'
import userIcon from '../../assets/icons/user.svg'
import visitorIcon from '../../assets/icons/visitor.svg'
import '../../css/components/Header.css'

export default function Header() {
  const { isVisitorMode } = useVisitorMode()
  const { user } = useAuth()
  const { profile } = useUserProfile()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  const handleAuthAction = () => {
    if (user) {
      // Show profile modal
      setIsProfileModalOpen(true)
    } else {
      // Show auth modal
      setIsAuthModalOpen(true)
    }
  }

  const displayName = profile?.displayName || user?.email?.split('@')[0] || 'User'

  return (
    <>
      <header className="header">
        <div className="header-container">
          <div className="header-brand">
            <div className="header-logo-container">
              <img src={logoIcon} alt="Learning Map" className="header-logo" />
              <div className="header-logo-glow" aria-hidden="true"></div>
            </div>
            <div className="header-text">
              <h1 className="header-title">
                Learning<span className="header-title-accent">Map</span>
              </h1>
              <p className="header-subtitle">Chart your knowledge journey</p>
            </div>
          </div>
          <div className="header-actions">
            <ThemeToggle />
            <button className="header-mode-btn" onClick={handleAuthAction}>
              {user && profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="header-user-avatar" />
              ) : (
                <img
                  src={isVisitorMode ? visitorIcon : userIcon}
                  alt=""
                  className="header-mode-icon"
                />
              )}
              <span>{isVisitorMode ? 'Sign In' : displayName}</span>
            </button>
          </div>
        </div>
      </header>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </>
  )
}

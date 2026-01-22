import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useVisitorMode } from '../../features/auth/context/VisitorModeContext'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { AuthModal } from '../../features/auth'
import { UserProfileModal, useUserProfile } from '../../features/users'
import ThemeToggle from './ThemeToggle'
import logoIcon from '../../assets/icons/logo.svg'
import userIcon from '../../assets/icons/user.svg'
import visitorIcon from '../../assets/icons/visitor.svg'
import exploreIcon from '../../assets/icons/explore.svg'
import '../../css/components/Header.css'

export default function Header() {
  const { isVisitorMode } = useVisitorMode()
  const { user } = useAuth()
  const { profile } = useUserProfile()
  const location = useLocation()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  const isExplorePage = location.pathname === '/explore' || location.pathname.startsWith('/user/')

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
            <Link
              to="/explore"
              className={`header-nav-link ${isExplorePage ? 'header-nav-link-active' : ''}`}
            >
              <img src={exploreIcon} alt="" className="header-nav-icon" />
              <span>Explore</span>
            </Link>
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

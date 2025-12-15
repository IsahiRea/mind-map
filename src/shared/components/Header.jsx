import { useState } from 'react'
import { useVisitorMode } from '../../features/auth/context/VisitorModeContext'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { AuthModal } from '../../features/auth'
import ThemeToggle from './ThemeToggle'
import logoIcon from '../../assets/icons/logo.svg'
import userIcon from '../../assets/icons/user.svg'
import visitorIcon from '../../assets/icons/visitor.svg'
import '../../css/components/Header.css'

export default function Header() {
  const { isVisitorMode } = useVisitorMode()
  const { user, signOut } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  const handleAuthAction = () => {
    if (user) {
      // Sign out
      signOut()
    } else {
      // Show auth modal
      setIsAuthModalOpen(true)
    }
  }

  return (
    <>
      <header className="header">
        <div className="header-container">
          <div className="header-brand">
            <img src={logoIcon} alt="Learning Map" className="header-logo" />
            <div className="header-text">
              <h1 className="header-title">Learning Map</h1>
              <p className="header-subtitle">Track your knowledge journey</p>
            </div>
          </div>
          <div className="header-actions">
            <ThemeToggle />
            <button className="header-mode-btn" onClick={handleAuthAction}>
              <img
                src={isVisitorMode ? visitorIcon : userIcon}
                alt=""
                className="header-mode-icon"
              />
              <span>{isVisitorMode ? 'Owner Sign In' : user?.email || 'Owner Mode'}</span>
            </button>
          </div>
        </div>
      </header>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  )
}

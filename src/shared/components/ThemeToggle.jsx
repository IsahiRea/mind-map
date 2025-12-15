import { useState, useRef, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { ACCENT_COLORS } from '../constants/theme'
import sunIcon from '../../assets/icons/sun.svg'
import moonIcon from '../../assets/icons/moon.svg'
import '../../css/components/ThemeToggle.css'

export default function ThemeToggle() {
  const { toggleTheme, accent, setAccent, isDark } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = event => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <div className="theme-toggle" ref={dropdownRef}>
      <button
        className="theme-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Theme settings"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <img src={isDark ? moonIcon : sunIcon} alt="" className="theme-toggle-icon" />
      </button>

      {isOpen && (
        <div className="theme-dropdown" role="menu">
          {/* Mode Toggle */}
          <div className="theme-section">
            <span className="theme-section-label">Mode</span>
            <button className="theme-mode-toggle" onClick={toggleTheme} role="menuitem">
              <img src={isDark ? sunIcon : moonIcon} alt="" />
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>

          {/* Accent Color Picker */}
          <div className="theme-section">
            <span className="theme-section-label">Accent Color</span>
            <div className="accent-grid" role="group" aria-label="Accent colors">
              {ACCENT_COLORS.map(({ name, color }) => (
                <button
                  key={name}
                  className={`accent-btn ${accent === name ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setAccent(name)}
                  aria-label={`${name} accent`}
                  aria-pressed={accent === name}
                  role="menuitemradio"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

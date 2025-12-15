import { createContext, useContext, useEffect, useCallback } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import {
  THEME_STORAGE_KEY,
  ACCENT_STORAGE_KEY,
  DEFAULT_THEME,
  DEFAULT_ACCENT,
  THEME_MODES,
} from '../constants/theme'

const ThemeContext = createContext(undefined)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useLocalStorage(THEME_STORAGE_KEY, DEFAULT_THEME)
  const [accent, setAccent] = useLocalStorage(ACCENT_STORAGE_KEY, DEFAULT_ACCENT)

  // Apply theme attribute to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Apply accent attribute to document
  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent)
  }, [accent])

  // Check system preference on initial load if no stored preference
  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (!stored) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? THEME_MODES.DARK : THEME_MODES.LIGHT)
    }
  }, [setTheme])

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === THEME_MODES.LIGHT ? THEME_MODES.DARK : THEME_MODES.LIGHT))
  }, [setTheme])

  const value = {
    theme,
    setTheme,
    toggleTheme,
    accent,
    setAccent,
    isDark: theme === THEME_MODES.DARK,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

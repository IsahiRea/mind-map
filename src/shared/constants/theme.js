export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
}

export const ACCENT_COLORS = [
  { name: 'blue', color: '#3b82f6', hoverColor: '#2563eb' },
  { name: 'violet', color: '#8b5cf6', hoverColor: '#7c3aed' },
  { name: 'pink', color: '#ec4899', hoverColor: '#db2777' },
  { name: 'amber', color: '#f59e0b', hoverColor: '#d97706' },
  { name: 'emerald', color: '#10b981', hoverColor: '#059669' },
  { name: 'cyan', color: '#06b6d4', hoverColor: '#0891b2' },
  { name: 'red', color: '#ef4444', hoverColor: '#dc2626' },
  { name: 'indigo', color: '#6366f1', hoverColor: '#4f46e5' },
]

export const DEFAULT_THEME = THEME_MODES.LIGHT
export const DEFAULT_ACCENT = 'blue'

export const THEME_STORAGE_KEY = 'mind-map-theme'
export const ACCENT_STORAGE_KEY = 'mind-map-accent'

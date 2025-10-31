import { useEffect } from 'react'

/**
 * Custom hook for registering keyboard shortcuts
 * @param {Object} shortcuts - Map of key combinations to handlers
 * @param {boolean} enabled - Whether shortcuts are enabled (default: true)
 *
 * @example
 * useKeyboardShortcuts({
 *   'Ctrl+n': () => openNewModal(),
 *   'Escape': () => closeModal(),
 *   'Delete': () => deleteSelected(),
 * });
 */
export const useKeyboardShortcuts = (shortcuts, enabled = true) => {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = e => {
      // Build key combination string
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey

      let key = ''

      if (ctrlKey) key += 'Ctrl+'
      if (e.shiftKey) key += 'Shift+'
      if (e.altKey) key += 'Alt+'

      // Normalize key name
      const keyName = e.key === ' ' ? 'Space' : e.key
      key += keyName

      // Find and execute handler
      const handler = shortcuts[key]

      if (handler) {
        e.preventDefault()
        handler(e)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, enabled])
}

import { useState, useRef, useEffect } from 'react'

/**
 * Custom hook for drag functionality
 * @param {Object} initialPosition - Initial position {x, y}
 * @param {Function} onDragEnd - Callback when drag ends
 * @param {boolean} disabled - Whether dragging is disabled
 * @returns {Object} - {position, isDragging, handlers}
 */
export function useDraggable(initialPosition, onDragEnd, disabled = false) {
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState(initialPosition)
  const dragOffsetRef = useRef({ x: 0, y: 0 })

  // Update position when initialPosition changes
  useEffect(() => {
    setPosition(initialPosition)
  }, [initialPosition])

  const handlePointerDown = e => {
    if (disabled) return

    setIsDragging(true)
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0
    dragOffsetRef.current = {
      x: clientX - position.x,
      y: clientY - position.y,
    }
    e.preventDefault()
  }

  useEffect(() => {
    if (!isDragging) return

    const handlePointerMove = e => {
      const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0
      const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0
      const newPosition = {
        x: clientX - dragOffsetRef.current.x,
        y: clientY - dragOffsetRef.current.y,
      }
      setPosition(newPosition)
    }

    const handlePointerUp = () => {
      setIsDragging(false)
      if (onDragEnd) {
        onDragEnd(position)
      }
    }

    document.addEventListener('mousemove', handlePointerMove)
    document.addEventListener('mouseup', handlePointerUp)
    document.addEventListener('touchmove', handlePointerMove, { passive: false })
    document.addEventListener('touchend', handlePointerUp)

    return () => {
      document.removeEventListener('mousemove', handlePointerMove)
      document.removeEventListener('mouseup', handlePointerUp)
      document.removeEventListener('touchmove', handlePointerMove)
      document.removeEventListener('touchend', handlePointerUp)
    }
  }, [isDragging, position, onDragEnd])

  return {
    position,
    isDragging,
    handlers: {
      onPointerDown: handlePointerDown,
      onTouchStart: handlePointerDown,
    },
  }
}

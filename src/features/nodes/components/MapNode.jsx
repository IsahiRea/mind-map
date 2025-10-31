import { useRef, useState, useEffect, memo } from 'react'
import '../../../css/components/MapNode.css'

function MapNode({
  id,
  title,
  description,
  connectionCount,
  position,
  onDrag,
  onDragEnd,
  onClick,
  isDraggingDisabled = false,
  iconBgColor,
  iconColor,
}) {
  const nodeRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragOffsetRef = useRef({ x: 0, y: 0 })

  const handlePointerDown = e => {
    if (isDraggingDisabled) return

    if (e.target.closest('.map-node-drag-handle')) {
      setIsDragging(true)
      const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0
      const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0
      dragOffsetRef.current = {
        x: clientX - position.x,
        y: clientY - position.y,
      }
      e.preventDefault()
    }
  }

  const handleClick = e => {
    // Only trigger onClick if not dragging and not clicking drag handle
    if (!isDragging && !e.target.closest('.map-node-drag-handle') && onClick) {
      onClick()
    }
  }

  useEffect(() => {
    if (!isDragging) return

    const handlePointerMove = e => {
      const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0
      const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0
      const newX = clientX - dragOffsetRef.current.x
      const newY = clientY - dragOffsetRef.current.y
      onDrag(id, { x: newX, y: newY })
    }

    const handlePointerUp = () => {
      setIsDragging(false)
      onDragEnd(id)
    }

    // Add both mouse and touch events with passive option for touch
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
  }, [isDragging, id, onDrag, onDragEnd])

  return (
    <div
      ref={nodeRef}
      className={`map-node ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        borderColor: iconBgColor,
      }}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      onClick={handleClick}
    >
      {!isDraggingDisabled && (
        <div className="map-node-drag-handle">
          <svg
            className="drag-icon"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="4" cy="4" r="1.33333" fill="#030303" />
            <circle cx="4" cy="8" r="1.33333" fill="#030303" />
            <circle cx="4" cy="12" r="1.33333" fill="#030303" />
            <circle cx="8" cy="4" r="1.33333" fill="#030303" />
            <circle cx="8" cy="8" r="1.33333" fill="#030303" />
            <circle cx="8" cy="12" r="1.33333" fill="#030303" />
          </svg>
        </div>
      )}

      <div className="map-node-content">
        <div className="map-node-icon-wrapper" style={{ backgroundColor: iconBgColor }}>
          <div className="map-node-icon" style={{ backgroundColor: iconColor }}></div>
        </div>

        <h4 className="map-node-title">{title}</h4>

        <p className="map-node-description">{description}</p>
      </div>

      {connectionCount !== undefined && (
        <div className="map-node-footer" style={{ borderTopColor: iconBgColor }}>
          <p className="map-node-connection-count">
            {connectionCount} connection{connectionCount !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  )
}

export default memo(MapNode)

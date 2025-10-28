import { useRef, useState, useEffect } from 'react';
import '../css/components/MapNode.css';

export default function MapNode({ id, title, description, connectionCount, position, onDrag, onDragEnd, onClick, isDraggingDisabled = false }) {
  const nodeRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    if (isDraggingDisabled) return;

    if (e.target.closest('.map-node-drag-handle')) {
      setIsDragging(true);
      dragOffsetRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      };
      e.preventDefault();
    }
  };

  const handleClick = (e) => {
    // Only trigger onClick if not dragging and not clicking drag handle
    if (!isDragging && !e.target.closest('.map-node-drag-handle') && onClick) {
      onClick();
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const newX = e.clientX - dragOffsetRef.current.x;
      const newY = e.clientY - dragOffsetRef.current.y;
      onDrag(id, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onDragEnd(id);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, id, onDrag, onDragEnd]);

  return (
    <div
      ref={nodeRef}
      className={`map-node ${isDragging ? 'dragging' : ''}`}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {!isDraggingDisabled && (
        <div className="map-node-drag-handle">
          <svg className="drag-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="4" cy="4" r="1.33333" fill="#030303"/>
            <circle cx="4" cy="8" r="1.33333" fill="#030303"/>
            <circle cx="4" cy="12" r="1.33333" fill="#030303"/>
            <circle cx="8" cy="4" r="1.33333" fill="#030303"/>
            <circle cx="8" cy="8" r="1.33333" fill="#030303"/>
            <circle cx="8" cy="12" r="1.33333" fill="#030303"/>
          </svg>
        </div>
      )}

      <div className="map-node-content">
        <div className="map-node-icon-wrapper">
          <div className="map-node-icon"></div>
        </div>

        <h4 className="map-node-title">{title}</h4>

        <p className="map-node-description">{description}</p>
      </div>

      {connectionCount !== undefined && (
        <div className="map-node-footer">
          <p className="map-node-connection-count">
            {connectionCount} connection{connectionCount !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}

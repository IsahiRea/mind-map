import { memo } from 'react'
import '../css/components/ConnectionLine.css'

function ConnectionLine({ fromNode, toNode }) {
  // Calculate the center points of each node
  const fromX = fromNode.position.x + 100 // 100 is half the node width (200px)
  const fromY = fromNode.position.y + 96.5 // Approximate center height
  const toX = toNode.position.x + 100
  const toY = toNode.position.y + 96.5

  // Calculate control points for the curve
  const controlPointOffset = Math.abs(toX - fromX) * 0.5
  const controlPoint1X = fromX + controlPointOffset
  const controlPoint1Y = fromY
  const controlPoint2X = toX - controlPointOffset
  const controlPoint2Y = toY

  // Create the SVG path for a curved line
  const path = `M ${fromX} ${fromY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${toX} ${toY}`

  return (
    <svg className="connection-line-svg">
      <path
        d={path}
        className="connection-path"
        stroke="rgba(59, 130, 246, 0.3)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default memo(ConnectionLine)

import { memo, useMemo } from 'react'
import '../../../css/components/ConnectionLine.css'

function ConnectionLine({ fromNode, toNode }) {
  const pathData = useMemo(() => {
    // Calculate the center points of each node
    const fromX = fromNode.position.x + 100 // 100 is half the node width (200px)
    const fromY = fromNode.position.y + 96.5 // Approximate center height
    const toX = toNode.position.x + 100
    const toY = toNode.position.y + 96.5

    // Calculate distance for adaptive curve
    const dx = toX - fromX
    const dy = toY - fromY
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Make curves more pronounced for longer connections
    const curveStrength = Math.min(distance * 0.4, 200)

    // Calculate control points for smooth bezier curve
    const controlPoint1X = fromX + curveStrength
    const controlPoint1Y = fromY
    const controlPoint2X = toX - curveStrength
    const controlPoint2Y = toY

    // Create the SVG path for a curved line
    const path = `M ${fromX} ${fromY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${toX} ${toY}`

    // Calculate arrow angle and position
    const angle = Math.atan2(toY - controlPoint2Y, toX - controlPoint2X) * (180 / Math.PI)

    // Arrow position (slightly offset from the end to account for node size)
    const arrowOffset = 15
    const arrowX = toX - arrowOffset * Math.cos((angle * Math.PI) / 180)
    const arrowY = toY - arrowOffset * Math.sin((angle * Math.PI) / 180)

    return { path, arrowX, arrowY, angle }
  }, [fromNode.position, toNode.position])

  return (
    <svg className="connection-line-svg">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="rgba(59, 130, 246, 0.5)" />
        </marker>
      </defs>
      <path
        d={pathData.path}
        className="connection-path"
        stroke="rgba(59, 130, 246, 0.3)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        markerEnd="url(#arrowhead)"
      />
    </svg>
  )
}

export default memo(ConnectionLine)

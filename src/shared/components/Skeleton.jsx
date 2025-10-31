import '../../css/components/Skeleton.css'

export const TopicCardSkeleton = () => {
  return (
    <div className="topic-card-skeleton skeleton-wrapper">
      <div className="skeleton-icon"></div>
      <div className="skeleton-content">
        <div className="skeleton-title"></div>
        <div className="skeleton-description"></div>
        <div className="skeleton-description short"></div>
      </div>
      <div className="skeleton-footer">
        <div className="skeleton-stat"></div>
        <div className="skeleton-stat"></div>
      </div>
    </div>
  )
}

export const NodeSkeleton = () => {
  return (
    <div className="node-skeleton skeleton-wrapper">
      <div className="skeleton-node-title"></div>
      <div className="skeleton-node-description"></div>
      <div className="skeleton-node-description short"></div>
      <div className="skeleton-node-footer"></div>
    </div>
  )
}

export default { TopicCardSkeleton, NodeSkeleton }

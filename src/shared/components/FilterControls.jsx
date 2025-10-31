import '../../css/components/FilterControls.css'

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc', label: 'Oldest First' },
  { value: 'title-asc', label: 'Title (A-Z)' },
  { value: 'title-desc', label: 'Title (Z-A)' },
  { value: 'nodes-desc', label: 'Most Nodes' },
  { value: 'nodes-asc', label: 'Least Nodes' },
]

export default function FilterControls({ sortBy, onSortChange }) {
  return (
    <div className="filter-controls">
      <div className="filter-group">
        <label htmlFor="sort-select" className="filter-label">
          Sort by:
        </label>
        <select
          id="sort-select"
          value={sortBy}
          onChange={e => onSortChange(e.target.value)}
          className="filter-select"
        >
          {SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

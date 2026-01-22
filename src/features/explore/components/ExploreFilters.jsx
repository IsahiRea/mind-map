import { memo } from 'react'
import '../../../css/components/ExploreFilters.css'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'title', label: 'Title A-Z' },
  { value: 'nodes', label: 'Most nodes' },
]

function ExploreFilters({ search, onSearchChange, sortBy, onSortChange }) {
  return (
    <div className="explore-filters">
      <div className="explore-search-wrapper">
        <svg
          className="explore-search-icon"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17.5 17.5L13.875 13.875M15.833 9.167a6.667 6.667 0 11-13.333 0 6.667 6.667 0 0113.333 0z"
            stroke="currentColor"
            strokeWidth="1.667"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <input
          type="text"
          className="explore-search-input"
          placeholder="Search topics..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          aria-label="Search topics"
        />
      </div>

      <div className="explore-sort-wrapper">
        <label htmlFor="sort-select" className="explore-sort-label">
          Sort by:
        </label>
        <select
          id="sort-select"
          className="explore-sort-select"
          value={sortBy}
          onChange={e => onSortChange(e.target.value)}
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

export default memo(ExploreFilters)

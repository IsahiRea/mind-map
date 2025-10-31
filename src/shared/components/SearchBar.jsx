import searchIcon from '../../assets/icons/search.svg'
import '../../css/components/SearchBar.css'

export default function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="search-bar">
      <img src={searchIcon} alt="" className="search-icon" />
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-input"
      />
      {value && (
        <button onClick={() => onChange('')} className="search-clear" aria-label="Clear search">
          ×
        </button>
      )}
    </div>
  )
}

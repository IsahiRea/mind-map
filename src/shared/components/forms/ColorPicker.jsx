import '../../../css/components/forms/ColorPicker.css'
import { COLOR_THEMES } from '../../constants/colors'

export default function ColorPicker({ label, value, onChange, options = COLOR_THEMES }) {
  return (
    <div className="form-field">
      {label && <label className="form-label">{label}</label>}
      <div className="color-picker-grid">
        {options.map(theme => (
          <button
            key={theme.name}
            type="button"
            className={`color-option ${value?.name === theme.name ? 'selected' : ''}`}
            style={{ backgroundColor: theme.color }}
            onClick={() => onChange(theme)}
            aria-label={`Select ${theme.name} color`}
          />
        ))}
      </div>
    </div>
  )
}

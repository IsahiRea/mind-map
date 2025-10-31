import '../../../css/components/forms/Checkbox.css'

export default function Checkbox({ label, id, className = '', ...props }) {
  const checkboxId = id || `checkbox-${label?.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className="checkbox-field">
      <input type="checkbox" id={checkboxId} className={`form-checkbox ${className}`} {...props} />
      <label htmlFor={checkboxId} className="checkbox-label">
        {label}
      </label>
    </div>
  )
}

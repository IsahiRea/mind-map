import '../../../css/components/forms/TextArea.css'

export default function TextArea({
  label,
  error,
  required,
  id,
  className = '',
  rows = 3,
  ...props
}) {
  const textareaId = id || `textarea-${label?.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className="form-field">
      {label && (
        <label htmlFor={textareaId} className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={`form-textarea ${error ? 'form-textarea-error' : ''} ${className}`}
        {...props}
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  )
}

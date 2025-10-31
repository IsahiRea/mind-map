import { useState, useCallback } from 'react'

/**
 * Custom hook for form validation
 * @param {Object} initialValues - Initial form values
 * @param {Function} validate - Validation function that returns errors object
 * @returns {Object} - Form state and handlers
 */
export function useFormValidation(initialValues, validate) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const handleChange = useCallback(
    (name, value) => {
      setValues(prev => ({ ...prev, [name]: value }))

      // Clear error for this field when user starts typing
      if (errors[name]) {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[name]
          return newErrors
        })
      }
    },
    [errors]
  )

  const handleBlur = useCallback(
    name => {
      setTouched(prev => ({ ...prev, [name]: true }))

      // Validate single field
      if (validate) {
        const validationErrors = validate({ ...values })
        if (validationErrors[name]) {
          setErrors(prev => ({ ...prev, [name]: validationErrors[name] }))
        }
      }
    },
    [values, validate]
  )

  const handleSubmit = useCallback(
    onSubmit => {
      return e => {
        if (e) e.preventDefault()

        // Validate all fields
        if (validate) {
          const validationErrors = validate(values)
          setErrors(validationErrors)

          // Mark all fields as touched
          const allTouched = Object.keys(values).reduce((acc, key) => {
            acc[key] = true
            return acc
          }, {})
          setTouched(allTouched)

          // Only submit if no errors
          if (Object.keys(validationErrors).length === 0) {
            onSubmit(values)
          }
        } else {
          onSubmit(values)
        }
      }
    },
    [values, validate]
  )

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setValues,
  }
}

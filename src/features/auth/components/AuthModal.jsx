import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Modal } from '../../../shared'
import xIcon from '../../../assets/icons/x.svg'
import '../../../css/components/AuthModal.css'

export default function AuthModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signIn } = useAuth()

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')

    // Validation
    if (!email || !password) {
      setError('Email and password are required')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      setLoading(true)
      await signIn(email, password)
      onClose()
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setPassword('')
    setError('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="auth-modal">
        <button className="auth-modal-close" onClick={handleClose}>
          <img src={xIcon} alt="Close" />
        </button>

        <div className="auth-modal-header">
          <h2 className="auth-modal-title">Owner Sign In</h2>
          <p className="auth-modal-description">
            Sign in to access owner mode and manage your knowledge map
          </p>
        </div>

        <form className="auth-modal-form" onSubmit={handleSubmit}>
          {error && <div className="auth-modal-error">{error}</div>}

          <div className="auth-modal-field">
            <label htmlFor="email" className="auth-modal-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="auth-modal-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={loading}
              required
            />
          </div>

          <div className="auth-modal-field">
            <label htmlFor="password" className="auth-modal-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="auth-modal-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="auth-modal-submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </Modal>
  )
}

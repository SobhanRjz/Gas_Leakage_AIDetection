import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../services/AuthService'
import { ThemeContext } from '../components/Header'
import './LoginPage.css'

// Path resolution that works in both development and production
const getImagePath = (filename: string) => `/Gas_Leakage_AIDetection/images/${filename}`

/**
 * Login page component
 */
const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { isDarkTheme } = React.useContext(ThemeContext)

  // Form validation
  const isFormValid = username.trim() !== '' && password.trim() !== ''

  const { authService } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return

    setError('')
    setLoading(true)

    try {
      const success = await authService.login(username, password)
      if (success) {
        navigate('/overview')
      } else {
        setError('Invalid credentials')
      }
    } catch (err) {
      setError('Login failed')
    } finally {
      setLoading(false)
    }
  }

  // Copy demo credentials to clipboard
  const copyDemoCredentials = async () => {
    const credentials = 'admin / password'
    try {
      await navigator.clipboard.writeText(credentials)
      // Optional: Show a brief success message
      console.log('Demo credentials copied to clipboard')
    } catch (err) {
      // Fallback: select the text
      console.log('Copy failed, credentials:', credentials)
    }
  }

  return (
    <div className={`login-page ${isDarkTheme ? 'theme-dark' : 'theme-light'}`}>
      {/* Fullscreen background image */}
      <img
        className="login-bg"
        src={getImagePath('login.jpg')}
        alt=""
        loading="eager"
        {...{ fetchpriority: "high" } as any}
      />
      <div className="login-container">
        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>Sign in to access the pipeline monitoring system</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              aria-describedby={error ? "error-message" : undefined}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              aria-describedby={error ? "error-message" : undefined}
            />
          </div>

          {error && (
            <div
              id="error-message"
              className="error-message"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading || !isFormValid}
            aria-describedby={error ? "error-message" : undefined}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <button
            type="button"
            className="demo-credentials-chip"
            onClick={copyDemoCredentials}
            title="Click to copy demo credentials"
          >
            Demo: admin / password
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

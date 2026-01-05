import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../services/AuthService'
import './LandingPage.css'

// Path resolution that works in both development and production
const getImagePath = (filename: string) => `${import.meta.env.VITE_BASE || '/'}images/${filename}`

/**
 * Landing page component
 */
const LandingPage: React.FC = () => {
  const { authState } = useAuth()
  const navigate = useNavigate()

  const handleStartTrial = () => {
    if (authState.isAuthenticated) {
      navigate('/overview')
    } else {
      navigate('/login')
    }
  }

  const handleLogin = () => {
    if (authState.isAuthenticated) {
      navigate('/overview')
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="landing-page">
      <header className="top-nav">
        <div className="nav-spacer" />
        <div className="nav-actions">
          <button onClick={handleLogin} className="nav-link">Log in</button>
          <Link to="/signup" className="nav-link nav-primary">Sign up</Link>
        </div>
      </header>

      {/* Fullscreen background image */}
      <img
        className="hero-bg"
        src={getImagePath('hero-pipeline.jpg')}
        alt=""
        loading="eager"
        {...{ fetchpriority: "high" } as any}
        srcSet={`${getImagePath('hero-pipeline-1200.jpg')} 1200w,
                ${getImagePath('hero-pipeline-1600.jpg')} 1600w,
                ${getImagePath('hero-pipeline-2000.jpg')} 2000w`}
        sizes="(min-width:1440px) 1440px, 100vw"
      />
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Intelligent Pipeline Leakage Detection<br />
            Monitoring System
          </h1>
          <p className="hero-subtitle">
            <strong>AI-powered monitoring</strong> that identifies leaks, pressure anomalies, and abnormal flow patterns in <strong>real time</strong>.
          </p>
          <div className="cta-row">
            <button onClick={handleStartTrial} className="cta-primary">
              Start Free Trial
            </button>
            <button className="cta-secondary">
              View Live Demo
            </button>
          </div>
          <div className="trust-note">
            No credit card required • Free 14-day trial
          </div>
        </div>
      </div>

      <footer className="landing-footer">
        <div className="social-proof">
          <div className="trust-text">Trusted by energy operators & infrastructure teams</div>
          <div className="metrics">
            <span className="metric">● Real-time monitoring</span>
            <span className="metric">● Sub-second alerts</span>
            <span className="metric">● Designed for industrial environments</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage

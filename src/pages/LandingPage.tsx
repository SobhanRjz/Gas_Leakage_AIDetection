import React from 'react'
import { Link } from 'react-router-dom'
import './LandingPage.css'

/**
 * Landing page component
 */
const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      <div className="hero-section">
        <h1 className="hero-title">
          Intelligent Gas Pipeline<br />
          Monitoring System
        </h1>
        <p className="hero-subtitle">
          Real-time detection, analytics, and alerting for pipeline safety.
        </p>
        <div className="hero-actions">
          <Link to="/login" className="cta-button primary">
            Get Started
          </Link>
          <button className="cta-button secondary">
            Watch Demo
          </button>
        </div>
      </div>

      <div id="features" className="features-section">
        <div className="feature-card" style={{ '--card-index': 0 } as React.CSSProperties}>
          <div className="feature-icon">🔍</div>
          <h3>Real-time Monitoring</h3>
          <p>Continuous surveillance of pipeline conditions</p>
        </div>
        <div className="feature-card" style={{ '--card-index': 1 } as React.CSSProperties}>
          <div className="feature-icon">⚡</div>
          <h3>Instant Alerts</h3>
          <p>Immediate notifications on detected anomalies</p>
        </div>
        <div className="feature-card" style={{ '--card-index': 2 } as React.CSSProperties}>
          <div className="feature-icon">📊</div>
          <h3>Analytics Dashboard</h3>
          <p>Comprehensive data analysis and reporting</p>
        </div>
      </div>
    </div>
  )
}

export default LandingPage

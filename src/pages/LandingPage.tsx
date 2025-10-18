import React from 'react'
import { Link } from 'react-router-dom'
import './LandingPage.css'

// Path resolution that works in both development and production
const getImagePath = (filename: string) => `/Gas_Leakage_AIDetection/images/${filename}`

/**
 * Landing page component
 */
const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
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
            Intelligent Gas Pipeline<br />
            Monitoring System
          </h1>
          <p className="hero-subtitle">
            Real-time detection, analytics, and alerting for pipeline safety.
          </p>
          <div className="cta-row">
            <Link to="/login" className="cta-primary">
              Get Started
            </Link>
            <button className="cta-secondary">
              ▶ Watch Demo
            </button>
          </div>
          <div className="trust-note">
            No credit card required • Free 14-day trial
          </div>
        </div>
      </div>
    </div>
  )
}

export default LandingPage

import React from 'react'
import { useAuth } from '../services/AuthService'
import './OverviewPage.css'

/**
 * Overview page component for authenticated users
 */
const OverviewPage: React.FC = () => {
  const { authState } = useAuth()

  return (
    <div className="overview-page">
      <div className="overview-header">
        <h1>Pipeline Overview</h1>
        <p>Welcome back, {authState.user}</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card status-card">
          <div className="card-header">
            <h3>System Status</h3>
            <div className="status-indicator operational"></div>
          </div>
          <div className="card-content">
            <p className="status-text">All Systems Operational</p>
            <div className="status-details">
              <span>Active Pipelines: 12</span>
              <span>Monitoring Points: 156</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card alerts-card">
          <div className="card-header">
            <h3>Active Alerts</h3>
            <div className="alert-count">3</div>
          </div>
          <div className="card-content">
            <div className="alert-item critical">
              <span className="alert-type">Pressure Drop</span>
              <span className="alert-location">Sector A-7</span>
              <span className="alert-time">2 min ago</span>
            </div>
            <div className="alert-item warning">
              <span className="alert-type">Flow Anomaly</span>
              <span className="alert-location">Sector B-12</span>
              <span className="alert-time">15 min ago</span>
            </div>
            <div className="alert-item info">
              <span className="alert-type">Maintenance Due</span>
              <span className="alert-location">Sector C-3</span>
              <span className="alert-time">1 hour ago</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card performance-card">
          <div className="card-header">
            <h3>Performance Metrics</h3>
          </div>
          <div className="card-content">
            <div className="metric">
              <span className="metric-label">Detection Accuracy</span>
              <span className="metric-value">98.5%</span>
            </div>
            <div className="metric">
              <span className="metric-label">Response Time</span>
              <span className="metric-value">2.3s</span>
            </div>
            <div className="metric">
              <span className="metric-label">Uptime</span>
              <span className="metric-value">99.9%</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card map-card">
          <div className="card-header">
            <h3>Pipeline Network</h3>
          </div>
          <div className="card-content">
            <div className="pipeline-map">
              <div className="map-placeholder">
                <p>Interactive pipeline map will be displayed here</p>
                <div className="pipeline-segments">
                  <div className="segment normal"></div>
                  <div className="segment warning"></div>
                  <div className="segment critical"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OverviewPage

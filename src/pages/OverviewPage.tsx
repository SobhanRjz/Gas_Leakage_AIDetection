import React from 'react'
import { useNavigate } from 'react-router-dom'
import './OverviewPage.css'

/**
 * Overview page component for authenticated users
 */
const OverviewPage: React.FC = () => {
  const [mapFocus, setMapFocus] = React.useState(false)
  const [showLeakZone, setShowLeakZone] = React.useState(false)
  const navigate = useNavigate()

  const handleRefreshStats = () => {
    console.log('Refreshing detection statistics')
    // In a real app, this would fetch updated statistics from the server
    alert('Statistics refreshed!')
  }

  const handleViewReports = () => {
    console.log('Navigating to reports page')
    navigate('/reports')
  }

  const handleUploadView = () => {
    console.log('Opening upload interface')
    // In a real app, this would open an upload modal or navigate to upload page
    alert('Opening upload interface...')
  }

  return (
    <div className="overview-page">
      {/* Global Status Bar */}
      <div className="global-status-bar">
        <div className="status-indicator-large">
          <span className="status-dot green"></span>
          <span className="status-text">All Systems Normal</span>
        </div>
        <div className="status-metrics">
          <span className="metric-item"><strong>3</strong> Leaks Active</span>
          <span className="metric-item"><strong>156</strong>/<strong>160</strong> Sensors Online</span>
          <span className="metric-item">Last Updated: <strong>2s</strong> ago</span>
        </div>
        <div className="status-actions">
          <button className="status-btn" onClick={handleRefreshStats}>🔄 Refresh</button>
          <button className="status-btn primary" onClick={handleViewReports}>📊 Reports</button>
        </div>
      </div>

      {/* Real-Time Zone - Centerpiece */}
      <div className="real-time-zone">
        <div className="map-section">
          <div className="dashboard-card map-card dark-theme dominant">
          <div className="card-header map-header">
            <h3>Interactive Pipeline Map</h3>
            <div className="map-controls">
              <button className="map-btn focus-btn active" onClick={() => setMapFocus(!mapFocus)}>
                🎯 Focus
              </button>
              <button className="map-btn leak-zone-btn" onClick={() => setShowLeakZone(!showLeakZone)}>
                ⚠️ Leaks
              </button>
              <button className="map-btn zoom-in">+</button>
              <button className="map-btn zoom-out">-</button>
              <button className="map-btn fullscreen">⛶</button>
            </div>
          </div>
          <div className="card-content map-content">
            <div className="pipeline-map">
              <div className="map-background">
                <div className="map-grid">
                  <div className="grid-line horizontal"></div>
                  <div className="grid-line horizontal"></div>
                  <div className="grid-line vertical"></div>
                  <div className="grid-line vertical"></div>

                  {/* Animated Pipeline Route */}
                  <div className="pipeline-route">
                    {/* Simple debug rectangle first */}
                    <div style={{
                      position: 'absolute',
                      top: '50px',
                      left: '50px',
                      width: '100px',
                      height: '20px',
                      background: 'red',
                      zIndex: 10
                    }}>
                      DEBUG: SVG AREA
                    </div>

                    <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
                      {/* Simple background rectangle for debugging */}
                      <rect x="0" y="0" width="400" height="200" fill="rgba(255, 0, 0, 0.1)" />

                      {/* Simple line for testing */}
                      <line x1="50" y1="100" x2="350" y2="100" stroke="red" strokeWidth="4" />
                      <circle cx="50" cy="100" r="10" fill="blue" />
                      <circle cx="350" cy="100" r="10" fill="green" />

                      <text x="200" y="95" textAnchor="middle" fill="white" fontSize="12">PIPELINE MAP</text>
                    </svg>
                  </div>

                  {/* Station Labels */}
                  <div className="station-label" style={{left: '8%', top: '55%'}}>
                    <div className="label-content">Pump Station A</div>
                  </div>
                  <div className="station-label maintenance" style={{left: '48%', top: '45%'}}>
                    <div className="label-content">Valve Station B</div>
                  </div>
                  <div className="station-label" style={{left: '85%', top: '55%'}}>
                    <div className="label-content">Pump Station C</div>
                  </div>
                </div>

                <div className="map-overlay">
                  <div className="live-indicator">
                    <span className="pulse-dot"></span>
                    LIVE MONITORING ACTIVE
                  </div>
                  <div className="map-stats">
                    <div className="stat-item">
                      <span className="stat-label">Coverage:</span>
                      <span className="stat-value">2,450 km</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Active Sensors:</span>
                      <span className="stat-value">156/160</span>
                    </div>
                  </div>
                </div>

                <div className="map-legend enhanced">
                  <div className="legend-item">
                    <div className="legend-color operational"></div>
                    <span>Operational</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color maintenance"></div>
                    <span>Maintenance</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color critical"></div>
                    <span>Critical Leak</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color warning"></div>
                    <span>Warning Leak</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-card alerts-visual-card">
          <div className="card-header gradient-header">
            <h3>Alerts & Visual Feed</h3>
            <span className="alert-count">3</span>
          </div>
          <div className="card-content">
            <div className="alerts-section">
              <div className="alerts-header">
                <h4>Recent Alerts</h4>
                <div className="alert-filters">
                  <button className="filter-btn active">All</button>
                  <button className="filter-btn">Critical</button>
                  <button className="filter-btn">Warning</button>
                </div>
              </div>

              <div className="alert-item enhanced">
                <div className="alert-thumbnail">
                  <div className="camera-snapshot">
                    📹
                  </div>
                </div>
                <div className="alert-content">
                  <div className="alert-header">
              <span className="alert-type">Pressure Drop</span>
                    <div className="alert-meta">
                      <span className="severity-chip critical">CRITICAL</span>
                      <span className="status-tag new">NEW</span>
                    </div>
                  </div>
                  <span className="alert-location">📍 Sector A-7, KM 125.3</span>
                  <div className="alert-details">
                    <span className="alert-desc">Pressure dropped 15 PSI below threshold</span>
                    <span className="alert-time">🕒 2 min ago</span>
                  </div>
                </div>
                <div className="alert-actions">
                  <button className="alert-action-btn acknowledge">Acknowledge</button>
                  <button className="alert-action-btn investigate">Investigate</button>
                </div>
              </div>

              <div className="alert-item enhanced">
                <div className="alert-thumbnail">
                  <div className="map-pin">
                    📌
                  </div>
            </div>
                <div className="alert-content">
                  <div className="alert-header">
              <span className="alert-type">Flow Anomaly</span>
                    <div className="alert-meta">
                      <span className="severity-chip warning">WARNING</span>
                      <span className="status-tag acknowledged">ACKD</span>
                    </div>
                  </div>
                  <span className="alert-location">📍 Sector B-12, KM 89.7</span>
                  <div className="alert-details">
                    <span className="alert-desc">Flow rate decreased by 8%</span>
                    <span className="alert-time">🕒 15 min ago</span>
                  </div>
                </div>
                <div className="alert-actions">
                  <button className="alert-action-btn resolve">Resolve</button>
                  <button className="alert-action-btn details">Details</button>
                </div>
              </div>

              <div className="alert-item enhanced">
                <div className="alert-thumbnail">
                  <div className="maintenance-icon">
                    🔧
                  </div>
                </div>
                <div className="alert-content">
                  <div className="alert-header">
                    <span className="alert-type">Maintenance Due</span>
                    <div className="alert-meta">
                      <span className="severity-chip info">INFO</span>
                      <span className="status-tag scheduled">SCHEDULED</span>
                    </div>
                  </div>
                  <span className="alert-location">📍 Sector C-3, KM 234.1</span>
                  <div className="alert-details">
                    <span className="alert-desc">Quarterly valve inspection required</span>
                    <span className="alert-time">🕒 Due in 2 days</span>
                  </div>
                </div>
                <div className="alert-actions">
                  <button className="alert-action-btn schedule">Schedule</button>
                  <button className="alert-action-btn dismiss">Dismiss</button>
                </div>
              </div>
            </div>

            <div className="visual-feed-section">
              <h4>Visual Detection Feed</h4>
              <div className="mini-camera-grid">
                <div className="mini-camera active">
                  <div className="camera-status online"></div>
                  <span className="camera-label">Cam A</span>
                </div>
                <div className="mini-camera active">
                  <div className="camera-status online"></div>
                  <span className="camera-label">Cam B</span>
                </div>
                <div className="mini-camera warning">
                  <div className="camera-status alert"></div>
                  <span className="camera-label">Cam C</span>
                </div>
                <div className="mini-camera offline">
                  <div className="camera-status offline"></div>
                  <span className="camera-label">Cam D</span>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>

        <div className="alerts-panel">
          <div className="dashboard-card alerts-visual-card">
          <div className="card-header">
            <h3>Recent Defects</h3>
            <button className="view-details-btn">View All</button>
          </div>
          <div className="card-content">
            <div className="defect-item">
              <div className="defect-header">
                <span className="defect-type critical">Corrosion</span>
                <span className="defect-severity">High</span>
              </div>
              <div className="defect-details">
                <span className="defect-location">Sector A-7, KM 125.3</span>
                <span className="defect-date">Detected: Dec 15, 2024</span>
              </div>
              <div className="defect-description">
                Wall thickness reduced by 35% in elbow section
              </div>
            </div>
            <div className="defect-item">
              <div className="defect-header">
                <span className="defect-type warning">Crack</span>
                <span className="defect-severity">Medium</span>
              </div>
              <div className="defect-details">
                <span className="defect-location">Sector B-12, KM 89.7</span>
                <span className="defect-date">Detected: Dec 14, 2024</span>
              </div>
              <div className="defect-description">
                Longitudinal crack detected in weld seam
              </div>
            </div>
            <div className="defect-item">
              <div className="defect-header">
                <span className="defect-type info">Dent</span>
                <span className="defect-severity">Low</span>
              </div>
              <div className="defect-details">
                <span className="defect-location">Sector C-3, KM 234.1</span>
                <span className="defect-date">Detected: Dec 13, 2024</span>
              </div>
              <div className="defect-description">
                Minor dent with no wall thickness reduction
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-card visual-detection-card">
          <div className="card-header">
            <h3>Visual Detection Feed</h3>
            <span className="live-indicator">● LIVE</span>
          </div>
          <div className="card-content">
            <div className="detection-stats-grid">
              <div className="stat-card uploads-card">
                <div className="stat-header">
                  <div className="stat-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">2,847</span>
                    <span className="stat-label">Total Uploads</span>
                  </div>
                </div>
                <div className="stat-breakdown">
                  <div className="breakdown-item">
                    <span className="breakdown-label">Videos</span>
                    <span className="breakdown-value">1,234</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Images</span>
                    <span className="breakdown-value">1,613</span>
                  </div>
                </div>
              </div>

              <div className="stat-card ai-analysis-card">
                <div className="stat-header">
                  <div className="stat-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">1,891</span>
                    <span className="stat-label">AI Analyzed</span>
                  </div>
                </div>
                <div className="stat-breakdown">
                  <div className="breakdown-item">
                    <span className="breakdown-label">Success Rate</span>
                    <span className="breakdown-value success">94.2%</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Processing Time</span>
                    <span className="breakdown-value">2.3s avg</span>
                  </div>
                </div>
              </div>

              <div className="stat-card processing-card">
                <div className="stat-header">
                  <div className="stat-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">156</span>
                    <span className="stat-label">Processing Now</span>
                  </div>
                </div>
                <div className="stat-breakdown">
                  <div className="breakdown-item">
                    <span className="breakdown-label">Queue</span>
                    <span className="breakdown-value">23</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Completed Today</span>
                    <span className="breakdown-value">89</span>
                  </div>
                </div>
              </div>

              <div className="stat-card alerts-card">
                <div className="stat-header">
                  <div className="stat-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">47</span>
                    <span className="stat-label">Detections Found</span>
                  </div>
                </div>
                <div className="stat-breakdown">
                  <div className="breakdown-item">
                    <span className="breakdown-label">Critical</span>
                    <span className="breakdown-value critical">12</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Warning</span>
                    <span className="breakdown-value warning">35</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="feed-controls">
              <button className="control-btn refresh-btn" onClick={handleRefreshStats}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4V9H4.58152M4.58152 9C5.27974 7.61091 6.36686 6.53073 7.66156 5.93031C8.95627 5.32989 10.3757 5.24285 11.7009 5.68177C13.0261 6.12069 14.1747 7.05705 14.951 8.32132C15.7273 9.58559 16.0845 11.0994 15.9557 12.6207C15.8269 14.142 15.2206 15.5733 14.2285 16.6776C13.2364 17.7819 11.9112 18.4919 10.5 18.6915C9.0888 18.8911 7.67348 18.5674 6.44074 17.7746C5.208 16.9818 4.22946 15.7638 3.67467 14.3236M4.58152 9H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Refresh Stats
              </button>
              <button className="control-btn reports-btn" onClick={handleViewReports}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                View Reports
              </button>
              <button className="control-btn upload-btn" onClick={handleUploadView}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Upload Media
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Metrics & Trends */}
      <div className="metrics-trends-section">
        <h2 className="section-title">Key Performance Metrics</h2>
        <div className="health-strip">
          <div className="kpi-card critical pulse-glow">
            <div className="kpi-icon">
              <span className="emoji-icon">🚨</span>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">3</div>
              <div className="kpi-label">Active Leaks</div>
              <div className="kpi-sparkline">
                <svg width="60" height="20" viewBox="0 0 60 20">
                  <path d="M0 15 L10 12 L20 18 L30 8 L40 14 L50 6 L60 10" stroke="#ef4444" strokeWidth="2.5" fill="none" className="sparkline-path"/>
                  <circle cx="60" cy="10" r="2" fill="#ef4444" className="sparkline-dot"/>
                </svg>
              </div>
            </div>
          </div>

        <div className="kpi-card safe">
          <div className="kpi-icon">
            <span className="emoji-icon">🎯</span>
          </div>
          <div className="kpi-content">
            <div className="ai-success-visualization">
              <svg width="80" height="80" viewBox="0 0 80 80" className="ai-progress-circle">
                <defs>
                  <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{stopColor:'#10b981'}} />
                    <stop offset="100%" style={{stopColor:'#06b6d4'}} />
                  </linearGradient>
                </defs>

                {/* Background circle */}
                <circle cx="40" cy="40" r="35" fill="none" stroke="rgba(16, 185, 129, 0.1)" strokeWidth="4"/>

                {/* Progress circle (98.5% = 353 degrees out of 360) */}
                <circle cx="40" cy="40" r="35" fill="none" stroke="url(#aiGradient)" strokeWidth="4"
                        strokeLinecap="round" strokeDasharray="219.8 6.4" strokeDashoffset="0"
                        transform="rotate(-90 40 40)" className="progress-ring">
                  <animate attributeName="stroke-dashoffset" values="6.4;0;6.4" dur="4s" repeatCount="indefinite"/>
                </circle>

                {/* Center content */}
                <text x="40" y="42" textAnchor="middle" fontSize="16" fontWeight="700" fill="#10b981" className="ai-percentage">98.5</text>
                <text x="40" y="52" textAnchor="middle" fontSize="8" fill="#64748b">SUCCESS</text>
              </svg>
            </div>
            <div className="kpi-label">AI Detection Rate</div>
          </div>
        </div>

        <div className="kpi-card warning">
          <div className="kpi-icon">
            <span className="emoji-icon">⚡</span>
          </div>
          <div className="kpi-content">
            <div className="pressure-visualization">
              <svg width="100" height="60" viewBox="0 0 100 60" className="pressure-gauge">
                <defs>
                  <linearGradient id="pressureGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{stopColor:'#10b981'}} />
                    <stop offset="40%" style={{stopColor:'#84cc16'}} />
                    <stop offset="70%" style={{stopColor:'#f59e0b'}} />
                    <stop offset="100%" style={{stopColor:'#ef4444'}} />
                  </linearGradient>
                  <radialGradient id="gaugeBg" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style={{stopColor:'rgba(245, 158, 11, 0.1)'}} />
                    <stop offset="100%" style={{stopColor:'rgba(245, 158, 11, 0.05)'}} />
                  </radialGradient>
                </defs>

                {/* Background circle */}
                <circle cx="50" cy="35" r="25" fill="url(#gaugeBg)" stroke="#e5e7eb" strokeWidth="1"/>

                {/* Pressure arc */}
                <path d="M 25 35 A 25 25 0 0 1 75 35"
                      stroke="url(#pressureGradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      className="pressure-arc"/>

                {/* Current pressure indicator */}
                <circle cx="50" cy="35" r="20" fill="none" stroke="#f59e0b" strokeWidth="2" opacity="0.3"/>
                <circle cx="50" cy="20" r="3" fill="#f59e0b" className="pressure-needle">
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    values="0 50 35;45 50 35;0 50 35"
                    dur="3s"
                    repeatCount="indefinite"/>
                </circle>

                {/* Pressure zones */}
                <text x="25" y="55" textAnchor="middle" fontSize="8" fill="#10b981">Low</text>
                <text x="50" y="55" textAnchor="middle" fontSize="8" fill="#f59e0b">Normal</text>
                <text x="75" y="55" textAnchor="middle" fontSize="8" fill="#ef4444">High</text>
              </svg>
              <div className="pressure-display">
                <span className="pressure-value">45.2</span>
                <span className="pressure-unit">PSI</span>
              </div>
            </div>
            <div className="kpi-label">Pressure</div>
          </div>
        </div>

        <div className="kpi-card nominal">
          <div className="kpi-icon">
            <span className="emoji-icon">🌊</span>
          </div>
          <div className="kpi-content">
            <div className="flow-visualization">
              <svg width="100" height="60" viewBox="0 0 100 60" className="flow-waveform">
                <defs>
                  <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{stopColor:'#10b981'}} />
                    <stop offset="50%" style={{stopColor:'#3b82f6'}} />
                    <stop offset="100%" style={{stopColor:'#06b6d4'}} />
                  </linearGradient>
                </defs>
                {/* Flow waveform */}
                <path d="M0 40 Q10 30 20 35 T40 32 T60 28 T80 35 T100 30"
                      stroke="url(#flowGradient)"
                      strokeWidth="3"
                      fill="none"
                      className="waveform-path"/>
                {/* Flow particles */}
                <circle cx="15" cy="32" r="2" fill="#3b82f6" className="flow-particle" opacity="0.7">
                  <animate attributeName="cx" values="15;35;55;75;95" dur="3s" repeatCount="indefinite"/>
                </circle>
                <circle cx="35" cy="30" r="1.5" fill="#06b6d4" className="flow-particle" opacity="0.5">
                  <animate attributeName="cx" values="35;55;75;95;15" dur="3s" repeatCount="indefinite" begin="1s"/>
                </circle>
                <circle cx="55" cy="28" r="2" fill="#10b981" className="flow-particle" opacity="0.8">
                  <animate attributeName="cx" values="55;75;95;15;35" dur="3s" repeatCount="indefinite" begin="2s"/>
                </circle>
              </svg>
              <div className="flow-rate-display">
                <span className="flow-rate-value">1,247</span>
                <span className="flow-rate-unit">m³/h</span>
              </div>
            </div>
            <div className="kpi-label">Flow Rate</div>
          </div>
        </div>

          <div className="kpi-card neutral">
            <div className="kpi-icon">
              <span className="emoji-icon">📡</span>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">156/160</div>
              <div className="kpi-label">Sensors Online</div>
              <div className="kpi-sparkline">
                <svg width="60" height="20" viewBox="0 0 60 20">
                  <path d="M0 8 L10 12 L20 6 L30 14 L40 8 L50 10 L60 6" stroke="#6b7280" strokeWidth="2.5" fill="none" className="sparkline-path"/>
                  <circle cx="60" cy="6" r="2" fill="#6b7280" className="sparkline-dot"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Flow / Pressure / AI Confidence Graphs */}
        <div className="trends-grid">
          <div className="trend-card">
            <h4>Flow Rate Trends</h4>
            <div className="trend-chart">
              <svg width="100%" height="120" viewBox="0 0 300 120">
                <defs>
                  <linearGradient id="flowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{stopColor:'#3b82f6', stopOpacity:0.8}} />
                    <stop offset="100%" style={{stopColor:'#3b82f6', stopOpacity:0.1}} />
                  </linearGradient>
                </defs>
                <path d="M0 100 L30 80 L60 85 L90 70 L120 75 L150 60 L180 65 L210 50 L240 55 L270 45 L300 50" stroke="#3b82f6" strokeWidth="3" fill="none"/>
                <path d="M0 100 L30 80 L60 85 L90 70 L120 75 L150 60 L180 65 L210 50 L240 55 L270 45 L300 50 L300 120 L0 120 Z" fill="url(#flowGradient)"/>
              </svg>
            </div>
          </div>

          <div className="trend-card">
            <h4>Pressure Monitoring</h4>
            <div className="trend-chart">
              <svg width="100%" height="120" viewBox="0 0 300 120">
                <defs>
                  <linearGradient id="pressureGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{stopColor:'#f59e0b', stopOpacity:0.8}} />
                    <stop offset="100%" style={{stopColor:'#f59e0b', stopOpacity:0.1}} />
                  </linearGradient>
                </defs>
                <path d="M0 80 L30 75 L60 85 L90 70 L120 90 L150 65 L180 80 L210 60 L240 75 L270 55 L300 70" stroke="#f59e0b" strokeWidth="3" fill="none"/>
                <path d="M0 80 L30 75 L60 85 L90 70 L120 90 L150 65 L180 80 L210 60 L240 75 L270 55 L300 70 L300 120 L0 120 Z" fill="url(#pressureGradient)"/>
              </svg>
            </div>
          </div>

          <div className="trend-card">
            <h4>AI Confidence Score</h4>
            <div className="trend-chart">
              <svg width="100%" height="120" viewBox="0 0 300 120">
                <defs>
                  <linearGradient id="aiGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{stopColor:'#10b981', stopOpacity:0.8}} />
                    <stop offset="100%" style={{stopColor:'#10b981', stopOpacity:0.1}} />
                  </linearGradient>
                </defs>
                <path d="M0 90 L30 85 L60 95 L90 80 L120 98 L150 75 L180 92 L210 70 L240 88 L270 65 L300 85" stroke="#10b981" strokeWidth="3" fill="none"/>
                <path d="M0 90 L30 85 L60 95 L90 80 L120 98 L150 75 L180 92 L210 70 L240 88 L270 65 L300 85 L300 120 L0 120 Z" fill="url(#aiGradient)"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Zone */}
      <div className="analysis-zone">
        <div className="analysis-grid">
          <div className="dashboard-card defects-card">
            <div className="card-header">
              <h3>Recent Defects</h3>
              <button className="view-details-btn">View All</button>
            </div>
            <div className="card-content">
              <div className="defect-item">
                <div className="defect-header">
                  <span className="defect-type critical">Corrosion</span>
                  <span className="defect-severity">High</span>
                </div>
                <div className="defect-details">
                  <span className="defect-location">Sector A-7, KM 125.3</span>
                  <span className="defect-date">Detected: Dec 15, 2024</span>
                </div>
                <div className="defect-description">
                  Wall thickness reduced by 35% in elbow section
                </div>
              </div>
              <div className="defect-item">
                <div className="defect-header">
                  <span className="defect-type warning">Crack</span>
                  <span className="defect-severity">Medium</span>
                </div>
                <div className="defect-details">
                  <span className="defect-location">Sector B-12, KM 89.7</span>
                  <span className="defect-date">Detected: Dec 14, 2024</span>
                </div>
                <div className="defect-description">
                  Longitudinal crack detected in weld seam
                </div>
              </div>
              <div className="defect-item">
                <div className="defect-header">
                  <span className="defect-type info">Dent</span>
                  <span className="defect-severity">Low</span>
                </div>
                <div className="defect-details">
                  <span className="defect-location">Sector C-3, KM 234.1</span>
                  <span className="defect-date">Detected: Dec 13, 2024</span>
                </div>
                <div className="defect-description">
                  Minor dent with no wall thickness reduction
                </div>
              </div>
            </div>
          </div>

          <div className="pipeline-glance">
            <div className="glance-card">
              <div className="glance-header">
                <h3>Pipeline at a Glance</h3>
                <span className="status-indicator normal">All Systems Normal</span>
              </div>
              <div className="glance-content">
            <div className="pipeline-schematic">
              <svg width="300" height="80" viewBox="0 0 300 80" className="pipeline-network">
                <defs>
                  <linearGradient id="pipeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{stopColor:'#3b82f6', stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:'#06b6d4', stopOpacity:1}} />
                  </linearGradient>

                  {/* Node shadow filter */}
                  <filter id="nodeShadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.3)"/>
                  </filter>

                  {/* Pulse animation */}
                  <animate id="pulse" attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite"/>
                </defs>

                {/* Main pipeline */}
                <rect x="20" y="35" width="260" height="8" fill="url(#pipeGradient)" rx="4"/>

                {/* Pipeline flow animation */}
                <rect x="20" y="35" width="50" height="8" fill="rgba(59, 130, 246, 0.6)" rx="4" className="flow-segment">
                  <animate attributeName="x" values="20;270;20" dur="8s" repeatCount="indefinite"/>
                </rect>

                {/* Station Node 1 - Operational */}
                <g className="station-node operational" transform="translate(50,40)">
                  <circle cx="0" cy="0" r="12" fill="#10b981" filter="url(#nodeShadow)" className="node-bg"/>
                  <circle cx="0" cy="0" r="8" fill="none" stroke="white" strokeWidth="2"/>
                  <text x="0" y="3" textAnchor="middle" fontSize="12" fill="white" fontWeight="bold">✅</text>
                  <text x="0" y="22" textAnchor="middle" fontSize="8" fill="#64748b" fontWeight="600">Pump A</text>
                </g>

                {/* Station Node 2 - Maintenance */}
                <g className="station-node maintenance" transform="translate(150,40)">
                  <circle cx="0" cy="0" r="12" fill="#f59e0b" filter="url(#nodeShadow)" className="node-bg"/>
                  <circle cx="0" cy="0" r="8" fill="none" stroke="white" strokeWidth="2"/>
                  <text x="0" y="3" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">🔧</text>
                  <text x="0" y="22" textAnchor="middle" fontSize="8" fill="#64748b" fontWeight="600">Valve B</text>

                  {/* Maintenance indicator */}
                  <circle cx="0" cy="0" r="14" fill="none" stroke="#f59e0b" strokeWidth="2" opacity="0.5">
                    <animate attributeName="r" values="14;16;14" dur="3s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.5;0.8;0.5" dur="3s" repeatCount="indefinite"/>
                  </circle>
                </g>

                {/* Station Node 3 - Leak Alert */}
                <g className="station-node leak-alert" transform="translate(250,40)">
                  <circle cx="0" cy="0" r="12" fill="#ef4444" filter="url(#nodeShadow)" className="node-bg"/>
                  <circle cx="0" cy="0" r="8" fill="none" stroke="white" strokeWidth="2"/>
                  <text x="0" y="3" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">🚨</text>
                  <text x="0" y="22" textAnchor="middle" fontSize="8" fill="#64748b" fontWeight="600">Pump C</text>

                  {/* Critical alert pulse */}
                  <circle cx="0" cy="0" r="16" fill="none" stroke="#ef4444" strokeWidth="3" opacity="0.6">
                    <animate attributeName="r" values="16;20;16" dur="1.5s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.6;0.9;0.6" dur="1.5s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="0" cy="0" r="20" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.3">
                    <animate attributeName="r" values="20;24;20" dur="1.5s" repeatCount="indefinite" begin="0.5s"/>
                    <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1.5s" repeatCount="indefinite" begin="0.5s"/>
                  </circle>
                </g>

                {/* Flow direction arrows */}
                <path d="M 80 38 L 85 35 L 85 41 Z" fill="#3b82f6" opacity="0.7"/>
                <path d="M 180 38 L 185 35 L 185 41 Z" fill="#3b82f6" opacity="0.7"/>
              </svg>
            </div>
                <div className="glance-stats">
                  <div className="glance-stat">
                    <span className="stat-number">2,450 km</span>
                    <span className="stat-label">Total Length</span>
                  </div>
                  <div className="glance-stat">
                    <span className="stat-number">47</span>
                    <span className="stat-label">Active Sections</span>
                  </div>
                  <div className="glance-stat">
                    <span className="stat-number">92%</span>
                    <span className="stat-label">Health Score</span>
                  </div>
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

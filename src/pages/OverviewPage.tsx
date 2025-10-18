import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ThemeContext } from '../components/Header'
import './OverviewPage.css'

/**
 * Industrial Pipeline Monitoring Dashboard
 * Professional UI for real-time pipeline surveillance and defect detection
 */
const OverviewPage: React.FC = () => {
  const navigate = useNavigate()
  const { isDarkTheme } = React.useContext(ThemeContext)

  return (
    <div className={`overview-page ${isDarkTheme ? 'theme-dark' : 'theme-light'}`}>
      {/* System Status Bar */}
      <div className="system-status-bar">
        <div className="system-status-indicator">
          <div className="status-pulse"></div>
          <span className="system-status-text">System Operational</span>
        </div>
        <div className="system-metrics">
          <div className="metric-indicator">
            <span className="metric-label">Active Leaks</span>
            <span className="metric-value"><span className="highlight">3</span></span>
          </div>
          <div className="metric-indicator">
            <span className="metric-label">Sensors Online</span>
            <span className="metric-value">156/160</span>
          </div>
          <div className="metric-indicator">
            <span className="metric-label">System Load</span>
            <span className="metric-value">78%</span>
          </div>
          <div className="metric-indicator">
            <span className="metric-label">Last Update</span>
            <span className="metric-value">2s</span>
          </div>
        </div>
        <div className="system-actions">
          <button className="action-btn" onClick={() => console.log('Refresh')}>
            Refresh
          </button>
          <button className="action-btn primary" onClick={() => navigate('/reports')}>
            Reports
          </button>
        </div>
      </div>

      {/* KPI Monitoring Panels */}
      <div className="kpi-grid">
        {/* Active Leaks */}
        <div className="kpi-panel critical">
          <div className="kpi-header">
            <span className="kpi-icon">⚠️</span>
            <span className="kpi-status-badge">Critical</span>
          </div>
          <div className="kpi-data">
            <div className="kpi-value-display">3</div>
            <div className="kpi-label-text">Active Leaks</div>
          </div>
          <svg className="kpi-trend" viewBox="0 0 100 32" preserveAspectRatio="none">
            <path d="M0 28 L20 24 L40 26 L60 18 L80 22 L100 16" stroke="#ff4757" strokeWidth="2" fill="none" opacity="0.5"/>
          </svg>
        </div>

        {/* Detection Accuracy */}
        <div className="kpi-panel success">
          <div className="kpi-header">
            <span className="kpi-icon">🎯</span>
            <span className="kpi-status-badge">Optimal</span>
          </div>
          <div className="kpi-data">
            <div className="kpi-value-display">98.5%</div>
            <div className="kpi-label-text">AI Accuracy</div>
          </div>
          <svg className="kpi-trend" viewBox="0 0 100 32" preserveAspectRatio="none">
            <path d="M0 20 L20 18 L40 19 L60 16 L80 15 L100 14" stroke="#1dd1a1" strokeWidth="2" fill="none" opacity="0.5"/>
          </svg>
        </div>

        {/* Pipeline Pressure */}
        <div className="kpi-panel warning">
          <div className="kpi-header">
            <span className="kpi-icon">⚡</span>
            <span className="kpi-status-badge">Normal</span>
          </div>
          <div className="kpi-data">
            <div className="kpi-value-display">45.2</div>
            <div className="kpi-label-text">Pressure (PSI)</div>
          </div>
          <svg className="kpi-trend" viewBox="0 0 100 32" preserveAspectRatio="none">
            <path d="M0 16 L20 18 L40 14 L60 20 L80 16 L100 18" stroke="#ffb020" strokeWidth="2" fill="none" opacity="0.5"/>
          </svg>
        </div>

        {/* Flow Rate */}
        <div className="kpi-panel operational">
          <div className="kpi-header">
            <span className="kpi-icon">💧</span>
            <span className="kpi-status-badge">Stable</span>
          </div>
          <div className="kpi-data">
            <div className="kpi-value-display">1,247</div>
            <div className="kpi-label-text">Flow (m³/h)</div>
          </div>
          <svg className="kpi-trend" viewBox="0 0 100 32" preserveAspectRatio="none">
            <path d="M0 18 L20 16 L40 17 L60 15 L80 16 L100 14" stroke="#00d4ff" strokeWidth="2" fill="none" opacity="0.5"/>
          </svg>
        </div>

        {/* Sensor Network */}
        <div className="kpi-panel maintenance">
          <div className="kpi-header">
            <span className="kpi-icon">📡</span>
            <span className="kpi-status-badge">Active</span>
          </div>
          <div className="kpi-data">
            <div className="kpi-value-display">156</div>
            <div className="kpi-label-text">Sensors Online</div>
          </div>
          <svg className="kpi-trend" viewBox="0 0 100 32" preserveAspectRatio="none">
            <path d="M0 20 L20 20 L40 19 L60 20 L80 20 L100 19" stroke="#a463f2" strokeWidth="2" fill="none" opacity="0.5"/>
          </svg>
        </div>
      </div>

      {/* Main Dashboard Layout */}
      <div className="dashboard-layout">
        {/* Main Panel - Pipeline Map */}
        <div className="main-panel">
          <div className="industrial-panel">
            <div className="panel-header">
              <h2 className="panel-title">Pipeline Network Monitor</h2>
              <div className="panel-badge">3 ALERTS</div>
            </div>
            <div className="panel-content" style={{padding: 0}}>
              <div className="map-container">
                {/* Grid Overlay */}
                <div className="map-grid-overlay"></div>

                {/* SVG Map */}
                <div className="map-svg-container">
                  <svg viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet">
                    <defs>
                      {/* Pipeline Gradient */}
                      <linearGradient id="pipeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.6"/>
                        <stop offset="50%" stopColor="#1dd1a1" stopOpacity="0.6"/>
                        <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.6"/>
                      </linearGradient>

                      {/* Station Shadow */}
                      <filter id="stationShadow">
                        <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.5)"/>
                      </filter>

                      {/* Leak Glow */}
                      <filter id="leakGlow">
                        <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#ff4757"/>
                      </filter>
                    </defs>

                    {/* Main Pipeline Network */}
                    <g className="pipeline-network">
                      {/* Main Line */}
                      <path d="M100 200 Q200 180 300 200 T500 190 Q600 180 700 200" 
                            className="pipeline-segment" stroke="url(#pipeGrad)"/>
                      
                      {/* Flow Animation */}
                      <path d="M100 200 Q200 180 300 200 T500 190 Q600 180 700 200" 
                            className="pipeline-flow"/>

                      {/* Branch Line */}
                      <path d="M300 200 Q350 250 400 280 L550 280" 
                            className="pipeline-segment" stroke="url(#pipeGrad)" opacity="0.7"/>

                      {/* Station A - Operational */}
                      <g className="station-marker operational" transform="translate(100,200)">
                        <circle cx="0" cy="0" r="16" fill="#0a0e1a" className="station-bg" filter="url(#stationShadow)"/>
                        <circle cx="0" cy="0" r="12" fill="#00d4ff" className="station-fill" opacity="0.8"/>
                        <circle cx="0" cy="0" r="8" fill="none" stroke="#e8edf4" strokeWidth="2"/>
                        <text x="0" y="4" textAnchor="middle" fontSize="10" fill="#0a0e1a" fontWeight="bold">A</text>
                        <text x="0" y="32" textAnchor="middle" fontSize="9" fill="#8b92a7" fontWeight="600">PUMP-A</text>
                      </g>

                      {/* Station B - Maintenance */}
                      <g className="station-marker maintenance" transform="translate(400,195)">
                        <circle cx="0" cy="0" r="16" fill="#0a0e1a" className="station-bg" filter="url(#stationShadow)"/>
                        <circle cx="0" cy="0" r="12" fill="#a463f2" className="station-fill" opacity="0.8"/>
                        <circle cx="0" cy="0" r="8" fill="none" stroke="#e8edf4" strokeWidth="2"/>
                        <text x="0" y="4" textAnchor="middle" fontSize="10" fill="#0a0e1a" fontWeight="bold">B</text>
                        <text x="0" y="32" textAnchor="middle" fontSize="9" fill="#8b92a7" fontWeight="600">VALVE-B</text>
                        <circle cx="0" cy="0" r="18" fill="none" stroke="#a463f2" strokeWidth="1" opacity="0.4">
                          <animate attributeName="r" values="18;22;18" dur="3s" repeatCount="indefinite"/>
                        </circle>
                      </g>

                      {/* Station C - Operational */}
                      <g className="station-marker operational" transform="translate(700,200)">
                        <circle cx="0" cy="0" r="16" fill="#0a0e1a" className="station-bg" filter="url(#stationShadow)"/>
                        <circle cx="0" cy="0" r="12" fill="#00d4ff" className="station-fill" opacity="0.8"/>
                        <circle cx="0" cy="0" r="8" fill="none" stroke="#e8edf4" strokeWidth="2"/>
                        <text x="0" y="4" textAnchor="middle" fontSize="10" fill="#0a0e1a" fontWeight="bold">C</text>
                        <text x="0" y="32" textAnchor="middle" fontSize="9" fill="#8b92a7" fontWeight="600">PUMP-C</text>
                      </g>

                      {/* Station D - Branch */}
                      <g className="station-marker operational" transform="translate(550,280)">
                        <circle cx="0" cy="0" r="14" fill="#0a0e1a" className="station-bg" filter="url(#stationShadow)"/>
                        <circle cx="0" cy="0" r="10" fill="#00d4ff" className="station-fill" opacity="0.8"/>
                        <circle cx="0" cy="0" r="6" fill="none" stroke="#e8edf4" strokeWidth="2"/>
                        <text x="0" y="3" textAnchor="middle" fontSize="8" fill="#0a0e1a" fontWeight="bold">D</text>
                        <text x="0" y="28" textAnchor="middle" fontSize="8" fill="#8b92a7" fontWeight="600">STATION-D</text>
                      </g>

                      {/* Critical Leak 1 */}
                      <g className="leak-marker critical" transform="translate(600,185)">
                        <circle cx="0" cy="0" r="14" fill="#ff4757" opacity="0.2"/>
                        <circle cx="0" cy="0" r="10" fill="#ff4757" opacity="0.5"/>
                        <circle cx="0" cy="0" r="6" fill="#ff4757" filter="url(#leakGlow)"/>
                        <text x="0" y="28" textAnchor="middle" fontSize="8" fill="#ff4757" fontWeight="bold">LEAK-1</text>
                      </g>

                      {/* Warning Leak 2 */}
                      <g className="leak-marker warning" transform="translate(250,190)">
                        <circle cx="0" cy="0" r="12" fill="#ffb020" opacity="0.2"/>
                        <circle cx="0" cy="0" r="8" fill="#ffb020" opacity="0.5"/>
                        <circle cx="0" cy="0" r="4" fill="#ffb020" filter="url(#leakGlow)"/>
                        <text x="0" y="24" textAnchor="middle" fontSize="8" fill="#ffb020" fontWeight="bold">LEAK-2</text>
                      </g>

                      {/* Critical Leak 3 */}
                      <g className="leak-marker critical" transform="translate(450,280)">
                        <circle cx="0" cy="0" r="14" fill="#ff4757" opacity="0.2"/>
                        <circle cx="0" cy="0" r="10" fill="#ff4757" opacity="0.5"/>
                        <circle cx="0" cy="0" r="6" fill="#ff4757" filter="url(#leakGlow)"/>
                        <text x="0" y="28" textAnchor="middle" fontSize="8" fill="#ff4757" fontWeight="bold">LEAK-3</text>
                      </g>
                    </g>
                  </svg>
                </div>

                {/* HUD Overlay */}
                <div className="map-hud">
                  <div className="hud-metrics">
                    <div className="hud-metric-chip">
                      <div className="hud-metric-label">Coverage</div>
                      <div className="hud-metric-value success">
                        2,450<span className="hud-metric-unit">km</span>
                      </div>
                    </div>
                    <div className="hud-metric-chip">
                      <div className="hud-metric-label">Sensors</div>
                      <div className="hud-metric-value">
                        156<span className="hud-metric-unit">/160</span>
                      </div>
                    </div>
                    <div className="hud-metric-chip">
                      <div className="hud-metric-label">Problems</div>
                      <div className="hud-metric-value critical">12</div>
                    </div>
                  </div>

                  <div className="hud-legend">
                    <div className="legend-item">
                      <div className="legend-dot operational"></div>
                      <span>Operational</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-dot maintenance"></div>
                      <span>Maintenance</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-dot critical"></div>
                      <span>Critical</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-dot warning"></div>
                      <span>Warning</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monitoring Statistics */}
          <div className="stats-grid">
            <div className="stat-panel">
              <div className="stat-panel-header">
                <div className="stat-icon-wrapper">📊</div>
                <div className="stat-panel-title">Analysis Processed</div>
              </div>
              <div className="stat-main-value">2,847</div>
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

            <div className="stat-panel">
              <div className="stat-panel-header">
                <div className="stat-icon-wrapper">🔍</div>
                <div className="stat-panel-title">Detections Found</div>
              </div>
              <div className="stat-main-value">47</div>
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
        </div>

        {/* Side Panel - Alerts & Defects */}
        <div className="side-panel">
          {/* Active Alerts */}
          <div className="industrial-panel">
            <div className="panel-header">
              <h2 className="panel-title">Active Alerts</h2>
              <div className="panel-badge">3 NEW</div>
            </div>
            <div className="panel-content">
              <div className="alerts-container">
                <div className="alert-card critical">
                  <div className="alert-header">
                    <span className="alert-type">Pressure Drop</span>
                    <span className="alert-severity">Critical</span>
                  </div>
                  <div className="alert-location">
                    <span>📍</span>
                    <span>Sector A-7, KM 125.3</span>
                  </div>
                  <div className="alert-description">
                    Pressure dropped 15 PSI below operational threshold. Immediate inspection required.
                  </div>
                  <div className="alert-footer">
                    <span className="alert-timestamp">02:15:34</span>
                    <button className="alert-action">Investigate</button>
                  </div>
                </div>

                <div className="alert-card warning">
                  <div className="alert-header">
                    <span className="alert-type">Flow Anomaly</span>
                    <span className="alert-severity">Warning</span>
                  </div>
                  <div className="alert-location">
                    <span>📍</span>
                    <span>Sector B-12, KM 89.7</span>
                  </div>
                  <div className="alert-description">
                    Flow rate decreased by 8% over the last 30 minutes. Monitor for changes.
                  </div>
                  <div className="alert-footer">
                    <span className="alert-timestamp">02:00:12</span>
                    <button className="alert-action">Monitor</button>
                  </div>
                </div>

                <div className="alert-card info">
                  <div className="alert-header">
                    <span className="alert-type">Maintenance Due</span>
                    <span className="alert-severity">Info</span>
                  </div>
                  <div className="alert-location">
                    <span>📍</span>
                    <span>Sector C-3, KM 234.1</span>
                  </div>
                  <div className="alert-description">
                    Quarterly valve inspection scheduled. Maintenance window available.
                  </div>
                  <div className="alert-footer">
                    <span className="alert-timestamp">01:45:22</span>
                    <button className="alert-action">Schedule</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detected Defects */}
          <div className="industrial-panel">
            <div className="panel-header">
              <h2 className="panel-title">Detected Defects</h2>
            </div>
            <div className="panel-content">
              <div className="defects-list">
                <div className="defect-item">
                  <div className="defect-header">
                    <span className="defect-type-badge critical">Corrosion</span>
                    <span className="defect-severity">High</span>
                  </div>
                  <div className="defect-details">
                    <span className="defect-location">Sector A-7, KM 125.3</span>
                    <span className="defect-date">2024-12-15</span>
                  </div>
                  <div className="defect-description">
                    Wall thickness reduced by 35% in elbow section. Immediate repair recommended.
                  </div>
                </div>

                <div className="defect-item">
                  <div className="defect-header">
                    <span className="defect-type-badge warning">Crack</span>
                    <span className="defect-severity">Medium</span>
                  </div>
                  <div className="defect-details">
                    <span className="defect-location">Sector B-12, KM 89.7</span>
                    <span className="defect-date">2024-12-14</span>
                  </div>
                  <div className="defect-description">
                    Longitudinal crack detected in weld seam. Schedule inspection.
                  </div>
                </div>

                <div className="defect-item">
                  <div className="defect-header">
                    <span className="defect-type-badge info">Dent</span>
                    <span className="defect-severity">Low</span>
                  </div>
                  <div className="defect-details">
                    <span className="defect-location">Sector C-3, KM 234.1</span>
                    <span className="defect-date">2024-12-13</span>
                  </div>
                  <div className="defect-description">
                    Minor dent with no wall thickness reduction. Monitor condition.
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

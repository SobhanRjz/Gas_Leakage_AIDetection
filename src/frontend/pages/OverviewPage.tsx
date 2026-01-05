import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ThemeContext } from '../components/Header'
import { getRiskLevel } from '../utils/detectionUtils'
import { detectionService, LeakageStatus, OverviewStats } from '../services/DetectionService'
import { useAuth } from '../services/AuthService'
import './OverviewPage.css'

// Convert backend LeakageStatus to frontend LeakageDetection format
interface LeakageDetection {
  controlSystem: {
    status: 'ok' | 'detected'
    detections: Array<{
      defectType: string
      sign: string
      source: string
      location: string
    }>
  }
  drone: {
    status: 'ok' | 'detected'
    detections: Array<{
      defectType: string
      sign: string
      source: string
      location: string
    }>
  }
  totalLeakages: number
}

const convertLeakageStatus = (backendStatus: LeakageStatus): LeakageDetection => {
  return {
    controlSystem: {
      status: backendStatus.control_system.status,
      detections: backendStatus.control_system.detections.map(d => ({
        defectType: d.defect_type,
        sign: d.sign,
        source: d.source,
        location: d.location
      }))
    },
    drone: {
      status: backendStatus.drone.status,
      detections: backendStatus.drone.detections.map(d => ({
        defectType: d.defect_type,
        sign: d.sign,
        source: d.source,
        location: d.location
      }))
    },
    totalLeakages: backendStatus.total_leakages
  }
}

/**
 * Map location names to SVG coordinates for pipeline visualization
 */
const getLeakCoordinates = (location: string): { x: number; y: number } => {
  const locationMap: { [key: string]: { x: number; y: number } } = {
    'Section A-B': { x: 250, y: 190 },
    'Section B-C': { x: 600, y: 185 },
    'Section C-D': { x: 650, y: 195 },
    'Branch Line': { x: 450, y: 280 },
    'Station Area': { x: 400, y: 200 },
    'Main Pipeline KM 12.5': { x: 350, y: 195 },
    'Main Pipeline KM 18.3': { x: 550, y: 188 }
  }
  return locationMap[location] || { x: 400, y: 200 }
}

/**
 * Get leak marker color based on defect type
 */
const getLeakColor = (defectType: string): string => {
  return getRiskLevel(defectType).color
}

/**
 * Industrial Pipeline Monitoring Dashboard
 * Professional UI for real-time pipeline surveillance and defect detection
 */
const OverviewPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isDarkTheme } = React.useContext(ThemeContext)
  const { authState } = useAuth()
  const [currentTime, setCurrentTime] = React.useState(new Date())
  const [leakageStatus, setLeakageStatus] = React.useState<LeakageDetection | null>(null)
  const [controlSystemStats, setControlSystemStats] = React.useState({ total: 145, critical: 0, warning: 15, normal: 130 })
  const [droneStats, setDroneStats] = React.useState({ total: 2847, videos: 1234, images: 1613 })
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch initial data
  const fetchOverviewData = async () => {
    // Check if user is authenticated
    if (!authState.isAuthenticated) {
      console.log('User not authenticated, redirecting to login...')
      navigate('/login')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const stats = await detectionService.getOverviewStats()
      
      setLeakageStatus(convertLeakageStatus(stats.leakage_status))
      setControlSystemStats(stats.control_system)
      setDroneStats(stats.drone)
    } catch (err) {
      console.error('Failed to fetch overview data:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data'
      
      // If unauthorized, redirect to login
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
        console.log('Unauthorized access, redirecting to login...')
        navigate('/login')
        return
      }
      
      setError(errorMessage)
      // Set default empty state on error
      setLeakageStatus({
        controlSystem: { status: 'ok', detections: [] },
        drone: { status: 'ok', detections: [] },
        totalLeakages: 0
      })
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    // Wait a bit for auth to initialize
    const timer = setTimeout(() => {
      fetchOverviewData()
    }, 100)
    return () => clearTimeout(timer)
  }, [authState.isAuthenticated, location.pathname]) // Re-fetch when pathname changes (user navigates to this page)

  // Update leakage status every 30 seconds
  React.useEffect(() => {
    const statusTimer = setInterval(() => {
      fetchOverviewData()
    }, 30000) // 30 seconds
    return () => clearInterval(statusTimer)
  }, [])

  // Manual refresh function
  const handleRefreshStatus = () => {
    fetchOverviewData()
  }

  // Simulate new detection (for testing)
  const handleSimulateDetection = async () => {
    try {
      const result = await detectionService.simulateDetection()
      console.log('Detection simulated:', result)
      // Refresh data after simulation
      fetchOverviewData()
    } catch (err) {
      console.error('Failed to simulate detection:', err)
    }
  }

  // Show loading state
  if (isLoading || !leakageStatus) {
    return (
      <div className={`overview-page ${isDarkTheme ? 'theme-dark' : 'theme-light'}`}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 20px' }}></div>
            <p>Loading overview data...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className={`overview-page ${isDarkTheme ? 'theme-dark' : 'theme-light'}`}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div style={{ textAlign: 'center', color: '#ff4757' }}>
            <p>⚠️ Error loading data</p>
            <p>{error}</p>
            <button onClick={handleRefreshStatus} style={{ marginTop: '20px' }}>Retry</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`overview-page ${isDarkTheme ? 'theme-dark' : 'theme-light'}`}>
      <div className="page-container">
        {/* Page Header */}
        <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Pipeline Monitoring Dashboard</h1>
          <p className="page-subtitle">Real-time surveillance and defect detection system</p>
        </div>
        <div className="header-right">
          <button className="quick-action-btn upload" onClick={() => navigate('/upload')}>
            📤 Upload Media
          </button>
        </div>
      </div>

      {/* System Status Bar */}
      <div className="system-status-bar">
        <div className="system-status-indicator">
          <div className="status-pulse"></div>
          <span className="system-status-text">Operational System</span>
        </div>
        <div className="system-metrics">
        </div>
        <div className="system-actions">
          <button className="action-btn" onClick={handleRefreshStatus}>
            Refresh Status
          </button>
          <button className="action-btn primary" onClick={() => navigate('/reports')}>
            Reports
          </button>
        </div>
      </div>

      {/* KPI Monitoring Panels */}
      <div className="kpi-grid">
        {/* Active Leaks */}
        <div className={`kpi-panel ${leakageStatus.totalLeakages > 0 ? 'critical' : 'success'}`}>
          <div className="kpi-header">
            <span className="kpi-icon">{leakageStatus.totalLeakages > 0 ? '⚠️' : '✓'}</span>
            <span className="kpi-status-badge">{leakageStatus.totalLeakages > 0 ? 'Critical' : 'Normal'}</span>
          </div>
          <div className="kpi-data">
            <div className="kpi-value-display">{leakageStatus.totalLeakages}</div>
            <div className="kpi-label-text">Active Leaks</div>
          </div>
        </div>

        {/* Detection Accuracy */}
        <div className="kpi-panel success">
          <div className="kpi-header">
            <span className="kpi-icon">🎯</span>
            <span className="kpi-status-badge">Normal</span>
          </div>
          <div className="kpi-data">
            <div className="kpi-value-display">98.5%</div>
            <div className="kpi-label-text">AI Accuracy</div>
          </div>
        </div>

        {/* Pipeline Pressure */}
        {/* <div className="kpi-panel warning">
          <div className="kpi-header">
            <span className="kpi-icon">⚡</span>
            <span className="kpi-status-badge">Normal</span>
          </div>
          <div className="kpi-data">
            <div className="kpi-value-display">45.2</div>
            <div className="kpi-label-text">Pressure (PSI)</div>
          </div>
        </div> */}

        {/* Flow Rate */}
        {/* <div className="kpi-panel operational">
          <div className="kpi-header">
            <span className="kpi-icon">💧</span>
            <span className="kpi-status-badge">Stable</span>
          </div>
          <div className="kpi-data">
            <div className="kpi-value-display">1,247</div>
            <div className="kpi-label-text">Flow (m³/h)</div>
          </div>
        </div> */}

        {/* Sensor Network */}
        <div className="kpi-panel maintenance">
          <div className="kpi-header">
            <span className="kpi-icon">📡</span>
            <span className="kpi-status-badge">Active</span>
          </div>
          <div className="kpi-data">
            <div className="kpi-value-display">156 / 160</div>
            <div className="kpi-label-text">Sensors Online</div>
          </div>
        </div>
      </div>

      {/* Current Detection Status - Two Main Boxes */}
      <div className="detection-status-grid">
        {/* Control System Detection Box */}
        <div className={`detection-status-box `}>
          <div className="detection-box-header">
            <div className="detection-box-icon">🎛️</div>
            <h3 className="detection-box-title">Control System Detection</h3>
            {leakageStatus.controlSystem.detections.length > 0 && (
              <>
                <span className="detection-count-badge">{leakageStatus.controlSystem.detections.length}</span>
                {(() => {
                  // Get highest risk level from all detections
                  const risks = leakageStatus.controlSystem.detections.map(d => getRiskLevel(d.defectType))
                  const hasCritical = risks.some(r => r.level === 'critical')
                  const hasWarning = risks.some(r => r.level === 'warning')
                  const highestRisk = hasCritical ? risks.find(r => r.level === 'critical') : hasWarning ? risks.find(r => r.level === 'warning') : risks[0]
                  return null // Not currently used in UI
                })()}
              </>
            )}
          </div>
          
          {leakageStatus.controlSystem.status === 'ok' ? (
            <div className="detection-status-content">
              <div className="status-indicator-large success">
                <div className="status-checkmark">✓</div>
                <div className="status-text">All Systems Normal</div>
              </div>
              <p className="status-description">No anomalies detected in control system data</p>
            </div>
          ) : (
            <div className="detection-status-content">
              <div className="status-indicator-large alert">
                <div className="status-alert-icon">⚠️</div>
                <div className="status-text">{leakageStatus.controlSystem.detections.length} Defect{leakageStatus.controlSystem.detections.length > 1 ? 's' : ''} Detected</div>
              </div>
              <div className="detection-details-list">
                {leakageStatus.controlSystem.detections.map((detection, index) => {
                  const riskInfo = getRiskLevel(detection.defectType)
                  return (
                    <div key={index} className="detection-details">
                      <div className="detection-number">Detection #{index + 1}</div>
                      <div className="detail-row">
                        <span className="detail-label">Risk Level:</span>
                        <span className={`detail-value risk-badge risk-${riskInfo.level}`}>
                          {riskInfo.icon} {riskInfo.label}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Location:</span>
                        <span className="detail-value location">{detection.location}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Defect Type:</span>
                        <span className="detail-value critical">{detection.defectType}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Sign:</span>
                        <span className="detail-value">{detection.sign}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Source:</span>
                        <span className="detail-value source-badge">{detection.source}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Drone Detection Box */}
        <div className={`detection-status-box`}>
          <div className="detection-box-header">
            <div className="detection-box-icon">🚁</div>
            <h3 className="detection-box-title">Drone Detection</h3>
            {leakageStatus.drone.detections.length > 0 && (
              <>
                <span className="detection-count-badge">{leakageStatus.drone.detections.length}</span>
                {(() => {
                  // Get highest risk level from all detections
                  const risks = leakageStatus.drone.detections.map(d => getRiskLevel(d.defectType))
                  const hasCritical = risks.some(r => r.level === 'critical')
                  const hasWarning = risks.some(r => r.level === 'warning')
                  const highestRisk = hasCritical ? risks.find(r => r.level === 'critical') : hasWarning ? risks.find(r => r.level === 'warning') : risks[0]
                  return null // Not currently used in UI
                })()}
              </>
            )}
          </div>
          
          {leakageStatus.drone.status === 'ok' ? (
            <div className="detection-status-content">
              <div className="status-indicator-large success">
                <div className="status-checkmark">✓</div>
                <div className="status-text">All Systems Normal</div>
              </div>
              <p className="status-description">No anomalies detected in drone surveillance data</p>
            </div>
          ) : (
            <div className="detection-status-content">
              <div className="status-indicator-large alert">
                <div className="status-alert-icon">⚠️</div>
                <div className="status-text">{leakageStatus.drone.detections.length} Defect{leakageStatus.drone.detections.length > 1 ? 's' : ''} Detected</div>
              </div>
              <div className="detection-details-list">
                {leakageStatus.drone.detections.map((detection, index) => {
                  const riskInfo = getRiskLevel(detection.defectType)
                  return (
                    <div key={index} className="detection-details">
                      <div className="detection-number">Detection #{index + 1}</div>
                      <div className="detail-row">
                        <span className="detail-label">Risk Level:</span>
                        <span className={`detail-value risk-badge risk-${riskInfo.level}`}>
                          {riskInfo.icon} {riskInfo.label}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Location:</span>
                        <span className="detail-value location">{detection.location}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Defect Type:</span>
                        <span className="detail-value critical">{detection.defectType}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Sign:</span>
                        <span className="detail-value">{detection.sign}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Source:</span>
                        <span className="detail-value source-badge">{detection.source}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Dashboard Layout */}
      <div className="dashboard-layout">
        {/* Main Panel - Pipeline Map and Alerts */}
        <div className="main-panel">
          {/* Pipeline Network Monitor */}
          <div className="industrial-panel">
            <div className="panel-header">
              <h2 className="panel-title">Pipeline Network Monitor</h2>
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

                      {/* Leak Glow - Multiple colors */}
                      <filter id="leakGlow">
                        <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#ff4757"/>
                      </filter>
                      <filter id="leakGlowWarning">
                        <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#ffa502"/>
                      </filter>
                      <filter id="leakGlowDanger">
                        <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#ff6348"/>
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

                      {/* Dynamic Leak Markers - Combined from both Control System and Drone */}
                      {(() => {
                        // Combine all unique leakages from both systems
                        const allLeakages = new Map<string, { defectType: string; location: string }>()
                        
                        // Add control system detections
                        leakageStatus.controlSystem.detections.forEach(detection => {
                          if (detection.location) {
                            allLeakages.set(detection.location, {
                              defectType: detection.defectType,
                              location: detection.location
                            })
                          }
                        })
                        
                        // Add drone detections (may overlap or be different)
                        leakageStatus.drone.detections.forEach(detection => {
                          if (detection.location) {
                            allLeakages.set(detection.location, {
                              defectType: detection.defectType,
                              location: detection.location
                            })
                          }
                        })
                        
                        // Render leak markers
                        return Array.from(allLeakages.values()).map((leak, index) => {
                          const coords = getLeakCoordinates(leak.location)
                          const color = getLeakColor(leak.defectType)
                          const isMajor = leak.defectType.includes('Major') || leak.defectType.includes('Sudden') || leak.defectType.includes('Mechanical')
                          const radius = isMajor ? 14 : 12
                          
                          return (
                            <g key={`leak-${index}`} className="leak-marker critical">
                              <circle cx={coords.x} cy={coords.y} r={radius} fill={color} opacity="0.2"/>
                              <circle cx={coords.x} cy={coords.y} r={radius * 0.7} fill={color} opacity="0.5"/>
                              <circle cx={coords.x} cy={coords.y} r={radius * 0.4} fill={color} filter="url(#leakGlow)"/>
                              <text x={coords.x} y={coords.y + radius + 14} textAnchor="middle" fontSize="8" fill={color} fontWeight="bold">
                                LEAK-{index + 1}
                              </text>
                            </g>
                          )
                        })
                      })()}
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
                      <div className="hud-metric-label">Leakage Problems</div>
                      <div className={`hud-metric-value ${leakageStatus.totalLeakages > 0 ? 'critical' : 'success'}`}>
                        {leakageStatus.totalLeakages}
                      </div>
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
                    {leakageStatus.totalLeakages > 0 && (
                      <div className="legend-item">
                        <div className="legend-dot critical"></div>
                        <span>Leak ({leakageStatus.totalLeakages})</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section - Statistics and Alerts */}
          <div className="main-panel-bottom">
            {/* Monitoring Statistics */}
            <div className="stats-grid">
              <div className="stat-panel">
                <div className="stat-panel-header">
                  <div className="stat-icon-wrapper">🔍</div>
                  <div className="stat-panel-title">Control System Data received</div>
                </div>
                <div className="stat-main-value">{controlSystemStats.total}</div>
                <div className="stat-breakdown">
                  <div className="breakdown-item">
                    <span className="breakdown-label">Critical</span>
                    <span className="breakdown-value">{controlSystemStats.critical}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Warning</span>
                    <span className="breakdown-value">{controlSystemStats.warning}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Normal</span>
                    <span className="breakdown-value">{controlSystemStats.normal}</span>
                  </div>
                </div>
              </div>
              <div className="stat-panel">
                <div className="stat-panel-header">
                  <div className="stat-icon-wrapper">📊</div>
                  <div className="stat-panel-title">Drone Data received</div>
                </div>
                <div className="stat-main-value">{droneStats.total.toLocaleString()}</div>
                <div className="stat-breakdown">
                  <div className="breakdown-item">
                    <span className="breakdown-label">Videos</span>
                    <span className="breakdown-value">{droneStats.videos.toLocaleString()}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Images</span>
                    <span className="breakdown-value">{droneStats.images.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Overall Pipeline Status - Comparison of Both Systems */}
              <div className="stat-panel">
                <div className="stat-panel-header">
                  <div className="stat-icon-wrapper">🔄</div>
                  <div className="stat-panel-title">Overall Pipeline Status</div>
                </div>
                <div className="stat-main-value" style={{
                  color: leakageStatus.controlSystem.status === 'detected' && leakageStatus.drone.status === 'detected' 
                    ? '#ff4757' 
                    : leakageStatus.controlSystem.status === 'detected' || leakageStatus.drone.status === 'detected'
                    ? '#ffa502'
                    : '#1dd1a1'
                }}>
                  {leakageStatus.controlSystem.status === 'detected' && leakageStatus.drone.status === 'detected' 
                    ? 'CRITICAL' 
                    : leakageStatus.controlSystem.status === 'detected' || leakageStatus.drone.status === 'detected'
                    ? 'ALERT'
                    : 'NORMAL'}
                </div>
                <div className="stat-breakdown">
                  <div className="breakdown-item">
                    <span className="breakdown-label">Control System</span>
                    <span className="breakdown-value" style={{
                      color: leakageStatus.controlSystem.status === 'detected' ? '#ff4757' : '#1dd1a1'
                    }}>
                      {leakageStatus.controlSystem.status === 'detected' ? 'DETECTED' : 'OK'}
                    </span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Drone System</span>
                    <span className="breakdown-value" style={{
                      color: leakageStatus.drone.status === 'detected' ? '#ff4757' : '#1dd1a1'
                    }}>
                      {leakageStatus.drone.status === 'detected' ? 'DETECTED' : 'OK'}
                    </span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Systems Agreement</span>
                    <span className="breakdown-value" style={{
                      color: leakageStatus.controlSystem.status === leakageStatus.drone.status ? '#1dd1a1' : '#ffa502'
                    }}>
                      {leakageStatus.controlSystem.status === leakageStatus.drone.status ? 'YES' : 'NO'}
                    </span>
                  </div>
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

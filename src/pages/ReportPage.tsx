import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ThemeContext } from '../components/Header'
import './ReportPage.css'

/**
 * Industrial Pipeline Reports Dashboard
 * Professional UI for generating and analyzing inspection reports
 */
const ReportPage: React.FC = () => {
  const navigate = useNavigate()
  const { isDarkTheme } = React.useContext(ThemeContext)
  const [reportType, setReportType] = useState('summary')
  const [dateRange, setDateRange] = useState('30days')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateReport = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
    }, 2000)
  }

  const handleDownloadReport = (format: string) => {
    console.log(`Downloading report in ${format} format`)
  }

  return (
    <div className={`report-page ${isDarkTheme ? 'theme-dark' : 'theme-light'}`}>
      {/* System Status Bar */}
      <div className="system-status-bar">
        <div className="system-status-indicator">
          <div className="status-pulse"></div>
          <span className="system-status-text">Report System Active</span>
        </div>
        <div className="system-metrics">
          <div className="metric-indicator">
            <span className="metric-label">Reports Generated</span>
            <span className="metric-value">847</span>
          </div>
          <div className="metric-indicator">
            <span className="metric-label">Data Sources</span>
            <span className="metric-value">12/12</span>
          </div>
          <div className="metric-indicator">
            <span className="metric-label">Last Export</span>
            <span className="metric-value">2h ago</span>
          </div>
        </div>
        <div className="system-actions">
          <button className="action-btn" onClick={() => navigate('/overview')}>
            Overview
          </button>
          <button className="action-btn primary" onClick={handleGenerateReport} disabled={isGenerating}>
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {/* Report Configuration Panel */}
      <div className="industrial-panel">
        <div className="panel-header">
          <h2 className="panel-title">Report Configuration</h2>
        </div>
        <div className="panel-content">
          <div className="config-grid">
            <div className="config-group">
              <label htmlFor="report-type" className="config-label">Report Type</label>
              <select
                id="report-type"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="config-select"
              >
                <option value="summary">Executive Summary</option>
                <option value="detailed">Technical Analysis</option>
                <option value="defects">Defects Registry</option>
                <option value="maintenance">Maintenance Schedule</option>
              </select>
            </div>

            <div className="config-group">
              <label htmlFor="date-range" className="config-label">Date Range</label>
              <select
                id="date-range"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="config-select"
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            <div className="config-group">
              <label className="config-label">Export Format</label>
              <div className="export-buttons">
                <button className="export-btn" onClick={() => handleDownloadReport('pdf')}>
                  📄 PDF
                </button>
                <button className="export-btn" onClick={() => handleDownloadReport('excel')}>
                  📊 Excel
                </button>
                <button className="export-btn" onClick={() => handleDownloadReport('csv')}>
                  📋 CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="report-content-layout">
        {/* Summary Report */}
        {reportType === 'summary' && (
          <>
            {/* Key Metrics */}
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon">📏</div>
                <div className="metric-data">
                  <div className="metric-value">2,450</div>
                  <div className="metric-label">Kilometers Inspected</div>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">⚠️</div>
                <div className="metric-data">
                  <div className="metric-value critical">47</div>
                  <div className="metric-label">Total Defects</div>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">💚</div>
                <div className="metric-data">
                  <div className="metric-value success">92%</div>
                  <div className="metric-label">Health Score</div>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">🔧</div>
                <div className="metric-data">
                  <div className="metric-value">23</div>
                  <div className="metric-label">Repairs Completed</div>
                </div>
              </div>
            </div>

            {/* Defects Analysis */}
            <div className="industrial-panel">
              <div className="panel-header">
                <h2 className="panel-title">Defects Distribution</h2>
              </div>
              <div className="panel-content">
                <div className="defect-bars">
                  <div className="defect-bar-item">
                    <div className="defect-bar-label">
                      <span className="defect-type">Corrosion</span>
                      <span className="defect-count">21</span>
                    </div>
                    <div className="defect-bar-track">
                      <div className="defect-bar-fill critical" style={{ width: '45%' }}></div>
                    </div>
                    <span className="defect-percentage">45%</span>
                  </div>
                  <div className="defect-bar-item">
                    <div className="defect-bar-label">
                      <span className="defect-type">Cracks</span>
                      <span className="defect-count">14</span>
                    </div>
                    <div className="defect-bar-track">
                      <div className="defect-bar-fill warning" style={{ width: '30%' }}></div>
                    </div>
                    <span className="defect-percentage">30%</span>
                  </div>
                  <div className="defect-bar-item">
                    <div className="defect-bar-label">
                      <span className="defect-type">Dents</span>
                      <span className="defect-count">9</span>
                    </div>
                    <div className="defect-bar-track">
                      <div className="defect-bar-fill info" style={{ width: '19%' }}></div>
                    </div>
                    <span className="defect-percentage">19%</span>
                  </div>
                  <div className="defect-bar-item">
                    <div className="defect-bar-label">
                      <span className="defect-type">Other</span>
                      <span className="defect-count">3</span>
                    </div>
                    <div className="defect-bar-track">
                      <div className="defect-bar-fill" style={{ width: '6%' }}></div>
                    </div>
                    <span className="defect-percentage">6%</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Defects Report */}
        {reportType === 'defects' && (
          <div className="industrial-panel">
            <div className="panel-header">
              <h2 className="panel-title">Defects Registry</h2>
              <div className="panel-badge">47 TOTAL</div>
            </div>
            <div className="panel-content">
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Type</th>
                      <th>Location</th>
                      <th>Severity</th>
                      <th>Detected</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span className="id-badge">DEF-001</span></td>
                      <td>Corrosion</td>
                      <td>Sector A-7, KM 125.3</td>
                      <td><span className="severity-badge critical">High</span></td>
                      <td>2024-12-15</td>
                      <td><span className="status-badge pending">Pending</span></td>
                    </tr>
                    <tr>
                      <td><span className="id-badge">DEF-002</span></td>
                      <td>Crack</td>
                      <td>Sector B-12, KM 89.7</td>
                      <td><span className="severity-badge warning">Medium</span></td>
                      <td>2024-12-14</td>
                      <td><span className="status-badge progress">In Progress</span></td>
                    </tr>
                    <tr>
                      <td><span className="id-badge">DEF-003</span></td>
                      <td>Dent</td>
                      <td>Sector C-3, KM 234.1</td>
                      <td><span className="severity-badge info">Low</span></td>
                      <td>2024-12-13</td>
                      <td><span className="status-badge resolved">Resolved</span></td>
                    </tr>
                    <tr>
                      <td><span className="id-badge">DEF-004</span></td>
                      <td>Corrosion</td>
                      <td>Sector A-9, KM 145.8</td>
                      <td><span className="severity-badge critical">High</span></td>
                      <td>2024-12-12</td>
                      <td><span className="status-badge pending">Pending</span></td>
                    </tr>
                    <tr>
                      <td><span className="id-badge">DEF-005</span></td>
                      <td>Leak</td>
                      <td>Sector B-5, KM 67.2</td>
                      <td><span className="severity-badge critical">Critical</span></td>
                      <td>2024-12-10</td>
                      <td><span className="status-badge progress">In Progress</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Report */}
        {reportType === 'detailed' && (
          <div className="detailed-grid">
            <div className="industrial-panel">
              <div className="panel-header">
                <h2 className="panel-title">Inspection Details</h2>
              </div>
              <div className="panel-content">
                <div className="detail-section">
                  <h4>Pipeline Coverage</h4>
                  <p>Complete inspection data across all monitored sectors with AI-powered defect detection and classification.</p>
                  <div className="detail-stats">
                    <div className="detail-stat">
                      <span className="detail-label">Total Segments</span>
                      <span className="detail-value">156</span>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Analyzed Images</span>
                      <span className="detail-value">2,847</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="industrial-panel">
              <div className="panel-header">
                <h2 className="panel-title">Defect Analysis</h2>
              </div>
              <div className="panel-content">
                <div className="detail-section">
                  <h4>Critical Findings</h4>
                  <p>Detailed breakdown of all detected anomalies categorized by severity and recommended action priority.</p>
                  <div className="detail-stats">
                    <div className="detail-stat">
                      <span className="detail-label">Critical</span>
                      <span className="detail-value critical">12</span>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Warning</span>
                      <span className="detail-value warning">35</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="industrial-panel">
              <div className="panel-header">
                <h2 className="panel-title">Recommendations</h2>
              </div>
              <div className="panel-content">
                <div className="detail-section">
                  <h4>Maintenance Actions</h4>
                  <p>Expert recommendations for maintenance procedures, repair schedules, and preventive measures.</p>
                  <div className="detail-stats">
                    <div className="detail-stat">
                      <span className="detail-label">Immediate</span>
                      <span className="detail-value">8</span>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Scheduled</span>
                      <span className="detail-value">15</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Maintenance Report */}
        {reportType === 'maintenance' && (
          <div className="industrial-panel">
            <div className="panel-header">
              <h2 className="panel-title">Maintenance Schedule</h2>
            </div>
            <div className="panel-content">
              <div className="maintenance-timeline">
                <div className="timeline-item">
                  <div className="timeline-marker upcoming"></div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <h4>Annual Integrity Assessment</h4>
                      <span className="timeline-date">2025-01-15</span>
                    </div>
                    <p>Complete pipeline integrity assessment with ultrasonic testing and visual inspection.</p>
                    <div className="timeline-meta">
                      <span className="timeline-tag">High Priority</span>
                      <span className="timeline-duration">5 days</span>
                    </div>
                  </div>
                </div>

                <div className="timeline-item">
                  <div className="timeline-marker upcoming"></div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <h4>Corrosion Monitoring</h4>
                      <span className="timeline-date">2025-02-01</span>
                    </div>
                    <p>Corrosion rate analysis in high-risk sectors with protective coating evaluation.</p>
                    <div className="timeline-meta">
                      <span className="timeline-tag">Medium Priority</span>
                      <span className="timeline-duration">3 days</span>
                    </div>
                  </div>
                </div>

                <div className="timeline-item">
                  <div className="timeline-marker completed"></div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <h4>Valve Maintenance</h4>
                      <span className="timeline-date">2024-12-10</span>
                    </div>
                    <p>Quarterly valve inspection and pressure test at all critical junctions.</p>
                    <div className="timeline-meta">
                      <span className="timeline-tag completed">Completed</span>
                      <span className="timeline-duration">2 days</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReportPage

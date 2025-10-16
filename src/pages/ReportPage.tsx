import React, { useState } from 'react'
import { useAuth } from '../services/AuthService'
import './ReportPage.css'

/**
 * Report page component for generating and viewing inspection reports
 */
const ReportPage: React.FC = () => {
  const { authState } = useAuth()
  const [reportType, setReportType] = useState('summary')
  const [dateRange, setDateRange] = useState('30days')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateReport = () => {
    setIsGenerating(true)
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false)
    }, 2000)
  }

  const handleDownloadReport = (format: string) => {
    // Simulate download
    console.log(`Downloading report in ${format} format`)
  }

  return (
    <div className="report-page">
      <div className="report-header">
        <h1>Inspection Reports</h1>
        <p>Generate and download detailed pipeline inspection reports</p>
      </div>

      <div className="report-controls">
        <div className="control-group">
          <label htmlFor="report-type">Report Type</label>
          <select
            id="report-type"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="report-select"
          >
            <option value="summary">Summary Report</option>
            <option value="detailed">Detailed Report</option>
            <option value="defects">Defects Report</option>
            <option value="maintenance">Maintenance Report</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="date-range">Date Range</label>
          <select
            id="date-range"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="report-select"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        <button
          className="generate-btn"
          onClick={handleGenerateReport}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      <div className="report-content">
        <div className="report-preview">
          <div className="preview-header">
            <h2>Report Preview</h2>
            <div className="download-options">
              <button
                className="download-btn pdf-btn"
                onClick={() => handleDownloadReport('pdf')}
              >
                Download PDF
              </button>
              <button
                className="download-btn excel-btn"
                onClick={() => handleDownloadReport('excel')}
              >
                Download Excel
              </button>
            </div>
          </div>

          <div className="preview-content">
            {reportType === 'summary' && (
              <div className="summary-report">
                <div className="report-section">
                  <h3>Inspection Summary</h3>
                  <div className="summary-stats">
                    <div className="stat-item">
                      <span className="stat-label">Total Kilometers Inspected</span>
                      <span className="stat-value">2,450 km</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Defects Detected</span>
                      <span className="stat-value">47</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Pipeline Health Score</span>
                      <span className="stat-value health-score">92%</span>
                    </div>
                  </div>
                </div>

                <div className="report-section">
                  <h3>Defects by Type</h3>
                  <div className="defects-chart">
                    <div className="chart-item">
                      <span className="chart-label">Corrosion</span>
                      <div className="chart-bar">
                        <div className="chart-fill" style={{ width: '45%' }}></div>
                      </div>
                      <span className="chart-value">21</span>
                    </div>
                    <div className="chart-item">
                      <span className="chart-label">Cracks</span>
                      <div className="chart-bar">
                        <div className="chart-fill" style={{ width: '30%' }}></div>
                      </div>
                      <span className="chart-value">14</span>
                    </div>
                    <div className="chart-item">
                      <span className="chart-label">Dents</span>
                      <div className="chart-bar">
                        <div className="chart-fill" style={{ width: '20%' }}></div>
                      </div>
                      <span className="chart-value">9</span>
                    </div>
                    <div className="chart-item">
                      <span className="chart-label">Other</span>
                      <div className="chart-bar">
                        <div className="chart-fill" style={{ width: '5%' }}></div>
                      </div>
                      <span className="chart-value">3</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {reportType === 'detailed' && (
              <div className="detailed-report">
                <p>Detailed inspection report with comprehensive analysis will be displayed here.</p>
                <div className="placeholder-content">
                  <div className="placeholder-item">
                    <h4>Inspection Details</h4>
                    <p>Complete pipeline inspection data and analysis</p>
                  </div>
                  <div className="placeholder-item">
                    <h4>Defect Analysis</h4>
                    <p>Detailed breakdown of all detected defects</p>
                  </div>
                  <div className="placeholder-item">
                    <h4>Recommendations</h4>
                    <p>Maintenance and repair recommendations</p>
                  </div>
                </div>
              </div>
            )}

            {reportType === 'defects' && (
              <div className="defects-report">
                <div className="report-table">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Type</th>
                        <th>Location</th>
                        <th>Severity</th>
                        <th>Detected Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>DEF-001</td>
                        <td>Corrosion</td>
                        <td>Sector A-7, KM 125.3</td>
                        <td><span className="severity high">High</span></td>
                        <td>Dec 15, 2024</td>
                        <td><span className="status pending">Pending</span></td>
                      </tr>
                      <tr>
                        <td>DEF-002</td>
                        <td>Crack</td>
                        <td>Sector B-12, KM 89.7</td>
                        <td><span className="severity medium">Medium</span></td>
                        <td>Dec 14, 2024</td>
                        <td><span className="status in-progress">In Progress</span></td>
                      </tr>
                      <tr>
                        <td>DEF-003</td>
                        <td>Dent</td>
                        <td>Sector C-3, KM 234.1</td>
                        <td><span className="severity low">Low</span></td>
                        <td>Dec 13, 2024</td>
                        <td><span className="status resolved">Resolved</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportType === 'maintenance' && (
              <div className="maintenance-report">
                <p>Maintenance schedule and recommendations report will be displayed here.</p>
                <div className="maintenance-schedule">
                  <h4>Upcoming Maintenance</h4>
                  <div className="schedule-item">
                    <div className="schedule-info">
                      <h5>Annual Inspection</h5>
                      <p>Complete pipeline integrity assessment</p>
                    </div>
                    <span className="schedule-date">Jan 15, 2025</span>
                  </div>
                  <div className="schedule-item">
                    <div className="schedule-info">
                      <h5>Corrosion Monitoring</h5>
                      <p>Check corrosion rates in high-risk areas</p>
                    </div>
                    <span className="schedule-date">Feb 1, 2025</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportPage

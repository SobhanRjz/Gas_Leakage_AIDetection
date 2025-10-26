import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ThemeContext } from '../components/Header'
import { ChevronDown, Pin, Check, Share2, Database, Plane } from 'lucide-react'
import './ReportPage.css'

interface AccordionState {
  control: boolean;
  drone: boolean;
  defects: boolean;
  maintenance: boolean;
}

interface ReportAccordionProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  trend: { bars: number[]; label: string };
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const ReportAccordion: React.FC<ReportAccordionProps> = ({
  title,
  icon,
  count,
  trend,
  isExpanded,
  onToggle,
  children
}) => {
  return (
    <div className="accordion-section">
      <button
        className="accordion-header"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`${title.toLowerCase().replace(/\s+/g, '-')}-content`}
      >
        <div className="accordion-header-left">
          <div className="accordion-header-icon">
            {icon}
          </div>
          <div className="accordion-header-title">{title}</div>
        </div>
        <div className="accordion-header-info">
          <span className="accordion-count">{count} {count === 1 ? 'alert' : 'alerts'}</span>
          <div className="accordion-trend">
            <div className="trend-sparkline">
              {trend.bars.map((bar, index) => (
                <div
                  key={index}
                  className={`trend-bar ${bar > 0 ? 'up' : bar < 0 ? 'down' : ''}`}
                  style={{ height: `${Math.abs(bar) * 4 + 4}px` }}
                />
              ))}
            </div>
            <span>{trend.label}</span>
          </div>
          <div className={`accordion-toggle ${isExpanded ? 'open' : ''}`}>
            <ChevronDown size={16} />
          </div>
        </div>
      </button>
      {isExpanded && (
        <div className={`accordion-content ${isExpanded ? 'open' : ''}`} id={`${title.toLowerCase().replace(/\s+/g, '-')}-content`}>
          <div className="accordion-items">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Industrial Pipeline Reports Dashboard
 * Professional UI for generating and analyzing inspection reports
 */
const ReportPage: React.FC = () => {
  const navigate = useNavigate()
  const { isDarkTheme } = React.useContext(ThemeContext)
  const [reportType, setReportType] = useState('control')
  const [dateRange, setDateRange] = useState('30days')
  const [isGenerating, setIsGenerating] = useState(false)
  const [accordionState, setAccordionState] = useState<AccordionState>({
    control: true,
    drone: false,
    defects: false,
    maintenance: false
  })
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectedAccordionItems, setSelectedAccordionItems] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [exportFormat, setExportFormat] = useState('pdf')
  const [activeFilters, setActiveFilters] = useState<string[]>(['All Severity'])
  const [toast, setToast] = useState<{ show: boolean; type: 'success' | 'error'; message: string; actions?: string[] } | null>(null)
  const [progress, setProgress] = useState(0)
  const [legendExpanded, setLegendExpanded] = useState(false)
  const [sortBy, setSortBy] = useState('severity-desc')

  // State management for loading, empty, and error states
  const [isLoading, setIsLoading] = useState(false)
  const [isEmpty, setIsEmpty] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mock data for demonstration - in real app this would come from API
  const mockData = {
    control: isEmpty ? [] : [
      // Major/Sudden Leak
      { id: 'control-1', text: 'High pressure drop detected in Sector A-7, KM 125.3. PT sensor reading: 15 PSI below operational threshold. Immediate inspection required.', sensor: 'pt', time: '02:15:34', location: 'Sector A-7', confidence: 95 },
      { id: 'control-2', text: 'Imbalance mass flow detected in Sector B-12, KM 89.7. FT sensor indicates 12% mass imbalance over 45 minutes. Critical leak suspected.', sensor: 'ft', time: '02:00:12', location: 'Sector B-12', confidence: 92 },
      // Minor/Gradual Leak
      { id: 'control-3', text: 'Small, persistent deviation in mass balance in Sector C-3, KM 234.1. FT sensor shows 3% cumulative deviation over 24 hours. Gradual leak pattern.', sensor: 'ft', time: '01:45:23', location: 'Sector C-3', confidence: 76 },
      { id: 'control-4', text: 'Slow pressure decline detected in Sector D-5, KM 67.8. PT sensor indicates 2 PSI drop over 6 hours. Monitor for escalation.', sensor: 'pt', time: '03:22:14', location: 'Sector D-5', confidence: 68 },
      // Corrosion & Erosion
      { id: 'control-5', text: 'Decrease in pressure detected in Sector E-9, KM 145.2. PT sensor reading: 8 PSI below baseline. Possible corrosion or erosion.', sensor: 'pt', time: '04:11:37', location: 'Sector E-9', confidence: 71 },
      // Insulation/Coating Failure
      { id: 'control-6', text: 'Increased heat loss detected in Sector F-2, KM 89.5. TT sensor indicates 15°F temperature differential. Insulation failure suspected.', sensor: 'tt', time: '02:33:48', location: 'Sector F-2', confidence: 83 },
      // Poor Pipe Support
      { id: 'control-7', text: 'Unusual vibrations detected in Sector A-3, KM 234.7. Seismometer sensor reading: 0.8g acceleration. Pipe support failure indicated.', sensor: 'seismometer', time: '01:18:56', location: 'Sector A-3', confidence: 79 }
    ],
    drone: isEmpty ? [] : [
      // Major/Sudden Leak
      { id: 'drone-1', text: 'Direct visual sighting of spill in Sector A-7, KM 125.3. Visible spectrum camera detected liquid spill at pipeline section. Ground team dispatched.', sensor: 'visible', time: '02:18:45', location: 'Sector A-7', confidence: 98 },
      { id: 'drone-2', text: 'Detection of gas cloud in Sector B-12, KM 89.7. Spectroscopic sensor indicates hydrocarbon leak. Concentration levels elevated.', sensor: 'spectroscopic', time: '02:05:33', location: 'Sector B-12', confidence: 82 },
      { id: 'drone-3', text: 'Distinct thermal anomaly on the ground in Sector C-3, KM 234.1. Thermal imaging camera detected ground thermal signature.', sensor: 'thermal', time: '01:52:17', location: 'Sector C-3', confidence: 71 },
      // Minor/Gradual Leak
      { id: 'drone-4', text: 'Gradual discoloration detected in Sector D-5, KM 67.8. Visible spectrum camera identified soil staining pattern indicating slow leak.', sensor: 'visible', time: '03:12:22', location: 'Sector D-5', confidence: 87 },
      { id: 'drone-5', text: 'Consistently elevated gas concentration at specific point in Sector E-9, KM 145.2. Spectroscopic sensor monitoring shows persistent readings.', sensor: 'spectroscopic', time: '03:08:41', location: 'Sector E-9', confidence: 76 },
      { id: 'drone-6', text: 'Long-term changes in soil temperature in Sector F-2, KM 89.5. Thermal imaging camera detected gradual warming pattern over 48 hours.', sensor: 'thermal', time: '02:45:33', location: 'Sector F-2', confidence: 68 },
      // Corrosion & Erosion
      { id: 'drone-7', text: 'Visual signs of rust and coating damage in Sector A-3, KM 234.7. Visible spectrum camera identified corrosion on exposed pipe section.', sensor: 'visible', time: '01:28:15', location: 'Sector A-3', confidence: 91 },
      // Mechanical Damage
      { id: 'drone-8', text: 'Clear identification of damage: dents detected in Sector B-8, KM 156.3. Visible spectrum camera captured mechanical deformation on pipeline.', sensor: 'visible', time: '00:55:42', location: 'Sector B-8', confidence: 94 },
      // Insulation/Coating Failure
      { id: 'drone-9', text: 'Detection of insulation failures in Sector C-7, KM 78.9. Visible spectrum camera identified damaged coating and exposed insulation.', sensor: 'visible', time: '04:17:28', location: 'Sector C-7', confidence: 89 },
      { id: 'drone-10', text: 'Hot spots detected along the pipe in Sector D-1, KM 112.4. Thermal imaging camera identified temperature anomalies indicating insulation failure.', sensor: 'thermal', time: '03:33:19', location: 'Sector D-1', confidence: 73 },
      // Poor Pipe Support
      { id: 'drone-11', text: 'Visual identification of loose pipe supports in Sector E-4, KM 198.6. Visible spectrum camera detected shifted and broken support structures.', sensor: 'visible', time: '02:29:07', location: 'Sector E-4', confidence: 85 },
      { id: 'drone-12', text: 'Identification of soil erosion under the pipe in Sector F-6, KM 167.8. Visible spectrum camera captured subsidence and soil movement.', sensor: 'visible', time: '01:14:53', location: 'Sector F-6', confidence: 79 }
    ]
  }

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const toggleAccordion = (section: keyof AccordionState) => {
    setAccordionState(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    )
  }

  const handleExportFormatChange = (format: string) => {
    setExportFormat(format)
  }

  const selectAllItems = () => {
    // Implementation for selecting all items
  }

  const markReviewed = () => {
    // Implementation for marking items as reviewed
  }

  const exportSelection = () => {
    // Implementation for exporting selected items
  }

  const toggleAccordionItemSelection = (itemId: string) => {
    setSelectedAccordionItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleGenerateReport = () => {
    setIsGenerating(true)
    setProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
      setIsGenerating(false)
          setProgress(0)

          // Show success toast
          setToast({
            show: true,
            type: 'success',
            message: 'Report generated successfully',
            actions: ['Open', 'Download']
          })

          // Hide toast after 5 seconds
          setTimeout(() => setToast(null), 5000)

          return 0
        }
        return prev + Math.random() * 15
      })
    }, 200)
  }

  const closeToast = () => {
    setToast(null)
  }

  const handleToastAction = (action: string) => {
    console.log(`Toast action: ${action}`)
    closeToast()
  }

  const handleDownloadReport = (format: string) => {
    console.log(`Downloading report in ${format} format`)
  }

  const clearAllFilters = () => {
    setActiveFilters(['All Severity'])
    setSearchTerm('')
    setDateRange('30days')
    // Reset to show data
    setIsEmpty(false)
    setError(null)
    console.log('All filters cleared')
  }

  // Helper function to render accordion items from data
  const renderAccordionItems = (items: any[]) => {
    if (items.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-title">No data for this period</div>
          <div className="empty-state-description">
            Try widening the date range or clearing filters to see more results.
          </div>
          <div className="empty-state-actions">
            <button className="empty-state-btn" onClick={clearAllFilters}>
              Clear all filters
            </button>
          </div>
        </div>
      );
    }

    return items.map((item) => (
      <div
        key={item.id}
        className={`accordion-item ${selectedAccordionItems.includes(item.id) ? 'selected' : ''}`}
        onClick={() => toggleAccordionItemSelection(item.id)}
      >
        <div className="item-main">
          <div className="sign-text">{item.text}</div>
          <div className="source-badge">
            <span className={`sensor-badge ${item.sensor === 'pt' ? 'pressure' : item.sensor === 'ft' ? 'flow' : item.sensor === 'tt' ? 'temp' : ''}`} data-type={item.sensor}>
              {item.sensor.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="item-meta">
          <div className="meta-left">
            <span className="last-seen">🕒 {item.time}</span>
          </div>
          <div className="meta-right">
            <span className="region-asset">{item.location}</span>
          </div>
        </div>
        <div className="item-actions">
          <button className="item-action-btn" onClick={(e) => { e.stopPropagation(); console.log('Pin item'); }} aria-label="Pin this item">
            <Pin size={14} />
          </button>
          <button className="item-action-btn" onClick={(e) => { e.stopPropagation(); console.log('Mark reviewed'); }} aria-label="Mark reviewed">
            <Check size={14} />
          </button>
          <button className="item-action-btn" onClick={(e) => { e.stopPropagation(); console.log('Share link'); }} aria-label="Share link">
            <Share2 size={14} />
          </button>
        </div>
      </div>
    ));
  };

  // Dynamic content renderer - render only selected report type
  const renderReportContent = () => {
    return (
      <div className="accordion-container">
        {reportType === 'control' && (
          <ReportAccordion
            title="Control System Data"
            icon={<Database className="text-brand" size={18} />}
            count={mockData.control.length}
            trend={{ bars: [1, 1, -1, 1], label: "Last 30d" }}
            isExpanded={accordionState.control}
            onToggle={() => toggleAccordion('control')}
          >
            {renderAccordionItems(mockData.control)}
          </ReportAccordion>
        )}

        {reportType === 'drone' && (
          <ReportAccordion
            title="Drone Data"
            icon={<Plane className="text-brand" size={18} />}
            count={mockData.drone.length}
            trend={{ bars: [1, 1, 1, -1], label: "Last 30d" }}
            isExpanded={accordionState.drone}
            onToggle={() => toggleAccordion('drone')}
          >
            {renderAccordionItems(mockData.drone)}
          </ReportAccordion>
        )}

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
    );
  }

  return (
    <div className={`report-page ${isDarkTheme ? 'theme-dark' : 'theme-light'}`}>
      {/* Header Layer */}
      <header className="report-sticky-header">
        <div className="report-header-content">
          <h1 id="main-heading" className="report-page-title">Reports</h1>
          <div className="report-header-actions">
            <button className="action-btn secondary" onClick={() => navigate('/overview')}>
              Overview
            </button>
            <button
              className="action-btn primary"
              onClick={handleGenerateReport}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <span>
                  Generating
                  <div className="generate-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
                    <span className="progress-text">{Math.round(progress)}%</span>
          </div>
                </span>
              ) : (
                'Generate'
              )}
            </button>
        </div>
      </div>

      {/* System Status Bar */}
      <div className="report-system-bar">
        <div className="system-status-chips">
            <button className="system-chip health-ok clickable" onClick={() => console.log('System Status')} aria-label="View system status">
            Active
            </button>
            <button className="system-chip clickable" onClick={() => console.log('Reports Log')} aria-label="View reports log">
            847 Reports
            </button>
            <button className="system-chip health-ok clickable" onClick={() => console.log('Sources Status')} aria-label="View sources status">
            12/12 Sources
            </button>
            <button className="system-chip clickable" onClick={() => console.log('Export History')} aria-label="View export history">
            Last export: 2h
            </button>
            <button className="system-chip health-ok clickable" onClick={() => console.log('Health Check')} aria-label="View health check">
            Health: OK
            </button>
        </div>
      </div>
      </header>

      {/* Content Wrapper Layer */}
      <div className="report-content-wrapper">
        {/* Sidebar Layer */}
        <aside className="report-config-sidebar">
      <div className="industrial-panel">
        <div className="panel-header">
          <h2 className="panel-title">Report Configuration</h2>
        </div>
        <div className="panel-content">
          <div className="config-grid">
                <div className="config-section">
                  <div className="config-section-title">Report Type</div>
                  <select
                    id="report-type"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="enhanced-select"
                  >
                    <option value="control">Control System Data</option>
                    <option value="drone">Drone Data</option>
                    <option value="defects">Defects Registry</option>
                    <option value="maintenance">Maintenance Schedule</option>
                  </select>
                </div>

                <div className="config-section">
                  <div className="config-section-title">Date Range</div>
                  <select
                    id="date-range"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="enhanced-select"
                  >
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="90days">Last 90 Days</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                <div className="config-section">
                  <div className="config-section-title">Filters</div>
                  <div className="filter-tags">
                    {['All Severity', 'Major', 'Minor', 'PT', 'FT', 'Region A'].map(filter => (
                      <button
                        key={filter}
                        className={`filter-tag ${activeFilters.includes(filter) ? 'active' : ''}`}
                        onClick={() => toggleFilter(filter)}
                        aria-pressed={activeFilters.includes(filter)}
                        aria-label={`Toggle ${filter} filter`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                  <div className="search-input-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      placeholder="Search defects..."
                      className="search-input"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="config-section">
                  <div className="config-section-title">Export</div>
                  <div className="segmented-control">
                    {[
                      { key: 'pdf', icon: '📄', label: 'PDF' },
                      { key: 'excel', icon: '📊', label: 'Excel' },
                      { key: 'csv', icon: '📋', label: 'CSV' }
                    ].map(format => (
                      <button
                        key={format.key}
                        className={`segmented-option ${exportFormat === format.key ? 'active' : ''}`}
                        onClick={() => handleExportFormatChange(format.key)}
                        aria-pressed={exportFormat === format.key}
                      >
                        <span className="icon">{format.icon}</span> {format.label}
                      </button>
                    ))}
                  </div>
                  <button
                    className="action-btn primary export-download-btn"
                    onClick={() => handleDownloadReport(exportFormat)}
                  >
                    Download
                  </button>
                </div>

                <div className="config-section">
                  <div className="config-section-title">Settings</div>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      id="auto-refresh"
                      className="toggle-input"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                    />
                    <label htmlFor="auto-refresh" className="toggle-label"></label>
                    <span className="toggle-text">Auto-refresh every 15 min</span>
                  </div>
                  <button className="timezone-pill" onClick={() => console.log('Open timezone selector')} aria-label="Select timezone (currently UTC-5)">
                    🌍 UTC-5
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main View Layer */}
        <main className="report-main-view">
          {/* Sensor Legend */}
          <div className="sensor-legend">
            <div className="legend-header">
              <div className="legend-title">
                <span>📊</span>
                Legend • Sensor Types
              </div>
              <button
                className={`legend-toggle ${legendExpanded ? 'expanded' : ''}`}
                onClick={() => setLegendExpanded(!legendExpanded)}
                aria-label="Toggle sensor legend"
                aria-expanded={legendExpanded}
              >
                <ChevronDown size={14} />
              </button>
            </div>
            {legendExpanded && (
              <div className="legend-badges">
                <span className="sensor-badge" data-type="pt">PT</span>
                <span className="sensor-badge" data-type="ft">FT</span>
                <span className="sensor-badge" data-type="tt">TT</span>
                <span className="sensor-badge" data-type="seismometer">Seismo</span>
                <span className="sensor-badge" data-type="visible">Visible</span>
                <span className="sensor-badge" data-type="spectroscopic">Spectro</span>
                <span className="sensor-badge" data-type="thermal">Thermal</span>
              </div>
            )}
          </div>

          {/* Unified Toolbar */}
          <div className="unified-toolbar">
            <div className="toolbar-left">
              <span className="summary-text">
                {selectedItems.length > 0 ? `${selectedItems.length} selected` : 'Showing 256 items'}
              </span>
              <div className="filter-chips">
                <button
                  className={`filter-chip severity-major ${activeFilters.includes('Major') ? 'active' : ''}`}
                  onClick={() => toggleFilter('Major')}
                  disabled={selectedItems.length > 0}
                  aria-pressed={activeFilters.includes('Major')}
                  aria-label="Toggle Major severity filter"
                >
                  Major (12)
                </button>
                <button
                  className={`filter-chip severity-minor ${activeFilters.includes('Minor') ? 'active' : ''}`}
                  onClick={() => toggleFilter('Minor')}
                  disabled={selectedItems.length > 0}
                  aria-pressed={activeFilters.includes('Minor')}
                  aria-label="Toggle Minor severity filter"
                >
                  Minor (45)
                </button>
                <button
                  className={`filter-chip severity-info ${activeFilters.includes('Corrosion') ? 'active' : ''}`}
                  onClick={() => toggleFilter('Corrosion')}
                  disabled={selectedItems.length > 0}
                  aria-pressed={activeFilters.includes('Corrosion')}
                  aria-label="Toggle Corrosion filter"
                >
                  Corrosion (20)
                </button>
              </div>
            </div>
            <div className="toolbar-right">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
                disabled={selectedItems.length > 0}
              >
                <option value="severity-desc">Sort by: Severity desc</option>
                <option value="severity-asc">Sort by: Severity asc</option>
                <option value="date-desc">Sort by: Date desc</option>
                <option value="date-asc">Sort by: Date asc</option>
              </select>
              <button
                className="toolbar-action-btn"
                onClick={selectAllItems}
                disabled={selectedItems.length === 0 && false}
                aria-label="Select all items"
              >
                Select All
              </button>
              <button
                className="toolbar-action-btn"
                onClick={markReviewed}
                disabled={selectedItems.length === 0}
                aria-label="Mark selected items as reviewed"
              >
                Mark Reviewed
              </button>
              <button
                className="toolbar-action-btn"
                onClick={exportSelection}
                disabled={selectedItems.length === 0}
                aria-label="Export selected items"
              >
                Export Selection
              </button>
                <button
                className="toolbar-action-btn"
                onClick={() => setIsEmpty(!isEmpty)}
                aria-label="Toggle empty state"
              >
                {isEmpty ? 'Show Data' : 'Show Empty'}
                </button>
                        </div>
                      </div>

          {/* Dynamic Report Content */}
          <div className="report-content">
            {renderReportContent()}
                          </div>
        </main>
      </div>

      {/* Toast Notifications */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.show ? 'show' : ''} ${toast.type}`}>
            <div className="toast-content">
              {toast.message}
            </div>
            {toast.actions && (
              <div className="toast-actions">
                {toast.actions.map(action => (
                  <button
                    key={action}
                    className="toast-btn"
                    onClick={() => handleToastAction(action)}
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}
            <button className="toast-close" onClick={closeToast} aria-label="Close notification">
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReportPage

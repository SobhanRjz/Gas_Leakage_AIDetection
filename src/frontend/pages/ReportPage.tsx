import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ThemeContext } from '../components/Header'
import { ChevronDown, Pin, Check, Share2, MessageCircle } from 'lucide-react'
import DefectChatbot from '../components/DefectChatbot'
import { getRiskLevel, MAX_DEFECT_REGISTRY_SIZE } from '../utils/detectionUtils'
import { detectionService, DetectionEvent } from '../services/DetectionService'
import { useAuth } from '../services/AuthService'
import './ReportPage.css'

// Convert backend DetectionEvent to frontend DefectRegistryItem
interface DefectRegistryItem {
  id: string
  defectType: string
  location: string
  riskLevel: 'critical' | 'warning' | 'low'
  riskLabel: string
  riskIcon: string
  detectedDate: string
  lastDetected?: string
  status: 'pending' | 'progress' | 'resolved'
  controlSystemSign: string
  controlSystemSource: string
  droneSign: string
  droneSource: string
  aiConfidence: number
}

const convertDetectionEvent = (event: DetectionEvent): DefectRegistryItem => {
  const riskInfo = getRiskLevel(event.defect_type)
  return {
    id: event.id,
    defectType: event.defect_type,
    location: event.location,
    riskLevel: event.risk_level,
    riskLabel: riskInfo.label,
    riskIcon: riskInfo.icon,
    detectedDate: event.detected_date,
    lastDetected: event.last_detected,
    status: event.status,
    controlSystemSign: event.control_system_sign,
    controlSystemSource: event.control_system_source,
    droneSign: event.drone_sign,
    droneSource: event.drone_source,
    aiConfidence: event.ai_confidence
  }
}

interface AccordionState {
  defects: boolean;
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
  const location = useLocation()
  const { isDarkTheme } = React.useContext(ThemeContext)
  const { authState } = useAuth()
  const [dateRange, setDateRange] = useState('30days')
  const [isGenerating, setIsGenerating] = useState(false)
  const [accordionState, setAccordionState] = useState<AccordionState>({
    defects: true
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
  const [sortBy, setSortBy] = useState('date-desc') // Default to most recently detected first

  // State management for loading, empty, and error states
  const [isLoading, setIsLoading] = useState(false)
  const [isEmpty, setIsEmpty] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Chatbot state
  const [activeChatbot, setActiveChatbot] = useState<{
    id: string;
    type: string;
    location: string;
    severity: string;
    controlSystemSign: string;
    droneSign: string;
  } | null>(null)

  // Defect Registry State - Persistent list that grows with new detections (max 15)
  const [defectRegistry, setDefectRegistry] = useState<DefectRegistryItem[]>([])
  const [sortedDefectRegistry, setSortedDefectRegistry] = useState<DefectRegistryItem[]>([])

  // Fetch detection events from backend
  const fetchDetectionEvents = async () => {
    // Check if user is authenticated
    if (!authState.isAuthenticated) {
      console.log('User not authenticated, redirecting to login...')
      navigate('/login')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const events = await detectionService.getDetectionEvents(MAX_DEFECT_REGISTRY_SIZE)
      const convertedEvents = events.map(convertDetectionEvent)
      setDefectRegistry(convertedEvents)
      setIsEmpty(convertedEvents.length === 0)
    } catch (err) {
      console.error('Failed to fetch detection events:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch detection events'
      
      // If unauthorized, redirect to login
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
        console.log('Unauthorized access, redirecting to login...')
        navigate('/login')
        return
      }
      
      setError(errorMessage)
      setDefectRegistry([])
      setIsEmpty(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Initialize defect registry on mount and whenever user navigates to this page
  useEffect(() => {
    // Wait a bit for auth to initialize
    const timer = setTimeout(() => {
      fetchDetectionEvents()
    }, 100)
    return () => clearTimeout(timer)
  }, [authState.isAuthenticated, location.pathname]) // Re-fetch when pathname changes (user navigates to this page)

  // Auto-refresh if enabled - periodically fetch new detections
  useEffect(() => {
    if (autoRefresh) {
      const refreshInterval = setInterval(fetchDetectionEvents, 15 * 60 * 1000) // 15 minutes
      return () => clearInterval(refreshInterval)
    }
  }, [autoRefresh])

  // Sort defect registry based on sortBy state
  // Uses lastDetected timestamp (when system found defect) for date-based sorting
  useEffect(() => {
    const sorted = [...defectRegistry]

    // Helper to get sort timestamp - uses lastDetected if available, otherwise detectedDate
    const getSortTimestamp = (item: DefectRegistryItem): number => {
      if (item.lastDetected) {
        return new Date(item.lastDetected).getTime()
      }
      return new Date(item.detectedDate).getTime()
    }

    switch (sortBy) {
      case 'severity-desc':
        // Critical > Warning > Low, then by lastDetected/date (newest first)
        sorted.sort((a, b) => {
          const riskOrder = { critical: 0, warning: 1, low: 2 }
          const riskDiff = riskOrder[a.riskLevel] - riskOrder[b.riskLevel]
          if (riskDiff !== 0) return riskDiff
          return getSortTimestamp(b) - getSortTimestamp(a)
        })
        break
      case 'severity-asc':
        // Low > Warning > Critical, then by lastDetected/date (newest first)
        sorted.sort((a, b) => {
          const riskOrder = { critical: 2, warning: 1, low: 0 }
          const riskDiff = riskOrder[a.riskLevel] - riskOrder[b.riskLevel]
          if (riskDiff !== 0) return riskDiff
          return getSortTimestamp(b) - getSortTimestamp(a)
        })
        break
      case 'date-desc':
        // Sort by lastDetected first (most recently detected by system comes first)
        // This ensures defects just found appear at top of the table
        sorted.sort((a, b) => {
          // If both have lastDetected, sort by lastDetected (most recent first)
          if (a.lastDetected && b.lastDetected) {
            return new Date(b.lastDetected).getTime() - new Date(a.lastDetected).getTime()
          }
          // If only a has lastDetected, a comes first (recently detected)
          if (a.lastDetected && !b.lastDetected) {
            return -1
          }
          // If only b has lastDetected, b comes first
          if (!a.lastDetected && b.lastDetected) {
            return 1
          }
          // Neither has lastDetected, sort by detectedDate (most recent first)
          return new Date(b.detectedDate).getTime() - new Date(a.detectedDate).getTime()
        })
        break
      case 'date-asc':
        sorted.sort((a, b) => getSortTimestamp(a) - getSortTimestamp(b))
        break
      case 'confidence-desc':
        sorted.sort((a, b) => {
          const confidenceDiff = b.aiConfidence - a.aiConfidence
          if (confidenceDiff !== 0) return confidenceDiff
          return getSortTimestamp(b) - getSortTimestamp(a)
        })
        break
      case 'confidence-asc':
        sorted.sort((a, b) => {
          const confidenceDiff = a.aiConfidence - b.aiConfidence
          if (confidenceDiff !== 0) return confidenceDiff
          return getSortTimestamp(b) - getSortTimestamp(a)
        })
        break
      default:
        break
    }

    setSortedDefectRegistry(sorted)
  }, [defectRegistry, sortBy])

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

  const handleStatusChange = async (defectId: string, newStatus: 'pending' | 'progress' | 'resolved') => {
    try {
      // Call API to update status
      await detectionService.updateDetectionStatus(defectId, newStatus)

      // Update local state
      setDefectRegistry(prevRegistry =>
        prevRegistry.map(defect =>
          defect.id === defectId
            ? { ...defect, status: newStatus }
            : defect
        )
      )

      // Show success toast
      setToast({
        show: true,
        type: 'success',
        message: 'Status updated successfully',
        actions: []
      })

      // Hide toast after 3 seconds
      setTimeout(() => setToast(null), 3000)

    } catch (error) {
      console.error('Failed to update status:', error)

      // Show error toast
      setToast({
        show: true,
        type: 'error',
        message: 'Failed to update status. Please try again.',
        actions: []
      })

      // Hide toast after 5 seconds
      setTimeout(() => setToast(null), 5000)
    }
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

  // Dynamic content renderer - renders Defect Registry
  const renderReportContent = () => {
    return (
      <div className="accordion-container">
        <div className="industrial-panel">
          <div className="panel-header">
            <h2 className="panel-title">Defect Registry</h2>
              <div className="panel-header-info">
                <span className="info-badge new-badge">
                  {sortedDefectRegistry.filter(d => d.lastDetected !== undefined).length} Just Detected
                </span>
                <span className="info-badge">
                  {sortedDefectRegistry.length} / {MAX_DEFECT_REGISTRY_SIZE} Defects
                </span>
              </div>
            </div>
            <div className="panel-content">
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Type</th>
                      <th>Location</th>
                      <th>Risk Level</th>
                      <th>AI Confidence</th>
                      <th>Detected</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDefectRegistry.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                          <div className="empty-state">
                            <div className="empty-state-icon">✓</div>
                            <div className="empty-state-title">No Confirmed Defects</div>
                            <div className="empty-state-description">
                              No defects detected by both Control System and Drone surveillance.
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      sortedDefectRegistry.map((defect) => {
                        // Check if defect was just detected by system (has lastDetected timestamp)
                        const isJustDetected = defect.lastDetected !== undefined
                        // Check if defect was detected recently (within last 7 days)
                        const isRecent = isJustDetected || (new Date().getTime() - new Date(defect.detectedDate).getTime()) < (7 * 24 * 60 * 60 * 1000)
                        return (
                        <tr key={defect.id} className={`${isRecent ? 'recent-detection' : ''}`}>
                          <td>
                            <div className="defect-type-cell">
                              <div className="defect-type-name">{defect.defectType}</div>
                              <div className="defect-sources">
                                <span className="source-mini" title={`Control System: ${defect.controlSystemSource}`}>
                                  🎛️ {defect.controlSystemSource}
                                </span>
                                <span className="source-mini" title={`Drone: ${defect.droneSource}`}>
                                  🚁 {defect.droneSource}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>{defect.location}</td>
                          <td>
                            <span className={`severity-badge ${defect.riskLevel}`}>
                              {defect.riskIcon} {defect.riskLabel}
                            </span>
                          </td>
                          <td>
                            <div className="confidence-cell">
                              <div className="confidence-bar-container">
                                <div 
                                  className="confidence-bar-fill" 
                                  style={{ width: `${defect.aiConfidence}%` }}
                                ></div>
                              </div>
                              <span className="confidence-value">{defect.aiConfidence}%</span>
                            </div>
                          </td>
                          <td>
                            <div className="date-cell">
                              <span className="detected-date">{defect.detectedDate}</span>
                              {isJustDetected && (
                                <span className="last-detected-time" title="System detection time">
                                  {new Date(defect.lastDetected!).toLocaleTimeString()}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <select
                              className={`status-select ${defect.status}`}
                              value={defect.status}
                              onChange={(e) => handleStatusChange(defect.id, e.target.value as 'pending' | 'progress' | 'resolved')}
                              title="Change defect status"
                            >
                              <option value="pending">Pending</option>
                              <option value="progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                            </select>
                          </td>
                          <td>
                            <button
                              className="chatbot-action-btn"
                              onClick={() => setActiveChatbot({ 
                                id: defect.id, 
                                type: defect.defectType, 
                                location: defect.location, 
                                severity: defect.riskLabel,
                                controlSystemSign: defect.controlSystemSign,
                                droneSign: defect.droneSign
                              })}
                              aria-label="Get AI recommendations for this defect"
                              title="Get AI recommendations"
                            >
                              <MessageCircle size={16} />
                            </button>
                          </td>
                        </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
      </div>
    );
  }

  return (
    <div className={`report-page ${isDarkTheme ? 'theme-dark' : 'theme-light'}`}>
      {/* Header Layer */}
      <header className="report-sticky-header">
        <div className="report-header-content">
          <h1 id="main-heading" className="report-page-title">Defect Registry</h1>
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
      <div className="page-container">
        <div className="report-content-wrapper">

        {/* Main View Layer */}
        <main className="report-main-view">
          {/* Report Configuration Panel - Moved to top */}
          <div className="industrial-panel report-config-panel">
            <div className="panel-header">
              <h2 className="panel-title">Report Configuration</h2>
            </div>
            <div className="panel-content">
              <div className="config-grid">

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
                    {['All Severity', 'Critical', 'Warning', 'PT', 'FT', 'Region A'].map(filter => (
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

          {/* Sensor Legend */}
          <div className="sensor-legend">
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
          <div className="report-content">
            {renderReportContent()}
          </div>
        </main>
        </div>
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

      {/* Defect Chatbot */}
      {activeChatbot && (
        <DefectChatbot
          defectId={activeChatbot.id}
          defectType={activeChatbot.type}
          location={activeChatbot.location}
          severity={activeChatbot.severity}
          controlSystemSign={activeChatbot.controlSystemSign}
          droneSign={activeChatbot.droneSign}
          onClose={() => setActiveChatbot(null)}
        />
      )}
    </div>
  )
}

export default ReportPage

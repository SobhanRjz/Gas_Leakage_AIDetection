import React, { useState, useRef, useCallback } from 'react'
import { ThemeContext } from '../components/Header'
import './UploadPage.css'

interface Detection {
  type: string;
  confidence: number;
  location: string;
  severity: 'critical' | 'warning' | 'info';
}

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video';
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  progress: number;
  detections?: Detection[];
}

/**
 * Upload page for AI-powered pipeline analysis
 */
const UploadPage: React.FC = () => {
  const { isDarkTheme } = React.useContext(ThemeContext)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return

    const newFiles: UploadedFile[] = Array.from(files)
      .filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'))
      .map(file => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith('image/') ? 'image' : 'video',
        status: 'pending',
        progress: 0
      }))

    setUploadedFiles(prev => [...prev, ...newFiles])
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const generateFakeDetections = (): Detection[] => {
    const detections: Detection[] = [
      {
        type: 'Gas Leak',
        confidence: 94.5,
        location: 'Section A-7, KM 125.3',
        severity: 'critical'
      },
      {
        type: 'Corrosion',
        confidence: 87.2,
        location: 'Section B-12, KM 89.7',
        severity: 'warning'
      }
    ]
    return detections
  }

  const handleAnalyze = useCallback((id: string) => {
    setUploadedFiles(prev => prev.map(f => 
      f.id === id ? { ...f, status: 'analyzing', progress: 0 } : f
    ))

    const interval = setInterval(() => {
      setUploadedFiles(prev => prev.map(f => {
        if (f.id === id && f.status === 'analyzing') {
          const newProgress = Math.min(f.progress + 10, 100)
          if (newProgress === 100) {
            clearInterval(interval)
            return { ...f, progress: 100, status: 'completed', detections: generateFakeDetections() }
          }
          return { ...f, progress: newProgress }
        }
        return f
      }))
    }, 500)
  }, [])

  const handleRemove = useCallback((id: string) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file) URL.revokeObjectURL(file.preview)
      return prev.filter(f => f.id !== id)
    })
  }, [])

  const handleClear = useCallback(() => {
    uploadedFiles.forEach(f => URL.revokeObjectURL(f.preview))
    setUploadedFiles([])
  }, [uploadedFiles])

  const stats = {
    total: uploadedFiles.length,
    analyzing: uploadedFiles.filter(f => f.status === 'analyzing').length,
    completed: uploadedFiles.filter(f => f.status === 'completed').length,
    pending: uploadedFiles.filter(f => f.status === 'pending').length
  }

  return (
    <div className={`upload-page ${isDarkTheme ? 'theme-dark' : 'theme-light'}`}>
      <div className="page-container">
        <div className="upload-header">
        <div className="header-content">
          <h1 className="page-title">AI Analysis Upload</h1>
          <p className="page-subtitle">Upload images and videos for deep learning pipeline defect detection</p>
        </div>
        <div className="header-stats">
          <div className="stat-chip">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-chip analyzing">
            <span className="stat-value">{stats.analyzing}</span>
            <span className="stat-label">Analyzing</span>
          </div>
          <div className="stat-chip completed">
            <span className="stat-value">{stats.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
      </div>

      <div className="upload-container">
        <div
          className={`dropzone ${isDragging ? 'dragging' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            style={{ display: 'none' }}
          />
          <div className="dropzone-icon">📤</div>
          <h3 className="dropzone-title">Drop files here or click to browse</h3>
          <p className="dropzone-subtitle">Support for images (JPG, PNG, WEBP) and videos (MP4, MOV, AVI)</p>
          <button className="browse-btn" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}>
            Select Files
          </button>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="files-section">
            <div className="files-header">
              <h2 className="section-title">Uploaded Files ({uploadedFiles.length})</h2>
              <button className="clear-btn" onClick={handleClear}>Clear All</button>
            </div>

            <div className="files-grid">
              {uploadedFiles.map(file => (
                <div key={file.id} className={`file-card ${file.status}`}>
                  <div className="file-preview">
                    {file.type === 'image' ? (
                      <img src={file.preview} alt={file.file.name} />
                    ) : (
                      <video src={file.preview} />
                    )}
                    <div className="file-overlay">
                      <span className="file-type-badge">{file.type}</span>
                    </div>
                  </div>

                  <div className="file-info">
                    <h4 className="file-name">{file.file.name}</h4>
                    <p className="file-size">{(file.file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>

                  {file.status === 'analyzing' && (
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${file.progress}%` }}></div>
                    </div>
                  )}

                  {file.status === 'completed' && file.detections && (
                    <div className="detections-panel">
                      <div className="detections-header">
                        <span className="detections-count">🔍 {file.detections.length} Detections Found</span>
                      </div>
                      {file.detections.map((detection, idx) => (
                        <div key={idx} className={`detection-item ${detection.severity}`}>
                          <div className="detection-main">
                            <span className="detection-type">{detection.type}</span>
                            <span className="detection-confidence">{detection.confidence}%</span>
                          </div>
                          <div className="detection-location">📍 {detection.location}</div>
                          <div className="detection-severity-badge">{detection.severity}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="file-actions">
                    {file.status === 'pending' && (
                      <button className="action-btn analyze" onClick={() => handleAnalyze(file.id)}>
                        Analyze
                      </button>
                    )}
                    {file.status === 'analyzing' && (
                      <span className="status-text">Analyzing... {file.progress}%</span>
                    )}
                    {file.status === 'completed' && (
                      <span className="status-text success">✓ Complete</span>
                    )}
                    <button className="action-btn remove" onClick={() => handleRemove(file.id)}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Template Section - Defect Examples */}
        <div className="template-section">
          <div className="template-header">
            <h2 className="section-title">Detection Examples</h2>
            <p className="section-subtitle">See what types of defects our AI can identify</p>
          </div>

          <div className="template-grid">
            <div className="template-card">
              <div className="template-image-wrapper">
                <div className="template-image">
                  <div className="template-placeholder">
                    <span className="template-text">Sample Image</span>
                  </div>
                  <div className="template-badge critical">
                    <span className="badge-icon">⚠️</span>
                    <span className="badge-text">High Risk</span>
                  </div>
                </div>
              </div>
              <div className="template-info">
                <div className="template-icon-header">
                  <div className="template-icon gas-leak">💨</div>
                  <h4 className="template-title">Gas Leak Detection</h4>
                </div>
                <p className="template-description">Identifies visible gas emissions, vapor clouds, and pressure anomalies in pipeline infrastructure</p>
                <div className="template-features">
                  <span className="feature-tag">Real-time Detection</span>
                  <span className="feature-tag">98.5% Accuracy</span>
                </div>
              </div>
            </div>

            <div className="template-card">
              <div className="template-image-wrapper">
                <div className="template-image">
                  <div className="template-placeholder">
                    <span className="template-text">Sample Image</span>
                  </div>
                  <div className="template-badge warning">
                    <span className="badge-icon">⚡</span>
                    <span className="badge-text">Medium Risk</span>
                  </div>
                </div>
              </div>
              <div className="template-info">
                <div className="template-icon-header">
                  <div className="template-icon corrosion">🏭</div>
                  <h4 className="template-title">Corrosion Analysis</h4>
                </div>
                <p className="template-description">Detects rust, metal degradation, and structural wear on pipeline surfaces and joints</p>
                <div className="template-features">
                  <span className="feature-tag">Deep Learning</span>
                  <span className="feature-tag">Multi-angle</span>
                </div>
              </div>
            </div>

            <div className="template-card">
              <div className="template-image-wrapper">
                <div className="template-image">
                  <div className="template-placeholder">
                    <span className="template-text">Sample Image</span>
                  </div>
                  <div className="template-badge critical">
                    <span className="badge-icon">⚠️</span>
                    <span className="badge-text">High Risk</span>
                  </div>
                </div>
              </div>
              <div className="template-info">
                <div className="template-icon-header">
                  <div className="template-icon crack">⚡</div>
                  <h4 className="template-title">Structural Cracks</h4>
                </div>
                <p className="template-description">Identifies fractures, weld failures, and mechanical damage in critical infrastructure</p>
                <div className="template-features">
                  <span className="feature-tag">Precision Scan</span>
                  <span className="feature-tag">Micro-defect</span>
                </div>
              </div>
            </div>

            <div className="template-card">
              <div className="template-image-wrapper">
                <div className="template-image">
                  <div className="template-placeholder">
                    <span className="template-text">Sample Image</span>
                  </div>
                  <div className="template-badge info">
                    <span className="badge-icon">🔧</span>
                    <span className="badge-text">Low Risk</span>
                  </div>
                </div>
              </div>
              <div className="template-info">
                <div className="template-icon-header">
                  <div className="template-icon equipment">🔧</div>
                  <h4 className="template-title">Equipment Issues</h4>
                </div>
                <p className="template-description">Detects valve problems, sensor failures, and equipment malfunctions across systems</p>
                <div className="template-features">
                  <span className="feature-tag">IoT Integrated</span>
                  <span className="feature-tag">Predictive</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="info-section">
          <div className="info-card">
            <div className="info-icon">🤖</div>
            <h3 className="info-title">AI-Powered Analysis</h3>
            <p className="info-text">Our deep learning models detect pipeline defects, leaks, corrosion, and anomalies with 98.5% accuracy</p>
          </div>
          <div className="info-card">
            <div className="info-icon">⚡</div>
            <h3 className="info-title">Fast Processing</h3>
            <p className="info-text">Advanced neural networks analyze your media in real-time for immediate insights</p>
          </div>
          <div className="info-card">
            <div className="info-icon">🔒</div>
            <h3 className="info-title">Secure & Private</h3>
            <p className="info-text">Your data is encrypted and processed securely with enterprise-grade security protocols</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default UploadPage


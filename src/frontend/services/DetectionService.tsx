/**
 * Detection Service
 * Handles API calls for detection data, control system, and drone data
 */

const API_BASE_URL = '/api/detection'

export interface LeakageStatus {
  control_system: {
    status: 'ok' | 'detected'
    detections: Array<{
      defect_type: string
      sign: string
      source: string
      location: string
    }>
  }
  drone: {
    status: 'ok' | 'detected'
    detections: Array<{
      defect_type: string
      sign: string
      source: string
      location: string
    }>
  }
  total_leakages: number
}

export interface ControlSystemSummary {
  total: number
  critical: number
  warning: number
  normal: number
}

export interface DroneSummary {
  total: number
  videos: number
  images: number
}

export interface DetectionEvent {
  id: string
  defect_type: string
  location: string
  risk_level: 'critical' | 'warning' | 'low'
  detected_date: string
  last_detected: string
  status: 'pending' | 'progress' | 'resolved'
  control_system_sign: string
  control_system_source: string
  drone_sign: string
  drone_source: string
  ai_confidence: number
}

export interface OverviewStats {
  leakage_status: LeakageStatus
  control_system: ControlSystemSummary
  drone: DroneSummary
}

class DetectionService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token')
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  }

  /**
   * Get current leakage detection status
   */
  async getLeakageStatus(): Promise<LeakageStatus> {
    const response = await fetch(`${API_BASE_URL}/leakage-status`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch leakage status: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get control system data summary
   */
  async getControlSystemSummary(): Promise<ControlSystemSummary> {
    const response = await fetch(`${API_BASE_URL}/control-system/summary`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch control system summary: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      total: data.total,
      critical: data.critical,
      warning: data.warning,
      normal: data.normal
    }
  }

  /**
   * Get drone data summary
   */
  async getDroneSummary(): Promise<DroneSummary> {
    const response = await fetch(`${API_BASE_URL}/drone/summary`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch drone summary: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      total: data.total,
      videos: data.videos,
      images: data.images
    }
  }

  /**
   * Get recent detection events (defect registry)
   */
  async getDetectionEvents(limit: number = 15): Promise<DetectionEvent[]> {
    const response = await fetch(`${API_BASE_URL}/events?limit=${limit}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch detection events: ${response.statusText}`)
    }

    const data = await response.json()
    return data.events
  }

  /**
   * Get all overview statistics in one call
   */
  async getOverviewStats(): Promise<OverviewStats> {
    const response = await fetch(`${API_BASE_URL}/overview-stats`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch overview stats: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Regenerate sample data
   */
  async regenerateData(controlSystemCount: number = 145, droneCount: number = 2847): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/regenerate-data?control_system_count=${controlSystemCount}&drone_count=${droneCount}`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to regenerate data: ${response.statusText}`)
    }
  }

  /**
   * Simulate a new detection event (for testing)
   */
  async simulateDetection(): Promise<{ message: string; events_created: number }> {
    const response = await fetch(`${API_BASE_URL}/simulate-detection`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to simulate detection: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Export control system data as CSV
   */
  async exportControlSystemCSV(): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/export/control-system`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to export control system CSV: ${response.statusText}`)
    }

    const data = await response.json()
    return data.filename
  }

  /**
   * Export drone data as CSV
   */
  async exportDroneCSV(): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/export/drone`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to export drone CSV: ${response.statusText}`)
    }

    const data = await response.json()
    return data.filename
  }

  /**
   * Update detection event status
   */
  async updateDetectionStatus(id: string, status: 'pending' | 'progress' | 'resolved'): Promise<DetectionEvent> {
    const response = await fetch(`${API_BASE_URL}/events/${id}/status`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status })
    })

    if (!response.ok) {
      throw new Error(`Failed to update detection status: ${response.statusText}`)
    }

    return response.json()
  }
}

// Export singleton instance
export const detectionService = new DetectionService()


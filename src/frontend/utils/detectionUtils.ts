/**
 * Shared Detection Utilities
 * Used by both OverviewPage and ReportPage
 */

export interface DefectDetection {
  defectType: string
  sign: string
  source: string
  location?: string
}

export interface LeakageDetection {
  controlSystem: {
    status: 'ok' | 'detected'
    detections: DefectDetection[]
  }
  drone: {
    status: 'ok' | 'detected'
    detections: DefectDetection[]
  }
  totalLeakages: number
}

export interface DefectRegistryItem {
  id: string
  defectType: string
  location: string
  riskLevel: 'critical' | 'warning' | 'low'
  riskLabel: string
  riskIcon: string
  detectedDate: string
  lastDetected?: string  // ISO timestamp of when this defect was last detected by systems
  status: 'pending' | 'progress' | 'resolved'
  controlSystemSign: string
  controlSystemSource: string
  droneSign: string
  droneSource: string
  aiConfidence: number
}

/**
 * Get risk level based on defect type
 */
export const getRiskLevel = (defectType: string): { 
  level: 'critical' | 'warning' | 'low'
  label: string
  icon: string
  color: string
  action: string
} => {
  const riskMap: { [key: string]: { 
    level: 'critical' | 'warning' | 'low'
    label: string
    icon: string
    color: string
    action: string
  } } = {
    'Major/Sudden Leak': { 
      level: 'critical', 
      label: 'Critical', 
      icon: '🔴', 
      color: '#ff4757',
      action: 'Immediate shutdown & emergency response'
    },
    'Mechanical Damage': { 
      level: 'critical', 
      label: 'Critical', 
      icon: '🔴', 
      color: '#ff4757',
      action: 'Immediate preventive action'
    },
    'Minor/Gradual Leak': { 
      level: 'warning', 
      label: 'Medium', 
      icon: '🟠', 
      color: '#ffa502',
      action: 'Enhanced monitoring, repair planning'
    },
    'Poor Pipe Support': { 
      level: 'warning', 
      label: 'Medium', 
      icon: '🟠', 
      color: '#ffa502',
      action: 'Structural intervention'
    },
    'Corrosion & Erosion': { 
      level: 'low', 
      label: 'Low', 
      icon: '🟢', 
      color: '#1dd1a1',
      action: 'Scheduled maintenance'
    },
    'Insulation/Coating Failure': { 
      level: 'low', 
      label: 'Low', 
      icon: '🟢', 
      color: '#1dd1a1',
      action: 'Preventive maintenance'
    }
  }
  
  return riskMap[defectType] || { 
    level: 'warning', 
    label: 'Unknown', 
    icon: '⚠️', 
    color: '#ffa502',
    action: 'Assessment required'
  }
}

/**
 * Define possible defect scenarios
 */
export const defectScenarios = [
  {
    type: 'Major/Sudden Leak',
    controlSystem: [
      { sign: 'High pressure drop', source: 'PT' },
      { sign: 'Imbalance mass flow', source: 'FT' }
    ],
    drone: [
      { sign: 'Direct visual sighting of spill', source: 'Visible spectrum camera' },
      { sign: 'Detection of gas cloud', source: 'Spectroscopic sensor' },
      { sign: 'Distinct thermal anomaly on the ground', source: 'Thermal imaging camera' }
    ]
  },
  {
    type: 'Minor/Gradual Leak',
    controlSystem: [
      { sign: 'Small, persistent deviation in mass balance', source: 'FT' },
      { sign: 'Slow pressure decline', source: 'PT' }
    ],
    drone: [
      { sign: 'Gradual discoloration', source: 'Visible spectrum camera' },
      { sign: 'Consistently elevated gas concentration at a specific point', source: 'Spectroscopic sensor' },
      { sign: 'Long-term changes in soil temperature', source: 'Thermal imaging camera' }
    ]
  },
  {
    type: 'Corrosion & Erosion',
    controlSystem: [
      { sign: 'Decrease in pressure', source: 'PT' }
    ],
    drone: [
      { sign: 'Visual signs of rust, coating damage, or corrosion on exposed pipe', source: 'Visible spectrum camera' }
    ]
  },
  {
    type: 'Mechanical Damage',
    controlSystem: [],
    drone: [
      { sign: 'Clear identification of damage: Dents, cracks', source: 'Visible spectrum camera' },
      { sign: 'Detection of unauthorized activities (excavation, construction)', source: 'Visible spectrum camera' }
    ]
  },
  {
    type: 'Insulation/Coating Failure',
    controlSystem: [
      { sign: 'Increased heat loss', source: 'TT' }
    ],
    drone: [
      { sign: 'Detection of insulation failures', source: 'Visible spectrum camera' },
      { sign: 'Hot or cold spots along the pipe', source: 'Thermal imaging camera' }
    ]
  },
  {
    type: 'Poor Pipe Support',
    controlSystem: [
      { sign: 'Unusual vibrations', source: 'Seismometer' }
    ],
    drone: [
      { sign: 'Visual identification of loose, shifted, or broken pipe supports', source: 'Visible spectrum camera' },
      { sign: 'Identification of soil erosion or subsidence under the pipe', source: 'Visible spectrum camera' }
    ]
  }
]

/**
 * Generate random leakage status
 * When detecting issues, both Control System and Drone detect the SAME defect(s)
 * to ensure synchronized detection between systems
 */
export const generateLeakageStatus = (): LeakageDetection => {
  // 50% chance of being OK, 50% chance of having issues
  const hasIssue = Math.random() > 0.2
  
  if (!hasIssue) {
    return {
      controlSystem: { status: 'ok', detections: [] },
      drone: { status: 'ok', detections: [] },
      totalLeakages: 0
    }
  }

  const locations = ['Section A-B', 'Section B-C', 'Section C-D', 'Branch Line', 'Station Area', 'Main Pipeline KM 12.5', 'Main Pipeline KM 18.3']

  // Determine number of leakages (1-3)
  const numLeakages = Math.floor(Math.random() * 3) + 1

  const controlSystemDetections: DefectDetection[] = []
  const droneDetections: DefectDetection[] = []

  // Generate multiple leakages - BOTH systems detect the SAME defect(s)
  for (let i = 0; i < numLeakages; i++) {
    // Only select defects that have both control system AND drone signatures
    const defectsWithBothSystems = defectScenarios.filter(
      d => d.controlSystem.length > 0 && d.drone.length > 0
    )
    const selectedDefect = defectsWithBothSystems[Math.floor(Math.random() * defectsWithBothSystems.length)]
    const location = locations[Math.floor(Math.random() * locations.length)]
    
    // BOTH systems detect this defect (synchronized detection)
    const controlSystemSignature = selectedDefect.controlSystem[Math.floor(Math.random() * selectedDefect.controlSystem.length)]
    const droneSignature = selectedDefect.drone[Math.floor(Math.random() * selectedDefect.drone.length)]

    controlSystemDetections.push({
      defectType: selectedDefect.type,
      sign: controlSystemSignature.sign,
      source: controlSystemSignature.source,
      location: location
    })

    droneDetections.push({
      defectType: selectedDefect.type,
      sign: droneSignature.sign,
      source: droneSignature.source,
      location: location
    })
  }

  return {
    controlSystem: {
      status: controlSystemDetections.length > 0 ? 'detected' : 'ok',
      detections: controlSystemDetections
    },
    drone: {
      status: droneDetections.length > 0 ? 'detected' : 'ok',
      detections: droneDetections
    },
    totalLeakages: numLeakages
  }
}

/**
 * Static defect registry - These items never disappear
 * They represent all possible defects that could be detected
 */
export const getStaticDefectRegistry = (): DefectRegistryItem[] => {
  const staticDefects: DefectRegistryItem[] = [
    // Major/Sudden Leak defects
    {
      id: 'DEF-001',
      defectType: 'Major/Sudden Leak',
      location: 'Section A-B',
      riskLevel: 'critical',
      riskLabel: 'Critical',
      riskIcon: '🔴',
      detectedDate: '2024-11-15',
      status: 'resolved',
      controlSystemSign: 'High pressure drop',
      controlSystemSource: 'PT',
      droneSign: 'Direct visual sighting of spill',
      droneSource: 'Visible spectrum camera',
      aiConfidence: 92
    },
    {
      id: 'DEF-002',
      defectType: 'Major/Sudden Leak',
      location: 'Main Pipeline KM 12.5',
      riskLevel: 'critical',
      riskLabel: 'Critical',
      riskIcon: '🔴',
      detectedDate: '2024-10-22',
      status: 'resolved',
      controlSystemSign: 'Imbalance mass flow',
      controlSystemSource: 'FT',
      droneSign: 'Detection of gas cloud',
      droneSource: 'Spectroscopic sensor',
      aiConfidence: 89
    },
    // Mechanical Damage defects
    {
      id: 'DEF-003',
      defectType: 'Mechanical Damage',
      location: 'Section B-C',
      riskLevel: 'critical',
      riskLabel: 'Critical',
      riskIcon: '🔴',
      detectedDate: '2024-09-18',
      status: 'resolved',
      controlSystemSign: 'N/A',
      controlSystemSource: 'N/A',
      droneSign: 'Clear identification of damage: Dents, cracks',
      droneSource: 'Visible spectrum camera',
      aiConfidence: 87
    },
    {
      id: 'DEF-004',
      defectType: 'Mechanical Damage',
      location: 'Branch Line',
      riskLevel: 'critical',
      riskLabel: 'Critical',
      riskIcon: '🔴',
      detectedDate: '2024-08-05',
      status: 'resolved',
      controlSystemSign: 'N/A',
      controlSystemSource: 'N/A',
      droneSign: 'Detection of unauthorized activities (excavation, construction)',
      droneSource: 'Visible spectrum camera',
      aiConfidence: 85
    },
    // Minor/Gradual Leak defects
    {
      id: 'DEF-005',
      defectType: 'Minor/Gradual Leak',
      location: 'Section C-D',
      riskLevel: 'warning',
      riskLabel: 'Medium',
      riskIcon: '🟠',
      detectedDate: '2024-07-12',
      status: 'resolved',
      controlSystemSign: 'Small, persistent deviation in mass balance',
      controlSystemSource: 'FT',
      droneSign: 'Gradual discoloration',
      droneSource: 'Visible spectrum camera',
      aiConfidence: 91
    },
    {
      id: 'DEF-006',
      defectType: 'Minor/Gradual Leak',
      location: 'Main Pipeline KM 18.3',
      riskLevel: 'warning',
      riskLabel: 'Medium',
      riskIcon: '🟠',
      detectedDate: '2024-06-28',
      status: 'resolved',
      controlSystemSign: 'Slow pressure decline',
      controlSystemSource: 'PT',
      droneSign: 'Consistently elevated gas concentration at a specific point',
      droneSource: 'Spectroscopic sensor',
      aiConfidence: 88
    },
    // Poor Pipe Support defects
    {
      id: 'DEF-007',
      defectType: 'Poor Pipe Support',
      location: 'Station Area',
      riskLevel: 'warning',
      riskLabel: 'Medium',
      riskIcon: '🟠',
      detectedDate: '2024-05-14',
      status: 'resolved',
      controlSystemSign: 'Unusual vibrations',
      controlSystemSource: 'Seismometer',
      droneSign: 'Visual identification of loose, shifted, or broken pipe supports',
      droneSource: 'Visible spectrum camera',
      aiConfidence: 86
    },
    {
      id: 'DEF-008',
      defectType: 'Poor Pipe Support',
      location: 'Section A-B',
      riskLevel: 'warning',
      riskLabel: 'Medium',
      riskIcon: '🟠',
      detectedDate: '2024-04-20',
      status: 'resolved',
      controlSystemSign: 'Unusual vibrations',
      controlSystemSource: 'Seismometer',
      droneSign: 'Identification of soil erosion or subsidence under the pipe',
      droneSource: 'Visible spectrum camera',
      aiConfidence: 84
    },
    // Corrosion & Erosion defects
    {
      id: 'DEF-009',
      defectType: 'Corrosion & Erosion',
      location: 'Section B-C',
      riskLevel: 'low',
      riskLabel: 'Low',
      riskIcon: '🟢',
      detectedDate: '2024-03-08',
      status: 'resolved',
      controlSystemSign: 'Decrease in pressure',
      controlSystemSource: 'PT',
      droneSign: 'Visual signs of rust, coating damage, or corrosion on exposed pipe',
      droneSource: 'Visible spectrum camera',
      aiConfidence: 90
    },
    {
      id: 'DEF-010',
      defectType: 'Corrosion & Erosion',
      location: 'Main Pipeline KM 12.5',
      riskLevel: 'low',
      riskLabel: 'Low',
      riskIcon: '🟢',
      detectedDate: '2024-02-15',
      status: 'resolved',
      controlSystemSign: 'Decrease in pressure',
      controlSystemSource: 'PT',
      droneSign: 'Visual signs of rust, coating damage, or corrosion on exposed pipe',
      droneSource: 'Visible spectrum camera',
      aiConfidence: 87
    },
    // Insulation/Coating Failure defects
    {
      id: 'DEF-011',
      defectType: 'Insulation/Coating Failure',
      location: 'Section C-D',
      riskLevel: 'low',
      riskLabel: 'Low',
      riskIcon: '🟢',
      detectedDate: '2024-01-22',
      status: 'resolved',
      controlSystemSign: 'Increased heat loss',
      controlSystemSource: 'TT',
      droneSign: 'Detection of insulation failures',
      droneSource: 'Visible spectrum camera',
      aiConfidence: 89
    },
    {
      id: 'DEF-012',
      defectType: 'Insulation/Coating Failure',
      location: 'Branch Line',
      riskLevel: 'low',
      riskLabel: 'Low',
      riskIcon: '🟢',
      detectedDate: '2023-12-10',
      status: 'resolved',
      controlSystemSign: 'Increased heat loss',
      controlSystemSource: 'TT',
      droneSign: 'Hot or cold spots along the pipe',
      droneSource: 'Thermal imaging camera',
      aiConfidence: 85
    }
  ]

  return staticDefects
}

// Maximum number of defects to keep in the registry
export const MAX_DEFECT_REGISTRY_SIZE = 15

// Counter for generating unique defect IDs
let defectIdCounter = 100

/**
 * Generate a unique defect ID
 */
const generateDefectId = (): string => {
  defectIdCounter++
  return `DEF-${String(defectIdCounter).padStart(3, '0')}`
}

/**
 * Update defect registry with current detections
 * - When a defect is detected by BOTH systems, either update existing or ADD NEW entry
 * - New defects are added to the registry (not just updating existing ones)
 * - Keeps a maximum of 15 defects in the registry
 * - Removes the oldest defects when exceeding the limit
 */
export const updateDefectRegistryWithDetections = (
  currentRegistry: DefectRegistryItem[],
  leakageStatus: LeakageDetection
): DefectRegistryItem[] => {
  // Create a copy of the current registry
  const updatedRegistry = [...currentRegistry]
  const currentTimestamp = new Date().toISOString()
  const currentDate = new Date().toISOString().split('T')[0]

  // Group current detections by location and defect type
  const locationDefectMap = new Map<string, {
    controlSystem?: DefectDetection
    drone?: DefectDetection
  }>()

  // Add control system detections
  leakageStatus.controlSystem.detections.forEach(detection => {
    const key = `${detection.location}-${detection.defectType}`
    if (!locationDefectMap.has(key)) {
      locationDefectMap.set(key, {})
    }
    locationDefectMap.get(key)!.controlSystem = detection
  })

  // Add drone detections
  leakageStatus.drone.detections.forEach(detection => {
    const key = `${detection.location}-${detection.defectType}`
    if (!locationDefectMap.has(key)) {
      locationDefectMap.set(key, {})
    }
    locationDefectMap.get(key)!.drone = detection
  })

  // Process detections - update existing or add new
  locationDefectMap.forEach((detections) => {
    // Only process if BOTH systems detected it
    if (detections.controlSystem && detections.drone) {
      const location = detections.controlSystem.location!
      const defectType = detections.controlSystem.defectType
      const riskInfo = getRiskLevel(defectType)

      // Find matching defect in registry (same location AND same defect type)
      const matchingDefectIndex = updatedRegistry.findIndex(
        d => d.location === location && d.defectType === defectType
      )

      if (matchingDefectIndex !== -1) {
        // UPDATE existing defect with new detection timestamp
        updatedRegistry[matchingDefectIndex] = {
          ...updatedRegistry[matchingDefectIndex],
          detectedDate: currentDate,
          lastDetected: currentTimestamp,
          status: riskInfo.level === 'critical' ? 'pending' : 
                  riskInfo.level === 'warning' ? 'progress' : 'pending',
          controlSystemSign: detections.controlSystem.sign,
          controlSystemSource: detections.controlSystem.source,
          droneSign: detections.drone.sign,
          droneSource: detections.drone.source,
          aiConfidence: Math.min(99, 85 + Math.floor(Math.random() * 10))
        }
      } else {
        // ADD NEW defect to the registry
        const newDefect: DefectRegistryItem = {
          id: generateDefectId(),
          defectType: defectType,
          location: location,
          riskLevel: riskInfo.level,
          riskLabel: riskInfo.label,
          riskIcon: riskInfo.icon,
          detectedDate: currentDate,
          lastDetected: currentTimestamp,
          status: riskInfo.level === 'critical' ? 'pending' : 
                  riskInfo.level === 'warning' ? 'progress' : 'pending',
          controlSystemSign: detections.controlSystem.sign,
          controlSystemSource: detections.controlSystem.source,
          droneSign: detections.drone.sign,
          droneSource: detections.drone.source,
          aiConfidence: Math.min(99, 85 + Math.floor(Math.random() * 10))
        }
        updatedRegistry.push(newDefect)
      }
    }
  })

  // Sort registry: defects with lastDetected timestamp come first (most recent first),
  // then remaining defects sorted by detectedDate
  updatedRegistry.sort((a, b) => {
    // If both have lastDetected, sort by lastDetected (most recent first)
    if (a.lastDetected && b.lastDetected) {
      return new Date(b.lastDetected).getTime() - new Date(a.lastDetected).getTime()
    }
    // If only a has lastDetected, a comes first
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

  // Keep only the most recent MAX_DEFECT_REGISTRY_SIZE defects (remove oldest)
  if (updatedRegistry.length > MAX_DEFECT_REGISTRY_SIZE) {
    // Already sorted by most recent first, so just slice to keep first 15
    return updatedRegistry.slice(0, MAX_DEFECT_REGISTRY_SIZE)
  }

  return updatedRegistry
}

/**
 * Get initial defect registry with limited size
 * Returns the most recent defects up to MAX_DEFECT_REGISTRY_SIZE
 */
export const getInitialDefectRegistry = (): DefectRegistryItem[] => {
  const allDefects = getStaticDefectRegistry()
  // Sort by date and return only the most recent ones
  allDefects.sort((a, b) => new Date(b.detectedDate).getTime() - new Date(a.detectedDate).getTime())
  return allDefects.slice(0, MAX_DEFECT_REGISTRY_SIZE)
}


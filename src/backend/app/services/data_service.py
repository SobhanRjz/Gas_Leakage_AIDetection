"""
Data service for generating and managing detection data
"""
import random
import csv
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from pathlib import Path

from sqlalchemy.orm import Session
from app.models.detection import ControlSystemData, DroneData, DetectionEvent


# Define defect scenarios (same as frontend)
DEFECT_SCENARIOS = [
    {
        'type': 'Major/Sudden Leak',
        'risk_level': 'critical',
        'control_system': [
            {'sign': 'High pressure drop', 'source': 'PT'},
            {'sign': 'Imbalance mass flow', 'source': 'FT'}
        ],
        'drone': [
            {'sign': 'Direct visual sighting of spill', 'source': 'Visible spectrum camera'},
            {'sign': 'Detection of gas cloud', 'source': 'Spectroscopic sensor'},
            {'sign': 'Distinct thermal anomaly on the ground', 'source': 'Thermal imaging camera'}
        ]
    },
    {
        'type': 'Minor/Gradual Leak',
        'risk_level': 'warning',
        'control_system': [
            {'sign': 'Small, persistent deviation in mass balance', 'source': 'FT'},
            {'sign': 'Slow pressure decline', 'source': 'PT'}
        ],
        'drone': [
            {'sign': 'Gradual discoloration', 'source': 'Visible spectrum camera'},
            {'sign': 'Consistently elevated gas concentration at a specific point', 'source': 'Spectroscopic sensor'},
            {'sign': 'Long-term changes in soil temperature', 'source': 'Thermal imaging camera'}
        ]
    },
    {
        'type': 'Corrosion & Erosion',
        'risk_level': 'low',
        'control_system': [
            {'sign': 'Decrease in pressure', 'source': 'PT'}
        ],
        'drone': [
            {'sign': 'Visual signs of rust, coating damage, or corrosion on exposed pipe', 'source': 'Visible spectrum camera'}
        ]
    },
    {
        'type': 'Mechanical Damage',
        'risk_level': 'critical',
        'control_system': [],
        'drone': [
            {'sign': 'Clear identification of damage: Dents, cracks', 'source': 'Visible spectrum camera'},
            {'sign': 'Detection of unauthorized activities (excavation, construction)', 'source': 'Visible spectrum camera'}
        ]
    },
    {
        'type': 'Insulation/Coating Failure',
        'risk_level': 'low',
        'control_system': [
            {'sign': 'Increased heat loss', 'source': 'TT'}
        ],
        'drone': [
            {'sign': 'Detection of insulation failures', 'source': 'Visible spectrum camera'},
            {'sign': 'Hot or cold spots along the pipe', 'source': 'Thermal imaging camera'}
        ]
    },
    {
        'type': 'Poor Pipe Support',
        'risk_level': 'warning',
        'control_system': [
            {'sign': 'Unusual vibrations', 'source': 'Seismometer'}
        ],
        'drone': [
            {'sign': 'Visual identification of loose, shifted, or broken pipe supports', 'source': 'Visible spectrum camera'},
            {'sign': 'Identification of soil erosion or subsidence under the pipe', 'source': 'Visible spectrum camera'}
        ]
    }
]

LOCATIONS = [
    'Section A-B', 'Section B-C', 'Section C-D', 
    'Branch Line', 'Station Area', 
    'Main Pipeline KM 12.5', 'Main Pipeline KM 18.3'
]


class DataService:
    """Service for managing detection data"""
    
    def __init__(self, db: Session):
        self.db = db
        self.data_dir = Path(__file__).parent.parent.parent / 'data'
        self.data_dir.mkdir(exist_ok=True)
    
    def generate_leakage_status(self) -> Dict[str, Any]:
        """
        Generate random leakage status
        Returns detection data from both control system and drone
        """
        # 80% chance of being OK, 20% chance of having issues
        has_issue = random.random() > 0.2
        
        if not has_issue:
            return {
                'control_system': {'status': 'ok', 'detections': []},
                'drone': {'status': 'ok', 'detections': []},
                'total_leakages': 0
            }
        
        # Determine number of leakages (1-3)
        num_leakages = random.randint(1, 3)
        
        control_system_detections = []
        drone_detections = []
        
        # Generate multiple leakages - BOTH systems detect the SAME defect(s)
        for _ in range(num_leakages):
            # Only select defects that have both control system AND drone signatures
            defects_with_both = [d for d in DEFECT_SCENARIOS 
                                if d['control_system'] and d['drone']]
            selected_defect = random.choice(defects_with_both)
            location = random.choice(LOCATIONS)
            
            # BOTH systems detect this defect
            control_sig = random.choice(selected_defect['control_system'])
            drone_sig = random.choice(selected_defect['drone'])
            
            control_system_detections.append({
                'defect_type': selected_defect['type'],
                'sign': control_sig['sign'],
                'source': control_sig['source'],
                'location': location
            })
            
            drone_detections.append({
                'defect_type': selected_defect['type'],
                'sign': drone_sig['sign'],
                'source': drone_sig['source'],
                'location': location
            })
        
        return {
            'control_system': {
                'status': 'detected' if control_system_detections else 'ok',
                'detections': control_system_detections
            },
            'drone': {
                'status': 'detected' if drone_detections else 'ok',
                'detections': drone_detections
            },
            'total_leakages': num_leakages
        }
    
    def generate_control_system_data(self, count: int = 100) -> List[Dict[str, Any]]:
        """Generate sample control system data"""
        data = []
        now = datetime.now()
        
        for i in range(count):
            timestamp = now - timedelta(minutes=random.randint(0, 1440))  # Last 24 hours
            location = random.choice(LOCATIONS)
            sensor_type = random.choice(['PT', 'FT', 'TT', 'Seismometer'])
            
            # Generate realistic readings based on sensor type
            if sensor_type == 'PT':  # Pressure
                reading_value = round(random.uniform(40.0, 50.0), 2)
                reading_unit = 'PSI'
            elif sensor_type == 'FT':  # Flow
                reading_value = round(random.uniform(1000, 1500), 2)
                reading_unit = 'm³/h'
            elif sensor_type == 'TT':  # Temperature
                reading_value = round(random.uniform(15.0, 25.0), 2)
                reading_unit = '°C'
            else:  # Seismometer
                reading_value = round(random.uniform(0.0, 0.5), 3)
                reading_unit = 'mm/s'
            
            # 10% chance of anomaly
            anomaly_detected = random.random() < 0.1
            status = 'critical' if anomaly_detected and random.random() < 0.3 else \
                    'warning' if anomaly_detected else 'normal'
            
            data.append({
                'timestamp': timestamp.isoformat(),
                'location': location,
                'sensor_type': sensor_type,
                'sensor_id': f'{sensor_type}-{location.replace(" ", "-")}-{random.randint(1, 5)}',
                'reading_value': reading_value,
                'reading_unit': reading_unit,
                'status': status,
                'anomaly_detected': anomaly_detected,
                'anomaly_type': random.choice([d['sign'] for d in random.choice([s for s in DEFECT_SCENARIOS if s['control_system']])['control_system']]) if anomaly_detected else None
            })
        
        return data
    
    def generate_drone_data(self, count: int = 50) -> List[Dict[str, Any]]:
        """Generate sample drone data"""
        data = []
        now = datetime.now()
        
        for i in range(count):
            timestamp = now - timedelta(minutes=random.randint(0, 1440))  # Last 24 hours
            location = random.choice(LOCATIONS)
            sensor_type = random.choice(['Visible spectrum camera', 'Thermal imaging camera', 'Spectroscopic sensor'])
            media_type = random.choice(['image', 'video'])
            
            # 10% chance of anomaly
            anomaly_detected = random.random() < 0.1
            status = 'critical' if anomaly_detected and random.random() < 0.3 else \
                    'warning' if anomaly_detected else 'normal'
            
            data.append({
                'timestamp': timestamp.isoformat(),
                'location': location,
                'sensor_type': sensor_type,
                'media_type': media_type,
                'media_path': f'/media/drone/{timestamp.strftime("%Y%m%d")}/{location.replace(" ", "_")}_{i}.{media_type}',
                'status': status,
                'anomaly_detected': anomaly_detected,
                'anomaly_type': random.choice([d['sign'] for d in random.choice([s for s in DEFECT_SCENARIOS if s['drone']])['drone']]) if anomaly_detected else None,
                'ai_confidence': round(random.uniform(85, 99), 2) if anomaly_detected else None
            })
        
        return data
    
    def save_to_csv(self, data: List[Dict[str, Any]], filename: str):
        """Save data to CSV file"""
        filepath = self.data_dir / filename
        
        if not data:
            return
        
        with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
    
    def load_from_csv(self, filename: str) -> List[Dict[str, Any]]:
        """Load data from CSV file"""
        filepath = self.data_dir / filename
        
        if not filepath.exists():
            return []
        
        with open(filepath, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            return list(reader)
    
    def get_control_system_summary(self) -> Dict[str, Any]:
        """Get summary statistics for control system data"""
        data = self.load_from_csv('control_system_data.csv')
        
        if not data:
            # Generate and save if not exists
            data = self.generate_control_system_data(145)
            self.save_to_csv(data, 'control_system_data.csv')
        
        total = len(data)
        critical = sum(1 for d in data if d.get('status') == 'critical')
        warning = sum(1 for d in data if d.get('status') == 'warning')
        normal = total - critical - warning
        
        return {
            'total': total,
            'critical': critical,
            'warning': warning,
            'normal': normal,
            'data': data
        }
    
    def get_drone_summary(self) -> Dict[str, Any]:
        """Get summary statistics for drone data"""
        data = self.load_from_csv('drone_data.csv')
        
        if not data:
            # Generate and save if not exists
            data = self.generate_drone_data(2847)
            self.save_to_csv(data, 'drone_data.csv')
        
        total = len(data)
        videos = sum(1 for d in data if d.get('media_type') == 'video')
        images = total - videos
        
        return {
            'total': total,
            'videos': videos,
            'images': images,
            'data': data
        }
    
    def store_detection_event(self, leakage_status: Dict[str, Any]) -> List[DetectionEvent]:
        """
        Store detection events in database with two-tier system:
        1. Mark previous 'latest' detections as historical (is_latest=False)
        2. Store new detections as 'latest' (is_latest=True)
        3. Maintain max 15 historical events (delete oldest if needed)
        """
        events = []
        
        # Step 1: Mark all current 'latest' detections as historical
        current_latest = self.db.query(DetectionEvent).filter(
            DetectionEvent.is_latest == True
        ).all()
        
        for event in current_latest:
            event.is_latest = False
            event.last_updated = datetime.now()
        
        # Group detections by location and defect type
        location_defect_map = {}
        
        # Add control system detections
        for detection in leakage_status['control_system']['detections']:
            key = f"{detection['location']}-{detection['defect_type']}"
            if key not in location_defect_map:
                location_defect_map[key] = {}
            location_defect_map[key]['control_system'] = detection
        
        # Add drone detections
        for detection in leakage_status['drone']['detections']:
            key = f"{detection['location']}-{detection['defect_type']}"
            if key not in location_defect_map:
                location_defect_map[key] = {}
            location_defect_map[key]['drone'] = detection
        
        # Step 2: Create NEW detection events as 'latest' for items detected by BOTH systems
        for key, detections in location_defect_map.items():
            if 'control_system' in detections and 'drone' in detections:
                location = detections['control_system']['location']
                defect_type = detections['control_system']['defect_type']
                
                # Find risk level
                risk_level = next((s['risk_level'] for s in DEFECT_SCENARIOS if s['type'] == defect_type), 'warning')
                
                # Always create NEW event as latest (don't update existing)
                event = DetectionEvent(
                    event_id=f"EVT-{datetime.now().strftime('%Y%m%d%H%M%S')}-{random.randint(1000, 9999)}",
                    location=location,
                    defect_type=defect_type,
                    risk_level=risk_level,
                    control_system_detected=True,
                    control_system_sign=detections['control_system']['sign'],
                    control_system_source=detections['control_system']['source'],
                    drone_detected=True,
                    drone_sign=detections['drone']['sign'],
                    drone_source=detections['drone']['source'],
                    status='pending' if risk_level == 'critical' else 'progress',
                    is_latest=True,  # Mark as current/latest detection
                    ai_confidence=round(random.uniform(85, 99), 2),
                    last_updated=datetime.now()
                )
                self.db.add(event)
                events.append(event)
        
        # Step 3: Maintain max 15 historical events (delete oldest if exceeded)
        total_events = self.db.query(DetectionEvent).count() + len(events)
        if total_events > 15:
            # Get oldest historical events to delete
            events_to_delete = self.db.query(DetectionEvent).filter(
                DetectionEvent.is_latest == False
            ).order_by(
                DetectionEvent.last_updated.asc()
            ).limit(total_events - 15).all()
            
            for event in events_to_delete:
                self.db.delete(event)
        
        self.db.commit()
        return events
    
    def get_recent_detection_events(self, limit: int = 15) -> List[Dict[str, Any]]:
        """Get recent detection events"""
        events = self.db.query(DetectionEvent).order_by(
            DetectionEvent.last_updated.desc()
        ).limit(limit).all()
        
        return [
            {
                'id': event.event_id,
                'defect_type': event.defect_type,
                'location': event.location,
                'risk_level': event.risk_level,
                'detected_date': event.timestamp.strftime('%Y-%m-%d'),
                'last_detected': event.last_updated.isoformat() if event.last_updated else event.timestamp.isoformat(),
                'status': event.status,
                'control_system_sign': event.control_system_sign,
                'control_system_source': event.control_system_source,
                'drone_sign': event.drone_sign,
                'drone_source': event.drone_source,
                'ai_confidence': event.ai_confidence
            }
            for event in events
        ]
    
    def get_latest_leakage_status(self) -> Dict[str, Any]:
        """
        Get LATEST leakage status for Overview page
        Returns only the most recent detections (is_latest=True)
        This shows 1-3 current active issues
        """
        # Get only latest detection events
        latest_events = self.db.query(DetectionEvent).filter(
            DetectionEvent.is_latest == True
        ).all()
        
        if not latest_events:
            return {
                'control_system': {'status': 'ok', 'detections': []},
                'drone': {'status': 'ok', 'detections': []},
                'total_leakages': 0
            }
        
        control_system_detections = []
        drone_detections = []
        
        for event in latest_events:
            control_system_detections.append({
                'defect_type': event.defect_type,
                'sign': event.control_system_sign,
                'source': event.control_system_source,
                'location': event.location
            })
            
            drone_detections.append({
                'defect_type': event.defect_type,
                'sign': event.drone_sign,
                'source': event.drone_source,
                'location': event.location
            })
        
        return {
            'control_system': {
                'status': 'detected' if control_system_detections else 'ok',
                'detections': control_system_detections
            },
            'drone': {
                'status': 'detected' if drone_detections else 'ok',
                'detections': drone_detections
            },
            'total_leakages': len(latest_events)
        }
    
    def get_current_leakage_status_from_db(self) -> Dict[str, Any]:
        """
        DEPRECATED: Use get_latest_leakage_status() instead
        Get current leakage status from database (not randomly generated)
        Returns the active detection events formatted as leakage status
        """
        # For backward compatibility, call the new method
        return self.get_latest_leakage_status()
    
    def clear_latest_detections(self):
        """
        Mark all current 'latest' detections as historical
        Called when no new detections are found (system is OK)
        """
        current_latest = self.db.query(DetectionEvent).filter(
            DetectionEvent.is_latest == True
        ).all()
        
        for event in current_latest:
            event.is_latest = False
            event.last_updated = datetime.now()
        
        self.db.commit()


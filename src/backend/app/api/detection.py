"""
Detection API endpoints
"""
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.auth import get_db, get_current_user
from app.models.user import User
from app.services.data_service import DataService

router = APIRouter()


@router.get("/leakage-status")
async def get_leakage_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> dict[str, Any]:
    """
    Get current leakage detection status
    Returns detection data from both control system and drone
    """
    data_service = DataService(db)
    leakage_status = data_service.generate_leakage_status()
    
    # Store detection events if any leakages detected
    if leakage_status['total_leakages'] > 0:
        data_service.store_detection_event(leakage_status)
    
    return leakage_status


@router.get("/control-system/summary")
async def get_control_system_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> dict[str, Any]:
    """
    Get control system data summary
    """
    data_service = DataService(db)
    return data_service.get_control_system_summary()


@router.get("/control-system/data")
async def get_control_system_data(
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> dict[str, Any]:
    """
    Get control system data
    """
    data_service = DataService(db)
    summary = data_service.get_control_system_summary()
    
    return {
        'total': summary['total'],
        'data': summary['data'][:limit]
    }


@router.get("/drone/summary")
async def get_drone_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> dict[str, Any]:
    """
    Get drone data summary
    """
    data_service = DataService(db)
    return data_service.get_drone_summary()


@router.get("/drone/data")
async def get_drone_data(
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> dict[str, Any]:
    """
    Get drone data
    """
    data_service = DataService(db)
    summary = data_service.get_drone_summary()
    
    return {
        'total': summary['total'],
        'data': summary['data'][:limit]
    }


@router.get("/events")
async def get_detection_events(
    limit: int = 15,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> dict[str, Any]:
    """
    Get recent detection events (defect registry)
    """
    data_service = DataService(db)
    events = data_service.get_recent_detection_events(limit)
    
    return {
        'total': len(events),
        'events': events
    }


@router.post("/regenerate-data")
async def regenerate_data(
    control_system_count: int = 145,
    drone_count: int = 2847,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> dict[str, Any]:
    """
    Regenerate sample data for control system and drone
    """
    data_service = DataService(db)
    
    # Generate and save control system data
    control_data = data_service.generate_control_system_data(control_system_count)
    data_service.save_to_csv(control_data, 'control_system_data.csv')
    
    # Generate and save drone data
    drone_data = data_service.generate_drone_data(drone_count)
    data_service.save_to_csv(drone_data, 'drone_data.csv')
    
    return {
        'message': 'Data regenerated successfully',
        'control_system_records': len(control_data),
        'drone_records': len(drone_data)
    }


@router.post("/simulate-detection")
async def simulate_detection(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> dict[str, Any]:
    """
    Simulate a new detection event (for testing purposes)
    Generates random leakage status and stores it as detection events
    """
    data_service = DataService(db)
    
    # Generate random leakage status
    leakage_status = data_service.generate_leakage_status()
    
    # Store detection events if any leakages detected
    if leakage_status['total_leakages'] > 0:
        events = data_service.store_detection_event(leakage_status)
        return {
            'message': 'New detection simulated successfully',
            'leakage_status': leakage_status,
            'events_created': len(events)
        }
    else:
        return {
            'message': 'No leakages detected in simulation',
            'leakage_status': leakage_status,
            'events_created': 0
        }


@router.get("/overview-stats")
async def get_overview_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> dict[str, Any]:
    """
    Get all statistics for overview page
    Generates NEW random detection status each time (simulating real-time monitoring)
    Stores detections in database for history tracking
    Shows 0-3 current active issues dynamically
    """
    data_service = DataService(db)
    
    # Generate NEW random leakage status (dynamic/real-time simulation)
    leakage_status = data_service.generate_leakage_status()
    
    # Store detection events if any leakages detected
    # This updates the database: marks old as historical, adds new as latest
    if leakage_status['total_leakages'] > 0:
        data_service.store_detection_event(leakage_status)
    else:
        # No detections - mark all existing as historical
        data_service.clear_latest_detections()
    
    # Get summaries
    control_summary = data_service.get_control_system_summary()
    drone_summary = data_service.get_drone_summary()
    
    return {
        'leakage_status': leakage_status,
        'control_system': {
            'total': control_summary['total'],
            'critical': control_summary['critical'],
            'warning': control_summary['warning'],
            'normal': control_summary['normal']
        },
        'drone': {
            'total': drone_summary['total'],
            'videos': drone_summary['videos'],
            'images': drone_summary['images']
        }
    }


@router.get("/export/control-system")
async def export_control_system_csv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> dict[str, Any]:
    """
    Get path to control system CSV file for download
    """
    data_service = DataService(db)
    filepath = data_service.data_dir / 'control_system_data.csv'
    
    if not filepath.exists():
        # Generate if not exists
        data = data_service.generate_control_system_data(145)
        data_service.save_to_csv(data, 'control_system_data.csv')
    
    return {
        'filename': 'control_system_data.csv',
        'path': str(filepath),
        'message': 'CSV file ready for download'
    }


@router.get("/export/drone")
async def export_drone_csv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> dict[str, Any]:
    """
    Get path to drone CSV file for download
    """
    data_service = DataService(db)
    filepath = data_service.data_dir / 'drone_data.csv'
    
    if not filepath.exists():
        # Generate if not exists
        data = data_service.generate_drone_data(2847)
        data_service.save_to_csv(data, 'drone_data.csv')
    
    return {
        'filename': 'drone_data.csv',
        'path': str(filepath),
        'message': 'CSV file ready for download'
    }


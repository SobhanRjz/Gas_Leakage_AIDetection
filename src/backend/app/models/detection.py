"""
Detection data models for control system and drone data
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from sqlalchemy.sql import func
from app.db.base import Base


class ControlSystemData(Base):
    """
    Control System sensor data
    Stores data from pressure transmitters (PT), flow transmitters (FT), 
    temperature transmitters (TT), and seismometers
    """
    __tablename__ = "control_system_data"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    location = Column(String(100), nullable=False)
    sensor_type = Column(String(50), nullable=False)  # PT, FT, TT, Seismometer
    sensor_id = Column(String(50), nullable=False)
    reading_value = Column(Float, nullable=False)
    reading_unit = Column(String(20), nullable=False)
    status = Column(String(20), default='normal')  # normal, warning, critical
    anomaly_detected = Column(Boolean, default=False)
    anomaly_type = Column(String(100), nullable=True)  # e.g., "High pressure drop", "Imbalance mass flow"
    notes = Column(Text, nullable=True)


class DroneData(Base):
    """
    Drone surveillance data
    Stores data from visible spectrum cameras, thermal imaging, and spectroscopic sensors
    """
    __tablename__ = "drone_data"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    location = Column(String(100), nullable=False)
    sensor_type = Column(String(50), nullable=False)  # Visible camera, Thermal camera, Spectroscopic sensor
    media_type = Column(String(20), nullable=False)  # image, video
    media_path = Column(String(500), nullable=True)
    status = Column(String(20), default='normal')  # normal, warning, critical
    anomaly_detected = Column(Boolean, default=False)
    anomaly_type = Column(String(100), nullable=True)  # e.g., "Visual sighting of spill", "Gas cloud detected"
    ai_confidence = Column(Float, nullable=True)  # AI detection confidence (0-100)
    notes = Column(Text, nullable=True)


class DetectionEvent(Base):
    """
    Leakage detection events
    Records when both control system and drone detect the same defect
    
    Two-tier system:
    - is_latest=True: Current active detection shown on Overview (1-3 max)
    - is_latest=False: Historical detection in registry (up to 15 total)
    """
    __tablename__ = "detection_events"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(50), unique=True, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    location = Column(String(100), nullable=False)
    defect_type = Column(String(100), nullable=False)
    risk_level = Column(String(20), nullable=False)  # critical, warning, low
    
    # Control System Detection
    control_system_detected = Column(Boolean, default=False)
    control_system_sign = Column(String(200), nullable=True)
    control_system_source = Column(String(50), nullable=True)
    
    # Drone Detection
    drone_detected = Column(Boolean, default=False)
    drone_sign = Column(String(200), nullable=True)
    drone_source = Column(String(50), nullable=True)
    
    # Status
    status = Column(String(20), default='pending')  # pending, progress, resolved
    is_latest = Column(Boolean, default=True)  # True = current detection (Overview), False = historical (Reports)
    ai_confidence = Column(Float, nullable=True)
    last_updated = Column(DateTime(timezone=True), onupdate=func.now())
    resolved_date = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)


"""
Database migration script to add 'is_latest' column to detection_events table

This migration:
1. Adds the 'is_latest' column with default value False
2. Marks the most recent detection as is_latest=True
3. Keeps older detections as is_latest=False (historical)

Usage:
    python migrate_add_is_latest.py
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import create_engine, text, inspect
from app.core.config import settings
from app.db.session import SessionLocal
from app.models.detection import DetectionEvent


def migrate_add_is_latest():
    """Add is_latest column and set appropriate values"""
    print("=" * 60)
    print("Starting migration: Adding 'is_latest' column")
    print("=" * 60)
    
    # Create engine
    engine = create_engine(settings.DATABASE_URL)
    
    # Step 1: Check if column exists and add if needed
    with engine.connect() as conn:
        try:
            # Check if column exists using inspector
            inspector = inspect(engine)
            columns = [col['name'] for col in inspector.get_columns('detection_events')]
            
            if 'is_latest' not in columns:
                print("\n[1/3] Adding 'is_latest' column to detection_events table...")
                conn.execute(text(
                    "ALTER TABLE detection_events ADD COLUMN is_latest BOOLEAN DEFAULT 0"
                ))
                conn.commit()
                print("      ✓ Column 'is_latest' added successfully")
            else:
                print("\n[1/3] Column 'is_latest' already exists")
                print("      ✓ Skipping column creation")
        except Exception as e:
            print(f"      ✗ Error adding column: {e}")
            return False
    
    # Step 2: Set is_latest values
    db = SessionLocal()
    try:
        print("\n[2/3] Setting is_latest values...")
        
        # Get all detection events ordered by last_updated (most recent first)
        all_events = db.query(DetectionEvent).order_by(
            DetectionEvent.last_updated.desc()
        ).all()
        
        if not all_events:
            print("      ℹ No detection events found in database")
            print("      ✓ Migration completed (no data to migrate)")
            return True
        
        print(f"      Found {len(all_events)} detection events")
        
        # Mark all as historical first
        for event in all_events:
            event.is_latest = False
        
        # Mark only the most recent 1-3 as latest (simulate current active detections)
        # For migration, we'll mark the most recent 1 as latest
        if all_events:
            all_events[0].is_latest = True
            print(f"      ✓ Marked event '{all_events[0].event_id}' as latest")
        
        db.commit()
        
        print("\n[3/3] Migration completed successfully!")
        print(f"      - Latest detections: 1")
        print(f"      - Historical detections: {len(all_events) - 1}")
        print("\n" + "=" * 60)
        print("✓ Database migration successful!")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"\n      ✗ Error setting is_latest values: {e}")
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    try:
        success = migrate_add_is_latest()
        if success:
            print("\n✓ You can now restart your backend server")
            sys.exit(0)
        else:
            print("\n✗ Migration failed. Please check the errors above.")
            sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        sys.exit(1)


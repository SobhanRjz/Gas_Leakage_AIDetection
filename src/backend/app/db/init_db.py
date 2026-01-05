"""
Database initialization script
"""
import sys
import traceback
from sqlalchemy.orm import Session
from sqlalchemy import inspect

from app.core.security import get_password_hash
from app.db.session import SessionLocal, engine
from app.models.user import User
# Import all models to ensure they are registered with SQLAlchemy
from app.models.detection import ControlSystemData, DroneData, DetectionEvent  # noqa: F401


def init_db():
    """
    Initialize database with default data
    """
    print("=" * 60)
    print("Starting database initialization...")
    print("=" * 60)
    
    db: Session = SessionLocal()
    try:
        # Check if tables exist
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"Existing tables: {tables}")
        
        if 'users' not in tables:
            print("⚠ Users table does not exist! Creating tables...")
            from app.db.base import Base
            Base.metadata.create_all(bind=engine)
            print("✓ Tables created successfully")
        
        # Count existing users
        user_count = db.query(User).count()
        print(f"Current user count: {user_count}")
        
        # Always ensure we have the correct admin user
        # First, try to find existing user by username or email
        existing_user = db.query(User).filter(
            (User.username == "petro") |
            (User.username == "admin") |
            (User.email == "petro@example.com") |
            (User.email == "admin@example.com")
        ).first()

        if existing_user:
            # Update existing user with correct credentials
            print(f"Found existing user: {existing_user.username}")
            existing_user.username = "petro"
            existing_user.email = "petro@example.com"
            existing_user.hashed_password = get_password_hash("avash123")
            existing_user.is_active = True
            db.commit()
            db.refresh(existing_user)
            print("✓ User updated successfully")
            print(f"  Username: petro")
            print(f"  Email: petro@example.com")
            print(f"  Password: avash123")
            print(f"  Active: {existing_user.is_active}")
        else:
            # Create new admin user if none exists
            print("No existing user found. Creating new admin user...")
            admin_user = User(
                username="petro",
                email="petro@example.com",
                hashed_password=get_password_hash("avash123"),
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print("✓ Default admin user created successfully")
            print(f"  Username: petro")
            print(f"  Email: petro@example.com")
            print(f"  Password: avash123")
            print(f"  User ID: {admin_user.id}")

        # Verify the user was created/updated correctly
        final_user = db.query(User).filter(User.username == "petro").first()
        if final_user and final_user.is_active:
            print(f"\n✓ Final verification successful!")
            print(f"  User: {final_user.username}")
            print(f"  Email: {final_user.email}")
            print(f"  Active: {final_user.is_active}")
            print(f"  ID: {final_user.id}")
        else:
            print("\n✗ Final verification failed!")
            if final_user:
                print(f"  User exists but is_active={final_user.is_active}")
            else:
                print("  User does not exist in database!")
        
        # Final count
        final_count = db.query(User).count()
        print(f"\nTotal users in database: {final_count}")
        print("=" * 60)
        print("Database initialization completed")
        print("=" * 60)

    except Exception as e:
        print(f"\n✗ Database initialization error!")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {e}")
        print("\nFull traceback:")
        traceback.print_exc()
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    init_db()

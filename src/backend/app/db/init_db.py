"""
Database initialization script
"""
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.user import User
# Import all models to ensure they are registered with SQLAlchemy
from app.models.detection import ControlSystemData, DroneData, DetectionEvent  # noqa: F401


def init_db():
    """
    Initialize database with default data
    """
    db: Session = SessionLocal()
    try:
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
            existing_user.username = "petro"
            existing_user.email = "petro@example.com"
            existing_user.hashed_password = get_password_hash("avash123")
            existing_user.is_active = True
            db.commit()
            print("✓ User updated: petro / avash123")
        else:
            # Create new admin user if none exists
            admin_user = User(
                username="petro",
                email="petro@example.com",
                hashed_password=get_password_hash("avash123"),
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("✓ Default admin user created: petro / avash123")

        # Verify the user was created/updated correctly
        final_user = db.query(User).filter(User.username == "petro").first()
        if final_user and final_user.is_active:
            print(f"✓ User verification successful: {final_user.username} ({final_user.email})")
        else:
            print("✗ User verification failed!")

    except Exception as e:
        print(f"✗ Database initialization error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_db()

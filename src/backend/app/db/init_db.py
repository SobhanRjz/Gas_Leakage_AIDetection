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
        # Create default admin user if it doesn't exist
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                username="admin",
                email="admin@example.com",
                hashed_password=get_password_hash("password"),
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("Default admin user created: admin / password")
        else:
            print("Admin user already exists")
    finally:
        db.close()


if __name__ == "__main__":
    init_db()

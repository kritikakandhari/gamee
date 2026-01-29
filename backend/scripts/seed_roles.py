"""
Seed initial roles in the database.
Run this after initial migration.
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from app.infrastructure.database.session import AsyncSessionLocal, engine
from app.infrastructure.database.models.user import Role


async def seed_roles():
    """Seed initial roles."""
    try:
        async with AsyncSessionLocal() as session:
            # Check if roles table exists by trying to query it
            try:
                result = await session.execute(select(Role))
                existing_roles = result.scalars().all()
                
                if existing_roles:
                    print("Roles already exist, skipping seed.")
                    return
            except Exception as e:
                # Table doesn't exist yet (migrations haven't run)
                print(f"Roles table does not exist yet: {e}")
                print("Please run migrations first: alembic upgrade head")
                return
            
            # Create roles
            roles = [
                Role(name="PLAYER", description="Standard player account"),
                Role(name="ADMIN", description="Full system administrator"),
                Role(name="MODERATOR", description="Can resolve disputes, moderate users"),
            ]
            
            session.add_all(roles)
            await session.commit()
            
            print("Successfully seeded roles:")
            for role in roles:
                print(f"  - {role.name}: {role.description}")
    except Exception as e:
        print(f"Error seeding roles: {e}")
        # Don't raise - let the application continue


if __name__ == "__main__":
    asyncio.run(seed_roles())

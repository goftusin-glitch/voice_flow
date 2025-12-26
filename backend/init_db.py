"""
Database initialization script
This script creates the database if it doesn't exist and runs migrations
"""
import os
import pymysql
from dotenv import load_dotenv
from urllib.parse import urlparse, unquote

load_dotenv()


def _quote_identifier(name: str) -> str:
    """
    Safely quote a MySQL identifier (like database name) using backticks.
    """
    return f"`{name.replace('`', '``')}`"


def create_database() -> bool:
    """Create the database if it doesn't exist"""
    db_url = os.getenv("DATABASE_URL", "").strip()

    if not db_url:
        print("Error creating database: DATABASE_URL is empty or not set.")
        print("\nPlease ensure:")
        print("1. MySQL is running")
        print("2. Your .env file has the correct DATABASE_URL")
        print("3. The MySQL user has permission to create databases")
        return False

    # Helpful hint: un-encoded '@' inside password will create multiple '@' in the URL
    if db_url.count("@") > 1 and "%40" not in db_url:
        print("Error creating database: DATABASE_URL likely contains an unescaped '@' in the password.")
        print("Tip: URL-encode '@' as %40 (example: test@123 -> test%40123).")
        return False

    try:
        u = urlparse(db_url)

        # Allow mysql+pymysql://... or mysql://...
        if not (u.scheme.startswith("mysql")):
            raise ValueError(f"Unsupported DATABASE_URL scheme: {u.scheme}")

        user = unquote(u.username or "")
        password = unquote(u.password or "")
        host = u.hostname or "localhost"
        port = u.port or 3306
        database_name = (u.path or "/voice_flow").lstrip("/") or "voice_flow"

        print(f"Connecting to MySQL server at {host}:{port}...")

        # Connect to MySQL server (without specifying database)
        connection = pymysql.connect(
            host=host,
            port=port,
            user=user,
            password=password,
        )

        cursor = connection.cursor()

        db_ident = _quote_identifier(database_name)
        cursor.execute(
            f"CREATE DATABASE IF NOT EXISTS {db_ident} "
            "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        )
        print(f"Database '{database_name}' created successfully (or already exists)")

        cursor.close()
        connection.close()
        return True

    except Exception as e:
        print(f"Error creating database: {e}")
        print("\nPlease ensure:")
        print("1. MySQL is running")
        print("2. Your .env file has the correct DATABASE_URL")
        print("3. The MySQL user has permission to create databases")
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("Voice Flow - Database Initialization")
    print("=" * 60)
    print()

    if create_database():
        print("\n" + "=" * 60)
        print("Database created successfully!")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Activate your virtual environment")
        print("2. Run: flask db init")
        print("3. Run: flask db migrate -m 'Add all Phase 2 models'")
        print("4. Run: flask db upgrade")
        print()
    else:
        print("\n" + "=" * 60)
        print("Database creation failed. Please fix the errors above.")
        print("=" * 60)

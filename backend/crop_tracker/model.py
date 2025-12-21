import os
import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor
from urllib.parse import urlparse

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SQLITE_PATH = os.path.join(BASE_DIR, "database.db")

def get_db():
    """
    Uses PostgreSQL if DATABASE_URL is set (Render),
    otherwise uses SQLite (local development).
    """
    db_url = os.environ.get("DATABASE_URL")

    # ---- LOCAL: SQLite
    if not db_url:
        conn = sqlite3.connect(SQLITE_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    # ---- Render sometimes gives postgres://
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    # ---- POSTGRESQL
    return psycopg2.connect(db_url, cursor_factory=RealDictCursor)


def init_db():
    """
    Create tables ONLY for SQLite.
    PostgreSQL tables should already exist.
    """
    db_url = os.environ.get("DATABASE_URL")

    # If PostgreSQL → DO NOT auto-create tables
    if db_url:
        print("PostgreSQL detected – skipping SQLite init_db()")
        return

    # SQLite init (local only)
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            username TEXT NOT NULL,
            password TEXT NOT NULL
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS crops (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            area REAL NOT NULL,
            planting_date TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS harvests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            crop_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            yield_amount REAL NOT NULL,
            FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS reset_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT NOT NULL,
            expiry TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    conn.commit()
    conn.close()

import sqlite3
import os

# Get base directory (backend folder)
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

# Path to database file
DB_PATH = os.path.join(BASE_DIR, "database.db")

def get_db():
    """Return a connection to SQLite database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # allows dict-like access
    return conn

def init_db():
    """Create tables if they do not exist."""
    conn = get_db()
    cur = conn.cursor()

    # Create crops table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS crops (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            area REAL NOT NULL,
            planting_date TEXT NOT NULL
        )
    """)

    # Create harvests table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS harvests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            crop_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            yield_amount REAL NOT NULL,
            FOREIGN KEY (crop_id) REFERENCES crops(id)
        )
    """)

    conn.commit()
    conn.close()

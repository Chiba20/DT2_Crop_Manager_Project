import sqlite3
import os

# Path: backend/shared_db/database.db
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, "shared_db", "database.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

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

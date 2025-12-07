# model.py
import sqlite3
import os
from pathlib import Path

# Robustly locate the shared DB created by Student1.
def find_shared_db():
    # Start from this file's parent and search upward
    cur = Path(__file__).resolve().parent
    # Try a few common relative locations
    candidates = [
        cur.parent / "shared_db" / "database.db",                        # student2/backend/../shared_db
        cur.parent.parent / "backend" / "shared_db" / "database.db",     # repo/backend/shared_db
        cur.parent.parent / "shared_db" / "database.db",
        Path(__file__).resolve().parents[2] / "backend" / "shared_db" / "database.db",
        Path(__file__).resolve().parents[3] / "backend" / "shared_db" / "database.db",
    ]
    for p in candidates:
        if p.exists():
            return str(p)
    # Last resort: assume sibling 'shared_db' in repo root
    fallback = str(cur.parent / "shared_db" / "database.db")
    return fallback

SHARED_DB_PATH = find_shared_db()

def get_db():
    # Use check_same_thread=False for safety if multiple threads access it
    conn = sqlite3.connect(SHARED_DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

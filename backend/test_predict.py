import sys
import os

# Ensure backend folder is on sys.path so imports work when running this script
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from app import app
from crop_tracker.model import get_db, init_db, DB_PATH
import os
import sqlite3

print('Database path:', DB_PATH)
# Initialize DB and seed sample data
init_db()
conn = get_db()
cur = conn.cursor()

# Clean any existing sample user/crops/harvests to make test idempotent
cur.execute("DELETE FROM harvests")
cur.execute("DELETE FROM crops")
cur.execute("DELETE FROM users")
cur.execute("DELETE FROM reset_tokens")
conn.commit()

# Insert a user
cur.execute("INSERT INTO users (email, username, password) VALUES (?, ?, ?)",
            ('test@example.com', 'tester', 'pass123'))
user_id = cur.lastrowid

# Insert multiple crops with same name for training
crops = [
    (user_id, 'Maize', 5.0, '2024-03-10'),
    (user_id, 'Maize', 8.0, '2024-04-15'),
    (user_id, 'Maize', 10.0, '2024-05-20')
]
for c in crops:
    cur.execute("INSERT INTO crops (user_id, name, area, planting_date) VALUES (?, ?, ?, ?)", c)

# Save crop ids to create harvests
conn.commit()
cur.execute("SELECT id FROM crops WHERE user_id=? AND name=? ORDER BY id", (user_id, 'Maize'))
rows = cur.fetchall()
crop_ids = [r[0] for r in rows]

# Insert harvests for those crops
harvests = [
    (crop_ids[0], '2024-06-01', 8.0),
    (crop_ids[1], '2024-07-01', 12.0),
    (crop_ids[2], '2024-08-01', 18.0)
]
for h in harvests:
    cur.execute("INSERT INTO harvests (crop_id, date, yield_amount) VALUES (?, ?, ?)", h)

conn.commit()

# Add a new crop to predict
cur.execute("INSERT INTO crops (user_id, name, area, planting_date) VALUES (?, ?, ?, ?)",
            (user_id, 'Maize', 7.0, '2025-03-15'))
conn.commit()
new_crop_id = cur.lastrowid
conn.close()

# Use Flask test client
with app.test_client() as client:
    resp = client.get(f"/api/predict/{new_crop_id}?user_id={user_id}")
    print('Status code:', resp.status_code)
    print('Response JSON:', resp.get_json())

from flask import Blueprint, request, jsonify
from datetime import datetime
from crop_tracker.model import get_db

# Create Blueprint for harvest-related routes
harvest_routes = Blueprint("harvest_routes", __name__)

# -------------------------------
# Utility function to validate date format (YYYY-MM-DD)
# -------------------------------
def validate_date(date_string):
    """Utility function to check if the provided date is in correct format."""
    try:
        datetime.strptime(date_string, "%Y-%m-%d")  # Check if date is in correct format
        return True
    except ValueError:
        return False


# -------------------------------
# Route to get all harvests
# -------------------------------
@harvest_routes.route("/harvests", methods=["GET"])
def get_all_harvests():
    """Fetch all harvest records."""
    try:
        conn = get_db()
        harvests = conn.execute("SELECT * FROM harvests").fetchall()
        conn.close()

        # Convert to list of dictionaries for easy JSON serialization
        return jsonify([dict(h) for h in harvests]), 200
    except Exception as e:
        return jsonify({"error": f"Error fetching harvests: {str(e)}"}), 500


# -------------------------------
# Route to get harvest statistics (total yield, average yield per crop)
# -------------------------------
# Route to get harvest statistics (total yield, avg yield per crop)
@harvest_routes.route("/harvests/stats", methods=["GET"])
def get_harvest_stats():
    conn = get_db()

    try:
        # Query to calculate total yield and average yield for each crop and include crop names
        stats = conn.execute("""
            SELECT crops.name AS crop_name, 
                   SUM(harvests.yield_amount) AS total_yield, 
                   AVG(harvests.yield_amount) AS avg_yield, 
                   COUNT(*) AS harvest_count
            FROM harvests
            JOIN crops ON harvests.crop_id = crops.id
            GROUP BY crops.name
        """).fetchall()

        # Prepare the stats data to return with crop names
        stats_data = [{"crop_name": stat["crop_name"],
                       "total_yield": stat["total_yield"],
                       "avg_yield": stat["avg_yield"],
                       "harvest_count": stat["harvest_count"]} for stat in stats]

        conn.close()
        return jsonify(stats_data), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": f"Error fetching harvest statistics: {str(e)}"}), 500

# -------------------------------
# Route to add a new harvest
# -------------------------------
@harvest_routes.route("/harvest/<int:crop_id>/<int:user_id>", methods=["POST"])
def add_harvest(crop_id, user_id):
    """Add a new harvest record for a specific crop."""
    data = request.get_json() or {}
    date = data.get("date")
    yield_amount = data.get("yield_amount")

    # Validate that date and yield_amount are provided
    if not date or not yield_amount:
        return jsonify({"error": "Date and yield_amount are required"}), 400

    if not validate_date(date):
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    # Validate that yield_amount is a valid number and positive
    try:
        yield_amount = float(yield_amount)
        if yield_amount <= 0:
            return jsonify({"error": "Yield must be a positive number."}), 400
    except ValueError:
        return jsonify({"error": "Invalid yield_amount. It should be a number."}), 400

    try:
        # Validate if crop exists and belongs to the user
        conn = get_db()
        crop = conn.execute("SELECT * FROM crops WHERE id=? AND user_id=?", (crop_id, user_id)).fetchone()

        if not crop:
            conn.close()
            return jsonify({"error": "Unauthorized or invalid crop"}), 403

        # Insert the harvest data into the database
        conn.execute(
            "INSERT INTO harvests (crop_id, date, yield_amount) VALUES (?, ?, ?)",
            (crop_id, date, yield_amount)
        )
        conn.commit()
        conn.close()

        return jsonify({"message": "Harvest added successfully"}), 201
    except Exception as e:
        return jsonify({"error": f"Error adding harvest: {str(e)}"}), 500

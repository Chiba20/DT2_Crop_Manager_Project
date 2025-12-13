from flask import Flask
from flask_cors import CORS

from model import init_db
from routes import auth_routes, crop_routes

# -------------------------------
# Create Flask app
# -------------------------------
app = Flask(__name__)
app.config["SECRET_KEY"] = "MYSECRET_KEY"  # Use for sessions if needed

# -------------------------------
# Enable CORS for frontend
# -------------------------------
CORS(app)  # Allow requests from React frontend

# -------------------------------
# Initialize database
# -------------------------------
init_db()

# -------------------------------
# Register Blueprints
# -------------------------------
app.register_blueprint(auth_routes)
app.register_blueprint(crop_routes)

# -------------------------------
# Root endpoint (optional)
# -------------------------------
@app.route("/")
def index():
    return "Crop Tracker Backend is running!"


# -------------------------------
# Run app
# -------------------------------
if __name__ == "__main__":
    app.run(debug=True, port=5000)

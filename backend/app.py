import os
from flask import Flask
from flask_cors import CORS

from crop_tracker.model import init_db
from crop_tracker.crops import auth_routes, crop_routes
from crop_tracker.harvest import harvest_routes
from crop_tracker.prediction import prediction_routes

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "MYSECRET_KEY")

# ✅ Allow both deployed frontend + local dev
ALLOWED_ORIGINS = [
    "https://dt2-crop-manager-project.onrender.com",
    "http://localhost:3000",
    "http://localhost:3010",
]

CORS(
    app,
    resources={r"/api/*": {"origins": ALLOWED_ORIGINS}},
    supports_credentials=True,
)

# Initialize DB (SQLite local or whatever you use)
init_db()

# Register Blueprints
app.register_blueprint(auth_routes)
app.register_blueprint(crop_routes)
app.register_blueprint(harvest_routes)
app.register_blueprint(prediction_routes)

@app.route("/")
def index():
    return "Crop Tracker Backend is running!"

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=True)

from flask import Flask
from flask_cors import CORS
from crop_tracker.model import init_db
from crop_tracker.crops import auth_routes, crop_routes
from crop_tracker.harvest import harvest_routes  # Import harvest routes
from crop_tracker.prediction import prediction_routes


app = Flask(__name__)
app.config["SECRET_KEY"] = "MYSECRET_KEY"  # Use for sessions if needed

# Enable CORS for frontend
CORS(app)  # Allow requests from React frontend

# Enable CORS for frontend with credentials
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

# Initialize database
init_db()

# Register Blueprints
app.register_blueprint(auth_routes, url_prefix='/api')
app.register_blueprint(crop_routes, url_prefix='/api')
app.register_blueprint(harvest_routes, url_prefix='/api')  # Register harvest routes
app.register_blueprint(prediction_routes)


# Root endpoint
@app.route("/")
def index():
    return "Crop Tracker Backend is running!"

if __name__ == "__main__":
    app.run(debug=True, port=5000)
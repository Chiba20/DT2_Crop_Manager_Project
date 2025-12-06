from flask import Flask
from flask_cors import CORS
from model import init_db
from routes import crop_routes

app = Flask(__name__)
CORS(app)

# Initialize database on start
init_db()

# Register API routes
app.register_blueprint(crop_routes)

if __name__ == "__main__":
    app.run(debug=True, port=5000)

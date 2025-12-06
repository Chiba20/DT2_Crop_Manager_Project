from flask import Flask
from flask_cors import CORS
from routes import crop_routes
from model import init_db

app = Flask(__name__)
CORS(app)

# Initialize database automatically
init_db()

# Register your routes
app.register_blueprint(crop_routes)

if __name__ == "__main__":
    app.run(debug=True, port=5001)

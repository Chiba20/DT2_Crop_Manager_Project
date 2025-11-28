from flask import Flask
from flask_cors import CORS
from routes import harvest_bp

def create_app():
    app = Flask(__name__)
    CORS(app)  # allow local frontend to call API
    app.register_blueprint(harvest_bp, url_prefix="/harvests")
    return app

if __name__ == "__main__":
    create_app().run(port=5002, debug=True)

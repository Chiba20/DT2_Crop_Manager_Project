# student2/backend/app.py
from flask import Flask, jsonify
from flask_cors import CORS
from routes import bp
import os

def create_app():
    app = Flask(__name__)
    CORS(app)
    app.register_blueprint(bp, url_prefix="/api")

    @app.route("/")
    def hello():
        return {"status":"ok","module":"student2 backend"}, 200

    @app.route("/debug/dbpath")
    def dbpath():
        from model import SHARED_DB_PATH
        exists = os.path.exists(SHARED_DB_PATH)
        return {"path": SHARED_DB_PATH, "exists": exists}, 200

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5001)

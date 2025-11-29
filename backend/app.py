import os
from flask import Flask
from flask_cors import CORS
from models import db

def create_app():
    app = Flask(__name__, static_folder=None)
    CORS(app)

    db_url = os.getenv("DATABASE_URL", "sqlite:///db.sqlite")
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    # register blueprints
    from crop_tracker.routes import bp as crop_bp
    from harvest_dashboard.routes import bp as harvest_bp
    from yield_predictor.routes import bp as predict_bp

    app.register_blueprint(crop_bp, url_prefix="/crops")
    app.register_blueprint(harvest_bp, url_prefix="/harvests")
    app.register_blueprint(predict_bp, url_prefix="/predict")

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5002)

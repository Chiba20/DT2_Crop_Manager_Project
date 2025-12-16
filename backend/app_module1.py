from flask import Flask
from config import Config
from extensions import db, jwt, cors

# blueprints
from auth import auth_bp
from module1_crops import crops_bp
from module2_harvests import harvests_bp
from module3_predict import predict_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    cors.init_app(app, resources={r"/*": {"origins": ["http://localhost:5173"]}})
    db.init_app(app)
    jwt.init_app(app)

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(crops_bp, url_prefix="/crops")          # module 1
    app.register_blueprint(harvests_bp, url_prefix="/harvests")    # module 2
    app.register_blueprint(predict_bp, url_prefix="/predict")      # module 3

    with app.app_context():
        db.create_all()

    @app.get("/health")
    def health():
        return {"ok": True, "message": "CropManager API running"}

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=8000)

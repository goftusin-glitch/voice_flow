from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os

db = SQLAlchemy()
migrate = Migrate()

def create_app(config_name='default'):
    app = Flask(__name__)

    # Disable strict slashes to prevent 308 redirects
    app.url_map.strict_slashes = False

    # Load config
    from app.config import config
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": app.config['FRONTEND_URL'],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })

    # Create upload directories
    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'audio')
    pdfs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'generated', 'pdfs')
    os.makedirs(uploads_dir, exist_ok=True)
    os.makedirs(pdfs_dir, exist_ok=True)

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.templates import templates_bp
    from app.routes.analysis import analysis_bp
    from app.routes.reports import reports_bp
    from app.routes.teams import teams_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.settings import settings_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(templates_bp, url_prefix='/api/templates')
    app.register_blueprint(analysis_bp, url_prefix='/api/analysis')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(teams_bp, url_prefix='/api/teams')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(settings_bp, url_prefix='/api/settings')

    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {"success": False, "message": "Resource not found"}, 404

    @app.errorhandler(500)
    def internal_error(error):
        return {"success": False, "message": "Internal server error"}, 500

    return app

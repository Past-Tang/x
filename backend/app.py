"""Flask application factory."""
import os
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

from config import config

db = SQLAlchemy()
migrate = Migrate()


def create_app(config_name=None):
    """Create and configure the Flask application."""
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Register blueprints
    from routes.accounts import accounts_bp
    from routes.targets import targets_bp
    from routes.reply_templates import reply_templates_bp
    from routes.post_jobs import post_jobs_bp
    from routes.post_contents import post_contents_bp
    from routes.logs import logs_bp
    from routes.settings import settings_bp
    
    app.register_blueprint(accounts_bp, url_prefix='/api/accounts')
    app.register_blueprint(targets_bp, url_prefix='/api/targets')
    app.register_blueprint(reply_templates_bp, url_prefix='/api/reply-templates')
    app.register_blueprint(post_jobs_bp, url_prefix='/api/post-jobs')
    app.register_blueprint(post_contents_bp, url_prefix='/api/post-contents')
    app.register_blueprint(logs_bp, url_prefix='/api/logs')
    app.register_blueprint(settings_bp, url_prefix='/api/settings')
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app

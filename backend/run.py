"""Main entry point for the Flask application."""
import os
import atexit
from app import create_app
from services.scheduler import init_scheduler, shutdown_scheduler

# Create the application
app = create_app()

# Initialize the scheduler
with app.app_context():
    # Initialize default settings
    from routes.settings import DEFAULT_SETTINGS
    from models.system_setting import SystemSetting
    from app import db
    
    for default in DEFAULT_SETTINGS:
        existing = SystemSetting.query.filter_by(key=default['key']).first()
        if not existing:
            setting = SystemSetting(
                key=default['key'],
                value=default['value'],
                value_type=default['value_type'],
                description=default['description']
            )
            db.session.add(setting)
    db.session.commit()

# Initialize scheduler (only in production or when explicitly enabled)
if os.environ.get('ENABLE_SCHEDULER', 'true').lower() == 'true':
    init_scheduler(app)
    atexit.register(shutdown_scheduler)


@app.route('/')
def index():
    """Health check endpoint."""
    return {'status': 'ok', 'message': 'Twitter Monitor API is running'}


@app.route('/api/health')
def health():
    """Health check endpoint for API."""
    from services.scheduler import get_scheduled_jobs
    return {
        'status': 'ok',
        'scheduler': get_scheduled_jobs()
    }


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)

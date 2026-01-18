"""System settings routes."""
from flask import Blueprint, request, jsonify
from app import db
from models.system_setting import SystemSetting

settings_bp = Blueprint('settings', __name__)

# Default settings to initialize
DEFAULT_SETTINGS = [
    {'key': 'twitter_api_base_url', 'value': 'https://api.twitterapi.io', 'value_type': 'string', 'description': 'Base URL for Twitter API'},
    {'key': 'twitter_api_key', 'value': '', 'value_type': 'string', 'description': 'API key for Twitter API'},
    {'key': 'account_hourly_limit', 'value': '10', 'value_type': 'int', 'description': 'Max actions per account per hour'},
    {'key': 'global_rate_limit', 'value': '60', 'value_type': 'int', 'description': 'Max API calls per minute globally'},
    {'key': 'min_random_delay', 'value': '3', 'value_type': 'int', 'description': 'Minimum random delay in seconds'},
    {'key': 'max_random_delay', 'value': '20', 'value_type': 'int', 'description': 'Maximum random delay in seconds'},
    {'key': 'account_failure_threshold', 'value': '3', 'value_type': 'int', 'description': 'Consecutive failures before marking account as suspect'},
    {'key': 'account_selection_strategy', 'value': 'round_robin', 'value_type': 'string', 'description': 'Account selection strategy (round_robin, random, weighted)'},
    {'key': 'reply_selection_strategy', 'value': 'round_robin', 'value_type': 'string', 'description': 'Reply template selection strategy (round_robin, random)'},
]


@settings_bp.route('', methods=['GET'])
def list_settings():
    """List all settings."""
    settings = SystemSetting.query.all()
    return jsonify({
        'success': True,
        'data': [s.to_dict() for s in settings]
    })


@settings_bp.route('/<key>', methods=['GET'])
def get_setting(key):
    """Get a setting by key."""
    setting = SystemSetting.query.filter_by(key=key).first_or_404()
    return jsonify({
        'success': True,
        'data': setting.to_dict()
    })


@settings_bp.route('/<key>', methods=['PUT'])
def update_setting(key):
    """Update a setting."""
    setting = SystemSetting.query.filter_by(key=key).first()
    data = request.get_json()
    
    if not setting:
        # Create if doesn't exist
        setting = SystemSetting(
            key=key,
            value_type=data.get('value_type', 'string'),
            description=data.get('description')
        )
        db.session.add(setting)
    
    if 'value' in data:
        setting.set_typed_value(data['value'])
    if 'description' in data:
        setting.description = data['description']
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': setting.to_dict()
    })


@settings_bp.route('/batch', methods=['PUT'])
def update_settings_batch():
    """Update multiple settings at once."""
    data = request.get_json()
    settings_data = data.get('settings', {})
    
    for key, value in settings_data.items():
        setting = SystemSetting.query.filter_by(key=key).first()
        if setting:
            setting.set_typed_value(value)
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Settings updated successfully'
    })


@settings_bp.route('/init', methods=['POST'])
def init_settings():
    """Initialize default settings if they don't exist."""
    created = []
    
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
            created.append(default['key'])
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': f'Created {len(created)} settings',
        'created': created
    })

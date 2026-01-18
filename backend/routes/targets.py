"""Monitor target management routes."""
from flask import Blueprint, request, jsonify
from app import db
from models.monitor_target import MonitorTarget

targets_bp = Blueprint('targets', __name__)


@targets_bp.route('', methods=['GET'])
def list_targets():
    """List all monitor targets with optional filtering."""
    status = request.args.get('status')
    
    query = MonitorTarget.query
    if status:
        query = query.filter_by(status=status)
    
    targets = query.order_by(MonitorTarget.created_at.desc()).all()
    return jsonify({
        'success': True,
        'data': [t.to_dict() for t in targets]
    })


@targets_bp.route('/<int:target_id>', methods=['GET'])
def get_target(target_id):
    """Get a single target by ID."""
    target = MonitorTarget.query.get_or_404(target_id)
    return jsonify({
        'success': True,
        'data': target.to_dict()
    })


@targets_bp.route('', methods=['POST'])
def create_target():
    """Create a new monitor target."""
    data = request.get_json()
    
    if not data.get('target_user_id'):
        return jsonify({
            'success': False,
            'error': 'target_user_id is required'
        }), 400
    
    # Check for duplicate
    existing = MonitorTarget.query.filter_by(target_user_id=data['target_user_id']).first()
    if existing:
        return jsonify({
            'success': False,
            'error': 'Target with this user ID already exists'
        }), 400
    
    target = MonitorTarget(
        target_user_id=data['target_user_id'],
        target_username=data.get('target_username'),
        name=data.get('name'),
        status=data.get('status', 'active'),
        check_interval_minutes=data.get('check_interval_minutes', 15),
        fetch_tweet_count=data.get('fetch_tweet_count', 10),
        max_new_tweets_per_check=data.get('max_new_tweets_per_check', 3)
    )
    
    db.session.add(target)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': target.to_dict()
    }), 201


@targets_bp.route('/<int:target_id>', methods=['PUT'])
def update_target(target_id):
    """Update an existing monitor target."""
    target = MonitorTarget.query.get_or_404(target_id)
    data = request.get_json()
    
    if 'target_user_id' in data:
        # Check for duplicate if changing user ID
        if data['target_user_id'] != target.target_user_id:
            existing = MonitorTarget.query.filter_by(target_user_id=data['target_user_id']).first()
            if existing:
                return jsonify({
                    'success': False,
                    'error': 'Target with this user ID already exists'
                }), 400
        target.target_user_id = data['target_user_id']
    
    if 'target_username' in data:
        target.target_username = data['target_username']
    if 'name' in data:
        target.name = data['name']
    if 'status' in data:
        target.status = data['status']
    if 'check_interval_minutes' in data:
        target.check_interval_minutes = data['check_interval_minutes']
    if 'fetch_tweet_count' in data:
        target.fetch_tweet_count = data['fetch_tweet_count']
    if 'max_new_tweets_per_check' in data:
        target.max_new_tweets_per_check = data['max_new_tweets_per_check']
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': target.to_dict()
    })


@targets_bp.route('/<int:target_id>', methods=['DELETE'])
def delete_target(target_id):
    """Delete a monitor target."""
    target = MonitorTarget.query.get_or_404(target_id)
    db.session.delete(target)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Target deleted successfully'
    })


@targets_bp.route('/<int:target_id>/toggle-status', methods=['POST'])
def toggle_target_status(target_id):
    """Toggle target status between active and disabled."""
    target = MonitorTarget.query.get_or_404(target_id)
    
    if target.status == 'active':
        target.status = 'disabled'
    else:
        target.status = 'active'
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': target.to_dict()
    })

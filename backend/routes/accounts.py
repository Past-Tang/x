"""Account management routes."""
from flask import Blueprint, request, jsonify
from app import db
from models.account import Account

accounts_bp = Blueprint('accounts', __name__)


@accounts_bp.route('', methods=['GET'])
def list_accounts():
    """List all accounts with optional filtering."""
    status = request.args.get('status')
    
    query = Account.query
    if status:
        query = query.filter_by(status=status)
    
    accounts = query.order_by(Account.created_at.desc()).all()
    return jsonify({
        'success': True,
        'data': [acc.to_dict() for acc in accounts]
    })


@accounts_bp.route('/<int:account_id>', methods=['GET'])
def get_account(account_id):
    """Get a single account by ID."""
    account = Account.query.get_or_404(account_id)
    return jsonify({
        'success': True,
        'data': account.to_dict()
    })


@accounts_bp.route('', methods=['POST'])
def create_account():
    """Create a new account."""
    data = request.get_json()
    
    if not data.get('name') or not data.get('auth_token'):
        return jsonify({
            'success': False,
            'error': 'Name and auth_token are required'
        }), 400
    
    account = Account(
        name=data['name'],
        twitter_user_id=data.get('twitter_user_id'),
        twitter_handle=data.get('twitter_handle'),
        status=data.get('status', 'active'),
        weight=data.get('weight', 1),
        max_concurrent_usage=data.get('max_concurrent_usage', 3)
    )
    account.set_token(data['auth_token'])
    
    db.session.add(account)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': account.to_dict()
    }), 201


@accounts_bp.route('/<int:account_id>', methods=['PUT'])
def update_account(account_id):
    """Update an existing account."""
    account = Account.query.get_or_404(account_id)
    data = request.get_json()
    
    if 'name' in data:
        account.name = data['name']
    if 'twitter_user_id' in data:
        account.twitter_user_id = data['twitter_user_id']
    if 'twitter_handle' in data:
        account.twitter_handle = data['twitter_handle']
    if 'status' in data:
        account.status = data['status']
    if 'weight' in data:
        account.weight = data['weight']
    if 'max_concurrent_usage' in data:
        account.max_concurrent_usage = data['max_concurrent_usage']
    if 'auth_token' in data:
        account.set_token(data['auth_token'])
    
    # Reset failure state if reactivating
    if data.get('status') == 'active' and account.status in ['disabled', 'suspect']:
        account.consecutive_failures = 0
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': account.to_dict()
    })


@accounts_bp.route('/<int:account_id>', methods=['DELETE'])
def delete_account(account_id):
    """Delete an account."""
    account = Account.query.get_or_404(account_id)
    db.session.delete(account)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Account deleted successfully'
    })


@accounts_bp.route('/<int:account_id>/toggle-status', methods=['POST'])
def toggle_account_status(account_id):
    """Toggle account status between active and disabled."""
    account = Account.query.get_or_404(account_id)
    
    if account.status == 'active':
        account.status = 'disabled'
    else:
        account.status = 'active'
        account.consecutive_failures = 0
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': account.to_dict()
    })


@accounts_bp.route('/available', methods=['GET'])
def get_available_accounts():
    """Get accounts that can currently be used."""
    accounts = Account.query.filter_by(status='active').all()
    available = [acc for acc in accounts if acc.can_use()]
    
    return jsonify({
        'success': True,
        'data': [acc.to_dict() for acc in available]
    })

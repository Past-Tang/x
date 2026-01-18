"""Execution logs routes."""
from flask import Blueprint, request, jsonify
from datetime import datetime
from app import db
from models.execution_log import ExecutionLog

logs_bp = Blueprint('logs', __name__)


@logs_bp.route('', methods=['GET'])
def list_logs():
    """List execution logs with filtering and pagination."""
    # Filters
    log_type = request.args.get('log_type')
    account_id = request.args.get('account_id', type=int)
    target_id = request.args.get('target_id', type=int)
    job_id = request.args.get('job_id', type=int)
    tweet_id = request.args.get('tweet_id')
    result = request.args.get('result')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    per_page = min(per_page, 100)  # Max 100 per page
    
    query = ExecutionLog.query
    
    if log_type:
        query = query.filter_by(log_type=log_type)
    if account_id:
        query = query.filter_by(account_id=account_id)
    if target_id:
        query = query.filter_by(target_id=target_id)
    if job_id:
        query = query.filter_by(job_id=job_id)
    if tweet_id:
        query = query.filter_by(tweet_id=tweet_id)
    if result:
        query = query.filter_by(result=result)
    
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(ExecutionLog.created_at >= start_dt)
        except ValueError:
            pass
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(ExecutionLog.created_at <= end_dt)
        except ValueError:
            pass
    
    # Order by most recent first
    query = query.order_by(ExecutionLog.created_at.desc())
    
    # Paginate
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'success': True,
        'data': [log.to_dict() for log in pagination.items],
        'pagination': {
            'page': pagination.page,
            'per_page': pagination.per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }
    })


@logs_bp.route('/<int:log_id>', methods=['GET'])
def get_log(log_id):
    """Get a single log entry by ID."""
    log = ExecutionLog.query.get_or_404(log_id)
    return jsonify({
        'success': True,
        'data': log.to_dict()
    })


@logs_bp.route('/stats', methods=['GET'])
def get_stats():
    """Get log statistics."""
    # Total counts by type
    type_counts = db.session.query(
        ExecutionLog.log_type,
        db.func.count(ExecutionLog.id)
    ).group_by(ExecutionLog.log_type).all()
    
    # Success/failure counts
    result_counts = db.session.query(
        ExecutionLog.result,
        db.func.count(ExecutionLog.id)
    ).group_by(ExecutionLog.result).all()
    
    # Recent activity (last 24 hours)
    from datetime import timedelta
    yesterday = datetime.utcnow() - timedelta(hours=24)
    recent_count = ExecutionLog.query.filter(
        ExecutionLog.created_at >= yesterday
    ).count()
    
    return jsonify({
        'success': True,
        'data': {
            'by_type': {t: c for t, c in type_counts},
            'by_result': {r: c for r, c in result_counts},
            'recent_24h': recent_count
        }
    })

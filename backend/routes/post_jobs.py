"""Post job management routes."""
from flask import Blueprint, request, jsonify
from app import db
from models.post_job import PostJob

post_jobs_bp = Blueprint('post_jobs', __name__)


@post_jobs_bp.route('', methods=['GET'])
def list_jobs():
    """List all post jobs with optional filtering."""
    status = request.args.get('status')
    
    query = PostJob.query
    if status:
        query = query.filter_by(status=status)
    
    jobs = query.order_by(PostJob.created_at.desc()).all()
    return jsonify({
        'success': True,
        'data': [j.to_dict() for j in jobs]
    })


@post_jobs_bp.route('/<int:job_id>', methods=['GET'])
def get_job(job_id):
    """Get a single job by ID."""
    job = PostJob.query.get_or_404(job_id)
    return jsonify({
        'success': True,
        'data': job.to_dict()
    })


@post_jobs_bp.route('', methods=['POST'])
def create_job():
    """Create a new post job."""
    data = request.get_json()
    
    if not data.get('name'):
        return jsonify({
            'success': False,
            'error': 'Name is required'
        }), 400
    
    job = PostJob(
        name=data['name'],
        status=data.get('status', 'active'),
        interval_minutes=data.get('interval_minutes', 60),
        account_strategy=data.get('account_strategy', 'round_robin')
    )
    
    db.session.add(job)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': job.to_dict()
    }), 201


@post_jobs_bp.route('/<int:job_id>', methods=['PUT'])
def update_job(job_id):
    """Update an existing post job."""
    job = PostJob.query.get_or_404(job_id)
    data = request.get_json()
    
    if 'name' in data:
        job.name = data['name']
    if 'status' in data:
        job.status = data['status']
    if 'interval_minutes' in data:
        job.interval_minutes = data['interval_minutes']
    if 'account_strategy' in data:
        job.account_strategy = data['account_strategy']
    if 'current_content_index' in data:
        job.current_content_index = data['current_content_index']
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': job.to_dict()
    })


@post_jobs_bp.route('/<int:job_id>', methods=['DELETE'])
def delete_job(job_id):
    """Delete a post job."""
    job = PostJob.query.get_or_404(job_id)
    db.session.delete(job)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Job deleted successfully'
    })


@post_jobs_bp.route('/<int:job_id>/toggle-status', methods=['POST'])
def toggle_job_status(job_id):
    """Toggle job status between active and disabled."""
    job = PostJob.query.get_or_404(job_id)
    
    if job.status == 'active':
        job.status = 'disabled'
    else:
        job.status = 'active'
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': job.to_dict()
    })


@post_jobs_bp.route('/<int:job_id>/run', methods=['POST'])
def run_job_now(job_id):
    """Trigger a job to run immediately."""
    job = PostJob.query.get_or_404(job_id)
    
    # Import and run the post service
    from services.post_service import execute_post_job
    result = execute_post_job(job.id)
    
    return jsonify({
        'success': result.get('success', False),
        'data': result
    })

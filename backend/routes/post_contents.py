"""Post content management routes."""
from flask import Blueprint, request, jsonify
from app import db
from models.post_content import PostContent

post_contents_bp = Blueprint('post_contents', __name__)


@post_contents_bp.route('', methods=['GET'])
def list_contents():
    """List all post contents with optional filtering."""
    status = request.args.get('status')
    
    query = PostContent.query
    if status:
        query = query.filter_by(status=status)
    
    contents = query.order_by(PostContent.sort_order, PostContent.id).all()
    return jsonify({
        'success': True,
        'data': [c.to_dict() for c in contents]
    })


@post_contents_bp.route('/<int:content_id>', methods=['GET'])
def get_content(content_id):
    """Get a single content by ID."""
    content = PostContent.query.get_or_404(content_id)
    return jsonify({
        'success': True,
        'data': content.to_dict()
    })


@post_contents_bp.route('', methods=['POST'])
def create_content():
    """Create a new post content."""
    data = request.get_json()
    
    if not data.get('text'):
        return jsonify({
            'success': False,
            'error': 'Text is required'
        }), 400
    
    # Get max sort order
    max_order = db.session.query(db.func.max(PostContent.sort_order)).scalar() or 0
    
    content = PostContent(
        text=data['text'],
        link=data.get('link'),
        status=data.get('status', 'active'),
        sort_order=data.get('sort_order', max_order + 1)
    )
    
    db.session.add(content)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': content.to_dict()
    }), 201


@post_contents_bp.route('/<int:content_id>', methods=['PUT'])
def update_content(content_id):
    """Update an existing post content."""
    content = PostContent.query.get_or_404(content_id)
    data = request.get_json()
    
    if 'text' in data:
        content.text = data['text']
    if 'link' in data:
        content.link = data['link']
    if 'status' in data:
        content.status = data['status']
    if 'sort_order' in data:
        content.sort_order = data['sort_order']
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': content.to_dict()
    })


@post_contents_bp.route('/<int:content_id>', methods=['DELETE'])
def delete_content(content_id):
    """Delete a post content."""
    content = PostContent.query.get_or_404(content_id)
    db.session.delete(content)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Content deleted successfully'
    })


@post_contents_bp.route('/<int:content_id>/toggle-status', methods=['POST'])
def toggle_content_status(content_id):
    """Toggle content status between active and disabled."""
    content = PostContent.query.get_or_404(content_id)
    
    if content.status == 'active':
        content.status = 'disabled'
    else:
        content.status = 'active'
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': content.to_dict()
    })


@post_contents_bp.route('/reorder', methods=['POST'])
def reorder_contents():
    """Reorder contents by providing an ordered list of IDs."""
    data = request.get_json()
    content_ids = data.get('ids', [])
    
    for index, content_id in enumerate(content_ids):
        content = PostContent.query.get(content_id)
        if content:
            content.sort_order = index
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Contents reordered successfully'
    })

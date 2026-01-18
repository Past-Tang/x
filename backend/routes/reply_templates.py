"""Reply template management routes."""
from flask import Blueprint, request, jsonify
from app import db
from models.reply_template import ReplyTemplate

reply_templates_bp = Blueprint('reply_templates', __name__)


@reply_templates_bp.route('', methods=['GET'])
def list_templates():
    """List all reply templates with optional filtering."""
    status = request.args.get('status')
    scope = request.args.get('scope')
    target_id = request.args.get('target_id', type=int)
    
    query = ReplyTemplate.query
    if status:
        query = query.filter_by(status=status)
    if scope:
        query = query.filter_by(scope=scope)
    if target_id:
        query = query.filter_by(target_id=target_id)
    
    templates = query.order_by(ReplyTemplate.sort_order, ReplyTemplate.id).all()
    return jsonify({
        'success': True,
        'data': [t.to_dict() for t in templates]
    })


@reply_templates_bp.route('/<int:template_id>', methods=['GET'])
def get_template(template_id):
    """Get a single template by ID."""
    template = ReplyTemplate.query.get_or_404(template_id)
    return jsonify({
        'success': True,
        'data': template.to_dict()
    })


@reply_templates_bp.route('', methods=['POST'])
def create_template():
    """Create a new reply template."""
    data = request.get_json()
    
    if not data.get('content'):
        return jsonify({
            'success': False,
            'error': 'Content is required'
        }), 400
    
    # Get max sort order
    max_order = db.session.query(db.func.max(ReplyTemplate.sort_order)).scalar() or 0
    
    template = ReplyTemplate(
        content=data['content'],
        status=data.get('status', 'active'),
        scope=data.get('scope', 'global'),
        target_id=data.get('target_id'),
        sort_order=data.get('sort_order', max_order + 1)
    )
    
    db.session.add(template)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': template.to_dict()
    }), 201


@reply_templates_bp.route('/<int:template_id>', methods=['PUT'])
def update_template(template_id):
    """Update an existing reply template."""
    template = ReplyTemplate.query.get_or_404(template_id)
    data = request.get_json()
    
    if 'content' in data:
        template.content = data['content']
    if 'status' in data:
        template.status = data['status']
    if 'scope' in data:
        template.scope = data['scope']
    if 'target_id' in data:
        template.target_id = data['target_id']
    if 'sort_order' in data:
        template.sort_order = data['sort_order']
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': template.to_dict()
    })


@reply_templates_bp.route('/<int:template_id>', methods=['DELETE'])
def delete_template(template_id):
    """Delete a reply template."""
    template = ReplyTemplate.query.get_or_404(template_id)
    db.session.delete(template)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Template deleted successfully'
    })


@reply_templates_bp.route('/<int:template_id>/toggle-status', methods=['POST'])
def toggle_template_status(template_id):
    """Toggle template status between active and disabled."""
    template = ReplyTemplate.query.get_or_404(template_id)
    
    if template.status == 'active':
        template.status = 'disabled'
    else:
        template.status = 'active'
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': template.to_dict()
    })


@reply_templates_bp.route('/reorder', methods=['POST'])
def reorder_templates():
    """Reorder templates by providing an ordered list of IDs."""
    data = request.get_json()
    template_ids = data.get('ids', [])
    
    for index, template_id in enumerate(template_ids):
        template = ReplyTemplate.query.get(template_id)
        if template:
            template.sort_order = index
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Templates reordered successfully'
    })

"""Reply template model for comment content pool."""
from datetime import datetime
from app import db


class ReplyTemplate(db.Model):
    """Reply templates for auto-commenting on tweets."""
    __tablename__ = 'reply_templates'
    
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)  # Reply text content
    status = db.Column(db.String(20), default='active')  # active, disabled
    
    # Scope: global or specific target
    scope = db.Column(db.String(20), default='global')  # global, target
    target_id = db.Column(db.Integer, db.ForeignKey('monitor_targets.id'), nullable=True)
    
    # Ordering for round-robin
    sort_order = db.Column(db.Integer, default=0)
    
    # Usage tracking
    usage_count = db.Column(db.Integer, default=0)
    last_used_at = db.Column(db.DateTime, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    target = db.relationship('MonitorTarget', backref='reply_templates')
    
    def record_usage(self):
        """Record that this template was used."""
        self.usage_count += 1
        self.last_used_at = datetime.utcnow()
    
    def to_dict(self):
        """Convert to dictionary for API response."""
        return {
            'id': self.id,
            'content': self.content,
            'status': self.status,
            'scope': self.scope,
            'target_id': self.target_id,
            'sort_order': self.sort_order,
            'usage_count': self.usage_count,
            'last_used_at': self.last_used_at.isoformat() if self.last_used_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

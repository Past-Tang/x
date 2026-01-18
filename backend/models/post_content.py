"""Post content model for auto-posting content pool."""
from datetime import datetime
from app import db


class PostContent(db.Model):
    """Content pool for auto-posting."""
    __tablename__ = 'post_contents'
    
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)  # Tweet text
    link = db.Column(db.String(500), nullable=True)  # Optional link
    status = db.Column(db.String(20), default='active')  # active, disabled
    
    # Ordering for round-robin
    sort_order = db.Column(db.Integer, default=0)
    
    # Usage tracking
    usage_count = db.Column(db.Integer, default=0)
    last_used_at = db.Column(db.DateTime, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def get_full_content(self):
        """Get the full tweet content (text + link)."""
        if self.link:
            return f"{self.text}\n{self.link}"
        return self.text
    
    def record_usage(self):
        """Record that this content was used."""
        self.usage_count += 1
        self.last_used_at = datetime.utcnow()
    
    def to_dict(self):
        """Convert to dictionary for API response."""
        return {
            'id': self.id,
            'text': self.text,
            'link': self.link,
            'status': self.status,
            'sort_order': self.sort_order,
            'usage_count': self.usage_count,
            'last_used_at': self.last_used_at.isoformat() if self.last_used_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

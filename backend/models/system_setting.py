"""System settings model for configurable parameters."""
from datetime import datetime
from app import db


class SystemSetting(db.Model):
    """System-wide configuration settings."""
    __tablename__ = 'system_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Text, nullable=True)
    value_type = db.Column(db.String(20), default='string')  # string, int, bool, json
    description = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def get_typed_value(self):
        """Get value with proper type conversion."""
        if self.value is None:
            return None
        
        if self.value_type == 'int':
            return int(self.value)
        elif self.value_type == 'bool':
            return self.value.lower() in ('true', '1', 'yes')
        elif self.value_type == 'json':
            import json
            return json.loads(self.value)
        return self.value
    
    def set_typed_value(self, value):
        """Set value with proper type conversion."""
        if self.value_type == 'json':
            import json
            self.value = json.dumps(value)
        else:
            self.value = str(value)
    
    def to_dict(self):
        """Convert to dictionary for API response."""
        return {
            'id': self.id,
            'key': self.key,
            'value': self.get_typed_value(),
            'value_type': self.value_type,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

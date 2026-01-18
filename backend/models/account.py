"""Account model for AuthToken management."""
from datetime import datetime
from cryptography.fernet import Fernet
from app import db
from flask import current_app


class Account(db.Model):
    """Account pool for storing auth tokens."""
    __tablename__ = 'accounts'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)  # Custom name/handle
    twitter_user_id = db.Column(db.String(50), nullable=True)  # Twitter user ID
    twitter_handle = db.Column(db.String(50), nullable=True)  # Twitter @handle
    encrypted_token = db.Column(db.Text, nullable=False)  # Encrypted auth token
    status = db.Column(db.String(20), default='active')  # active, disabled, suspect
    
    # Usage tracking
    last_used_at = db.Column(db.DateTime, nullable=True)
    last_success_at = db.Column(db.DateTime, nullable=True)
    last_failure_at = db.Column(db.DateTime, nullable=True)
    last_failure_reason = db.Column(db.Text, nullable=True)
    consecutive_failures = db.Column(db.Integer, default=0)
    
    # Rate limiting
    hourly_action_count = db.Column(db.Integer, default=0)
    hourly_reset_at = db.Column(db.DateTime, nullable=True)
    
    # Concurrency control
    current_usage_count = db.Column(db.Integer, default=0)
    max_concurrent_usage = db.Column(db.Integer, default=3)
    
    # Weight for weighted selection
    weight = db.Column(db.Integer, default=1)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def set_token(self, token):
        """Encrypt and store the auth token."""
        key = current_app.config['ENCRYPTION_KEY'].encode()
        f = Fernet(key)
        self.encrypted_token = f.encrypt(token.encode()).decode()
    
    def get_token(self):
        """Decrypt and return the auth token."""
        key = current_app.config['ENCRYPTION_KEY'].encode()
        f = Fernet(key)
        return f.decrypt(self.encrypted_token.encode()).decode()
    
    def get_masked_token(self):
        """Return masked version of token for display."""
        token = self.get_token()
        if len(token) <= 8:
            return '*' * len(token)
        return token[:4] + '*' * (len(token) - 8) + token[-4:]
    
    def record_success(self):
        """Record a successful API call."""
        self.last_used_at = datetime.utcnow()
        self.last_success_at = datetime.utcnow()
        self.consecutive_failures = 0
        self._increment_hourly_count()
    
    def record_failure(self, reason):
        """Record a failed API call."""
        self.last_used_at = datetime.utcnow()
        self.last_failure_at = datetime.utcnow()
        self.last_failure_reason = reason
        self.consecutive_failures += 1
        self._increment_hourly_count()
        
        # Mark as suspect if threshold reached
        threshold = current_app.config.get('ACCOUNT_FAILURE_THRESHOLD', 3)
        if self.consecutive_failures >= threshold:
            self.status = 'suspect'
    
    def _increment_hourly_count(self):
        """Increment hourly action count, resetting if needed."""
        now = datetime.utcnow()
        if self.hourly_reset_at is None or (now - self.hourly_reset_at).total_seconds() > 3600:
            self.hourly_action_count = 1
            self.hourly_reset_at = now
        else:
            self.hourly_action_count += 1
    
    def can_use(self):
        """Check if account can be used for an action."""
        if self.status != 'active':
            return False
        
        # Check hourly limit
        hourly_limit = current_app.config.get('DEFAULT_ACCOUNT_HOURLY_LIMIT', 10)
        now = datetime.utcnow()
        if self.hourly_reset_at and (now - self.hourly_reset_at).total_seconds() <= 3600:
            if self.hourly_action_count >= hourly_limit:
                return False
        
        # Check concurrent usage
        if self.current_usage_count >= self.max_concurrent_usage:
            return False
        
        return True
    
    def acquire(self):
        """Acquire usage lock on account."""
        if self.can_use():
            self.current_usage_count += 1
            return True
        return False
    
    def release(self):
        """Release usage lock on account."""
        if self.current_usage_count > 0:
            self.current_usage_count -= 1
    
    def to_dict(self, include_token_mask=True):
        """Convert to dictionary for API response."""
        data = {
            'id': self.id,
            'name': self.name,
            'twitter_user_id': self.twitter_user_id,
            'twitter_handle': self.twitter_handle,
            'status': self.status,
            'last_used_at': self.last_used_at.isoformat() if self.last_used_at else None,
            'last_success_at': self.last_success_at.isoformat() if self.last_success_at else None,
            'last_failure_at': self.last_failure_at.isoformat() if self.last_failure_at else None,
            'last_failure_reason': self.last_failure_reason,
            'consecutive_failures': self.consecutive_failures,
            'hourly_action_count': self.hourly_action_count,
            'weight': self.weight,
            'max_concurrent_usage': self.max_concurrent_usage,
            'current_usage_count': self.current_usage_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        if include_token_mask:
            try:
                data['token_masked'] = self.get_masked_token()
            except Exception:
                data['token_masked'] = '********'
        return data

"""Execution log model for tracking all operations."""
from datetime import datetime
from app import db


class ExecutionLog(db.Model):
    """Logs for all executed operations."""
    __tablename__ = 'execution_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Log type
    log_type = db.Column(db.String(20), nullable=False)  # monitor, reply, post
    
    # Related entities
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=True)
    target_id = db.Column(db.Integer, db.ForeignKey('monitor_targets.id'), nullable=True)
    job_id = db.Column(db.Integer, db.ForeignKey('post_jobs.id'), nullable=True)
    
    # Tweet information
    tweet_id = db.Column(db.String(50), nullable=True)
    tweet_author_id = db.Column(db.String(50), nullable=True)
    
    # Content used
    content_id = db.Column(db.Integer, nullable=True)  # reply_template_id or post_content_id
    content_text = db.Column(db.Text, nullable=True)
    
    # Result
    result = db.Column(db.String(20), nullable=False)  # success, failed
    error_message = db.Column(db.Text, nullable=True)
    api_response = db.Column(db.Text, nullable=True)
    
    # Timing
    execution_time_ms = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    account = db.relationship('Account', backref='logs')
    target = db.relationship('MonitorTarget', backref='logs')
    job = db.relationship('PostJob', backref='logs')
    
    def to_dict(self):
        """Convert to dictionary for API response."""
        return {
            'id': self.id,
            'log_type': self.log_type,
            'account_id': self.account_id,
            'account_name': self.account.name if self.account else None,
            'target_id': self.target_id,
            'target_username': self.target.target_username if self.target else None,
            'job_id': self.job_id,
            'job_name': self.job.name if self.job else None,
            'tweet_id': self.tweet_id,
            'tweet_author_id': self.tweet_author_id,
            'content_id': self.content_id,
            'content_text': self.content_text,
            'result': self.result,
            'error_message': self.error_message,
            'api_response': self.api_response,
            'execution_time_ms': self.execution_time_ms,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

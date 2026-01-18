"""Post job model for auto-posting configuration."""
from datetime import datetime, timedelta
from app import db


class PostJob(db.Model):
    """Auto-posting job configuration."""
    __tablename__ = 'post_jobs'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), default='active')  # active, disabled
    
    # Scheduling
    interval_minutes = db.Column(db.Integer, default=60)  # 15, 60 etc.
    
    # Content rotation pointer
    current_content_index = db.Column(db.Integer, default=0)
    
    # Account selection strategy
    account_strategy = db.Column(db.String(20), default='round_robin')  # round_robin, random, weighted
    
    # Tracking
    last_run_at = db.Column(db.DateTime, nullable=True)
    next_run_at = db.Column(db.DateTime, nullable=True)
    last_run_result = db.Column(db.String(20), nullable=True)  # success, failed
    last_run_error = db.Column(db.Text, nullable=True)
    last_tweet_id = db.Column(db.String(50), nullable=True)
    total_posts = db.Column(db.Integer, default=0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def update_after_run(self, success, error=None, tweet_id=None, advance_pointer=True):
        """Update job state after a run."""
        self.last_run_at = datetime.utcnow()
        self.next_run_at = datetime.utcnow() + timedelta(minutes=self.interval_minutes)
        self.last_run_result = 'success' if success else 'failed'
        self.last_run_error = error
        
        if success:
            self.last_tweet_id = tweet_id
            self.total_posts += 1
            if advance_pointer:
                self.current_content_index += 1
    
    def to_dict(self):
        """Convert to dictionary for API response."""
        return {
            'id': self.id,
            'name': self.name,
            'status': self.status,
            'interval_minutes': self.interval_minutes,
            'current_content_index': self.current_content_index,
            'account_strategy': self.account_strategy,
            'last_run_at': self.last_run_at.isoformat() if self.last_run_at else None,
            'next_run_at': self.next_run_at.isoformat() if self.next_run_at else None,
            'last_run_result': self.last_run_result,
            'last_run_error': self.last_run_error,
            'last_tweet_id': self.last_tweet_id,
            'total_posts': self.total_posts,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

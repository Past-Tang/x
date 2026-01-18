"""Monitor target model for tracking Twitter accounts to monitor."""
from datetime import datetime
from app import db


class MonitorTarget(db.Model):
    """Target Twitter accounts to monitor for new tweets."""
    __tablename__ = 'monitor_targets'
    
    id = db.Column(db.Integer, primary_key=True)
    target_user_id = db.Column(db.String(50), nullable=False, unique=True)
    target_username = db.Column(db.String(50), nullable=True)  # @handle
    name = db.Column(db.String(100), nullable=True)  # Display name
    status = db.Column(db.String(20), default='active')  # active, disabled
    
    # Check configuration
    check_interval_minutes = db.Column(db.Integer, default=15)  # 15, 30, 60 etc.
    fetch_tweet_count = db.Column(db.Integer, default=10)  # Number of tweets to fetch per check
    max_new_tweets_per_check = db.Column(db.Integer, default=3)  # Max new tweets to process per check
    
    # Watermark for deduplication
    last_seen_tweet_id = db.Column(db.String(50), nullable=True)
    
    # Tracking
    last_check_at = db.Column(db.DateTime, nullable=True)
    next_check_at = db.Column(db.DateTime, nullable=True)
    last_check_result = db.Column(db.String(20), nullable=True)  # success, failed
    last_check_error = db.Column(db.Text, nullable=True)
    total_tweets_found = db.Column(db.Integer, default=0)
    total_replies_sent = db.Column(db.Integer, default=0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def update_after_check(self, success, error=None, tweets_found=0):
        """Update target state after a check."""
        from datetime import timedelta
        
        self.last_check_at = datetime.utcnow()
        self.next_check_at = datetime.utcnow() + timedelta(minutes=self.check_interval_minutes)
        self.last_check_result = 'success' if success else 'failed'
        self.last_check_error = error
        
        if success:
            self.total_tweets_found += tweets_found
    
    def to_dict(self):
        """Convert to dictionary for API response."""
        return {
            'id': self.id,
            'target_user_id': self.target_user_id,
            'target_username': self.target_username,
            'name': self.name,
            'status': self.status,
            'check_interval_minutes': self.check_interval_minutes,
            'fetch_tweet_count': self.fetch_tweet_count,
            'max_new_tweets_per_check': self.max_new_tweets_per_check,
            'last_seen_tweet_id': self.last_seen_tweet_id,
            'last_check_at': self.last_check_at.isoformat() if self.last_check_at else None,
            'next_check_at': self.next_check_at.isoformat() if self.next_check_at else None,
            'last_check_result': self.last_check_result,
            'last_check_error': self.last_check_error,
            'total_tweets_found': self.total_tweets_found,
            'total_replies_sent': self.total_replies_sent,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

"""Replied tweet model for deduplication tracking."""
from datetime import datetime
from app import db


class RepliedTweet(db.Model):
    """Track which tweets have been replied to for deduplication."""
    __tablename__ = 'replied_tweets'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Composite unique key for deduplication
    target_user_id = db.Column(db.String(50), nullable=False)
    tweet_id = db.Column(db.String(50), nullable=False)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False)
    
    # Tracking
    replied_at = db.Column(db.DateTime, default=datetime.utcnow)
    reply_tweet_id = db.Column(db.String(50), nullable=True)  # The tweet ID of our reply
    
    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('target_user_id', 'tweet_id', 'account_id', name='unique_reply'),
    )
    
    # Relationship
    account = db.relationship('Account', backref='replied_tweets')
    
    def to_dict(self):
        """Convert to dictionary for API response."""
        return {
            'id': self.id,
            'target_user_id': self.target_user_id,
            'tweet_id': self.tweet_id,
            'account_id': self.account_id,
            'replied_at': self.replied_at.isoformat() if self.replied_at else None,
            'reply_tweet_id': self.reply_tweet_id
        }

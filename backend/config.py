"""Application configuration."""
import os
from cryptography.fernet import Fernet


class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///twitter_monitor.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Encryption key for token storage
    ENCRYPTION_KEY = os.environ.get('ENCRYPTION_KEY', Fernet.generate_key().decode())
    
    # Third-party API configuration
    TWITTER_API_BASE_URL = os.environ.get('TWITTER_API_BASE_URL', 'https://api.twitterapi.io')
    TWITTER_API_KEY = os.environ.get('TWITTER_API_KEY', '')
    
    # Rate limiting defaults
    DEFAULT_ACCOUNT_HOURLY_LIMIT = int(os.environ.get('DEFAULT_ACCOUNT_HOURLY_LIMIT', 10))
    DEFAULT_GLOBAL_RATE_LIMIT = int(os.environ.get('DEFAULT_GLOBAL_RATE_LIMIT', 60))
    
    # Scheduler defaults
    DEFAULT_MONITOR_INTERVAL_MINUTES = int(os.environ.get('DEFAULT_MONITOR_INTERVAL_MINUTES', 15))
    DEFAULT_FETCH_TWEET_COUNT = int(os.environ.get('DEFAULT_FETCH_TWEET_COUNT', 10))
    DEFAULT_MAX_NEW_TWEETS_PER_CHECK = int(os.environ.get('DEFAULT_MAX_NEW_TWEETS_PER_CHECK', 3))
    
    # Random delay range (seconds)
    MIN_RANDOM_DELAY = int(os.environ.get('MIN_RANDOM_DELAY', 3))
    MAX_RANDOM_DELAY = int(os.environ.get('MAX_RANDOM_DELAY', 20))
    
    # Account failure threshold
    ACCOUNT_FAILURE_THRESHOLD = int(os.environ.get('ACCOUNT_FAILURE_THRESHOLD', 3))


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

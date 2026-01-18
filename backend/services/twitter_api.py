"""Twitter API client service."""
import requests
import time
import random
from flask import current_app
from models.system_setting import SystemSetting


class TwitterAPIClient:
    """Client for interacting with third-party Twitter API."""
    
    def __init__(self, auth_token=None):
        """Initialize the client with optional auth token."""
        self.auth_token = auth_token
        self._base_url = None
        self._api_key = None
    
    @property
    def base_url(self):
        """Get base URL from settings or config."""
        if self._base_url is None:
            setting = SystemSetting.query.filter_by(key='twitter_api_base_url').first()
            if setting:
                self._base_url = setting.get_typed_value()
            else:
                self._base_url = current_app.config.get('TWITTER_API_BASE_URL', 'https://api.twitterapi.io')
        return self._base_url
    
    @property
    def api_key(self):
        """Get API key from settings or config."""
        if self._api_key is None:
            setting = SystemSetting.query.filter_by(key='twitter_api_key').first()
            if setting:
                self._api_key = setting.get_typed_value()
            else:
                self._api_key = current_app.config.get('TWITTER_API_KEY', '')
        return self._api_key
    
    def _get_headers(self):
        """Build request headers."""
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        # Add API key if available
        if self.api_key:
            headers['X-API-Key'] = self.api_key
        
        # Add AuthToken for account-specific operations
        if self.auth_token:
            headers['AuthToken'] = self.auth_token
        
        return headers
    
    def _apply_random_delay(self):
        """Apply random delay before API call."""
        min_delay = current_app.config.get('MIN_RANDOM_DELAY', 3)
        max_delay = current_app.config.get('MAX_RANDOM_DELAY', 20)
        
        # Try to get from settings
        try:
            setting = SystemSetting.query.filter_by(key='min_random_delay').first()
            if setting:
                min_delay = setting.get_typed_value()
            setting = SystemSetting.query.filter_by(key='max_random_delay').first()
            if setting:
                max_delay = setting.get_typed_value()
        except Exception:
            pass
        
        delay = random.uniform(min_delay, max_delay)
        time.sleep(delay)
    
    def _make_request(self, method, endpoint, data=None, params=None, apply_delay=True):
        """Make HTTP request to the API."""
        if apply_delay:
            self._apply_random_delay()
        
        url = f"{self.base_url}{endpoint}"
        headers = self._get_headers()
        
        start_time = time.time()
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == 'POST':
                response = requests.post(url, headers=headers, json=data, timeout=30)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            execution_time = int((time.time() - start_time) * 1000)
            
            return {
                'success': response.status_code < 400,
                'status_code': response.status_code,
                'data': response.json() if response.text else None,
                'execution_time_ms': execution_time
            }
        except requests.exceptions.Timeout:
            return {
                'success': False,
                'error': 'Request timeout',
                'execution_time_ms': int((time.time() - start_time) * 1000)
            }
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': str(e),
                'execution_time_ms': int((time.time() - start_time) * 1000)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'execution_time_ms': int((time.time() - start_time) * 1000)
            }
    
    def get_user_tweets(self, user_id, count=10):
        """Get recent tweets from a user.
        
        Args:
            user_id: Twitter user ID
            count: Number of tweets to fetch
            
        Returns:
            dict with success status and tweets data
        """
        endpoint = f"/twitter/user/last_tweets"
        params = {
            'userId': user_id,
            'count': count
        }
        
        result = self._make_request('GET', endpoint, params=params)
        
        if result.get('success') and result.get('data'):
            # Extract tweets from response
            tweets = result['data'].get('tweets', []) if isinstance(result['data'], dict) else []
            return {
                'success': True,
                'tweets': tweets,
                'execution_time_ms': result.get('execution_time_ms')
            }
        
        return result
    
    def reply_to_tweet(self, tweet_id, text):
        """Reply to a tweet.
        
        Args:
            tweet_id: ID of the tweet to reply to
            text: Reply text content
            
        Returns:
            dict with success status and reply data
        """
        if not self.auth_token:
            return {
                'success': False,
                'error': 'AuthToken is required for replying to tweets'
            }
        
        endpoint = "/twitter/tweet/reply"
        data = {
            'tweetId': tweet_id,
            'text': text
        }
        
        result = self._make_request('POST', endpoint, data=data)
        
        if result.get('success') and result.get('data'):
            return {
                'success': True,
                'reply_tweet_id': result['data'].get('tweetId'),
                'data': result['data'],
                'execution_time_ms': result.get('execution_time_ms')
            }
        
        return result
    
    def post_tweet(self, text):
        """Post a new tweet.
        
        Args:
            text: Tweet content
            
        Returns:
            dict with success status and tweet data
        """
        if not self.auth_token:
            return {
                'success': False,
                'error': 'AuthToken is required for posting tweets'
            }
        
        endpoint = "/twitter/tweet"
        data = {
            'text': text
        }
        
        result = self._make_request('POST', endpoint, data=data)
        
        if result.get('success') and result.get('data'):
            return {
                'success': True,
                'tweet_id': result['data'].get('tweetId'),
                'data': result['data'],
                'execution_time_ms': result.get('execution_time_ms')
            }
        
        return result

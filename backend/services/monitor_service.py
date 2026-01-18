"""Monitor service for checking new tweets and triggering replies."""
from datetime import datetime
from app import db
from models.monitor_target import MonitorTarget
from models.replied_tweet import RepliedTweet
from models.execution_log import ExecutionLog
from services.twitter_api import TwitterAPIClient
from services.account_selector import AccountSelector
from services.template_selector import TemplateSelector


def check_target_for_new_tweets(target_id):
    """Check a monitor target for new tweets.
    
    Args:
        target_id: ID of the MonitorTarget to check
        
    Returns:
        dict with check results
    """
    target = MonitorTarget.query.get(target_id)
    if not target or target.status != 'active':
        return {'success': False, 'error': 'Target not found or disabled'}
    
    # Create API client (no auth token needed for reading public tweets)
    client = TwitterAPIClient()
    
    try:
        # Fetch recent tweets
        result = client.get_user_tweets(target.target_user_id, target.fetch_tweet_count)
        
        if not result.get('success'):
            target.update_after_check(False, result.get('error', 'Failed to fetch tweets'))
            db.session.commit()
            
            # Log the failure
            log = ExecutionLog(
                log_type='monitor',
                target_id=target.id,
                tweet_author_id=target.target_user_id,
                result='failed',
                error_message=result.get('error'),
                execution_time_ms=result.get('execution_time_ms')
            )
            db.session.add(log)
            db.session.commit()
            
            return result
        
        tweets = result.get('tweets', [])
        
        # Find new tweets (those with ID > last_seen_tweet_id)
        new_tweets = []
        latest_tweet_id = target.last_seen_tweet_id
        
        for tweet in tweets:
            tweet_id = tweet.get('id') or tweet.get('id_str') or tweet.get('tweetId')
            if not tweet_id:
                continue
            
            # Check if this is a new tweet
            if target.last_seen_tweet_id is None or tweet_id > target.last_seen_tweet_id:
                new_tweets.append(tweet)
                
                # Track the latest tweet ID
                if latest_tweet_id is None or tweet_id > latest_tweet_id:
                    latest_tweet_id = tweet_id
        
        # Update watermark
        if latest_tweet_id:
            target.last_seen_tweet_id = latest_tweet_id
        
        # Limit number of new tweets to process
        new_tweets = new_tweets[:target.max_new_tweets_per_check]
        
        # Process each new tweet
        replies_sent = 0
        for tweet in new_tweets:
            tweet_id = tweet.get('id') or tweet.get('id_str') or tweet.get('tweetId')
            reply_result = reply_to_tweet(target, tweet_id)
            if reply_result.get('replies_sent', 0) > 0:
                replies_sent += reply_result['replies_sent']
        
        target.update_after_check(True, tweets_found=len(new_tweets))
        target.total_replies_sent += replies_sent
        db.session.commit()
        
        # Log success
        log = ExecutionLog(
            log_type='monitor',
            target_id=target.id,
            tweet_author_id=target.target_user_id,
            result='success',
            execution_time_ms=result.get('execution_time_ms')
        )
        db.session.add(log)
        db.session.commit()
        
        return {
            'success': True,
            'new_tweets_found': len(new_tweets),
            'replies_sent': replies_sent
        }
        
    except Exception as e:
        target.update_after_check(False, str(e))
        db.session.commit()
        
        log = ExecutionLog(
            log_type='monitor',
            target_id=target.id,
            result='failed',
            error_message=str(e)
        )
        db.session.add(log)
        db.session.commit()
        
        return {'success': False, 'error': str(e)}


def reply_to_tweet(target, tweet_id):
    """Send replies to a tweet from all available accounts.
    
    Each account replies once to each tweet.
    
    Args:
        target: MonitorTarget instance
        tweet_id: ID of the tweet to reply to
        
    Returns:
        dict with reply results
    """
    # Get all available accounts
    accounts = AccountSelector.select_all_available()
    
    if not accounts:
        return {'success': False, 'error': 'No available accounts', 'replies_sent': 0}
    
    replies_sent = 0
    errors = []
    
    for account in accounts:
        # Check if this account already replied to this tweet
        existing = RepliedTweet.query.filter_by(
            target_user_id=target.target_user_id,
            tweet_id=tweet_id,
            account_id=account.id
        ).first()
        
        if existing:
            continue  # Skip - already replied
        
        # Try to acquire the account
        if not account.acquire():
            continue  # Account busy or rate limited
        
        try:
            # Select a reply template
            template = TemplateSelector.select_template(target_id=target.id)
            
            if not template:
                account.release()
                errors.append('No reply templates available')
                continue
            
            # Create API client with this account's token
            client = TwitterAPIClient(auth_token=account.get_token())
            
            # Send reply
            result = client.reply_to_tweet(tweet_id, template.content)
            
            if result.get('success'):
                # Record success
                account.record_success()
                template.record_usage()
                
                # Record that we replied
                replied = RepliedTweet(
                    target_user_id=target.target_user_id,
                    tweet_id=tweet_id,
                    account_id=account.id,
                    reply_tweet_id=result.get('reply_tweet_id')
                )
                db.session.add(replied)
                
                # Log success
                log = ExecutionLog(
                    log_type='reply',
                    account_id=account.id,
                    target_id=target.id,
                    tweet_id=tweet_id,
                    tweet_author_id=target.target_user_id,
                    content_id=template.id,
                    content_text=template.content,
                    result='success',
                    api_response=str(result.get('data')),
                    execution_time_ms=result.get('execution_time_ms')
                )
                db.session.add(log)
                
                replies_sent += 1
            else:
                # Record failure
                error_msg = result.get('error', 'Unknown error')
                account.record_failure(error_msg)
                
                # Log failure
                log = ExecutionLog(
                    log_type='reply',
                    account_id=account.id,
                    target_id=target.id,
                    tweet_id=tweet_id,
                    tweet_author_id=target.target_user_id,
                    content_id=template.id,
                    content_text=template.content,
                    result='failed',
                    error_message=error_msg,
                    api_response=str(result.get('data')),
                    execution_time_ms=result.get('execution_time_ms')
                )
                db.session.add(log)
                
                errors.append(error_msg)
        finally:
            account.release()
            db.session.commit()
    
    return {
        'success': replies_sent > 0,
        'replies_sent': replies_sent,
        'errors': errors
    }


def run_monitor_check():
    """Run monitor check for all active targets that are due.
    
    This is called by the scheduler.
    """
    now = datetime.utcnow()
    
    # Get targets that are due for checking
    targets = MonitorTarget.query.filter_by(status='active').filter(
        (MonitorTarget.next_check_at == None) | 
        (MonitorTarget.next_check_at <= now)
    ).all()
    
    results = []
    for target in targets:
        result = check_target_for_new_tweets(target.id)
        results.append({
            'target_id': target.id,
            'target_user_id': target.target_user_id,
            'result': result
        })
    
    return results

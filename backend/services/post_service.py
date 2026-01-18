"""Post service for auto-posting tweets."""
from datetime import datetime
from app import db
from models.post_job import PostJob
from models.post_content import PostContent
from models.execution_log import ExecutionLog
from services.twitter_api import TwitterAPIClient
from services.account_selector import AccountSelector


def execute_post_job(job_id):
    """Execute a post job.
    
    Args:
        job_id: ID of the PostJob to execute
        
    Returns:
        dict with execution results
    """
    job = PostJob.query.get(job_id)
    if not job:
        return {'success': False, 'error': 'Job not found'}
    
    try:
        # Get active contents
        contents = PostContent.query.filter_by(status='active').order_by(
            PostContent.sort_order, PostContent.id
        ).all()
        
        if not contents:
            job.update_after_run(False, 'No active post contents available', advance_pointer=False)
            db.session.commit()
            return {'success': False, 'error': 'No active post contents'}
        
        # Get content at current index (with wrap-around)
        content_index = job.current_content_index % len(contents)
        content = contents[content_index]
        
        # Select an account
        account = AccountSelector.select_account(
            strategy=job.account_strategy,
            context=f'post_job_{job.id}'
        )
        
        if not account:
            job.update_after_run(False, 'No available accounts', advance_pointer=False)
            db.session.commit()
            return {'success': False, 'error': 'No available accounts'}
        
        # Try to acquire the account
        if not account.acquire():
            job.update_after_run(False, 'Account busy or rate limited', advance_pointer=False)
            db.session.commit()
            return {'success': False, 'error': 'Account busy or rate limited'}
        
        try:
            # Create API client with account's token
            client = TwitterAPIClient(auth_token=account.get_token())
            
            # Get full content (text + link)
            tweet_text = content.get_full_content()
            
            # Post the tweet
            result = client.post_tweet(tweet_text)
            
            if result.get('success'):
                # Record success
                account.record_success()
                content.record_usage()
                
                tweet_id = result.get('tweet_id')
                job.update_after_run(True, tweet_id=tweet_id, advance_pointer=True)
                
                # Log success
                log = ExecutionLog(
                    log_type='post',
                    account_id=account.id,
                    job_id=job.id,
                    tweet_id=tweet_id,
                    content_id=content.id,
                    content_text=tweet_text,
                    result='success',
                    api_response=str(result.get('data')),
                    execution_time_ms=result.get('execution_time_ms')
                )
                db.session.add(log)
                db.session.commit()
                
                return {
                    'success': True,
                    'tweet_id': tweet_id,
                    'content_id': content.id,
                    'account_id': account.id
                }
            else:
                # Record failure
                error_msg = result.get('error', 'Unknown error')
                account.record_failure(error_msg)
                job.update_after_run(False, error_msg, advance_pointer=False)
                
                # Log failure
                log = ExecutionLog(
                    log_type='post',
                    account_id=account.id,
                    job_id=job.id,
                    content_id=content.id,
                    content_text=tweet_text,
                    result='failed',
                    error_message=error_msg,
                    api_response=str(result.get('data')),
                    execution_time_ms=result.get('execution_time_ms')
                )
                db.session.add(log)
                db.session.commit()
                
                return {
                    'success': False,
                    'error': error_msg
                }
        finally:
            account.release()
            db.session.commit()
            
    except Exception as e:
        job.update_after_run(False, str(e), advance_pointer=False)
        
        log = ExecutionLog(
            log_type='post',
            job_id=job.id,
            result='failed',
            error_message=str(e)
        )
        db.session.add(log)
        db.session.commit()
        
        return {'success': False, 'error': str(e)}


def run_post_jobs():
    """Run all post jobs that are due.
    
    This is called by the scheduler.
    """
    now = datetime.utcnow()
    
    # Get jobs that are due for running
    jobs = PostJob.query.filter_by(status='active').filter(
        (PostJob.next_run_at == None) | 
        (PostJob.next_run_at <= now)
    ).all()
    
    results = []
    for job in jobs:
        result = execute_post_job(job.id)
        results.append({
            'job_id': job.id,
            'job_name': job.name,
            'result': result
        })
    
    return results

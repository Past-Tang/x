"""Scheduler service for periodic tasks."""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
import logging

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def init_scheduler(app):
    """Initialize the scheduler with the Flask app context.
    
    Args:
        app: Flask application instance
    """
    
    def run_with_context(func):
        """Wrapper to run scheduled functions with app context."""
        def wrapper():
            with app.app_context():
                try:
                    result = func()
                    logger.info(f"Scheduled task {func.__name__} completed: {result}")
                except Exception as e:
                    logger.error(f"Scheduled task {func.__name__} failed: {e}")
        return wrapper
    
    # Import services
    from services.monitor_service import run_monitor_check
    from services.post_service import run_post_jobs
    
    # Add monitor check job (runs every minute to check if any targets are due)
    scheduler.add_job(
        run_with_context(run_monitor_check),
        trigger=IntervalTrigger(minutes=1),
        id='monitor_check',
        name='Monitor Check',
        replace_existing=True
    )
    
    # Add post jobs check (runs every minute to check if any jobs are due)
    scheduler.add_job(
        run_with_context(run_post_jobs),
        trigger=IntervalTrigger(minutes=1),
        id='post_jobs',
        name='Post Jobs',
        replace_existing=True
    )
    
    # Start the scheduler
    if not scheduler.running:
        scheduler.start()
        logger.info("Scheduler started")


def shutdown_scheduler():
    """Shutdown the scheduler."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler shutdown")


def get_scheduled_jobs():
    """Get list of scheduled jobs."""
    jobs = []
    for job in scheduler.get_jobs():
        jobs.append({
            'id': job.id,
            'name': job.name,
            'next_run': job.next_run_time.isoformat() if job.next_run_time else None
        })
    return jobs

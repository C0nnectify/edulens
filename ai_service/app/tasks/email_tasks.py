"""
Celery Tasks for Email Operations
"""

from celery import shared_task
from typing import List, Dict, Any
import logging
import asyncio

from app.services.email_service import email_service

logger = logging.getLogger(__name__)


@shared_task(name="app.tasks.email_tasks.send_email")
def send_email_task(
    to_emails: List[str],
    subject: str,
    body: str,
    html_body: str = None
) -> bool:
    """
    Async task to send an email

    Args:
        to_emails: List of recipient emails
        subject: Email subject
        body: Plain text body
        html_body: Optional HTML body

    Returns:
        True if sent successfully
    """
    try:
        logger.info(f"Sending email to {', '.join(to_emails)}")

        # Run async function in sync context
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # If loop is already running, create new one
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        result = loop.run_until_complete(
            email_service.send_email(
                to_emails=to_emails,
                subject=subject,
                body=body,
                html_body=html_body
            )
        )

        return result
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        return False


@shared_task(name="app.tasks.email_tasks.send_template_email")
def send_template_email_task(
    to_emails: List[str],
    subject: str,
    template_name: str,
    template_data: Dict[str, Any]
) -> bool:
    """
    Async task to send a template email

    Args:
        to_emails: List of recipient emails
        subject: Email subject
        template_name: Template name
        template_data: Data for template

    Returns:
        True if sent successfully
    """
    try:
        logger.info(f"Sending template email '{template_name}' to {', '.join(to_emails)}")

        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        result = loop.run_until_complete(
            email_service.send_template_email(
                to_emails=to_emails,
                subject=subject,
                template_name=template_name,
                template_data=template_data
            )
        )

        return result
    except Exception as e:
        logger.error(f"Error sending template email: {e}")
        return False


@shared_task(name="app.tasks.email_tasks.send_university_update_notification")
def send_university_update_notification(
    user_email: str,
    user_name: str,
    university_name: str,
    update_message: str,
    portal_url: str,
    action_required: bool = False,
    action_message: str = None
) -> bool:
    """
    Send university application update notification

    Args:
        user_email: User's email
        user_name: User's name
        university_name: University name
        update_message: Update message
        portal_url: Portal URL
        action_required: Whether action is required
        action_message: Action message if required

    Returns:
        True if sent successfully
    """
    from datetime import datetime

    template_data = {
        "user_name": user_name,
        "university_name": university_name,
        "update_message": update_message,
        "update_date": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
        "portal_url": portal_url,
        "action_required": action_required,
        "action_message": action_message or ""
    }

    return send_template_email_task(
        to_emails=[user_email],
        subject=f"Application Update: {university_name}",
        template_name="university_update",
        template_data=template_data
    )


@shared_task(name="app.tasks.email_tasks.send_research_summary")
def send_research_summary(
    user_email: str,
    user_name: str,
    research_topic: str,
    research_summary: str
) -> bool:
    """
    Send research summary email

    Args:
        user_email: User's email
        user_name: User's name
        research_topic: Research topic
        research_summary: Summary content

    Returns:
        True if sent successfully
    """
    from datetime import datetime

    template_data = {
        "user_name": user_name,
        "research_topic": research_topic,
        "research_summary": research_summary,
        "generated_date": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    }

    return send_template_email_task(
        to_emails=[user_email],
        subject=f"Research Complete: {research_topic}",
        template_name="research_summary",
        template_data=template_data
    )


@shared_task(name="app.tasks.email_tasks.send_daily_summaries")
def send_daily_summaries() -> Dict[str, Any]:
    """
    Send daily summary emails to all active users
    This is a scheduled task that runs daily

    Returns:
        Summary of emails sent
    """
    logger.info("Starting daily summary email task")

    # TODO: Implement logic to fetch active users and their updates
    # For now, this is a placeholder

    sent_count = 0
    failed_count = 0

    try:
        # Example: Fetch users and send summaries
        # users = get_active_users()
        # for user in users:
        #     result = send_summary_email(user)
        #     if result:
        #         sent_count += 1
        #     else:
        #         failed_count += 1

        logger.info(f"Daily summaries sent: {sent_count} succeeded, {failed_count} failed")

        return {
            "sent": sent_count,
            "failed": failed_count,
            "timestamp": str(asyncio.get_event_loop().time())
        }

    except Exception as e:
        logger.error(f"Error in daily summaries task: {e}")
        return {"error": str(e)}

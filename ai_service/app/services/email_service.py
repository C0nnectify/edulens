"""
SMTP Email Service
Handles email notifications using async SMTP
"""

import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional, Dict, Any
import logging
from jinja2 import Template

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails via SMTP"""

    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.username = settings.SMTP_USERNAME
        self.password = settings.SMTP_PASSWORD
        self.from_email = settings.SMTP_FROM_EMAIL
        self.from_name = settings.SMTP_FROM_NAME

    async def send_email(
        self,
        to_emails: List[str],
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None
    ) -> bool:
        """
        Send an email via SMTP

        Args:
            to_emails: List of recipient email addresses
            subject: Email subject
            body: Plain text email body
            html_body: Optional HTML email body
            cc: Optional CC recipients
            bcc: Optional BCC recipients

        Returns:
            True if email sent successfully, False otherwise
        """
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["From"] = f"{self.from_name} <{self.from_email}>"
            message["To"] = ", ".join(to_emails)
            message["Subject"] = subject

            if cc:
                message["Cc"] = ", ".join(cc)

            # Attach plain text body
            text_part = MIMEText(body, "plain")
            message.attach(text_part)

            # Attach HTML body if provided
            if html_body:
                html_part = MIMEText(html_body, "html")
                message.attach(html_part)

            # Prepare all recipients
            all_recipients = to_emails.copy()
            if cc:
                all_recipients.extend(cc)
            if bcc:
                all_recipients.extend(bcc)

            # Send email
            await aiosmtplib.send(
                message,
                hostname=self.smtp_host,
                port=self.smtp_port,
                username=self.username,
                password=self.password,
                start_tls=True,
            )

            logger.info(f"Email sent successfully to {', '.join(to_emails)}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False

    async def send_template_email(
        self,
        to_emails: List[str],
        subject: str,
        template_name: str,
        template_data: Dict[str, Any]
    ) -> bool:
        """
        Send an email using a template

        Args:
            to_emails: List of recipient email addresses
            subject: Email subject
            template_name: Name of the template
            template_data: Data to render in the template

        Returns:
            True if email sent successfully
        """
        try:
            # Get template
            template = self._get_template(template_name)

            # Render template
            html_body = template.render(**template_data)

            # Create plain text version (simple strip of HTML tags)
            plain_body = self._html_to_text(html_body)

            # Send email
            return await self.send_email(
                to_emails=to_emails,
                subject=subject,
                body=plain_body,
                html_body=html_body
            )

        except Exception as e:
            logger.error(f"Failed to send template email: {e}")
            return False

    def _get_template(self, template_name: str) -> Template:
        """Get email template by name"""
        templates = {
            "university_update": """
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #4F46E5; color: white; padding: 20px; border-radius: 5px; }
                        .content { padding: 20px; background: #f9fafb; margin: 20px 0; border-radius: 5px; }
                        .footer { text-align: center; color: #666; font-size: 12px; }
                        .button { background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>University Application Update</h2>
                        </div>
                        <div class="content">
                            <p>Hello {{ user_name }},</p>
                            <p>We detected an update for your application at <strong>{{ university_name }}</strong>:</p>
                            <p><strong>Update:</strong> {{ update_message }}</p>
                            <p><strong>Date:</strong> {{ update_date }}</p>
                            {% if action_required %}
                            <p style="color: #DC2626;"><strong>Action Required:</strong> {{ action_message }}</p>
                            {% endif %}
                            <p><a href="{{ portal_url }}" class="button">View Application Portal</a></p>
                        </div>
                        <div class="footer">
                            <p>This is an automated notification from EduLen AI Service</p>
                        </div>
                    </div>
                </body>
                </html>
            """,
            "research_summary": """
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #059669; color: white; padding: 20px; border-radius: 5px; }
                        .content { padding: 20px; background: #f9fafb; margin: 20px 0; border-radius: 5px; }
                        .footer { text-align: center; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>Research Summary</h2>
                        </div>
                        <div class="content">
                            <p>Hello {{ user_name }},</p>
                            <p>Your research on <strong>{{ research_topic }}</strong> is complete.</p>
                            <div>{{ research_summary }}</div>
                            <p><em>Generated on {{ generated_date }}</em></p>
                        </div>
                        <div class="footer">
                            <p>This is an automated notification from EduLen AI Service</p>
                        </div>
                    </div>
                </body>
                </html>
            """,
            "notification": """
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #2563EB; color: white; padding: 20px; border-radius: 5px; }
                        .content { padding: 20px; background: #f9fafb; margin: 20px 0; border-radius: 5px; }
                        .footer { text-align: center; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>{{ title }}</h2>
                        </div>
                        <div class="content">
                            {{ message }}
                        </div>
                        <div class="footer">
                            <p>This is an automated notification from EduLen AI Service</p>
                        </div>
                    </div>
                </body>
                </html>
            """
        }

        template_str = templates.get(template_name)
        if not template_str:
            raise ValueError(f"Template '{template_name}' not found")

        return Template(template_str)

    def _html_to_text(self, html: str) -> str:
        """Convert HTML to plain text (simple version)"""
        import re
        # Remove HTML tags
        text = re.sub('<[^<]+?>', '', html)
        # Clean up whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        return text


# Global email service instance
email_service = EmailService()

"""Email notification tools"""

from typing import Dict, Any, List, Optional
from app.tools.base_tool import BaseTool, ToolResult
from app.services.email_service import EmailService
import logging

logger = logging.getLogger(__name__)


class EmailSendTool(BaseTool):
    """Send email notifications"""

    def __init__(self, email_service: EmailService):
        super().__init__(
            name="email_send",
            description="Send email notifications to users"
        )
        self.email_service = email_service
        self.category = "communication"

    def _get_parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "to_email": {
                    "type": "string",
                    "description": "Recipient email address"
                },
                "subject": {
                    "type": "string",
                    "description": "Email subject"
                },
                "body": {
                    "type": "string",
                    "description": "Email body content"
                },
                "template": {
                    "type": "string",
                    "description": "Optional email template name"
                },
                "template_data": {
                    "type": "object",
                    "description": "Data for template rendering"
                }
            },
            "required": ["to_email", "subject", "body"]
        }

    async def execute(
        self,
        to_email: str,
        subject: str,
        body: str,
        template: Optional[str] = None,
        template_data: Optional[Dict] = None,
        **kwargs
    ) -> ToolResult:
        """Send email"""
        try:
            await self.email_service.send_email(
                to_email=to_email,
                subject=subject,
                body=body,
                html=template is not None
            )

            return ToolResult(
                success=True,
                data={"sent_to": to_email, "subject": subject},
                metadata={"email_sent": True}
            )

        except Exception as e:
            return await self._handle_error(e)

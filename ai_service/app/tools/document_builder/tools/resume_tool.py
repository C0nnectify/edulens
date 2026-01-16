"""
Resume Tool

Tool for generating professional resumes through conversational interaction.
Handles information collection, validation, and resume generation.
"""

import json
import uuid
import logging
import re
from datetime import datetime
from typing import Any, Dict, List, Optional

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

from .base_document_tool import BaseDocumentTool
from ..state import (
    DocumentBuilderState,
    DocumentType,
    ResumeCollectedData,
    GeneratedDocument,
    DocumentSection,
    RESUME_REQUIRED_FIELDS,
)
from ..prompts import (
    RESUME_SYSTEM_PROMPT,
    RESUME_INTENT_ANALYSIS_PROMPT,
    RESUME_COLLECTION_PROMPTS,
    RESUME_GENERATION_PROMPT,
    RESUME_REFINEMENT_PROMPT,
)

logger = logging.getLogger(__name__)


# Field to question topic mapping for natural conversation
# Maps missing field names to the corresponding prompt key
FIELD_TO_TOPIC = {
    "full_name": "full_name",  # Each field has its own prompt now
    "target_role": "target_role",
    "contact_info": "contact_info",
    "professional_summary": "professional_summary",
    "work_experience": "work_experience",
    "education": "education",
    "skills": "skills",
    "certifications": "certifications",
    "projects": "projects",
    "languages": "languages",
    "awards": "awards",
}


class ResumeTool(BaseDocumentTool):
    """
    Tool for creating professional resumes through conversation.
    
    Features:
    - Natural language information extraction
    - Progressive data collection
    - ATS-friendly formatting
    - Tailored to target role
    """

    def __init__(self, llm: ChatGoogleGenerativeAI):
        super().__init__(llm, DocumentType.RESUME)

    @property
    def system_prompt(self) -> str:
        return RESUME_SYSTEM_PROMPT

    @property
    def intent_analysis_prompt(self) -> str:
        return RESUME_INTENT_ANALYSIS_PROMPT

    @property
    def collection_prompts(self) -> Dict[str, str]:
        return RESUME_COLLECTION_PROMPTS

    @property
    def generation_prompt(self) -> str:
        return RESUME_GENERATION_PROMPT

    def get_required_fields(self) -> Dict[str, List[str]]:
        return RESUME_REQUIRED_FIELDS

    async def extract_and_respond(
        self, message: str, state: DocumentBuilderState
    ) -> Dict[str, Any]:
        """
        Extract resume data and generate a simple contextual response.
        
        SIMPLIFIED: Uses regex extraction + simple response generation.
        No complex LLM JSON parsing that can fail.
        """
        self.logger.info("=== extract_and_respond ===")
        
        # Step 1: Extract data using regex (reliable)
        extracted = self._extract_structured_resume_data(message)
        self.logger.info(f"Regex extracted: {list(extracted.keys())}")
        
        # Step 2: Get current state
        current_data = {}
        if state.resume_data:
            current_data = {k: v for k, v in state.resume_data.model_dump().items() if v}
        
        # Step 3: Merge - new data + existing data
        all_data = {**current_data, **{k: v for k, v in extracted.items() if v}}
        
        # Step 4: Calculate what we have and what's missing
        filled_fields = [k for k, v in all_data.items() if v]
        critical_fields = ["full_name", "target_role"]
        important_fields = ["work_experience", "education", "skills"]
        
        missing_critical = [f for f in critical_fields if f not in filled_fields]
        has_content = any(f in filled_fields for f in important_fields)
        
        ready = len(missing_critical) == 0 and has_content
        
        self.logger.info(f"Filled: {filled_fields}")
        self.logger.info(f"Missing critical: {missing_critical}")
        self.logger.info(f"Ready: {ready}")
        
        # Step 5: Generate simple but specific response
        response = self._generate_simple_response(all_data, filled_fields, missing_critical, ready)
        self.logger.info(f"Generated response: {response[:100]}...")
        
        return {
            "extracted_data": extracted,
            "ai_response": response,
            "ready_for_generation": ready,
            "missing_critical": missing_critical
        }
    
    def _generate_simple_response(
        self, 
        data: Dict[str, Any], 
        filled: List[str], 
        missing_critical: List[str],
        ready: bool
    ) -> str:
        """Generate a simple but specific response based on extracted data."""
        
        # Get key info for personalization
        name = data.get("full_name", "")
        role = data.get("target_role", "")
        
        if ready:
            # Ready to generate
            parts = []
            if name:
                parts.append(f"Perfect, {name}!")
            else:
                parts.append("Perfect!")
            
            if role:
                parts.append(f"I'm ready to create your **{role}** resume.")
            else:
                parts.append("I'm ready to create your resume.")
            
            # Show what we captured
            captured = []
            if data.get("education"):
                captured.append("education")
            if data.get("work_experience"):
                captured.append("work experience")
            if data.get("skills"):
                captured.append("skills")
            if data.get("projects"):
                captured.append("projects")
            
            if captured:
                parts.append(f"I've captured your {', '.join(captured)}.")
            
            parts.append('Say **"Generate Resume"** when ready!')
            return " ".join(parts)
        
        elif missing_critical:
            # Need critical info
            if "full_name" in missing_critical and "target_role" in missing_critical:
                if filled:
                    return f"I found your {', '.join(filled[:3])}. What's your **full name** and **target role**?"
                else:
                    return "I'd love to help! What's your **name** and what **role** are you targeting?"
            elif "full_name" in missing_critical:
                return f"Great info! What's your **full name** as it should appear on the resume?"
            elif "target_role" in missing_critical:
                if name:
                    return f"Thanks {name}! What **role or position** are you targeting?"
                return "What **role or position** are you targeting with this resume?"
        
        else:
            # Have critical but missing content
            if name:
                return f"Thanks {name}! Please share your **experience**, **education**, or **skills**."
            return "Please share your **experience**, **education**, or **skills**."

    async def extract_info_from_message(
        self, message: str, state: DocumentBuilderState
    ) -> Dict[str, Any]:
        """
        Extract resume-relevant information from user's message.
        Now delegates to extract_and_respond for AI-driven extraction.
        """
        self.logger.info(f"=== extract_info_from_message called ===")
        self.logger.info(f"Message length: {len(message)}")
        
        result = await self.extract_and_respond(message, state)
        
        self.logger.info(f"extract_and_respond returned keys: {list(result.keys())}")
        
        # Store the AI response in state metadata for later use
        if "ai_response" in result and result["ai_response"]:
            self.logger.info(f"Storing AI response in metadata: {result['ai_response'][:100]}...")
            state.metadata["pending_ai_response"] = result["ai_response"]
        else:
            self.logger.warning("No ai_response in result!")
            
        if "ready_for_generation" in result:
            state.metadata["ai_says_ready"] = result["ready_for_generation"]
        
        # Return just the extracted data for compatibility
        extracted = result.get("extracted_data", {})
        self.logger.info(f"Returning extracted_data with keys: {list(extracted.keys()) if extracted else 'empty'}")
        return extracted

    def _extract_structured_resume_data(self, message: str) -> Dict[str, Any]:
        """Parse structured resume text with labeled sections and contact lines."""
        if not message or len(message) < 10:
            return {}

        text = message.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.strip("`")
        lower = text.lower()
        result: Dict[str, Any] = {}

        # Name extraction - multiple patterns
        name_match = re.search(r"^\s*name\s*:\s*(.+)$", text, re.IGNORECASE | re.MULTILINE)
        if name_match:
            result["full_name"] = name_match.group(1).strip()
        else:
            # Try to find name at start of resume (first line that looks like a name)
            lines = text.strip().split('\n')
            for line in lines[:5]:  # Check first 5 lines
                line = line.strip()
                # Skip if it's a section header or contains special chars
                if ':' in line or line.lower() in ['resume', 'cv', 'curriculum vitae']:
                    continue
                # Check if it looks like a name (2-4 capitalized words)
                words = line.split()
                if 2 <= len(words) <= 4 and all(w[0].isupper() for w in words if w):
                    # Likely a name
                    result["full_name"] = line
                    break

        # Target role extraction - check for short messages like "role: X" or "software dev"
        role_match = re.search(r"^\s*(?:role|position|target)\s*:\s*(.+)$", text, re.IGNORECASE | re.MULTILINE)
        if role_match:
            result["target_role"] = role_match.group(1).strip()
        elif len(text) < 100:
            # Short message - might be just the role
            # Check for common job titles
            job_patterns = [
                r"(software\s*(?:developer|engineer|dev))",
                r"(data\s*(?:scientist|analyst|engineer))",
                r"(product\s*manager)",
                r"(frontend|backend|full\s*stack)\s*(?:developer|engineer)?",
                r"(web\s*developer)",
                r"(mobile\s*developer)",
                r"(devops\s*engineer)",
                r"(machine\s*learning\s*engineer)",
                r"(ai\s*engineer)",
            ]
            for pattern in job_patterns:
                match = re.search(pattern, lower)
                if match:
                    result["target_role"] = match.group(1).strip()
                    break

        # Contact info extraction
        email_match = re.search(r"[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}", text)
        phone_match = re.search(r"(\+?\d[\d\-\s]{7,}\d)", text)
        linkedin_match = re.search(r"linkedin\.com/[^\s]+", lower)
        github_match = re.search(r"github\.com/[^\s]+", lower)
        address_match = re.search(r"^\s*address\s*:\s*(.+)$", text, re.IGNORECASE | re.MULTILINE)

        contact_parts: List[str] = []
        if email_match:
            contact_parts.append(f"Email: {email_match.group(0)}")
        if phone_match:
            contact_parts.append(f"Phone: {phone_match.group(1).strip()}")
        if linkedin_match:
            contact_parts.append(f"LinkedIn: {linkedin_match.group(0)}")
        if github_match:
            contact_parts.append(f"GitHub: {github_match.group(0)}")
        if address_match:
            contact_parts.append(f"Address: {address_match.group(1).strip()}")
        if contact_parts:
            result["contact_info"] = "\n".join(contact_parts)

        # Include summary preference from short confirmations
        if "summary" in lower:
            if re.search(r"\b(no|nah|nope|not)\b", lower):
                result["include_summary"] = False
            elif re.search(r"\b(yes|yeah|yep|yup|sure|ok|okay)\b", lower):
                result["include_summary"] = True

        # Section extraction by headings
        sections = self._split_by_headings(text)

        # Career Objective / Summary
        if "career objective" in sections:
            result["professional_summary"] = sections["career objective"].strip()
        elif "professional summary" in sections:
            result["professional_summary"] = sections["professional summary"].strip()

        # Education
        if "educational background" in sections:
            result["education"] = sections["educational background"].strip()
        elif "education" in sections:
            result["education"] = sections["education"].strip()

        # Work / Internship / Experience
        if "internship / experience" in sections:
            result["work_experience"] = sections["internship / experience"].strip()
        elif "work experience" in sections:
            result["work_experience"] = sections["work experience"].strip()
        elif "experience" in sections:
            result["work_experience"] = sections["experience"].strip()

        # Skills
        if "technical skills" in sections:
            result["skills"] = sections["technical skills"].strip()
        elif "skills" in sections:
            result["skills"] = sections["skills"].strip()

        # Projects
        if "projects" in sections:
            result["projects"] = sections["projects"].strip()

        # Certifications
        if "certifications" in sections:
            result["certifications"] = sections["certifications"].strip()

        # Languages
        if "languages" in sections:
            result["languages"] = sections["languages"].strip()

        # Awards (optional)
        if "awards" in sections:
            result["awards"] = sections["awards"].strip()

        # Infer target role from objective line if possible
        if "career objective" in sections and not result.get("target_role"):
            role_match = re.search(r"seeking\s+an?\s+([\w\s\-/]+?)\s+position", sections["career objective"], re.IGNORECASE)
            if role_match:
                result["target_role"] = role_match.group(1).strip()

        # Heuristic: if user replies with a short role + summary confirmation
        if not result.get("target_role"):
            if len(text) <= 120:
                # Take the first clause before "and" / "summary" keywords
                role_candidate = re.split(r"\band\b|summary|summery|summmary", text, flags=re.IGNORECASE)[0].strip(" -:,.")
                if role_candidate and len(role_candidate.split()) <= 6:
                    result["target_role"] = role_candidate

        return result

    def _split_by_headings(self, text: str) -> Dict[str, str]:
        """Split a resume-like text into sections keyed by heading labels."""
        headings = [
            "career objective",
            "professional summary",
            "educational background",
            "education",
            "technical skills",
            "skills",
            "projects",
            "internship / experience",
            "work experience",
            "experience",
            "certifications",
            "languages",
            "awards",
            "hobbies & interests",
        ]

        # Normalize headings in text by scanning line by line
        lines = text.splitlines()
        sections: Dict[str, List[str]] = {}
        current_key: Optional[str] = None

        for raw_line in lines:
            line = raw_line.strip()
            if not line:
                continue

            lowered = line.lower().strip(":")
            if lowered in headings:
                current_key = lowered
                sections[current_key] = []
                continue

            if current_key:
                sections[current_key].append(raw_line)

        return {k: "\n".join(v).strip() for k, v in sections.items()}

    def update_state_with_extracted_info(
        self, state: DocumentBuilderState, extracted_info: Dict[str, Any]
    ) -> DocumentBuilderState:
        """Update state with extracted information.
        
        IMPORTANT: This method ONLY adds new information, never overwrites existing data.
        This prevents data loss when user sends short follow-up messages.
        """
        if not state.resume_data:
            state.resume_data = ResumeCollectedData()
        
        for field, value in extracted_info.items():
            # Skip if value is None, empty, or field doesn't exist
            if value is None:
                continue
            if not hasattr(state.resume_data, field):
                continue
            if isinstance(value, str) and not value.strip():
                continue
            if isinstance(value, list) and len(value) == 0:
                continue
            
            # Get current value
            current_value = getattr(state.resume_data, field, None)
            
            # CRITICAL: Don't overwrite existing non-empty data with new data
            # unless the new data is longer/more detailed
            if current_value:
                if isinstance(current_value, str) and isinstance(value, str):
                    # Only overwrite if new value is significantly more detailed
                    if len(value) <= len(current_value):
                        self.logger.debug(f"Keeping existing {field}: '{current_value[:50]}...'")
                        continue
                elif isinstance(current_value, bool):
                    # Booleans can be overwritten
                    pass
                else:
                    # Keep existing non-empty values
                    continue
            
            self.logger.info(f"Setting {field} = '{str(value)[:50]}...'")
            setattr(state.resume_data, field, value)
        
        # Update completion percentage
        state.completion_percentage = state.resume_data.get_completion_percentage()
        self.logger.info(f"Completion: {state.completion_percentage}%, Filled: {state.resume_data.get_filled_fields()}")
        
        return state

    def get_next_question(self, state: DocumentBuilderState, topic: str) -> str:
        """
        Fallback method for generating questions when AI response is not available.
        
        The primary response generation is now done by extract_and_respond().
        This method is only used as a fallback.
        """
        if not state.resume_data:
            return "I'd be happy to help you create a professional resume! Please share your information - you can paste your existing resume, or tell me about your background, experience, and the role you're targeting."
        
        data = state.resume_data
        
        # Handle final_check - ready for generation
        if topic == "final_check" or data.is_ready_for_generation():
            return self._build_ready_message(data)
        
        # Simple fallback questions
        questions = {
            "full_name": "What's your full name?",
            "target_role": "What role or position are you targeting?",
            "contact_info": "Please share your contact information (email, phone, LinkedIn).",
            "work_experience": "Tell me about your work experience.",
            "education": "What's your educational background?",
            "skills": "What are your key skills?",
            "professional_summary": "Would you like to include a professional summary?",
        }
        
        return questions.get(topic, f"Please tell me about your {topic.replace('_', ' ')}.")
    
    def _build_ready_message(self, data: ResumeCollectedData) -> str:
        """Build a confirmation message when we have enough info."""
        parts = []
        
        # Opening line
        if data.target_role:
            parts.append(f"Perfect! I'm ready to create your **{data.target_role}** resume.")
        else:
            parts.append("Great! I have everything I need to create your resume.")
        
        # Show what we have with checkmarks
        summary_items = []
        if data.full_name:
            summary_items.append(f"✓ **{data.full_name}**")
        if data.contact_info:
            summary_items.append("✓ Contact info")
        if data.work_experience:
            summary_items.append("✓ Work experience")
        if data.education:
            summary_items.append("✓ Education")
        if data.skills:
            summary_items.append("✓ Skills")
        if data.projects:
            summary_items.append("✓ Projects")
        if data.certifications:
            summary_items.append("✓ Certifications")
        if data.languages:
            summary_items.append("✓ Languages")
        
        if summary_items:
            parts.append("\n".join(summary_items))
        
        # Call to action
        parts.append('**Say "Generate Resume" when you\'re ready!** Or tell me if you\'d like to add anything else.')
        
        return "\n\n".join(parts)

    async def generate_document(
        self, state: DocumentBuilderState
    ) -> GeneratedDocument:
        """
        Generate a resume using collected information.
        
        Args:
            state: Current state with collected resume data
            
        Returns:
            GeneratedDocument with formatted resume
        """
        if not state.resume_data:
            raise ValueError("No resume data collected")
        
        data = state.resume_data
        
        # Prepare generation context
        context = {
            "target_role": data.target_role or "Not specified",
            "full_name": data.full_name or "Your Name",
            "contact_info": data.contact_info or "Not provided",
            "professional_summary": data.professional_summary or "Not provided",
            "work_experience": data.work_experience or "Not provided",
            "education": data.education or "Not provided",
            "skills": data.skills or "Not provided",
            "certifications": data.certifications or "N/A",
            "projects": data.projects or "N/A",
            "languages": data.languages or "N/A",
            "awards": data.awards or "N/A",
            "format_preference": data.format_preference,
            "special_instructions": data.special_instructions or "None",
        }
        
        # Generate resume using LLM
        generation_prompt = self.generation_prompt.format(**context)
        
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=generation_prompt),
        ]
        
        try:
            response = self._invoke_with_fallback(messages)
            resume_content = response.content
            
            # Parse into sections
            sections = self._parse_resume_sections(resume_content)
            
            # Build structured resume data for frontend (ResumeDraftV1 format)
            structured_resume = self._build_structured_resume_data(data)
            
            # Create document
            document = GeneratedDocument(
                document_id=f"resume-{uuid.uuid4().hex[:12]}",
                document_type=DocumentType.RESUME,
                title=f"Resume - {data.full_name or 'Your Name'}",
                sections=sections,
                plain_text=resume_content,
                word_count=len(resume_content.split()),
                target_program=data.target_role,
                key_strengths_highlighted=[
                    "Professional experience",
                    "Education background",
                    "Key skills",
                ],
                resume=structured_resume,  # Structured data for frontend editor
            )
            
            return document
            
        except Exception as e:
            self.logger.error(f"Resume generation failed: {e}")
            raise
    
    def _build_structured_resume_data(self, data: ResumeCollectedData) -> Dict[str, Any]:
        """
        Transform ResumeCollectedData into frontend-expected ResumeDraftV1 format.
        
        Frontend expects:
        {
            personalInfo: { fullName, email, phone, location, linkedin, github, portfolio },
            summary: string,
            experience: [{ company, position, location, startDate, endDate, bullets }],
            education: [{ institution, degree, field, location, startDate, endDate }],
            skills: [{ name, category }],
            projects: [{ name, description, technologies, bullets }],
            certifications: [{ name, issuer, date }],
            languages: [{ name, proficiency }]
        }
        """
        # Parse contact info
        contact = self._parse_contact_info(data.contact_info or "")
        
        # Parse location
        location_parts = self._parse_location(data.location or "")
        
        # Parse work experience
        experience = self._parse_work_experience(data.work_experience or "")
        
        # Parse education
        education = self._parse_education(data.education or "")
        
        # Parse skills
        skills = self._parse_skills(data.skills or "", data.technical_skills, data.soft_skills)
        
        # Parse projects
        projects = self._parse_projects(data.projects or "")
        
        # Parse certifications
        certifications = self._parse_certifications(data.certifications or "")
        
        # Parse languages
        languages = self._parse_languages(data.languages or "")
        
        return {
            "version": 1,
            "title": f"Resume - {data.full_name or 'Your Name'}",
            "personalInfo": {
                "fullName": data.full_name or "",
                "email": contact.get("email", ""),
                "phone": contact.get("phone", ""),
                "location": location_parts,
                "linkedin": contact.get("linkedin", ""),
                "github": contact.get("github", ""),
                "portfolio": contact.get("portfolio", ""),
                "website": contact.get("website", ""),
            },
            "summary": data.professional_summary or "",
            "experience": experience,
            "education": education,
            "skills": skills,
            "projects": projects,
            "certifications": certifications,
            "languages": languages,
        }
    
    def _parse_contact_info(self, contact_str: str) -> Dict[str, str]:
        """Parse contact info string into structured format."""
        result = {}
        
        # Email pattern
        import re
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', contact_str)
        if email_match:
            result["email"] = email_match.group()
        
        # Phone pattern (various formats)
        phone_match = re.search(r'[\+]?[\d\s\-\(\)]{10,}', contact_str)
        if phone_match:
            result["phone"] = phone_match.group().strip()
        
        # LinkedIn
        linkedin_match = re.search(r'linkedin\.com/in/[\w\-]+|linkedin:\s*[\w\-]+', contact_str, re.I)
        if linkedin_match:
            result["linkedin"] = linkedin_match.group()
        
        # GitHub
        github_match = re.search(r'github\.com/[\w\-]+|github:\s*[\w\-]+', contact_str, re.I)
        if github_match:
            result["github"] = github_match.group()
        
        # Portfolio/website
        url_match = re.search(r'https?://[\w\.\-/]+', contact_str)
        if url_match and 'linkedin' not in url_match.group().lower() and 'github' not in url_match.group().lower():
            result["portfolio"] = url_match.group()
        
        return result
    
    def _parse_location(self, location_str: str) -> Dict[str, str]:
        """Parse location string into city/state/country."""
        if not location_str:
            return {}
        
        parts = [p.strip() for p in location_str.split(',')]
        result = {}
        
        if len(parts) >= 1:
            result["city"] = parts[0]
        if len(parts) >= 2:
            result["state"] = parts[1]
        if len(parts) >= 3:
            result["country"] = parts[2]
        
        return result
    
    def _parse_work_experience(self, exp_str: str) -> List[Dict[str, Any]]:
        """Parse work experience string into structured format."""
        if not exp_str or exp_str == "Not provided":
            return []
        
        experiences = []
        
        # Split by common delimiters (lines with company names, bullet points, etc.)
        import re
        
        # Try to find individual job entries
        # Pattern: Company name followed by role/position
        entries = re.split(r'\n\s*\n|\n(?=[A-Z][a-z]+\s+(?:Inc|LLC|Corp|Company|Ltd|at|@))', exp_str)
        
        for entry in entries:
            if not entry.strip():
                continue
            
            lines = [l.strip() for l in entry.strip().split('\n') if l.strip()]
            if not lines:
                continue
            
            exp_item = {
                "company": "",
                "position": "",
                "location": "",
                "startDate": "",
                "endDate": "",
                "current": False,
                "bullets": [],
            }
            
            # First line often has company/position
            first_line = lines[0]
            
            # Try to extract company and position
            if ' at ' in first_line:
                parts = first_line.split(' at ', 1)
                exp_item["position"] = parts[0].strip()
                exp_item["company"] = parts[1].strip()
            elif ' - ' in first_line:
                parts = first_line.split(' - ', 1)
                exp_item["company"] = parts[0].strip()
                exp_item["position"] = parts[1].strip()
            else:
                # Assume first line is company or position
                exp_item["company"] = first_line
            
            # Look for dates and bullets in remaining lines
            for line in lines[1:]:
                # Date patterns
                date_match = re.search(r'(\d{4}|\w+\s+\d{4})\s*[-–to]+\s*(present|\d{4}|\w+\s+\d{4})', line, re.I)
                if date_match:
                    exp_item["startDate"] = date_match.group(1)
                    end = date_match.group(2)
                    if end.lower() == 'present':
                        exp_item["current"] = True
                    else:
                        exp_item["endDate"] = end
                elif line.startswith(('-', '•', '*', '–')):
                    exp_item["bullets"].append(line.lstrip('-•*– '))
                elif not exp_item.get("position") and len(line) < 50:
                    exp_item["position"] = line
            
            if exp_item["company"] or exp_item["position"]:
                experiences.append(exp_item)
        
        # If no structured parsing worked, create single entry with the text
        if not experiences and exp_str:
            experiences.append({
                "company": "",
                "position": "",
                "location": "",
                "startDate": "",
                "endDate": "",
                "current": False,
                "bullets": [l.strip() for l in exp_str.split('\n') if l.strip()][:5],
            })
        
        return experiences
    
    def _parse_education(self, edu_str: str) -> List[Dict[str, Any]]:
        """Parse education string into structured format."""
        if not edu_str or edu_str == "Not provided":
            return []
        
        education = []
        import re
        
        # Split by double newlines or degree keywords
        entries = re.split(r'\n\s*\n', edu_str)
        
        for entry in entries:
            if not entry.strip():
                continue
            
            lines = [l.strip() for l in entry.strip().split('\n') if l.strip()]
            if not lines:
                continue
            
            edu_item = {
                "institution": "",
                "degree": "",
                "field": "",
                "location": "",
                "startDate": "",
                "endDate": "",
                "gpa": "",
            }
            
            first_line = lines[0]
            
            # Common patterns: "Degree from University" or "University - Degree"
            if ' from ' in first_line.lower():
                parts = first_line.split(' from ', 1)
                edu_item["degree"] = parts[0].strip()
                edu_item["institution"] = parts[1].strip()
            elif ' at ' in first_line.lower():
                parts = first_line.split(' at ', 1)
                edu_item["degree"] = parts[0].strip()
                edu_item["institution"] = parts[1].strip()
            elif ' - ' in first_line:
                parts = first_line.split(' - ', 1)
                edu_item["institution"] = parts[0].strip()
                edu_item["degree"] = parts[1].strip()
            else:
                # Check for degree keywords
                degree_keywords = ['bachelor', 'master', 'phd', 'doctorate', 'associate', 'bs', 'ba', 'ms', 'ma', 'mba']
                if any(kw in first_line.lower() for kw in degree_keywords):
                    edu_item["degree"] = first_line
                else:
                    edu_item["institution"] = first_line
            
            # Look for more details in remaining lines
            for line in lines[1:]:
                # GPA pattern
                gpa_match = re.search(r'gpa[:\s]*(\d+\.?\d*)', line, re.I)
                if gpa_match:
                    edu_item["gpa"] = gpa_match.group(1)
                
                # Date pattern
                date_match = re.search(r'(\d{4})\s*[-–to]+\s*(\d{4}|present)', line, re.I)
                if date_match:
                    edu_item["startDate"] = date_match.group(1)
                    edu_item["endDate"] = date_match.group(2) if date_match.group(2).lower() != 'present' else ""
                elif re.search(r'\d{4}', line) and not edu_item.get("endDate"):
                    edu_item["endDate"] = re.search(r'\d{4}', line).group()
                
                # Field of study
                if not edu_item.get("field") and 'in ' in line.lower():
                    field_match = re.search(r'in\s+(.+)', line, re.I)
                    if field_match:
                        edu_item["field"] = field_match.group(1).strip()
            
            if edu_item["institution"] or edu_item["degree"]:
                education.append(edu_item)
        
        # If no structured parsing worked, create single entry
        if not education and edu_str:
            education.append({
                "institution": edu_str.split('\n')[0][:100],
                "degree": "",
                "field": "",
                "location": "",
                "startDate": "",
                "endDate": "",
            })
        
        return education
    
    def _parse_skills(self, skills_str: str, technical: Optional[str] = None, soft: Optional[str] = None) -> List[Dict[str, str]]:
        """Parse skills string into structured format."""
        skills = []
        
        def extract_skills(text: str, category: str = "technical") -> List[Dict[str, str]]:
            if not text:
                return []
            # Split by commas, semicolons, newlines, or bullet points
            import re
            items = re.split(r'[,;\n•\-\*]+', text)
            return [{"name": s.strip(), "category": category} for s in items if s.strip() and len(s.strip()) < 50]
        
        # Add technical skills
        if technical:
            skills.extend(extract_skills(technical, "technical"))
        
        # Add soft skills
        if soft:
            skills.extend(extract_skills(soft, "soft"))
        
        # Add general skills
        if skills_str and skills_str != "Not provided":
            general = extract_skills(skills_str, "technical")
            # Avoid duplicates
            existing_names = {s["name"].lower() for s in skills}
            for s in general:
                if s["name"].lower() not in existing_names:
                    skills.append(s)
        
        return skills
    
    def _parse_projects(self, projects_str: str) -> List[Dict[str, Any]]:
        """Parse projects string into structured format."""
        if not projects_str or projects_str in ("N/A", "Not provided"):
            return []
        
        projects = []
        import re
        
        # Split by double newlines
        entries = re.split(r'\n\s*\n', projects_str)
        
        for entry in entries:
            if not entry.strip():
                continue
            
            lines = [l.strip() for l in entry.strip().split('\n') if l.strip()]
            if not lines:
                continue
            
            proj = {
                "name": lines[0][:100],
                "description": "",
                "technologies": [],
                "bullets": [],
            }
            
            for line in lines[1:]:
                if line.startswith(('-', '•', '*')):
                    proj["bullets"].append(line.lstrip('-•* '))
                elif 'tech' in line.lower() or ':' in line:
                    # Might be technologies
                    tech_match = re.search(r'(?:technologies?|tech|stack|built with)[:\s]*(.+)', line, re.I)
                    if tech_match:
                        proj["technologies"] = [t.strip() for t in tech_match.group(1).split(',')]
                else:
                    proj["description"] = line
            
            projects.append(proj)
        
        return projects
    
    def _parse_certifications(self, certs_str: str) -> List[Dict[str, str]]:
        """Parse certifications string into structured format."""
        if not certs_str or certs_str in ("N/A", "Not provided"):
            return []
        
        certs = []
        import re
        
        # Split by newlines or commas
        entries = re.split(r'\n|;', certs_str)
        
        for entry in entries:
            if not entry.strip():
                continue
            
            cert = {
                "name": entry.strip()[:100],
                "issuer": "",
                "date": "",
            }
            
            # Try to extract issuer and date
            if ' - ' in entry:
                parts = entry.split(' - ')
                cert["name"] = parts[0].strip()
                if len(parts) > 1:
                    cert["issuer"] = parts[1].strip()
            
            # Look for date
            date_match = re.search(r'\d{4}', entry)
            if date_match:
                cert["date"] = date_match.group()
            
            certs.append(cert)
        
        return certs
    
    def _parse_languages(self, lang_str: str) -> List[Dict[str, str]]:
        """Parse languages string into structured format."""
        if not lang_str or lang_str in ("N/A", "Not provided"):
            return []
        
        languages = []
        import re
        
        # Split by commas, semicolons, or newlines
        entries = re.split(r'[,;\n]+', lang_str)
        
        for entry in entries:
            if not entry.strip():
                continue
            
            lang = {
                "name": entry.strip()[:50],
                "proficiency": "",
            }
            
            # Look for proficiency level
            proficiency_match = re.search(r'\(([^)]+)\)|[-:]\s*(.+)', entry)
            if proficiency_match:
                prof = proficiency_match.group(1) or proficiency_match.group(2)
                lang["proficiency"] = prof.strip()
                lang["name"] = re.sub(r'\([^)]+\)|[-:].*', '', entry).strip()
            
            if lang["name"]:
                languages.append(lang)
        
        return languages

    def _parse_resume_sections(self, content: str) -> List[DocumentSection]:
        """Parse resume content into sections."""
        sections = []
        current_section = None
        current_content = []
        
        lines = content.split('\n')
        
        for line in lines:
            # Check if line is a heading (starts with # or is all caps)
            if line.startswith('#') or (line.strip() and line.strip().isupper() and len(line.strip()) < 50):
                # Save previous section
                if current_section:
                    sections.append(DocumentSection(
                        heading=current_section,
                        content_markdown='\n'.join(current_content).strip()
                    ))
                
                # Start new section
                current_section = line.strip('#').strip()
                current_content = []
            else:
                current_content.append(line)
        
        # Add last section
        if current_section:
            sections.append(DocumentSection(
                heading=current_section,
                content_markdown='\n'.join(current_content).strip()
            ))
        
        return sections if sections else [DocumentSection(
            heading="Resume",
            content_markdown=content
        )]

    async def refine_section(
        self, state: DocumentBuilderState, section_name: str, feedback: str
    ) -> DocumentSection:
        """
        Refine a specific section based on user feedback.
        
        Args:
            state: Current state
            section_name: Name of section to refine
            feedback: User's refinement request
            
        Returns:
            Refined DocumentSection
        """
        if not state.draft:
            raise ValueError("No draft available to refine")
        
        # Find the section
        target_section = None
        for section in state.draft.sections:
            if section.heading.lower() == section_name.lower():
                target_section = section
                break
        
        if not target_section:
            raise ValueError(f"Section '{section_name}' not found")
        
        # Refine using LLM
        refinement_prompt = RESUME_REFINEMENT_PROMPT.format(
            section_name=section_name,
            current_content=target_section.content_markdown,
            feedback=feedback
        )
        
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=refinement_prompt),
        ]
        
        response = self._invoke_with_fallback(messages)
        refined_content = response.content.strip()
        
        return DocumentSection(
            heading=section_name,
            content_markdown=refined_content
        )

    def get_generation_summary(self, document: GeneratedDocument) -> str:
        """Generate a summary message about the created resume."""
        return f"""Your resume is ready! It includes:

- {len(document.sections)} sections
- {document.word_count} words
- Tailored for: {document.target_program or 'your target role'}

You can now download it, or ask me to refine any section."""

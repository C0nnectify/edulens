"""
Profile Updater Agent - NLP-based Profile Data Extraction

This agent analyzes chat messages and extracts profile-relevant information
using LLM-powered NLP. It identifies entities like education, work experience,
test scores, and other profile fields from natural conversation.
"""

import json
import re
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from uuid import uuid4

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


# ============================================
# EXTRACTION PATTERNS
# ============================================

class ExtractionPattern(BaseModel):
    """Pattern for extracting specific profile fields"""
    section: str
    field: str
    patterns: List[str]
    extractor: str  # Function name to call
    confidence_base: float = 0.7


# Patterns for common profile information
EXTRACTION_PATTERNS = [
    # Education patterns
    ExtractionPattern(
        section="education",
        field="institution",
        patterns=[
            r"(?:I (?:go|went|study|studied|attend|attended) (?:to|at) )?([A-Z][A-Za-z\s]+(?:University|College|Institute|School))",
            r"(?:from|at) ([A-Z][A-Za-z\s]+(?:University|College|Institute|School))",
            r"(?:my (?:undergrad|bachelor|master|phd) (?:is|was) (?:at|from) )([A-Z][A-Za-z\s]+)",
        ],
        extractor="extract_institution",
    ),
    ExtractionPattern(
        section="education",
        field="major",
        patterns=[
            r"(?:major(?:ing)? in|studying|studied) ([A-Za-z\s]+)(?:\s(?:at|from))?",
            r"(?:my major is|i'm a) ([A-Za-z\s]+) (?:student|major)",
        ],
        extractor="extract_major",
    ),
    ExtractionPattern(
        section="education",
        field="gpa",
        patterns=[
            r"(?:my )?(?:gpa|GPA) (?:is|was|of) (\d+\.?\d*)",
            r"(\d+\.?\d*) (?:gpa|GPA)",
        ],
        extractor="extract_gpa",
    ),
    
    # Test score patterns
    ExtractionPattern(
        section="testScores",
        field="gre_verbal",
        patterns=[
            r"(?:GRE|gre) (?:verbal|v|V) ?:? ?(\d{3})",
            r"verbal ?:? ?(\d{3})",
        ],
        extractor="extract_gre_score",
    ),
    ExtractionPattern(
        section="testScores",
        field="gre_quant",
        patterns=[
            r"(?:GRE|gre) (?:quant|q|Q|quantitative) ?:? ?(\d{3})",
            r"quant(?:itative)? ?:? ?(\d{3})",
        ],
        extractor="extract_gre_score",
    ),
    ExtractionPattern(
        section="testScores",
        field="toefl_total",
        patterns=[
            r"(?:TOEFL|toefl) (?:total|score)? ?:? ?(\d{2,3})",
            r"(?:scored|got) (\d{2,3}) (?:on|in) (?:TOEFL|toefl)",
        ],
        extractor="extract_toefl_score",
    ),
    ExtractionPattern(
        section="testScores",
        field="ielts_overall",
        patterns=[
            r"(?:IELTS|ielts) (?:overall|band|score)? ?:? ?(\d\.?\d?)",
            r"(?:scored|got) (\d\.?\d?) (?:on|in) (?:IELTS|ielts)",
        ],
        extractor="extract_ielts_score",
    ),
    
    # Work experience patterns
    ExtractionPattern(
        section="workExperience",
        field="company",
        patterns=[
            r"(?:work(?:ed|ing)? (?:at|for) )([A-Z][A-Za-z0-9\s&]+)",
            r"(?:employed (?:at|by) )([A-Z][A-Za-z0-9\s&]+)",
        ],
        extractor="extract_company",
    ),
    ExtractionPattern(
        section="workExperience",
        field="position",
        patterns=[
            r"(?:work(?:ed|ing)? as (?:a |an )?)([\w\s]+?)(?:\s(?:at|for|in))",
            r"(?:my (?:role|position|job|title) (?:is|was) )([\w\s]+)",
        ],
        extractor="extract_position",
    ),
    
    # Research patterns
    ExtractionPattern(
        section="research",
        field="interests",
        patterns=[
            r"(?:interested in|research (?:interests?|areas?)(?: (?:are|is|include))?) ([^.]+)",
            r"(?:working on|researching) ([^.]+)",
        ],
        extractor="extract_research_interests",
    ),
    
    # Goals patterns
    ExtractionPattern(
        section="applicationGoals",
        field="targetDegree",
        patterns=[
            r"(?:applying for|want to do|pursuing) (?:a )?(master'?s?|phd|doctorate|mba)",
            r"(?:MS|PhD|MBA|Masters|Doctorate) (?:program|degree)?",
        ],
        extractor="extract_degree_type",
    ),
    ExtractionPattern(
        section="applicationGoals",
        field="targetFields",
        patterns=[
            r"(?:in|for) ([A-Za-z\s]+)(?:\s(?:program|department|field))",
            r"(?:study|studying) ([A-Za-z\s]+)",
        ],
        extractor="extract_target_field",
    ),
]


# ============================================
# EXTRACTION RESULTS
# ============================================

class ExtractedField(BaseModel):
    """A single extracted field from chat"""
    section: str
    field: str
    value: Any
    confidence: float
    source_text: str
    extraction_method: str


class ExtractionResult(BaseModel):
    """Result of profile extraction from chat"""
    extracted_fields: List[ExtractedField] = Field(default_factory=list)
    suggested_updates: List[Dict[str, Any]] = Field(default_factory=list)
    requires_confirmation: bool = True
    message: str = ""
    raw_analysis: Optional[Dict[str, Any]] = None


# ============================================
# PROFILE UPDATER AGENT
# ============================================

class ProfileUpdaterAgent:
    """
    Agent that extracts profile information from chat messages.
    
    Uses a combination of:
    1. Regex patterns for common formats
    2. LLM analysis for complex extractions
    3. Context-aware refinement
    """
    
    def __init__(self, llm_client=None):
        self.llm = llm_client
        self.patterns = EXTRACTION_PATTERNS
    
    async def analyze_message(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None
    ) -> ExtractionResult:
        """
        Analyze a chat message for profile-relevant information.
        
        Args:
            message: The user's message
            context: Optional context (current profile, conversation history)
            
        Returns:
            ExtractionResult with extracted fields and suggested updates
        """
        extracted_fields = []
        
        # Step 1: Pattern-based extraction
        pattern_extractions = self._extract_with_patterns(message)
        extracted_fields.extend(pattern_extractions)
        
        # Step 2: LLM-based extraction (if available)
        if self.llm:
            llm_extractions = await self._extract_with_llm(message, context)
            extracted_fields.extend(llm_extractions)
        
        # Step 3: Deduplicate and merge
        merged_fields = self._merge_extractions(extracted_fields)
        
        # Step 4: Generate suggested updates
        suggested_updates = self._generate_updates(merged_fields)
        
        # Step 5: Determine if confirmation is needed
        requires_confirmation = any(f.confidence < 0.9 for f in merged_fields)
        
        return ExtractionResult(
            extracted_fields=merged_fields,
            suggested_updates=suggested_updates,
            requires_confirmation=requires_confirmation,
            message=f"Found {len(merged_fields)} profile fields to update"
        )
    
    def _extract_with_patterns(self, message: str) -> List[ExtractedField]:
        """Extract fields using regex patterns"""
        extractions = []
        
        for pattern_config in self.patterns:
            for pattern in pattern_config.patterns:
                matches = re.finditer(pattern, message, re.IGNORECASE)
                for match in matches:
                    value = match.group(1).strip()
                    
                    # Clean and validate the value
                    cleaned_value = self._clean_extracted_value(
                        value,
                        pattern_config.field
                    )
                    
                    if cleaned_value:
                        extractions.append(ExtractedField(
                            section=pattern_config.section,
                            field=pattern_config.field,
                            value=cleaned_value,
                            confidence=pattern_config.confidence_base,
                            source_text=match.group(0),
                            extraction_method="pattern"
                        ))
        
        return extractions
    
    async def _extract_with_llm(
        self,
        message: str,
        context: Optional[Dict[str, Any]]
    ) -> List[ExtractedField]:
        """Extract fields using LLM analysis"""
        if not self.llm:
            return []
        
        prompt = self._build_extraction_prompt(message, context)
        
        try:
            # Call LLM for extraction
            response = await self.llm.generate(prompt)
            
            # Parse LLM response
            extractions = self._parse_llm_response(response, message)
            return extractions
            
        except Exception as e:
            logger.error(f"LLM extraction failed: {e}")
            return []
    
    def _build_extraction_prompt(
        self,
        message: str,
        context: Optional[Dict[str, Any]]
    ) -> str:
        """Build prompt for LLM extraction"""
        return f"""Analyze this message from a graduate school applicant and extract any profile information.

Message: "{message}"

Extract the following types of information if present:
- Education: institution, degree, major, GPA, graduation date
- Test Scores: GRE (verbal, quant, AW), TOEFL, IELTS, GMAT
- Work Experience: company, position, duration
- Research: projects, publications, interests
- Goals: target degree, target programs, countries
- Personal: name, nationality, contact info

Return a JSON object with the following structure:
{{
    "extractions": [
        {{
            "section": "education|testScores|workExperience|research|goals|personal",
            "field": "field_name",
            "value": "extracted_value",
            "confidence": 0.0-1.0
        }}
    ]
}}

Only include fields you are confident about. If no profile information is found, return an empty extractions array.
"""
    
    def _parse_llm_response(
        self,
        response: str,
        source_message: str
    ) -> List[ExtractedField]:
        """Parse LLM response into ExtractedField objects"""
        try:
            # Try to extract JSON from response
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if not json_match:
                return []
            
            data = json.loads(json_match.group())
            extractions = []
            
            for item in data.get("extractions", []):
                extractions.append(ExtractedField(
                    section=item["section"],
                    field=item["field"],
                    value=item["value"],
                    confidence=item.get("confidence", 0.7),
                    source_text=source_message,
                    extraction_method="llm"
                ))
            
            return extractions
            
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Failed to parse LLM response: {e}")
            return []
    
    def _clean_extracted_value(self, value: str, field: str) -> Any:
        """Clean and validate extracted values"""
        value = value.strip()
        
        # Field-specific cleaning
        if field == "gpa":
            try:
                gpa = float(value)
                if 0 <= gpa <= 4.0 or 0 <= gpa <= 10.0:
                    return gpa
                return None
            except ValueError:
                return None
        
        elif field in ["gre_verbal", "gre_quant"]:
            try:
                score = int(value)
                if 130 <= score <= 170:
                    return score
                return None
            except ValueError:
                return None
        
        elif field == "toefl_total":
            try:
                score = int(value)
                if 0 <= score <= 120:
                    return score
                return None
            except ValueError:
                return None
        
        elif field == "ielts_overall":
            try:
                score = float(value)
                if 0 <= score <= 9.0:
                    return score
                return None
            except ValueError:
                return None
        
        elif field == "targetDegree":
            degree_map = {
                "master": "masters",
                "masters": "masters",
                "ms": "masters",
                "phd": "phd",
                "doctorate": "phd",
                "mba": "mba",
            }
            return degree_map.get(value.lower(), value)
        
        # Default: return cleaned string
        return value if len(value) > 1 else None
    
    def _merge_extractions(
        self,
        extractions: List[ExtractedField]
    ) -> List[ExtractedField]:
        """Merge and deduplicate extractions"""
        # Group by section+field
        grouped: Dict[str, List[ExtractedField]] = {}
        for ext in extractions:
            key = f"{ext.section}:{ext.field}"
            if key not in grouped:
                grouped[key] = []
            grouped[key].append(ext)
        
        # For each group, keep highest confidence
        merged = []
        for key, items in grouped.items():
            best = max(items, key=lambda x: x.confidence)
            merged.append(best)
        
        return merged
    
    def _generate_updates(
        self,
        extractions: List[ExtractedField]
    ) -> List[Dict[str, Any]]:
        """Generate profile update suggestions from extractions"""
        # Group by section
        by_section: Dict[str, Dict[str, Any]] = {}
        
        for ext in extractions:
            if ext.section not in by_section:
                by_section[ext.section] = {}
            by_section[ext.section][ext.field] = ext.value
        
        # Convert to update requests
        updates = []
        for section, data in by_section.items():
            updates.append({
                "section": section,
                "data": data,
                "source": "chat",
                "sync_to_roadmap": True
            })
        
        return updates
    
    async def process_conversation(
        self,
        messages: List[Dict[str, str]],
        current_profile: Optional[Dict[str, Any]] = None
    ) -> ExtractionResult:
        """
        Process an entire conversation for profile extractions.
        
        Useful for batch processing or initial profile creation from chat history.
        """
        all_extractions = []
        
        for msg in messages:
            if msg.get("role") == "user":
                result = await self.analyze_message(
                    msg["content"],
                    context={"current_profile": current_profile}
                )
                all_extractions.extend(result.extracted_fields)
        
        # Merge all extractions
        merged = self._merge_extractions(all_extractions)
        suggested_updates = self._generate_updates(merged)
        
        return ExtractionResult(
            extracted_fields=merged,
            suggested_updates=suggested_updates,
            requires_confirmation=True,
            message=f"Extracted {len(merged)} fields from {len(messages)} messages"
        )


# ============================================
# FACTORY FUNCTION
# ============================================

def create_profile_updater_agent(llm_client=None) -> ProfileUpdaterAgent:
    """Factory function to create a ProfileUpdaterAgent"""
    return ProfileUpdaterAgent(llm_client=llm_client)


# ============================================
# CONVENIENCE FUNCTIONS
# ============================================

async def extract_profile_from_message(
    message: str,
    context: Optional[Dict[str, Any]] = None,
    llm_client=None
) -> ExtractionResult:
    """Convenience function for one-off extractions"""
    agent = create_profile_updater_agent(llm_client)
    return await agent.analyze_message(message, context)


async def extract_profile_from_conversation(
    messages: List[Dict[str, str]],
    current_profile: Optional[Dict[str, Any]] = None,
    llm_client=None
) -> ExtractionResult:
    """Convenience function for conversation processing"""
    agent = create_profile_updater_agent(llm_client)
    return await agent.process_conversation(messages, current_profile)

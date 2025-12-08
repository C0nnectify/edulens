"""
SOP Template Service - Comprehensive template library management
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorCollection
import re
import google.generativeai as genai

from app.models.sop_template import (
    SOPTemplate,
    TemplateSearchFilters,
    TemplateSearchRequest,
    TemplateSearchResponse,
    PersonalizationData,
    PersonalizeTemplateRequest,
    PersonalizeTemplateResponse,
    CustomizeTemplateRequest,
    CustomizeTemplateResponse,
    TemplateRecommendationRequest,
    TemplateRecommendation,
    TemplateRecommendationResponse,
    SectionMixRequest,
    SectionMixResponse,
    ToneAdjustmentRequest,
    ToneAdjustmentResponse,
    SectionEnhancementRequest,
    SectionEnhancementResponse,
    CreateTemplateRequest,
    UpdateTemplateRequest,
    TemplateStatistics,
    BulkTemplateStatistics,
    DegreeLevel,
    FieldCategory,
    SOPPurpose,
    SectionType,
    ToneIndicator,
)
from app.config import settings
from app.database import get_database

logger = logging.getLogger(__name__)


class SOPTemplateService:
    """Service for managing and personalizing SOP templates"""

    def __init__(self):
        self.db = None
        self.collection: Optional[AsyncIOMotorCollection] = None
        self._initialized = False

        # Initialize Google Gemini if API key is available
        if settings.google_api_key:
            genai.configure(api_key=settings.google_api_key)
            self.model = genai.GenerativeModel(settings.google_model)
        else:
            self.model = None
            logger.warning("Google API key not configured. AI customization will be limited.")

    async def initialize(self):
        """Initialize database connection"""
        if not self._initialized:
            self.db = await get_database()
            self.collection = self.db["sop_templates"]

            # Create indexes
            await self.collection.create_index([("id", 1)], unique=True)
            await self.collection.create_index([("category.degree", 1)])
            await self.collection.create_index([("category.field", 1)])
            await self.collection.create_index([("category.purpose", 1)])
            await self.collection.create_index([("tags", 1)])
            await self.collection.create_index([("usage_count", -1)])
            await self.collection.create_index([("success_rate", -1)])
            await self.collection.create_index([
                ("title", "text"),
                ("description", "text"),
                ("target_audience", "text")
            ])

            self._initialized = True
            logger.info("SOP Template Service initialized")

    async def create_template(self, request: CreateTemplateRequest) -> SOPTemplate:
        """Create a new template (admin function)"""
        await self.initialize()

        template = SOPTemplate(
            id=self._generate_template_id(request.category),
            title=request.title,
            description=request.description,
            category=request.category,
            word_count_min=request.word_count_min,
            word_count_max=request.word_count_max,
            word_count_target=request.word_count_target,
            structure=request.structure,
            content=request.content,
            tone=request.tone,
            target_audience=request.target_audience,
            tags=request.tags,
        )

        await self.collection.insert_one(template.model_dump())
        logger.info(f"Created template: {template.id}")

        return template

    async def get_template(self, template_id: str) -> Optional[SOPTemplate]:
        """Get a specific template by ID"""
        await self.initialize()

        doc = await self.collection.find_one({"id": template_id})
        if doc:
            return SOPTemplate(**doc)
        return None

    async def list_templates(
        self,
        skip: int = 0,
        limit: int = 50
    ) -> List[SOPTemplate]:
        """List all templates with pagination"""
        await self.initialize()

        cursor = self.collection.find().skip(skip).limit(limit)
        templates = []

        async for doc in cursor:
            templates.append(SOPTemplate(**doc))

        return templates

    async def search_templates(
        self,
        request: TemplateSearchRequest
    ) -> TemplateSearchResponse:
        """Search templates with filters"""
        await self.initialize()

        query = {}

        # Apply filters
        if request.filters:
            if request.filters.degree:
                query["category.degree"] = request.filters.degree.value
            if request.filters.field:
                query["category.field"] = request.filters.field.value
            if request.filters.purpose:
                query["category.purpose"] = request.filters.purpose.value
            if request.filters.word_count_min:
                query["word_count_max"] = {"$gte": request.filters.word_count_min}
            if request.filters.word_count_max:
                query["word_count_min"] = {"$lte": request.filters.word_count_max}
            if request.filters.tags:
                query["tags"] = {"$in": request.filters.tags}

        # Apply text search
        if request.query:
            query["$text"] = {"$search": request.query}

        # Count total
        total = await self.collection.count_documents(query)

        # Build sort
        sort = []
        if request.sort_by == "usage_count":
            sort = [("usage_count", -1)]
        elif request.sort_by == "success_rate":
            sort = [("success_rate", -1)]
        else:
            sort = [("created_at", -1)]

        # Execute query
        cursor = self.collection.find(query).sort(sort).skip(request.offset).limit(request.limit)
        templates = []

        async for doc in cursor:
            templates.append(SOPTemplate(**doc))

        return TemplateSearchResponse(
            templates=templates,
            total=total,
            limit=request.limit,
            offset=request.offset
        )

    async def personalize_template(
        self,
        request: PersonalizeTemplateRequest
    ) -> PersonalizeTemplateResponse:
        """Personalize a template with user data"""
        await self.initialize()

        template = await self.get_template(request.template_id)
        if not template:
            raise ValueError(f"Template not found: {request.template_id}")

        # Build variable mapping
        variables_used = self._build_variable_mapping(
            template,
            request.personalization_data
        )

        # Replace variables in content
        personalized_content = template.content.raw_content
        for placeholder, value in variables_used.items():
            personalized_content = personalized_content.replace(placeholder, value)

        # Replace variables in sections
        sections = {}
        for section_type, content in template.content.sections.items():
            section_content = content
            for placeholder, value in variables_used.items():
                section_content = section_content.replace(placeholder, value)
            sections[section_type] = section_content

        # Filter sections if requested
        if request.sections_to_include:
            sections = {
                k: v for k, v in sections.items()
                if k in [s.value for s in request.sections_to_include]
            }
            personalized_content = "\n\n".join(sections.values())

        # Calculate word count
        word_count = len(personalized_content.split())

        # Generate suggestions
        suggestions = self._generate_personalization_suggestions(
            template,
            request.personalization_data,
            word_count
        )

        # Update usage count
        await self.collection.update_one(
            {"id": request.template_id},
            {"$inc": {"usage_count": 1}}
        )

        return PersonalizeTemplateResponse(
            template_id=request.template_id,
            personalized_content=personalized_content,
            sections=sections,
            word_count=word_count,
            variables_used=variables_used,
            suggestions=suggestions
        )

    async def customize_template(
        self,
        request: CustomizeTemplateRequest
    ) -> CustomizeTemplateResponse:
        """AI-powered template customization"""
        await self.initialize()

        if not self.model:
            raise ValueError("AI customization requires Google API key")

        # First, personalize the template
        personalize_request = PersonalizeTemplateRequest(
            template_id=request.template_id,
            personalization_data=request.personalization_data
        )
        personalized = await self.personalize_template(personalize_request)

        # Build AI customization prompt
        prompt = self._build_customization_prompt(
            personalized.personalized_content,
            request
        )

        try:
            # Generate customized content
            response = await self.model.generate_content_async(prompt)
            customized_content = response.text

            # Extract sections from customized content
            sections = self._extract_sections_from_content(customized_content)

            # Calculate word count
            word_count = len(customized_content.split())

            # Generate list of changes
            changes_made = self._identify_changes(
                personalized.personalized_content,
                customized_content
            )

            # Generate improvement suggestions
            improvement_suggestions = await self._generate_improvement_suggestions(
                customized_content,
                request.personalization_data
            )

            return CustomizeTemplateResponse(
                template_id=request.template_id,
                original_content=personalized.personalized_content,
                customized_content=customized_content,
                sections=sections,
                word_count=word_count,
                changes_made=changes_made,
                improvement_suggestions=improvement_suggestions
            )

        except Exception as e:
            logger.error(f"AI customization failed: {e}")
            raise ValueError(f"AI customization failed: {str(e)}")

    async def get_recommendations(
        self,
        request: TemplateRecommendationRequest
    ) -> TemplateRecommendationResponse:
        """Get recommended templates for user profile"""
        await self.initialize()

        # Build base query
        query = {
            "category.degree": request.degree.value,
            "category.field": request.field.value,
        }

        if request.purpose:
            query["category.purpose"] = request.purpose.value

        # Get matching templates
        cursor = self.collection.find(query).sort("success_rate", -1).limit(10)
        templates = []

        async for doc in cursor:
            templates.append(SOPTemplate(**doc))

        # Calculate relevance scores
        recommendations = []
        for template in templates:
            score, reasons = self._calculate_relevance_score(
                template,
                request.user_profile,
                request.preferences
            )

            recommendations.append(TemplateRecommendation(
                template=template,
                relevance_score=score,
                match_reasons=reasons
            ))

        # Sort by relevance score
        recommendations.sort(key=lambda x: x.relevance_score, reverse=True)

        return TemplateRecommendationResponse(
            recommendations=recommendations,
            total=len(recommendations)
        )

    async def mix_sections(
        self,
        request: SectionMixRequest
    ) -> SectionMixResponse:
        """Mix sections from different templates"""
        await self.initialize()

        mixed_sections = {}
        source_templates = {}

        # Gather sections from different templates
        for section_type, template_id in request.section_selections.items():
            template = await self.get_template(template_id)
            if not template:
                raise ValueError(f"Template not found: {template_id}")

            section_content = template.content.sections.get(section_type.value)
            if not section_content:
                raise ValueError(
                    f"Section {section_type.value} not found in template {template_id}"
                )

            # Personalize section
            variables = self._build_variable_mapping(template, request.personalization_data)
            for placeholder, value in variables.items():
                section_content = section_content.replace(placeholder, value)

            mixed_sections[section_type.value] = section_content
            source_templates[section_type] = template_id

        # Combine sections
        if request.transitions and self.model:
            mixed_content = await self._generate_with_transitions(mixed_sections)
        else:
            mixed_content = "\n\n".join(mixed_sections.values())

        word_count = len(mixed_content.split())

        return SectionMixResponse(
            mixed_content=mixed_content,
            sections=mixed_sections,
            source_templates=source_templates,
            word_count=word_count
        )

    async def adjust_tone(
        self,
        request: ToneAdjustmentRequest
    ) -> ToneAdjustmentResponse:
        """Adjust tone of content"""
        if not self.model:
            raise ValueError("Tone adjustment requires Google API key")

        prompt = f"""
        Adjust the tone of the following Statement of Purpose content.

        Current tone: {request.current_tone.value if request.current_tone else "Unknown"}
        Target tone: {request.target_tone.value}
        Section type: {request.section_type.value if request.section_type else "General"}

        Guidelines for {request.target_tone.value} tone:
        {self._get_tone_guidelines(request.target_tone)}

        Original content:
        {request.content}

        Provide the adjusted content maintaining the same information but with the {request.target_tone.value} tone.
        Only return the adjusted content, no explanations.
        """

        try:
            response = await self.model.generate_content_async(prompt)
            adjusted_content = response.text.strip()

            original_words = len(request.content.split())
            adjusted_words = len(adjusted_content.split())

            changes_description = self._describe_tone_changes(
                request.current_tone,
                request.target_tone
            )

            return ToneAdjustmentResponse(
                original_content=request.content,
                adjusted_content=adjusted_content,
                changes_description=changes_description,
                word_count_change=adjusted_words - original_words
            )

        except Exception as e:
            logger.error(f"Tone adjustment failed: {e}")
            raise ValueError(f"Tone adjustment failed: {str(e)}")

    async def enhance_section(
        self,
        request: SectionEnhancementRequest
    ) -> SectionEnhancementResponse:
        """Enhance a specific section"""
        if not self.model:
            raise ValueError("Section enhancement requires Google API key")

        prompt = f"""
        Enhance the following {request.section_type.value} section of a Statement of Purpose.

        Enhancement type: {request.enhancement_type}

        Original content:
        {request.content}

        Additional context:
        {request.context if request.context else "None provided"}

        Enhancement instructions:
        {self._get_enhancement_instructions(request.enhancement_type, request.section_type)}

        Provide the enhanced content. Only return the enhanced content, no explanations.
        """

        try:
            response = await self.model.generate_content_async(prompt)
            enhanced_content = response.text.strip()

            original_words = len(request.content.split())
            enhanced_words = len(enhanced_content.split())

            improvements = self._identify_enhancements(
                request.content,
                enhanced_content,
                request.enhancement_type
            )

            return SectionEnhancementResponse(
                original_content=request.content,
                enhanced_content=enhanced_content,
                improvements=improvements,
                word_count_change=enhanced_words - original_words
            )

        except Exception as e:
            logger.error(f"Section enhancement failed: {e}")
            raise ValueError(f"Section enhancement failed: {str(e)}")

    async def update_template(
        self,
        template_id: str,
        request: UpdateTemplateRequest
    ) -> SOPTemplate:
        """Update existing template"""
        await self.initialize()

        update_data = {}

        if request.title is not None:
            update_data["title"] = request.title
        if request.description is not None:
            update_data["description"] = request.description
        if request.content is not None:
            update_data["content"] = request.content.model_dump()
        if request.structure is not None:
            update_data["structure"] = [s.model_dump() for s in request.structure]
        if request.success_rate is not None:
            update_data["success_rate"] = request.success_rate
        if request.tags is not None:
            update_data["tags"] = request.tags

        update_data["updated_at"] = datetime.utcnow()
        update_data["version"] = {"$inc": 1}

        result = await self.collection.update_one(
            {"id": template_id},
            {"$set": update_data}
        )

        if result.matched_count == 0:
            raise ValueError(f"Template not found: {template_id}")

        updated_template = await self.get_template(template_id)
        logger.info(f"Updated template: {template_id}")

        return updated_template

    async def delete_template(self, template_id: str) -> bool:
        """Delete a template"""
        await self.initialize()

        result = await self.collection.delete_one({"id": template_id})

        if result.deleted_count > 0:
            logger.info(f"Deleted template: {template_id}")
            return True

        return False

    async def get_template_statistics(
        self,
        template_id: str
    ) -> TemplateStatistics:
        """Get statistics for a specific template"""
        await self.initialize()

        template = await self.get_template(template_id)
        if not template:
            raise ValueError(f"Template not found: {template_id}")

        return TemplateStatistics(
            template_id=template.id,
            title=template.title,
            usage_count=template.usage_count,
            success_rate=template.success_rate,
            average_rating=None,  # TODO: Implement ratings
            last_used=None,  # TODO: Track last usage
            popular_customizations=[]  # TODO: Track customizations
        )

    async def get_bulk_statistics(self) -> BulkTemplateStatistics:
        """Get statistics across all templates"""
        await self.initialize()

        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total_templates": {"$sum": 1},
                    "total_usage": {"$sum": "$usage_count"},
                    "avg_success_rate": {"$avg": "$success_rate"},
                }
            }
        ]

        result = await self.collection.aggregate(pipeline).to_list(1)

        if not result:
            return BulkTemplateStatistics(
                total_templates=0,
                total_usage=0,
                average_success_rate=0.0,
                most_popular_templates=[],
                templates_by_degree={},
                templates_by_field={},
                templates_by_purpose={}
            )

        stats = result[0]

        # Get most popular templates
        popular_cursor = self.collection.find().sort("usage_count", -1).limit(10)
        popular = []
        async for doc in popular_cursor:
            template = SOPTemplate(**doc)
            popular.append(TemplateStatistics(
                template_id=template.id,
                title=template.title,
                usage_count=template.usage_count,
                success_rate=template.success_rate,
                average_rating=None,
                last_used=None,
                popular_customizations=[]
            ))

        # Count by degree
        degree_pipeline = [
            {"$group": {"_id": "$category.degree", "count": {"$sum": 1}}}
        ]
        degree_result = await self.collection.aggregate(degree_pipeline).to_list(None)
        templates_by_degree = {doc["_id"]: doc["count"] for doc in degree_result}

        # Count by field
        field_pipeline = [
            {"$group": {"_id": "$category.field", "count": {"$sum": 1}}}
        ]
        field_result = await self.collection.aggregate(field_pipeline).to_list(None)
        templates_by_field = {doc["_id"]: doc["count"] for doc in field_result}

        # Count by purpose
        purpose_pipeline = [
            {"$group": {"_id": "$category.purpose", "count": {"$sum": 1}}}
        ]
        purpose_result = await self.collection.aggregate(purpose_pipeline).to_list(None)
        templates_by_purpose = {doc["_id"]: doc["count"] for doc in purpose_result}

        return BulkTemplateStatistics(
            total_templates=stats["total_templates"],
            total_usage=stats["total_usage"],
            average_success_rate=stats.get("avg_success_rate", 0.0) or 0.0,
            most_popular_templates=popular,
            templates_by_degree=templates_by_degree,
            templates_by_field=templates_by_field,
            templates_by_purpose=templates_by_purpose
        )

    # Helper methods

    def _generate_template_id(self, category) -> str:
        """Generate unique template ID"""
        degree = category.degree.value.lower().replace(" ", "_").replace("-", "_")
        field = category.field.value.lower().replace(" ", "_")
        purpose = category.purpose.value.lower().replace(" ", "_").replace("-", "_")
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        return f"{degree}_{field}_{purpose}_{timestamp}"

    def _build_variable_mapping(
        self,
        template: SOPTemplate,
        data: PersonalizationData
    ) -> Dict[str, str]:
        """Build mapping of template variables to actual values"""
        mapping = {}

        # Standard variables
        mapping["{{name}}"] = data.name
        mapping["{{university}}"] = data.university
        mapping["{{program}}"] = data.program

        if data.department:
            mapping["{{department}}"] = data.department

        if data.faculty_names:
            mapping["{{faculty}}"] = ", ".join(data.faculty_names[:3])
            if len(data.faculty_names) > 0:
                mapping["{{faculty_1}}"] = data.faculty_names[0]
            if len(data.faculty_names) > 1:
                mapping["{{faculty_2}}"] = data.faculty_names[1]

        if data.research_interests:
            mapping["{{research_interests}}"] = ", ".join(data.research_interests)

        if data.background_summary:
            mapping["{{background}}"] = data.background_summary

        if data.career_goals:
            mapping["{{goals}}"] = data.career_goals

        # Custom variables
        if data.custom_variables:
            for key, value in data.custom_variables.items():
                mapping[f"{{{{{key}}}}}"] = value

        return mapping

    def _generate_personalization_suggestions(
        self,
        template: SOPTemplate,
        data: PersonalizationData,
        word_count: int
    ) -> List[str]:
        """Generate suggestions for improving personalized content"""
        suggestions = []

        # Word count suggestions
        if word_count < template.word_count_min:
            suggestions.append(
                f"Content is {template.word_count_min - word_count} words short. "
                f"Consider expanding key sections."
            )
        elif word_count > template.word_count_max:
            suggestions.append(
                f"Content exceeds maximum by {word_count - template.word_count_max} words. "
                f"Consider condensing some sections."
            )

        # Faculty mentions
        if not data.faculty_names:
            suggestions.append(
                "Consider mentioning specific faculty members whose research aligns with your interests."
            )

        # Research interests
        if not data.research_interests:
            suggestions.append(
                "Add specific research interests to strengthen your application."
            )

        # Publications
        if data.publications:
            suggestions.append(
                f"You have {len(data.publications)} publication(s). "
                f"Make sure to highlight them in the research experience section."
            )

        return suggestions

    def _build_customization_prompt(
        self,
        content: str,
        request: CustomizeTemplateRequest
    ) -> str:
        """Build AI prompt for customization"""
        prompt = f"""
        You are an expert academic advisor helping customize a Statement of Purpose.

        Original SOP:
        {content}

        Applicant Information:
        - Name: {request.personalization_data.name}
        - Target: {request.personalization_data.program} at {request.personalization_data.university}
        - Research Interests: {', '.join(request.personalization_data.research_interests or [])}
        - Background: {request.personalization_data.background_summary or 'Not provided'}
        - Career Goals: {request.personalization_data.career_goals or 'Not provided'}

        Customization Instructions:
        {request.customization_instructions or 'Enhance the overall quality and specificity'}

        """

        if request.tone_adjustment:
            prompt += f"\nTone Adjustment: Make the tone {request.tone_adjustment}\n"

        if request.enhance_sections:
            sections_str = ", ".join([s.value for s in request.enhance_sections])
            prompt += f"\nFocus on enhancing these sections: {sections_str}\n"

        if request.focus_areas:
            prompt += f"\nFocus Areas: {', '.join(request.focus_areas)}\n"

        prompt += """

        Requirements:
        1. Maintain all factual information
        2. Keep the structure and flow
        3. Make content more specific and compelling
        4. Ensure proper academic tone
        5. Include section markers: [INTRODUCTION], [BACKGROUND], etc.
        6. Keep word count similar to original

        Provide only the customized SOP, no explanations.
        """

        return prompt

    def _extract_sections_from_content(self, content: str) -> Dict[str, str]:
        """Extract sections from marked content"""
        sections = {}

        # Find all section markers
        pattern = r'\[(.*?)\](.*?)(?=\[|$)'
        matches = re.finditer(pattern, content, re.DOTALL)

        for match in matches:
            section_name = match.group(1).strip()
            section_content = match.group(2).strip()
            sections[section_name] = section_content

        # If no markers found, return as single section
        if not sections:
            sections["Content"] = content

        return sections

    def _identify_changes(self, original: str, customized: str) -> List[str]:
        """Identify key changes made during customization"""
        changes = []

        original_words = len(original.split())
        customized_words = len(customized.split())

        if abs(customized_words - original_words) > 50:
            changes.append(
                f"Word count changed from {original_words} to {customized_words}"
            )

        # Check for new specific mentions
        if "research" in customized.lower() and customized.lower().count("research") > original.lower().count("research"):
            changes.append("Enhanced research discussion")

        if "faculty" in customized.lower() and customized.lower().count("faculty") > original.lower().count("faculty"):
            changes.append("Added more faculty mentions")

        changes.append("Improved specificity and clarity")
        changes.append("Enhanced academic tone")

        return changes

    async def _generate_improvement_suggestions(
        self,
        content: str,
        data: PersonalizationData
    ) -> List[str]:
        """Generate suggestions for further improvement"""
        suggestions = [
            "Review all faculty mentions for accuracy",
            "Ensure research interests align with program offerings",
            "Proofread for grammar and clarity",
            "Have a mentor review the final draft",
        ]

        if not data.publications:
            suggestions.append("Consider adding any publications or projects")

        return suggestions

    async def _generate_with_transitions(
        self,
        sections: Dict[str, str]
    ) -> str:
        """Generate smooth transitions between mixed sections"""
        if not self.model:
            return "\n\n".join(sections.values())

        prompt = f"""
        Create smooth transitions between these SOP sections while maintaining their content:

        {chr(10).join([f'[{name}]{chr(10)}{content}' for name, content in sections.items()])}

        Add brief transitional sentences where needed to ensure flow.
        Return the complete SOP with all sections and transitions.
        """

        try:
            response = await self.model.generate_content_async(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Transition generation failed: {e}")
            return "\n\n".join(sections.values())

    def _calculate_relevance_score(
        self,
        template: SOPTemplate,
        profile: PersonalizationData,
        preferences: Optional[Dict[str, Any]]
    ) -> tuple[float, List[str]]:
        """Calculate how relevant a template is for the user"""
        score = 0.5  # Base score
        reasons = []

        # Check research interests alignment
        if profile.research_interests and template.field_specific_terminology:
            matching_terms = set(
                term.lower() for term in profile.research_interests
            ).intersection(
                set(term.lower() for term in template.field_specific_terminology)
            )
            if matching_terms:
                score += 0.2
                reasons.append(f"Matches {len(matching_terms)} research interests")

        # Check success rate
        if template.success_rate:
            score += template.success_rate * 0.2
            if template.success_rate > 0.7:
                reasons.append("High success rate")

        # Check usage count (popular templates)
        if template.usage_count > 100:
            score += 0.1
            reasons.append("Popular template")

        # Check preferences
        if preferences:
            if preferences.get("prioritize_research") and template.category.purpose == SOPPurpose.RESEARCH_FOCUSED:
                score += 0.15
                reasons.append("Research-focused")

        # Normalize score
        score = min(score, 1.0)

        if not reasons:
            reasons.append("Good general match")

        return score, reasons

    def _get_tone_guidelines(self, tone: ToneIndicator) -> str:
        """Get guidelines for specific tone"""
        guidelines = {
            ToneIndicator.FORMAL: "Use formal academic language, avoid contractions, maintain professional distance",
            ToneIndicator.CONFIDENT: "Use strong action verbs, assertive statements, show conviction",
            ToneIndicator.HUMBLE: "Acknowledge learning opportunities, show openness, avoid boastful language",
            ToneIndicator.PASSIONATE: "Show enthusiasm, use vivid language, express genuine interest",
            ToneIndicator.ANALYTICAL: "Use logical structure, data-driven language, systematic approach",
            ToneIndicator.NARRATIVE: "Tell a story, use personal anecdotes, create emotional connection",
            ToneIndicator.BALANCED: "Mix confidence with humility, professionalism with personality",
        }
        return guidelines.get(tone, "Maintain appropriate academic tone")

    def _describe_tone_changes(
        self,
        from_tone: Optional[ToneIndicator],
        to_tone: ToneIndicator
    ) -> str:
        """Describe the tone changes made"""
        if from_tone:
            return f"Adjusted tone from {from_tone.value} to {to_tone.value}"
        return f"Applied {to_tone.value} tone"

    def _get_enhancement_instructions(
        self,
        enhancement_type: str,
        section_type: SectionType
    ) -> str:
        """Get specific instructions for enhancement type"""
        instructions = {
            "add_more_detail": f"Add specific details, examples, and concrete information to the {section_type.value} section",
            "make_more_specific": f"Replace general statements with specific achievements, names, and data in the {section_type.value}",
            "add_examples": f"Include concrete examples that illustrate points in the {section_type.value}",
            "improve_flow": f"Improve sentence transitions and logical flow in the {section_type.value}",
            "strengthen_impact": f"Use stronger language and more impactful phrasing in the {section_type.value}",
        }
        return instructions.get(enhancement_type, "Enhance the overall quality")

    def _identify_enhancements(
        self,
        original: str,
        enhanced: str,
        enhancement_type: str
    ) -> List[str]:
        """Identify specific enhancements made"""
        improvements = []

        original_words = len(original.split())
        enhanced_words = len(enhanced.split())

        if enhanced_words > original_words:
            improvements.append(f"Expanded content by {enhanced_words - original_words} words")

        # Count specific elements
        original_numbers = len(re.findall(r'\d+', original))
        enhanced_numbers = len(re.findall(r'\d+', enhanced))

        if enhanced_numbers > original_numbers:
            improvements.append(f"Added {enhanced_numbers - original_numbers} specific data points")

        improvements.append(f"Applied {enhancement_type.replace('_', ' ')} enhancement")
        improvements.append("Improved clarity and impact")

        return improvements


# Global service instance
sop_template_service = SOPTemplateService()

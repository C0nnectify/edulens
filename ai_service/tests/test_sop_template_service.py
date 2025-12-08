"""
Tests for SOP Template Service

Run with: pytest tests/test_sop_template_service.py -v
"""

import pytest
import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

from app.models.sop_template import (
    SOPTemplate,
    TemplateCategory,
    SectionStructure,
    SOPTemplateContent,
    TemplateVariable,
    TemplateSearchRequest,
    TemplateSearchFilters,
    PersonalizationData,
    PersonalizeTemplateRequest,
    CustomizeTemplateRequest,
    TemplateRecommendationRequest,
    SectionMixRequest,
    ToneAdjustmentRequest,
    SectionEnhancementRequest,
    CreateTemplateRequest,
    UpdateTemplateRequest,
    DegreeLevel,
    FieldCategory,
    SOPPurpose,
    SectionType,
    ToneIndicator,
)
from app.services.sop_template_service import SOPTemplateService
from app.config import settings


@pytest.fixture
async def service():
    """Create service instance"""
    service = SOPTemplateService()
    await service.initialize()
    return service


@pytest.fixture
async def clean_database(service):
    """Clean database before and after tests"""
    # Clean before
    await service.collection.delete_many({})
    yield
    # Clean after
    await service.collection.delete_many({})


@pytest.fixture
def sample_template_data():
    """Sample template data for testing"""
    return CreateTemplateRequest(
        title="Test PhD CS Template",
        description="Test template for PhD Computer Science",
        category=TemplateCategory(
            degree=DegreeLevel.PHD,
            field=FieldCategory.COMPUTER_SCIENCE,
            purpose=SOPPurpose.RESEARCH_FOCUSED
        ),
        word_count_min=900,
        word_count_max=1100,
        word_count_target=1000,
        structure=[
            SectionStructure(
                section_type=SectionType.INTRODUCTION,
                paragraphs=1,
                word_count_min=120,
                word_count_max=180,
                word_count_target=150,
                tips=["Start with research passion"],
                key_elements=["Research area", "Achievement"],
                common_mistakes=["Being too generic"],
                example_phrases=["My research in..."]
            ),
            SectionStructure(
                section_type=SectionType.RESEARCH_EXPERIENCE,
                paragraphs=2,
                word_count_min=300,
                word_count_max=400,
                word_count_target=350,
                tips=["Detail research projects"],
                key_elements=["Projects", "Publications"],
                common_mistakes=["Not quantifying impact"]
            ),
        ],
        content=SOPTemplateContent(
            template_id="test_template",
            raw_content="""[INTRODUCTION]
My passion for {{research_area}} began at {{university}}. I have {{num_publications}} publications.

[RESEARCH EXPERIENCE]
At {{institution}}, I worked on {{project}}. I collaborated with Professor {{advisor}}.
""",
            sections={
                "Introduction": "My passion for {{research_area}} began...",
                "Research Experience": "At {{institution}}, I worked..."
            },
            variables=[
                TemplateVariable(
                    name="research_area",
                    placeholder="{{research_area}}",
                    description="Research area",
                    example="machine learning",
                    required=True
                ),
                TemplateVariable(
                    name="university",
                    placeholder="{{university}}",
                    description="University name",
                    example="Stanford",
                    required=True
                ),
            ],
            alternative_intros=[],
            alternative_conclusions=[]
        ),
        tone=[ToneIndicator.FORMAL, ToneIndicator.CONFIDENT],
        target_audience="PhD applicants with research experience",
        tags=["PhD", "CS", "Research"]
    )


class TestSOPTemplateService:
    """Test SOP Template Service"""

    @pytest.mark.asyncio
    async def test_create_template(self, service, clean_database, sample_template_data):
        """Test creating a template"""
        template = await service.create_template(sample_template_data)

        assert template is not None
        assert template.title == sample_template_data.title
        assert template.category.degree == DegreeLevel.PHD
        assert template.category.field == FieldCategory.COMPUTER_SCIENCE
        assert template.word_count_target == 1000
        assert len(template.structure) == 2
        assert len(template.tags) == 3

    @pytest.mark.asyncio
    async def test_get_template(self, service, clean_database, sample_template_data):
        """Test retrieving a template"""
        created = await service.create_template(sample_template_data)
        retrieved = await service.get_template(created.id)

        assert retrieved is not None
        assert retrieved.id == created.id
        assert retrieved.title == created.title

    @pytest.mark.asyncio
    async def test_get_nonexistent_template(self, service, clean_database):
        """Test retrieving non-existent template"""
        result = await service.get_template("nonexistent_id")
        assert result is None

    @pytest.mark.asyncio
    async def test_list_templates(self, service, clean_database, sample_template_data):
        """Test listing templates"""
        # Create multiple templates
        await service.create_template(sample_template_data)

        # Modify and create another
        sample_template_data.title = "Test Masters Template"
        sample_template_data.category.degree = DegreeLevel.MASTERS
        await service.create_template(sample_template_data)

        # List templates
        templates = await service.list_templates(skip=0, limit=10)

        assert len(templates) == 2
        assert templates[0].title != templates[1].title

    @pytest.mark.asyncio
    async def test_search_templates_by_degree(self, service, clean_database, sample_template_data):
        """Test searching templates by degree"""
        # Create templates with different degrees
        await service.create_template(sample_template_data)

        sample_template_data.title = "Test Masters Template"
        sample_template_data.category.degree = DegreeLevel.MASTERS
        await service.create_template(sample_template_data)

        # Search for PhD templates
        request = TemplateSearchRequest(
            filters=TemplateSearchFilters(degree=DegreeLevel.PHD),
            limit=10,
            offset=0
        )
        results = await service.search_templates(request)

        assert results.total == 1
        assert len(results.templates) == 1
        assert results.templates[0].category.degree == DegreeLevel.PHD

    @pytest.mark.asyncio
    async def test_search_templates_by_field(self, service, clean_database, sample_template_data):
        """Test searching templates by field"""
        await service.create_template(sample_template_data)

        request = TemplateSearchRequest(
            filters=TemplateSearchFilters(field=FieldCategory.COMPUTER_SCIENCE),
            limit=10,
            offset=0
        )
        results = await service.search_templates(request)

        assert results.total >= 1
        assert all(t.category.field == FieldCategory.COMPUTER_SCIENCE for t in results.templates)

    @pytest.mark.asyncio
    async def test_search_templates_by_tags(self, service, clean_database, sample_template_data):
        """Test searching templates by tags"""
        await service.create_template(sample_template_data)

        request = TemplateSearchRequest(
            filters=TemplateSearchFilters(tags=["PhD"]),
            limit=10,
            offset=0
        )
        results = await service.search_templates(request)

        assert results.total >= 1
        assert all("PhD" in t.tags for t in results.templates)

    @pytest.mark.asyncio
    async def test_personalize_template(self, service, clean_database, sample_template_data):
        """Test personalizing a template"""
        template = await service.create_template(sample_template_data)

        personalization_data = PersonalizationData(
            name="John Doe",
            university="Stanford University",
            program="PhD Computer Science",
            research_interests=["machine learning", "computer vision"],
            custom_variables={
                "research_area": "machine learning",
                "num_publications": "5",
                "institution": "MIT",
                "project": "neural networks",
                "advisor": "Dr. Smith"
            }
        )

        request = PersonalizeTemplateRequest(
            template_id=template.id,
            personalization_data=personalization_data
        )

        result = await service.personalize_template(request)

        assert result is not None
        assert result.template_id == template.id
        assert "machine learning" in result.personalized_content
        assert "Stanford University" in result.personalized_content
        assert "{{" not in result.personalized_content  # All variables replaced
        assert result.word_count > 0
        assert len(result.suggestions) > 0

    @pytest.mark.asyncio
    async def test_personalize_increments_usage(self, service, clean_database, sample_template_data):
        """Test that personalization increments usage count"""
        template = await service.create_template(sample_template_data)
        initial_usage = template.usage_count

        personalization_data = PersonalizationData(
            name="John Doe",
            university="Stanford",
            program="PhD CS",
            custom_variables={
                "research_area": "AI",
                "num_publications": "3",
                "institution": "MIT",
                "project": "ML",
                "advisor": "Dr. X"
            }
        )

        request = PersonalizeTemplateRequest(
            template_id=template.id,
            personalization_data=personalization_data
        )

        await service.personalize_template(request)

        # Check usage count increased
        updated = await service.get_template(template.id)
        assert updated.usage_count == initial_usage + 1

    @pytest.mark.asyncio
    async def test_get_recommendations(self, service, clean_database, sample_template_data):
        """Test getting template recommendations"""
        await service.create_template(sample_template_data)

        profile = PersonalizationData(
            name="Jane Doe",
            university="MIT",
            program="PhD CS",
            research_interests=["machine learning", "deep learning"]
        )

        request = TemplateRecommendationRequest(
            user_profile=profile,
            degree=DegreeLevel.PHD,
            field=FieldCategory.COMPUTER_SCIENCE,
            purpose=SOPPurpose.RESEARCH_FOCUSED
        )

        results = await service.get_recommendations(request)

        assert results is not None
        assert results.total >= 1
        assert len(results.recommendations) >= 1
        assert all(r.relevance_score >= 0 and r.relevance_score <= 1 for r in results.recommendations)
        assert all(len(r.match_reasons) > 0 for r in results.recommendations)

    @pytest.mark.asyncio
    async def test_update_template(self, service, clean_database, sample_template_data):
        """Test updating a template"""
        template = await service.create_template(sample_template_data)

        update_request = UpdateTemplateRequest(
            title="Updated Title",
            description="Updated Description",
            success_rate=0.95,
            tags=["Updated", "Tags"]
        )

        updated = await service.update_template(template.id, update_request)

        assert updated.title == "Updated Title"
        assert updated.description == "Updated Description"
        assert updated.success_rate == 0.95
        assert "Updated" in updated.tags

    @pytest.mark.asyncio
    async def test_update_nonexistent_template(self, service, clean_database):
        """Test updating non-existent template"""
        update_request = UpdateTemplateRequest(title="Test")

        with pytest.raises(ValueError):
            await service.update_template("nonexistent", update_request)

    @pytest.mark.asyncio
    async def test_delete_template(self, service, clean_database, sample_template_data):
        """Test deleting a template"""
        template = await service.create_template(sample_template_data)

        result = await service.delete_template(template.id)
        assert result is True

        # Verify deletion
        retrieved = await service.get_template(template.id)
        assert retrieved is None

    @pytest.mark.asyncio
    async def test_delete_nonexistent_template(self, service, clean_database):
        """Test deleting non-existent template"""
        result = await service.delete_template("nonexistent")
        assert result is False

    @pytest.mark.asyncio
    async def test_get_template_statistics(self, service, clean_database, sample_template_data):
        """Test getting template statistics"""
        template = await service.create_template(sample_template_data)

        stats = await service.get_template_statistics(template.id)

        assert stats is not None
        assert stats.template_id == template.id
        assert stats.title == template.title
        assert stats.usage_count == template.usage_count

    @pytest.mark.asyncio
    async def test_get_bulk_statistics(self, service, clean_database, sample_template_data):
        """Test getting bulk statistics"""
        # Create multiple templates
        await service.create_template(sample_template_data)

        sample_template_data.title = "Another Template"
        sample_template_data.category.degree = DegreeLevel.MASTERS
        await service.create_template(sample_template_data)

        stats = await service.get_bulk_statistics()

        assert stats is not None
        assert stats.total_templates == 2
        assert stats.total_usage == 0
        assert len(stats.templates_by_degree) >= 1
        assert len(stats.templates_by_field) >= 1

    @pytest.mark.asyncio
    async def test_mix_sections(self, service, clean_database, sample_template_data):
        """Test mixing sections from different templates"""
        template1 = await service.create_template(sample_template_data)

        # Create second template
        sample_template_data.title = "Second Template"
        template2 = await service.create_template(sample_template_data)

        personalization_data = PersonalizationData(
            name="John Doe",
            university="Stanford",
            program="PhD CS",
            custom_variables={
                "research_area": "AI",
                "num_publications": "3",
                "institution": "MIT",
                "project": "ML",
                "advisor": "Dr. X"
            }
        )

        request = SectionMixRequest(
            section_selections={
                SectionType.INTRODUCTION: template1.id,
                SectionType.RESEARCH_EXPERIENCE: template2.id
            },
            personalization_data=personalization_data,
            transitions=False  # Disable AI transitions for testing
        )

        result = await service.mix_sections(request)

        assert result is not None
        assert result.word_count > 0
        assert len(result.sections) == 2
        assert SectionType.INTRODUCTION.value in result.source_templates
        assert SectionType.RESEARCH_EXPERIENCE.value in result.source_templates

    @pytest.mark.asyncio
    async def test_build_variable_mapping(self, service, sample_template_data):
        """Test building variable mapping"""
        template = SOPTemplate(
            id="test",
            title="Test",
            description="Test",
            category=sample_template_data.category,
            word_count_min=500,
            word_count_max=700,
            word_count_target=600,
            structure=[],
            content=SOPTemplateContent(
                template_id="test",
                raw_content="",
                sections={},
                variables=[]
            ),
            tone=[ToneIndicator.FORMAL],
            target_audience="Test",
            tags=[]
        )

        data = PersonalizationData(
            name="John Doe",
            university="Stanford",
            program="PhD CS",
            department="Computer Science",
            faculty_names=["Dr. Smith", "Dr. Jones"],
            research_interests=["ML", "AI"],
            background_summary="Strong background",
            career_goals="Research career",
            custom_variables={"custom": "value"}
        )

        mapping = service._build_variable_mapping(template, data)

        assert "{{name}}" in mapping
        assert mapping["{{name}}"] == "John Doe"
        assert "{{university}}" in mapping
        assert mapping["{{university}}"] == "Stanford"
        assert "{{faculty}}" in mapping
        assert "Dr. Smith" in mapping["{{faculty}}"]
        assert "{{custom}}" in mapping
        assert mapping["{{custom}}"] == "value"

    @pytest.mark.asyncio
    async def test_calculate_relevance_score(self, service, sample_template_data):
        """Test relevance score calculation"""
        template = SOPTemplate(
            id="test",
            title="Test",
            description="Test",
            category=sample_template_data.category,
            word_count_min=500,
            word_count_max=700,
            word_count_target=600,
            structure=[],
            content=SOPTemplateContent(
                template_id="test",
                raw_content="",
                sections={},
                variables=[]
            ),
            tone=[ToneIndicator.FORMAL],
            target_audience="Test",
            tags=[],
            field_specific_terminology=["machine learning", "neural networks"],
            success_rate=0.85,
            usage_count=150
        )

        profile = PersonalizationData(
            name="Test",
            university="Test",
            program="Test",
            research_interests=["machine learning", "computer vision"]
        )

        score, reasons = service._calculate_relevance_score(template, profile, None)

        assert score >= 0 and score <= 1
        assert len(reasons) > 0

    def test_get_tone_guidelines(self, service):
        """Test getting tone guidelines"""
        guidelines = service._get_tone_guidelines(ToneIndicator.FORMAL)
        assert "formal" in guidelines.lower()

        guidelines = service._get_tone_guidelines(ToneIndicator.CONFIDENT)
        assert "confident" in guidelines.lower() or "action" in guidelines.lower()

    def test_generate_template_id(self, service):
        """Test template ID generation"""
        category = TemplateCategory(
            degree=DegreeLevel.PHD,
            field=FieldCategory.COMPUTER_SCIENCE,
            purpose=SOPPurpose.RESEARCH_FOCUSED
        )

        template_id = service._generate_template_id(category)

        assert "phd" in template_id
        assert "computer" in template_id or "cs" in template_id or "science" in template_id
        assert "research" in template_id


class TestTemplateEdgeCases:
    """Test edge cases and error handling"""

    @pytest.mark.asyncio
    async def test_personalize_without_required_variables(self, service, clean_database, sample_template_data):
        """Test personalization with missing required variables"""
        template = await service.create_template(sample_template_data)

        personalization_data = PersonalizationData(
            name="John Doe",
            university="Stanford",
            program="PhD CS"
            # Missing custom variables
        )

        request = PersonalizeTemplateRequest(
            template_id=template.id,
            personalization_data=personalization_data
        )

        result = await service.personalize_template(request)

        # Should still work but have unreplaced variables
        assert result is not None
        # Some variables may remain unreplaced
        assert result.word_count > 0

    @pytest.mark.asyncio
    async def test_search_with_no_results(self, service, clean_database):
        """Test search that returns no results"""
        request = TemplateSearchRequest(
            filters=TemplateSearchFilters(
                degree=DegreeLevel.PHD,
                field=FieldCategory.PHYSICS
            ),
            limit=10,
            offset=0
        )

        results = await service.search_templates(request)

        assert results.total == 0
        assert len(results.templates) == 0

    @pytest.mark.asyncio
    async def test_pagination(self, service, clean_database, sample_template_data):
        """Test pagination of template list"""
        # Create 5 templates
        for i in range(5):
            sample_template_data.title = f"Template {i}"
            await service.create_template(sample_template_data)

        # Get first page
        page1 = await service.list_templates(skip=0, limit=2)
        assert len(page1) == 2

        # Get second page
        page2 = await service.list_templates(skip=2, limit=2)
        assert len(page2) == 2

        # Ensure different templates
        assert page1[0].id != page2[0].id


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

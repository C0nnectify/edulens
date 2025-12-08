"""
Tests for GradCafe collection system
"""

import pytest
from datetime import datetime
from app.models.gradcafe_collection import (
    CollectionJobCreate,
    CollectionPriority,
    CollectionStatus,
    DataPoint,
    DataPointProfile,
    ScrapingStrategy,
)
from app.services.gradcafe_collection_service import gradcafe_collection_service


class TestGradCafeCollectionService:
    """Test GradCafe collection service"""

    @pytest.mark.asyncio
    async def test_create_collection_job(self):
        """Test creating a collection job"""
        job_request = CollectionJobCreate(
            programs=["Computer Science"],
            universities=["MIT"],
            years=["2024"],
            limit_per_program=10,
            strategy=ScrapingStrategy.RECENT_DECISIONS,
        )

        job = await gradcafe_collection_service.create_collection_job(job_request)

        assert job.job_id is not None
        assert job.status == CollectionStatus.PENDING
        assert job.target.programs == ["Computer Science"]
        assert job.target.universities == ["MIT"]

    @pytest.mark.asyncio
    async def test_get_collection_job(self):
        """Test retrieving a collection job"""
        # Create a job first
        job_request = CollectionJobCreate(
            programs=["Data Science"],
            limit_per_program=10,
        )

        created_job = await gradcafe_collection_service.create_collection_job(job_request)

        # Retrieve the job
        retrieved_job = await gradcafe_collection_service.get_collection_job(
            created_job.job_id
        )

        assert retrieved_job is not None
        assert retrieved_job.job_id == created_job.job_id

    def test_calculate_completeness_score(self):
        """Test completeness score calculation"""
        # High completeness data point
        profile = DataPointProfile(
            gpa=3.8,
            gpa_scale=4.0,
            gre_verbal=165,
            gre_quant=170,
            gre_aw=5.0,
            toefl=110,
            research_pubs=2,
            is_international=True,
            undergrad_institution="MIT",
        )

        data_point = DataPoint(
            data_point_id="test_123",
            university="Stanford",
            program="Computer Science",
            decision="Accepted",
            season="Fall 2024",
            decision_date="2024-03-15",
            profile=profile,
            hash="test_hash",
        )

        score = gradcafe_collection_service.calculate_completeness_score(data_point)

        assert score > 0.8  # High completeness

        # Low completeness data point
        minimal_profile = DataPointProfile()
        minimal_data_point = DataPoint(
            data_point_id="test_456",
            university="Harvard",
            program="MBA",
            decision="Rejected",
            profile=minimal_profile,
            hash="test_hash_2",
        )

        minimal_score = gradcafe_collection_service.calculate_completeness_score(
            minimal_data_point
        )

        assert minimal_score < 0.5  # Low completeness

    def test_validate_data_point(self):
        """Test data point validation"""
        # Valid data point
        valid_profile = DataPointProfile(
            gpa=3.7,
            gpa_scale=4.0,
            gre_verbal=160,
            gre_quant=165,
            gre_aw=4.5,
            toefl=105,
        )

        valid_data_point = DataPoint(
            data_point_id="test_valid",
            university="Berkeley",
            program="Computer Science",
            decision="Accepted",
            profile=valid_profile,
            hash="valid_hash",
        )

        quality_check = gradcafe_collection_service.validate_data_point(valid_data_point)

        assert quality_check.is_valid is True
        assert len(quality_check.issues) == 0

        # Invalid data point (bad GRE scores)
        invalid_profile = DataPointProfile(
            gpa=3.5,
            gre_verbal=180,  # Invalid (max 170)
            gre_quant=50,  # Invalid (min 130)
        )

        invalid_data_point = DataPoint(
            data_point_id="test_invalid",
            university="CMU",
            program="AI",
            decision="Rejected",
            profile=invalid_profile,
            hash="invalid_hash",
        )

        invalid_check = gradcafe_collection_service.validate_data_point(
            invalid_data_point
        )

        assert invalid_check.is_valid is False
        assert len(invalid_check.issues) > 0
        assert "invalid_gre_verbal" in invalid_check.quality_flags
        assert "invalid_gre_quant" in invalid_check.quality_flags

    @pytest.mark.asyncio
    async def test_update_job_status(self):
        """Test updating job status"""
        # Create a job
        job_request = CollectionJobCreate(
            programs=["Engineering"], limit_per_program=10
        )

        job = await gradcafe_collection_service.create_collection_job(job_request)

        # Update to running
        success = await gradcafe_collection_service.update_job_status(
            job.job_id, CollectionStatus.RUNNING
        )

        assert success is True

        # Verify update
        updated_job = await gradcafe_collection_service.get_collection_job(job.job_id)
        assert updated_job.status == CollectionStatus.RUNNING
        assert updated_job.started_at is not None

    @pytest.mark.asyncio
    async def test_get_collection_statistics(self):
        """Test getting collection statistics"""
        statistics = await gradcafe_collection_service.get_collection_statistics()

        assert "total_records" in statistics
        assert "records_by_decision" in statistics
        assert "records_by_university" in statistics
        assert "collection_rate" in statistics

    def test_data_point_quality_flags(self):
        """Test quality flag assignment"""
        # Test suspicious zeros
        zero_profile = DataPointProfile(gpa=0, gre_verbal=0, gre_quant=0)

        zero_data_point = DataPoint(
            data_point_id="test_zeros",
            university="Test U",
            program="Test Program",
            decision="Accepted",
            profile=zero_profile,
            hash="zero_hash",
        )

        zero_check = gradcafe_collection_service.validate_data_point(zero_data_point)

        assert "suspicious_zeros" in zero_check.quality_flags

        # Test high completeness flag
        complete_profile = DataPointProfile(
            gpa=3.9,
            gpa_scale=4.0,
            gre_verbal=168,
            gre_quant=170,
            gre_aw=5.5,
            toefl=115,
            research_pubs=5,
            research_years=3,
            is_international=True,
            undergrad_institution="IIT Bombay",
        )

        complete_data_point = DataPoint(
            data_point_id="test_complete",
            university="MIT",
            program="Computer Science PhD",
            decision="Accepted",
            season="Fall 2024",
            decision_date="2024-03-20",
            profile=complete_profile,
            funding="Full funding",
            hash="complete_hash",
        )

        complete_check = gradcafe_collection_service.validate_data_point(
            complete_data_point
        )

        assert "high_completeness" in complete_check.quality_flags
        assert complete_check.completeness_score > 0.6


class TestGradCafeModels:
    """Test GradCafe collection models"""

    def test_collection_job_create_validation(self):
        """Test CollectionJobCreate validation"""
        # Valid request
        valid_request = CollectionJobCreate(
            programs=["Computer Science", "Data Science"],
            limit_per_program=50,
        )

        assert len(valid_request.programs) == 2
        assert valid_request.limit_per_program == 50

        # Test limit validation (should fail with invalid limit)
        with pytest.raises(Exception):
            CollectionJobCreate(programs=["CS"], limit_per_program=1000)  # Too high

    def test_data_point_profile_model(self):
        """Test DataPointProfile model"""
        profile = DataPointProfile(
            gpa=3.8,
            gpa_scale=4.0,
            gre_verbal=165,
            gre_quant=168,
            gre_aw=4.5,
            toefl=108,
            research_pubs=3,
            is_international=True,
        )

        assert profile.gpa == 3.8
        assert profile.gre_verbal == 165
        assert profile.is_international is True

    def test_collection_statistics_model(self):
        """Test CollectionStatistics model"""
        from app.models.gradcafe_collection import CollectionStatistics

        stats = CollectionStatistics(
            total_records=100,
            new_records=80,
            duplicate_records=20,
            average_completeness=0.75,
        )

        assert stats.total_records == 100
        assert stats.new_records == 80
        assert stats.average_completeness == 0.75


# Run tests with: pytest tests/test_gradcafe_collection.py -v

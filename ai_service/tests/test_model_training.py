"""
Tests for ML Model Training Service

Run with: pytest tests/test_model_training.py -v
"""

import pytest
from datetime import datetime
from typing import List
import numpy as np

from app.services.model_training_service import model_training_service
from app.models.model_training import (
    TrainingConfig,
    TrainingJob,
    TrainingStatus,
    AlgorithmType,
    DataSource,
    HyperparameterTuningMethod,
    FeatureSelectionMethod,
    ModelActivationRequest
)
from app.models.admission import (
    StudentProfile,
    ProgramInfo,
    AdmissionDataPoint,
    AdmissionDecision,
    TestScore,
    TestType
)


class TestTrainingConfig:
    """Test training configuration"""

    def test_default_config(self):
        """Test default configuration values"""
        config = TrainingConfig()

        assert config.data_source == DataSource.MONGODB
        assert config.min_samples == 1000
        assert config.test_size == 0.15
        assert config.validation_size == 0.15
        assert config.random_state == 42
        assert config.scale_features is True
        assert config.cross_validation_folds == 5

    def test_custom_config(self):
        """Test custom configuration"""
        config = TrainingConfig(
            algorithms=[AlgorithmType.RANDOM_FOREST, AlgorithmType.XGBOOST],
            min_samples=500,
            hyperparameter_tuning=HyperparameterTuningMethod.GRID_SEARCH,
            tuning_iterations=100,
            target_metric="auc_roc",
            version_tag="test_v1.0"
        )

        assert len(config.algorithms) == 2
        assert config.min_samples == 500
        assert config.hyperparameter_tuning == HyperparameterTuningMethod.GRID_SEARCH
        assert config.target_metric == "auc_roc"
        assert config.version_tag == "test_v1.0"

    def test_config_validation(self):
        """Test configuration validation"""
        # Test invalid test size
        with pytest.raises(Exception):
            TrainingConfig(test_size=0.5)  # Should fail as > 0.3

        # Test invalid min_samples
        with pytest.raises(Exception):
            TrainingConfig(min_samples=50)  # Should fail as < 100


class TestDataQuality:
    """Test data quality validation"""

    @pytest.mark.asyncio
    async def test_validate_data_quality(self):
        """Test data quality validation"""
        config = TrainingConfig(min_samples=100)  # Lower threshold for testing

        report = await model_training_service.validate_data_quality(config)

        assert report is not None
        assert isinstance(report.total_samples, int)
        assert isinstance(report.passes_quality_check, bool)
        assert isinstance(report.quality_issues, list)
        assert isinstance(report.recommendations, list)

    @pytest.mark.asyncio
    async def test_insufficient_data(self):
        """Test handling of insufficient data"""
        config = TrainingConfig(min_samples=1000000)  # Unrealistic threshold

        report = await model_training_service.validate_data_quality(config)

        assert report.passes_quality_check is False
        assert any("Insufficient data" in issue for issue in report.quality_issues)


class TestFeatureExtraction:
    """Test feature extraction and engineering"""

    def test_feature_names(self):
        """Test feature names are correct"""
        expected_features = [
            "gpa_normalized",
            "gre_verbal_percentile",
            "gre_quant_percentile",
            "gmat_percentile",
            "english_proficiency",
            "research_score",
            "professional_score",
            "extracurricular_score",
            "undergrad_prestige",
            "program_competitiveness",
            "gpa_vs_avg",
            "test_score_vs_avg"
        ]

        assert model_training_service.feature_names == expected_features

    def test_hyperparameter_grids(self):
        """Test hyperparameter grids are defined"""
        for algorithm in [
            AlgorithmType.RANDOM_FOREST,
            AlgorithmType.GRADIENT_BOOSTING,
            AlgorithmType.LOGISTIC_REGRESSION
        ]:
            grid = model_training_service._get_hyperparameter_grid(algorithm)
            assert isinstance(grid, dict)
            assert len(grid) > 0


class TestModelCreation:
    """Test model creation and initialization"""

    def test_create_random_forest(self):
        """Test Random Forest model creation"""
        model = model_training_service._create_model(
            AlgorithmType.RANDOM_FOREST,
            n_estimators=100
        )

        assert model is not None
        assert hasattr(model, 'fit')
        assert hasattr(model, 'predict')

    def test_create_gradient_boosting(self):
        """Test Gradient Boosting model creation"""
        model = model_training_service._create_model(
            AlgorithmType.GRADIENT_BOOSTING,
            n_estimators=50
        )

        assert model is not None
        assert hasattr(model, 'fit')
        assert hasattr(model, 'predict')

    def test_create_logistic_regression(self):
        """Test Logistic Regression model creation"""
        model = model_training_service._create_model(
            AlgorithmType.LOGISTIC_REGRESSION,
            C=1.0
        )

        assert model is not None
        assert hasattr(model, 'fit')
        assert hasattr(model, 'predict')


class TestTrainingJob:
    """Test training job management"""

    def test_training_job_creation(self):
        """Test training job creation"""
        config = TrainingConfig()
        job = TrainingJob(
            job_id="test_job_001",
            config=config,
            status=TrainingStatus.PENDING
        )

        assert job.job_id == "test_job_001"
        assert job.status == TrainingStatus.PENDING
        assert job.progress_percentage == 0.0
        assert isinstance(job.created_at, datetime)

    def test_training_job_progress(self):
        """Test training job progress tracking"""
        config = TrainingConfig()
        job = TrainingJob(
            job_id="test_job_002",
            config=config
        )

        # Update progress
        job.status = TrainingStatus.RUNNING
        job.progress_percentage = 50.0
        job.current_step = "Training Random Forest"

        assert job.status == TrainingStatus.RUNNING
        assert job.progress_percentage == 50.0
        assert job.current_step == "Training Random Forest"


class TestModelVersioning:
    """Test model versioning and management"""

    @pytest.mark.asyncio
    async def test_list_models(self):
        """Test listing model versions"""
        models = await model_training_service.list_model_versions(limit=10)

        assert isinstance(models, list)
        # Note: May be empty if no models trained yet

    @pytest.mark.asyncio
    async def test_list_active_models(self):
        """Test listing active models only"""
        models = await model_training_service.list_model_versions(
            limit=10,
            active_only=True
        )

        assert isinstance(models, list)
        # All returned models should be active
        for model in models:
            assert model.is_active is True


class TestModelComparison:
    """Test model comparison functionality"""

    @pytest.mark.asyncio
    async def test_compare_models_insufficient(self):
        """Test comparison with insufficient models"""
        with pytest.raises(ValueError):
            await model_training_service.compare_models(
                model_ids=["model1"],  # Only one model
                metrics=["accuracy", "f1_score"]
            )


class TestIntegration:
    """Integration tests for complete training pipeline"""

    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_full_training_pipeline(self):
        """Test complete training pipeline (slow test)"""
        # This test requires actual data in MongoDB
        # Skip if insufficient data

        config = TrainingConfig(
            algorithms=[AlgorithmType.RANDOM_FOREST],  # Just one for speed
            min_samples=100,  # Lower threshold
            hyperparameter_tuning=HyperparameterTuningMethod.NONE,  # Skip tuning for speed
            cross_validation_folds=3,  # Fewer folds
            version_tag="test_run"
        )

        try:
            # Validate data
            report = await model_training_service.validate_data_quality(config)

            if not report.passes_quality_check:
                pytest.skip("Insufficient data for training test")

            # Train models
            models = await model_training_service.train_models(config)

            assert len(models) > 0
            assert all(m.model_id for m in models)
            assert all(m.metrics for m in models)

            # Verify model was saved
            model_id = models[0].model_id
            retrieved_models = await model_training_service.list_model_versions(limit=1000)
            assert any(m.model_id == model_id for m in retrieved_models)

        except ValueError as e:
            if "Insufficient data" in str(e):
                pytest.skip("Insufficient data for training test")
            raise


class TestErrorHandling:
    """Test error handling and edge cases"""

    @pytest.mark.asyncio
    async def test_activate_nonexistent_model(self):
        """Test activating non-existent model"""
        with pytest.raises(Exception):
            await model_training_service.activate_model(
                "nonexistent_model_id",
                "test activation"
            )

    @pytest.mark.asyncio
    async def test_get_nonexistent_job(self):
        """Test getting non-existent job"""
        job = await model_training_service.get_training_job("nonexistent_job")
        assert job is None


@pytest.fixture
def sample_student_profile():
    """Fixture for sample student profile"""
    return StudentProfile(
        gpa=3.8,
        gpa_scale=4.0,
        undergraduate_major="Computer Science",
        undergraduate_university="MIT",
        undergraduate_university_ranking=1,
        test_scores=[
            TestScore(
                test_type=TestType.GRE,
                verbal_score=165,
                quantitative_score=170,
                analytical_score=5.0
            ),
            TestScore(
                test_type=TestType.TOEFL,
                total_score=110
            )
        ],
        research_publications=3,
        work_experience_months=24,
        relevant_work_experience_months=24,
        leadership_positions=2
    )


@pytest.fixture
def sample_program_info():
    """Fixture for sample program info"""
    return ProgramInfo(
        university_name="Stanford University",
        program_name="MS Computer Science",
        university_ranking=3,
        acceptance_rate=0.05,
        average_gpa=3.9,
        gre_quant_avg=168
    )


@pytest.fixture
def sample_admission_data(sample_student_profile, sample_program_info):
    """Fixture for sample admission data point"""
    return AdmissionDataPoint(
        data_point_id="test_dp_001",
        profile=sample_student_profile,
        program=sample_program_info,
        decision=AdmissionDecision.ACCEPTED,
        application_year=2024,
        verified=True
    )


# Pytest configuration
def pytest_configure(config):
    """Configure pytest with custom markers"""
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

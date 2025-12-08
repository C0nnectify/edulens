"""
Admission prediction API endpoints
"""

from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from typing import List, Optional
import uuid
from datetime import datetime

from app.models.admission import (
    PredictionRequest,
    BatchPredictionRequest,
    BatchPredictionResponse,
    ProfileEvaluation,
    AdmissionDataContribution,
    AdmissionDataPoint,
    MLModelMetadata,
)
from app.services.admission_prediction_service import admission_service
from app.utils.logger import logger

router = APIRouter(prefix="/admission", tags=["Admission Prediction"])


@router.post("/predict", response_model=ProfileEvaluation, status_code=status.HTTP_200_OK)
async def predict_admission(
    request: PredictionRequest,
    user_id: str = "demo_user",  # TODO: Extract from JWT token
) -> ProfileEvaluation:
    """
    Predict admission probability for a student profile and target program

    Args:
        request: Prediction request with student profile and target program
        user_id: User identifier (from JWT)

    Returns:
        ProfileEvaluation: Complete evaluation with prediction and gap analysis
    """
    try:
        logger.info(f"Admission prediction request for user {user_id}")

        # Perform evaluation
        evaluation = await admission_service.evaluate_profile(
            user_id=user_id,
            profile=request.student_profile,
            program=request.target_program,
            include_gap_analysis=request.include_gap_analysis,
            include_similar_profiles=request.include_similar_profiles,
        )

        logger.info(
            f"Prediction completed: {evaluation.prediction.probability_percentage:.1f}% "
            f"({evaluation.prediction.category.value})"
        )

        return evaluation

    except Exception as e:
        logger.error(f"Error in admission prediction: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate admission prediction: {str(e)}"
        )


@router.post("/predict/batch", response_model=BatchPredictionResponse, status_code=status.HTTP_200_OK)
async def predict_batch(
    request: BatchPredictionRequest,
    user_id: str = "demo_user",  # TODO: Extract from JWT token
) -> BatchPredictionResponse:
    """
    Predict admission probabilities for multiple programs

    Args:
        request: Batch prediction request with student profile and multiple programs
        user_id: User identifier (from JWT)

    Returns:
        BatchPredictionResponse: Evaluations for all programs with categorization
    """
    try:
        logger.info(
            f"Batch admission prediction for user {user_id} - "
            f"{len(request.target_programs)} programs"
        )

        # Validate number of programs
        if len(request.target_programs) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one target program is required"
            )

        if len(request.target_programs) > 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 50 programs allowed per batch request"
            )

        # Perform batch evaluation
        response = await admission_service.evaluate_multiple_programs(
            user_id=user_id,
            profile=request.student_profile,
            programs=request.target_programs,
        )

        logger.info(
            f"Batch prediction completed: {len(response.reach_schools)} reach, "
            f"{len(response.target_schools)} target, {len(response.safety_schools)} safety"
        )

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in batch admission prediction: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate batch predictions: {str(e)}"
        )


@router.post("/data/contribute", status_code=status.HTTP_201_CREATED)
async def contribute_admission_data(
    contribution: AdmissionDataContribution,
    user_id: str = "demo_user",  # TODO: Extract from JWT token
) -> dict:
    """
    Contribute historical admission data to improve predictions

    Args:
        contribution: Admission data contribution
        user_id: User identifier (from JWT)

    Returns:
        dict: Contribution confirmation with data point ID
    """
    try:
        logger.info(f"Admission data contribution from user {user_id}")

        # Create data point
        data_point_id = f"dp_{uuid.uuid4().hex[:12]}"
        data_point = AdmissionDataPoint(
            data_point_id=data_point_id,
            user_id=user_id if contribution.allow_anonymous_use else None,
            profile=contribution.profile,
            program=contribution.program,
            decision=contribution.decision,
            decision_date=None,
            application_year=contribution.application_year,
            application_cycle=contribution.application_cycle,
            scholarship_amount=contribution.scholarship_amount,
            assistantship_offered=contribution.assistantship_offered,
            verified=False,  # Requires manual verification
            source="user_submitted",
        )

        # Store data point
        await admission_service.add_admission_data(user_id, data_point)

        logger.info(f"Admission data point created: {data_point_id}")

        return {
            "status": "success",
            "message": "Thank you for contributing to our admission data",
            "data_point_id": data_point_id,
            "verification_required": True,
        }

    except Exception as e:
        logger.error(f"Error saving admission data contribution: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save admission data: {str(e)}"
        )


@router.get("/evaluations/{evaluation_id}", response_model=ProfileEvaluation)
async def get_evaluation(
    evaluation_id: str,
    user_id: str = "demo_user",  # TODO: Extract from JWT token
) -> ProfileEvaluation:
    """
    Retrieve a previous evaluation by ID

    Args:
        evaluation_id: Evaluation identifier
        user_id: User identifier (from JWT)

    Returns:
        ProfileEvaluation: The requested evaluation
    """
    try:
        from app.database import get_profile_evaluations_collection

        collection = get_profile_evaluations_collection()

        # Query evaluation
        doc = await collection.find_one({
            "_id": evaluation_id,
            "user_id": user_id,  # Ensure user can only access their own evaluations
        })

        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Evaluation {evaluation_id} not found"
            )

        # Convert to model
        evaluation = ProfileEvaluation(**doc)

        return evaluation

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving evaluation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve evaluation: {str(e)}"
        )


@router.get("/evaluations", response_model=List[ProfileEvaluation])
async def list_evaluations(
    user_id: str = "demo_user",  # TODO: Extract from JWT token
    limit: int = 10,
    skip: int = 0,
) -> List[ProfileEvaluation]:
    """
    List user's previous evaluations

    Args:
        user_id: User identifier (from JWT)
        limit: Maximum number of evaluations to return
        skip: Number of evaluations to skip

    Returns:
        List[ProfileEvaluation]: List of evaluations
    """
    try:
        from app.database import get_profile_evaluations_collection

        collection = get_profile_evaluations_collection()

        # Query evaluations
        cursor = collection.find(
            {"user_id": user_id}
        ).sort("evaluation_date", -1).skip(skip).limit(limit)

        evaluations = []
        async for doc in cursor:
            evaluations.append(ProfileEvaluation(**doc))

        logger.info(f"Retrieved {len(evaluations)} evaluations for user {user_id}")

        return evaluations

    except Exception as e:
        logger.error(f"Error listing evaluations: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list evaluations: {str(e)}"
        )


@router.post("/model/train", response_model=MLModelMetadata, status_code=status.HTTP_201_CREATED)
async def train_model(
    background_tasks: BackgroundTasks,
    model_type: str = "random_forest",
    min_samples: int = 100,
    admin_key: Optional[str] = None,  # TODO: Add proper admin authentication
) -> MLModelMetadata:
    """
    Train a new ML model on historical admission data (Admin only)

    Args:
        background_tasks: FastAPI background tasks
        model_type: Type of model to train (random_forest, gradient_boosting, logistic_regression)
        min_samples: Minimum samples required for training
        admin_key: Admin authentication key

    Returns:
        MLModelMetadata: Metadata for the trained model
    """
    try:
        # TODO: Add proper admin authentication
        # if admin_key != settings.admin_api_key:
        #     raise HTTPException(
        #         status_code=status.HTTP_403_FORBIDDEN,
        #         detail="Admin access required"
        #     )

        logger.info(f"Starting model training - type: {model_type}")

        # Train model (this can take time, but we'll do it synchronously for simplicity)
        # In production, use background task or Celery
        metadata = await admission_service.train_model(
            model_type=model_type,
            min_samples=min_samples
        )

        logger.info(
            f"Model training completed - ID: {metadata.model_id}, "
            f"Accuracy: {metadata.accuracy:.3f}, AUC-ROC: {metadata.auc_roc:.3f}"
        )

        return metadata

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error training model: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to train model: {str(e)}"
        )


@router.get("/model/current", response_model=Optional[MLModelMetadata])
async def get_current_model() -> Optional[MLModelMetadata]:
    """
    Get information about the currently active ML model

    Returns:
        Optional[MLModelMetadata]: Current model metadata or None if using heuristic
    """
    try:
        # Load latest model if not already loaded
        if admission_service.model_metadata is None:
            await admission_service.load_latest_model()

        return admission_service.model_metadata

    except Exception as e:
        logger.error(f"Error retrieving current model: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve model information: {str(e)}"
        )


@router.get("/models", response_model=List[MLModelMetadata])
async def list_models(
    limit: int = 10,
    skip: int = 0,
    include_deprecated: bool = False,
) -> List[MLModelMetadata]:
    """
    List all trained ML models

    Args:
        limit: Maximum number of models to return
        skip: Number of models to skip
        include_deprecated: Include deprecated models

    Returns:
        List[MLModelMetadata]: List of model metadata
    """
    try:
        from app.database import get_ml_models_collection

        collection = get_ml_models_collection()

        # Build query
        query = {}
        if not include_deprecated:
            query["is_deprecated"] = False

        # Query models
        cursor = collection.find(query).sort("training_date", -1).skip(skip).limit(limit)

        models = []
        async for doc in cursor:
            models.append(MLModelMetadata(**doc))

        logger.info(f"Retrieved {len(models)} models")

        return models

    except Exception as e:
        logger.error(f"Error listing models: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list models: {str(e)}"
        )


@router.get("/statistics")
async def get_statistics() -> dict:
    """
    Get admission prediction service statistics

    Returns:
        dict: Service statistics including data points, evaluations, and model info
    """
    try:
        from app.database import (
            get_admission_data_collection,
            get_profile_evaluations_collection,
            get_ml_models_collection,
        )

        # Count data points
        admission_collection = get_admission_data_collection()
        total_data_points = await admission_collection.count_documents({})
        verified_data_points = await admission_collection.count_documents({"verified": True})

        # Count evaluations
        evaluations_collection = get_profile_evaluations_collection()
        total_evaluations = await evaluations_collection.count_documents({})

        # Count models
        models_collection = get_ml_models_collection()
        total_models = await models_collection.count_documents({})
        active_models = await models_collection.count_documents({"is_active": True})

        # Get current model info
        current_model = admission_service.model_metadata

        return {
            "data_points": {
                "total": total_data_points,
                "verified": verified_data_points,
            },
            "evaluations": {
                "total": total_evaluations,
            },
            "models": {
                "total": total_models,
                "active": active_models,
                "current_version": current_model.version if current_model else "heuristic_v1.0",
                "current_type": current_model.model_type if current_model else "heuristic",
            },
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"Error retrieving statistics: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve statistics: {str(e)}"
        )

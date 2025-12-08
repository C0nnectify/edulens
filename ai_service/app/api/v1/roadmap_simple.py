from fastapi import APIRouter

router = APIRouter(tags=["Roadmap Simple"])

@router.get("/")
def root():
    return {"status": "simple roadmap active"}

@router.get("/stages")
def get_stages():
    return {"message": "Simple roadmap works", "stages": []}

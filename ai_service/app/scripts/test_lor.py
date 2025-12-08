import asyncio
from fastapi.testclient import TestClient

try:
    from app.main import app
except Exception:
    # Fallback: directly import the router for isolated test
    from app.api.v1.lor_upload import router as lor_router
    from fastapi import FastAPI
    app = FastAPI()
    app.include_router(lor_router, prefix="/api")

client = TestClient(app)


def run():
    payload = {
        "recommender_name": "Dr. Alice Smith",
        "recommender_title": "Professor of Computer Science",
        "recommender_relationship": "Course Instructor",
        "recommender_association_duration": "2 years",
        "student_name": "John Doe",
        "student_role": "Undergraduate Student",
        "student_under_duration": "2 semesters",
        "skills_observed": "Algorithms, problem-solving, teamwork",
        "achievements": "Top project in advanced algorithms",
        "character_traits": "Integrity, curiosity",
        "target_program": "MS in Computer Science",
        "target_university": "Stanford",
        "target_country": "USA",
        "tone": "professional",
        "recommendation_strength": "strong",
        "word_limit": 800,
        "subject": "Computer Science",
    }

    r = client.post("/api/lor/generate", json=payload)
    print("Status:", r.status_code)
    print(r.json())


if __name__ == "__main__":
    run()

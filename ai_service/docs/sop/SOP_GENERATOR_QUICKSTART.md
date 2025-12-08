# SOP Generator - Quick Start Guide

## Overview

The SOP Generator is an AI-powered interview system that helps students create personalized Statement of Purpose documents through a conversational question-and-answer process.

## Setup

### 1. Environment Configuration

Add to your `.env` file:

```bash
# Google Gemini API Key (required)
GOOGLE_API_KEY=your_gemini_api_key_here

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=edulens

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_ALGORITHM=HS256
```

### 2. Install Dependencies

The required dependencies are already included in `pyproject.toml`:

```bash
cd ai_service
uv sync
```

### 3. Start the Service

```bash
# Development mode
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or use the start script
./start.sh
```

## Quick Usage Example

### 1. Create a Session

```bash
curl -X POST "http://localhost:8000/api/v1/sop-generator/sessions" \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{
    "program_name": "Master of Science in Computer Science",
    "university_name": "Stanford University",
    "degree_level": "MS",
    "field_of_study": "Computer Science"
  }'
```

**Response:**
```json
{
  "session_id": "abc123",
  "status": "started",
  "progress_percentage": 0.0,
  "current_question": {
    "question_id": "bg_001",
    "category": "background",
    "question_text": "Tell me about yourself and your educational background.",
    "required": true,
    "min_length": 100,
    "guidance": "Share your educational journey, major achievements, and what makes you unique."
  },
  "total_questions": 27,
  "answered_questions": 0
}
```

### 2. Submit Answers

```bash
curl -X POST "http://localhost:8000/api/v1/sop-generator/sessions/abc123/answer" \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{
    "question_id": "bg_001",
    "answer_text": "I completed my Bachelor of Science in Computer Science from XYZ University with a GPA of 3.8. During my undergraduate studies, I focused on artificial intelligence and machine learning, completing projects in natural language processing and computer vision. I was awarded the Best Student Project Award for my capstone on neural network optimization."
  }'
```

### 3. Check Progress

```bash
curl -X GET "http://localhost:8000/api/v1/sop-generator/sessions/abc123/progress" \
  -H "x-user-id: user123"
```

### 4. Generate SOP

After answering at least 50% of questions:

```bash
curl -X POST "http://localhost:8000/api/v1/sop-generator/sessions/abc123/generate" \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{
    "tone": "balanced",
    "word_count_target": 800
  }'
```

### 5. Export to DOCX

```bash
curl -X GET "http://localhost:8000/api/v1/sop-generator/sessions/abc123/export/draft_xyz?format=docx&applicant_name=John%20Doe" \
  -H "x-user-id: user123" \
  --output statement_of_purpose.docx
```

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/sop-generator/sessions` | Create new session |
| GET | `/api/v1/sop-generator/sessions/{id}` | Get session state |
| GET | `/api/v1/sop-generator/sessions` | List all sessions |
| POST | `/api/v1/sop-generator/sessions/{id}/answer` | Submit answer |
| PUT | `/api/v1/sop-generator/sessions/{id}/answer/{qid}` | Edit answer |
| GET | `/api/v1/sop-generator/sessions/{id}/progress` | Get progress |
| GET | `/api/v1/sop-generator/sessions/{id}/questions` | Get all questions |
| POST | `/api/v1/sop-generator/sessions/{id}/generate` | Generate SOP |
| GET | `/api/v1/sop-generator/sessions/{id}/drafts` | Get all drafts |
| POST | `/api/v1/sop-generator/sessions/{id}/regenerate` | Regenerate with new tone |
| GET | `/api/v1/sop-generator/sessions/{id}/export/{did}` | Export draft |
| DELETE | `/api/v1/sop-generator/sessions/{id}` | Delete session |

## Interactive API Documentation

Visit `http://localhost:8000/docs` for the interactive Swagger UI where you can test all endpoints.

## Question Categories

The system asks 20-30 questions across 6 categories:

1. **Personal Background** (5-7 questions)
   - Educational background
   - Initial interest in field
   - Academic projects
   - Strengths and awards

2. **Academic Experience** (5-7 questions)
   - Favorite courses
   - Technical skills
   - Projects and competitions
   - Academic challenges

3. **Research Experience** (5-7 questions)
   - Research projects
   - Publications
   - Research interests
   - Skills to gain

4. **Career Goals** (4-5 questions)
   - Short-term goals
   - Long-term goals
   - Program fit
   - Desired impact

5. **Program Fit** (5-7 questions)
   - Why this program
   - Faculty interests
   - Courses and labs
   - Unique perspectives

6. **Personal Statement** (3-4 questions)
   - Personal qualities
   - Challenges overcome
   - Additional information

## SOP Tones

Choose from 4 different writing styles:

- **Confident**: Assertive, showcasing achievements
- **Humble**: Thoughtful, emphasizing learning
- **Enthusiastic**: Passionate and motivated
- **Balanced**: Professional combination (recommended)

## Export Formats

- **TXT**: Plain text
- **DOCX**: Microsoft Word with professional formatting
- **PDF**: Print-ready document

## Tips for Best Results

1. **Be Specific**: Provide concrete examples and details
2. **Be Honest**: Write in your authentic voice
3. **Research Faculty**: Mention specific professors and their work
4. **Show Fit**: Explain why you're a good match for the program
5. **Edit Answers**: Review and refine before generating
6. **Try Multiple Tones**: Compare different versions
7. **Personalize Output**: Always review and customize the final SOP

## Troubleshooting

**Problem**: "Insufficient answers" error
- **Solution**: Answer at least 50% of questions (13-15 minimum)

**Problem**: Answer validation fails
- **Solution**: Ensure answers meet minimum length (50-100 characters)

**Problem**: Generation takes long
- **Solution**: Normal processing time is 5-15 seconds

**Problem**: Missing GOOGLE_API_KEY error
- **Solution**: Add your Gemini API key to `.env` file

## Python Client Example

```python
import requests

BASE_URL = "http://localhost:8000/api/v1/sop-generator"
USER_ID = "user123"

# Create session
response = requests.post(
    f"{BASE_URL}/sessions",
    json={
        "program_name": "MS in Computer Science",
        "university_name": "Stanford University",
        "degree_level": "MS",
        "field_of_study": "Computer Science"
    },
    headers={"x-user-id": USER_ID}
)
session = response.json()
session_id = session["session_id"]

# Answer questions
while True:
    # Get current session state
    response = requests.get(
        f"{BASE_URL}/sessions/{session_id}",
        headers={"x-user-id": USER_ID}
    )
    session = response.json()

    # Check if there are more questions
    if not session["current_question"]:
        print("All questions answered!")
        break

    question = session["current_question"]
    print(f"\nQuestion: {question['question_text']}")
    print(f"Category: {question['category']}")
    print(f"Guidance: {question['guidance']}")

    # Get user input
    answer = input("\nYour answer: ")

    # Submit answer
    response = requests.post(
        f"{BASE_URL}/sessions/{session_id}/answer",
        json={
            "question_id": question["question_id"],
            "answer_text": answer
        },
        headers={"x-user-id": USER_ID}
    )

    # Check progress
    response = requests.get(
        f"{BASE_URL}/sessions/{session_id}/progress",
        headers={"x-user-id": USER_ID}
    )
    progress = response.json()
    print(f"\nProgress: {progress['progress_percentage']:.1f}%")

    if progress["can_generate"]:
        generate = input("\nDo you want to generate your SOP now? (y/n): ")
        if generate.lower() == 'y':
            break

# Generate SOP
print("\nGenerating your Statement of Purpose...")
response = requests.post(
    f"{BASE_URL}/sessions/{session_id}/generate",
    json={
        "tone": "balanced",
        "word_count_target": 800
    },
    headers={"x-user-id": USER_ID}
)
draft = response.json()

print(f"\nYour SOP (word count: {draft['word_count']}):\n")
print(draft['content'])

# Export to DOCX
draft_id = draft["draft_id"]
response = requests.get(
    f"{BASE_URL}/sessions/{session_id}/export/{draft_id}?format=docx",
    headers={"x-user-id": USER_ID}
)

with open("statement_of_purpose.docx", "wb") as f:
    f.write(response.content)

print("\nSOP exported to statement_of_purpose.docx")
```

## Next Steps

1. Test the API using the interactive docs at `/docs`
2. Integrate with your frontend application
3. Customize questions in `QuestionBank` class if needed
4. Add custom validation rules
5. Implement caching for better performance

## Support

For detailed documentation, see `SOP_GENERATOR_README.md`

For API reference, visit `http://localhost:8000/docs`

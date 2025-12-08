# SOP Generator Service Documentation

## Overview

The SOP (Statement of Purpose) Generator is an intelligent, interview-based document generation system that helps students create personalized and compelling statements of purpose for graduate program applications. The service uses a conversational approach with 20-30 targeted questions to collect comprehensive information, then leverages Google Gemini AI to generate professionally written SOPs.

## Features

### 1. Interview-Based Generation
- **Conversational Flow**: Natural question progression across 6 categories
- **Smart Question Logic**: Dynamic follow-up questions based on previous answers
- **Skip Logic**: Automatically skips irrelevant questions (e.g., research details if no experience)
- **Progress Tracking**: Real-time progress indicators and completion percentage
- **Resume Capability**: Save and resume interview sessions

### 2. Question Categories

The system covers 6 comprehensive categories with 20-30 questions total:

1. **Personal Background (5-7 questions)**
   - Educational background and achievements
   - Initial interest in field
   - Academic projects and challenges
   - Strengths and awards

2. **Academic Experience (5-7 questions)**
   - Favorite courses and subjects
   - Technical/academic skills
   - Projects outside coursework
   - Competitions and events
   - Academic challenges overcome

3. **Research Experience (5-7 questions)**
   - Research projects and roles
   - Publications and presentations
   - Research interests
   - Skills to gain through research

4. **Career Goals (4-5 questions)**
   - Short-term goals (0-5 years)
   - Long-term goals (5-10 years)
   - How program helps achieve goals
   - Desired impact

5. **Program Fit (5-7 questions)**
   - Why this specific program
   - Faculty interests
   - Courses and labs of interest
   - Unique perspectives to contribute
   - Community involvement

6. **Personal Statement (3-4 questions)**
   - Personal qualities and characteristics
   - Challenges overcome
   - Additional information

### 3. Answer Validation

- **Length Requirements**: Minimum and maximum character limits per question
- **Real-time Feedback**: Instant validation with constructive feedback
- **Suggestions**: Helpful tips to improve answers
- **Quality Checks**: Detection of generic or vague responses

### 4. SOP Generation

- **Multiple Tones**: Choose from 4 different writing styles:
  - **Confident**: Assertive, showcasing achievements
  - **Humble**: Thoughtful, emphasizing learning
  - **Enthusiastic**: Passionate and motivated
  - **Balanced**: Professional combination (recommended)

- **Customizable Parameters**:
  - Target word count (500-1500 words)
  - Additional instructions
  - Program-specific details

- **Quality Features**:
  - Authentic student voice (not robotic)
  - Specific details from interview
  - Structured format (intro, body, conclusion)
  - Smooth transitions between paragraphs
  - Clear program fit demonstration

### 5. Multiple Drafts

- Generate multiple versions with different tones
- Compare drafts side-by-side
- Regenerate with modified parameters
- Keep all versions for reference

### 6. Export Options

- **Plain Text (.txt)**: Simple text format
- **Microsoft Word (.docx)**: Professional formatting with styles
- **PDF**: Print-ready document with proper layout

## Architecture

### Components

1. **Models** (`app/models/sop_generator.py`)
   - Pydantic models for data validation
   - InterviewSession, InterviewQuestion, InterviewAnswer
   - SOPDraft, SOPTone, SessionStatus enums

2. **Service** (`app/services/sop_generator_service.py`)
   - Core business logic
   - QuestionBank with smart follow-up logic
   - SOPGeneratorService for session management
   - Integration with Google Gemini for generation

3. **Export Service** (`app/services/sop_export_service.py`)
   - Document generation for TXT, DOCX, PDF
   - Professional formatting and styling
   - Custom headers and metadata

4. **API Endpoints** (`app/api/v1/sop_generator.py`)
   - RESTful API for all operations
   - JWT authentication
   - Comprehensive error handling

### Data Flow

```
User Request → API Endpoint → Service Layer → MongoDB
                                    ↓
                              Google Gemini AI
                                    ↓
                              Generated SOP
```

## API Reference

### Session Management

#### Create Session
```http
POST /api/v1/sop-generator/sessions
Content-Type: application/json

{
  "program_name": "Master of Science in Computer Science",
  "university_name": "Stanford University",
  "degree_level": "MS",
  "field_of_study": "Computer Science"
}
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
    "question_text": "Tell me about yourself...",
    "required": true,
    "min_length": 100,
    "guidance": "Share your educational journey..."
  },
  "total_questions": 27,
  "answered_questions": 0,
  "message": "Session created successfully. Let's begin the interview!"
}
```

#### Get Session
```http
GET /api/v1/sop-generator/sessions/{session_id}
```

#### List Sessions
```http
GET /api/v1/sop-generator/sessions?limit=10
```

#### Delete Session
```http
DELETE /api/v1/sop-generator/sessions/{session_id}
```

### Answer Management

#### Submit Answer
```http
POST /api/v1/sop-generator/sessions/{session_id}/answer
Content-Type: application/json

{
  "question_id": "bg_001",
  "answer_text": "I completed my Bachelor's in Computer Science..."
}
```

**Response:**
```json
{
  "session_id": "abc123",
  "status": "in_progress",
  "progress_percentage": 3.7,
  "current_question": {
    "question_id": "bg_002",
    "question_text": "What sparked your interest..."
  },
  "answered_questions": 1,
  "message": "Answer submitted successfully"
}
```

#### Edit Answer
```http
PUT /api/v1/sop-generator/sessions/{session_id}/answer/{question_id}
Content-Type: application/json

{
  "answer_text": "Updated answer with more details..."
}
```

### Progress Tracking

#### Get Progress
```http
GET /api/v1/sop-generator/sessions/{session_id}/progress
```

**Response:**
```json
{
  "session_id": "abc123",
  "progress_percentage": 55.6,
  "answered_questions": 15,
  "total_questions": 27,
  "remaining_questions": 12,
  "status": "in_progress",
  "can_generate": true
}
```

#### Get All Questions
```http
GET /api/v1/sop-generator/sessions/{session_id}/questions
```

### SOP Generation

#### Generate SOP
```http
POST /api/v1/sop-generator/sessions/{session_id}/generate
Content-Type: application/json

{
  "tone": "balanced",
  "word_count_target": 800,
  "additional_instructions": "Emphasize research experience"
}
```

**Response:**
```json
{
  "draft_id": "draft_xyz",
  "generated_at": "2025-10-12T10:30:00Z",
  "tone": "balanced",
  "content": "As a passionate computer science student...",
  "word_count": 812,
  "structure": {
    "introduction": "As a passionate computer science student...",
    "body": "During my undergraduate studies...",
    "conclusion": "I am confident that..."
  },
  "message": "SOP generated successfully!"
}
```

#### Regenerate SOP
```http
POST /api/v1/sop-generator/sessions/{session_id}/regenerate
Content-Type: application/json

{
  "tone": "confident",
  "word_count_target": 900
}
```

#### Get All Drafts
```http
GET /api/v1/sop-generator/sessions/{session_id}/drafts
```

#### Get Specific Draft
```http
GET /api/v1/sop-generator/sessions/{session_id}/drafts/{draft_id}
```

### Export

#### Export Draft
```http
GET /api/v1/sop-generator/sessions/{session_id}/export/{draft_id}?format=docx&applicant_name=John+Doe
```

**Query Parameters:**
- `format`: Export format (txt, docx, pdf)
- `applicant_name`: Optional name for header
- `program_name`: Optional program name (defaults to session data)
- `university_name`: Optional university name (defaults to session data)

## Usage Examples

### Python Client

```python
import requests

BASE_URL = "http://localhost:8000/api/v1/sop-generator"
HEADERS = {"Authorization": "Bearer YOUR_JWT_TOKEN"}

# 1. Create session
response = requests.post(
    f"{BASE_URL}/sessions",
    json={
        "program_name": "MS in Computer Science",
        "university_name": "Stanford University",
        "degree_level": "MS",
        "field_of_study": "Computer Science"
    },
    headers=HEADERS
)
session_data = response.json()
session_id = session_data["session_id"]

# 2. Answer questions
while True:
    # Get current question
    response = requests.get(f"{BASE_URL}/sessions/{session_id}", headers=HEADERS)
    session = response.json()

    if not session["current_question"]:
        break

    question = session["current_question"]
    print(f"Question: {question['question_text']}")

    # Get user answer
    answer = input("Your answer: ")

    # Submit answer
    response = requests.post(
        f"{BASE_URL}/sessions/{session_id}/answer",
        json={
            "question_id": question["question_id"],
            "answer_text": answer
        },
        headers=HEADERS
    )

# 3. Generate SOP
response = requests.post(
    f"{BASE_URL}/sessions/{session_id}/generate",
    json={
        "tone": "balanced",
        "word_count_target": 800
    },
    headers=HEADERS
)
draft = response.json()
print(f"Generated SOP:\n{draft['content']}")

# 4. Export to DOCX
draft_id = draft["draft_id"]
response = requests.get(
    f"{BASE_URL}/sessions/{session_id}/export/{draft_id}?format=docx",
    headers=HEADERS
)
with open("statement_of_purpose.docx", "wb") as f:
    f.write(response.content)
```

### JavaScript/TypeScript Client

```typescript
const BASE_URL = 'http://localhost:8000/api/v1/sop-generator';
const token = 'YOUR_JWT_TOKEN';

// Create session
const createSession = async () => {
  const response = await fetch(`${BASE_URL}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      program_name: 'MS in Computer Science',
      university_name: 'Stanford University',
      degree_level: 'MS',
      field_of_study: 'Computer Science'
    })
  });
  return response.json();
};

// Submit answer
const submitAnswer = async (sessionId: string, questionId: string, answer: string) => {
  const response = await fetch(`${BASE_URL}/sessions/${sessionId}/answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      question_id: questionId,
      answer_text: answer
    })
  });
  return response.json();
};

// Generate SOP
const generateSOP = async (sessionId: string) => {
  const response = await fetch(`${BASE_URL}/sessions/${sessionId}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      tone: 'balanced',
      word_count_target: 800
    })
  });
  return response.json();
};
```

## Configuration

### Environment Variables

Add to `ai_service/.env`:

```bash
# Google Gemini API Key
GOOGLE_API_KEY=your_gemini_api_key_here

# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=edulens

# JWT (must match Next.js)
JWT_SECRET=your_jwt_secret_here
JWT_ALGORITHM=HS256
```

### Dependencies

The service requires these Python packages (already in `pyproject.toml`):

```toml
[tool.uv.dependencies]
langchain-google-genai = "^2.0.0"
langgraph = "^0.2.0"
python-docx = "^1.1.0"
reportlab = "^4.0.0"
```

## MongoDB Schema

### Collection: `sop_sessions`

```json
{
  "session_id": "string",
  "user_id": "string",
  "status": "started|in_progress|completed|draft_generated",
  "created_at": "datetime",
  "updated_at": "datetime",
  "program_name": "string",
  "university_name": "string",
  "degree_level": "string",
  "field_of_study": "string",
  "current_question_index": 0,
  "questions": [
    {
      "question_id": "string",
      "category": "background|academic|research|career_goals|program_fit|personal_statement",
      "question_text": "string",
      "question_type": "text|multiline|choice|numeric",
      "required": true,
      "min_length": 50,
      "max_length": 2000,
      "order": 1,
      "depends_on": "string|null",
      "condition": "string|null",
      "examples": ["string"],
      "guidance": "string"
    }
  ],
  "answers": {
    "question_id": {
      "question_id": "string",
      "answer_text": "string",
      "answered_at": "datetime",
      "edited_at": "datetime|null",
      "word_count": 0,
      "char_count": 0,
      "validation_passed": true,
      "feedback": "string|null"
    }
  },
  "total_questions": 27,
  "answered_questions": 0,
  "progress_percentage": 0.0,
  "drafts": [
    {
      "draft_id": "string",
      "generated_at": "datetime",
      "tone": "confident|humble|enthusiastic|balanced",
      "content": "string",
      "word_count": 0,
      "structure": {
        "introduction": "string",
        "body": "string",
        "conclusion": "string"
      },
      "metadata": {}
    }
  ],
  "metadata": {}
}
```

## Testing

### Run Tests

```bash
# Install test dependencies
cd ai_service
uv pip install pytest pytest-asyncio pytest-cov httpx

# Run all tests
pytest tests/test_sop_generator_service.py tests/test_sop_generator_api.py -v

# Run with coverage
pytest tests/test_sop_generator_service.py tests/test_sop_generator_api.py --cov=app --cov-report=html
```

### Test Coverage

The test suite includes:
- ✅ Question bank logic and interpolation
- ✅ Session creation and management
- ✅ Answer submission and validation
- ✅ Answer editing
- ✅ Progress tracking
- ✅ SOP generation with different tones
- ✅ Draft management
- ✅ Export functionality
- ✅ API endpoint integration
- ✅ Error handling

## Best Practices

### For Users

1. **Answer Thoroughly**: Provide detailed, specific answers (aim for 50-100 words minimum)
2. **Be Authentic**: Write in your own voice; the AI will maintain it
3. **Include Examples**: Use concrete examples and achievements
4. **Research Faculty**: Mention specific professors and their work
5. **Edit Answers**: Review and refine your answers before generating
6. **Try Multiple Tones**: Generate several versions to compare
7. **Review Generated SOP**: Always review and personalize the final output

### For Developers

1. **Handle Errors Gracefully**: Always catch and log exceptions
2. **Validate Input**: Use Pydantic models for request validation
3. **Monitor API Usage**: Track Gemini API calls and costs
4. **Cache Sessions**: Use session caching for frequently accessed data
5. **Rate Limiting**: Implement rate limits on generation endpoints
6. **Backup Data**: Regular backups of MongoDB sessions
7. **Test Thoroughly**: Maintain high test coverage

## Troubleshooting

### Common Issues

**Issue**: "Insufficient answers" error when generating SOP
- **Solution**: Answer at least 50% of questions (minimum 13-15 questions)

**Issue**: Answer validation fails
- **Solution**: Ensure answers meet minimum length requirements (usually 50-100 characters)

**Issue**: Generation takes too long
- **Solution**: Gemini API can take 5-15 seconds; implement loading states

**Issue**: Export fails
- **Solution**: Ensure python-docx and reportlab are installed

**Issue**: Questions not interpolating program details
- **Solution**: Verify session metadata contains program_name, university_name, etc.

## Performance

### Metrics

- **Session Creation**: < 100ms
- **Answer Submission**: < 50ms
- **SOP Generation**: 5-15 seconds (Gemini API)
- **Export (DOCX/PDF)**: < 500ms
- **Database Queries**: < 20ms average

### Optimization Tips

1. **Use Connection Pooling**: Configure MongoDB connection pool size
2. **Cache Question Bank**: Load questions once at startup
3. **Async Operations**: Use async/await for all I/O operations
4. **Batch Updates**: Batch MongoDB updates when possible
5. **CDN for Exports**: Serve exported files via CDN

## Future Enhancements

- [ ] AI-powered answer suggestions and improvements
- [ ] Template library with program-specific formats
- [ ] Collaborative editing for mentors/advisors
- [ ] Version control and change tracking
- [ ] Integration with application management systems
- [ ] Multi-language support
- [ ] Voice input for answers
- [ ] AI-powered grammar and style checking
- [ ] Plagiarism detection
- [ ] SOP comparison and analysis

## Support

For issues or questions:
- Create an issue in the repository
- Contact the development team
- Check API documentation at `http://localhost:8000/docs`

## License

This service is part of the EduLen platform. All rights reserved.

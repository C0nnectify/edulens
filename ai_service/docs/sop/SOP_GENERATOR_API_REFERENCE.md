# SOP Generator API Reference Card

## Base URL
```
http://localhost:8000/api/v1/sop-generator
```

## Authentication
All endpoints require `x-user-id` header:
```
x-user-id: user123
```

## Quick Reference

### Session Management

#### Create Session
```http
POST /sessions
Content-Type: application/json

{
  "program_name": "MS in Computer Science",
  "university_name": "Stanford University",
  "degree_level": "MS",
  "field_of_study": "Computer Science"
}
```

#### Get Session
```http
GET /sessions/{session_id}
```

#### List Sessions
```http
GET /sessions?limit=10
```

#### Delete Session
```http
DELETE /sessions/{session_id}
```

### Answer Management

#### Submit Answer
```http
POST /sessions/{session_id}/answer
Content-Type: application/json

{
  "question_id": "bg_001",
  "answer_text": "I completed my Bachelor's..."
}
```

#### Edit Answer
```http
PUT /sessions/{session_id}/answer/{question_id}
Content-Type: application/json

{
  "answer_text": "Updated answer..."
}
```

#### Get All Questions
```http
GET /sessions/{session_id}/questions
```

### Progress & Generation

#### Get Progress
```http
GET /sessions/{session_id}/progress
```

#### Generate SOP
```http
POST /sessions/{session_id}/generate
Content-Type: application/json

{
  "tone": "balanced",
  "word_count_target": 800,
  "additional_instructions": "Emphasize research"
}
```

**Tones**: `confident` | `humble` | `enthusiastic` | `balanced`

#### Regenerate SOP
```http
POST /sessions/{session_id}/regenerate
Content-Type: application/json

{
  "tone": "confident",
  "word_count_target": 900
}
```

### Draft Management

#### Get All Drafts
```http
GET /sessions/{session_id}/drafts
```

#### Get Specific Draft
```http
GET /sessions/{session_id}/drafts/{draft_id}
```

#### Export Draft
```http
GET /sessions/{session_id}/export/{draft_id}?format=docx&applicant_name=John+Doe
```

**Formats**: `txt` | `docx` | `pdf`

## Response Models

### Session Response
```json
{
  "session_id": "abc123",
  "status": "in_progress",
  "progress_percentage": 37.0,
  "current_question": {
    "question_id": "bg_001",
    "category": "background",
    "question_text": "Tell me about yourself...",
    "required": true,
    "min_length": 100,
    "guidance": "Share your educational journey..."
  },
  "total_questions": 27,
  "answered_questions": 10,
  "message": "Answer submitted successfully"
}
```

### Progress Response
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

### Draft Response
```json
{
  "draft_id": "draft_xyz",
  "generated_at": "2025-10-12T10:30:00Z",
  "tone": "balanced",
  "content": "As a passionate computer science student...",
  "word_count": 812,
  "structure": {
    "introduction": "As a passionate...",
    "body": "During my undergraduate...",
    "conclusion": "I am confident..."
  },
  "message": "SOP generated successfully!"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Please answer at least 50% of questions before generating SOP"
}
```

### 404 Not Found
```json
{
  "detail": "Session not found"
}
```

### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "answer_text"],
      "msg": "Answer must be at least 10 characters long",
      "type": "value_error"
    }
  ]
}
```

## Question Categories

| Category | Count | Description |
|----------|-------|-------------|
| background | 5-7 | Educational background, achievements |
| academic | 5-7 | Courses, skills, projects |
| research | 5-7 | Research experience, publications |
| career_goals | 4-5 | Short/long-term goals |
| program_fit | 5-7 | Why this program, faculty |
| personal_statement | 3-4 | Personal qualities, challenges |

## Status Values

- `started` - Session created, no answers
- `in_progress` - Some questions answered
- `completed` - All questions answered
- `draft_generated` - SOP generated

## Usage Flow

```
1. POST /sessions
   ↓
2. GET /sessions/{id}
   ↓
3. POST /sessions/{id}/answer (repeat)
   ↓
4. GET /sessions/{id}/progress
   ↓
5. POST /sessions/{id}/generate
   ↓
6. GET /sessions/{id}/export/{draft_id}
```

## cURL Examples

### Create Session
```bash
curl -X POST http://localhost:8000/api/v1/sop-generator/sessions \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{
    "program_name": "MS in Computer Science",
    "university_name": "Stanford University",
    "degree_level": "MS",
    "field_of_study": "Computer Science"
  }'
```

### Submit Answer
```bash
curl -X POST http://localhost:8000/api/v1/sop-generator/sessions/abc123/answer \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{
    "question_id": "bg_001",
    "answer_text": "I completed my Bachelor of Science..."
  }'
```

### Generate SOP
```bash
curl -X POST http://localhost:8000/api/v1/sop-generator/sessions/abc123/generate \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{
    "tone": "balanced",
    "word_count_target": 800
  }'
```

### Export to DOCX
```bash
curl -X GET "http://localhost:8000/api/v1/sop-generator/sessions/abc123/export/draft_xyz?format=docx" \
  -H "x-user-id: user123" \
  --output sop.docx
```

## Python Client

```python
import requests

class SOPGeneratorClient:
    def __init__(self, base_url, user_id):
        self.base_url = base_url
        self.headers = {"x-user-id": user_id}

    def create_session(self, program_name, university_name, degree_level, field):
        return requests.post(
            f"{self.base_url}/sessions",
            json={
                "program_name": program_name,
                "university_name": university_name,
                "degree_level": degree_level,
                "field_of_study": field
            },
            headers=self.headers
        ).json()

    def submit_answer(self, session_id, question_id, answer_text):
        return requests.post(
            f"{self.base_url}/sessions/{session_id}/answer",
            json={"question_id": question_id, "answer_text": answer_text},
            headers=self.headers
        ).json()

    def generate_sop(self, session_id, tone="balanced", word_count=800):
        return requests.post(
            f"{self.base_url}/sessions/{session_id}/generate",
            json={"tone": tone, "word_count_target": word_count},
            headers=self.headers
        ).json()

    def export_draft(self, session_id, draft_id, format="docx", filename=None):
        response = requests.get(
            f"{self.base_url}/sessions/{session_id}/export/{draft_id}",
            params={"format": format},
            headers=self.headers
        )
        if filename:
            with open(filename, "wb") as f:
                f.write(response.content)
        return response.content

# Usage
client = SOPGeneratorClient("http://localhost:8000/api/v1/sop-generator", "user123")
session = client.create_session("MS in CS", "Stanford", "MS", "Computer Science")
```

## JavaScript/TypeScript Client

```typescript
class SOPGeneratorClient {
  constructor(
    private baseUrl: string,
    private userId: string
  ) {}

  async createSession(data: {
    program_name: string;
    university_name: string;
    degree_level: string;
    field_of_study: string;
  }) {
    const response = await fetch(`${this.baseUrl}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': this.userId
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async submitAnswer(sessionId: string, questionId: string, answerText: string) {
    const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': this.userId
      },
      body: JSON.stringify({
        question_id: questionId,
        answer_text: answerText
      })
    });
    return response.json();
  }

  async generateSOP(sessionId: string, tone: string = 'balanced', wordCount: number = 800) {
    const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': this.userId
      },
      body: JSON.stringify({
        tone,
        word_count_target: wordCount
      })
    });
    return response.json();
  }

  async exportDraft(sessionId: string, draftId: string, format: string = 'docx'): Promise<Blob> {
    const response = await fetch(
      `${this.baseUrl}/sessions/${sessionId}/export/${draftId}?format=${format}`,
      {
        headers: { 'x-user-id': this.userId }
      }
    );
    return response.blob();
  }
}

// Usage
const client = new SOPGeneratorClient('http://localhost:8000/api/v1/sop-generator', 'user123');
const session = await client.createSession({
  program_name: 'MS in CS',
  university_name: 'Stanford',
  degree_level: 'MS',
  field_of_study: 'Computer Science'
});
```

## Common Patterns

### Complete Interview Flow
```python
# 1. Create session
session = client.create_session(...)
session_id = session["session_id"]

# 2. Answer all questions
while True:
    session = client.get_session(session_id)
    question = session["current_question"]
    if not question:
        break
    answer = get_user_input(question["question_text"])
    client.submit_answer(session_id, question["question_id"], answer)

# 3. Generate multiple drafts
drafts = []
for tone in ["confident", "humble", "enthusiastic", "balanced"]:
    draft = client.generate_sop(session_id, tone=tone)
    drafts.append(draft)

# 4. Export best draft
best_draft = select_best_draft(drafts)
client.export_draft(session_id, best_draft["draft_id"], "docx", "sop.docx")
```

### Progress Checking
```python
progress = client.get_progress(session_id)
if progress["can_generate"]:
    print(f"Ready to generate! ({progress['progress_percentage']:.1f}% complete)")
else:
    remaining = progress["remaining_questions"]
    print(f"Please answer {remaining} more questions")
```

### Error Handling
```python
try:
    draft = client.generate_sop(session_id)
except requests.HTTPError as e:
    if e.response.status_code == 400:
        print("Not enough answers provided")
    elif e.response.status_code == 404:
        print("Session not found")
    else:
        print(f"Error: {e.response.json()['detail']}")
```

## Interactive Documentation

Visit http://localhost:8000/docs for the complete interactive API documentation powered by Swagger UI.

## Support

- **Full Documentation**: `ai_service/SOP_GENERATOR_README.md`
- **Quick Start**: `ai_service/SOP_GENERATOR_QUICKSTART.md`
- **Implementation Summary**: `SOP_GENERATOR_IMPLEMENTATION_SUMMARY.md`

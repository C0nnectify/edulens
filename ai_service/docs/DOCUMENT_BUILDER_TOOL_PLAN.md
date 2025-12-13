# Document Builder Tool Implementation Plan

## Overview

This document outlines the architecture and implementation plan for integrating Document Builder (SOP, LOR, CV, Resume) as tools into the chat-based AI system. The goal is to allow users to create professional documents through natural conversation with the AI assistant.

## Current State Analysis

### Existing Components:
1. **SOP Generator Service** (`app/services/sop_generator_service.py`)
   - Interview-based approach with question bank
   - LangGraph state machine for question flow
   - MongoDB storage for sessions
   - Gemini LLM for generation

2. **LOR Generator** (`app/api/v1/lor_upload.py`)
   - Form-based generation
   - Style retrieval from examples
   - LLM-based generation

3. **Chat Agent** (`app/api/chat_agent.py`)
   - Basic orchestration stub
   - Feature-to-agent mapping
   - Session management

4. **Multi-Agent Orchestrator** (`app/graph/orchestrator.py`)
   - Supervisor pattern
   - Document Agent exists but is generic

## Architecture Design

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                           │
│  [Document Builder Tool Selected] + [Option: SOP/LOR/CV/Resume] │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Chat Orchestrator                          │
│  - Receives message + feature (document_builder)                │
│  - Detects document sub-type (sop/lor/cv/resume)                │
│  - Routes to Document Builder Tool                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Document Builder LangGraph                     │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐           │
│  │ Understand  │──▶│  Collect    │──▶│  Generate   │           │
│  │   Intent    │   │    Info     │   │  Document   │           │
│  └─────────────┘   └─────────────┘   └─────────────┘           │
│         │                │                   │                  │
│         ▼                ▼                   ▼                  │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐           │
│  │  Clarify    │   │  Validate   │   │   Refine    │           │
│  │  Request    │   │   Answer    │   │   Draft     │           │
│  └─────────────┘   └─────────────┘   └─────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Document Tools                               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │ SOP Tool   │ │ LOR Tool   │ │ CV Tool    │ │Resume Tool │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### State Machine Design

```
                    ┌──────────────┐
                    │    START     │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Analyze    │◀─────────────┐
                    │    Input     │              │
                    └──────┬───────┘              │
                           │                      │
              ┌────────────┼────────────┐         │
              │            │            │         │
              ▼            ▼            ▼         │
       ┌───────────┐ ┌───────────┐ ┌───────────┐ │
       │  Collect  │ │  Answer   │ │  Execute  │ │
       │  Missing  │ │ Question  │ │ Generation│ │
       │   Info    │ │           │ │           │ │
       └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ │
             │             │             │       │
             └─────────────┴─────────────┘       │
                           │                     │
                           ▼                     │
                    ┌──────────────┐             │
                    │   Validate   │─────────────┘
                    │    State     │  (need more info)
                    └──────┬───────┘
                           │ (ready)
                           ▼
                    ┌──────────────┐
                    │   Generate   │
                    │   Document   │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │    Refine    │◀──────┐
                    │   (Optional) │       │
                    └──────┬───────┘       │
                           │               │
                           ▼               │
                    ┌──────────────┐       │
                    │   Present    │───────┘
                    │    Draft     │ (user wants changes)
                    └──────┬───────┘
                           │ (user accepts)
                           ▼
                    ┌──────────────┐
                    │     END      │
                    │ (Save/Export)│
                    └──────────────┘
```

## Implementation Components

### 1. Prompts Configuration (`app/tools/document_builder/prompts.py`)
- Centralized prompt management
- Easy editing without code changes
- Version control for prompts

### 2. State Models (`app/tools/document_builder/state.py`)
- Document type enum (SOP, LOR, CV, Resume)
- Collection state for each document type
- Generated document state

### 3. Document Tools (`app/tools/document_builder/tools/`)
- `sop_tool.py` - SOP generation tool
- `lor_tool.py` - LOR generation tool
- `cv_tool.py` - CV generation tool (future)
- `resume_tool.py` - Resume generation tool (future)

### 4. Document Builder Graph (`app/tools/document_builder/graph.py`)
- LangGraph state machine
- Conversation flow management
- Tool routing

### 5. API Integration (`app/api/v1/document_builder_chat.py`)
- Endpoint for chat-based document creation
- Session management
- Response formatting

## File Structure

```
ai_service/app/tools/document_builder/
├── __init__.py
├── prompts.py              # All prompts for document builder
├── state.py                # State models
├── constants.py            # Required fields, validation rules
├── graph.py                # LangGraph orchestrator
├── utils.py                # Helper functions
└── tools/
    ├── __init__.py
    ├── base_document_tool.py
    ├── sop_tool.py
    ├── lor_tool.py
    ├── cv_tool.py          # Phase 2
    └── resume_tool.py      # Phase 2
```

## Data Flow

### Example Conversation Flow for SOP:

```
User: "I want to create an SOP for MIT's Computer Science PhD program"

System (Analyze):
- Detects: document_type=SOP
- Detects: target_university=MIT
- Detects: target_program=Computer Science PhD
- Missing: background, experience, goals, etc.

System Response:
"Great! Let's create your SOP for MIT's Computer Science PhD program.
To craft a compelling statement, I'll need some information about you.

Let's start with your background. Can you tell me about your educational 
journey and what sparked your interest in Computer Science?"

User: "I have a Bachelor's in CS from IIT Delhi with 8.5 CGPA..."

System (Collect & Validate):
- Stores: educational_background
- Checks: sufficient detail ✓
- Next: academic achievements, research

System Response:
"Excellent! Your strong foundation at IIT Delhi is impressive. 
What research projects or significant academic work have you done 
that's relevant to the PhD program?"

... (continues until all required info is collected) ...

System (Generate):
- Uses collected information
- Retrieves style context
- Generates SOP draft

System Response:
"I've drafted your Statement of Purpose. Here's the draft:

[Generated SOP Content]

Would you like me to:
1. Refine any section
2. Adjust the tone
3. Make it more specific to MIT's faculty
4. Save and export it?"
```

## Required Fields by Document Type

### SOP Required Fields:
- Basic Info: target_program, target_university, degree_level
- Background: educational_background, gpa/grades, major_courses
- Experience: research_experience, projects, internships
- Goals: career_goals, why_this_program, why_this_university
- Optional: publications, awards, personal_story

### LOR Required Fields:
- Recommender Info: name, title, organization, relationship
- Student Info: name, role, association_duration
- Observations: skills_observed, achievements, character_traits
- Target: program, university
- Style: tone, strength_level

## API Endpoints

### Chat-based Document Builder

```http
POST /api/v1/document-builder/chat
Content-Type: application/json

{
  "session_id": "optional-existing-session",
  "message": "user message",
  "document_type": "sop|lor|cv|resume",  // optional, can be detected
  "attachments": []  // optional uploaded files
}

Response:
{
  "session_id": "session-uuid",
  "response": {
    "message": "AI response text",
    "action": "collect|generate|refine|complete",
    "document_draft": { ... },  // if generated
    "questions": [...],  // if collecting info
    "progress": {
      "collected_fields": ["field1", "field2"],
      "missing_fields": ["field3", "field4"],
      "percentage": 65
    }
  },
  "metadata": {
    "document_type": "sop",
    "agents_involved": ["DocumentBuilderAgent"]
  }
}
```

## Integration with Existing System

### 1. Update Chat Agent
Modify `chat_agent.py` to route document_builder requests with sub-options:

```python
@router.post("/message")
def post_message(req: ChatMessageRequest):
    if req.feature == "document_builder":
        # Route to document builder graph
        return document_builder_orchestrator.process(
            session_id=req.session_id,
            message=req.message,
            document_type=req.document_type  # new field
        )
```

### 2. Frontend Integration
Update the dashboard to pass document sub-type:

```typescript
// When user selects Document Builder + SOP
sendMessage({
  message: input,
  feature: "document_builder",
  documentType: "sop"  // new field
})
```

## Phase 1 Implementation (SOP & LOR)

### Week 1: Foundation
- [ ] Create prompts.py with all prompts
- [ ] Create state.py with state models
- [ ] Create base_document_tool.py

### Week 2: SOP Tool
- [ ] Implement sop_tool.py
- [ ] Create SOP-specific prompts
- [ ] Implement info collection flow
- [ ] Integrate with existing SOP generator

### Week 3: LOR Tool
- [ ] Implement lor_tool.py
- [ ] Create LOR-specific prompts
- [ ] Implement info collection flow
- [ ] Integrate with existing LOR generator

### Week 4: Integration & Testing
- [ ] Create graph.py orchestrator
- [ ] Update chat_agent.py
- [ ] Create API endpoints
- [ ] End-to-end testing

## Success Metrics

1. **User Experience**
   - Average interactions to complete document: < 10
   - User satisfaction score: > 4.5/5
   - Time to generate first draft: < 5 minutes

2. **Quality**
   - Document quality score: > 4/5 (human review)
   - Factual accuracy: 100% (no hallucination)
   - Format compliance: 100%

3. **Technical**
   - API response time: < 3s
   - Error rate: < 1%
   - Session persistence: 100%

## Security Considerations

1. User data encryption at rest
2. Session isolation by user_id
3. Rate limiting on API
4. Input sanitization
5. Secure document storage

## Future Enhancements (Phase 2)

1. CV Tool implementation
2. Resume Tool implementation
3. Multi-document projects (SOP + LOR bundle)
4. Template library
5. Version history
6. Collaborative editing
7. Export to multiple formats (PDF, DOCX)

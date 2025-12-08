# Multi-Agent System for Study Abroad

## Overview

This is a production-ready multi-agent system built with **LangGraph** for orchestrating specialized AI agents to help with study abroad tasks. The system uses a **supervisor pattern** where a central supervisor agent coordinates specialist agents.

## Architecture

```
┌─────────────────────────────────────────┐
│          Supervisor Agent               │
│     (Routes & Coordinates)              │
└───────┬──────┬──────┬──────┬───────────┘
        │      │      │      │
    ┌───▼──┐ ┌─▼───┐ ┌▼───┐ ┌▼──────┐
    │Research│Document│Track│Planning│
    │ Agent │ Agent  │Agent│ Agent  │
    └───┬──┘ └──┬───┘ └┬───┘ └───┬───┘
        │       │      │        │
    ┌───▼───────▼──────▼────────▼────┐
    │      Firecrawl MCP Tools        │
    │  Vector Store | Email | Celery  │
    └─────────────────────────────────┘
                 │
    ┌────────────▼─────────────────────┐
    │  MongoDB Memory & Persistence    │
    │  • agent_sessions                │
    │  • agent_session_messages        │
    │  • agent_memory_store            │
    └──────────────────────────────────┘
```

## Specialized Agents (9 Total)

### 1. Research Agent
**Purpose**: Deep web research using Firecrawl MCP

**Capabilities**:
- University rankings and comparisons
- Program research and analysis
- Scholarship discovery
- Cost of living analysis
- Professor/alumni LinkedIn search
- Application requirements extraction

**Tools**:
- `firecrawl_scrape`: Scrape single URLs
- `firecrawl_batch_scrape`: Parallel URL scraping
- `firecrawl_crawl`: Website crawling
- `firecrawl_search`: Web search with extraction
- `firecrawl_extract`: Structured data extraction
- `vector_add/query`: Store and retrieve findings

---

### 2. Document Agent
**Purpose**: Create and analyze application documents

**Capabilities**:
- Resume/CV generation and optimization
- Statement of Purpose (SOP) writing
- Letter of Recommendation drafting
- Document review and feedback
- University-specific tailoring

**Tools**:
- `vector_query`: Retrieve user profile
- `vector_add`: Store documents
- `firecrawl_scrape`: Research program requirements

---

### 3. Tracking Agent
**Purpose**: Monitor application portals and deadlines

**Capabilities**:
- Portal status monitoring
- Deadline tracking
- Change detection
- Email notifications
- Multi-application tracking

**Tools**:
- `firecrawl_scrape`: Check portal status
- `firecrawl_extract`: Extract deadlines
- `vector_add/query`: Store tracking history
- `email_send`: Send notifications

---

### 4. Planning Agent
**Purpose**: Create comprehensive study abroad plans

**Capabilities**:
- End-to-end timeline creation
- Budget planning and analysis
- Application strategy development
- Task coordination
- Milestone tracking

**Tools**:
- `vector_query`: Retrieve user data
- `vector_add`: Store plans
- `firecrawl_search`: Research destinations

---

### 5. Profile Evaluation Agent
**Purpose**: Assess student profiles and provide recommendations

**Capabilities**:
- Academic profile analysis (GPA, test scores, coursework)
- Research/work experience assessment
- Extracurricular evaluation
- University fit analysis
- Competitiveness scoring (reach/target/safety)
- Gap analysis and improvement recommendations
- Profile strengthening strategies
- Timeline planning based on profile

**Tools**:
- `vector_query`: Retrieve user profile
- `vector_add`: Store evaluation results
- `firecrawl_search`: Research admission requirements
- `firecrawl_scrape`: Get program details
- `firecrawl_extract`: Extract admission statistics

**Output**:
- Comprehensive evaluation report
- Strengths and weaknesses analysis
- Program-specific competitiveness scores
- Actionable recommendations with timeline
- Overall profile score (X/10)

---

### 6. Travel Planner Agent
**Purpose**: Plan travel logistics and budgets

**Capabilities**:
- Flight research and recommendations
- Accommodation planning (temporary + permanent)
- Visa requirements and timeline
- Travel insurance recommendations
- Budget estimation and breakdown
- Arrival logistics planning
- Packing and shipping guidance
- Pre-departure checklist creation
- Currency exchange and banking setup
- Safety and health preparations

**Tools**:
- `firecrawl_search`: Search flights, accommodation, visa info
- `firecrawl_scrape`: Get detailed pricing and requirements
- `firecrawl_extract`: Extract travel data
- `vector_query`: Retrieve travel preferences
- `vector_add`: Store travel plans

---

### 7. Financial Aid Agent ✨ NEW
**Purpose**: Discover scholarships and plan financial aid strategies

**Capabilities**:
- Scholarship database search and matching
- Financial aid eligibility assessment
- Total cost of attendance calculation
- Funding strategy optimization (scholarships → work → loans)
- Loan comparison and recommendations
- Budget planning with ROI analysis
- Application timeline with all scholarship deadlines
- Work authorization planning (TA/RA/part-time)
- Currency fluctuation planning

**Tools**:
- `firecrawl_search`: Search scholarship databases
- `firecrawl_scrape`: Get scholarship requirements and deadlines
- `firecrawl_extract`: Extract financial data (tuition, fees, costs)
- `vector_query`: Retrieve user financial profile
- `vector_add`: Store financial plans

**Output**:
- Top 10-30 matched scholarships with eligibility
- Total cost breakdown (tuition, living, insurance, etc.)
- Recommended funding mix
- Application timeline with deadlines
- ROI calculation

**Use Cases**:
- "Find all scholarships for my Master's in CS at CMU"
- "Calculate total cost for studying in Germany vs USA"
- "I have a $20,000 budget. What are my options?"

---

### 8. Peer Networking Agent ✨ NEW
**Purpose**: Connect students with alumni and peers for mentorship

**Capabilities**:
- Alumni discovery via LinkedIn and university directories
- Profile similarity analysis and matching
- Compatibility scoring (university/field/geography/career)
- Personalized introduction message generation
- Networking strategy and timeline
- Mentorship program matching
- Event and community discovery
- Follow-up recommendations

**Tools**:
- `firecrawl_search`: Find alumni on LinkedIn
- `firecrawl_scrape`: Get detailed profiles and backgrounds
- `firecrawl_extract`: Extract contact information
- `vector_query`: Retrieve user profile for matching
- `vector_add`: Store connections and networking history

**Matching Criteria**:
- University/Program (40%)
- Field of Study (25%)
- Geographic Connection (15%)
- Career Path (15%)
- Shared Interests (5%)

**Output**:
- 5-15 prioritized connections
- Ready-to-send introduction messages
- 3-5 specific questions for each contact
- Multi-week networking timeline
- Networking best practices

**Use Cases**:
- "Connect me with Stanford CS alumni working in AI"
- "Find mentors from India studying in Canada"
- "Introduce me to current students at Oxford"

---

### 9. Cultural Adaptation Agent ✨ NEW
**Purpose**: Prepare students for cultural transition and language learning

**Capabilities**:
- Cultural norms and etiquette research
- Language proficiency assessment
- Customized 12-week language learning roadmap
- Cultural shock preparation (4 phases)
- Integration strategies and tips
- Safety and emergency preparedness
- Do's and don'ts for destination
- 100+ essential phrases
- Resource recommendations (apps, courses)

**Tools**:
- `firecrawl_search`: Research cultural information
- `firecrawl_scrape`: Get cultural guides and etiquette
- `firecrawl_extract`: Extract language learning resources
- `vector_query`: Retrieve user's language level
- `vector_add`: Store learning progress

**Cultural Dimensions Covered**:
- Communication styles (direct vs indirect)
- Time perception (punctuality expectations)
- Social norms (greetings, personal space)
- Dining etiquette and food culture
- Taboos and sensitive topics
- Dress codes and appearance

**Output**:
- Comprehensive cultural guide
- Key differences from home country
- 100 essential phrases (survival + academic + social)
- 12-week language learning plan
- Integration tips and resources
- Do's and don'ts list

**Use Cases**:
- "Prepare me for cultural transition from China to Germany"
- "Create German learning plan for complete beginner"
- "What are key cultural differences between India and USA?"

---

## Memory System

### Dual-Layer Memory Architecture

#### Short-Term Memory (Session-Scoped)
- **Implementation**: LangGraph checkpointing with MongoDB
- **Purpose**: Maintain conversation context within a session
- **Storage**: `agent_sessions` collection
- **Features**:
  - Automatic checkpointing every N steps
  - State recovery on failure
  - Session resume capability

#### Long-Term Memory (Cross-Session)
- **Implementation**: MongoDB Store
- **Purpose**: Persist user information across sessions
- **Storage**: `agent_memory_store` collection
- **Use Cases**:
  - User preferences and profile
  - Previous research findings
  - Generated documents
  - Application history

#### In-Memory Pointer
- **Implementation**: Python dict with Redis fallback option
- **Purpose**: Fast access to active session state
- **Features**:
  - Auto-checkpoint to MongoDB every 5 updates
  - Session timeout (30 minutes default)
  - Automatic cleanup of expired sessions

## MongoDB Schema

### agent_sessions
```javascript
{
  "_id": ObjectId,
  "session_id": "uuid",
  "user_id": "user123",
  "agent_type": "multi_agent_system",
  "status": "active|completed|failed",
  "context": {
    "task_type": "research",
    "intent": "university_search",
    "metadata": {}
  },
  "graph_state": {},  // LangGraph state snapshot
  "created_at": ISODate,
  "updated_at": ISODate,
  "completed_at": ISODate | null
}
```

### agent_session_messages
```javascript
{
  "_id": ObjectId,
  "session_id": "uuid",
  "message_id": "uuid",
  "role": "user|assistant|system|tool",
  "content": "message text",
  "agent_name": "Research Agent" | null,
  "tool_calls": [],
  "tool_results": [],
  "metadata": {},
  "created_at": ISODate,
  "sequence_number": 0
}
```

### agent_memory_store
```javascript
{
  "_id": ObjectId,
  "user_id": "user123",
  "namespace": "preferences",
  "key": "target_countries",
  "value": ["USA", "Canada"],
  "created_at": ISODate,
  "updated_at": ISODate,
  "expires_at": ISODate | null
}
```

## API Endpoints

### Execute Multi-Agent Workflow
```bash
POST /api/v2/multi-agent/execute
```

**Request**:
```json
{
  "user_id": "user123",
  "message": "Find top CS programs in USA under $50k/year",
  "task_type": "research",
  "session_id": "optional-session-id",
  "metadata": {}
}
```

**Response**:
```json
{
  "success": true,
  "message": "Multi-agent execution completed",
  "data": {
    "session_id": "uuid",
    "status": "completed",
    "final_answer": "...",
    "agents_involved": ["Research Agent"],
    "research_findings": [...],
    "message_count": 5
  }
}
```

### Get Session History
```bash
POST /api/v2/multi-agent/session/history
```

**Request**:
```json
{
  "session_id": "uuid"
}
```

### List User Sessions
```bash
POST /api/v2/multi-agent/session/list
```

**Request**:
```json
{
  "user_id": "user123",
  "limit": 10,
  "status": "completed"
}
```

### System Status
```bash
GET /api/v2/multi-agent/status
```

### End Session
```bash
DELETE /api/v2/multi-agent/session/{session_id}
```

## Setup & Installation

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Set Environment Variables
```bash
cp .env.example .env
# Edit .env with your API keys
```

Required:
- `GOOGLE_API_KEY`: Google Gemini API
- `FIRECRAWL_API_KEY`: Firecrawl MCP API
- `MONGODB_URI`: MongoDB connection string

### 3. Start MongoDB
```bash
# Local MongoDB
mongod --dbpath ./data/db

# Or use MongoDB Atlas (cloud)
```

### 4. Run the Server
```bash
python main.py
```

Server starts at `http://localhost:8000`

### 5. Test the System
```bash
curl -X POST http://localhost:8000/api/v2/multi-agent/execute \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "message": "Research top universities for Computer Science in Canada",
    "task_type": "research"
  }'
```

## Usage Examples

### Example 1: University Research
```python
import requests

response = requests.post(
    "http://localhost:8000/api/v2/multi-agent/execute",
    json={
        "user_id": "john_doe",
        "message": "Find top 5 universities for MS in AI with scholarships",
        "task_type": "research"
    }
)

print(response.json())
```

### Example 2: Document Generation
```python
response = requests.post(
    "http://localhost:8000/api/v2/multi-agent/execute",
    json={
        "user_id": "john_doe",
        "message": "Create an SOP for Stanford CS PhD program",
        "task_type": "document",
        "session_id": "previous-session-id"  # Continue conversation
    }
)
```

### Example 3: Application Tracking
```python
response = requests.post(
    "http://localhost:8000/api/v2/multi-agent/execute",
    json={
        "user_id": "john_doe",
        "message": "Track my MIT application status",
        "task_type": "tracking"
    }
)
```

### Example 4: Study Abroad Planning
```python
response = requests.post(
    "http://localhost:8000/api/v2/multi-agent/execute",
    json={
        "user_id": "john_doe",
        "message": "Create a complete study abroad plan for Fall 2026 with $60k budget",
        "task_type": "planning"
    }
)
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URI` | `mongodb://localhost:27017` | MongoDB connection |
| `MONGODB_DATABASE` | `edulen_agents` | Database name |
| `AGENT_CHECKPOINT_INTERVAL` | `5` | Checkpoint every N updates |
| `AGENT_SESSION_TIMEOUT_MINUTES` | `30` | Session timeout |
| `GOOGLE_API_KEY` | Required | Gemini API key |
| `FIRECRAWL_API_KEY` | Required | Firecrawl API key |

## LangGraph Flow

```
START
  ↓
Supervisor (Analyze request)
  ↓
Route to Agent?
  ├─ YES → [Research/Document/Tracking/Planning] Agent
  │         ↓
  │       Execute tools
  │         ↓
  │       Return to Supervisor
  │         ↓
  │       Need more work? → Loop
  │
  └─ NO → Complete with final answer
           ↓
          END
```

## Key Features

1. **Modular Tool System**: Easy to add new tools
2. **Persistent Memory**: MongoDB + in-memory hybrid
3. **State Checkpointing**: Resume from any point
4. **Multi-Agent Collaboration**: Agents can delegate to each other
5. **Streaming Support**: Real-time updates (future)
6. **Error Recovery**: Automatic retry and fallback
7. **Session Management**: Timeout and cleanup
8. **Tool Validation**: Schema-based tool calling

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check MongoDB is running
mongosh

# Check connection string
echo $MONGODB_URI
```

### API Key Issues
```bash
# Verify API keys are set
env | grep API_KEY
```

### Agent Execution Errors
- Check logs: `tail -f logs/app.log`
- Verify all dependencies installed
- Ensure MongoDB indexes are created

## Future Enhancements

- [ ] Streaming responses
- [ ] Human-in-the-loop approval
- [ ] Multi-language support
- [ ] Voice interface
- [ ] Advanced analytics dashboard
- [ ] RAG integration for university data
- [ ] Cost optimization for API calls

## License

Proprietary - EduLen Platform

## Support

For issues and questions, contact: support@edulen.com

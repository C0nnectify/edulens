# Dream-to-Reality v2 Implementation Documentation

## Overview

This document describes the implementation of the Dream-to-Reality v2 feature for EduLens, enabling users to transition from the Dream Mode exploration to a personalized reality-based roadmap with multiple scenarios.

## Architecture

### Data Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Dream Mode    │     │  Multi-Step     │     │   User Profile  │
│   (localStorage)│────▶│  Signup Form    │────▶│  + RoadmapPlan  │
│                 │     │                 │     │  (MongoDB)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       ▼
        │               Step 1: Account         ┌─────────────────┐
        │               Step 2: Reality Data    │  3 Scenarios    │
        │                       │               │  - Dream        │
        │                       ▼               │  - Reality      │
        └──────────────▶ Migrate API            │  - Future       │
                                                └─────────────────┘
```

## Files Modified/Created

### New Files

| File | Purpose |
|------|---------|
| `src/components/signup/SignupStep2Form.tsx` | Multi-step signup form (Step 2: Reality data collection) |
| `src/app/api/roadmap-plan/route.ts` | API routes for RoadmapPlan CRUD operations |
| `docs/DREAM_TO_REALITY_V2.md` | This documentation |

### Modified Files

| File | Changes |
|------|---------|
| `src/types/roadmap.ts` | Added PRD Section 7 schemas (RoadmapPlan, RoadmapScenario, etc.) |
| `src/types/profile.ts` | Added SmartProfile fields (realityContext, futureAmbitions) |
| `src/app/signup/page.tsx` | Integrated multi-step flow with Step 2 form |
| `src/lib/services/profile-service.ts` | Updated migration to accept Step 2 data |
| `src/app/api/profile/migrate-dream/route.ts` | Handle Step 2 data conversion |
| `src/components/roadmap/CompletionModal.tsx` | Updated CTA to "Proceed to Reality" |

## Type Definitions

### RoadmapPlan Schema

```typescript
interface RoadmapPlan {
  id: string;
  userId: string;
  scenarios: {
    dream: RoadmapScenario;
    reality: RoadmapScenario;
    future: RoadmapScenario;
  };
  activeScenarioId: string;
  activeMode: 'dream' | 'reality' | 'future';
  createdFromDreamSession: boolean;
  dreamSessionId?: string;
  version: number;
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### RoadmapScenario Schema

```typescript
interface RoadmapScenario {
  id: string;
  planId: string;
  mode: 'dream' | 'reality' | 'future';
  name: string;
  description: string;
  milestones: RoadmapMilestoneRef[];
  estimatedStartDate: Date;
  estimatedCompletionDate: Date;
  targetIntake: { semester: IntakeSemester; year: number };
  overallProgress: number;
  assumptions: string[];
  risks: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### SmartProfile Extension

```typescript
interface UserProfile {
  // ... existing fields ...
  
  // SmartProfile fields (PRD v2)
  realityContext?: RealityContext;
  futureAmbitions?: FutureAmbitions;
  roadmapPlanId?: string;
  profileCompletionStep: 'basic' | 'reality' | 'complete';
}
```

### SignupStep2Data

```typescript
interface SignupStep2Data {
  gpa: number;
  gpaScale: number;
  currentDegree: 'bachelors' | 'masters' | 'phd' | 'other';
  major?: string;
  tests: {
    gre?: { status: TestPrepStatus; targetScore?: number };
    toefl?: { status: TestPrepStatus; targetScore?: number };
    ielts?: { status: TestPrepStatus; targetScore?: number };
  };
  budget: BudgetRange;
  targetIntake: { semester: IntakeSemester; year: number };
  dreamCountries: string[];
  dreamUniversities?: string[];
  preferredProgramType: 'masters' | 'phd' | 'mba' | 'any';
}
```

## User Flow

### Dream Mode to Signup

1. User completes Dream Mode exploration
2. Clicks "Proceed to Reality" on DreamTimeline or CompletionModal
3. Redirected to `/signup?from=dream`

### Multi-Step Signup

**Step 1: Account Creation**
- First name, last name
- Email address
- Password (min 8 characters)

**Step 2: Build Your Reality** (Dream flow only)
- GPA with adjustable scale (4.0, 10.0, 100)
- Current degree and target program type
- Test preparation status (GRE, TOEFL, IELTS)
- Dream countries (select up to 3)
- Budget range
- Target intake semester/year

### Timeline Calculation

The Reality scenario includes buffer time based on test preparation status:

| Test Status | Buffer Days |
|-------------|-------------|
| Not Started | 120 days (4 months) |
| Preparing | 60 days (2 months) |
| Scheduled | 30 days (1 month) |
| Completed | 0 days |

## API Endpoints

### Profile Migration

**POST /api/profile/migrate-dream**

Migrates dream session data to user profile.

Request:
```json
{
  "userId": "string",
  "dreamSessionData": { /* ... */ },
  "step2Data": { /* SignupStep2Data (optional) */ }
}
```

Response: `UserProfile`

### Roadmap Plan

**GET /api/roadmap-plan**

Retrieves the user's roadmap plan with all scenarios.

Response: `RoadmapPlan`

**POST /api/roadmap-plan**

Creates a new roadmap plan with 3 scenarios.

Request:
```json
{
  "userId": "string",
  "dreamSessionId": "string (optional)",
  "dreamStages": [{ "order": 1, "title": "...", "description": "..." }],
  "realityContext": { /* RealityContext */ },
  "futureAmbitions": { /* FutureAmbitions */ }
}
```

Response: `RoadmapPlan` (201 Created)

**PUT /api/roadmap-plan**

Updates the roadmap plan (e.g., switch active scenario).

Request: Partial `RoadmapPlan`

Response: `RoadmapPlan`

## MongoDB Collections

### user_profiles
- Stores user profile data including SmartProfile fields
- Indexes: `userId` (unique)

### roadmap_plans (NEW)
- Stores roadmap plans with 3 scenarios
- Indexes: `userId` (unique)
- Referenced from `user_profiles.roadmapPlanId`

## UI Components

### SignupStep2Form

Location: `src/components/signup/SignupStep2Form.tsx`

Features:
- GPA slider with customizable scale
- Test status selection (visual chips)
- Country multi-select (max 3)
- Budget dropdown
- Intake semester/year selection
- Skip option for users who want to complete later

### CompletionModal (Updated)

Location: `src/components/roadmap/CompletionModal.tsx`

Changes:
- CTA: "Proceed to Reality ✨"
- Emerald/teal color theme
- Updated description mentioning 3 scenarios

## Future Enhancements

1. **Scenario Switcher UI**: Allow users to toggle between Dream/Reality/Future scenarios on the dashboard
2. **Progress Tracking**: Mark milestones as complete and update scenario progress
3. **Task Templates**: Pre-built task templates for each milestone
4. **Timeline Visualization**: Gantt-chart style view of all scenarios
5. **AI Recommendations**: Suggest scenario adjustments based on progress

## Testing

### Manual Testing Checklist

- [ ] Dream mode → "Proceed to Reality" → Signup flow
- [ ] Step 1 account creation validates correctly
- [ ] Step 2 form collects all required data
- [ ] Skip option works (creates profile without Step 2 data)
- [ ] Dream migration creates profile with realityContext
- [ ] RoadmapPlan API creates 3 scenarios
- [ ] Timeline calculation respects test prep buffers
- [ ] Existing users signing in with dream data migrate correctly

### API Testing

```bash
# Create roadmap plan
curl -X POST http://localhost:3000/api/roadmap-plan \
  -H "Content-Type: application/json" \
  -H "Cookie: <session>" \
  -d '{"dreamStages":[{"order":1,"title":"Stage 1","description":"..."}]}'

# Get roadmap plan
curl http://localhost:3000/api/roadmap-plan \
  -H "Cookie: <session>"
```

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025 | Initial implementation of Dream-to-Reality v2 |

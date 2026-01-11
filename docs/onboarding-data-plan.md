# Plan: Use First-Time Signup (Onboarding) Answers in Orchestration

## Problem
- Today, signed-in users can still end up in the onboarding flow (e.g. when they hit `/signup` while already authenticated).
- The onboarding answers are captured, but they aren’t consistently used by the main app/agent orchestration across the product (especially outside the onboarding path).

## Goal
Make onboarding answers a first-class “user context” that:
1) is stored in a single, durable place, and
2) is automatically pulled into every agent/session that needs it.
---

## ✅ IMPLEMENTED: Signup/Onboarding Flow for Roadmap Creation

### Overview
Two distinct user flows are now supported:

### Flow A: Dream Chat → Signup (Dream Mode User)
1. User uses `/dream` chat to explore study abroad aspirations
2. User clicks "Proceed to Reality" → redirects to `/signup?from=dream`
3. On signup Step 2 form:
   - **Prefill API** extracts answers from dream chat messages
   - Fields with high/medium confidence are pre-filled with visual indicators (✓ From dream chat)
   - User confirms or modifies the pre-filled values
4. On submit, roadmap is **regenerated** from combined context (dream aspirations + reality constraints)

### Flow B: Direct Signup (New User)
1. User signs up at `/signup` → redirects to `/onboarding`
2. User completes 5-step onboarding wizard
3. On completion:
   - SmartProfile is created
   - **Dream roadmap stages are generated** from profile data
   - User gets personalized roadmap without needing dream chat

---

## Implementation Details

### 1. Dream Chat Extraction (`src/lib/services/profile-service.ts`)
New functions:
- `extractOnboardingFromDreamChat()` - Pattern-based extraction with confidence scores
- `getPrefillDataFromDream()` - Returns prefill data filtered by confidence threshold

Extracts:
- `targetCountries` (USA, UK, Canada, etc.)
- `preferredProgramType` (masters, phd, mba)
- `budget` (from mentions of cost/scholarship)
- `targetIntake` (semester and year)
- `major` (field of study)
- `currentDegree` (from context clues)

### 2. Prefill API (`src/app/api/onboarding/prefill/route.ts`)
- POST endpoint accepts dream chat messages
- Returns extracted fields with confidence scores
- Only high/medium confidence values are auto-filled

### 3. SignupStep2Form Enhancement (`src/components/signup/SignupStep2Form.tsx`)
- New prop: `dreamMessages` - array of chat messages
- On mount with dreamMessages, calls prefill API
- Shows visual indicators for prefilled fields
- Highlights extracted countries with special styling

### 4. Dream Roadmap Generation (`ai_service/app/agents/roadmap_syncer_agent.py`)
New functions:
- `generate_dream_stages_from_profile()` - Creates personalized stages based on:
  - Target degree and countries
  - Current test status (adds test prep if needed)
  - Financial situation (scholarship emphasis if needed)
  - Field of study
- `create_dream_roadmap_from_profile()` - Stores generated stages

### 5. API Endpoint (`ai_service/app/api/v1/smart_profile.py`)
New endpoint: `POST /{user_id}/generate-dream-roadmap`
- Generates dream stages from SmartProfile
- Supports `regenerate: true` to recreate from combined context

### 6. Sync API Update (`src/app/api/smart-profile/sync/route.ts`)
- New flag: `generateDreamRoadmap: true`
- Triggers dream roadmap generation for direct signup users

### 7. Profile Migration Update (`src/app/api/profile/migrate-dream/route.ts`)
- When step2Data is provided, triggers roadmap regeneration
- Creates SmartProfile from step2 data
- Calls dream roadmap generation endpoint

---

## Confidence Thresholds
- **High (>0.8)**: Auto-fill and highlight
- **Medium (0.5-0.8)**: Auto-fill with suggestion styling
- **Low (<0.5)**: Leave empty, available for reference

---

## Roadmap Regeneration Policy
Per user requirement, roadmap is **regenerated entirely from combined context** when:
- User provides step2 data during dream→signup flow
- User updates significant profile fields

---
## Current State (what exists already)
- UI collects onboarding data in `/onboarding` and POSTs to `/api/smart-profile`.
- `/api/smart-profile` proxies to the Python AI service (`/api/v1/smart-profile/`).
- `/onboarding` triggers roadmap generation via `/api/smart-profile/sync` (direction: `to_roadmap`).

## Recommended Data Contract
Treat onboarding answers as two structures that align with your existing TS domain types:

### 1) RealityContext (evidence-based current state)
Map onboarding fields into `RealityContext` (see `src/types/roadmap.ts`):
- `currentDegree`, `major`, `institution`, `gpa`, `gpaScale` → academic section
- `englishTestStatus`, `englishTest`, `englishScore`, `englishTestDate` → `tests.toefl/ielts/...` with `status/currentScore/scheduledDate`
- `greStatus`, `greScore` → `tests.gre`
- `gmatStatus`, `gmatScore` → `tests.gmat`
- `budgetMin/budgetMax` → `budget`
- `targetSemester/targetYear` → `targetIntake`

### 2) FutureAmbitions (dream goals / preferences)
Map onboarding fields into `FutureAmbitions` (see `src/types/roadmap.ts`):
- `targetCountries` → `dreamCountries` (cap to top 1–3 if needed)
- `targetDegree` → `preferredProgramType`
- Optional: derive `priorities` heuristics from funding/budget selection (if you want)

## Storage Strategy (pick one “source of truth”)
Choose ONE primary place to store the merged user context:

**Option A (recommended): Python SmartProfile is the source of truth**
- Store onboarding answers in SmartProfile (already happening).
- Add/standardize an endpoint that returns a compact “orchestration context” payload (RealityContext + FutureAmbitions + any derived fields).

**Option B: MongoDB (Next.js) user profile is the source of truth**
- Persist `realityContext` + `futureAmbitions` into your `UserProfile` model/collection.
- Python service becomes a consumer (read) and processor (derive roadmap, embeddings, etc.).

If you keep both (A + B), define one as authoritative and make the other a cached copy with clear sync rules.

## How to Use It in the Main Orchestration (practical integration)
### 1) Always attach user context to every agent/session
Wherever you create a chat/session/agent run:
- Fetch SmartProfile (or the cached user profile) at session start.
- Build a “userContext” object:
  - `realityContext`
  - `futureAmbitions`
  - `roadmapPlanId` / stage progress (if relevant)
- Pass it into:
  - system prompt templates
  - tool calls (e.g. “recommend universities”, “timeline planner”, “SOP generator”) as structured JSON

### 2) Use context to prefill UI and reduce repeated questions
- Dashboard pages (applications, scholarships, SOP generator, monitoring agent) should read this context and:
  - prefill country/degree/intake
  - default budget ranges
  - show relevant checklists based on test status

### 3) Make onboarding truly “first-time only”
- The rule should be:
  - If user is authenticated AND has an existing SmartProfile (or profile completeness above a small threshold), route to dashboard.
  - If authenticated but no profile exists, route to onboarding.
- This eliminates the confusing “already signed up but asked first-time questions again” loop.

## Implementation Steps (incremental)
1) **Define a stable orchestration context shape**
   - Create a TS type (e.g. `UserOrchestrationContext`) that references `RealityContext` and `FutureAmbitions`.
2) **Add an API helper to fetch context**
   - `GET /api/smart-profile` → convert to `UserOrchestrationContext` (server-side), cache it (short TTL).
3) **Wire context into the chat/agent entrypoints**
   - When creating a chat session (dashboard chat, monitoring agent, etc.), attach `userContext` in session state.
4) **Tighten routing rules**
   - `/signup`: if already signed-in and not actively signing up, redirect to dashboard.
   - `/onboarding`: redirect to dashboard if profile exists.
5) **Add a “refresh context” path**
   - When user updates profile in dashboard, write back to SmartProfile and re-run `/sync` as needed.

## Success Criteria
- Signed-in users never see onboarding unless they explicitly need to complete it.
- Agent outputs visibly reflect user context (countries/degree/intake/budget/tests) without re-asking basic questions.
- One canonical place exists for onboarding answers, with predictable sync behavior.

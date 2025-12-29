Roadmap PRD v1.0 for EduLens
Module: Roadmap Engine
MVP focus: Dream plan to application
Modes: Dream, Reality, Future Potential
Core principle: One input generates three synchronized outputs. The three outputs share the same milestone structure and milestone IDs.

1) Summary
What this module is
Roadmap is the planning and guidance engine of EduLens. It turns a student’s goal plus current profile into a long range journey map that stays useful for 2 to 3 years.
What makes it different
It is not a static checklist. It is a synchronized three lens plan:
Dream mode: mental model and ideal milestones
Reality mode: realistic roadmap based on evidence and current stage
Future Potential mode: what if scenarios showing tradeoffs and how outcomes change
Primary outcomes
Users understand the path in minutes (Dream)
Users get executable tasks that keep them engaged weekly (Reality)
Users see how specific improvements expand possibilities (Future Potential)

2) Goals and non goals
Goals
Produce a stable milestone map that stays consistent across modes.
Convert the selected active mode into tracker tasks without overwhelming the user.
Update dynamically as the profile changes, while staying predictable (not changing every day).
Provide a clear difference view between modes so users understand why reality differs from dream.
Provide future scenarios that drive action, not just motivation.
Non goals for MVP
Full visa and post admit roadmap
Full multi goal planning across many countries simultaneously
Fully automated “apply for me” workflows

3) Users, personas, and jobs to be done
Persona A: Explorer (12 to 24 months)
Wants a mental model and a path without stress.
Wants to know “is it possible and what does it take”.
Persona B: Preparer (6 to 18 months)
Needs weekly direction and accountability.
Needs gap closure and timeline discipline.
Persona C: Applicant (3 to 9 months)
Needs a time boxed roadmap aligned to deadlines.
Needs dependencies and document sequencing.

4) Key concepts and definitions
Core objects referenced
SmartProfile: versioned student profile and evidence summary
Goal: destination, degree, intake, constraints
RoadmapPlan: container for all roadmap scenarios
RoadmapScenario: dream, reality, future
RoadmapMilestone: stable milestone structure shared by all modes
RoadmapTaskTemplate: tasks derived from milestones before they become tracker tasks
Task: tracker tasks created from roadmap
Signal: monitoring insights that can influence roadmap later
EventLog: audit trail of state changes
Mode definitions
Dream mode
Purpose: mental model and ideal milestone shape
Output: milestone explanations and generalized targets
Behavior: not strict on dates, low pressure
Reality mode
Purpose: executable plan based on current evidence and constraints
Output: gap list, milestones with time windows, task plan synced to Tracker AI
Behavior: shows confidence and missing evidence requests
Future Potential mode
Purpose: what if comparison and tradeoffs
Output: scenario deltas like timeline shift, feasibility shift, shortlist expansion estimate
Behavior: limited levers in MVP, user must confirm to convert to tasks

5) Product requirements
5.1 P0 requirements (must ship in MVP)
R1: One input, three synchronized outputs
Given Goal vX and SmartProfile vY:
System generates RoadmapPlan v1 containing:
Dream scenario
Reality scenario
Future scenario
All scenarios share the same milestone list and milestone IDs.
Only scenario fields vary, like timelines, confidence, recommended actions, risk.
Acceptance criteria
Switching between modes shows the same milestone names in the same order.
Each milestone has a stable milestone_id present in all three modes.

R2: Milestone taxonomy (MVP)
Roadmap must have a fixed milestone taxonomy that covers Dream plan to application.
Minimum milestones:
Profile foundation
Goal and intake clarity
Tests and scores plan
Portfolio and experience building
Shortlist and fit exploration
Funding and scholarship plan (lightweight)
Document package building
Application execution planning
Submission and follow ups (lightweight)
Each milestone must have:
milestone_id (stable)
title
description
category (tests, docs, activities, finance, planning)
dependencies (list of milestone_ids)
default task templates
Acceptance criteria
Milestones are stable even if user edits profile.
Dependencies are enforceable and visible in reality mode.

R3: Reality mode must be evidence aware
Reality mode uses the user’s uploaded documents and structured profile to adjust:
feasibility
confidence
gap list
timeline windows
Evidence sources for MVP:
transcript or marksheets
test score reports if available
CV draft or portfolio link if available
certificates and awards
Acceptance criteria
If transcript exists, reality mode uses it and marks confidence higher.
If evidence is missing, reality mode still generates but flags low confidence and lists missing evidence.

R4: Active mode selection and task sync contract
All three modes are visible.
Exactly one mode is Active at a time (default Reality).
Active mode is the source of tasks sent to Tracker AI.
Sync rules
When Active mode changes:
Do not delete completed tasks.
For incomplete tasks, reschedule and update metadata.
Create new tasks if mode introduces new gaps or milestones.
Acceptance criteria
Switching active mode does not erase user progress.
Tasks created from roadmap carry source metadata: source=roadmap, milestone_id, scenario_type, profile_version.

R5: Task decomposition must follow the 4 bucket system
All tasks created from Roadmap must map into:
Tests and scores
Documents and content
Activities and skills
Finance and savings
Each task must include:
title
bucket
milestone_id
suggested start window and due window
priority
estimated effort (S, M, L)
rationale text: “why this matters”
task_type (one time, recurring, checklist)
Acceptance criteria
Tasks always have a bucket and milestone_id.
The tracker can filter tasks by bucket and milestone.

R6: Difference view
Roadmap UI must include:
Dream vs Reality difference view:
what is missing
what is strong already
which milestones need work
Reality vs Future Potential difference view:
lever changes
outcome deltas
recommended actions
Acceptance criteria
User can open difference view without leaving roadmap.
Difference view is understandable without reading long explanations.

R7: Future Potential mode with limited levers
MVP supports 5 to 8 levers only, for example:
Improve IELTS by X
Increase weekly hours available
Increase budget range
Delay intake by 1 season
Add 1 internship
Add 1 research project or publication
Improve GPA slightly (if applicable)
Add leadership activity
For each lever, show:
expected impact on feasibility tier (safe, match, ambitious)
timeline shift estimate
risk shift
suggested next tasks
Acceptance criteria
Future mode never overwhelms users with dozens of controls.
Future mode outputs are expressed as deltas, not just text.

5.2 P1 requirements (should ship after MVP)
Reroute engine: reroute when intake changes, budget changes, or score updates.
Confidence scoring per milestone and per plan, with reasons.
Milestone level progress visualization (based on task completion and evidence).
Lightweight “application season mode switch” that tightens schedules when close to deadlines.
5.3 P2 requirements (later)
Multi goal planning across multiple countries with weighted preferences.
Personalized sequences learned from outcomes.
Integration with mentor feedback and document rubric deltas.

6) User experience and screens
6.1 Roadmap main screen
Components:
Goal summary strip
degree, intake, destination, budget range
Readiness snapshot
overall readiness and major gaps
Mode toggle
Dream, Reality, Future Potential
Active mode indicator and Activate button
Active mode badge shown clearly
Milestone list
collapsible milestones
shows status, confidence, next step
Difference view entry point
two buttons or one toggle panel
UX rules
Default view focuses on “this month” actions plus next milestone.
Do not show 200 tasks on roadmap screen. That lives in Tracker AI.
Use progressive disclosure: milestone summary first, details on expand.
6.2 Dream mode UI requirements
Milestones show “what it looks like” and typical examples.
No strict dates, but can show general ordering.
6.3 Reality mode UI requirements
Milestones show time windows, gap checklist, confidence label.
“Generate tasks” or “Sync tasks” button visible.
“Missing evidence” request visible when confidence is low.
6.4 Future Potential UI requirements
Small set of levers, sliders or toggles.
Output panel shows deltas clearly.
“Apply to Reality as proposal” button that creates a proposed plan, not auto overwrite.

7) Data model and schemas
Below is a buildable schema outline. Use your existing Mongo model style.
7.1 RoadmapPlan
_id
user_id
goal_id
profile_version_id
created_at, updated_at
active_scenario_type: dream | reality | future
milestones: [RoadmapMilestoneRef]
scenarios: {
dream: RoadmapScenario,
reality: RoadmapScenario,
future: RoadmapScenario
}
generation_metadata: {
engine_version,
prompt_version,
model_used,
cost_estimate,
latency_ms
}
7.2 RoadmapMilestoneRef
milestone_id (stable string)
order_index
dependencies: [milestone_id]
category
default_task_templates: [RoadmapTaskTemplate]
7.3 RoadmapScenario
scenario_type
milestone_states: [RoadmapScenarioMilestoneState]
summary: {
overall_readiness_score,
top_gaps: [],
top_actions: [],
confidence_score,
timeline_start,
timeline_end
}
scenario_inputs: {
levers_applied: {},
assumptions: {}
}
7.4 RoadmapScenarioMilestoneState
milestone_id
status: not_started | in_progress | complete | blocked
confidence: low | medium | high
risk_level: low | medium | high
recommended_time_window: { start_date, end_date }
gap_items: [{ key, label, severity, evidence_required }]
suggested_actions: [RoadmapTaskTemplate] or [TaskSuggestion]
notes: text
7.5 RoadmapTaskTemplate
template_id
title
bucket
milestone_id
recommended_offset_weeks_from_now
due_offset_weeks_from_now
effort: S | M | L
rationale
task_type
prerequisites: [template_id or milestone_id]
7.6 Task created from roadmap
task_id
user_id
title
bucket
due_date
status
source: { type: "roadmap", roadmap_plan_id, scenario_type, milestone_id, profile_version_id }
created_at, updated_at

8) System behavior and algorithms
8.1 Roadmap generation pipeline (high level)
Input:
Goal
SmartProfile version
Evidence summary (derived from vault documents)
Current date and time available per week
Steps:
Normalize inputs into a compact “RoadmapInput” object
Select milestone taxonomy template for the goal type
Generate Dream scenario:
fill milestone explanations and ideal targets
Generate Reality scenario:
compute gap list from evidence
assign time windows anchored to intake date
set confidence per milestone
Generate Future scenario:
define levers and baseline from reality
compute deltas for lever changes
Outputs:
RoadmapPlan written to DB
EventLog records for creation and mode changes
8.2 Task generation rules
Create tasks only from Active scenario.
Use stable template_id and milestone_id for dedupe.
On regeneration:
If task is completed, do nothing.
If task is incomplete and matches template_id, update due window and rationale if needed.
If a template no longer exists, archive the task, do not delete.
8.3 Confidence scoring
Compute per milestone confidence using evidence coverage:
transcript present: boosts academic related milestones
test score present: boosts test plan milestones
CV portfolio present: boosts experience milestones
missing evidence: reduces confidence and adds “upload request” tasks

9) Integration requirements
9.1 Tracker AI
Roadmap sends tasks to Tracker.
Tracker sends progress back as milestone completion signals.
Roadmap does not display all tasks, only milestone summaries and top actions.
9.2 Document AI and Vault
Roadmap milestones can request evidence uploads.
Reality mode can generate document tasks like SOP draft, CV update.
When Document AI creates a new version, it can update roadmap milestone confidence.
9.3 Chat controller
Chat must support:
create roadmap
explain differences between dream and reality
activate a mode
regenerate based on new evidence
Chat must write state to RoadmapPlan and Tasks, not to chat history.

10) Analytics and event tracking
Minimum events for Roadmap module:
roadmap_created
roadmap_viewed
roadmap_mode_switched
roadmap_mode_activated
roadmap_diff_view_opened
roadmap_future_lever_changed
roadmap_tasks_generated
roadmap_regenerated_profile_change
roadmap_confidence_low_prompt_shown
roadmap_missing_evidence_task_created
Metrics derived:
activation: percent who create roadmap and activate reality
retention: roadmap revisits per week, tasks generated rate
quality: percent with low confidence, top missing evidence types
conversion: future mode usage correlated with paid upgrades (if future mode becomes premium later)

11) Edge cases and handling
User changes intake date after tasks exist
Keep completed tasks
Shift upcoming tasks
Recompute time windows
Show diff summary of what moved
User changes destination country
Dream updates immediately
Reality asks for constraint confirmation (budget, language, tests)
Future shows tradeoffs
Sparse profile with no evidence
Dream works fully
Reality runs with low confidence and generates “upload evidence” tasks
Future limits levers until baseline profile is filled
Conflicting evidence (profile vs transcript)
Flag mismatch
Ask user to confirm
Do not regenerate reality until resolved or user accepts a correction
Overwhelming task explosion
Cap tasks generated per milestone per week
Generate tasks in waves, starting with the next 2 to 4 weeks
Keep the rest as “planned tasks” not active tasks

12) Non functional requirements
Performance: roadmap view should load fast with cached plan, generation runs async if heavy.
Cost control: generation uses budgets, re generation throttled.
Privacy: roadmap reveals sensitive profile info, must be protected under user auth.
Auditability: every generation and mode activation writes EventLog.
Reliability: if roadmap generation fails, show last known plan and retry job.

13) Implementation notes for your stack
Suggested architecture within your current setup:
Next.js renders roadmap UI and calls backend.
FastAPI owns roadmap generation and writes RoadmapPlan and Tasks.
Celery workers handle:
heavy roadmap regeneration
scenario recalculations for future levers if needed
MongoDB stores RoadmapPlan and related objects.
Vector store can be used later for retrieving program requirements context, not required for the first milestone taxonomy.

14) Delivery plan for Roadmap module
MVP milestone 1
Milestone taxonomy
Dream and Reality generation
Active mode and task sync
Difference view for Dream vs Reality
MVP milestone 2
Future Potential with limited levers
Difference view for Reality vs Future
Reroute on intake change (basic)


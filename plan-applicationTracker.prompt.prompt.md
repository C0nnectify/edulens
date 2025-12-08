# Plan: Application Tracker Enhancement & AI Integration

## Executive Summary
Transform the current static Application Tracker into an intelligent, automated hub by bridging the Next.js frontend with the existing Python AI service. This will populate the empty "University" and "Professors" tabs with real data, auto-link generated SOPs, and provide admission probability scores.

## Detailed Phases

### Phase 1: Data Integration (The "Glue")
*   **Objective:** Link the Tracker to the AI Service.
*   **Action:**
    *   Update the `Application` schema in MongoDB to include a `linked_resources` field (ids for generated SOPs, LORs).
    *   Modify the SOP Generator to accept an optional `application_id`. When an SOP is finalized, it should automatically update the corresponding Application record in the tracker.

### Phase 2: Populate "Coming Soon" Tabs
*   **Objective:** Fill the empty tabs with real AI-researched data.
*   **Action:**
    *   **University Tab:** Create a new endpoint in the Python service (`/api/university-info`) that takes a university name and returns rankings, location, and stats using the `University` tool.
    *   **Professors Tab:** Implement the `Professor` model to scrape/find relevant professors based on the user's research interests and the application's program, then display them in the tracker.

### Phase 3: Intelligent Features
*   **Objective:** Add "Real-World" utility.
*   **Action:**
    *   **Admission Chances:** Use the existing `AdmissionChance` model in `ai_service` to show a "Win Probability" score on the Application Overview tab.
    *   **Deadline Watch:** Implement a background job (using the existing `tasks` logic) to send email notifications 7, 3, and 1 day before deadlines.

### Phase 4: Document Checklist Automation
*   **Objective:** Make the "Documents" column active.
*   **Action:**
    *   Instead of a static list, make the "Documents" section a checklist.
    *   Clicking "Create SOP" next to the checklist item should deep-link to the SOP Generator with the University/Program pre-filled.

## Summary of Features to Implement

| Feature | Priority | Description |
| :--- | :--- | :--- |
| **Smart Document Linking** | High | Auto-attach generated SOPs/LORs to the specific Application card. |
| **University Insights** | High | Populate the "University" tab with AI-researched data (Rankings, acceptance rates). |
| **Professor Finder** | Medium | Populate the "Professors" tab with potential supervisors matching user interests. |
| **Admission Predictor** | Medium | Display "Reach/Target/Safety" badges using the ML model. |
| **Deep Linking** | Low | "Create SOP" button in Tracker redirects to Generator with context. |

## Further Considerations
1.  **Data Strategy**: Cache University data in MongoDB for faster loading.
2.  **Visuals**: Consider adding a Kanban board view (columns for statuses) in addition to the current list view.

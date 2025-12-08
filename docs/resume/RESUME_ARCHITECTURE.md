# Resume Builder Architecture

## Component Hierarchy

```
EnhancedResumeEditor (Main Container)
├── Header Section
│   ├── TemplateSwitcher
│   │   └── Popover with Template Options
│   └── ResumeScoreDashboard
│       ├── Overall Score Display
│       ├── Individual Metric Cards
│       │   ├── Completeness (25%)
│       │   ├── ATS Optimization (30%)
│       │   ├── Impact (25%)
│       │   └── Length (20%)
│       └── Quick Tips Section
│
├── Main Content Area
│   ├── ResumeBuilderSidebar (Left)
│   │   ├── Progress Header
│   │   │   ├── Completion Percentage
│   │   │   └── Toggle All Buttons
│   │   └── DndContext (Drag & Drop)
│   │       └── SortableContext
│   │           └── Section Items (Sortable)
│   │               ├── Drag Handle (GripVertical)
│   │               ├── Section Icon
│   │               ├── Section Title
│   │               ├── Completion Status
│   │               ├── Visibility Toggle (Eye Icon)
│   │               └── Section Content (Accordion)
│   │
│   └── ResumePreview (Right)
│       └── Template-based rendering
│
└── FloatingActions (Fixed Bottom-Right)
    ├── Undo Button (Ctrl+Z)
    ├── Redo Button (Ctrl+Shift+Z)
    ├── Toggle Preview Button
    ├── Export Button (Ctrl+P)
    └── Save Button (Ctrl+S)
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    EnhancedResumeEditor                      │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   useUndoRedo Hook                      │ │
│  │  ┌──────────┐    ┌─────────┐    ┌───────────┐         │ │
│  │  │   Past   │ -> │ Present │ -> │  Future   │         │ │
│  │  │  States  │ <- │  State  │ <- │  States   │         │ │
│  │  └──────────┘    └─────────┘    └───────────┘         │ │
│  │       ↑               ↓                ↑                │ │
│  │      Undo         setState           Redo              │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↓                                  │
│                    Resume State                              │
│                           ↓                                  │
│  ┌────────────┬───────────────────┬─────────────────────┐  │
│  │            │                   │                     │  │
│  │  Sidebar   │   Score Dashboard │   Preview           │  │
│  │            │                   │                     │  │
│  │  Updates   │   Calculates      │   Renders           │  │
│  │  Sections  │   Scores          │   Template          │  │
│  │            │                   │                     │  │
│  └────────────┴───────────────────┴─────────────────────┘  │
│                           ↓                                  │
│                    Auto-save Timer                           │
│                           ↓                                  │
│                    onSave Callback                           │
│                           ↓                                  │
│                    API/Database                              │
└─────────────────────────────────────────────────────────────┘
```

## State Management Flow

```
User Action
    ↓
┌───────────────────────────────────┐
│     Component Event Handler       │
└───────────────────────────────────┘
    ↓
┌───────────────────────────────────┐
│   setState (from useUndoRedo)     │
│   - Adds to history               │
│   - Updates present state         │
│   - Clears future                 │
└───────────────────────────────────┘
    ↓
┌───────────────────────────────────┐
│    React Re-render                │
│    - All components update        │
│    - Memoized calculations run    │
└───────────────────────────────────┘
    ↓
┌───────────────────────────────────┐
│    Auto-save Timer (3s)           │
│    - Debounced save               │
│    - Toast notification           │
└───────────────────────────────────┘
    ↓
┌───────────────────────────────────┐
│    Backend API                    │
│    - Persist to database          │
└───────────────────────────────────┘
```

## Drag & Drop Flow

```
User starts dragging section
    ↓
┌─────────────────────────────────────┐
│   DndContext.onDragStart            │
│   - Set activeId                    │
│   - Show drag overlay               │
└─────────────────────────────────────┘
    ↓
User moves section
    ↓
┌─────────────────────────────────────┐
│   SortableContext                   │
│   - Calculate new position          │
│   - Show drop indicator             │
└─────────────────────────────────────┘
    ↓
User drops section
    ↓
┌─────────────────────────────────────┐
│   DndContext.onDragEnd              │
│   - arrayMove(sections)             │
│   - Update order numbers            │
│   - Save to metadata                │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│   onUpdate callback                 │
│   - Update resume.metadata          │
│   - Trigger re-render               │
└─────────────────────────────────────┘
    ↓
Toast: "Section order updated"
```

## Score Calculation Flow

```
Resume State Change
    ↓
┌─────────────────────────────────────┐
│   useMemo (ResumeScoreDashboard)    │
│   - Triggered by resume changes     │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│   Calculate Individual Scores       │
│                                     │
│   ├─ Completeness (0-100)          │
│   │   ├─ Personal Info (20)        │
│   │   ├─ Summary (15)              │
│   │   ├─ Experience (25)           │
│   │   ├─ Education (15)            │
│   │   ├─ Skills (15)               │
│   │   └─ Projects/Certs (10)       │
│   │                                 │
│   ├─ ATS Optimization (0-100)      │
│   │   ├─ Email (-20 if missing)    │
│   │   ├─ Experience (-30 if none)  │
│   │   ├─ Education (-20 if none)   │
│   │   ├─ Skills (-15 if < 5)       │
│   │   └─ Date format (-10 if bad)  │
│   │                                 │
│   ├─ Impact (0-100)                │
│   │   ├─ Numbers in achievements   │
│   │   ├─ Action verbs              │
│   │   └─ Projects                  │
│   │                                 │
│   └─ Length (0-100)                │
│       ├─ Word count                │
│       └─ Ideal: 400-800 words      │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│   Calculate Weighted Overall        │
│   - Completeness × 0.25             │
│   - ATS × 0.30                      │
│   - Impact × 0.25                   │
│   - Length × 0.20                   │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│   Generate Suggestions              │
│   - Based on low scores             │
│   - Contextual tips                 │
└─────────────────────────────────────┘
    ↓
Render Score Dashboard
```

## Template Switching Flow

```
User clicks TemplateSwitcher
    ↓
┌─────────────────────────────────────┐
│   Popover Opens                     │
│   - Show template options           │
│   - Display previews                │
│   - Show ATS scores                 │
└─────────────────────────────────────┘
    ↓
User selects template
    ↓
┌─────────────────────────────────────┐
│   onTemplateChange callback         │
│   - Update resume.template          │
│   - Trigger re-render               │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│   Preview Updates                   │
│   - Apply new template styles       │
│   - Preserve all data               │
└─────────────────────────────────────┘
    ↓
Toast: "Template changed to {name}"
```

## Section Visibility Flow

```
User clicks eye icon
    ↓
┌─────────────────────────────────────┐
│   handleToggleVisibility            │
│   - Check if required section       │
│   - Update section.visible          │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│   Update sectionConfigs             │
│   - Map sections to configs         │
│   - Save to metadata                │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│   onUpdate callback                 │
│   - Update resume.metadata          │
│   - Trigger re-render               │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│   Visual Updates                    │
│   - Sidebar: Gray out section       │
│   - Preview: Hide section           │
│   - Completion: Recalculate         │
└─────────────────────────────────────┘
    ↓
Toast: "Section {name} hidden/shown"
```

## Keyboard Shortcut Handling

```
User presses Ctrl+Z
    ↓
┌─────────────────────────────────────┐
│   useEffect in useUndoRedo          │
│   - Listen for keydown              │
│   - Check Ctrl/Cmd + Z              │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│   undo() function                   │
│   - Pop from past                   │
│   - Move present to future          │
│   - Set new present                 │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│   React Re-render                   │
│   - All components update           │
│   - Show previous state             │
└─────────────────────────────────────┘
    ↓
Visual feedback (no toast)
```

## Auto-Save Flow

```
Resume state changes
    ↓
┌─────────────────────────────────────┐
│   useEffect in Editor               │
│   - Clear previous timer            │
│   - Set new 3s timer                │
└─────────────────────────────────────┘
    ↓
Wait 3 seconds (no more changes)
    ↓
┌─────────────────────────────────────┐
│   Timer callback                    │
│   - setIsSaving(true)               │
│   - Call onSave(resume)             │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│   API Call                          │
│   - PUT /api/resume/:id             │
│   - Include metadata                │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│   Response Handler                  │
│   - setIsSaving(false)              │
│   - Show toast                      │
└─────────────────────────────────────┘
    ↓
Toast: "Resume auto-saved"
```

## Component Communication

```
┌──────────────────────────────────────────────────────────┐
│                   EnhancedResumeEditor                    │
│                                                            │
│   state (from useUndoRedo)                                │
│        ↓           ↓            ↓           ↓            │
│   ┌────────┐  ┌────────┐  ┌─────────┐  ┌─────────┐     │
│   │Sidebar │  │ Score  │  │Template │  │ Preview │     │
│   │        │  │Dashboard  │Switcher │  │         │     │
│   └────────┘  └────────┘  └─────────┘  └─────────┘     │
│        ↓                        ↓                         │
│   onUpdate                 onTemplateChange              │
│        ↓                        ↓                         │
│   ┌──────────────────────────────────────────┐          │
│   │          setState (useUndoRedo)           │          │
│   └──────────────────────────────────────────┘          │
│                        ↓                                  │
│              Updated Resume State                         │
│                        ↓                                  │
│              All Components Re-render                     │
└──────────────────────────────────────────────────────────┘
```

## File Dependencies

```
EnhancedResumeEditor.tsx
├── useUndoRedo.ts
├── ResumeBuilderSidebar.tsx
│   ├── @dnd-kit/core
│   ├── @dnd-kit/sortable
│   ├── @dnd-kit/utilities
│   ├── react-hot-toast
│   └── All section components
├── ResumeScoreDashboard.tsx
│   └── resume.ts (types)
├── TemplateSwitcher.tsx
│   └── resume.ts (types)
├── ResumePreview.tsx
└── FloatingActions.tsx
    └── resume.ts (types)
```

## Type Safety Flow

```
TypeScript Types (resume.ts)
    ↓
┌─────────────────────────────────────┐
│   Component Props Interfaces        │
│   - Strong typing                   │
│   - Auto-completion                 │
│   - Compile-time checks             │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│   Runtime Type Safety               │
│   - Type guards                     │
│   - Validation                      │
│   - Error prevention                │
└─────────────────────────────────────┘
    ↓
Production Build
```

## Performance Optimizations

```
Component Renders
    ↓
┌─────────────────────────────────────┐
│   React.memo (where applicable)     │
│   - Prevent unnecessary renders     │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│   useMemo for Calculations          │
│   - Score calculations              │
│   - Section filtering               │
│   - Template options                │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│   useCallback for Handlers          │
│   - Event handlers                  │
│   - Callback functions              │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│   Debounced Operations              │
│   - Undo/redo: 300ms                │
│   - Auto-save: 3000ms               │
└─────────────────────────────────────┘
    ↓
Optimized Performance
```

## Error Handling

```
User Action / API Call
    ↓
┌─────────────────────────────────────┐
│   try-catch Blocks                  │
│   - Wrap async operations           │
│   - Catch errors                    │
└─────────────────────────────────────┘
    ↓
Error Occurs?
    ↓ Yes
┌─────────────────────────────────────┐
│   Error Handler                     │
│   - Log to console                  │
│   - Show toast notification         │
│   - Revert UI state                 │
└─────────────────────────────────────┘
    ↓
Toast: "Error message"
```

## Accessibility Features

```
Component Render
    ↓
┌─────────────────────────────────────┐
│   ARIA Attributes                   │
│   - aria-label                      │
│   - aria-describedby                │
│   - role                            │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│   Keyboard Navigation               │
│   - Tab order                       │
│   - Focus management                │
│   - Keyboard shortcuts              │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│   Screen Reader Support             │
│   - Descriptive labels              │
│   - Status announcements            │
│   - Alt text                        │
└─────────────────────────────────────┘
    ↓
Accessible Experience
```

---

**Architecture Version:** 1.0.0
**Last Updated:** 2025-10-03
**Status:** Production-Ready

# Advanced Resume Builder Features

This document provides a comprehensive overview of the enhanced resume builder features implemented in the EduLen platform.

## Overview

The resume builder has been significantly enhanced with professional features including drag-and-drop section reordering, visibility toggles, undo/redo functionality, real-time scoring, template switching, and more.

## Features Implemented

### 1. Drag-and-Drop Section Reordering

**Location:** `src/components/dashboard/resume/ResumeBuilderSidebar.tsx`

Allows users to reorder resume sections by dragging and dropping them.

**Key Features:**
- Visual drag handle on each section
- Smooth animations during drag
- Ghost element preview while dragging
- Touch support for mobile devices
- Auto-save section order to resume metadata
- Keyboard navigation support

**Usage:**
```tsx
// Section order is automatically saved to resume.metadata.sectionConfigs
// Users can drag the grip icon to reorder sections
```

**Technical Implementation:**
- Uses `@dnd-kit/core` and `@dnd-kit/sortable`
- State managed via `useState` with immediate UI updates
- Persisted to database via `onUpdate` callback
- Sensor configuration for 8px activation constraint

---

### 2. Section Visibility Toggles

**Location:** `src/components/dashboard/resume/ResumeBuilderSidebar.tsx`

Toggle visibility of resume sections without deleting data.

**Key Features:**
- Eye icon on each section for show/hide
- Hidden sections appear grayed out in sidebar
- Hidden sections don't render in preview
- Warning for required sections (Personal Info)
- "Show All" and "Hide Optional" bulk actions
- Visual indicators for hidden state

**Usage:**
```tsx
// Required sections cannot be hidden
// Optional sections can be toggled via eye icon
// Bulk toggle buttons in header
```

**Section States:**
- **Visible**: Section appears in resume and preview
- **Hidden**: Section grayed out, data preserved, not in preview
- **Required**: Cannot be hidden (Personal Information)

---

### 3. Undo/Redo Functionality

**Location:** `src/hooks/useUndoRedo.ts`

Time-travel state management with keyboard shortcuts.

**Key Features:**
- Tracks last 50 changes
- Keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)
- Visual undo/redo buttons in floating actions
- 300ms debounce to group rapid changes
- Clears future on new changes
- Disabled state when no history

**Usage:**
```tsx
const { state, setState, undo, redo, canUndo, canRedo } = useUndoRedo(initialResume);

// Automatic keyboard shortcuts
// Ctrl+Z: Undo
// Ctrl+Shift+Z or Ctrl+Y: Redo
```

**Implementation Details:**
- Generic hook works with any state type
- Maintains past, present, and future arrays
- Debounced state updates for performance
- Automatic cleanup on unmount

---

### 4. Real-Time Resume Scoring

**Location:** `src/components/dashboard/resume/ResumeScoreDashboard.tsx`

Live analysis and scoring as users type.

**Key Metrics:**

1. **Completeness Score (25% weight)**
   - Personal info completeness
   - Professional summary length
   - Number of experience entries
   - Education entries
   - Skills count
   - Projects/certifications

2. **ATS Optimization Score (30% weight)**
   - Email presence
   - Experience entries
   - Education entries
   - Skills count (minimum 5)
   - Proper date formatting
   - Achievement keywords

3. **Impact Score (25% weight)**
   - Quantifiable achievements (numbers, percentages)
   - Action verbs usage
   - Project showcasing

4. **Length Score (20% weight)**
   - Ideal word count: 400-800 words
   - Too short or too long penalties

**Score Thresholds:**
- **Excellent**: 85-100 (Green)
- **Good**: 70-84 (Blue)
- **Needs Improvement**: 50-69 (Yellow)
- **Critical**: 0-49 (Red)

**Usage:**
```tsx
<ResumeScoreDashboard resume={resume} />
```

**Features:**
- Collapsible panel
- Visual progress bars
- Color-coded indicators
- Quick tips section
- Section-specific suggestions
- Real-time updates

---

### 5. Template Switcher

**Location:** `src/components/dashboard/resume/TemplateSwitcher.tsx`

Quick template switching without data loss.

**Available Templates:**

| Template | Description | ATS Score | Features |
|----------|-------------|-----------|----------|
| Modern | Clean contemporary design | 85% | Two-column, icons, color accents |
| Classic | Traditional professional | 95% | Single column, traditional fonts |
| ATS-Friendly | Optimized for ATS | 98% | Plain text, no graphics |
| Creative | Bold artistic design | 70% | Unique layout, custom graphics |
| Minimalist | Simple and elegant | 90% | Minimal design, whitespace |
| Professional | Sophisticated executive style | 92% | Premium look, leadership focused |

**Usage:**
```tsx
<TemplateSwitcher
  currentTemplate={resume.template}
  onTemplateChange={handleTemplateChange}
/>
```

**Features:**
- Popover with mini previews
- ATS score displayed for each template
- Feature tags
- Color scheme preview
- Premium badge for premium templates
- Instant preview update

---

### 6. Enhanced Floating Actions

**Location:** `src/components/dashboard/resume/FloatingActions.tsx`

Updated floating action buttons with undo/redo.

**Buttons:**
1. **Undo** (Orange) - Ctrl+Z
2. **Redo** (Teal) - Ctrl+Shift+Z
3. **Toggle Preview** (Blue) - Show/hide preview
4. **Export** (Purple) - Ctrl+P to export
5. **Save** (Green) - Manual save with auto-save indicator

**Features:**
- Disabled state for undo/redo when unavailable
- Keyboard shortcut hints in tooltips
- Animated ripple effect on save
- Color-coded for quick recognition
- Smooth spring animations

---

### 7. Enhanced Resume Types

**Location:** `src/types/resume.ts`

Updated type definitions for new features.

**New Interfaces:**

```typescript
interface SectionConfig {
  id: string;
  visible: boolean;
  order: number;
}

interface ResumeMetadata {
  // ... existing fields
  sectionOrder?: string[];
  sectionVisibility?: Record<string, boolean>;
  sectionConfigs?: SectionConfig[];
}
```

---

### 8. Integration Example

**Location:** `src/components/dashboard/resume/EnhancedResumeEditor.tsx`

Complete example integrating all features.

**Features:**
- Undo/redo state management
- Auto-save every 3 seconds
- Keyboard shortcuts
- Toast notifications
- Real-time scoring
- Template switching
- Section management

**Usage:**
```tsx
<EnhancedResumeEditor
  initialResume={resume}
  onSave={async (resume) => {
    // Save to database
    await updateResume(resume);
  }}
/>
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo last change |
| Ctrl+Shift+Z | Redo change |
| Ctrl+Y | Redo change (alternative) |
| Ctrl+S | Save resume |
| Ctrl+P | Export as PDF |

---

## State Management

### Undo/Redo State Flow

```
Past States → Present State → Future States
     ↑              ↓               ↑
    Undo        New Change        Redo
```

### Section Configuration Persistence

```typescript
// Saved to resume.metadata.sectionConfigs
[
  { id: 'personalInfo', visible: true, order: 0 },
  { id: 'summary', visible: true, order: 1 },
  { id: 'experience', visible: true, order: 2 },
  // ... etc
]
```

---

## Performance Optimizations

1. **Debounced State Updates**: 300ms debounce on undo/redo to group rapid changes
2. **Auto-save Throttling**: 3-second delay before auto-save
3. **Memoized Calculations**: Score calculations use `useMemo`
4. **Lazy Component Rendering**: Hidden sections don't render content
5. **Optimistic UI Updates**: Immediate visual feedback before save

---

## Accessibility

- **ARIA Labels**: All interactive elements properly labeled
- **Keyboard Navigation**: Full keyboard support for all features
- **Screen Reader Support**: Descriptive tooltips and labels
- **Focus Management**: Proper focus trapping in modals
- **High Contrast**: Color indicators supplemented with icons
- **Touch Support**: Drag-and-drop works on touch devices

---

## Mobile Responsiveness

- **Touch Gestures**: Drag-and-drop supports touch
- **Responsive Layout**: Adapts to mobile screens
- **Simplified UI**: Mobile-optimized button sizes
- **Collapsible Panels**: Score dashboard collapses on mobile
- **Touch-friendly Buttons**: 44px minimum touch targets

---

## Future Enhancements (Nice to Have)

1. **Smart Suggestions Panel**
   - AI-powered content suggestions
   - Spelling/grammar checking
   - Keyword optimization
   - Length recommendations

2. **LinkedIn Import**
   - Parse LinkedIn PDF export
   - Extract experience, education, skills
   - Preview before import
   - Merge or replace options

3. **Keyboard Shortcuts Help Modal**
   - Comprehensive shortcut list
   - Visual hints on first use
   - Searchable shortcuts

4. **Multi-Resume Management**
   - Save As feature
   - Version history
   - Resume comparison
   - Quick switching

5. **Enhanced Export Options**
   - DOCX, JSON, HTML, Plain Text
   - Custom filename
   - QR code with portfolio link
   - ATS optimization toggle
   - Email resume option

6. **Cover Letter Builder**
   - Integrated editor
   - Use resume data for auto-fill
   - Templates matching resume style
   - AI writing assistance

---

## Dependencies Added

```json
{
  "@dnd-kit/core": "^6.3.1",
  "@dnd-kit/sortable": "^10.0.0",
  "@dnd-kit/utilities": "^3.2.2",
  "react-hot-toast": "^2.6.0"
}
```

---

## Files Created/Modified

### New Files
- `src/hooks/useUndoRedo.ts`
- `src/components/dashboard/resume/ResumeScoreDashboard.tsx`
- `src/components/dashboard/resume/TemplateSwitcher.tsx`
- `src/components/dashboard/resume/EnhancedResumeEditor.tsx`

### Modified Files
- `src/types/resume.ts` (Added SectionConfig interface)
- `src/components/dashboard/resume/ResumeBuilderSidebar.tsx` (Complete rewrite)
- `src/components/dashboard/resume/FloatingActions.tsx` (Added undo/redo)

---

## Testing Recommendations

1. **Drag and Drop**
   - Test reordering sections
   - Verify persistence after reload
   - Test keyboard navigation
   - Test on touch devices

2. **Undo/Redo**
   - Make multiple changes
   - Test undo/redo sequence
   - Verify keyboard shortcuts
   - Test history limit (50 items)

3. **Section Visibility**
   - Hide/show sections
   - Test required section protection
   - Verify preview updates
   - Test bulk toggle actions

4. **Scoring**
   - Add/remove content
   - Verify real-time updates
   - Check suggestion accuracy
   - Test score thresholds

5. **Template Switching**
   - Switch between templates
   - Verify data preservation
   - Check preview updates
   - Test all template options

---

## Troubleshooting

### Issue: Drag and drop not working
**Solution:** Ensure sensors are properly configured and activation constraint is met (8px distance)

### Issue: Undo/redo not updating UI
**Solution:** Check that setState is called with updated state, not mutated state

### Issue: Scores not updating
**Solution:** Verify useMemo dependencies include the resume object

### Issue: Toast notifications not showing
**Solution:** Ensure Toaster component is rendered in the app root

### Issue: Section order not persisting
**Solution:** Check that metadata.sectionConfigs is being saved to database

---

## Contributing

When adding new features:
1. Follow existing TypeScript patterns
2. Add proper error handling
3. Include loading states
4. Implement keyboard shortcuts
5. Add accessibility attributes
6. Document in this file

---

## Support

For issues or questions:
- Check this documentation first
- Review component source code
- Test with console.log debugging
- Check browser console for errors

---

**Last Updated:** 2025-10-03
**Version:** 1.0.0

---

# NEW ADVANCED FEATURES (Latest Update)

## Recently Added Professional Features

### 1. Keyboard Shortcuts System

**Files:**
- `src/hooks/useKeyboardShortcuts.ts`
- `src/components/dashboard/resume/KeyboardShortcuts.tsx`

**Features:**
- Platform detection (Mac/Windows)
- Searchable help modal
- Visual keyboard key components
- Categories: General, Editing, Navigation, AI
- First-time user hints
- Conflict prevention with browser shortcuts

**Shortcuts:**
```
General:
  Ctrl/Cmd + S  → Save
  Ctrl/Cmd + P  → Export
  Ctrl/Cmd + /  → Show shortcuts
  ?             → Show shortcuts
  Esc           → Close dialogs

Editing:
  Ctrl/Cmd + Z       → Undo
  Ctrl/Cmd + Shift + Z → Redo
  Ctrl/Cmd + Y       → Redo

AI (Optional):
  Ctrl/Cmd + K      → Focus AI chat
  Ctrl/Cmd + Space  → Get suggestion
  Ctrl/Cmd + Enter  → Send message
```

---

### 2. Smart Suggestions Panel

**File:** `src/components/dashboard/resume/SmartSuggestions.tsx`

**Features:**
- AI-powered recommendations
- Priority-based (Critical, High, Medium, Low)
- Collapsible sections
- Apply or dismiss suggestions
- Navigate to specific sections
- Real-time scanning

**Suggestion Types:**
- Content (missing sections, weak content)
- Formatting (structure issues)
- Keywords (ATS optimization)
- Grammar (spelling/grammar)
- Impact (weak verbs, missing metrics)
- Structure (organization)

---

### 3. LinkedIn Import

**Files:**
- `src/components/dashboard/resume/LinkedInImport.tsx`
- `src/lib/linkedin-parser.ts`

**Features:**
- Drag-and-drop PDF upload
- PDF parsing with progress indicator
- Data preview before import
- Merge or replace modes
- Extracts: experience, education, skills, certifications

**How to use:**
1. Export LinkedIn profile as PDF
2. Drag PDF into import dialog
3. Review parsed data
4. Choose merge or replace
5. Import to resume

---

### 4. Cover Letter Builder

**Files:**
- `src/components/dashboard/resume/CoverLetterBuilder.tsx`
- `src/types/cover-letter.ts`

**Features:**
- Side-by-side editor and preview
- Template library (greetings, openings, closings)
- Auto-fill from resume data
- AI generation
- Live preview
- Copy to clipboard

**Templates:**
- 5+ greeting templates
- 3 opening paragraph templates
- 3 closing paragraph templates  
- 5 signature styles

---

### 5. Version History

**Files:**
- `src/components/dashboard/resume/VersionHistory.tsx`
- `src/store/resumeStore.ts`

**Features:**
- Auto-save versions (max 20)
- Manual version saving with labels
- Restore previous versions
- Compare versions
- Version metadata (timestamp, template, counts)
- Delete unwanted versions

---

### 6. Enhanced Export Dialog

**File:** `src/components/dashboard/resume/ExportDialog.tsx` (updated)

**New Features:**
- Include cover letter option
- Export formats:
  - Single PDF (2 pages)
  - Separate files
  - ZIP archive
- Format lock when including cover letter
- Visual export mode selection

---

### 7. Spell Checker

**File:** `src/components/dashboard/resume/SpellChecker.tsx`

**Features:**
- Real-time spell checking
- Correction suggestions
- Ignore option
- Visual error indicators
- Debounced checking
- Hook and component versions

**Usage:**
```tsx
// As hook
const { errors, hasErrors } = useSpellCheck(text);

// As component
<InlineSpellCheck value={text} onChange={setText} />
```

---

### 8. State Management (Zustand)

**File:** `src/store/resumeStore.ts`

**Features:**
- Centralized resume state
- Version management
- Suggestions storage
- UI state (modals, panels)
- localStorage persistence
- Redux DevTools integration

**Usage:**
```tsx
const resume = useResumeStore(state => state.currentResume);
const setResume = useResumeStore(state => state.setResume);
useResumeStore.getState().saveVersion('Manual save');
```

---

### 9. Advanced Resume Builder (Integration)

**File:** `src/components/dashboard/resume/AdvancedResumeBuilder.tsx`

**Integrates all features:**
- Keyboard shortcuts
- Smart suggestions panel
- LinkedIn import
- Cover letter builder
- Version history
- Enhanced export
- Resizable panels
- Confetti celebrations

**Usage:**
```tsx
<AdvancedResumeBuilder
  initialResume={resume}
  onSave={async (resume) => await saveResume(resume)}
/>
```

---

## New Dependencies

```json
{
  "zustand": "^5.0.8",
  "pdf-parse": "^2.1.6", 
  "canvas-confetti": "^1.9.3",
  "@types/pdf-parse": "^1.1.5"
}
```

---

## Installation

```bash
bun add zustand pdf-parse canvas-confetti @types/pdf-parse -d
```

---

## File Structure

```
src/
├── components/dashboard/resume/
│   ├── KeyboardShortcuts.tsx          # NEW
│   ├── SmartSuggestions.tsx           # NEW
│   ├── LinkedInImport.tsx             # NEW
│   ├── CoverLetterBuilder.tsx         # NEW
│   ├── VersionHistory.tsx             # NEW
│   ├── SpellChecker.tsx               # NEW
│   ├── AdvancedResumeBuilder.tsx      # NEW
│   ├── ExportDialog.tsx               # UPDATED
│   └── ... (existing files)
├── hooks/
│   ├── useKeyboardShortcuts.ts        # NEW
│   └── ... (existing hooks)
├── lib/
│   ├── linkedin-parser.ts             # NEW
│   └── ... (existing lib)
├── store/
│   └── resumeStore.ts                 # NEW
└── types/
    ├── cover-letter.ts                # NEW
    └── ... (existing types)
```

---

## API Endpoints Needed

### 1. LinkedIn Parser
```
POST /api/resume/parse-linkedin
Body: FormData with PDF file
Response: { experience, education, skills, certifications, summary }
```

### 2. AI Suggestions
```
POST /api/resume/analyze
Body: { resumeId, jobDescription? }
Response: { suggestions: Suggestion[], score: number }
```

### 3. Cover Letter Generation
```
POST /api/resume/generate-cover-letter
Body: { resumeId, companyName, jobTitle, jobDescription? }
Response: { coverLetter: CoverLetter, suggestions: string[] }
```

### 4. Enhanced Export
```
POST /api/resume/export
Body: {
  resumeId,
  format: 'pdf' | 'docx',
  includeCoverLetter?: boolean,
  coverLetterId?: string,
  exportAs?: 'single' | 'separate' | 'zip'
}
Response: { url: string, fileName: string }
```

---

## Testing Checklist

- [ ] Keyboard shortcuts work on Mac and Windows
- [ ] Suggestions panel shows and updates
- [ ] LinkedIn PDF imports successfully
- [ ] Cover letter generates and exports
- [ ] Version history saves and restores
- [ ] Export includes cover letter options
- [ ] Spell checker finds errors
- [ ] All features work together
- [ ] Mobile responsive
- [ ] Accessibility compliance

---

## Performance Notes

- Keyboard shortcuts: No performance impact
- Suggestions: Debounced every 500ms
- PDF parsing: Shows progress, runs async
- Cover letter: Real-time preview optimized
- Versions: Limited to 20, localStorage cached
- Export: Background processing
- Spell check: Debounced 500ms

---

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile: iOS Safari 14+, Chrome Mobile

---

**Last Updated:** 2025-10-03  
**Latest Version:** 2.0.0 (Advanced Features Release)

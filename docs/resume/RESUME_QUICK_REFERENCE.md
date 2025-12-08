# Resume Builder Quick Reference Card

## Quick Import Guide

```tsx
// Main integration
import { EnhancedResumeEditor } from '@/components/dashboard/resume/EnhancedResumeEditor';

// Individual components
import { ResumeScoreDashboard } from '@/components/dashboard/resume/ResumeScoreDashboard';
import { TemplateSwitcher } from '@/components/dashboard/resume/TemplateSwitcher';
import { ResumeBuilderSidebar } from '@/components/dashboard/resume/ResumeBuilderSidebar';
import { FloatingActions } from '@/components/dashboard/resume/FloatingActions';

// Hooks
import { useUndoRedo } from '@/hooks/useUndoRedo';

// Types
import { Resume, ResumeTemplate, SectionConfig } from '@/types/resume';

// Toast notifications
import toast, { Toaster } from 'react-hot-toast';
```

## Component Props Quick Reference

### EnhancedResumeEditor
```tsx
<EnhancedResumeEditor
  initialResume={resume}         // Resume object
  onSave={(resume) => {}}        // Save callback
  className=""                    // Optional styling
/>
```

### ResumeScoreDashboard
```tsx
<ResumeScoreDashboard
  resume={resume}                // Resume object
  className=""                    // Optional styling
/>
```

### TemplateSwitcher
```tsx
<TemplateSwitcher
  currentTemplate={resume.template}
  onTemplateChange={(template) => {}}
  className=""
/>
```

### ResumeBuilderSidebar
```tsx
<ResumeBuilderSidebar
  resume={resume}
  onUpdate={(updates) => {}}
  currentSection="personalInfo"
  onSectionChange={(section) => {}}
/>
```

### FloatingActions
```tsx
<FloatingActions
  onTogglePreview={() => {}}
  onExport={() => {}}
  onSave={() => {}}
  onUndo={() => {}}              // Optional
  onRedo={() => {}}              // Optional
  isSaving={false}
  showPreview={true}
  canUndo={false}                // Optional
  canRedo={false}                // Optional
/>
```

### useUndoRedo Hook
```tsx
const {
  state,        // Current state
  setState,     // Update state
  undo,         // Undo function
  redo,         // Redo function
  canUndo,      // Boolean
  canRedo,      // Boolean
  reset,        // Reset history
  history,      // { pastLength, futureLength }
} = useUndoRedo<Resume>(initialResume);
```

## Keyboard Shortcuts

| Shortcut | Action | Component |
|----------|--------|-----------|
| `Ctrl+Z` | Undo | useUndoRedo |
| `Ctrl+Shift+Z` | Redo | useUndoRedo |
| `Ctrl+Y` | Redo (alt) | useUndoRedo |
| `Ctrl+S` | Save | EnhancedEditor |
| `Ctrl+P` | Export | EnhancedEditor |

## Score Thresholds

| Range | Status | Color |
|-------|--------|-------|
| 85-100 | Excellent | Green |
| 70-84 | Good | Blue |
| 50-69 | Needs Improvement | Yellow |
| 0-49 | Critical | Red |

## Score Weights

| Metric | Weight |
|--------|--------|
| Completeness | 25% |
| ATS Optimization | 30% |
| Impact | 25% |
| Length | 20% |

## Templates

| Template | ATS Score | Best For |
|----------|-----------|----------|
| Modern | 85% | Tech/Creative |
| Classic | 95% | Traditional |
| ATS-Friendly | 98% | Job Boards |
| Creative | 70% | Design/Arts |
| Minimalist | 90% | Clean Look |
| Professional | 92% | Executive |

## Section IDs

```tsx
'personalInfo'    // Required
'summary'
'experience'
'education'
'skills'
'projects'
'certifications'
'languages'
'custom'
```

## Common Patterns

### Basic Setup
```tsx
function MyEditor() {
  const { state: resume, setState, undo, redo, canUndo, canRedo }
    = useUndoRedo<Resume>(initialResume);

  const handleUpdate = (updates: Partial<Resume>) => {
    setState(prev => ({ ...prev, ...updates, updatedAt: new Date() }));
  };

  return <EnhancedResumeEditor initialResume={resume} onSave={saveToAPI} />;
}
```

### Auto-Save
```tsx
useEffect(() => {
  const timer = setTimeout(async () => {
    await saveResume(resume);
  }, 3000);
  return () => clearTimeout(timer);
}, [resume]);
```

### Template Change
```tsx
const handleTemplateChange = (template: ResumeTemplate) => {
  handleUpdate({ template });
  toast.success(`Template changed to ${template}`);
};
```

### Section Visibility
```tsx
const toggleSection = (sectionId: string) => {
  const configs = resume.metadata?.sectionConfigs?.map(s =>
    s.id === sectionId ? { ...s, visible: !s.visible } : s
  );
  handleUpdate({ metadata: { ...resume.metadata, sectionConfigs: configs }});
};
```

## Toast Notifications

```tsx
// Success
toast.success('Message');

// Error
toast.error('Error message');

// Custom duration
toast.success('Message', { duration: 2000 });

// Custom position
toast('Message', { position: 'bottom-left' });
```

## Type Definitions

### Resume
```tsx
interface Resume {
  id?: string;
  userId: string;
  title: string;
  personalInfo: PersonalInfo;
  summary?: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  projects?: Project[];
  certifications?: Certification[];
  template: ResumeTemplate;
  metadata?: ResumeMetadata;
  createdAt: Date;
  updatedAt: Date;
}
```

### SectionConfig
```tsx
interface SectionConfig {
  id: string;
  visible: boolean;
  order: number;
}
```

### ResumeMetadata
```tsx
interface ResumeMetadata {
  version: number;
  isPublic: boolean;
  sectionConfigs?: SectionConfig[];
  // ... other fields
}
```

## API Endpoints

```tsx
// Save resume
PUT /api/resume/:id
Body: Resume

// Get resume
GET /api/resume/:id
Response: Resume

// Create resume
POST /api/resume
Body: Partial<Resume>

// Delete resume
DELETE /api/resume/:id
```

## Common Issues & Fixes

### Drag not working
```tsx
// Ensure proper sensor configuration
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 }
  })
);
```

### Undo not working
```tsx
// Use setState from useUndoRedo
const { setState } = useUndoRedo(initial);
setState(newState); // ✓ Correct
setResume(newState); // ✗ Wrong
```

### Scores not updating
```tsx
// Wrap in useMemo with correct deps
const scores = useMemo(
  () => calculateScores(resume),
  [resume] // Must include resume
);
```

### Toast not showing
```tsx
// Add Toaster to component tree
<Toaster position="bottom-right" />
```

## Performance Tips

```tsx
// 1. Memoize expensive calculations
const score = useMemo(() => calc(resume), [resume]);

// 2. Use useCallback for handlers
const handleUpdate = useCallback((updates) => {
  setState(prev => ({ ...prev, ...updates }));
}, [setState]);

// 3. Debounce rapid updates
const debouncedSave = useMemo(
  () => debounce(saveResume, 3000),
  []
);
```

## File Locations

```
Components:
  src/components/dashboard/resume/
    ├── EnhancedResumeEditor.tsx
    ├── ResumeScoreDashboard.tsx
    ├── TemplateSwitcher.tsx
    ├── ResumeBuilderSidebar.tsx
    └── FloatingActions.tsx

Hooks:
  src/hooks/useUndoRedo.ts

Types:
  src/types/resume.ts

Docs:
  ├── RESUME_BUILDER_FEATURES.md
  ├── RESUME_INTEGRATION_GUIDE.md
  ├── RESUME_BUILDER_SUMMARY.md
  ├── RESUME_ARCHITECTURE.md
  └── RESUME_QUICK_REFERENCE.md
```

## Testing Commands

```bash
# Run dev server
npm run dev

# Build
npm run build

# Lint
npm run lint
```

## Dependencies

```json
{
  "@dnd-kit/core": "^6.3.1",
  "@dnd-kit/sortable": "^10.0.0",
  "@dnd-kit/utilities": "^3.2.2",
  "react-hot-toast": "^2.6.0"
}
```

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers
- ❌ IE11

## Accessibility Checklist

- [x] ARIA labels
- [x] Keyboard navigation
- [x] Screen reader support
- [x] Focus management
- [x] Color indicators with icons
- [x] Touch-friendly (44px min)

## Next Steps

1. Import EnhancedResumeEditor
2. Set up onSave callback
3. Add Toaster component
4. Test all features
5. Customize styling
6. Deploy

---

**Print this for quick reference!** 📄

**Need help?** Check the full documentation:
- Features: `RESUME_BUILDER_FEATURES.md`
- Integration: `RESUME_INTEGRATION_GUIDE.md`
- Architecture: `RESUME_ARCHITECTURE.md`

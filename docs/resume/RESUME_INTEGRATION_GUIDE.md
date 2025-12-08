# Resume Builder Integration Guide

Quick guide to integrate the enhanced resume builder features into your application.

## Quick Start

### 1. Basic Integration

```tsx
// app/dashboard/document-builder/resume/editor/page.tsx
'use client';

import { EnhancedResumeEditor } from '@/components/dashboard/resume/EnhancedResumeEditor';
import { Resume } from '@/types/resume';

export default function ResumeEditorPage() {
  // Fetch or create initial resume
  const initialResume: Resume = {
    // ... your resume data
  };

  const handleSave = async (resume: Resume) => {
    // Save to your backend
    const response = await fetch('/api/resume', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resume),
    });

    if (!response.ok) {
      throw new Error('Failed to save resume');
    }
  };

  return (
    <EnhancedResumeEditor
      initialResume={initialResume}
      onSave={handleSave}
    />
  );
}
```

### 2. Individual Component Usage

If you prefer to use components separately:

```tsx
'use client';

import { useState } from 'react';
import { Resume, ResumeTemplate } from '@/types/resume';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { ResumeBuilderSidebar } from '@/components/dashboard/resume/ResumeBuilderSidebar';
import { ResumeScoreDashboard } from '@/components/dashboard/resume/ResumeScoreDashboard';
import { TemplateSwitcher } from '@/components/dashboard/resume/TemplateSwitcher';
import { FloatingActions } from '@/components/dashboard/resume/FloatingActions';
import toast, { Toaster } from 'react-hot-toast';

export default function CustomResumeEditor() {
  // State management with undo/redo
  const {
    state: resume,
    setState: setResume,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo<Resume>(initialResume);

  const [currentSection, setCurrentSection] = useState('personalInfo');
  const [showPreview, setShowPreview] = useState(true);

  // Update resume
  const handleUpdate = (updates: Partial<Resume>) => {
    setResume((prev) => ({
      ...prev,
      ...updates,
      updatedAt: new Date(),
    }));
  };

  // Change template
  const handleTemplateChange = (template: ResumeTemplate) => {
    handleUpdate({ template });
    toast.success(`Template changed to ${template}`);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b space-y-4">
        <TemplateSwitcher
          currentTemplate={resume.template}
          onTemplateChange={handleTemplateChange}
        />
        <ResumeScoreDashboard resume={resume} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-96 border-r">
          <ResumeBuilderSidebar
            resume={resume}
            onUpdate={handleUpdate}
            currentSection={currentSection}
            onSectionChange={setCurrentSection}
          />
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="flex-1 p-8">
            {/* Your resume preview component */}
          </div>
        )}
      </div>

      {/* Floating actions */}
      <FloatingActions
        onTogglePreview={() => setShowPreview(!showPreview)}
        onExport={() => {/* export logic */}}
        onSave={() => {/* save logic */}}
        onUndo={undo}
        onRedo={redo}
        isSaving={false}
        showPreview={showPreview}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <Toaster position="bottom-right" />
    </div>
  );
}
```

## Feature-Specific Guides

### Using Undo/Redo Hook

```tsx
import { useUndoRedo } from '@/hooks/useUndoRedo';

function MyComponent() {
  const {
    state,           // Current state
    setState,        // Update state (adds to history)
    undo,           // Undo last change
    redo,           // Redo undone change
    canUndo,        // Boolean: can undo?
    canRedo,        // Boolean: can redo?
    reset,          // Reset history
    history,        // { pastLength, futureLength }
  } = useUndoRedo<YourType>(initialState);

  // Update state
  setState(newState);
  // or
  setState((prev) => ({ ...prev, field: value }));

  // The hook automatically handles Ctrl+Z and Ctrl+Shift+Z
}
```

### Using Resume Score Dashboard

```tsx
import { ResumeScoreDashboard } from '@/components/dashboard/resume/ResumeScoreDashboard';

<ResumeScoreDashboard
  resume={resume}
  className="mb-4" // Optional styling
/>
```

The dashboard automatically calculates:
- Completeness score
- ATS optimization score
- Impact score
- Length score
- Overall score with weighted average

### Using Template Switcher

```tsx
import { TemplateSwitcher } from '@/components/dashboard/resume/TemplateSwitcher';
import { ResumeTemplate } from '@/types/resume';

<TemplateSwitcher
  currentTemplate={resume.template}
  onTemplateChange={(template: ResumeTemplate) => {
    // Update resume template
    handleUpdate({ template });
  }}
/>
```

### Using Drag & Drop Sidebar

```tsx
import { ResumeBuilderSidebar } from '@/components/dashboard/resume/ResumeBuilderSidebar';

<ResumeBuilderSidebar
  resume={resume}
  onUpdate={(updates) => {
    // Handle resume updates
    setResume((prev) => ({ ...prev, ...updates }));
  }}
  currentSection={currentSection}
  onSectionChange={setCurrentSection}
/>
```

Features:
- Drag sections to reorder
- Click eye icon to hide/show sections
- "Show All" and "Hide Optional" buttons
- Section completion indicators
- Required sections cannot be hidden

## Toast Notifications Setup

Add the Toaster component to your layout or page:

```tsx
import { Toaster } from 'react-hot-toast';

export default function Layout() {
  return (
    <>
      {/* Your content */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#363636',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}
```

## Auto-Save Implementation

```tsx
import { useEffect } from 'react';

function ResumeEditor() {
  const [resume, setResume] = useState<Resume>(initialResume);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-save after 3 seconds of inactivity
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        await saveResume(resume);
        toast.success('Auto-saved', { duration: 2000 });
      } catch (error) {
        toast.error('Failed to save');
      } finally {
        setIsSaving(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [resume]);

  return (
    // Your component
  );
}
```

## Keyboard Shortcuts Implementation

The undo/redo hook automatically handles:
- Ctrl+Z: Undo
- Ctrl+Shift+Z: Redo

Add custom shortcuts:

```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Save: Ctrl+S
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }

    // Export: Ctrl+P
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      handleExport();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

## API Integration Example

### Save Resume with Section Configuration

```tsx
async function saveResume(resume: Resume) {
  const response = await fetch(`/api/resume/${resume.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...resume,
      metadata: {
        ...resume.metadata,
        // Section configurations are automatically included
        sectionConfigs: resume.metadata?.sectionConfigs,
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to save resume');
  }

  return response.json();
}
```

### Backend Schema Update

If using MongoDB/Mongoose, update your schema:

```typescript
// models/Resume.ts
const resumeSchema = new Schema({
  // ... existing fields
  metadata: {
    version: Number,
    isPublic: Boolean,
    sectionOrder: [String],
    sectionVisibility: Map,
    sectionConfigs: [{
      id: String,
      visible: Boolean,
      order: Number,
    }],
  },
});
```

## TypeScript Types

Import types for proper type safety:

```tsx
import {
  Resume,
  ResumeTemplate,
  PersonalInfo,
  Experience,
  Education,
  Skill,
  SectionConfig,
} from '@/types/resume';
```

## Styling Customization

All components use Tailwind CSS and support custom className:

```tsx
<ResumeScoreDashboard
  resume={resume}
  className="shadow-lg rounded-xl"
/>

<TemplateSwitcher
  currentTemplate={resume.template}
  onTemplateChange={handleTemplateChange}
  className="w-full md:w-auto"
/>
```

## Error Handling

```tsx
const handleSave = async () => {
  try {
    setIsSaving(true);
    await saveResume(resume);
    toast.success('Resume saved successfully');
  } catch (error) {
    console.error('Save error:', error);
    toast.error(
      error instanceof Error
        ? error.message
        : 'Failed to save resume'
    );
  } finally {
    setIsSaving(false);
  }
};
```

## Performance Tips

1. **Debounce expensive operations**
   ```tsx
   const debouncedSave = useMemo(
     () => debounce(saveResume, 3000),
     []
   );
   ```

2. **Memoize score calculations**
   ```tsx
   const score = useMemo(
     () => calculateScore(resume),
     [resume]
   );
   ```

3. **Lazy load preview**
   ```tsx
   const ResumePreview = lazy(
     () => import('./ResumePreview')
   );
   ```

## Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ResumeScoreDashboard } from './ResumeScoreDashboard';

test('shows correct score', () => {
  const resume = createMockResume();
  render(<ResumeScoreDashboard resume={resume} />);

  expect(screen.getByText(/score/i)).toBeInTheDocument();
});
```

## Troubleshooting

### Drag and drop not working
- Ensure `@dnd-kit` packages are installed
- Check that sensors are configured correctly
- Verify `id` prop is unique for each item

### Undo/redo not working
- Make sure you're using `setState` from `useUndoRedo`
- Check that keyboard events aren't blocked
- Verify state is not being mutated directly

### Scores not updating
- Check `useMemo` dependencies
- Ensure resume object reference changes
- Verify calculation functions are pure

## Next Steps

1. Implement your resume preview component
2. Set up backend API endpoints
3. Add export functionality
4. Customize templates
5. Add AI suggestions panel (optional)

## Support

For questions or issues:
- Review component source code
- Check browser console for errors
- Verify all dependencies are installed
- Test with mock data first

---

**Happy Building!** 🚀

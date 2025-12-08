'use client';

import { useState, useEffect, useCallback } from 'react';
import { Resume, ResumeTemplate } from '@/types/resume';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { ResumeBuilderSidebar } from './ResumeBuilderSidebar';
import { ResumePreview } from './ResumePreview';
import { FloatingActions } from './FloatingActions';
import { ResumeScoreDashboard } from './ResumeScoreDashboard';
import { TemplateSwitcher } from './TemplateSwitcher';
import { ExportDialog } from './ExportDialog';
import toast, { Toaster } from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface EnhancedResumeEditorProps {
  initialResume: Resume;
  onSave?: (resume: Resume) => Promise<void>;
  className?: string;
}

export function EnhancedResumeEditor({
  initialResume,
  onSave,
  className,
}: EnhancedResumeEditorProps) {
  // Use undo/redo hook for state management
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
  const [isSaving, setIsSaving] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveTimer = setTimeout(async () => {
      if (onSave) {
        setIsSaving(true);
        try {
          await onSave(resume);
          toast.success('Resume auto-saved', {
            duration: 2000,
            position: 'bottom-left',
          });
        } catch (error) {
          toast.error('Failed to save resume');
        } finally {
          setIsSaving(false);
        }
      }
    }, 3000);

    return () => clearTimeout(autoSaveTimer);
  }, [resume, onSave]);

  // Handle resume updates
  const handleUpdate = useCallback(
    (updates: Partial<Resume>) => {
      setResume((prev) => ({
        ...prev,
        ...updates,
        updatedAt: new Date(),
      }));
    },
    [setResume]
  );

  // Handle template change
  const handleTemplateChange = useCallback(
    (template: ResumeTemplate) => {
      handleUpdate({ template });
      toast.success(`Template changed to ${template}`, {
        duration: 2000,
        position: 'bottom-left',
      });
    },
    [handleUpdate]
  );

  // Handle manual save
  const handleSave = async () => {
    if (onSave) {
      setIsSaving(true);
      try {
        await onSave(resume);
        toast.success('Resume saved successfully');
      } catch (error) {
        toast.error('Failed to save resume');
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Handle export
  const handleExport = () => {
    setShowExportDialog(true);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Ctrl+P to export
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handleExport();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resume]);

  return (
    <>
      <div className={cn('flex flex-col h-screen bg-gray-50', className)}>
        {/* Header with Template Switcher and Score Dashboard */}
        <div className="border-b bg-white shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Resume Builder</h1>
              <p className="text-sm text-gray-600">
                Create your professional resume with AI assistance
              </p>
            </div>
            <TemplateSwitcher
              currentTemplate={resume.template}
              onTemplateChange={handleTemplateChange}
            />
          </div>

          {/* Real-time Score Dashboard */}
          <ResumeScoreDashboard resume={resume} />
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar with Sections */}
          <div className="w-96 border-r bg-white overflow-y-auto">
            <ResumeBuilderSidebar
              resume={resume}
              onUpdate={handleUpdate}
              currentSection={currentSection}
              onSectionChange={setCurrentSection}
            />
          </div>

          {/* Preview Area */}
          {showPreview && (
            <div className="flex-1 overflow-y-auto p-8 bg-gray-100">
              <div className="max-w-4xl mx-auto">
                <ResumePreview resume={resume} />
              </div>
            </div>
          )}

          {/* Editor takes full width when preview is hidden */}
          {!showPreview && (
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
                <p className="text-center text-gray-500">
                  Preview hidden. Click the eye icon to show preview.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Floating Action Buttons */}
        <FloatingActions
          onTogglePreview={() => setShowPreview(!showPreview)}
          onExport={handleExport}
          onSave={handleSave}
          onUndo={undo}
          onRedo={redo}
          isSaving={isSaving}
          showPreview={showPreview}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      </div>

      {/* Export Dialog */}
      {showExportDialog && (
        <ExportDialog
          resume={resume}
          onClose={() => setShowExportDialog(false)}
        />
      )}

      {/* Toast Notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'bg-white',
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
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}

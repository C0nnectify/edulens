'use client';

import { useState, useEffect } from 'react';
import { Resume } from '@/types/resume';
import { CoverLetter } from '@/types/cover-letter';
import { EnhancedResumeEditor } from './EnhancedResumeEditor';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { SmartSuggestions } from './SmartSuggestions';
import { LinkedInImport } from './LinkedInImport';
import { CoverLetterBuilder } from './CoverLetterBuilder';
import { VersionHistory } from './VersionHistory';
import { ExportDialog } from './ExportDialog';
import { Button } from '@/components/ui/button';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable-panels';
import {
  Sparkles,
  History,
  Linkedin,
  FileText,
  Download,
  Keyboard,
} from 'lucide-react';
import { useKeyboardShortcuts, defaultResumeShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useResumeStore } from '@/store/resumeStore';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

interface AdvancedResumeBuilderProps {
  initialResume: Resume;
  onSave?: (resume: Resume) => Promise<void>;
}

/**
 * Advanced Resume Builder with all features integrated
 *
 * Features:
 * - Keyboard shortcuts with help modal
 * - Smart AI suggestions panel
 * - LinkedIn import
 * - Cover letter builder
 * - Version history
 * - Enhanced export with cover letter
 * - Spell checking
 * - Real-time auto-save
 */
export function AdvancedResumeBuilder({
  initialResume,
  onSave,
}: AdvancedResumeBuilderProps) {
  const [resume, setResume] = useState<Resume>(initialResume);
  const [coverLetter, setCoverLetter] = useState<CoverLetter | undefined>();
  const [showCoverLetter, setShowCoverLetter] = useState(false);

  // UI state from store
  const showKeyboardShortcuts = useResumeStore(
    (state) => state.showKeyboardShortcuts
  );
  const toggleKeyboardShortcuts = useResumeStore(
    (state) => state.toggleKeyboardShortcuts
  );

  // Dialog states
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showLinkedInImport, setShowLinkedInImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Initialize store with current resume
  useEffect(() => {
    useResumeStore.getState().setResume(resume);
  }, []);

  // Keyboard shortcuts
  const shortcuts = defaultResumeShortcuts({
    onSave: handleSave,
    onExport: () => setShowExport(true),
    onUndo: () => {}, // Handled by EnhancedResumeEditor
    onRedo: () => {}, // Handled by EnhancedResumeEditor
    onShowShortcuts: toggleKeyboardShortcuts,
    onClose: () => {
      if (showKeyboardShortcuts) toggleKeyboardShortcuts();
      if (showVersionHistory) setShowVersionHistory(false);
      if (showLinkedInImport) setShowLinkedInImport(false);
      if (showExport) setShowExport(false);
    },
  });

  useKeyboardShortcuts({
    shortcuts,
    enabled: true,
  });

  async function handleSave() {
    if (onSave) {
      try {
        await onSave(resume);

        // Save version
        useResumeStore.getState().saveVersion('Auto-save');

        // Celebrate!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        toast.success('Resume saved successfully!');
      } catch (error) {
        toast.error('Failed to save resume');
      }
    }
  }

  function handleLinkedInImport(
    data: Partial<Resume>,
    mode: 'merge' | 'replace'
  ) {
    if (mode === 'replace') {
      setResume((prev) => ({
        ...prev,
        ...data,
        updatedAt: new Date(),
      }));
    } else {
      // Merge logic
      setResume((prev) => ({
        ...prev,
        experience: [
          ...(data.experience || []),
          ...(prev.experience || []),
        ],
        education: [
          ...(data.education || []),
          ...(prev.education || []),
        ],
        skills: [
          ...(data.skills || []),
          ...(prev.skills || []),
        ],
        certifications: [
          ...(data.certifications || []),
          ...(prev.certifications || []),
        ],
        summary: data.summary || prev.summary,
        updatedAt: new Date(),
      }));
    }

    useResumeStore.getState().setResume(resume);
    toast.success('LinkedIn data imported successfully!');
  }

  function handleVersionRestore(versionId: string) {
    const version = useResumeStore
      .getState()
      .versions.find((v) => v.id === versionId);

    if (version) {
      setResume(version.resume);
      useResumeStore.getState().setResume(version.resume);
      toast.success('Version restored successfully!');
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Toolbar */}
      <div className="bg-white border-b shadow-sm p-4">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold">Advanced Resume Builder</h1>
            <p className="text-sm text-muted-foreground">
              Professional resume creation with AI assistance
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowLinkedInImport(true)}
              variant="outline"
              size="sm"
            >
              <Linkedin className="h-4 w-4 mr-2" />
              Import LinkedIn
            </Button>

            <Button
              onClick={() => setShowCoverLetter(!showCoverLetter)}
              variant={showCoverLetter ? 'default' : 'outline'}
              size="sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              Cover Letter
            </Button>

            <Button
              onClick={() => setShowVersionHistory(true)}
              variant="outline"
              size="sm"
            >
              <History className="h-4 w-4 mr-2" />
              History
            </Button>

            <Button
              onClick={toggleKeyboardShortcuts}
              variant="outline"
              size="sm"
            >
              <Keyboard className="h-4 w-4 mr-2" />
              Shortcuts
            </Button>

            <Button onClick={() => setShowExport(true)} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {showCoverLetter ? (
          // Cover Letter View
          <div className="h-full p-6">
            <CoverLetterBuilder
              resume={resume}
              initialLetter={coverLetter}
              onSave={(letter) => {
                setCoverLetter(letter);
                toast.success('Cover letter saved!');
              }}
            />
          </div>
        ) : (
          // Resume Editor with Suggestions Panel
          <ResizablePanelGroup direction="horizontal">
            {/* Main Editor */}
            <ResizablePanel defaultSize={showSuggestions ? 75 : 100}>
              <EnhancedResumeEditor
                initialResume={resume}
                onSave={async (updatedResume) => {
                  setResume(updatedResume);
                  useResumeStore.getState().setResume(updatedResume);
                  if (onSave) {
                    await onSave(updatedResume);
                  }
                }}
              />
            </ResizablePanel>

            {/* Smart Suggestions Panel */}
            {showSuggestions && (
              <>
                <ResizableHandle />
                <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
                  <div className="h-full p-4 bg-gray-50 border-l">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        AI Assistant
                      </h3>
                      <Button
                        onClick={() => setShowSuggestions(false)}
                        variant="ghost"
                        size="sm"
                      >
                        Hide
                      </Button>
                    </div>
                    <SmartSuggestions
                      resume={resume}
                      onApply={(suggestion) => {
                        toast.success('Suggestion applied!');
                      }}
                      onNavigate={(section) => {
                        toast.info(`Navigate to ${section}`);
                      }}
                    />
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        )}
      </div>

      {/* Dialogs */}
      <KeyboardShortcuts
        open={showKeyboardShortcuts}
        onOpenChange={toggleKeyboardShortcuts}
        shortcuts={shortcuts}
        showFirstTimeHint={false}
      />

      <LinkedInImport
        open={showLinkedInImport}
        onOpenChange={setShowLinkedInImport}
        onImport={handleLinkedInImport}
      />

      <VersionHistory
        open={showVersionHistory}
        onOpenChange={setShowVersionHistory}
        onRestore={handleVersionRestore}
      />

      <ExportDialog
        resume={resume}
        coverLetter={coverLetter}
        trigger={null}
        onClose={() => setShowExport(false)}
      />

      {!showSuggestions && (
        <div className="fixed bottom-6 right-6">
          <Button
            onClick={() => setShowSuggestions(true)}
            size="lg"
            className="shadow-lg"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Show AI Assistant
          </Button>
        </div>
      )}
    </div>
  );
}

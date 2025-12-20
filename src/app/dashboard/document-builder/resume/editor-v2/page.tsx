'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import EnhancedResumeBuilderV2 from '@/components/dashboard/resume/EnhancedResumeBuilderV2';
import { Loader2 } from 'lucide-react';
import { resumeApiToUi, resumeUiToApiInput } from '@/lib/resume/mappers';
import { resumeDraftFromStoragePayload, resumeFromDraft, type DraftStoragePayload } from '@/lib/resume/drafts';
import { Resume, ResumeTemplate } from '@/types/resume';

function ResumeEditorContent() {
  const searchParams = useSearchParams();
  const templateParam = searchParams.get('template');
  const resumeIdFromUrl = searchParams.get('id');
  const draftKey = searchParams.get('draftKey');

  const [initialResume, setInitialResume] = useState<Resume | null>(null);
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null);
  const [effectiveResumeId, setEffectiveResumeId] = useState<string | null>(resumeIdFromUrl);

  const initialTemplate = useMemo(() => {
    if (templateParam && (Object.values(ResumeTemplate) as string[]).includes(templateParam)) {
      return templateParam;
    }
    return ResumeTemplate.MODERN;
  }, [templateParam]);

  useEffect(() => {
    setEffectiveResumeId(resumeIdFromUrl);
  }, [resumeIdFromUrl]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setInitialLoadError(null);

        // Priority 1: load existing resume if id is present
        if (effectiveResumeId) {
          const res = await fetch(`/api/resume/${encodeURIComponent(effectiveResumeId)}`, { method: 'GET' });
          const data = await res.json();
          if (!res.ok || !data?.success) {
            throw new Error(data?.error || data?.message || 'Failed to load resume');
          }

          const ui = resumeApiToUi(data.resume);
          if (!cancelled) setInitialResume(ui);
          return;
        }

        // Priority 2: load draft from localStorage
        if (draftKey && typeof window !== 'undefined') {
          const stored = window.localStorage.getItem(draftKey);
          if (stored) {
            const parsed = JSON.parse(stored) as DraftStoragePayload;
            const draft = resumeDraftFromStoragePayload(parsed);
            if (draft) {
              const ui = resumeFromDraft(draft, {
                template: initialTemplate as ResumeTemplate,
              });
              if (!cancelled) setInitialResume(ui);
              return;
            }
          }
        }

        // Otherwise, builder will start from defaults
        if (!cancelled) setInitialResume(null);
      } catch (e: any) {
        if (!cancelled) {
          setInitialLoadError(e?.message || 'Failed to load resume');
          setInitialResume(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [effectiveResumeId, draftKey, initialTemplate]);

  const handleSave = async (resume: Resume) => {
    try {
      const method = effectiveResumeId ? 'PUT' : 'POST';
      const url = effectiveResumeId ? `/api/resume/${effectiveResumeId}` : '/api/resume';

      const payload = resumeUiToApiInput(resume);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        const baseMessage = (data && (data.message || data.error)) || 'Failed to save resume';
        const details = (data && (data.details as any)) || null;
        const detailText =
          Array.isArray(details) && details.length > 0
            ? `: ${details
                .slice(0, 3)
                .map((d: any) => `${d.field || 'field'} ${d.message || ''}`.trim())
                .join('; ')}`
            : '';
        throw new Error(`${baseMessage}${detailText}`);
      }

      console.log('Resume saved:', data);

      // If this was a create, swap the URL to edit-mode with the created id.
      if (!effectiveResumeId) {
        const createdId = data?.data?.id || data?.resume?._id || data?.resume?.id;
        if (createdId) {
          setEffectiveResumeId(String(createdId));
        }
        if (createdId && typeof window !== 'undefined') {
          const next = new URL(window.location.href);
          next.searchParams.set('id', String(createdId));
          next.searchParams.delete('draftKey');
          window.history.replaceState({}, '', next.toString());
        }
      }
    } catch (error) {
      console.error('Save error:', error);
      throw error;
    }
  };

  const handleExport = async () => {
    try {
      const resumeId = effectiveResumeId;
      if (!resumeId) {
        alert('Please save your resume first before exporting');
        return;
      }

      const format: 'pdf' = 'pdf';

      const response = await fetch(`/api/resume/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId, format }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Handle download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const contentDisposition = response.headers.get('Content-Disposition') || '';
      const fileNameMatch = /filename="?([^";]+)"?/i.exec(contentDisposition);
      a.download = fileNameMatch?.[1] || `resume.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden">
      {initialLoadError && (
        <div className="bg-red-50 border-b border-red-200 text-red-700 px-4 py-2 text-sm">
          {initialLoadError}
        </div>
      )}
      <EnhancedResumeBuilderV2
        initialResume={initialResume || undefined}
        initialTemplate={initialTemplate}
        documentLabel="Resume"
        onSave={handleSave}
        onExport={handleExport}
      />
    </div>
  );
}

export default function ResumeEditorPageV2() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-slate-900">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-white text-lg">Loading Resume Builder...</p>
          </div>
        </div>
      }
    >
      <ResumeEditorContent />
    </Suspense>
  );
}

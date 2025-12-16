'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import EnhancedResumeBuilderV2 from '@/components/dashboard/resume/EnhancedResumeBuilderV2';
import { Loader2 } from 'lucide-react';
import { resumeApiToUi, resumeUiToApiInput } from '@/lib/resume/mappers';
import { resumeDraftFromStoragePayload, resumeFromDraft, type DraftStoragePayload } from '@/lib/resume/drafts';
import { Resume, ResumeTemplate } from '@/types/resume';

function CVEditorContent() {
  const searchParams = useSearchParams();
  const templateParam = searchParams.get('template');
  const cvIdFromUrl = searchParams.get('id');
  const draftKey = searchParams.get('draftKey');

  const [initialResume, setInitialResume] = useState<Resume | null>(null);
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null);
  const [effectiveCvId, setEffectiveCvId] = useState<string | null>(cvIdFromUrl);

  const initialTemplate = useMemo(() => {
    if (templateParam && (Object.values(ResumeTemplate) as string[]).includes(templateParam)) {
      return templateParam;
    }
    return ResumeTemplate.MODERN;
  }, [templateParam]);

  useEffect(() => {
    setEffectiveCvId(cvIdFromUrl);
  }, [cvIdFromUrl]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setInitialLoadError(null);

        if (effectiveCvId) {
          const res = await fetch(`/api/cv/${encodeURIComponent(effectiveCvId)}`, { method: 'GET' });
          const data = await res.json();
          if (!res.ok || !data?.success) {
            throw new Error(data?.error || data?.message || 'Failed to load CV');
          }

          const ui = resumeApiToUi(data.cv);
          if (!cancelled) setInitialResume(ui);
          return;
        }

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

        if (!cancelled) setInitialResume(null);
      } catch (e: unknown) {
        if (!cancelled) {
          setInitialLoadError(e instanceof Error ? e.message : 'Failed to load CV');
          setInitialResume(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [effectiveCvId, draftKey, initialTemplate]);

  const handleSave = async (resume: Resume) => {
    try {
      const method = effectiveCvId ? 'PUT' : 'POST';
      const url = effectiveCvId ? `/api/cv/${effectiveCvId}` : '/api/cv';

      const payload = resumeUiToApiInput(resume);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save CV');
      }

      const data = await response.json();
      console.log('CV saved:', data);

      if (!effectiveCvId) {
        const createdId = data?.data?.id || data?.cv?._id || data?.cv?.id;
        if (createdId) {
          setEffectiveCvId(String(createdId));
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
        documentLabel="CV"
        onSave={handleSave}
        onExport={undefined}
      />
    </div>
  );
}

export default function CVEditorPageV2() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-slate-900">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-white text-lg">Loading CV Builder...</p>
          </div>
        </div>
      }
    >
      <CVEditorContent />
    </Suspense>
  );
}

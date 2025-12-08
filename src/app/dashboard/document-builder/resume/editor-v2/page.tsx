'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import EnhancedResumeBuilderV2 from '@/components/dashboard/resume/EnhancedResumeBuilderV2';
import { Loader2 } from 'lucide-react';

function ResumeEditorContent() {
  const searchParams = useSearchParams();
  const template = searchParams.get('template') || 'modern';
  const resumeId = searchParams.get('id');

  const handleSave = async (resume: any) => {
    try {
      const method = resumeId ? 'PUT' : 'POST';
      const url = resumeId ? `/api/resume/${resumeId}` : '/api/resume';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resume),
      });

      if (!response.ok) {
        throw new Error('Failed to save resume');
      }

      const data = await response.json();
      console.log('Resume saved:', data);
    } catch (error) {
      console.error('Save error:', error);
      throw error;
    }
  };

  const handleExport = async (format: 'pdf' | 'docx' | 'txt') => {
    try {
      if (!resumeId) {
        alert('Please save your resume first before exporting');
        return;
      }

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
      a.download = `resume.${format}`;
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
      <EnhancedResumeBuilderV2
        initialTemplate={template}
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

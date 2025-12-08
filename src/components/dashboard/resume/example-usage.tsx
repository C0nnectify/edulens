/**
 * Example Usage of Enhanced Resume Builder V2
 *
 * This file demonstrates how to integrate the Enhanced Resume Builder V2
 * into your Next.js application.
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import EnhancedResumeBuilderV2 from './EnhancedResumeBuilderV2';
import { Resume, ResumeTemplate } from '@/types/resume';
import { toast } from 'sonner';

// Example: Basic Usage
export function BasicResumeBuilder() {
  const [resume, setResume] = useState<Resume | undefined>(undefined);

  const handleSave = async (updatedResume: Resume) => {
    try {
      // Save to your database
      const response = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedResume),
      });

      if (response.ok) {
        toast.success('Resume saved successfully!');
      } else {
        toast.error('Failed to save resume');
      }
    } catch (error) {
      console.error('Error saving resume:', error);
      toast.error('An error occurred while saving');
    }
  };

  const handleExport = async () => {
    try {
      // Export resume as PDF
      const response = await fetch('/api/resumes/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resume),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${resume?.title || 'resume'}.pdf`;
        a.click();
        toast.success('Resume exported successfully!');
      } else {
        toast.error('Failed to export resume');
      }
    } catch (error) {
      console.error('Error exporting resume:', error);
      toast.error('An error occurred while exporting');
    }
  };

  return (
    <EnhancedResumeBuilderV2
      initialResume={resume}
      onSave={handleSave}
      onExport={handleExport}
    />
  );
}

// Example: With Existing Resume Data
export function EditExistingResume({ resumeId }: { resumeId: string }) {
  const [resume, setResume] = useState<Resume | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    // Load resume from database
    const loadResume = async () => {
      try {
        const response = await fetch(`/api/resumes/${resumeId}`);
        if (response.ok) {
          const data = await response.json();
          setResume(data);
        }
      } catch (error) {
        console.error('Error loading resume:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadResume();
  }, [resumeId]);

  const handleSave = async (updatedResume: Resume) => {
    try {
      const response = await fetch(`/api/resumes/${resumeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedResume),
      });

      if (response.ok) {
        setResume(updatedResume);
        toast.success('Resume updated successfully!');
      }
    } catch (error) {
      console.error('Error updating resume:', error);
      toast.error('Failed to update resume');
    }
  };

  const handleExport = () => {
    // Export logic
    console.log('Exporting resume:', resume);
  };

  if (isLoading) {
    return <div>Loading resume...</div>;
  }

  return (
    <EnhancedResumeBuilderV2
      initialResume={resume}
      onSave={handleSave}
      onExport={handleExport}
    />
  );
}

// Example: With User Context
export function UserResumeBuilder({ userId }: { userId: string }) {
  const router = useRouter();

  const handleSave = async (resume: Resume) => {
    try {
      const response = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...resume, userId }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Resume saved successfully!');

        // Optionally redirect to resume list
        if (data.id) {
          router.push(`/dashboard/resumes/${data.id}`);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save resume');
    }
  };

  const handleExport = () => {
    // Export implementation
  };

  // Create initial resume with user ID
  const initialResume: Resume = {
    userId,
    title: 'My Resume',
    createdAt: new Date(),
    updatedAt: new Date(),
    template: ResumeTemplate.MODERN,
    personalInfo: {
      fullName: '',
      email: '',
      location: { country: '' },
    },
    experience: [],
    education: [],
    skills: [],
  };

  return (
    <EnhancedResumeBuilderV2
      initialResume={initialResume}
      onSave={handleSave}
      onExport={handleExport}
    />
  );
}

// Example: API Route Handler (for Next.js App Router)
// File: app/api/resumes/route.ts
/*
import { NextRequest, NextResponse } from 'next/server';
import { Resume } from '@/types/resume';

export async function POST(request: NextRequest) {
  try {
    const resume: Resume = await request.json();

    // Validate resume data
    if (!resume.personalInfo.fullName || !resume.personalInfo.email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save to database (MongoDB example)
    const db = await getDatabase();
    const result = await db.collection('resumes').insertOne({
      ...resume,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      id: result.insertedId,
      message: 'Resume saved successfully',
    });
  } catch (error) {
    console.error('Error saving resume:', error);
    return NextResponse.json(
      { error: 'Failed to save resume' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const resume: Resume = await request.json();

    // Update in database
    const db = await getDatabase();
    await db.collection('resumes').updateOne(
      { _id: resume.id },
      {
        $set: {
          ...resume,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ message: 'Resume updated successfully' });
  } catch (error) {
    console.error('Error updating resume:', error);
    return NextResponse.json(
      { error: 'Failed to update resume' },
      { status: 500 }
    );
  }
}
*/

// Example: PDF Export API Route
// File: app/api/resumes/export/route.ts
/*
import { NextRequest, NextResponse } from 'next/server';
import { Resume } from '@/types/resume';
import PDFDocument from 'pdfkit';

export async function POST(request: NextRequest) {
  try {
    const resume: Resume = await request.json();

    // Create PDF (simplified example)
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    // Add content to PDF
    doc.fontSize(20).text(resume.personalInfo.fullName, { align: 'center' });
    doc.fontSize(12).text(resume.personalInfo.email, { align: 'center' });

    if (resume.summary) {
      doc.moveDown();
      doc.fontSize(16).text('Professional Summary');
      doc.fontSize(10).text(resume.summary);
    }

    if (resume.experience.length > 0) {
      doc.moveDown();
      doc.fontSize(16).text('Experience');
      resume.experience.forEach((exp) => {
        doc.fontSize(12).text(exp.position);
        doc.fontSize(10).text(exp.company);
        if (exp.achievements) {
          exp.achievements.forEach((achievement) => {
            doc.text(`• ${achievement}`);
          });
        }
      });
    }

    doc.end();

    // Wait for PDF generation to complete
    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${resume.title}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error exporting resume:', error);
    return NextResponse.json(
      { error: 'Failed to export resume' },
      { status: 500 }
    );
  }
}
*/

// Example: Page Component
// File: app/dashboard/resume/builder/page.tsx
/*
import { BasicResumeBuilder } from '@/components/dashboard/resume/example-usage';

export default function ResumeBuilderPage() {
  return (
    <div className="h-screen">
      <BasicResumeBuilder />
    </div>
  );
}
*/

// Example: Dynamic Route with Resume ID
// File: app/dashboard/resume/[id]/edit/page.tsx
/*
import { EditExistingResume } from '@/components/dashboard/resume/example-usage';

export default function EditResumePage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="h-screen">
      <EditExistingResume resumeId={params.id} />
    </div>
  );
}
*/

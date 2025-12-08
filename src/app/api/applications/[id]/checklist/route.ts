import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { applications, universityRequirements } from '@/lib/data-store';
import type { DocumentChecklist } from '@/types/document-requirements';

// GET /api/applications/[id]/checklist - Get document checklist for an application
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: applicationId } = await params;
    const application = applications.get(applicationId);

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    if (application.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Find requirements for this application
    // In production, you'd have a universityId field
    const requirements = Array.from(universityRequirements.values()).find(
      (req) =>
        req.universityName.toLowerCase() === application.universityName.toLowerCase() &&
        req.degreeLevel === application.degreeLevel
    );

    if (!requirements) {
      return NextResponse.json({
        success: true,
        data: {
          applicationId,
          requirements: [],
          completionPercentage: 0,
          missingRequired: [],
          missingOptional: [],
          message: 'No requirements data available for this university',
        },
      });
    }

    // Build checklist
    const checklist: DocumentChecklist = {
      applicationId,
      requirements: requirements.documents.map((req) => {
        // Find uploaded document matching this requirement
        const uploadedDoc = application.documents?.find(
          (doc: any) => doc.type === req.type
        );

        return {
          requirement: req,
          status: uploadedDoc ? 'uploaded' : 'pending',
          uploadedDocument: uploadedDoc
            ? {
                id: uploadedDoc.id,
                name: uploadedDoc.name,
                fileUrl: uploadedDoc.fileUrl || '',
                uploadedAt: uploadedDoc.uploadedAt || new Date().toISOString(),
              }
            : undefined,
        };
      }),
      completionPercentage: 0,
      missingRequired: [],
      missingOptional: [],
    };

    // Calculate completion
    const totalRequired = checklist.requirements.filter((r) => r.requirement.required).length;
    const completedRequired = checklist.requirements.filter(
      (r) => r.requirement.required && r.status !== 'pending'
    ).length;

    checklist.completionPercentage =
      totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 100;

    // Find missing documents
    checklist.missingRequired = checklist.requirements
      .filter((r) => r.requirement.required && r.status === 'pending')
      .map((r) => r.requirement);

    checklist.missingOptional = checklist.requirements
      .filter((r) => !r.requirement.required && r.status === 'pending')
      .map((r) => r.requirement);

    return NextResponse.json({
      success: true,
      data: checklist,
    });
  } catch (error) {
    console.error('[Checklist API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

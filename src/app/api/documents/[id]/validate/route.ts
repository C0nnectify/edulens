import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { applications, universityRequirements } from '@/lib/data-store';
import { documentValidatorService } from '@/lib/services/document-validator';

// POST /api/documents/[id]/validate - Validate a document
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const documentId = params.id;

    // Find the document across all applications
    let foundDoc: any = null;
    let foundApp: any = null;

    for (const app of applications.values()) {
      const doc = app.documents?.find((d: any) => d.id === documentId);
      if (doc) {
        foundDoc = doc;
        foundApp = app;
        break;
      }
    }

    if (!foundDoc || !foundApp) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (foundApp.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Find requirements for this application
    const requirements = Array.from(universityRequirements.values()).find(
      (req) =>
        req.universityName.toLowerCase() === foundApp.universityName.toLowerCase() &&
        req.degreeLevel === foundApp.degreeLevel
    );

    if (!requirements) {
      return NextResponse.json({
        success: false,
        message: 'No requirements found for validation',
      });
    }

    // Find the specific requirement for this document type
    const requirement = requirements.documents.find((r) => r.type === foundDoc.type);

    if (!requirement) {
      return NextResponse.json({
        success: false,
        message: `No requirements found for document type: ${foundDoc.type}`,
      });
    }

    // Get file info from request body or document
    const body = await request.json();
    const fileInfo = {
      name: body.fileName || foundDoc.name,
      size: body.fileSize || foundDoc.fileSize || 0,
      type: body.fileType || foundDoc.fileType || 'application/pdf',
    };

    // Validate the document
    const validation = await documentValidatorService.validateDocument(
      fileInfo,
      requirement
    );

    // Store validation result (in production, save to DB)
    if (!foundDoc.validations) {
      foundDoc.validations = [];
    }
    foundDoc.validations.push(validation);
    foundDoc.lastValidated = validation.validatedAt;
    foundDoc.validationStatus = validation.overallStatus;

    // Update application
    applications.set(foundApp.id, foundApp);

    return NextResponse.json({
      success: true,
      message: 'Document validated successfully',
      data: validation,
    });
  } catch (error) {
    console.error('[Document Validation API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

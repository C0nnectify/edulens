import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { ResumeModel } from '@/lib/db/models/Resume';
import { ObjectId } from 'mongodb';
import { exportToJSON, exportToJSONResume, exportToTXT, generateJSONFilename, generateTXTFilename } from '@/lib/exporters/json';
import { authenticateRequest } from '@/lib/api-utils';
import { resumeApiToUi } from '@/lib/resume/mappers';

/**
 * GET /api/resume/:id/export
 * Export resume in various formats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid resume ID' },
        { status: 400 }
      );
    }

    // Fetch resume
    await connectDB();
    const resume = await ResumeModel.findOne({ _id: id, userId: authResult.user.id }).lean();

    if (!resume) {
      return NextResponse.json(
        { success: false, error: 'Resume not found' },
        { status: 404 }
      );
    }

    let blob: Blob;
    let filename: string;
    let contentType: string;

    const uiResume = resumeApiToUi(resume);

    switch (format) {
      case 'json':
        blob = exportToJSON(uiResume);
        filename = generateJSONFilename(uiResume, 'native');
        contentType = 'application/json';
        break;

      case 'jsonresume':
        blob = exportToJSONResume(uiResume);
        filename = generateJSONFilename(uiResume, 'jsonresume');
        contentType = 'application/json';
        break;

      case 'txt':
        blob = exportToTXT(uiResume);
        filename = generateTXTFilename(uiResume);
        contentType = 'text/plain';
        break;

      case 'pdf':
        return NextResponse.json(
          { success: false, error: 'PDF export not yet implemented. Install @react-pdf/renderer or jspdf.' },
          { status: 501 }
        );

      case 'docx':
        return NextResponse.json(
          { success: false, error: 'DOCX export not yet implemented. Install docx library.' },
          { status: 501 }
        );

      default:
        return NextResponse.json(
          { success: false, error: 'Unsupported export format' },
          { status: 400 }
        );
    }

    // Convert blob to buffer
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Return file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error exporting resume:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export resume' },
      { status: 500 }
    );
  }
}

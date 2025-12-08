import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import type { ExportOptions } from '@/types/insights';

/**
 * POST /api/insights/export
 * Export insights to PDF or JSON
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ExportOptions = await request.json();
    const userId = session.user.id;
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    const response = await fetch(`${aiServiceUrl}/api/insights/${userId}/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.session.token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Failed to export insights' },
        { status: response.status }
      );
    }

    // Handle different export formats
    if (body.format === 'pdf') {
      const pdfBuffer = await response.arrayBuffer();
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="insights-${userId}-${Date.now()}.pdf"`,
        },
      });
    } else {
      const jsonData = await response.json();
      return NextResponse.json(jsonData);
    }
  } catch (error) {
    console.error('Error exporting insights:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

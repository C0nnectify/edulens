import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { applications } from '@/lib/data-store';

interface ImportedApplication {
  universityName: string;
  programName: string;
  degreeLevel: 'undergraduate' | 'graduate' | 'phd' | 'postdoc';
  deadline?: string;
  status?: string;
  portalUrl?: string;
  applicationFee?: number;
  priority?: 'high' | 'medium' | 'low';
  notes?: string;
  tags?: string[];
}

// POST /api/applications/import - Import applications from CSV/Excel
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { source, data } = body;

    if (!source || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: source, data' },
        { status: 400 }
      );
    }

    let importedApps: ImportedApplication[];

    switch (source) {
      case 'csv':
      case 'excel':
        importedApps = await this.parseSpreadsheet(data);
        break;
      case 'commonapp':
        importedApps = await this.parseCommonApp(data);
        break;
      default:
        return NextResponse.json(
          { error: `Unsupported source: ${source}` },
          { status: 400 }
        );
    }

    // Create applications
    const created: any[] = [];
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < importedApps.length; i++) {
      const appData = importedApps[i];

      try {
        // Validate required fields
        if (!appData.universityName || !appData.programName || !appData.degreeLevel) {
          errors.push({
            row: i + 1,
            error: 'Missing required fields: universityName, programName, or degreeLevel',
          });
          continue;
        }

        // Create application
        const newApp = {
          id: crypto.randomUUID(),
          userId: session.user.id,
          universityName: appData.universityName,
          programName: appData.programName,
          degreeLevel: appData.degreeLevel,
          status: appData.status || 'draft',
          deadline: appData.deadline || '',
          portalUrl: appData.portalUrl || '',
          applicationFee: appData.applicationFee || 0,
          priority: appData.priority || 'medium',
          notes: appData.notes || '',
          tags: appData.tags || [],
          documents: [],
          statusHistory: [
            {
              id: crypto.randomUUID(),
              status: appData.status || 'draft',
              timestamp: new Date().toISOString(),
              source: 'import',
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        };

        applications.set(newApp.id, newApp);
        created.push(newApp);
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${created.length} applications`,
      data: {
        imported: created,
        total: importedApps.length,
        successful: created.length,
        failed: errors.length,
        errors,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[Import API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Parse spreadsheet data (CSV/Excel)
 */
function parseSpreadsheet(data: any[]): ImportedApplication[] {
  // Data should be array of objects with column headers
  return data.map((row) => ({
    universityName: row.universityName || row['University Name'] || row.university || '',
    programName: row.programName || row['Program Name'] || row.program || '',
    degreeLevel: this.normalizeDegreeLevel(
      row.degreeLevel || row['Degree Level'] || row.degree || 'graduate'
    ),
    deadline: row.deadline || row['Deadline'] || row['Application Deadline'] || undefined,
    status: this.normalizeStatus(row.status || row['Status'] || undefined),
    portalUrl: row.portalUrl || row['Portal URL'] || row.portal || undefined,
    applicationFee: parseFloat(row.applicationFee || row['Application Fee'] || row.fee || 0),
    priority: this.normalizePriority(row.priority || row['Priority'] || undefined),
    notes: row.notes || row['Notes'] || undefined,
    tags: this.parseTags(row.tags || row['Tags'] || undefined),
  }));
}

/**
 * Parse CommonApp export data
 */
function parseCommonApp(data: any[]): ImportedApplication[] {
  // CommonApp specific format
  return data.map((row) => ({
    universityName: row['College Name'] || row.college || '',
    programName: row['Program'] || 'Undergraduate Program',
    degreeLevel: 'undergraduate' as const,
    deadline: row['Application Deadline'] || row.deadline || undefined,
    status: this.normalizeStatus(row['Application Status'] || undefined),
    portalUrl: row['College Portal'] || undefined,
    applicationFee: parseFloat(row['Application Fee'] || 0),
    priority: 'medium' as const,
    notes: row['Notes'] || undefined,
    tags: [],
  }));
}

/**
 * Normalize degree level
 */
function normalizeDegreeLevel(value: string): ImportedApplication['degreeLevel'] {
  const normalized = value.toLowerCase().trim();

  if (normalized.includes('undergrad') || normalized.includes('bachelor')) {
    return 'undergraduate';
  }
  if (normalized.includes('phd') || normalized.includes('doctor')) {
    return 'phd';
  }
  if (normalized.includes('postdoc')) {
    return 'postdoc';
  }
  return 'graduate';
}

/**
 * Normalize status
 */
function normalizeStatus(value?: string): string | undefined {
  if (!value) return undefined;

  const normalized = value.toLowerCase().trim();
  const statusMap: Record<string, string> = {
    draft: 'draft',
    'in progress': 'draft',
    submitted: 'submitted',
    'under review': 'under_review',
    reviewing: 'under_review',
    interview: 'interview_scheduled',
    accepted: 'accepted',
    admitted: 'accepted',
    rejected: 'rejected',
    declined: 'rejected',
    waitlisted: 'waitlisted',
    'waiting list': 'waitlisted',
  };

  return statusMap[normalized] || 'draft';
}

/**
 * Normalize priority
 */
function normalizePriority(value?: string): 'high' | 'medium' | 'low' {
  if (!value) return 'medium';

  const normalized = value.toLowerCase().trim();

  if (normalized === 'high' || normalized === '1') return 'high';
  if (normalized === 'low' || normalized === '3') return 'low';
  return 'medium';
}

/**
 * Parse tags from string
 */
function parseTags(value?: string): string[] {
  if (!value) return [];

  // Handle comma-separated or semicolon-separated tags
  return value
    .split(/[,;]/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

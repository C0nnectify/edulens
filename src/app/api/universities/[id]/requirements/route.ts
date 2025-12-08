import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { universityRequirements } from '@/lib/data-store';
import type { CreateRequirementsDto, UpdateRequirementsDto } from '@/types/document-requirements';

// GET /api/universities/[id]/requirements - Get requirements for a university
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const universityId = params.id;
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');
    const degreeLevel = searchParams.get('degreeLevel');

    // Find requirements
    let requirements = Array.from(universityRequirements.values()).filter(
      (req) => req.universityId === universityId
    );

    // Filter by program if specified
    if (programId) {
      requirements = requirements.filter((req) => req.programId === programId);
    }

    // Filter by degree level if specified
    if (degreeLevel) {
      requirements = requirements.filter((req) => req.degreeLevel === degreeLevel);
    }

    if (requirements.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No requirements found for this university',
      });
    }

    // Return most recent if multiple found
    const mostRecent = requirements.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0];

    return NextResponse.json({
      success: true,
      data: mostRecent,
    });
  } catch (error) {
    console.error('[Requirements API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/universities/[id]/requirements - Create/Update requirements
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

    const universityId = params.id;
    const body: CreateRequirementsDto = await request.json();

    // Validate required fields
    if (!body.universityName || !body.degreeLevel || !body.documents) {
      return NextResponse.json(
        { error: 'Missing required fields: universityName, degreeLevel, documents' },
        { status: 400 }
      );
    }

    // Check if requirements already exist
    const existing = Array.from(universityRequirements.values()).find(
      (req) =>
        req.universityId === universityId &&
        req.programId === body.programId &&
        req.degreeLevel === body.degreeLevel
    );

    if (existing) {
      return NextResponse.json(
        { error: 'Requirements already exist for this university/program combination' },
        { status: 409 }
      );
    }

    // Create requirements
    const requirements = {
      id: crypto.randomUUID(),
      universityId,
      universityName: body.universityName,
      programId: body.programId,
      programName: body.programName,
      degreeLevel: body.degreeLevel,
      documents: body.documents.map((doc) => ({
        id: crypto.randomUUID(),
        ...doc,
      })),
      specialInstructions: body.specialInstructions,
      scrapedAt: new Date().toISOString(),
      source: body.source || 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    universityRequirements.set(requirements.id, requirements);

    return NextResponse.json({
      success: true,
      message: 'Requirements created successfully',
      data: requirements,
    }, { status: 201 });
  } catch (error) {
    console.error('[Requirements API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/universities/[id]/requirements - Update requirements
export async function PUT(
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

    const universityId = params.id;
    const { searchParams } = new URL(request.url);
    const requirementsId = searchParams.get('requirementsId');

    if (!requirementsId) {
      return NextResponse.json(
        { error: 'requirementsId query parameter is required' },
        { status: 400 }
      );
    }

    const existing = universityRequirements.get(requirementsId);

    if (!existing || existing.universityId !== universityId) {
      return NextResponse.json(
        { error: 'Requirements not found' },
        { status: 404 }
      );
    }

    const updates: UpdateRequirementsDto = await request.json();

    // Update requirements
    const updated = {
      ...existing,
      ...updates,
      ...(updates.documents && {
        documents: updates.documents.map((doc) => ({
          id: crypto.randomUUID(),
          ...doc,
        })),
      }),
      lastVerified: updates.lastVerified || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    universityRequirements.set(requirementsId, updated);

    return NextResponse.json({
      success: true,
      message: 'Requirements updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('[Requirements API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

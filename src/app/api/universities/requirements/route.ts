import { NextRequest, NextResponse } from 'next/server';
import { universityRequirements } from '@/lib/data-store';

export async function GET(request: NextRequest) {
  try {
    const requirements = Array.from(universityRequirements.values());

    return NextResponse.json({
      success: true,
      data: requirements,
    });
  } catch (error) {
    console.error('Error fetching requirements:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch requirements' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { universityName, degreeLevel, documents, specialInstructions } = body;

    const universityId = universityName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const requirement = {
      id: `${universityId}-${degreeLevel}`,
      universityId,
      universityName,
      degreeLevel,
      documents,
      specialInstructions,
      scrapedAt: undefined,
      source: 'manual' as const,
    };

    universityRequirements.set(requirement.id, requirement);

    return NextResponse.json({
      success: true,
      data: requirement,
    });
  } catch (error) {
    console.error('Error creating requirements:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create requirements' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { ResumeModel } from '@/lib/db/models/Resume';
import { Resume } from '@/types/resume';

/**
 * GET /api/resume/list
 * List all resumes for a user with filtering and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get user ID from session/auth (placeholder - implement based on your auth)
    const userId = searchParams.get('userId') || 'demo-user';

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // Filters
    const isFavorite = searchParams.get('isFavorite');
    const tags = searchParams.get('tags')?.split(',');
    const industryTarget = searchParams.get('industryTarget');
    const minAtsScore = searchParams.get('minAtsScore');

    await connectDB();

    // Build query
    const query: any = { userId };

    if (isFavorite !== null) {
      query['metadata.isFavorite'] = isFavorite === 'true';
    }

    if (tags && tags.length > 0) {
      query['metadata.tags'] = { $in: tags };
    }

    if (industryTarget) {
      query.industryTarget = industryTarget;
    }

    if (minAtsScore) {
      query['metadata.atsScore'] = { $gte: parseInt(minAtsScore) };
    }

    // Execute query
    const total = await ResumeModel.countDocuments(query);
    const resumes = await ResumeModel
      .find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      resumes: resumes.map(resume => ({
        ...resume,
        _id: resume._id.toString(),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error listing resumes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch resumes' },
      { status: 500 }
    );
  }
}

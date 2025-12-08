import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { ResumeModel } from '@/lib/db/models/Resume';
import { Resume, ResumeTemplate, IndustryTemplate } from '@/types/resume';
import { getTemplateById } from '@/lib/templates/registry';

/**
 * POST /api/resume/create
 * Create a new resume
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, template, industryTarget, sourceResumeId, userId } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // If duplicating from existing resume
    if (sourceResumeId) {
      const sourceResume = await ResumeModel.findById(sourceResumeId).lean();

      if (!sourceResume) {
        return NextResponse.json(
          { success: false, error: 'Source resume not found' },
          { status: 404 }
        );
      }

      const duplicatedResume = {
        ...sourceResume,
        _id: undefined,
        title: title || `${sourceResume.title} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          ...sourceResume.metadata,
          version: 1,
          isFavorite: false,
        },
      };

      const result = await ResumeModel.create(duplicatedResume);

      return NextResponse.json({
        success: true,
        resume: {
          ...result.toObject(),
          _id: result._id.toString(),
        },
      });
    }

    // Get template configuration if specified
    let templateConfig = null;
    if (template || industryTarget) {
      templateConfig = getTemplateById(template || industryTarget);
    }

    // Create new resume with defaults
    const newResume: any = {
      userId: userId || 'demo-user', // Replace with actual auth
      title,
      template: template || IndustryTemplate.GENERIC_ATS_SIMPLE,
      industryTarget: industryTarget || IndustryTemplate.GENERIC_ATS_SIMPLE,

      personalInfo: {
        firstName: 'Your',
        lastName: 'Name',
        email: 'your.email@example.com',
        phone: '',
        location: {
          city: '',
          state: '',
          country: ''
        },
      },

      summary: '',
      experience: [],
      education: [],
      skills: [],
      projects: [],
      certifications: [],
      languages: [],
      customSections: [],

      metadata: {
        version: 1,
        isPublic: false,
        isFavorite: false,
        tags: [],
        targetRole: '',
        targetIndustry: templateConfig?.category ? [templateConfig.category] : [],
        atsScore: 0,
        sectionOrder: templateConfig?.sectionOrder || [
          'personalInfo',
          'summary',
          'experience',
          'education',
          'skills',
        ],
        sectionVisibility: {},
      },

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await ResumeModel.create(newResume);

    return NextResponse.json({
      success: true,
      resume: {
        ...result.toObject(),
        _id: result._id.toString(),
      },
    });
  } catch (error) {
    console.error('Error creating resume:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create resume' },
      { status: 500 }
    );
  }
}

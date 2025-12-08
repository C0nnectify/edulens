import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { ResumeModel } from '@/lib/db/models/Resume';
import { parseJSONResume } from '@/lib/parsers/json-resume';
import { parseResumeText } from '@/lib/parsers/pdf';
import { getTemplateById } from '@/lib/templates/registry';

/**
 * POST /api/resume/import
 * Import resume from various formats
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const userId = formData.get('userId') as string || 'demo-user';
    const template = formData.get('template') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    let resumeData: any = {};
    const warnings: string[] = [];

    // Parse based on type
    try {
      switch (type) {
        case 'json':
          resumeData = await parseJSONResume(file);
          break;

        case 'linkedin':
          // LinkedIn ZIP parsing requires jszip
          warnings.push('LinkedIn import requires jszip library. Please install it first.');
          return NextResponse.json(
            { success: false, error: 'LinkedIn import not fully implemented', warnings },
            { status: 501 }
          );

        case 'pdf':
          // PDF parsing - basic text extraction
          const text = await file.text();
          resumeData = parseResumeText(text);
          warnings.push('PDF import is basic. Review and verify all data.');
          break;

        case 'docx':
          warnings.push('DOCX import requires mammoth library. Please install it first.');
          return NextResponse.json(
            { success: false, error: 'DOCX import not fully implemented', warnings },
            { status: 501 }
          );

        default:
          return NextResponse.json(
            { success: false, error: 'Unsupported import type' },
            { status: 400 }
          );
      }
    } catch (parseError: any) {
      return NextResponse.json(
        { success: false, error: `Failed to parse file: ${parseError.message}` },
        { status: 400 }
      );
    }

    // Get template configuration
    const templateConfig = template ? getTemplateById(template) : null;

    // Create resume in database
    await connectDB();

    const newResume = {
      userId,
      title: resumeData.personalInfo?.fullName
        ? `${resumeData.personalInfo.fullName}'s Resume`
        : 'Imported Resume',
      template: template || 'generic-ats-simple',
      industryTarget: template || 'generic-ats-simple',

      personalInfo: resumeData.personalInfo || {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        location: { country: '' },
      },

      summary: resumeData.summary || '',
      experience: resumeData.experience || [],
      education: resumeData.education || [],
      skills: resumeData.skills || [],
      projects: resumeData.projects || [],
      certifications: resumeData.certifications || [],
      languages: resumeData.languages || [],
      customSections: resumeData.customSections || [],

      metadata: {
        version: 1,
        isPublic: false,
        isFavorite: false,
        tags: ['imported'],
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
      warnings,
    });
  } catch (error) {
    console.error('Error importing resume:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to import resume' },
      { status: 500 }
    );
  }
}

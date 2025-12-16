import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { ResumeModel } from '@/lib/db/models/Resume';
import { parseJSONResume } from '@/lib/parsers/json-resume';
import { parseResumeText } from '@/lib/parsers/pdf';
import { getTemplateById } from '@/lib/templates/registry';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

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

    let resumeData: unknown = {};
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
    } catch (parseError: unknown) {
      const msg = parseError instanceof Error ? parseError.message : 'Unknown parse error';
      return NextResponse.json(
        { success: false, error: `Failed to parse file: ${msg}` },
        { status: 400 }
      );
    }

    // Get template configuration
    const templateConfig = template ? getTemplateById(template) : null;

    // Create resume in database
    await connectDB();

    const data = asRecord(resumeData);
    const personalInfo = asRecord(data.personalInfo);

    const newResume = {
      userId,
      title: typeof personalInfo.fullName === 'string'
        ? `${personalInfo.fullName}'s Resume`
        : 'Imported Resume',
      template: template || 'generic-ats-simple',
      industryTarget: template || 'generic-ats-simple',

      personalInfo: Object.keys(personalInfo).length > 0 ? personalInfo : {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        location: { country: '' },
      },

      summary: typeof data.summary === 'string' ? data.summary : '',
      experience: Array.isArray(data.experience) ? data.experience : [],
      education: Array.isArray(data.education) ? data.education : [],
      skills: Array.isArray(data.skills) ? data.skills : [],
      projects: Array.isArray(data.projects) ? data.projects : [],
      certifications: Array.isArray(data.certifications) ? data.certifications : [],
      languages: Array.isArray(data.languages) ? data.languages : [],
      customSections: Array.isArray(data.customSections) ? data.customSections : [],

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

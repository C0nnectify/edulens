import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { CVModel } from '@/lib/db/models/CV';
import { IndustryTemplate } from '@/types/resume';
import { authenticateRequest } from '@/lib/api-utils';
import { getTemplateById } from '@/lib/templates/registry';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function splitName(fullName?: string | null): { firstName: string; lastName: string } {
  const cleaned = (fullName || '').trim();
  if (!cleaned) return { firstName: 'Your', lastName: 'Name' };
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: 'Name' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/**
 * POST /api/cv/create
 * Create a new CV with safe defaults.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = authResult.user;

    const body = asRecord(await request.json());
    const title = typeof body.title === 'string' ? body.title : '';
    const template = typeof body.template === 'string' ? body.template : undefined;
    const industryTarget = typeof body.industryTarget === 'string' ? body.industryTarget : undefined;
    const sourceCvId = typeof body.sourceCvId === 'string' ? body.sourceCvId : undefined;

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    await connectDB();

    if (sourceCvId) {
      const source = await CVModel.findOne({ _id: sourceCvId, userId: user.id }).lean<Record<string, unknown>>();
      if (!source) {
        return NextResponse.json(
          { success: false, error: 'Source CV not found' },
          { status: 404 }
        );
      }

      const sourceTitle = typeof source.title === 'string' ? source.title : 'Untitled CV';

      const duplicated: Record<string, unknown> = {
        ...source,
        _id: undefined,
        userId: user.id,
        title: title || `${sourceTitle} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await CVModel.create(duplicated);

      return NextResponse.json({
        success: true,
        cv: {
          ...result.toObject(),
          _id: result._id.toString(),
        },
      });
    }

    const templateId = template || industryTarget;
    const templateConfig = templateId ? getTemplateById(templateId) : null;

    const userRecord = asRecord(user);
    const { firstName, lastName } = splitName(typeof userRecord.name === 'string' ? userRecord.name : undefined);
    const email = typeof userRecord.email === 'string' ? userRecord.email : 'your.email@example.com';

    const newCv: Record<string, unknown> = {
      userId: user.id,
      title,
      template: template || IndustryTemplate.GENERIC_ATS_SIMPLE,
      industryTarget: industryTarget || IndustryTemplate.GENERIC_ATS_SIMPLE,
      personalInfo: {
        firstName,
        lastName,
        email,
        phone: '',
        location: { city: '', state: '', country: '' },
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

    const result = await CVModel.create(newCv);

    return NextResponse.json({
      success: true,
      cv: {
        ...result.toObject(),
        _id: result._id.toString(),
      },
    });
  } catch (error) {
    console.error('Error creating CV:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create CV' },
      { status: 500 }
    );
  }
}

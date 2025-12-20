// POST /api/resume/export - Generate PDF/DOCX export of resume

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { ResumeModel } from '@/lib/db/models/Resume';
import { exportSchema } from '@/lib/validations/resume';
import {
  authenticateRequest,
  errorResponse,
  handleApiError,
  handleValidationError,
  checkRateLimit,
} from '@/lib/api-utils';
import { Resume } from '@/types/resume';
import { resumeApiToUi } from '@/lib/resume/mappers';

type PdfMakeDocumentDefinition = Record<string, unknown>;

// Format resume as plain text
function formatAsText(resume: Resume): string {
  const lines: string[] = [];

  const name =
    resume.personalInfo.fullName ||
    `${resume.personalInfo.firstName || ''} ${resume.personalInfo.lastName || ''}`.trim() ||
    'RESUME';

  // Header
  lines.push('='.repeat(80));
  lines.push(name.toUpperCase());
  lines.push('='.repeat(80));
  lines.push('');

  // Contact Information
  lines.push('CONTACT INFORMATION');
  lines.push('-'.repeat(80));
  lines.push(`Email: ${resume.personalInfo.email}`);
  if (resume.personalInfo.phone) lines.push(`Phone: ${resume.personalInfo.phone}`);
  if (resume.personalInfo.location) {
    const loc = resume.personalInfo.location;
    lines.push(`Location: ${[loc.city, loc.state, loc.country].filter(Boolean).join(', ')}`);
  }
  if (resume.personalInfo.linkedin) lines.push(`LinkedIn: ${resume.personalInfo.linkedin}`);
  if (resume.personalInfo.github) lines.push(`GitHub: ${resume.personalInfo.github}`);
  if (resume.personalInfo.portfolio) lines.push(`Portfolio: ${resume.personalInfo.portfolio}`);
  lines.push('');

  // Professional Summary
  if (resume.summary) {
    lines.push('PROFESSIONAL SUMMARY');
    lines.push('-'.repeat(80));
    lines.push(resume.summary);
    lines.push('');
  }

  // Experience
  if (resume.experience && resume.experience.length > 0) {
    lines.push('PROFESSIONAL EXPERIENCE');
    lines.push('-'.repeat(80));
    resume.experience.forEach((exp, index) => {
      if (index > 0) lines.push('');
      lines.push(`${exp.position} | ${exp.company}`);
      lines.push(`${exp.startDate} - ${exp.current ? 'Present' : exp.endDate || 'Present'}`);
      if (exp.location) lines.push(`Location: ${exp.location}`);
      if (exp.description) lines.push(exp.description);
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach(bullet => lines.push(`  • ${bullet}`));
      }
    });
    lines.push('');
  }

  // Education
  if (resume.education && resume.education.length > 0) {
    lines.push('EDUCATION');
    lines.push('-'.repeat(80));
    resume.education.forEach((edu, index) => {
      if (index > 0) lines.push('');
      lines.push(`${edu.degree} ${edu.field ? `in ${edu.field}` : ''}`);
      lines.push(edu.institution);
      if (edu.startDate || edu.endDate) {
        lines.push(`${edu.startDate || ''} - ${edu.current ? 'Present' : edu.endDate || ''}`);
      }
      if (edu.gpa) lines.push(`GPA: ${edu.gpa}`);
      if (edu.honors && edu.honors.length > 0) {
        lines.push(`Honors: ${edu.honors.join(', ')}`);
      }
    });
    lines.push('');
  }

  // Skills
  if (resume.skills && resume.skills.length > 0) {
    lines.push('SKILLS');
    lines.push('-'.repeat(80));

    // Group by category
    const skillsByCategory: Record<string, string[]> = {};
    resume.skills.forEach(skill => {
      const category = skill.category || 'Other';
      if (!skillsByCategory[category]) skillsByCategory[category] = [];
      skillsByCategory[category].push(skill.name);
    });

    Object.entries(skillsByCategory).forEach(([category, skills]) => {
      lines.push(`${category}: ${skills.join(', ')}`);
    });
    lines.push('');
  }

  // Projects
  if (resume.projects && resume.projects.length > 0) {
    lines.push('PROJECTS');
    lines.push('-'.repeat(80));
    resume.projects.forEach((project, index) => {
      if (index > 0) lines.push('');
      lines.push(project.name);
      lines.push(project.description);
      lines.push(`Technologies: ${project.technologies.join(', ')}`);
      if (project.url) lines.push(`URL: ${project.url}`);
      if (project.github) lines.push(`GitHub: ${project.github}`);
    });
    lines.push('');
  }

  // Certifications
  if (resume.certifications && resume.certifications.length > 0) {
    lines.push('CERTIFICATIONS');
    lines.push('-'.repeat(80));
    resume.certifications.forEach(cert => {
      lines.push(`${cert.name} - ${cert.issuer} (${cert.date})`);
      if (cert.credentialId) lines.push(`  Credential ID: ${cert.credentialId}`);
      if (cert.url) lines.push(`  URL: ${cert.url}`);
    });
    lines.push('');
  }

  // Languages
  if (resume.languages && resume.languages.length > 0) {
    lines.push('LANGUAGES');
    lines.push('-'.repeat(80));
    resume.languages.forEach(lang => {
      lines.push(`${lang.name}: ${lang.proficiency}`);
    });
    lines.push('');
  }

  lines.push('='.repeat(80));
  lines.push('');

  return lines.join('\n');
}

function buildPdfDefinition(resume: Resume): PdfMakeDocumentDefinition {
  const name =
    resume.personalInfo.fullName ||
    `${resume.personalInfo.firstName || ''} ${resume.personalInfo.lastName || ''}`.trim() ||
    'Resume';

  const contactParts: string[] = [];
  if (resume.personalInfo.email) contactParts.push(resume.personalInfo.email);
  if (resume.personalInfo.phone) contactParts.push(resume.personalInfo.phone);
  if (resume.personalInfo.location) {
    const loc = resume.personalInfo.location;
    const locText = [loc.city, loc.state, loc.country].filter(Boolean).join(', ');
    if (locText) contactParts.push(locText);
  }
  if (resume.personalInfo.linkedin) contactParts.push(`LinkedIn: ${resume.personalInfo.linkedin}`);
  if (resume.personalInfo.github) contactParts.push(`GitHub: ${resume.personalInfo.github}`);
  if (resume.personalInfo.portfolio) contactParts.push(`Portfolio: ${resume.personalInfo.portfolio}`);

  const content: any[] = [];

  content.push({ text: name, style: 'name' });
  if (contactParts.length > 0) {
    content.push({ text: contactParts.join('  •  '), style: 'contact' });
  }

  if (resume.summary) {
    content.push({ text: 'Summary', style: 'sectionHeader' });
    content.push({ text: resume.summary, style: 'paragraph' });
  }

  if (resume.experience && resume.experience.length > 0) {
    content.push({ text: 'Experience', style: 'sectionHeader' });
    resume.experience.forEach((exp) => {
      content.push({
        columns: [
          {
            width: '*',
            text: `${exp.position}${exp.company ? `, ${exp.company}` : ''}`,
            style: 'itemTitle',
          },
          {
            width: 'auto',
            text: `${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || 'Present'}`.trim(),
            style: 'itemMeta',
          },
        ],
        columnGap: 12,
      });
      if (exp.location) content.push({ text: exp.location, style: 'itemMeta' });
      if (exp.description) content.push({ text: exp.description, style: 'paragraph' });
      if (exp.bullets && exp.bullets.length > 0) {
        content.push({
          ul: exp.bullets.filter(Boolean),
          style: 'bullets',
        });
      }
      content.push({ text: '', margin: [0, 4, 0, 0] });
    });
  }

  if (resume.education && resume.education.length > 0) {
    content.push({ text: 'Education', style: 'sectionHeader' });
    resume.education.forEach((edu) => {
      const degreeLine = [edu.degree, edu.field ? `in ${edu.field}` : ''].filter(Boolean).join(' ');
      content.push({
        columns: [
          { width: '*', text: degreeLine || edu.institution, style: 'itemTitle' },
          {
            width: 'auto',
            text: `${edu.startDate || ''} - ${edu.current ? 'Present' : edu.endDate || ''}`.trim(),
            style: 'itemMeta',
          },
        ],
        columnGap: 12,
      });
      if (edu.institution) content.push({ text: edu.institution, style: 'paragraph' });
      if (edu.gpa) content.push({ text: `GPA: ${edu.gpa}`, style: 'paragraph' });
      if (edu.honors && edu.honors.length > 0) {
        content.push({ text: `Honors: ${edu.honors.join(', ')}`, style: 'paragraph' });
      }
      content.push({ text: '', margin: [0, 4, 0, 0] });
    });
  }

  if (resume.skills && resume.skills.length > 0) {
    content.push({ text: 'Skills', style: 'sectionHeader' });
    const skillsByCategory: Record<string, string[]> = {};
    resume.skills.forEach((skill) => {
      const category = skill.category || 'Skills';
      if (!skillsByCategory[category]) skillsByCategory[category] = [];
      skillsByCategory[category].push(skill.name);
    });
    Object.entries(skillsByCategory).forEach(([category, skills]) => {
      content.push({
        text: [{ text: `${category}: `, bold: true }, skills.join(', ')],
        style: 'paragraph',
      });
    });
  }

  if (resume.projects && resume.projects.length > 0) {
    content.push({ text: 'Projects', style: 'sectionHeader' });
    resume.projects.forEach((project) => {
      content.push({ text: project.name, style: 'itemTitle' });
      if (project.role) content.push({ text: project.role, style: 'itemMeta' });
      if (project.description) content.push({ text: project.description, style: 'paragraph' });
      if (project.technologies && project.technologies.length > 0) {
        content.push({ text: `Technologies: ${project.technologies.join(', ')}`, style: 'paragraph' });
      }
      if (project.url) content.push({ text: `URL: ${project.url}`, style: 'paragraph' });
      if (project.github) content.push({ text: `GitHub: ${project.github}`, style: 'paragraph' });
      content.push({ text: '', margin: [0, 4, 0, 0] });
    });
  }

  if (resume.certifications && resume.certifications.length > 0) {
    content.push({ text: 'Certifications', style: 'sectionHeader' });
    resume.certifications.forEach((cert) => {
      const line = [cert.name, cert.issuer ? `— ${cert.issuer}` : '', cert.date ? `(${cert.date})` : '']
        .filter(Boolean)
        .join(' ');
      content.push({ text: line, style: 'paragraph' });
    });
  }

  if (resume.languages && resume.languages.length > 0) {
    content.push({ text: 'Languages', style: 'sectionHeader' });
    content.push({
      text: resume.languages.map((l) => `${l.name}: ${l.proficiency}`).join('  •  '),
      style: 'paragraph',
    });
  }

  return {
    pageSize: 'LETTER',
    pageMargins: [48, 48, 48, 48],
    content,
    defaultStyle: {
      font: 'Roboto',
      fontSize: 11,
      lineHeight: 1.15,
    },
    styles: {
      name: { fontSize: 18, bold: true, margin: [0, 0, 0, 6] },
      contact: { fontSize: 10, color: '#555555', margin: [0, 0, 0, 14] },
      sectionHeader: { fontSize: 12, bold: true, margin: [0, 10, 0, 6] },
      itemTitle: { fontSize: 11, bold: true, margin: [0, 0, 0, 2] },
      itemMeta: { fontSize: 10, color: '#666666', margin: [0, 0, 0, 2] },
      paragraph: { margin: [0, 0, 0, 6] },
      bullets: { margin: [12, 0, 0, 8] },
    },
  };
}

async function generatePDF(
  resume: Resume,
  _template: string,
  _options: Record<string, unknown> | undefined
): Promise<Buffer> {
  const pdfMakeMod = await import('pdfmake/build/pdfmake.js');
  const pdfFonts = await import('pdfmake/build/vfs_fonts.js');
  const pdfMake: any = (pdfMakeMod as any).default || pdfMakeMod;
  const vfs = ((pdfFonts as any).default && (pdfFonts as any).default.vfs) || (pdfFonts as any).vfs;
  pdfMake.vfs = vfs;

  const docDefinition = buildPdfDefinition(resume);

  return await new Promise<Buffer>((resolve, reject) => {
    try {
      pdfMake.createPdf(docDefinition).getBuffer((buffer: Uint8Array) => {
        resolve(Buffer.from(buffer));
      });
    } catch (e) {
      reject(e);
    }
  });
}

// Simulate DOCX generation (in production, use docx library)
async function generateDOCX(
  resume: Resume,
  _template: string,
  _options: Record<string, unknown> | undefined
): Promise<Buffer> {
  // Simulate DOCX generation delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // In production, you would:
  // 1. Use the 'docx' library to create structured document
  // 2. Apply template styling
  // 3. Handle sections, paragraphs, tables
  // 4. Export as buffer

  /*
  Example with docx library:

  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: `${resume.personalInfo.firstName} ${resume.personalInfo.lastName}`,
          heading: HeadingLevel.HEADING_1
        }),
        // ... more content
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
  */

  // For demonstration, return text as buffer
  const textContent = formatAsText(resume);
  return Buffer.from(textContent, 'utf-8');
}

// POST: Export resume
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(req);
    if (!authResult.authenticated || !authResult.user) {
      return errorResponse(authResult.error || 'Unauthorized', 401);
    }

    const user = authResult.user;

    // Rate limiting (stricter for export operations)
    if (!checkRateLimit(`export_${user.id}`, 10, 60000)) {
      return errorResponse('Rate limit exceeded for exports', 429);
    }

    // Parse and validate request
    const body = await req.json();
    const validation = exportSchema.safeParse(body);
    if (!validation.success) {
      return handleValidationError(validation.error);
    }

    const { resumeId, format, template, includePhoto, colorScheme, fontSize } = validation.data;

    // Connect to database
    await connectDB();

    // Fetch resume
    const resumeDoc = await ResumeModel.findOne({
      _id: resumeId,
      userId: user.id,
    }).lean();

    if (!resumeDoc) {
      return errorResponse('Resume not found', 404);
    }

    const resume = resumeApiToUi(resumeDoc);

    // Prepare export options
    const exportOptions = {
      template: template || 'modern',
      includePhoto: includePhoto || false,
      colorScheme: colorScheme || 'default',
      fontSize: fontSize || 'medium',
      pageSize: 'A4',
      margins: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
        unit: 'mm'
      },
      color: true
    };

    let fileBuffer: Buffer;
    let mimeType: string;
    let extension: string;

    // Generate file based on format
    switch (format) {
      case 'pdf':
        fileBuffer = await generatePDF(resume, template || 'modern', exportOptions);
        mimeType = 'application/pdf';
        extension = 'pdf';
        break;

      case 'docx':
        fileBuffer = await generateDOCX(resume, template || 'modern', exportOptions);
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        extension = 'docx';
        break;

      case 'txt':
        fileBuffer = Buffer.from(formatAsText(resume), 'utf-8');
        mimeType = 'text/plain';
        extension = 'txt';
        break;

      default:
        return errorResponse('Unsupported export format', 400);
    }

    // Generate filename
    const baseName =
      resume.personalInfo.fullName ||
      `${resume.personalInfo.firstName || ''} ${resume.personalInfo.lastName || ''}`.trim() ||
      'resume';

    const fileName = `${baseName}_Resume.${extension}`
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');

    // Log export
    console.log(`User ${user.id} exported resume ${resumeId} as ${format}`);

    // In production, you might:
    // 1. Upload to S3/Cloud Storage and return URL
    // 2. Stream the file directly
    // For now, we'll return the file as base64 or stream it

    // Option 1: Return as downloadable file
    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });

    // Option 2: Return metadata with download URL (if uploaded to storage)
    /*
    const downloadUrl = await uploadToStorage(fileBuffer, fileName);

    return successResponse({
      success: true,
      format,
      fileName,
      downloadUrl,
      size: fileBuffer.length,
      expiresAt: new Date(Date.now() + 3600000) // 1 hour
    });
    */

  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS: Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
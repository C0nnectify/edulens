// GET /api/resume/templates - Get all available resume templates

import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateRequest,
  errorResponse,
  successResponse,
  handleApiError,
  checkRateLimit,
} from '@/lib/api-utils';
import { ResumeTemplate } from '@/types/resume';

// Define available resume templates
const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: 'modern',
    name: 'Modern Professional',
    description: 'Clean and contemporary design with subtle color accents. Perfect for tech and creative industries.',
    preview: '/templates/modern-preview.png',
    category: 'modern',
    isPremium: false,
    features: [
      'Two-column layout',
      'Color-coded sections',
      'Icon support',
      'ATS-friendly structure'
    ]
  },
  {
    id: 'classic',
    name: 'Classic Elegance',
    description: 'Traditional single-column format with clean typography. Ideal for conservative industries.',
    preview: '/templates/classic-preview.png',
    category: 'professional',
    isPremium: false,
    features: [
      'Single-column layout',
      'Traditional formatting',
      'Serif typography',
      'Maximum ATS compatibility'
    ]
  },
  {
    id: 'ats-optimized',
    name: 'ATS Optimized',
    description: 'Specifically designed for Applicant Tracking Systems with maximum parseability.',
    preview: '/templates/ats-preview.png',
    category: 'ats',
    isPremium: false,
    features: [
      'Simple formatting',
      'Standard section headers',
      'No graphics or tables',
      '99% ATS pass rate'
    ]
  },
  {
    id: 'creative',
    name: 'Creative Portfolio',
    description: 'Bold and artistic design for designers, artists, and creative professionals.',
    preview: '/templates/creative-preview.png',
    category: 'creative',
    isPremium: true,
    features: [
      'Unique layout',
      'Custom color schemes',
      'Portfolio integration',
      'Visual hierarchy emphasis'
    ]
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Clean, distraction-free design that lets your content shine.',
    preview: '/templates/minimalist-preview.png',
    category: 'modern',
    isPremium: false,
    features: [
      'Minimal design elements',
      'Monochrome palette',
      'High readability',
      'Excellent for printing'
    ]
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Professional and authoritative design for senior-level positions.',
    preview: '/templates/executive-preview.png',
    category: 'professional',
    isPremium: true,
    features: [
      'Sophisticated layout',
      'Executive summary section',
      'Achievement highlights',
      'Premium typography'
    ]
  },
  {
    id: 'tech-modern',
    name: 'Tech Modern',
    description: 'Technology-focused design with modern aesthetics and clean code-like structure.',
    preview: '/templates/tech-modern-preview.png',
    category: 'tech',
    isPremium: true,
    features: [
      'Tech-optimized layout',
      'Skills matrix display',
      'Project showcase',
      'GitHub integration ready'
    ]
  },
  {
    id: 'academic',
    name: 'Academic',
    description: 'Structured format ideal for academic positions, research roles, and educators.',
    preview: '/templates/academic-preview.png',
    category: 'professional',
    isPremium: false,
    features: [
      'Publication section',
      'Research emphasis',
      'Conference listings',
      'Teaching experience highlight'
    ]
  },
  {
    id: 'startup',
    name: 'Startup Ready',
    description: 'Dynamic and flexible design perfect for startup environments and fast-paced roles.',
    preview: '/templates/startup-preview.png',
    category: 'modern',
    isPremium: true,
    features: [
      'Impact-focused layout',
      'Metrics highlighted',
      'Startup experience emphasis',
      'Growth trajectory showcase'
    ]
  },
  {
    id: 'international',
    name: 'International',
    description: 'Multi-language friendly format suitable for global opportunities.',
    preview: '/templates/international-preview.png',
    category: 'professional',
    isPremium: true,
    features: [
      'Multi-language support',
      'International format',
      'Photo inclusion option',
      'Cultural adaptability'
    ]
  }
];

// GET: Get all available templates
export async function GET(req: NextRequest) {
  try {
    // Authenticate user (optional for browsing templates)
    const authResult = await authenticateRequest(req);

    // Rate limiting
    const userId = authResult.authenticated ? authResult.user.id : req.ip || 'anonymous';
    if (!checkRateLimit(`templates_${userId}`, 50, 60000)) {
      return errorResponse('Rate limit exceeded', 429);
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get('category');
    const premiumOnly = searchParams.get('premium') === 'true';
    const freeOnly = searchParams.get('free') === 'true';

    // Filter templates
    let filteredTemplates = [...RESUME_TEMPLATES];

    if (category) {
      filteredTemplates = filteredTemplates.filter(t =>
        t.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (premiumOnly) {
      filteredTemplates = filteredTemplates.filter(t => t.isPremium);
    }

    if (freeOnly) {
      filteredTemplates = filteredTemplates.filter(t => !t.isPremium);
    }

    // Get unique categories
    const categories = [...new Set(RESUME_TEMPLATES.map(t => t.category))];

    // Log access
    console.log(`Templates requested: ${filteredTemplates.length} templates returned`);

    return successResponse({
      templates: filteredTemplates,
      total: filteredTemplates.length,
      categories,
      stats: {
        totalTemplates: RESUME_TEMPLATES.length,
        freeTemplates: RESUME_TEMPLATES.filter(t => !t.isPremium).length,
        premiumTemplates: RESUME_TEMPLATES.filter(t => t.isPremium).length
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
}

// OPTIONS: Handle CORS preflight
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
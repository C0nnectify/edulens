/**
 * OCR Text Extraction API Route
 *
 * POST /api/ocr/extract
 * Extract text from images using OCR.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ApiSuccessResponse, OcrExtractionResponse } from '@/types/document';
import { defaultOcrService, detectTextInImage } from '@/lib/document/ocr-service';
import {
  requireAuth,
  createErrorResponse,
  createValidationErrorResponse,
  createServerErrorResponse,
} from '@/lib/middleware/document-auth';
import { ocrExtractionSchema } from '@/lib/validations/document';

/**
 * Handle OCR extraction
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    // Parse multipart form data
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const language = formData.get('language') as string | null;
    const enhanceImage = formData.get('enhanceImage') === 'true';

    if (!imageFile) {
      return createErrorResponse('MISSING_IMAGE', 'No image provided', 400);
    }

    // Validate options
    const validation = ocrExtractionSchema.safeParse({
      language: language || 'eng',
      enhanceImage,
    });

    if (!validation.success) {
      const errors = validation.error.errors.map(
        err => `${err.path.join('.')}: ${err.message}`
      );
      return createValidationErrorResponse(errors);
    }

    // Convert image to buffer
    const buffer = Buffer.from(await imageFile.arrayBuffer());

    // Extract text
    const result = await defaultOcrService.extractText({
      image: buffer,
      language: validation.data.language,
      enhanceImage: validation.data.enhanceImage,
    });

    // Detect text quality
    const textDetection = detectTextInImage(result);

    const response: ApiSuccessResponse<OcrExtractionResponse> = {
      success: true,
      data: result,
      metadata: {
        hasText: textDetection.hasText,
        textDensity: textDetection.textDensity,
        quality: textDetection.quality,
        processingTime: `${result.processingTime}ms`,
      },
    };

    return NextResponse.json(response, {
      headers: {
        'X-OCR-Confidence': String(result.confidence),
        'X-Text-Detected': String(textDetection.hasText),
        'X-Quality': textDetection.quality,
        'X-Processing-Time': `${result.processingTime}ms`,
      },
    });
  } catch (error: any) {
    console.error('OCR extraction error:', error);
    return createServerErrorResponse(error);
  }
}

/**
 * Get endpoint info
 */
export async function GET(request: NextRequest) {
  const info = {
    endpoint: '/api/ocr/extract',
    method: 'POST',
    description: 'Extract text from images using OCR',
    authentication: 'Required',
    contentType: 'multipart/form-data',
    parameters: {
      image: {
        type: 'File',
        required: true,
        description: 'Image file to extract text from',
        supportedFormats: ['JPEG', 'PNG', 'GIF', 'WEBP', 'TIFF'],
      },
      language: {
        type: 'string',
        required: false,
        default: 'eng',
        description: 'OCR language code (ISO 639-2)',
        examples: ['eng', 'spa', 'fra', 'deu', 'chi_sim'],
      },
      enhanceImage: {
        type: 'boolean',
        required: false,
        default: true,
        description: 'Apply image enhancement before OCR',
      },
    },
    providers: {
      current: 'tesseract',
      supported: ['tesseract', 'google-vision', 'aws-textract', 'azure-vision'],
    },
  };

  return NextResponse.json(info);
}

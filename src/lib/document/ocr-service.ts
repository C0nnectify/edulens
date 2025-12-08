/**
 * OCR (Optical Character Recognition) Service
 *
 * Service for extracting text from images using various OCR providers.
 * Supports Tesseract.js (local), Google Cloud Vision, AWS Textract, etc.
 */

import type { OcrExtractionRequest, OcrExtractionResponse, OcrBlock } from '@/types/document';

// ============================================================================
// Configuration
// ============================================================================

export interface OcrConfig {
  provider: 'tesseract' | 'google-vision' | 'aws-textract' | 'azure-vision';
  language?: string;
  apiKey?: string;
  enhanceImage?: boolean;
}

const DEFAULT_CONFIG: OcrConfig = {
  provider: 'tesseract',
  language: 'eng',
  enhanceImage: true,
};

// ============================================================================
// OCR Service Class
// ============================================================================

export class OcrService {
  private config: OcrConfig;
  private tesseractWorker: any = null;

  constructor(config: Partial<OcrConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (!this.config.apiKey) {
      this.config.apiKey = this.getApiKey();
    }
  }

  /**
   * Get API key from environment based on provider
   */
  private getApiKey(): string {
    switch (this.config.provider) {
      case 'google-vision':
        return process.env.GOOGLE_CLOUD_API_KEY || '';
      case 'aws-textract':
        return process.env.AWS_ACCESS_KEY_ID || '';
      case 'azure-vision':
        return process.env.AZURE_VISION_KEY || '';
      default:
        return '';
    }
  }

  /**
   * Extract text from image
   */
  async extractText(request: OcrExtractionRequest): Promise<OcrExtractionResponse> {
    const startTime = Date.now();

    try {
      const result = await this.extractWithProvider(request);
      const processingTime = Date.now() - startTime;

      return {
        ...result,
        processingTime,
      };
    } catch (error: any) {
      throw new Error(`OCR extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text with specific provider
   */
  private async extractWithProvider(
    request: OcrExtractionRequest
  ): Promise<Omit<OcrExtractionResponse, 'processingTime'>> {
    switch (this.config.provider) {
      case 'tesseract':
        return this.extractWithTesseract(request);
      case 'google-vision':
        return this.extractWithGoogleVision(request);
      case 'aws-textract':
        return this.extractWithAWSTextract(request);
      case 'azure-vision':
        return this.extractWithAzureVision(request);
      default:
        throw new Error(`Unsupported OCR provider: ${this.config.provider}`);
    }
  }

  /**
   * Extract text using Tesseract.js (local)
   */
  private async extractWithTesseract(
    request: OcrExtractionRequest
  ): Promise<Omit<OcrExtractionResponse, 'processingTime'>> {
    try {
      // Dynamic import to avoid bundling issues
      const Tesseract = await import('tesseract.js');

      // Initialize worker if not already done
      if (!this.tesseractWorker) {
        this.tesseractWorker = await Tesseract.createWorker(
          request.language || this.config.language || 'eng'
        );
      }

      // Convert image to appropriate format
      const imageData = this.prepareImageData(request.image);

      // Perform OCR
      const result = await this.tesseractWorker.recognize(imageData);

      // Extract blocks
      const blocks: OcrBlock[] = result.data.lines.map((line: any) => ({
        text: line.text,
        confidence: line.confidence,
        boundingBox: {
          x: line.bbox.x0,
          y: line.bbox.y0,
          width: line.bbox.x1 - line.bbox.x0,
          height: line.bbox.y1 - line.bbox.y0,
        },
        type: 'line' as const,
      }));

      return {
        text: result.data.text,
        confidence: result.data.confidence,
        blocks,
      };
    } catch (error: any) {
      throw new Error(`Tesseract OCR failed: ${error.message}`);
    }
  }

  /**
   * Extract text using Google Cloud Vision API
   */
  private async extractWithGoogleVision(
    request: OcrExtractionRequest
  ): Promise<Omit<OcrExtractionResponse, 'processingTime'>> {
    if (!this.config.apiKey) {
      throw new Error('Google Cloud Vision API key is required');
    }

    try {
      const imageData = this.prepareImageDataForAPI(request.image);

      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.config.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  content: imageData,
                },
                features: [
                  {
                    type: 'DOCUMENT_TEXT_DETECTION',
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Google Vision API error: ${response.statusText}`);
      }

      const data = await response.json();
      const textAnnotations = data.responses[0].textAnnotations;

      if (!textAnnotations || textAnnotations.length === 0) {
        return {
          text: '',
          confidence: 0,
          blocks: [],
        };
      }

      // First annotation contains full text
      const fullText = textAnnotations[0].description;

      // Remaining annotations are individual blocks
      const blocks: OcrBlock[] = textAnnotations.slice(1).map((annotation: any) => {
        const vertices = annotation.boundingPoly.vertices;
        return {
          text: annotation.description,
          confidence: annotation.confidence ? annotation.confidence * 100 : 100,
          boundingBox: {
            x: vertices[0].x || 0,
            y: vertices[0].y || 0,
            width: (vertices[1].x || 0) - (vertices[0].x || 0),
            height: (vertices[2].y || 0) - (vertices[0].y || 0),
          },
          type: 'word' as const,
        };
      });

      return {
        text: fullText,
        confidence: 100, // Google Vision doesn't provide overall confidence
        blocks,
      };
    } catch (error: any) {
      throw new Error(`Google Vision OCR failed: ${error.message}`);
    }
  }

  /**
   * Extract text using AWS Textract
   */
  private async extractWithAWSTextract(
    request: OcrExtractionRequest
  ): Promise<Omit<OcrExtractionResponse, 'processingTime'>> {
    // TODO: Implement AWS Textract integration
    throw new Error('AWS Textract integration not yet implemented');
  }

  /**
   * Extract text using Azure Computer Vision
   */
  private async extractWithAzureVision(
    request: OcrExtractionRequest
  ): Promise<Omit<OcrExtractionResponse, 'processingTime'>> {
    // TODO: Implement Azure Vision integration
    throw new Error('Azure Vision integration not yet implemented');
  }

  /**
   * Prepare image data for processing
   */
  private prepareImageData(image: File | Buffer | string): Buffer | string {
    if (typeof image === 'string') {
      // Assume it's a base64 string or file path
      if (image.startsWith('data:')) {
        // Convert data URL to buffer
        const base64Data = image.split(',')[1];
        return Buffer.from(base64Data, 'base64');
      }
      return image; // File path
    }

    return image;
  }

  /**
   * Prepare image data for API calls (base64)
   */
  private prepareImageDataForAPI(image: File | Buffer | string): string {
    if (typeof image === 'string') {
      if (image.startsWith('data:')) {
        // Extract base64 data
        return image.split(',')[1];
      }
      // Assume it's already base64
      return image;
    }

    // Convert buffer to base64
    return image.toString('base64');
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
      this.tesseractWorker = null;
    }
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Preprocess image for better OCR results
 */
export async function preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
  try {
    // Dynamic import to avoid bundling issues
    const sharp = await import('sharp');

    // Apply preprocessing: grayscale, contrast, resize
    const processed = await sharp.default(imageBuffer)
      .grayscale()
      .normalize()
      .sharpen()
      .toBuffer();

    return processed;
  } catch (error) {
    // If sharp is not available, return original
    console.warn('Image preprocessing not available:', error);
    return imageBuffer;
  }
}

/**
 * Detect if image contains text
 */
export function detectTextInImage(ocrResult: OcrExtractionResponse): {
  hasText: boolean;
  textDensity: number;
  quality: 'high' | 'medium' | 'low';
} {
  const hasText = ocrResult.text.trim().length > 0;
  const textDensity = ocrResult.text.length / (ocrResult.blocks?.length || 1);

  let quality: 'high' | 'medium' | 'low' = 'low';
  if (ocrResult.confidence > 80) {
    quality = 'high';
  } else if (ocrResult.confidence > 60) {
    quality = 'medium';
  }

  return {
    hasText,
    textDensity,
    quality,
  };
}

/**
 * Extract structured data from OCR blocks
 */
export function extractStructuredData(blocks: OcrBlock[]): {
  paragraphs: string[];
  headings: string[];
  tables: string[][];
} {
  const paragraphs: string[] = [];
  const headings: string[] = [];
  const tables: string[][] = [];

  let currentParagraph = '';

  for (const block of blocks) {
    const text = block.text.trim();

    // Simple heuristic for headings (short, high confidence)
    if (text.length < 50 && block.confidence > 90) {
      if (currentParagraph) {
        paragraphs.push(currentParagraph);
        currentParagraph = '';
      }
      headings.push(text);
    } else {
      currentParagraph += (currentParagraph ? ' ' : '') + text;
    }
  }

  if (currentParagraph) {
    paragraphs.push(currentParagraph);
  }

  // TODO: Implement table detection

  return {
    paragraphs,
    headings,
    tables,
  };
}

// ============================================================================
// Export Default Instance
// ============================================================================

/**
 * Default OCR service instance
 */
export const defaultOcrService = new OcrService();

/**
 * Extract text using default service
 */
export async function extractTextFromImage(
  image: File | Buffer | string,
  language?: string
): Promise<OcrExtractionResponse> {
  return defaultOcrService.extractText({
    image,
    language,
    enhanceImage: true,
  });
}

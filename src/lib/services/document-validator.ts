/**
 * Document Validator Service
 * Validates documents against university requirements
 */

import type { DocumentRequirement, DocumentValidation, ValidationResult } from '@/types/document-requirements';

export interface DocumentFile {
  name: string;
  size: number; // in bytes
  type: string; // MIME type
  path?: string;
  content?: Buffer | string;
}

export class DocumentValidatorService {
  /**
   * Validate document against requirements
   */
  async validateDocument(
    file: DocumentFile,
    requirement: DocumentRequirement
  ): Promise<DocumentValidation> {
    const validations: ValidationResult[] = [];

    // Format validation
    validations.push(this.validateFormat(file, requirement));

    // Size validation
    validations.push(this.validateSize(file, requirement));

    // Page count validation (for PDFs)
    if (file.type === 'application/pdf' && (requirement.maxPages || requirement.minPages)) {
      const pageValidation = await this.validatePageCount(file, requirement);
      validations.push(pageValidation);
    }

    // Word count validation (for text documents)
    if (
      (file.type === 'application/pdf' ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') &&
      (requirement.wordCountMin || requirement.wordCountMax)
    ) {
      const wordCountValidation = await this.validateWordCount(file, requirement);
      validations.push(wordCountValidation);
    }

    // Content validation (basic checks)
    if (requirement.type === 'sop' || requirement.type === 'resume') {
      const contentValidation = await this.validateContent(file, requirement);
      validations.push(contentValidation);
    }

    // Determine overall status
    const overallStatus = this.determineOverallStatus(validations);

    return {
      documentId: crypto.randomUUID(), // In production, use actual document ID
      validations,
      overallStatus,
      validatedAt: new Date().toISOString(),
    };
  }

  /**
   * Validate file format
   */
  private validateFormat(file: DocumentFile, requirement: DocumentRequirement): ValidationResult {
    const fileExt = file.name.split('.').pop()?.toUpperCase() || '';

    const allowedFormats = requirement.formats.map((f) => f.toUpperCase());

    // Check MIME type as well
    const mimeTypeMap: Record<string, string> = {
      PDF: 'application/pdf',
      DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      DOC: 'application/msword',
      TXT: 'text/plain',
      JPG: 'image/jpeg',
      JPEG: 'image/jpeg',
      PNG: 'image/png',
    };

    const isFormatValid =
      allowedFormats.includes(fileExt) ||
      allowedFormats.some((format) => mimeTypeMap[format] === file.type);

    if (isFormatValid) {
      return {
        type: 'format',
        status: 'pass',
        message: `File format is valid (${fileExt})`,
      };
    }

    return {
      type: 'format',
      status: 'fail',
      message: `Invalid file format. Expected: ${allowedFormats.join(', ')}, Got: ${fileExt}`,
      suggestion: `Please convert your file to one of the accepted formats: ${allowedFormats.join(', ')}`,
    };
  }

  /**
   * Validate file size
   */
  private validateSize(file: DocumentFile, requirement: DocumentRequirement): ValidationResult {
    if (!requirement.maxSizeMB) {
      return {
        type: 'size',
        status: 'pass',
        message: 'No size limit specified',
      };
    }

    const fileSizeMB = file.size / (1024 * 1024);
    const maxSizeMB = requirement.maxSizeMB;

    if (fileSizeMB <= maxSizeMB) {
      return {
        type: 'size',
        status: 'pass',
        message: `File size is acceptable (${fileSizeMB.toFixed(2)} MB)`,
      };
    }

    return {
      type: 'size',
      status: 'fail',
      message: `File size exceeds limit. Maximum: ${maxSizeMB} MB, Actual: ${fileSizeMB.toFixed(2)} MB`,
      suggestion: `Please compress your file or reduce its size to under ${maxSizeMB} MB`,
    };
  }

  /**
   * Validate page count (requires PDF parsing)
   */
  private async validatePageCount(
    file: DocumentFile,
    requirement: DocumentRequirement
  ): Promise<ValidationResult> {
    try {
      // In production, use a PDF parsing library like pdf-parse
      // For now, simulate page count detection
      const pageCount = await this.getPageCount(file);

      const { minPages, maxPages } = requirement;

      if (minPages && pageCount < minPages) {
        return {
          type: 'pages',
          status: 'fail',
          message: `Document has too few pages. Minimum: ${minPages}, Actual: ${pageCount}`,
          details: { pageCount, minPages, maxPages },
        };
      }

      if (maxPages && pageCount > maxPages) {
        return {
          type: 'pages',
          status: 'fail',
          message: `Document has too many pages. Maximum: ${maxPages}, Actual: ${pageCount}`,
          details: { pageCount, minPages, maxPages },
          suggestion: `Please reduce your document to ${maxPages} pages or fewer`,
        };
      }

      return {
        type: 'pages',
        status: 'pass',
        message: `Page count is acceptable (${pageCount} pages)`,
        details: { pageCount },
      };
    } catch (error) {
      return {
        type: 'pages',
        status: 'warning',
        message: 'Could not validate page count',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  /**
   * Validate word count (requires text extraction)
   */
  private async validateWordCount(
    file: DocumentFile,
    requirement: DocumentRequirement
  ): Promise<ValidationResult> {
    try {
      // In production, use OCR or text extraction
      const wordCount = await this.getWordCount(file);

      const { wordCountMin, wordCountMax } = requirement;

      if (wordCountMin && wordCount < wordCountMin) {
        return {
          type: 'word_count',
          status: 'fail',
          message: `Document is too short. Minimum: ${wordCountMin} words, Actual: ${wordCount} words`,
          details: { wordCount, wordCountMin, wordCountMax },
          suggestion: `Please expand your document to at least ${wordCountMin} words`,
        };
      }

      if (wordCountMax && wordCount > wordCountMax) {
        return {
          type: 'word_count',
          status: 'fail',
          message: `Document is too long. Maximum: ${wordCountMax} words, Actual: ${wordCount} words`,
          details: { wordCount, wordCountMin, wordCountMax },
          suggestion: `Please reduce your document to ${wordCountMax} words or fewer`,
        };
      }

      return {
        type: 'word_count',
        status: 'pass',
        message: `Word count is acceptable (${wordCount} words)`,
        details: { wordCount },
      };
    } catch (error) {
      return {
        type: 'word_count',
        status: 'warning',
        message: 'Could not validate word count',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  /**
   * Validate content (basic checks)
   */
  private async validateContent(
    file: DocumentFile,
    requirement: DocumentRequirement
  ): Promise<ValidationResult> {
    try {
      // Extract text from document
      const text = await this.extractText(file);

      const issues: string[] = [];
      const warnings: string[] = [];

      // Check for placeholder text
      const placeholders = [
        '[YOUR NAME]',
        '[INSERT HERE]',
        '[TODO]',
        'Lorem ipsum',
        'REPLACE THIS',
      ];
      for (const placeholder of placeholders) {
        if (text.toLowerCase().includes(placeholder.toLowerCase())) {
          issues.push(`Found placeholder text: "${placeholder}"`);
        }
      }

      // Check for minimum content
      if (text.trim().length < 100) {
        issues.push('Document appears to be empty or too short');
      }

      // Check for university name mismatch (for SOPs)
      if (requirement.type === 'sop') {
        // This would require university context
        // For now, just warn if no university is mentioned
        const hasUniversityMention = /university|college|institution/i.test(text);
        if (!hasUniversityMention) {
          warnings.push('No university or institution mentioned in SOP');
        }
      }

      if (issues.length > 0) {
        return {
          type: 'content',
          status: 'fail',
          message: 'Content validation failed',
          details: { issues, warnings },
          suggestion: 'Please review and fix the issues before submitting',
        };
      }

      if (warnings.length > 0) {
        return {
          type: 'content',
          status: 'warning',
          message: 'Content validation passed with warnings',
          details: { warnings },
        };
      }

      return {
        type: 'content',
        status: 'pass',
        message: 'Content validation passed',
      };
    } catch (error) {
      return {
        type: 'content',
        status: 'warning',
        message: 'Could not validate content',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  /**
   * Determine overall validation status
   */
  private determineOverallStatus(validations: ValidationResult[]): DocumentValidation['overallStatus'] {
    const hasFail = validations.some((v) => v.status === 'fail');
    const hasWarning = validations.some((v) => v.status === 'warning');

    if (hasFail) return 'invalid';
    if (hasWarning) return 'has_warnings';
    return 'valid';
  }

  /**
   * Get page count from PDF (mock implementation)
   */
  private async getPageCount(file: DocumentFile): Promise<number> {
    // TODO: In production, use pdf-parse or similar library
    // const pdfParse = require('pdf-parse');
    // const data = await pdfParse(file.content);
    // return data.numpages;

    // For now, return mock data
    return Math.floor(Math.random() * 5) + 1;
  }

  /**
   * Get word count from document (mock implementation)
   */
  private async getWordCount(file: DocumentFile): Promise<number> {
    // TODO: In production, extract text and count words
    const text = await this.extractText(file);
    const words = text.split(/\s+/).filter((word) => word.length > 0);
    return words.length;
  }

  /**
   * Extract text from document (mock implementation)
   */
  private async extractText(file: DocumentFile): Promise<string> {
    // TODO: In production, use appropriate text extraction
    // - For PDF: pdf-parse or pdfjs-dist
    // - For DOCX: mammoth or docx
    // - Use OCR service for images

    // For now, return mock text
    return 'This is mock extracted text from the document.';
  }

  /**
   * Batch validate multiple documents
   */
  async validateMultiple(
    files: Array<{ file: DocumentFile; requirement: DocumentRequirement }>
  ): Promise<DocumentValidation[]> {
    return Promise.all(
      files.map(({ file, requirement }) => this.validateDocument(file, requirement))
    );
  }
}

// Export singleton
export const documentValidatorService = new DocumentValidatorService();

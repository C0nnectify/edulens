/**
 * Cover Letter Type Definitions
 *
 * TypeScript types for cover letter builder
 */

export interface CoverLetter {
  id?: string;
  resumeId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;

  // Header (matches resume)
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  senderAddress?: string;

  // Recipient
  recipientName?: string;
  recipientTitle?: string;
  companyName: string;
  companyAddress?: string;

  // Date
  date: Date;

  // Greeting
  greeting: string; // e.g., "Dear Hiring Manager,"

  // Content
  opening: string; // Opening paragraph
  body: string[]; // Body paragraphs (2-3)
  closing: string; // Closing paragraph

  // Signature
  signatureText: string; // e.g., "Sincerely,"
  signatureName: string;

  // Metadata
  jobTitle?: string;
  template: CoverLetterTemplate;
}

export enum CoverLetterTemplate {
  PROFESSIONAL = 'professional',
  MODERN = 'modern',
  CREATIVE = 'creative',
  MINIMAL = 'minimal',
}

export interface CoverLetterSection {
  id: string;
  type: 'opening' | 'body' | 'closing';
  content: string;
  placeholder?: string;
  aiPrompt?: string;
}

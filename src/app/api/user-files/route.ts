/**
 * Centralized User Files API with MongoDB and ChromaDB
 * 
 * This API provides a unified interface for managing user files across
 * the application with:
 * - MongoDB for file metadata storage
 * - ChromaDB for semantic search embeddings
 * - OCR for scanned PDFs and images
 * - Intelligent text extraction and processing
 * 
 * Files uploaded here are accessible in:
 * - Document Builder (SOP, LOR, CV, Resume creation)
 * - Document Analysis
 * - Chat attachments
 * - Document Vault
 */

import { NextRequest, NextResponse } from 'next/server';
import { FileProcessingService } from '@/lib/services/fileProcessing';

/**
 * GET /api/user-files
 * Fetches all files uploaded by the current user from MongoDB
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const searchParams = request.nextUrl.searchParams;
    
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    const documentType = searchParams.get('documentType') || undefined;
    const tagsParam = searchParams.get('tags');
    const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : undefined;
    const sortBy = (searchParams.get('sortBy') as 'uploadedAt' | 'fileName' | 'fileSize') || 'uploadedAt';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
    const search = searchParams.get('search') || undefined;

    let result;
    
    // If search query provided, use semantic search
    if (search) {
      const files = await FileProcessingService.searchFiles(userId, search, {
        limit,
        documentType,
        tags,
      });
      result = {
        files,
        total: files.length,
      };
    } else {
      // Regular fetch from MongoDB
      result = await FileProcessingService.getUserFiles(userId, {
        limit,
        skip,
        documentType,
        tags,
        sortBy,
        sortOrder,
      });
    }

    // Transform to API format
    const apiFiles = result.files.map((f) => ({
      id: f.fileId,
      name: f.fileName,
      type: f.mimeType,
      size: f.fileSize,
      uploadedAt: f.uploadedAt.toISOString(),
      documentType: f.documentType,
      tags: f.tags,
      textPreview: f.textPreview,
      processingStatus: f.processingStatus,
      ocrStatus: f.ocrStatus,
      embeddingStatus: f.embeddingStatus,
      wordCount: f.wordCount,
      chunkCount: f.chunkCount,
      category: f.category,
      source: 'mongodb',
    }));

    return NextResponse.json({
      success: true,
      files: apiFiles,
      total: result.total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching user files:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch files',
        files: [] 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user-files/upload
 * Upload a file with intelligent processing:
 * - Stores metadata in MongoDB
 * - Extracts text (with OCR for images/scanned PDFs)
 * - Generates embeddings in ChromaDB
 * - Makes file accessible across entire application
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const docType = formData.get('doc_type') as string || 'other';
    const tagsParam = formData.get('tags') as string || '';
    const generateEmbeddings = formData.get('generate_embeddings') !== 'false';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'image/jpeg',
      'image/png',
      'image/jpg',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unsupported file type. Allowed: PDF, Word, Text, Markdown, Images' 
        },
        { status: 400 }
      );
    }

    const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : [];

    // Process file (text extraction, OCR, embeddings)
    const userFile = await FileProcessingService.processFile(file, userId, {
      documentType: docType,
      tags,
      generateEmbeddings,
    });

    return NextResponse.json({
      success: true,
      file: {
        id: userFile.fileId,
        name: userFile.fileName,
        type: userFile.mimeType,
        size: userFile.fileSize,
        uploadedAt: userFile.uploadedAt.toISOString(),
        documentType: userFile.documentType,
        tags: userFile.tags,
        textPreview: userFile.textPreview,
        processingStatus: userFile.processingStatus,
        message: 'File uploaded successfully. Processing in background...',
      },
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to upload file' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user-files/:id
 * Delete a file and its embeddings
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const url = new URL(request.url);
    const fileId = url.searchParams.get('id');

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'File ID required' },
        { status: 400 }
      );
    }

    const deleted = await FileProcessingService.deleteFile(fileId, userId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'File not found or already deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete file' 
      },
      { status: 500 }
    );
  }
}

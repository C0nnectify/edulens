/**
 * Document Chunking Utilities
 *
 * Intelligent text chunking strategies for document processing and embedding.
 */

import type { ChunkingConfig, ChunkMetadata } from '@/types/document';

// ============================================================================
// Default Chunking Configuration
// ============================================================================

export const DEFAULT_CHUNKING_CONFIG: ChunkingConfig = {
  strategy: 'recursive',
  chunkSize: 1000, // ~250 tokens
  chunkOverlap: 200, // 20% overlap
  minChunkSize: 100,
  maxChunkSize: 2000,
  respectParagraphs: true,
  respectSentences: true,
  customSeparators: ['\n\n', '\n', '. ', ' '],
};

// ============================================================================
// Chunk Result Interface
// ============================================================================

export interface ChunkResult {
  content: string;
  metadata: ChunkMetadata;
}

// ============================================================================
// Text Chunking Strategies
// ============================================================================

/**
 * Fixed-size chunking with overlap
 * Simple strategy that splits text into fixed-size chunks
 */
export function fixedSizeChunking(
  text: string,
  config: ChunkingConfig = DEFAULT_CHUNKING_CONFIG
): ChunkResult[] {
  const chunks: ChunkResult[] = [];
  const { chunkSize, chunkOverlap } = config;

  let position = 0;
  let startChar = 0;

  while (startChar < text.length) {
    const endChar = Math.min(startChar + chunkSize, text.length);
    const content = text.slice(startChar, endChar);

    if (content.trim().length > 0) {
      chunks.push({
        content: content.trim(),
        metadata: {
          position,
          startChar,
          endChar,
        },
      });
      position++;
    }

    // Move start position with overlap
    startChar += chunkSize - chunkOverlap;
  }

  return chunks;
}

/**
 * Recursive chunking with separator hierarchy
 * Tries to split on larger separators first, then falls back to smaller ones
 */
export function recursiveChunking(
  text: string,
  config: ChunkingConfig = DEFAULT_CHUNKING_CONFIG
): ChunkResult[] {
  const {
    chunkSize,
    chunkOverlap,
    minChunkSize = 100,
    maxChunkSize = 2000,
    customSeparators = ['\n\n', '\n', '. ', ' '],
  } = config;

  const chunks: ChunkResult[] = [];

  function splitRecursive(
    content: string,
    separators: string[],
    position: number,
    startCharOffset: number = 0
  ): void {
    // If content is small enough, add as chunk
    if (content.length <= chunkSize) {
      if (content.trim().length >= minChunkSize) {
        chunks.push({
          content: content.trim(),
          metadata: {
            position,
            startChar: startCharOffset,
            endChar: startCharOffset + content.length,
          },
        });
      }
      return;
    }

    // Try each separator
    if (separators.length === 0) {
      // No more separators, force split
      const parts = forceSplit(content, chunkSize, chunkOverlap);
      parts.forEach((part, idx) => {
        chunks.push({
          content: part.content.trim(),
          metadata: {
            position: position + idx,
            startChar: startCharOffset + part.start,
            endChar: startCharOffset + part.end,
          },
        });
      });
      return;
    }

    const [separator, ...restSeparators] = separators;
    const parts = content.split(separator);

    let currentChunk = '';
    let currentStartChar = startCharOffset;
    let currentPosition = position;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const potentialChunk = currentChunk + (currentChunk ? separator : '') + part;

      if (potentialChunk.length > maxChunkSize && currentChunk.length > 0) {
        // Current chunk is full, process it
        splitRecursive(currentChunk, restSeparators, currentPosition, currentStartChar);
        currentPosition = chunks.length;
        currentChunk = part;
        currentStartChar = startCharOffset + content.indexOf(part, currentStartChar - startCharOffset);
      } else {
        currentChunk = potentialChunk;
      }
    }

    // Process remaining chunk
    if (currentChunk.trim().length > 0) {
      splitRecursive(currentChunk, restSeparators, currentPosition, currentStartChar);
    }
  }

  splitRecursive(text, customSeparators, 0, 0);
  return chunks;
}

/**
 * Paragraph-based chunking
 * Keeps paragraphs together when possible
 */
export function paragraphChunking(
  text: string,
  config: ChunkingConfig = DEFAULT_CHUNKING_CONFIG
): ChunkResult[] {
  const { chunkSize, chunkOverlap } = config;
  const chunks: ChunkResult[] = [];

  // Split into paragraphs
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

  let currentChunk = '';
  let currentStartChar = 0;
  let position = 0;

  for (const paragraph of paragraphs) {
    const potentialChunk = currentChunk + (currentChunk ? '\n\n' : '') + paragraph;

    if (potentialChunk.length > chunkSize && currentChunk.length > 0) {
      // Save current chunk
      chunks.push({
        content: currentChunk.trim(),
        metadata: {
          position,
          startChar: currentStartChar,
          endChar: currentStartChar + currentChunk.length,
        },
      });
      position++;

      // Start new chunk with overlap
      const overlapText = getOverlapText(currentChunk, chunkOverlap);
      currentChunk = overlapText + paragraph;
      currentStartChar += currentChunk.length - overlapText.length - paragraph.length;
    } else {
      currentChunk = potentialChunk;
    }
  }

  // Add final chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      metadata: {
        position,
        startChar: currentStartChar,
        endChar: currentStartChar + currentChunk.length,
      },
    });
  }

  return chunks;
}

/**
 * Semantic chunking (placeholder - would require NLP)
 * This would use sentence boundaries and semantic similarity
 */
export function semanticChunking(
  text: string,
  config: ChunkingConfig = DEFAULT_CHUNKING_CONFIG
): ChunkResult[] {
  // For now, fall back to sentence-based chunking
  return sentenceBasedChunking(text, config);
}

/**
 * Sentence-based chunking
 * Respects sentence boundaries
 */
export function sentenceBasedChunking(
  text: string,
  config: ChunkingConfig = DEFAULT_CHUNKING_CONFIG
): ChunkResult[] {
  const { chunkSize, chunkOverlap } = config;
  const chunks: ChunkResult[] = [];

  // Simple sentence splitting (can be improved with NLP)
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 0);

  let currentChunk = '';
  let currentStartChar = 0;
  let position = 0;

  for (const sentence of sentences) {
    const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + sentence;

    if (potentialChunk.length > chunkSize && currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: {
          position,
          startChar: currentStartChar,
          endChar: currentStartChar + currentChunk.length,
        },
      });
      position++;

      const overlapText = getOverlapText(currentChunk, chunkOverlap);
      currentChunk = overlapText + sentence;
      currentStartChar += currentChunk.length - overlapText.length - sentence.length;
    } else {
      currentChunk = potentialChunk;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      metadata: {
        position,
        startChar: currentStartChar,
        endChar: currentStartChar + currentChunk.length,
      },
    });
  }

  return chunks;
}

// ============================================================================
// Main Chunking Function
// ============================================================================

/**
 * Chunk text based on configuration strategy
 */
export function chunkText(
  text: string,
  config: ChunkingConfig = DEFAULT_CHUNKING_CONFIG
): ChunkResult[] {
  // Normalize text
  const normalizedText = normalizeText(text);

  // Select chunking strategy
  switch (config.strategy) {
    case 'fixed':
      return fixedSizeChunking(normalizedText, config);
    case 'paragraph':
      return paragraphChunking(normalizedText, config);
    case 'semantic':
      return semanticChunking(normalizedText, config);
    case 'recursive':
    default:
      return recursiveChunking(normalizedText, config);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalize text for consistent chunking
 */
export function normalizeText(text: string): string {
  return (
    text
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      // Remove excessive whitespace
      .replace(/[ \t]+/g, ' ')
      // Normalize multiple newlines
      .replace(/\n{3,}/g, '\n\n')
      // Trim
      .trim()
  );
}

/**
 * Get overlap text from end of chunk
 */
function getOverlapText(text: string, overlapSize: number): string {
  if (text.length <= overlapSize) {
    return text;
  }

  // Try to find a sentence boundary
  const overlapText = text.slice(-overlapSize);
  const sentenceMatch = overlapText.match(/[.!?]\s+/);

  if (sentenceMatch && sentenceMatch.index !== undefined) {
    return overlapText.slice(sentenceMatch.index + sentenceMatch[0].length);
  }

  return overlapText;
}

/**
 * Force split text into chunks (when no good separators found)
 */
function forceSplit(
  text: string,
  chunkSize: number,
  chunkOverlap: number
): Array<{ content: string; start: number; end: number }> {
  const parts: Array<{ content: string; start: number; end: number }> = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    parts.push({
      content: text.slice(start, end),
      start,
      end,
    });
    start += chunkSize - chunkOverlap;
  }

  return parts;
}

// ============================================================================
// Chunk Quality Assessment
// ============================================================================

/**
 * Assess chunk quality
 */
export function assessChunkQuality(chunk: ChunkResult): {
  score: number; // 0-1
  issues: string[];
} {
  const issues: string[] = [];
  let score = 1.0;

  // Check for minimum content
  if (chunk.content.length < 50) {
    issues.push('Chunk is very short');
    score -= 0.3;
  }

  // Check for incomplete sentences at boundaries
  const startsWithLowercase = /^[a-z]/.test(chunk.content);
  const endsWithoutPunctuation = !/[.!?]$/.test(chunk.content.trim());

  if (startsWithLowercase) {
    issues.push('Chunk starts mid-sentence');
    score -= 0.2;
  }

  if (endsWithoutPunctuation) {
    issues.push('Chunk ends mid-sentence');
    score -= 0.2;
  }

  // Check for excessive whitespace
  const whitespaceRatio = (chunk.content.match(/\s/g) || []).length / chunk.content.length;
  if (whitespaceRatio > 0.5) {
    issues.push('Excessive whitespace');
    score -= 0.2;
  }

  return {
    score: Math.max(0, score),
    issues,
  };
}

/**
 * Get chunking statistics
 */
export function getChunkingStats(chunks: ChunkResult[]): {
  totalChunks: number;
  avgChunkSize: number;
  minChunkSize: number;
  maxChunkSize: number;
  totalCharacters: number;
  avgQualityScore: number;
} {
  if (chunks.length === 0) {
    return {
      totalChunks: 0,
      avgChunkSize: 0,
      minChunkSize: 0,
      maxChunkSize: 0,
      totalCharacters: 0,
      avgQualityScore: 0,
    };
  }

  const sizes = chunks.map(c => c.content.length);
  const qualities = chunks.map(c => assessChunkQuality(c).score);

  return {
    totalChunks: chunks.length,
    avgChunkSize: sizes.reduce((a, b) => a + b, 0) / sizes.length,
    minChunkSize: Math.min(...sizes),
    maxChunkSize: Math.max(...sizes),
    totalCharacters: sizes.reduce((a, b) => a + b, 0),
    avgQualityScore: qualities.reduce((a, b) => a + b, 0) / qualities.length,
  };
}

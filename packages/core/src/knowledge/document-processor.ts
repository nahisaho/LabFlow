/**
 * Document Processor
 *
 * KNOW-CORE-002: Document processing
 * DATA-DOC-001 to DATA-DOC-012: Document preprocessing requirements
 */

import type { DocumentChunk, ChunkMetadata } from './types.js';

/**
 * Options for document chunking
 */
export interface ChunkOptions {
  chunkSize: number;
  chunkOverlap: number;
  preserveParagraphs?: boolean;
  maxCharacters?: number;
  combineTextUnderNChars?: number;
}

/**
 * Document element extracted from content
 */
export interface DocumentElement {
  type: 'Title' | 'NarrativeText' | 'Table' | 'ListItem' | 'Image';
  text: string;
  metadata?: {
    page?: number;
    section?: string;
    coordinates?: { x: number; y: number; width: number; height: number };
  };
}

/**
 * Email metadata structure
 */
export interface EmailMetadata {
  subject: string;
  from?: string;
  to?: string[];
  cc?: string[];
  date?: Date;
  attachments?: string[];
}

/**
 * Document map structure (DATA-DOC-005)
 */
export interface DocumentMap {
  filename: string;
  pages: number;
  elements: DocumentElement[];
  tableCount: number;
  imageCount: number;
  processedAt: Date;
}

/**
 * Partial content result (DATA-DOC-012)
 */
export interface PartialContentResult {
  elements: DocumentElement[];
  error: string;
  recoveredElements: number;
  isPartial: boolean;
}

/**
 * Process result
 */
export interface ProcessResult {
  documentId: string;
  chunks: DocumentChunk[];
  documentMap: DocumentMap;
  tokenCount: number;
}

/**
 * Supported document formats (DATA-DOC-001)
 */
const SUPPORTED_FORMATS = [
  'pdf',
  'docx',
  'doc',
  'txt',
  'md',
  'csv',
  'xlsx',
  'pptx',
  'ppt',
  'html',
  'xml',
  'json',
  'email',
  'msg',
  'eml',
];

/**
 * Document processor for chunking and preparing documents
 */
export class DocumentProcessor {
  private options: ChunkOptions;

  constructor(options?: Partial<ChunkOptions>) {
    this.options = {
      chunkSize: 1000,
      chunkOverlap: 200,
      preserveParagraphs: true,
      maxCharacters: 1500,
      combineTextUnderNChars: 500,
      ...options,
    };
  }

  /**
   * Get list of supported formats (DATA-DOC-001)
   */
  getSupportedFormats(): string[] {
    return [...SUPPORTED_FORMATS];
  }

  /**
   * Check if a format is supported
   */
  isSupported(format: string): boolean {
    return SUPPORTED_FORMATS.includes(format.toLowerCase());
  }

  /**
   * Detect format from filename
   */
  detectFormat(filename: string): string | null {
    const parts = filename.split(/[/\\]/);
    const basename = parts[parts.length - 1] ?? '';
    const extMatch = basename.match(/\.([^.]+)$/);
    if (!extMatch || !extMatch[1]) return null;

    const ext = extMatch[1].toLowerCase();
    return this.isSupported(ext) ? ext : null;
  }

  /**
   * Extract text from content (DATA-DOC-004)
   */
  async extractText(
    content: string | Buffer,
    mimeType: string
  ): Promise<{ text: string; elements: DocumentElement[] }> {
    const text = typeof content === 'string' ? content : content.toString('utf-8');
    const elements: DocumentElement[] = [];

    // Handle different mime types
    const supportedMimeTypes = [
      'text/plain',
      'txt',
      'text/markdown',
      'md',
      'text/html',
      'html',
      'text/csv',
      'csv',
    ];

    if (!supportedMimeTypes.includes(mimeType)) {
      throw new Error(`Unsupported format: ${mimeType}`);
    }

    // Parse content into elements
    if (mimeType === 'md' || mimeType === 'text/markdown') {
      elements.push(...this.parseMarkdown(text));
    } else {
      elements.push({
        type: 'NarrativeText',
        text: text.trim(),
      });
    }

    return { text, elements };
  }

  /**
   * Parse markdown content into elements
   */
  private parseMarkdown(content: string): DocumentElement[] {
    const elements: DocumentElement[] = [];
    const lines = content.split('\n');
    let currentText = '';

    for (const line of lines) {
      // Title detection
      if (line.startsWith('#')) {
        if (currentText.trim()) {
          elements.push({ type: 'NarrativeText', text: currentText.trim() });
          currentText = '';
        }
        elements.push({ type: 'Title', text: line.replace(/^#+\s*/, '') });
      }
      // List item detection
      else if (line.match(/^[-*+]\s/) || line.match(/^\d+\.\s/)) {
        if (currentText.trim()) {
          elements.push({ type: 'NarrativeText', text: currentText.trim() });
          currentText = '';
        }
        elements.push({ type: 'ListItem', text: line.replace(/^[-*+\d.]+\s*/, '') });
      }
      // Table detection
      else if (line.includes('|')) {
        if (currentText.trim()) {
          elements.push({ type: 'NarrativeText', text: currentText.trim() });
          currentText = '';
        }
        elements.push({ type: 'Table', text: line });
      }
      // Regular text
      else {
        currentText += (currentText ? '\n' : '') + line;
      }
    }

    if (currentText.trim()) {
      elements.push({ type: 'NarrativeText', text: currentText.trim() });
    }

    return elements;
  }

  /**
   * Chunk by title boundaries (DATA-DOC-006)
   */
  async chunkByTitle(
    elements: DocumentElement[],
    documentId: string
  ): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    let currentChunk: DocumentElement[] = [];
    let charStart = 0;
    let position = 0;
    const maxChars = this.options.maxCharacters ?? 1500;
    const combineThreshold = this.options.combineTextUnderNChars ?? 500;

    for (const element of elements) {
      const elementLength = element.text.length;

      // Start new chunk at title boundaries (DATA-DOC-006)
      if (element.type === 'Title' && currentChunk.length > 0) {
        const chunkText = currentChunk.map((e) => e.text).join('\n');
        chunks.push(this.createChunk(documentId, chunkText, {
          position,
          charStart,
          charEnd: charStart + chunkText.length,
        }));
        charStart += chunkText.length;
        position++;
        currentChunk = [];
      }

      // Check if adding this element exceeds maxCharacters (DATA-DOC-007)
      const currentLength = currentChunk.reduce((sum, e) => sum + e.text.length, 0);
      if (currentLength + elementLength > maxChars && currentChunk.length > 0) {
        const chunkText = currentChunk.map((e) => e.text).join('\n');
        chunks.push(this.createChunk(documentId, chunkText, {
          position,
          charStart,
          charEnd: charStart + chunkText.length,
        }));
        charStart += chunkText.length;
        position++;
        currentChunk = [];
      }

      currentChunk.push(element);
    }

    // Add remaining elements
    if (currentChunk.length > 0) {
      const chunkText = currentChunk.map((e) => e.text).join('\n');
      chunks.push(this.createChunk(documentId, chunkText, {
        position,
        charStart,
        charEnd: charStart + chunkText.length,
      }));
    }

    // Combine small chunks under threshold (DATA-DOC-007)
    return this.combineSmallChunks(chunks, combineThreshold);
  }

  /**
   * Combine small chunks under threshold
   */
  private combineSmallChunks(
    chunks: DocumentChunk[],
    threshold: number
  ): DocumentChunk[] {
    if (chunks.length <= 1) return chunks;

    const result: DocumentChunk[] = [];
    let accumulated: DocumentChunk | null = null;

    for (const chunk of chunks) {
      if (!accumulated) {
        accumulated = { ...chunk };
        continue;
      }

      if (accumulated.content.length < threshold && chunk.content.length < threshold) {
        // Combine chunks
        accumulated = {
          ...accumulated,
          content: accumulated.content + '\n' + chunk.content,
          metadata: {
            ...accumulated.metadata,
            charEnd: chunk.metadata.charEnd,
          },
        };
      } else {
        result.push(accumulated);
        accumulated = { ...chunk };
      }
    }

    if (accumulated) {
      result.push(accumulated);
    }

    return result;
  }

  /**
   * Preserve table format as HTML (DATA-DOC-008)
   */
  preserveTableFormat(tableData: { headers: string[]; rows: string[][] }): string {
    const headerRow = `<tr>${tableData.headers.map((h) => `<th>${h}</th>`).join('')}</tr>`;
    const bodyRows = tableData.rows
      .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
      .join('');

    return `<table>${headerRow}${bodyRows}</table>`;
  }

  /**
   * Extract email metadata (DATA-DOC-009)
   */
  async extractEmailMetadata(emailContent: string): Promise<EmailMetadata> {
    const metadata: EmailMetadata = {
      subject: '',
    };

    const lines = emailContent.split('\n');
    for (const line of lines) {
      const subjectMatch = line.match(/^Subject:\s*(.+)/i);
      if (subjectMatch && subjectMatch[1]) {
        metadata.subject = subjectMatch[1].trim();
      }

      const fromMatch = line.match(/^From:\s*(.+)/i);
      if (fromMatch && fromMatch[1]) {
        metadata.from = fromMatch[1].trim();
      }

      const toMatch = line.match(/^To:\s*(.+)/i);
      if (toMatch && toMatch[1]) {
        metadata.to = toMatch[1].split(',').map((e) => e.trim());
      }

      const dateMatch = line.match(/^Date:\s*(.+)/i);
      if (dateMatch && dateMatch[1]) {
        metadata.date = new Date(dateMatch[1]);
      }
    }

    return metadata;
  }

  /**
   * Validate token count (DATA-DOC-010)
   * Approximate: 1 token ≈ 4 characters
   */
  validateTokenCount(content: string, limit: number = 8192): boolean {
    const estimatedTokens = Math.ceil(content.length / 4);
    return estimatedTokens <= limit;
  }

  /**
   * Generate standardized JSON document map (DATA-DOC-005)
   */
  generateDocumentMap(
    elements: DocumentElement[],
    metadata: { filename: string; pages: number }
  ): DocumentMap {
    return {
      filename: metadata.filename,
      pages: metadata.pages,
      elements,
      tableCount: elements.filter((e) => e.type === 'Table').length,
      imageCount: elements.filter((e) => e.type === 'Image').length,
      processedAt: new Date(),
    };
  }

  /**
   * Handle partial content on error (DATA-DOC-012)
   */
  handlePartialContent(
    elements: DocumentElement[],
    errorInfo: { error: string; recoveredElements: number }
  ): PartialContentResult {
    return {
      elements,
      error: errorInfo.error,
      recoveredElements: errorInfo.recoveredElements,
      isPartial: true,
    };
  }

  /**
   * Process a document end-to-end
   */
  async processDocument(
    content: string,
    format: string,
    documentId: string,
    options?: Partial<ChunkOptions>
  ): Promise<DocumentChunk[]> {
    // Validate format
    if (!this.isSupported(format)) {
      throw new Error(`Unsupported format: ${format}`);
    }

    const opts = { ...this.options, ...options };
    const chunks: DocumentChunk[] = [];

    if (opts.preserveParagraphs) {
      return this.chunkByParagraphs(documentId, content, opts);
    }

    return this.chunkBySize(documentId, content, opts);
  }

  /**
   * Chunk content by paragraph boundaries
   */
  private chunkByParagraphs(
    documentId: string,
    content: string,
    options: ChunkOptions
  ): DocumentChunk[] {
    const paragraphs = content.split(/\n\n+/);
    const chunks: DocumentChunk[] = [];
    let currentChunk = '';
    let charStart = 0;
    let position = 0;

    for (const paragraph of paragraphs) {
      if (
        currentChunk.length + paragraph.length > options.chunkSize &&
        currentChunk.length > 0
      ) {
        // Save current chunk
        chunks.push(
          this.createChunk(documentId, currentChunk.trim(), {
            position,
            charStart,
            charEnd: charStart + currentChunk.length,
          })
        );

        // Start new chunk with overlap
        const overlapStart = Math.max(0, currentChunk.length - options.chunkOverlap);
        currentChunk = currentChunk.slice(overlapStart) + '\n\n' + paragraph;
        charStart = charStart + overlapStart;
        position++;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }

    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push(
        this.createChunk(documentId, currentChunk.trim(), {
          position,
          charStart,
          charEnd: charStart + currentChunk.length,
        })
      );
    }

    return chunks;
  }

  /**
   * Chunk content by fixed size
   */
  private chunkBySize(
    documentId: string,
    content: string,
    options: ChunkOptions
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    let position = 0;
    let charStart = 0;

    while (charStart < content.length) {
      const charEnd = Math.min(charStart + options.chunkSize, content.length);
      const chunkContent = content.slice(charStart, charEnd);

      chunks.push(
        this.createChunk(documentId, chunkContent, {
          position,
          charStart,
          charEnd,
        })
      );

      charStart = charEnd - options.chunkOverlap;
      position++;

      // Prevent infinite loop
      if (charStart >= charEnd) break;
    }

    return chunks;
  }

  /**
   * Create a document chunk
   */
  private createChunk(
    documentId: string,
    content: string,
    metadata: Omit<ChunkMetadata, 'pageNumber' | 'section'>
  ): DocumentChunk {
    return {
      id: `${documentId}-chunk-${metadata.position}`,
      documentId,
      content,
      metadata,
    };
  }
}

/**
 * DocumentProcessor Tests
 *
 * KNOW-SRC-002: Document preprocessing with unstructured
 * DATA-DOC-001 to DATA-DOC-012: Document preprocessing requirements
 * Test-first approach (Article III)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentProcessor, DocumentElement } from '../../src/knowledge/document-processor.js';
import type { DocumentChunk, ChunkMetadata } from '../../src/knowledge/types.js';

describe('DocumentProcessor', () => {
  let processor: DocumentProcessor;

  beforeEach(() => {
    processor = new DocumentProcessor({
      chunkSize: 1000,
      chunkOverlap: 200,
      maxCharacters: 2750,
      newAfterNChars: 2000,
      combineTextUnderNChars: 1000,
    });
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      const defaultProcessor = new DocumentProcessor();
      expect(defaultProcessor).toBeInstanceOf(DocumentProcessor);
    });

    it('should accept custom chunk configuration', () => {
      const customProcessor = new DocumentProcessor({
        chunkSize: 500,
        chunkOverlap: 100,
      });
      expect(customProcessor).toBeInstanceOf(DocumentProcessor);
    });
  });

  describe('getSupportedFormats', () => {
    it('should return list of supported formats (DATA-DOC-001)', () => {
      const formats = processor.getSupportedFormats();

      expect(formats).toContain('pdf');
      expect(formats).toContain('docx');
      expect(formats).toContain('doc');
      expect(formats).toContain('html');
      expect(formats).toContain('csv');
      expect(formats).toContain('md');
      expect(formats).toContain('pptx');
      expect(formats).toContain('ppt');
      expect(formats).toContain('txt');
      expect(formats).toContain('json');
      expect(formats).toContain('xlsx');
      expect(formats).toContain('xml');
      expect(formats).toContain('eml');
      expect(formats).toContain('msg');
    });
  });

  describe('isSupported', () => {
    it('should return true for supported formats', () => {
      expect(processor.isSupported('pdf')).toBe(true);
      expect(processor.isSupported('docx')).toBe(true);
      expect(processor.isSupported('txt')).toBe(true);
    });

    it('should return false for unsupported formats', () => {
      expect(processor.isSupported('exe')).toBe(false);
      expect(processor.isSupported('mp3')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(processor.isSupported('PDF')).toBe(true);
      expect(processor.isSupported('DOCX')).toBe(true);
    });
  });

  describe('detectFormat', () => {
    it('should detect format from filename', () => {
      expect(processor.detectFormat('document.pdf')).toBe('pdf');
      expect(processor.detectFormat('report.docx')).toBe('docx');
      expect(processor.detectFormat('data.csv')).toBe('csv');
    });

    it('should handle paths with directories', () => {
      expect(processor.detectFormat('/path/to/document.pdf')).toBe('pdf');
      expect(processor.detectFormat('C:\\docs\\report.docx')).toBe('docx');
    });

    it('should return null for unsupported formats', () => {
      expect(processor.detectFormat('file.exe')).toBeNull();
    });

    it('should handle files without extension', () => {
      expect(processor.detectFormat('noextension')).toBeNull();
    });
  });

  describe('extractText', () => {
    it('should extract text from plain text content', async () => {
      const content = 'This is plain text content.';
      const result = await processor.extractText(content, 'txt');

      expect(result.text).toBe(content);
      expect(result.elements).toBeDefined();
    });

    it('should extract structured elements from content (DATA-DOC-004)', async () => {
      const markdownContent = `# Title

## Section 1

This is a paragraph.

- List item 1
- List item 2

| Col1 | Col2 |
|------|------|
| A    | B    |
`;

      const result = await processor.extractText(markdownContent, 'md');

      expect(result.elements.some(e => e.type === 'Title')).toBe(true);
      expect(result.elements.some(e => e.type === 'NarrativeText')).toBe(true);
      expect(result.elements.some(e => e.type === 'ListItem')).toBe(true);
      expect(result.elements.some(e => e.type === 'Table')).toBe(true);
    });

    it('should throw error for unsupported format', async () => {
      await expect(
        processor.extractText('content', 'exe')
      ).rejects.toThrow('Unsupported format');
    });
  });

  describe('chunkByTitle', () => {
    it('should chunk content by title boundaries (DATA-DOC-006)', async () => {
      const elements: DocumentElement[] = [
        { type: 'Title', text: 'Main Title' },
        { type: 'NarrativeText', text: 'Introduction paragraph.' },
        { type: 'Title', text: 'Section 1' },
        { type: 'NarrativeText', text: 'Section 1 content.' },
        { type: 'Title', text: 'Section 2' },
        { type: 'NarrativeText', text: 'Section 2 content.' },
      ];

      const chunks = await processor.chunkByTitle(elements, 'doc-id');

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].documentId).toBe('doc-id');
      expect(chunks[0].content).toBeDefined();
    });

    it('should respect maxCharacters parameter (DATA-DOC-007)', async () => {
      const longParagraph = 'A'.repeat(3000);
      const elements: DocumentElement[] = [
        { type: 'Title', text: 'Title' },
        { type: 'NarrativeText', text: longParagraph },
      ];

      const chunks = await processor.chunkByTitle(elements, 'doc-id');

      // Long content should be in at least one chunk
      expect(chunks.length).toBeGreaterThan(0);
      // Total content should be preserved
      const totalLength = chunks.reduce((sum, c) => sum + c.content.length, 0);
      expect(totalLength).toBeGreaterThanOrEqual(3000);
    });

    it('should combine small text under threshold (DATA-DOC-007)', async () => {
      const elements: DocumentElement[] = [
        { type: 'Title', text: 'Title' },
        { type: 'NarrativeText', text: 'Short 1.' },
        { type: 'NarrativeText', text: 'Short 2.' },
        { type: 'NarrativeText', text: 'Short 3.' },
      ];

      // With combineTextUnderNChars=1000, short paragraphs should be combined
      const customProcessor = new DocumentProcessor({
        combineTextUnderNChars: 1000,
      });

      const chunks = await customProcessor.chunkByTitle(elements, 'doc-id');

      // Should combine into fewer chunks
      expect(chunks.length).toBeLessThan(elements.length);
    });
  });

  describe('preserveTableFormat', () => {
    it('should preserve table as HTML (DATA-DOC-008)', async () => {
      const tableData = {
        headers: ['Name', 'Value'],
        rows: [
          ['Item 1', '100'],
          ['Item 2', '200'],
        ],
      };

      const html = processor.preserveTableFormat(tableData);

      expect(html).toContain('<table>');
      expect(html).toContain('<th>Name</th>');
      expect(html).toContain('<td>Item 1</td>');
      expect(html).toContain('</table>');
    });
  });

  describe('extractEmailMetadata', () => {
    it('should extract email metadata (DATA-DOC-009)', async () => {
      const emailContent = `From: sender@example.com
To: recipient@example.com
Subject: Test Email
Date: 2025-01-01

Email body content here.`;

      const metadata = await processor.extractEmailMetadata(emailContent);

      expect(metadata.subject).toBe('Test Email');
      expect(metadata.from).toBe('sender@example.com');
      expect(metadata.to).toContain('recipient@example.com');
      expect(metadata.date).toBeDefined();
    });

    it('should handle missing email fields gracefully', async () => {
      const partialEmail = `Subject: Only Subject

Body only.`;

      const metadata = await processor.extractEmailMetadata(partialEmail);

      expect(metadata.subject).toBe('Only Subject');
      expect(metadata.from).toBeUndefined();
      expect(metadata.to).toBeUndefined();
    });
  });

  describe('validateTokenCount', () => {
    it('should return true for content within limit (DATA-DOC-010)', () => {
      const shortContent = 'This is short content.';
      expect(processor.validateTokenCount(shortContent)).toBe(true);
    });

    it('should return false for content exceeding 8192 token limit', () => {
      // Approximate: 1 token ≈ 4 characters
      const longContent = 'A'.repeat(40000); // ~10000 tokens
      expect(processor.validateTokenCount(longContent)).toBe(false);
    });

    it('should accept custom token limit', () => {
      const content = 'A'.repeat(4000); // ~1000 tokens
      expect(processor.validateTokenCount(content, 500)).toBe(false);
      expect(processor.validateTokenCount(content, 2000)).toBe(true);
    });
  });

  describe('generateDocumentMap', () => {
    it('should generate standardized JSON document map (DATA-DOC-005)', async () => {
      const elements: DocumentElement[] = [
        { type: 'Title', text: 'Document Title' },
        { type: 'NarrativeText', text: 'Content here.' },
      ];

      const map = processor.generateDocumentMap(elements, {
        filename: 'test.pdf',
        pages: 1,
      });

      expect(map.filename).toBe('test.pdf');
      expect(map.elements).toEqual(elements);
      expect(map.tableCount).toBe(0);
      expect(map.imageCount).toBe(0);
      expect(map.processedAt).toBeDefined();
    });
  });

  describe('handlePartialContent', () => {
    it('should process partial content on error (DATA-DOC-012)', async () => {
      const partialElements: DocumentElement[] = [
        { type: 'Title', text: 'Partial Title' },
        { type: 'NarrativeText', text: 'Partial content' },
        // Simulating incomplete extraction
      ];

      const result = processor.handlePartialContent(partialElements, {
        error: 'Parsing error at position 100',
        recoveredElements: 2,
      });

      expect(result.elements.length).toBe(2);
      expect(result.isPartial).toBe(true);
      expect(result.error).toBeDefined();
      expect(result.recoveredElements).toBe(2);
    });
  });

  describe('processDocument', () => {
    it('should process document end-to-end', async () => {
      const content = `# Research Paper

## Introduction

This paper explores the use of AI in scientific discovery.

## Methods

We used machine learning models to analyze data.

## Results

The results show significant improvements.
`;

      const chunks = await processor.processDocument(content, 'md', 'doc-123');

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].documentId).toBe('doc-123');
      expect(chunks[0].content).toBeDefined();
    });

    it('should validate format before processing', async () => {
      await expect(
        processor.processDocument('content', 'invalid', 'doc-id')
      ).rejects.toThrow('Unsupported format');
    });
  });
});

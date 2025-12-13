// src/knowledge/knowledge-base.ts
function generateId() {
  return `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
function textSimilarity(text1, text2) {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  const wordSet = /* @__PURE__ */ new Set([...words1, ...words2]);
  const vec1 = [];
  const vec2 = [];
  for (const word of wordSet) {
    vec1.push(words1.filter((w) => w === word).length);
    vec2.push(words2.filter((w) => w === word).length);
  }
  const dotProduct = vec1.reduce((sum, val, i) => sum + val * (vec2[i] ?? 0), 0);
  const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (mag1 * mag2);
}
var KnowledgeBase = class {
  config;
  documents = /* @__PURE__ */ new Map();
  chunks = /* @__PURE__ */ new Map();
  constructor(config) {
    this.config = config;
  }
  /**
   * Add a document to the knowledge base
   */
  async addDocument(document) {
    if (!document.title || document.title.trim() === "") {
      throw new Error("Title is required");
    }
    if (!document.content || document.content.trim() === "") {
      throw new Error("Content is required");
    }
    const id = generateId();
    const now = /* @__PURE__ */ new Date();
    const newDocument = {
      ...document,
      id,
      status: "pending",
      createdAt: now,
      updatedAt: now
    };
    this.documents.set(id, newDocument);
    const documentChunks = this.createChunks(newDocument);
    this.chunks.set(id, documentChunks);
    newDocument.status = "indexed";
    this.documents.set(id, newDocument);
    return newDocument;
  }
  /**
   * Create chunks from a document
   */
  createChunks(document) {
    const { chunkSize, chunkOverlap } = this.config;
    const content = document.content;
    const chunks = [];
    let position = 0;
    let charStart = 0;
    while (charStart < content.length) {
      const charEnd = Math.min(charStart + chunkSize, content.length);
      const chunkContent = content.substring(charStart, charEnd);
      chunks.push({
        id: `${document.id}-chunk-${position}`,
        documentId: document.id,
        content: chunkContent,
        metadata: {
          position,
          charStart,
          charEnd
        }
      });
      position++;
      charStart = charEnd - chunkOverlap;
      if (charStart >= content.length) break;
      if (charEnd === content.length) break;
    }
    return chunks;
  }
  /**
   * Get a document by ID
   */
  async getDocument(id) {
    return this.documents.get(id) ?? null;
  }
  /**
   * Search the knowledge base
   */
  async search(query, options) {
    const limit = options?.limit ?? 10;
    const threshold = options?.threshold ?? 0;
    const domains = options?.domains;
    const documentTypes = options?.documentTypes;
    const results = [];
    for (const [docId, document] of this.documents) {
      if (domains && domains.length > 0) {
        if (!document.metadata.domain || !domains.includes(document.metadata.domain)) {
          continue;
        }
      }
      if (documentTypes && documentTypes.length > 0) {
        if (!documentTypes.includes(document.type)) {
          continue;
        }
      }
      const docChunks = this.chunks.get(docId) ?? [];
      for (const chunk of docChunks) {
        const score = textSimilarity(query, chunk.content);
        if (score >= threshold) {
          results.push({
            chunk,
            document,
            score,
            highlights: this.extractHighlights(query, chunk.content)
          });
        }
      }
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }
  /**
   * Extract highlights from content based on query
   */
  extractHighlights(query, content) {
    const queryWords = query.toLowerCase().split(/\s+/);
    const sentences = content.split(/[.!?]+/);
    const highlights = [];
    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase();
      if (queryWords.some((word) => sentenceLower.includes(word))) {
        highlights.push(sentence.trim());
      }
    }
    return highlights.slice(0, 3);
  }
  /**
   * Delete a document from the knowledge base
   */
  async deleteDocument(id) {
    if (!this.documents.has(id)) {
      throw new Error("Document not found");
    }
    this.documents.delete(id);
    this.chunks.delete(id);
  }
  /**
   * Update a document in the knowledge base
   */
  async updateDocument(id, updates) {
    const existing = this.documents.get(id);
    if (!existing) {
      throw new Error("Document not found");
    }
    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
      // ID cannot be changed
      createdAt: existing.createdAt,
      // createdAt cannot be changed
      updatedAt: /* @__PURE__ */ new Date(),
      metadata: {
        ...existing.metadata,
        ...updates.metadata ?? {}
      }
    };
    this.documents.set(id, updated);
    if (updates.content) {
      const documentChunks = this.createChunks(updated);
      this.chunks.set(id, documentChunks);
    }
    return updated;
  }
  /**
   * Re-index a document
   */
  async reindexDocument(id) {
    const document = this.documents.get(id);
    if (!document) {
      throw new Error("Document not found");
    }
    document.status = "pending";
    this.documents.set(id, document);
    const documentChunks = this.createChunks(document);
    this.chunks.set(id, documentChunks);
    document.status = "indexed";
    document.updatedAt = /* @__PURE__ */ new Date();
    this.documents.set(id, document);
  }
  /**
   * Get statistics about the knowledge base
   */
  async getStats() {
    let chunkCount = 0;
    let indexedCount = 0;
    let pendingCount = 0;
    let errorCount = 0;
    for (const [docId, document] of this.documents) {
      const docChunks = this.chunks.get(docId) ?? [];
      chunkCount += docChunks.length;
      switch (document.status) {
        case "indexed":
          indexedCount++;
          break;
        case "pending":
        case "processing":
          pendingCount++;
          break;
        case "error":
          errorCount++;
          break;
      }
    }
    return {
      documentCount: this.documents.size,
      chunkCount,
      indexedCount,
      pendingCount,
      errorCount
    };
  }
};

// src/knowledge/document-processor.ts
var SUPPORTED_FORMATS = [
  "pdf",
  "docx",
  "doc",
  "txt",
  "md",
  "csv",
  "xlsx",
  "pptx",
  "ppt",
  "html",
  "xml",
  "json",
  "email",
  "msg",
  "eml"
];
var DocumentProcessor = class {
  options;
  constructor(options) {
    this.options = {
      chunkSize: 1e3,
      chunkOverlap: 200,
      preserveParagraphs: true,
      maxCharacters: 1500,
      combineTextUnderNChars: 500,
      ...options
    };
  }
  /**
   * Get list of supported formats (DATA-DOC-001)
   */
  getSupportedFormats() {
    return [...SUPPORTED_FORMATS];
  }
  /**
   * Check if a format is supported
   */
  isSupported(format) {
    return SUPPORTED_FORMATS.includes(format.toLowerCase());
  }
  /**
   * Detect format from filename
   */
  detectFormat(filename) {
    const parts = filename.split(/[/\\]/);
    const basename = parts[parts.length - 1] ?? "";
    const extMatch = basename.match(/\.([^.]+)$/);
    if (!extMatch || !extMatch[1]) return null;
    const ext = extMatch[1].toLowerCase();
    return this.isSupported(ext) ? ext : null;
  }
  /**
   * Extract text from content (DATA-DOC-004)
   */
  async extractText(content, mimeType) {
    const text = typeof content === "string" ? content : content.toString("utf-8");
    const elements = [];
    const supportedMimeTypes = [
      "text/plain",
      "txt",
      "text/markdown",
      "md",
      "text/html",
      "html",
      "text/csv",
      "csv"
    ];
    if (!supportedMimeTypes.includes(mimeType)) {
      throw new Error(`Unsupported format: ${mimeType}`);
    }
    if (mimeType === "md" || mimeType === "text/markdown") {
      elements.push(...this.parseMarkdown(text));
    } else {
      elements.push({
        type: "NarrativeText",
        text: text.trim()
      });
    }
    return { text, elements };
  }
  /**
   * Parse markdown content into elements
   */
  parseMarkdown(content) {
    const elements = [];
    const lines = content.split("\n");
    let currentText = "";
    for (const line of lines) {
      if (line.startsWith("#")) {
        if (currentText.trim()) {
          elements.push({ type: "NarrativeText", text: currentText.trim() });
          currentText = "";
        }
        elements.push({ type: "Title", text: line.replace(/^#+\s*/, "") });
      } else if (line.match(/^[-*+]\s/) || line.match(/^\d+\.\s/)) {
        if (currentText.trim()) {
          elements.push({ type: "NarrativeText", text: currentText.trim() });
          currentText = "";
        }
        elements.push({ type: "ListItem", text: line.replace(/^[-*+\d.]+\s*/, "") });
      } else if (line.includes("|")) {
        if (currentText.trim()) {
          elements.push({ type: "NarrativeText", text: currentText.trim() });
          currentText = "";
        }
        elements.push({ type: "Table", text: line });
      } else {
        currentText += (currentText ? "\n" : "") + line;
      }
    }
    if (currentText.trim()) {
      elements.push({ type: "NarrativeText", text: currentText.trim() });
    }
    return elements;
  }
  /**
   * Chunk by title boundaries (DATA-DOC-006)
   */
  async chunkByTitle(elements, documentId) {
    const chunks = [];
    let currentChunk = [];
    let charStart = 0;
    let position = 0;
    const maxChars = this.options.maxCharacters ?? 1500;
    const combineThreshold = this.options.combineTextUnderNChars ?? 500;
    for (const element of elements) {
      const elementLength = element.text.length;
      if (element.type === "Title" && currentChunk.length > 0) {
        const chunkText = currentChunk.map((e) => e.text).join("\n");
        chunks.push(this.createChunk(documentId, chunkText, {
          position,
          charStart,
          charEnd: charStart + chunkText.length
        }));
        charStart += chunkText.length;
        position++;
        currentChunk = [];
      }
      const currentLength = currentChunk.reduce((sum, e) => sum + e.text.length, 0);
      if (currentLength + elementLength > maxChars && currentChunk.length > 0) {
        const chunkText = currentChunk.map((e) => e.text).join("\n");
        chunks.push(this.createChunk(documentId, chunkText, {
          position,
          charStart,
          charEnd: charStart + chunkText.length
        }));
        charStart += chunkText.length;
        position++;
        currentChunk = [];
      }
      currentChunk.push(element);
    }
    if (currentChunk.length > 0) {
      const chunkText = currentChunk.map((e) => e.text).join("\n");
      chunks.push(this.createChunk(documentId, chunkText, {
        position,
        charStart,
        charEnd: charStart + chunkText.length
      }));
    }
    return this.combineSmallChunks(chunks, combineThreshold);
  }
  /**
   * Combine small chunks under threshold
   */
  combineSmallChunks(chunks, threshold) {
    if (chunks.length <= 1) return chunks;
    const result = [];
    let accumulated = null;
    for (const chunk of chunks) {
      if (!accumulated) {
        accumulated = { ...chunk };
        continue;
      }
      if (accumulated.content.length < threshold && chunk.content.length < threshold) {
        accumulated = {
          ...accumulated,
          content: accumulated.content + "\n" + chunk.content,
          metadata: {
            ...accumulated.metadata,
            charEnd: chunk.metadata.charEnd
          }
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
  preserveTableFormat(tableData) {
    const headerRow = `<tr>${tableData.headers.map((h) => `<th>${h}</th>`).join("")}</tr>`;
    const bodyRows = tableData.rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("");
    return `<table>${headerRow}${bodyRows}</table>`;
  }
  /**
   * Extract email metadata (DATA-DOC-009)
   */
  async extractEmailMetadata(emailContent) {
    const metadata = {
      subject: ""
    };
    const lines = emailContent.split("\n");
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
        metadata.to = toMatch[1].split(",").map((e) => e.trim());
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
  validateTokenCount(content, limit = 8192) {
    const estimatedTokens = Math.ceil(content.length / 4);
    return estimatedTokens <= limit;
  }
  /**
   * Generate standardized JSON document map (DATA-DOC-005)
   */
  generateDocumentMap(elements, metadata) {
    return {
      filename: metadata.filename,
      pages: metadata.pages,
      elements,
      tableCount: elements.filter((e) => e.type === "Table").length,
      imageCount: elements.filter((e) => e.type === "Image").length,
      processedAt: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Handle partial content on error (DATA-DOC-012)
   */
  handlePartialContent(elements, errorInfo) {
    return {
      elements,
      error: errorInfo.error,
      recoveredElements: errorInfo.recoveredElements,
      isPartial: true
    };
  }
  /**
   * Process a document end-to-end
   */
  async processDocument(content, format, documentId, options) {
    if (!this.isSupported(format)) {
      throw new Error(`Unsupported format: ${format}`);
    }
    const opts = { ...this.options, ...options };
    if (opts.preserveParagraphs) {
      return this.chunkByParagraphs(documentId, content, opts);
    }
    return this.chunkBySize(documentId, content, opts);
  }
  /**
   * Chunk content by paragraph boundaries
   */
  chunkByParagraphs(documentId, content, options) {
    const paragraphs = content.split(/\n\n+/);
    const chunks = [];
    let currentChunk = "";
    let charStart = 0;
    let position = 0;
    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > options.chunkSize && currentChunk.length > 0) {
        chunks.push(
          this.createChunk(documentId, currentChunk.trim(), {
            position,
            charStart,
            charEnd: charStart + currentChunk.length
          })
        );
        const overlapStart = Math.max(0, currentChunk.length - options.chunkOverlap);
        currentChunk = currentChunk.slice(overlapStart) + "\n\n" + paragraph;
        charStart = charStart + overlapStart;
        position++;
      } else {
        currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
      }
    }
    if (currentChunk.trim()) {
      chunks.push(
        this.createChunk(documentId, currentChunk.trim(), {
          position,
          charStart,
          charEnd: charStart + currentChunk.length
        })
      );
    }
    return chunks;
  }
  /**
   * Chunk content by fixed size
   */
  chunkBySize(documentId, content, options) {
    const chunks = [];
    let position = 0;
    let charStart = 0;
    while (charStart < content.length) {
      const charEnd = Math.min(charStart + options.chunkSize, content.length);
      const chunkContent = content.slice(charStart, charEnd);
      chunks.push(
        this.createChunk(documentId, chunkContent, {
          position,
          charStart,
          charEnd
        })
      );
      charStart = charEnd - options.chunkOverlap;
      position++;
      if (charStart >= charEnd) break;
    }
    return chunks;
  }
  /**
   * Create a document chunk
   */
  createChunk(documentId, content, metadata) {
    return {
      id: `${documentId}-chunk-${metadata.position}`,
      documentId,
      content,
      metadata
    };
  }
};

// src/knowledge/rag-service.ts
var RAGService = class {
  knowledgeBase;
  maxContextTokens;
  constructor(knowledgeBase, maxContextTokens = 4e3) {
    this.knowledgeBase = knowledgeBase;
    this.maxContextTokens = maxContextTokens;
  }
  /**
   * Generate embedding vector for text
   */
  async generateEmbedding(text) {
    if (!text || text.trim() === "") {
      throw new Error("Text cannot be empty");
    }
    const maxChars = 32768;
    const truncatedText = text.slice(0, maxChars);
    return this.simpleEmbedding(truncatedText);
  }
  /**
   * Simple hash-based embedding for testing
   * In production, this would call text-embedding-ada-002 or similar
   */
  simpleEmbedding(text) {
    const dimensions = 1536;
    const embedding = new Array(dimensions).fill(0);
    const words = text.toLowerCase().split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (!word) continue;
      for (let j = 0; j < word.length; j++) {
        const charCode = word.charCodeAt(j);
        const idx = charCode * (i + 1) * (j + 1) % dimensions;
        embedding[idx] += 1 / (i + 1);
      }
    }
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }
    return embedding;
  }
  /**
   * Generate embeddings for multiple texts
   */
  async generateEmbeddingBatch(texts) {
    if (texts.length === 0) return [];
    return Promise.all(texts.map((text) => this.generateEmbedding(text)));
  }
  /**
   * Compute cosine similarity between two vectors
   */
  computeSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length) {
      throw new Error("Vectors must have same dimensions");
    }
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += (vec1[i] ?? 0) * (vec2[i] ?? 0);
      mag1 += (vec1[i] ?? 0) * (vec1[i] ?? 0);
      mag2 += (vec2[i] ?? 0) * (vec2[i] ?? 0);
    }
    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);
    if (mag1 === 0 || mag2 === 0) return 0;
    return dotProduct / (mag1 * mag2);
  }
  /**
   * Build RAG context for a query
   */
  async buildContext(query, options) {
    const results = await this.knowledgeBase.search(query, {
      limit: 10,
      ...options
    });
    const { combinedContext, tokenCount } = this.combineResults(results);
    return {
      query,
      results,
      combinedContext,
      tokenCount
    };
  }
  /**
   * Combine search results into a single context string
   */
  combineResults(results) {
    const contextParts = [];
    let tokenCount = 0;
    for (const result of results) {
      const chunkTokens = this.estimateTokens(result.chunk.content);
      if (tokenCount + chunkTokens > this.maxContextTokens) {
        break;
      }
      const contextPart = this.formatResultForContext(result);
      contextParts.push(contextPart);
      tokenCount += chunkTokens;
    }
    return {
      combinedContext: contextParts.join("\n\n---\n\n"),
      tokenCount
    };
  }
  /**
   * Format a search result for inclusion in context
   */
  formatResultForContext(result) {
    const { document, chunk } = result;
    const header = `[Source: ${document.title}${document.metadata.doi ? ` (DOI: ${document.metadata.doi})` : ""}]`;
    return `${header}
${chunk.content}`;
  }
  /**
   * Estimate token count for text (rough approximation)
   */
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }
  /**
   * Extract scientific entities from text (KNOW-GRAG-002)
   */
  async extractEntities(text) {
    const entities = [];
    const compoundPatterns = [
      /\b(Aspirin|Ibuprofen|Tamoxifen|Metformin|Paracetamol)\b/gi,
      /\b[A-Z][a-z]+(?:in|ol|ide|ine|ate)\b/g
      // Generic drug-like names
    ];
    const proteinPatterns = [
      /\b(COX-\d+|p53|EGFR|HER2|BRCA\d?)\b/gi,
      /\b[A-Z]{2,5}-?\d*\b/g
      // Protein-like abbreviations
    ];
    const diseasePatterns = [
      /\b(cancer|diabetes|alzheimer|parkinson|tumor|carcinoma)\b/gi,
      /\b(breast cancer|lung cancer|colon cancer)\b/gi
    ];
    const authorPatterns = [/\b([A-Z][a-z]+)\s+et\s+al\./g, /\b([A-Z][a-z]+)\s+\(\d{4}\)/g];
    for (const pattern of compoundPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match.index !== void 0) {
          entities.push({
            name: match[0],
            type: "compound",
            position: { start: match.index, end: match.index + match[0].length }
          });
        }
      }
    }
    for (const pattern of proteinPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match.index !== void 0 && match[0].length >= 3) {
          if (!entities.some((e) => e.name.toLowerCase() === match[0].toLowerCase())) {
            entities.push({
              name: match[0],
              type: "protein",
              position: { start: match.index, end: match.index + match[0].length }
            });
          }
        }
      }
    }
    for (const pattern of diseasePatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match.index !== void 0) {
          if (!entities.some((e) => e.name.toLowerCase() === match[0].toLowerCase())) {
            entities.push({
              name: match[0],
              type: "disease",
              position: { start: match.index, end: match.index + match[0].length }
            });
          }
        }
      }
    }
    for (const pattern of authorPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match.index !== void 0 && match[1]) {
          entities.push({
            name: match[1],
            type: "author",
            position: { start: match.index, end: match.index + match[0].length }
          });
        }
      }
    }
    const uniqueEntities = entities.filter(
      (entity, index, self) => index === self.findIndex(
        (e) => e.name.toLowerCase() === entity.name.toLowerCase() && e.type === entity.type
      )
    );
    return uniqueEntities;
  }
  /**
   * Extract relations between entities (KNOW-GRAG-003)
   */
  async extractRelations(text, entities) {
    const relations = [];
    text.toLowerCase();
    const relationPatterns = [
      { pattern: /inhibits?/gi, type: "inhibits" },
      { pattern: /activates?/gi, type: "activates" },
      { pattern: /binds?\s+to/gi, type: "binds" },
      { pattern: /treats?/gi, type: "treats" },
      { pattern: /causes?/gi, type: "causes" }
    ];
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entity1 = entities[i];
        const entity2 = entities[j];
        if (!entity1 || !entity2) continue;
        const pos1 = entity1.position;
        const pos2 = entity2.position;
        if (pos1 && pos2) {
          const start = Math.min(pos1.end, pos2.end);
          const end = Math.max(pos1.start, pos2.start);
          if (end > start && end - start < 100) {
            const between = text.substring(start, end);
            for (const { pattern, type } of relationPatterns) {
              if (pattern.test(between)) {
                relations.push({
                  source: entity1,
                  target: entity2,
                  type,
                  confidence: 0.8
                });
                break;
              }
            }
          }
        }
      }
    }
    return relations;
  }
  /**
   * Perform RAG query with context
   */
  async query(question, searchResults) {
    if (searchResults.length === 0) {
      return {
        answer: "I could not find relevant information in the knowledge base to answer this question.",
        sources: [],
        confidence: 0
      };
    }
    const context = searchResults.map((r) => r.chunk.content).join("\n\n");
    const sources = searchResults.map((r) => ({
      documentId: r.document.id,
      title: r.document.title,
      excerpt: r.chunk.content.substring(0, 200) + "...",
      score: r.score
    }));
    const answer = `Based on the retrieved documents:

${context.substring(0, 500)}...`;
    return {
      answer,
      sources,
      confidence: Math.max(...searchResults.map((r) => r.score))
    };
  }
  /**
   * Rerank search results by relevance
   */
  async rerank(query, results) {
    const queryEmbedding = await this.generateEmbedding(query);
    const rerankedResults = await Promise.all(
      results.map(async (result) => {
        const chunkEmbedding = await this.generateEmbedding(result.chunk.content);
        const semanticScore = this.computeSimilarity(queryEmbedding, chunkEmbedding);
        const combinedScore = result.score * 0.3 + semanticScore * 0.7;
        return {
          ...result,
          score: combinedScore
        };
      })
    );
    return rerankedResults.sort((a, b) => b.score - a.score);
  }
  /**
   * Generate summary of search results
   */
  async summarize(results) {
    if (results.length === 0) {
      return {
        text: "No results to summarize.",
        keyPoints: [],
        sourceCount: 0
      };
    }
    const keyPoints = [];
    results.map((r) => r.chunk.content).join("\n\n");
    for (const result of results.slice(0, 5)) {
      const firstSentence = result.chunk.content.split(".")[0];
      if (firstSentence && firstSentence.length > 20) {
        keyPoints.push(firstSentence.trim() + ".");
      }
    }
    const text = `Summary of ${results.length} relevant documents:

${keyPoints.join("\n")}`;
    return {
      text,
      keyPoints,
      sourceCount: results.length
    };
  }
  /**
   * Generate a prompt with RAG context
   */
  buildPrompt(userQuery, context, systemPrompt) {
    const defaultSystemPrompt = `You are an AI assistant for scientific research. 
Use the following context from the knowledge base to answer the user's question.
If the context doesn't contain relevant information, say so clearly.`;
    const prompt = `${systemPrompt || defaultSystemPrompt}

## Context from Knowledge Base

${context.combinedContext}

## User Question

${userQuery}

## Instructions

Based on the context provided, answer the user's question. 
Cite sources when possible using [Source: title] format.`;
    return prompt;
  }
};

// src/knowledge/literature-search.ts
var DOMAIN_KEYWORDS = {
  "drug-discovery": [
    "drug",
    "pharmaceutical",
    "compound",
    "target",
    "binding",
    "ADMET",
    "toxicity",
    "efficacy",
    "clinical",
    "therapeutic",
    "\u85AC\u7269",
    "\u533B\u85AC\u54C1",
    "\u5316\u5408\u7269",
    "\u6A19\u7684",
    "\u7D50\u5408",
    "\u6BD2\u6027"
  ],
  "materials-science": [
    "material",
    "crystal",
    "polymer",
    "metal",
    "alloy",
    "bandgap",
    "conductivity",
    "semiconductor",
    "nanoparticle",
    "\u6750\u6599",
    "\u7D50\u6676",
    "\u30DD\u30EA\u30DE\u30FC",
    "\u91D1\u5C5E",
    "\u5408\u91D1",
    "\u534A\u5C0E\u4F53"
  ],
  climate: [
    "climate",
    "weather",
    "temperature",
    "carbon",
    "emission",
    "atmosphere",
    "ocean",
    "precipitation",
    "warming",
    "\u6C17\u5019",
    "\u5929\u6C17",
    "\u6E29\u5EA6",
    "\u70AD\u7D20",
    "\u6392\u51FA",
    "\u5927\u6C17"
  ],
  genomics: [
    "gene",
    "genome",
    "DNA",
    "RNA",
    "protein",
    "sequence",
    "mutation",
    "expression",
    "transcription",
    "CRISPR",
    "\u907A\u4F1D\u5B50",
    "\u30B2\u30CE\u30E0",
    "\u30BF\u30F3\u30D1\u30AF\u8CEA",
    "\u914D\u5217",
    "\u5909\u7570"
  ],
  chemistry: [
    "molecule",
    "reaction",
    "synthesis",
    "catalyst",
    "bond",
    "organic",
    "inorganic",
    "spectroscopy",
    "NMR",
    "\u5206\u5B50",
    "\u53CD\u5FDC",
    "\u5408\u6210",
    "\u89E6\u5A92",
    "\u7D50\u5408"
  ],
  physics: [
    "quantum",
    "particle",
    "energy",
    "wave",
    "field",
    "relativity",
    "thermodynamics",
    "mechanics",
    "\u91CF\u5B50",
    "\u7C92\u5B50",
    "\u30A8\u30CD\u30EB\u30AE\u30FC",
    "\u6CE2\u52D5",
    "\u5834"
  ],
  biology: [
    "cell",
    "organism",
    "evolution",
    "ecology",
    "species",
    "metabolism",
    "enzyme",
    "pathway",
    "tissue",
    "\u7D30\u80DE",
    "\u751F\u7269",
    "\u9032\u5316",
    "\u751F\u614B",
    "\u4EE3\u8B1D"
  ],
  general: []
};
var LiteratureSearchService = class {
  knowledgeBase;
  ragService;
  papers = /* @__PURE__ */ new Map();
  citationGraph = /* @__PURE__ */ new Map();
  domainIndex = /* @__PURE__ */ new Map();
  constructor(knowledgeBase) {
    this.knowledgeBase = knowledgeBase;
    this.ragService = new RAGService(knowledgeBase);
    for (const domain of Object.keys(DOMAIN_KEYWORDS)) {
      this.domainIndex.set(domain, /* @__PURE__ */ new Set());
    }
  }
  /**
   * Add a paper to the literature database
   */
  async addPaper(paper) {
    if (!paper.entities) {
      paper.entities = await this.ragService.extractEntities(paper.content);
    }
    if (!paper.metadata.domain) {
      paper.metadata.domain = this.detectDomain(paper);
    }
    this.papers.set(paper.id, paper);
    const domain = paper.metadata.domain;
    const domainPapers = this.domainIndex.get(domain);
    if (domainPapers) {
      domainPapers.add(paper.id);
    }
    const now = /* @__PURE__ */ new Date();
    const document = {
      id: paper.id,
      title: paper.title,
      content: paper.content,
      type: "paper",
      metadata: {
        ...paper.metadata
        // entities are stored separately in paper
      },
      status: "indexed",
      createdAt: now,
      updatedAt: now
    };
    await this.knowledgeBase.addDocument(document);
    this.updateCitationGraph(paper);
  }
  /**
   * Add multiple papers
   */
  async addPapers(papers) {
    for (const paper of papers) {
      await this.addPaper(paper);
    }
  }
  /**
   * Search for papers
   */
  async search(searchQuery) {
    const { query, domain, yearRange, authors, journals, keywords, minCitations, limit = 10 } = searchQuery;
    let results = [];
    try {
      const queryOptions = {
        limit: limit * 2,
        // Get more results to filter
        domains: domain ? [domain] : void 0,
        dateRange: yearRange ? {
          start: yearRange.start ? new Date(yearRange.start, 0, 1) : void 0,
          end: yearRange.end ? new Date(yearRange.end, 11, 31) : void 0
        } : void 0
      };
      const searchResults = await this.knowledgeBase.search(query, queryOptions);
      if (searchResults.length > 0) {
        for (const result of searchResults) {
          const paper = this.papers.get(result.document.id);
          if (!paper) continue;
          if (domain && paper.metadata.domain !== domain) continue;
          if (yearRange) {
            const year = paper.metadata.year;
            if (year && yearRange.start && year < yearRange.start) continue;
            if (year && yearRange.end && year > yearRange.end) continue;
          }
          if (minCitations && (paper.metadata.citations ?? 0) < minCitations) continue;
          if (authors && authors.length > 0) {
            const hasAuthor = authors.some(
              (a) => paper.metadata.authors.some((pa) => pa.toLowerCase().includes(a.toLowerCase()))
            );
            if (!hasAuthor) continue;
          }
          if (journals && journals.length > 0) {
            if (!journals.includes(paper.metadata.journal ?? "")) continue;
          }
          if (keywords && keywords.length > 0) {
            const hasKeyword = keywords.some(
              (k) => (paper.metadata.keywords ?? []).some((pk) => pk.toLowerCase().includes(k.toLowerCase()))
            );
            if (!hasKeyword) continue;
          }
          results.push({
            paper,
            score: result.score,
            highlights: this.extractHighlights(paper.content, query)
          });
        }
      }
    } catch {
    }
    if (results.length === 0) {
      results = this.simpleTextSearch(searchQuery);
    }
    results = results.sort((a, b) => b.score - a.score).slice(0, limit);
    for (const result of results) {
      result.relatedPapers = await this.findRelatedPapers(result.paper.id, 3);
    }
    return results;
  }
  /**
   * Simple text search fallback (for testing/demo without embeddings)
   */
  simpleTextSearch(searchQuery) {
    const { query, domain, yearRange, authors, journals, keywords, minCitations, limit = 10 } = searchQuery;
    const queryTerms = query.toLowerCase().split(/\s+/);
    const results = [];
    for (const paper of this.papers.values()) {
      if (domain && paper.metadata.domain !== domain) continue;
      if (yearRange) {
        const year = paper.metadata.year;
        if (year && yearRange.start && year < yearRange.start) continue;
        if (year && yearRange.end && year > yearRange.end) continue;
      }
      if (minCitations && (paper.metadata.citations ?? 0) < minCitations) continue;
      if (authors && authors.length > 0) {
        const hasAuthor = authors.some(
          (a) => paper.metadata.authors.some((pa) => pa.toLowerCase().includes(a.toLowerCase()))
        );
        if (!hasAuthor) continue;
      }
      if (journals && journals.length > 0) {
        if (!journals.includes(paper.metadata.journal ?? "")) continue;
      }
      if (keywords && keywords.length > 0) {
        const hasKeyword = keywords.some(
          (k) => (paper.metadata.keywords ?? []).some((pk) => pk.toLowerCase().includes(k.toLowerCase()))
        );
        if (!hasKeyword) continue;
      }
      const searchableText = `${paper.title} ${paper.content} ${paper.metadata.keywords?.join(" ") ?? ""}`.toLowerCase();
      const matchCount = queryTerms.filter((term) => searchableText.includes(term)).length;
      if (matchCount > 0) {
        const score = matchCount / queryTerms.length;
        results.push({
          paper,
          score,
          highlights: this.extractHighlights(paper.content, query)
        });
      }
    }
    return results.slice(0, limit);
  }
  /**
   * Search by domain
   */
  async searchByDomain(domain, query, limit = 10) {
    return this.search({ query, domain, limit });
  }
  /**
   * Find papers citing a specific paper
   */
  async findCitingPapers(paperId) {
    const node = this.citationGraph.get(paperId);
    if (!node) return [];
    const papers = [];
    for (const citingId of node.citedBy) {
      const paper = this.papers.get(citingId);
      if (paper) papers.push(paper);
    }
    return papers;
  }
  /**
   * Find papers cited by a specific paper
   */
  async findCitedPapers(paperId) {
    const node = this.citationGraph.get(paperId);
    if (!node) return [];
    const papers = [];
    for (const citedId of node.cites) {
      const paper = this.papers.get(citedId);
      if (paper) papers.push(paper);
    }
    return papers;
  }
  /**
   * Find related papers using entity overlap and citations
   */
  async findRelatedPapers(paperId, limit = 5) {
    const paper = this.papers.get(paperId);
    if (!paper) return [];
    const scores = /* @__PURE__ */ new Map();
    const paperEntities = new Set(paper.entities?.map((e) => e.name.toLowerCase()) ?? []);
    for (const [otherId, otherPaper] of this.papers) {
      if (otherId === paperId) continue;
      let score = 0;
      const otherEntities = otherPaper.entities?.map((e) => e.name.toLowerCase()) ?? [];
      for (const entity of otherEntities) {
        if (paperEntities.has(entity)) {
          score += 1;
        }
      }
      if (paper.metadata.domain === otherPaper.metadata.domain) {
        score += 0.5;
      }
      const node = this.citationGraph.get(paperId);
      if (node) {
        if (node.citedBy.includes(otherId)) score += 2;
        if (node.cites.includes(otherId)) score += 2;
      }
      if (score > 0) {
        scores.set(otherId, score);
      }
    }
    const sortedIds = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
    const relatedPapers = [];
    for (const id of sortedIds) {
      const p = this.papers.get(id);
      if (p) relatedPapers.push(p);
    }
    return relatedPapers;
  }
  /**
   * Get citation graph for a paper
   */
  getCitationNode(paperId) {
    return this.citationGraph.get(paperId);
  }
  /**
   * Get papers by domain
   */
  getPapersByDomain(domain) {
    const paperIds = this.domainIndex.get(domain);
    if (!paperIds) return [];
    const papers = [];
    for (const id of paperIds) {
      const paper = this.papers.get(id);
      if (paper) papers.push(paper);
    }
    return papers;
  }
  /**
   * Get all entities across papers
   */
  getAllEntities() {
    const entityMap = /* @__PURE__ */ new Map();
    for (const paper of this.papers.values()) {
      for (const entity of paper.entities ?? []) {
        const key = `${entity.type}:${entity.name.toLowerCase()}`;
        if (!entityMap.has(key)) {
          entityMap.set(key, entity);
        }
      }
    }
    return Array.from(entityMap.values());
  }
  /**
   * Find papers mentioning a specific entity
   */
  findPapersByEntity(entityName) {
    const normalizedName = entityName.toLowerCase();
    const papers = [];
    for (const paper of this.papers.values()) {
      const hasEntity = paper.entities?.some(
        (e) => e.name.toLowerCase() === normalizedName
      );
      if (hasEntity) {
        papers.push(paper);
      }
    }
    return papers;
  }
  /**
   * Get service statistics
   */
  getStats() {
    const papersByDomain = {
      "drug-discovery": 0,
      "materials-science": 0,
      climate: 0,
      genomics: 0,
      chemistry: 0,
      physics: 0,
      biology: 0,
      general: 0
    };
    for (const [domain, papers] of this.domainIndex) {
      papersByDomain[domain] = papers.size;
    }
    return {
      totalPapers: this.papers.size,
      papersByDomain,
      totalEntities: this.getAllEntities().length,
      citationNodes: this.citationGraph.size
    };
  }
  /**
   * Detect domain from paper content and metadata
   */
  detectDomain(paper) {
    const text = `${paper.title} ${paper.content} ${(paper.metadata.keywords ?? []).join(" ")}`.toLowerCase();
    const scores = {
      "drug-discovery": 0,
      "materials-science": 0,
      climate: 0,
      genomics: 0,
      chemistry: 0,
      physics: 0,
      biology: 0,
      general: 0
    };
    for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
      for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
          scores[domain] += 1;
        }
      }
    }
    let maxScore = 0;
    let maxDomain = "general";
    for (const [domain, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        maxDomain = domain;
      }
    }
    return maxDomain;
  }
  /**
   * Update citation graph for a paper
   */
  updateCitationGraph(paper) {
    let node = this.citationGraph.get(paper.id);
    if (!node) {
      node = {
        paperId: paper.id,
        title: paper.title,
        year: paper.metadata.year,
        citedBy: [],
        cites: [],
        citationCount: paper.metadata.citations ?? 0
      };
      this.citationGraph.set(paper.id, node);
    }
  }
  /**
   * Add citation relationship
   */
  addCitation(citingPaperId, citedPaperId) {
    const citingNode = this.citationGraph.get(citingPaperId);
    if (citingNode && !citingNode.cites.includes(citedPaperId)) {
      citingNode.cites.push(citedPaperId);
    }
    const citedNode = this.citationGraph.get(citedPaperId);
    if (citedNode && !citedNode.citedBy.includes(citingPaperId)) {
      citedNode.citedBy.push(citingPaperId);
      citedNode.citationCount = citedNode.citedBy.length;
    }
  }
  /**
   * Build filters for knowledge base query
   */
  buildFilters(query) {
    const filters = {};
    if (query.domain) {
      filters.domain = query.domain;
    }
    if (query.yearRange) {
      if (query.yearRange.start) {
        filters.yearStart = query.yearRange.start;
      }
      if (query.yearRange.end) {
        filters.yearEnd = query.yearRange.end;
      }
    }
    return Object.keys(filters).length > 0 ? filters : void 0;
  }
  /**
   * Extract highlights from content matching query
   */
  extractHighlights(content, query) {
    const highlights = [];
    const queryTerms = query.toLowerCase().split(/\s+/);
    const sentences = content.split(/[.!?]+/);
    for (const sentence of sentences) {
      const normalizedSentence = sentence.toLowerCase();
      const matchCount = queryTerms.filter((term) => normalizedSentence.includes(term)).length;
      if (matchCount >= Math.ceil(queryTerms.length / 2)) {
        const trimmed = sentence.trim();
        if (trimmed.length > 20 && trimmed.length < 500) {
          highlights.push(trimmed);
        }
      }
    }
    return highlights.slice(0, 3);
  }
};
function createLiteratureSearchService(knowledgeBase) {
  return new LiteratureSearchService(knowledgeBase);
}

// src/knowledge/graphrag.ts
var GraphRAGService = class {
  graph;
  communities = /* @__PURE__ */ new Map();
  config;
  constructor(config = {}) {
    this.graph = {
      nodes: /* @__PURE__ */ new Map(),
      edges: /* @__PURE__ */ new Map()
    };
    this.config = {
      maxHops: config.maxHops ?? 3,
      minEdgeWeight: config.minEdgeWeight ?? 0.1,
      communityResolution: config.communityResolution ?? 1
    };
  }
  /**
   * Add a paper to the knowledge graph
   */
  addPaper(paper) {
    const paperNode = {
      id: `paper:${paper.id}`,
      type: "paper",
      label: paper.title,
      properties: {
        year: paper.metadata.year,
        doi: paper.metadata.doi,
        citations: paper.metadata.citations,
        domain: paper.metadata.domain
      }
    };
    this.graph.nodes.set(paperNode.id, paperNode);
    for (const author of paper.metadata.authors) {
      const authorId = `author:${this.normalizeId(author)}`;
      if (!this.graph.nodes.has(authorId)) {
        const authorNode = {
          id: authorId,
          type: "author",
          label: author,
          properties: { paperCount: 1 }
        };
        this.graph.nodes.set(authorId, authorNode);
      } else {
        const node = this.graph.nodes.get(authorId);
        node.properties.paperCount += 1;
      }
      const edgeId = `${authorId}->${paperNode.id}`;
      const edge = {
        id: edgeId,
        source: authorId,
        target: paperNode.id,
        type: "authored",
        weight: 1
      };
      this.graph.edges.set(edgeId, edge);
    }
    if (paper.metadata.journal) {
      const journalId = `journal:${this.normalizeId(paper.metadata.journal)}`;
      if (!this.graph.nodes.has(journalId)) {
        const journalNode = {
          id: journalId,
          type: "journal",
          label: paper.metadata.journal,
          properties: { paperCount: 1 }
        };
        this.graph.nodes.set(journalId, journalNode);
      } else {
        const node = this.graph.nodes.get(journalId);
        node.properties.paperCount += 1;
      }
      const edgeId = `${paperNode.id}->published:${journalId}`;
      const edge = {
        id: edgeId,
        source: paperNode.id,
        target: journalId,
        type: "published_in",
        weight: 1
      };
      this.graph.edges.set(edgeId, edge);
    }
    if (paper.entities) {
      for (const entity of paper.entities) {
        const entityId = `entity:${entity.type}:${this.normalizeId(entity.name)}`;
        if (!this.graph.nodes.has(entityId)) {
          const entityNode = {
            id: entityId,
            type: "entity",
            label: entity.name,
            properties: {
              entityType: entity.type,
              mentionCount: 1
            }
          };
          this.graph.nodes.set(entityId, entityNode);
        } else {
          const node = this.graph.nodes.get(entityId);
          node.properties.mentionCount += 1;
        }
        const edgeId = `${paperNode.id}->mentions:${entityId}`;
        const edge = {
          id: edgeId,
          source: paperNode.id,
          target: entityId,
          type: "mentions",
          weight: entity.confidence ?? 0.8
        };
        this.graph.edges.set(edgeId, edge);
      }
    }
    if (paper.relations) {
      for (const relation of paper.relations) {
        const sourceId = `entity:${relation.source.type}:${this.normalizeId(relation.source.name)}`;
        const targetId = `entity:${relation.target.type}:${this.normalizeId(relation.target.name)}`;
        const edgeId = `${sourceId}->${relation.type}:${targetId}`;
        if (!this.graph.edges.has(edgeId)) {
          const edge = {
            id: edgeId,
            source: sourceId,
            target: targetId,
            type: relation.type,
            weight: relation.confidence ?? 0.7,
            properties: { paperIds: [paper.id] }
          };
          this.graph.edges.set(edgeId, edge);
        } else {
          const edge = this.graph.edges.get(edgeId);
          edge.weight = Math.min(1, edge.weight + 0.1);
          (edge.properties?.paperIds).push(paper.id);
        }
      }
    }
  }
  /**
   * Add citation edge between papers
   */
  addCitation(citingPaperId, citedPaperId) {
    const sourceId = `paper:${citingPaperId}`;
    const targetId = `paper:${citedPaperId}`;
    if (!this.graph.nodes.has(sourceId) || !this.graph.nodes.has(targetId)) {
      return;
    }
    const edgeId = `${sourceId}->cites:${targetId}`;
    if (!this.graph.edges.has(edgeId)) {
      const edge = {
        id: edgeId,
        source: sourceId,
        target: targetId,
        type: "cites",
        weight: 1
      };
      this.graph.edges.set(edgeId, edge);
    }
  }
  /**
   * Query the knowledge graph
   */
  query(startNodeId, maxHops) {
    const hops = maxHops ?? this.config.maxHops ?? 3;
    const visitedNodes = /* @__PURE__ */ new Set();
    const resultNodes = [];
    const resultEdges = [];
    const queue = [{ nodeId: startNodeId, depth: 0 }];
    while (queue.length > 0) {
      const { nodeId, depth } = queue.shift();
      if (visitedNodes.has(nodeId) || depth > hops) continue;
      visitedNodes.add(nodeId);
      const node = this.graph.nodes.get(nodeId);
      if (node) {
        resultNodes.push(node);
      }
      for (const edge of this.graph.edges.values()) {
        if (edge.source === nodeId && !visitedNodes.has(edge.target)) {
          resultEdges.push(edge);
          queue.push({ nodeId: edge.target, depth: depth + 1 });
        }
        if (edge.target === nodeId && !visitedNodes.has(edge.source)) {
          resultEdges.push(edge);
          queue.push({ nodeId: edge.source, depth: depth + 1 });
        }
      }
    }
    return { nodes: resultNodes, edges: resultEdges };
  }
  /**
   * Find shortest path between two nodes
   */
  findPath(sourceId, targetId) {
    const visited = /* @__PURE__ */ new Set();
    const queue = [
      { nodeId: sourceId, path: [sourceId] }
    ];
    while (queue.length > 0) {
      const { nodeId, path } = queue.shift();
      if (nodeId === targetId) {
        return path.map((id) => this.graph.nodes.get(id)).filter(Boolean);
      }
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      for (const edge of this.graph.edges.values()) {
        let neighbor = null;
        if (edge.source === nodeId) neighbor = edge.target;
        if (edge.target === nodeId) neighbor = edge.source;
        if (neighbor && !visited.has(neighbor)) {
          queue.push({ nodeId: neighbor, path: [...path, neighbor] });
        }
      }
    }
    return null;
  }
  /**
   * Get neighbors of a node
   */
  getNeighbors(nodeId) {
    const neighbors = [];
    for (const edge of this.graph.edges.values()) {
      let neighborId = null;
      if (edge.source === nodeId) neighborId = edge.target;
      if (edge.target === nodeId) neighborId = edge.source;
      if (neighborId) {
        const neighbor = this.graph.nodes.get(neighborId);
        if (neighbor) neighbors.push(neighbor);
      }
    }
    return neighbors;
  }
  /**
   * Find nodes by type
   */
  getNodesByType(type) {
    const nodes = [];
    for (const node of this.graph.nodes.values()) {
      if (node.type === type) {
        nodes.push(node);
      }
    }
    return nodes;
  }
  /**
   * Find edges by type
   */
  getEdgesByType(type) {
    const edges = [];
    for (const edge of this.graph.edges.values()) {
      if (edge.type === type) {
        edges.push(edge);
      }
    }
    return edges;
  }
  /**
   * Get the most connected nodes (by degree centrality)
   */
  getTopNodes(limit = 10) {
    const degrees = /* @__PURE__ */ new Map();
    for (const edge of this.graph.edges.values()) {
      degrees.set(edge.source, (degrees.get(edge.source) ?? 0) + 1);
      degrees.set(edge.target, (degrees.get(edge.target) ?? 0) + 1);
    }
    const sorted = Array.from(degrees.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit);
    return sorted.map(([nodeId, degree]) => ({
      node: this.graph.nodes.get(nodeId),
      degree
    })).filter((item) => item.node !== void 0);
  }
  /**
   * Detect communities using label propagation
   */
  detectCommunities() {
    const labels = /* @__PURE__ */ new Map();
    const nodeIds = Array.from(this.graph.nodes.keys());
    for (const nodeId of nodeIds) {
      labels.set(nodeId, nodeId);
    }
    let changed = true;
    let iterations = 0;
    const maxIterations = 100;
    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;
      const shuffled = [...nodeIds].sort(() => Math.random() - 0.5);
      for (const nodeId of shuffled) {
        const labelCounts = /* @__PURE__ */ new Map();
        for (const edge of this.graph.edges.values()) {
          let neighborId = null;
          if (edge.source === nodeId) neighborId = edge.target;
          if (edge.target === nodeId) neighborId = edge.source;
          if (neighborId) {
            const label = labels.get(neighborId);
            labelCounts.set(label, (labelCounts.get(label) ?? 0) + edge.weight);
          }
        }
        let maxCount = 0;
        let maxLabel = labels.get(nodeId);
        for (const [label, count] of labelCounts) {
          if (count > maxCount) {
            maxCount = count;
            maxLabel = label;
          }
        }
        if (maxLabel !== labels.get(nodeId)) {
          labels.set(nodeId, maxLabel);
          changed = true;
        }
      }
    }
    const communityNodes = /* @__PURE__ */ new Map();
    for (const [nodeId, label] of labels) {
      if (!communityNodes.has(label)) {
        communityNodes.set(label, []);
      }
      communityNodes.get(label).push(nodeId);
    }
    const communities = [];
    let communityIndex = 0;
    for (const [_label, nodeIds2] of communityNodes) {
      if (nodeIds2.length < 2) continue;
      const community = {
        id: `community-${communityIndex++}`,
        nodes: nodeIds2,
        keyTerms: this.extractKeyTerms(nodeIds2)
      };
      communities.push(community);
      this.communities.set(community.id, community);
    }
    return communities;
  }
  /**
   * Extract key terms from a set of nodes
   */
  extractKeyTerms(nodeIds) {
    const terms = /* @__PURE__ */ new Map();
    for (const nodeId of nodeIds) {
      const node = this.graph.nodes.get(nodeId);
      if (!node) continue;
      const label = node.label.toLowerCase();
      terms.set(label, (terms.get(label) ?? 0) + 1);
      if (node.type === "entity" && node.properties.entityType) {
        const entityType = node.properties.entityType;
        terms.set(entityType, (terms.get(entityType) ?? 0) + 0.5);
      }
    }
    return Array.from(terms.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([term]) => term);
  }
  /**
   * Get graph statistics
   */
  getStats() {
    const nodesByType = {
      paper: 0,
      entity: 0,
      author: 0,
      journal: 0,
      topic: 0
    };
    for (const node of this.graph.nodes.values()) {
      nodesByType[node.type]++;
    }
    const avgDegree = this.graph.nodes.size > 0 ? this.graph.edges.size * 2 / this.graph.nodes.size : 0;
    return {
      nodeCount: this.graph.nodes.size,
      edgeCount: this.graph.edges.size,
      nodesByType,
      avgDegree
    };
  }
  /**
   * Export graph to serializable format
   */
  exportGraph() {
    return {
      nodes: Array.from(this.graph.nodes.values()),
      edges: Array.from(this.graph.edges.values())
    };
  }
  /**
   * Import graph from serialized format
   */
  importGraph(data) {
    this.graph.nodes.clear();
    this.graph.edges.clear();
    for (const node of data.nodes) {
      this.graph.nodes.set(node.id, node);
    }
    for (const edge of data.edges) {
      this.graph.edges.set(edge.id, edge);
    }
  }
  /**
   * Normalize ID for consistent lookup
   */
  normalizeId(str) {
    return str.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_-]/g, "");
  }
};
function createGraphRAGService(config) {
  return new GraphRAGService(config);
}

// src/knowledge/embedding-provider.ts
function createEmbeddingProvider(config) {
  switch (config.type) {
    case "ollama":
      return new OllamaEmbeddingProvider(config);
    case "azure-ai-search":
      return new AzureSearchProvider(config);
    case "mock":
      return new MockEmbeddingProvider(config);
    default:
      throw new Error(`Unknown embedding provider type: ${config.type}`);
  }
}
var MockEmbeddingProvider = class {
  type = "mock";
  dimensions;
  constructor(config) {
    this.dimensions = config.dimensions;
  }
  async generateEmbedding(text) {
    const embedding = this.hashToEmbedding(text);
    return {
      embedding,
      tokenCount: Math.ceil(text.length / 4)
    };
  }
  async generateEmbeddingBatch(texts) {
    return Promise.all(texts.map((text) => this.generateEmbedding(text)));
  }
  async isAvailable() {
    return true;
  }
  hashToEmbedding(text) {
    const embedding = new Array(this.dimensions).fill(0);
    for (let i = 0; i < text.length; i++) {
      const idx = i % this.dimensions;
      embedding[idx] = (embedding[idx] ?? 0) + text.charCodeAt(i);
    }
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0)
    );
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] = (embedding[i] ?? 0) / magnitude;
      }
    }
    return embedding;
  }
};
var OllamaEmbeddingProvider = class {
  type = "ollama";
  dimensions;
  baseUrl;
  model;
  timeout;
  constructor(config) {
    this.dimensions = config.dimensions;
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.model = config.model;
    this.timeout = config.timeout ?? 3e4;
  }
  async generateEmbedding(text) {
    const response = await this.callOllama("/api/embeddings", {
      model: this.model,
      prompt: text
    });
    return {
      embedding: response.embedding,
      tokenCount: response.prompt_eval_count ?? Math.ceil(text.length / 4)
    };
  }
  async generateEmbeddingBatch(texts) {
    const results = [];
    for (const text of texts) {
      results.push(await this.generateEmbedding(text));
    }
    return results;
  }
  async isAvailable() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        signal: AbortSignal.timeout(5e3)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  async callOllama(path, body) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout)
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${error}`);
    }
    return response.json();
  }
};
var AzureSearchProvider = class {
  type = "azure-ai-search";
  dimensions;
  endpoint;
  apiKey;
  indexName;
  embeddingDeployment;
  constructor(config) {
    this.dimensions = config.dimensions;
    this.endpoint = config.endpoint.replace(/\/$/, "");
    this.apiKey = config.apiKey;
    this.indexName = config.indexName;
    this.embeddingDeployment = config.embeddingDeployment;
  }
  async generateEmbedding(text) {
    if (this.embeddingDeployment) {
      return this.generateAzureOpenAIEmbedding(text);
    }
    throw new Error(
      "Azure AI Search requires embeddingDeployment for generating embeddings"
    );
  }
  async generateEmbeddingBatch(texts) {
    if (this.embeddingDeployment) {
      return this.generateAzureOpenAIEmbeddingBatch(texts);
    }
    throw new Error(
      "Azure AI Search requires embeddingDeployment for generating embeddings"
    );
  }
  async isAvailable() {
    try {
      const response = await fetch(
        `${this.endpoint}/indexes/${this.indexName}?api-version=2024-07-01`,
        {
          method: "GET",
          headers: {
            "api-key": this.apiKey
          },
          signal: AbortSignal.timeout(5e3)
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }
  async indexDocument(request) {
    await this.indexDocuments([request]);
  }
  async indexDocuments(requests) {
    const documents = requests.map((req) => ({
      "@search.action": "mergeOrUpload",
      id: req.id,
      content: req.content,
      embedding: req.embedding,
      ...req.metadata
    }));
    const response = await fetch(
      `${this.endpoint}/indexes/${this.indexName}/docs/index?api-version=2024-07-01`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": this.apiKey
        },
        body: JSON.stringify({ value: documents })
      }
    );
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure Search indexing error: ${response.status} - ${error}`);
    }
  }
  async search(request) {
    const searchBody = {
      vectorQueries: [
        {
          kind: "vector",
          vector: request.embedding,
          fields: "embedding",
          k: request.limit
        }
      ],
      select: "id,content,metadata",
      top: request.limit
    };
    const response = await fetch(
      `${this.endpoint}/indexes/${this.indexName}/docs/search?api-version=2024-07-01`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": this.apiKey
        },
        body: JSON.stringify(searchBody)
      }
    );
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure Search query error: ${response.status} - ${error}`);
    }
    const result = await response.json();
    return result.value.filter((hit) => !request.threshold || hit["@search.score"] >= request.threshold).map((hit) => ({
      id: hit.id,
      score: hit["@search.score"],
      content: hit.content,
      metadata: hit.metadata ?? {}
    }));
  }
  async deleteDocument(id) {
    const response = await fetch(
      `${this.endpoint}/indexes/${this.indexName}/docs/index?api-version=2024-07-01`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": this.apiKey
        },
        body: JSON.stringify({
          value: [{ "@search.action": "delete", id }]
        })
      }
    );
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure Search delete error: ${response.status} - ${error}`);
    }
  }
  async clearIndex() {
    throw new Error(
      "clearIndex not supported for Azure AI Search. Delete and recreate the index instead."
    );
  }
  async generateAzureOpenAIEmbedding(text) {
    const results = await this.generateAzureOpenAIEmbeddingBatch([text]);
    const result = results[0];
    if (!result) {
      throw new Error("Failed to generate embedding");
    }
    return result;
  }
  async generateAzureOpenAIEmbeddingBatch(texts) {
    this.embeddingDeployment;
    const response = await fetch(
      `${this.endpoint}/openai/deployments/${this.embeddingDeployment}/embeddings?api-version=2024-02-01`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": this.apiKey
        },
        body: JSON.stringify({
          input: texts
        })
      }
    );
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure OpenAI embedding error: ${response.status} - ${error}`);
    }
    const result = await response.json();
    return result.data.map((item) => ({
      embedding: item.embedding,
      tokenCount: result.usage.prompt_tokens / texts.length
    }));
  }
};

// src/knowledge/vector-store.ts
function createVectorStore(config) {
  switch (config.type) {
    case "memory":
      return new InMemoryVectorStore();
    case "pgvector":
    case "qdrant":
      throw new Error(`Vector store type '${config.type}' not yet implemented`);
    default:
      throw new Error(`Unsupported vector store type: ${config.type}`);
  }
}
var InMemoryVectorStore = class {
  documents = /* @__PURE__ */ new Map();
  async addDocument(doc) {
    this.documents.set(doc.id, { ...doc });
  }
  async addDocuments(docs) {
    for (const doc of docs) {
      this.documents.set(doc.id, { ...doc });
    }
  }
  async getDocument(id) {
    const doc = this.documents.get(id);
    return doc ? { ...doc } : null;
  }
  async deleteDocument(id) {
    this.documents.delete(id);
  }
  async search(request) {
    const { embedding, limit, threshold = 0, filter } = request;
    const results = [];
    for (const doc of this.documents.values()) {
      if (filter && !this.matchesFilter(doc.metadata, filter)) {
        continue;
      }
      const score = this.cosineSimilarity(embedding, doc.embedding);
      if (score >= threshold) {
        results.push({
          id: doc.id,
          content: doc.content,
          score,
          metadata: { ...doc.metadata }
        });
      }
    }
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }
  async clear() {
    this.documents.clear();
  }
  async getStats() {
    let dimensions = null;
    const firstDoc = this.documents.values().next().value;
    if (firstDoc) {
      dimensions = firstDoc.embedding.length;
    }
    return {
      documentCount: this.documents.size,
      dimensions
    };
  }
  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(a, b) {
    if (a.length !== b.length) {
      throw new Error(
        `Vector dimension mismatch: ${a.length} vs ${b.length}`
      );
    }
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += (a[i] ?? 0) * (b[i] ?? 0);
      normA += (a[i] ?? 0) * (a[i] ?? 0);
      normB += (b[i] ?? 0) * (b[i] ?? 0);
    }
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    if (magnitude === 0) {
      return 0;
    }
    return dotProduct / magnitude;
  }
  /**
   * Check if document metadata matches filter
   */
  matchesFilter(metadata, filter) {
    for (const [key, value] of Object.entries(filter)) {
      if (metadata[key] !== value) {
        return false;
      }
    }
    return true;
  }
};

// src/knowledge/semantic-search.ts
var SemanticSearchService = class {
  embeddingProvider;
  vectorStore;
  documentChunks = /* @__PURE__ */ new Map();
  constructor(config) {
    this.embeddingProvider = config.embeddingProvider;
    this.vectorStore = config.vectorStore;
  }
  /**
   * Index a single document
   */
  async indexDocument(doc) {
    if (!doc.content || doc.content.trim().length === 0) {
      throw new Error("Content cannot be empty");
    }
    const chunks = this.chunkContent(
      doc.content,
      doc.chunkSize ?? 1e3,
      doc.chunkOverlap ?? 100
    );
    const chunkIds = [];
    if (chunks.length === 1) {
      const chunkContent = chunks[0] ?? "";
      const embedding = await this.embeddingProvider.generateEmbedding(chunkContent);
      await this.vectorStore.addDocument({
        id: doc.id,
        content: chunkContent,
        embedding: embedding.embedding,
        metadata: { ...doc.metadata, originalId: doc.id }
      });
      chunkIds.push(doc.id);
    } else {
      for (let i = 0; i < chunks.length; i++) {
        const chunkId = `${doc.id}#chunk-${i}`;
        const chunkContent = chunks[i] ?? "";
        const embedding = await this.embeddingProvider.generateEmbedding(chunkContent);
        await this.vectorStore.addDocument({
          id: chunkId,
          content: chunkContent,
          embedding: embedding.embedding,
          metadata: {
            ...doc.metadata,
            originalId: doc.id,
            chunkIndex: i,
            totalChunks: chunks.length
          }
        });
        chunkIds.push(chunkId);
      }
    }
    this.documentChunks.set(doc.id, chunkIds);
  }
  /**
   * Index multiple documents in batch
   */
  async indexDocuments(docs) {
    const validDocs = docs.filter((doc) => doc.content && doc.content.trim().length > 0);
    if (validDocs.length === 0) {
      return;
    }
    const contents = validDocs.map((doc) => doc.content);
    const embeddings = await this.embeddingProvider.generateEmbeddingBatch(contents);
    const vectorDocs = validDocs.map((doc, i) => {
      const embeddingResult = embeddings[i];
      return {
        id: doc.id,
        content: doc.content,
        embedding: embeddingResult?.embedding ?? [],
        metadata: { ...doc.metadata, originalId: doc.id }
      };
    });
    await this.vectorStore.addDocuments(vectorDocs);
    for (const doc of validDocs) {
      this.documentChunks.set(doc.id, [doc.id]);
    }
  }
  /**
   * Search for similar documents
   */
  async search(query, options) {
    if (!query || query.trim().length === 0) {
      throw new Error("Query cannot be empty");
    }
    const queryEmbedding = await this.embeddingProvider.generateEmbedding(query);
    return this.vectorStore.search({
      embedding: queryEmbedding.embedding,
      limit: options.limit,
      threshold: options.threshold,
      filter: options.filter
    });
  }
  /**
   * Delete a document and all its chunks
   */
  async deleteDocument(docId) {
    const chunkIds = this.documentChunks.get(docId) ?? [docId];
    for (const chunkId of chunkIds) {
      await this.vectorStore.deleteDocument(chunkId);
    }
    this.documentChunks.delete(docId);
  }
  /**
   * Update an existing document
   */
  async updateDocument(doc) {
    await this.deleteDocument(doc.id);
    await this.indexDocument(doc);
  }
  /**
   * Build context for RAG from search results
   */
  async buildContext(query, options) {
    const results = await this.search(query, {
      limit: options.limit,
      threshold: options.threshold,
      filter: options.filter
    });
    const maxTokens = options.maxTokens ?? 4e3;
    const contextParts = [];
    const sources = [];
    let currentTokens = 0;
    for (const result of results) {
      const estimatedTokens = Math.ceil(result.content.length / 4);
      if (currentTokens + estimatedTokens > maxTokens) {
        const remainingTokens = maxTokens - currentTokens;
        const truncatedContent = result.content.slice(0, remainingTokens * 4);
        if (truncatedContent.length > 50) {
          contextParts.push(truncatedContent + "...");
          sources.push({
            id: result.id,
            score: result.score,
            content: truncatedContent
          });
        }
        break;
      }
      contextParts.push(result.content);
      sources.push({
        id: result.id,
        score: result.score,
        content: result.content
      });
      currentTokens += estimatedTokens;
    }
    const context = contextParts.join("\n\n---\n\n");
    return {
      context,
      sources,
      tokenCount: Math.ceil(context.length / 4)
    };
  }
  /**
   * Get service statistics
   */
  async getStats() {
    const storeStats = await this.vectorStore.getStats();
    return {
      documentCount: storeStats.documentCount,
      dimensions: storeStats.dimensions,
      providerType: this.embeddingProvider.type
    };
  }
  /**
   * Check if the service is available
   */
  async isAvailable() {
    return this.embeddingProvider.isAvailable();
  }
  /**
   * Chunk content into smaller pieces
   */
  chunkContent(content, chunkSize, chunkOverlap) {
    if (content.length <= chunkSize) {
      return [content];
    }
    const chunks = [];
    let start = 0;
    while (start < content.length) {
      let end = start + chunkSize;
      if (end < content.length) {
        const paragraphBreak = content.lastIndexOf("\n\n", end);
        if (paragraphBreak > start + chunkSize / 2) {
          end = paragraphBreak + 2;
        } else {
          const sentenceBreak = content.lastIndexOf(". ", end);
          if (sentenceBreak > start + chunkSize / 2) {
            end = sentenceBreak + 2;
          }
        }
      }
      chunks.push(content.slice(start, end).trim());
      start = end - chunkOverlap;
      if (start >= content.length - chunkOverlap) {
        break;
      }
    }
    return chunks.filter((chunk) => chunk.length > 0);
  }
};

export { AzureSearchProvider, DocumentProcessor, GraphRAGService, InMemoryVectorStore, KnowledgeBase, LiteratureSearchService, MockEmbeddingProvider, OllamaEmbeddingProvider, RAGService, SemanticSearchService, createEmbeddingProvider, createGraphRAGService, createLiteratureSearchService, createVectorStore };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map
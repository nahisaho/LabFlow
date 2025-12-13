/**
 * Knowledge Schema
 *
 * KNOW-001: Knowledge base management
 */

import { pgTable, uuid, varchar, timestamp, jsonb, integer, index, vector } from 'drizzle-orm/pg-core';
import { users } from './users.js';

/**
 * Document types
 */
export const documentTypes = ['paper', 'protocol', 'documentation', 'tutorial', 'workflow', 'note'] as const;
export type DocumentTypeEnum = (typeof documentTypes)[number];

/**
 * Processing status
 */
export const processingStatuses = ['pending', 'processing', 'indexed', 'error'] as const;
export type ProcessingStatusEnum = (typeof processingStatuses)[number];

/**
 * Knowledge documents table
 */
export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 500 }).notNull(),
    type: varchar('type', { length: 50 }).$type<DocumentTypeEnum>().notNull(),
    content: varchar('content', { length: 100000 }),
    status: varchar('status', { length: 50 }).$type<ProcessingStatusEnum>().notNull().default('pending'),
    source: varchar('source', { length: 1000 }),
    doi: varchar('doi', { length: 255 }),
    authors: jsonb('authors').$type<string[]>().default([]),
    tags: jsonb('tags').$type<string[]>().default([]),
    domain: varchar('domain', { length: 50 }),
    language: varchar('language', { length: 10 }).default('en'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    uploadedById: uuid('uploaded_by_id').references(() => users.id),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('documents_type_idx').on(table.type),
    index('documents_status_idx').on(table.status),
    index('documents_domain_idx').on(table.domain),
    index('documents_doi_idx').on(table.doi),
  ]
);

/**
 * Document chunks table for vector embeddings
 * Note: Requires pgvector extension
 */
export const documentChunks = pgTable(
  'document_chunks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    content: varchar('content', { length: 10000 }).notNull(),
    position: integer('position').notNull(),
    charStart: integer('char_start').notNull(),
    charEnd: integer('char_end').notNull(),
    pageNumber: integer('page_number'),
    section: varchar('section', { length: 255 }),
    embedding: vector('embedding', { dimensions: 1536 }), // OpenAI ada-002 dimensions
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('document_chunks_document_id_idx').on(table.documentId),
    index('document_chunks_position_idx').on(table.position),
    // Note: Vector index should be created with HNSW or IVFFlat
    // CREATE INDEX ON document_chunks USING hnsw (embedding vector_cosine_ops);
  ]
);

/**
 * Knowledge types for TypeScript
 */
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type DocumentChunk = typeof documentChunks.$inferSelect;
export type NewDocumentChunk = typeof documentChunks.$inferInsert;

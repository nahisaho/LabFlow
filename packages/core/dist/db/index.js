import { pgTable, timestamp, jsonb, varchar, boolean, uuid, index, integer, real, vector, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/db/schema/index.ts
var schema_exports = {};
__export(schema_exports, {
  authProviders: () => authProviders,
  datasetTypes: () => datasetTypes,
  datasetVisibilities: () => datasetVisibilities,
  documentChunks: () => documentChunks,
  documentChunksRelations: () => documentChunksRelations,
  documentTypes: () => documentTypes,
  documents: () => documents,
  documentsRelations: () => documentsRelations,
  executionArtifacts: () => executionArtifacts,
  executionArtifactsRelations: () => executionArtifactsRelations,
  executionStatuses: () => executionStatuses,
  executions: () => executions,
  executionsRelations: () => executionsRelations,
  experimentStatuses: () => experimentStatuses,
  labDatasets: () => labDatasets,
  labDatasetsRelations: () => labDatasetsRelations,
  labExperiments: () => labExperiments,
  labExperimentsRelations: () => labExperimentsRelations,
  labInvitations: () => labInvitations,
  labInvitationsRelations: () => labInvitationsRelations,
  labMemberRoles: () => labMemberRoles,
  labMembers: () => labMembers,
  labMembersRelations: () => labMembersRelations,
  labs: () => labs,
  labsRelations: () => labsRelations,
  pluginDependencies: () => pluginDependencies,
  pluginDependenciesRelations: () => pluginDependenciesRelations,
  pluginStatuses: () => pluginStatuses,
  plugins: () => plugins,
  pluginsRelations: () => pluginsRelations,
  processingStatuses: () => processingStatuses,
  researchDomains: () => researchDomains,
  sessions: () => sessions,
  sessionsRelations: () => sessionsRelations,
  stepExecutions: () => stepExecutions,
  stepExecutionsRelations: () => stepExecutionsRelations,
  stepStatuses: () => stepStatuses,
  userRoles: () => userRoles,
  users: () => users,
  usersRelations: () => usersRelations,
  workflowCollaborators: () => workflowCollaborators,
  workflowCollaboratorsRelations: () => workflowCollaboratorsRelations,
  workflowStatuses: () => workflowStatuses,
  workflows: () => workflows,
  workflowsRelations: () => workflowsRelations
});
var authProviders = ["local", "entra", "shibboleth"];
var userRoles = ["admin", "researcher", "viewer"];
var users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }),
    passwordHash: varchar("password_hash", { length: 255 }),
    authProvider: varchar("auth_provider", { length: 50 }).$type().notNull().default("local"),
    externalId: varchar("external_id", { length: 255 }),
    role: varchar("role", { length: 50 }).$type().notNull().default("researcher"),
    isActive: boolean("is_active").notNull().default(true),
    emailVerified: boolean("email_verified").notNull().default(false),
    failedLoginAttempts: varchar("failed_login_attempts", { length: 10 }).notNull().default("0"),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("users_email_idx").on(table.email),
    index("users_auth_provider_idx").on(table.authProvider),
    index("users_external_id_idx").on(table.externalId)
  ]
);
var sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    refreshToken: varchar("refresh_token", { length: 500 }).notNull().unique(),
    userAgent: varchar("user_agent", { length: 500 }),
    ipAddress: varchar("ip_address", { length: 50 }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_refresh_token_idx").on(table.refreshToken),
    index("sessions_expires_at_idx").on(table.expiresAt)
  ]
);
var researchDomains = ["drug_discovery", "materials_science", "climate", "genomics", "custom"];
var workflowStatuses = ["draft", "published", "archived", "deprecated"];
var workflows = pgTable(
  "workflows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    description: varchar("description", { length: 2e3 }),
    domain: varchar("domain", { length: 50 }).$type().notNull(),
    status: varchar("status", { length: 50 }).$type().notNull().default("draft"),
    version: integer("version").notNull().default(1),
    isTemplate: boolean("is_template").notNull().default(false),
    parentTemplateId: uuid("parent_template_id"),
    // Self-reference handled via relations
    ownerId: uuid("owner_id").notNull().references(() => users.id),
    steps: jsonb("steps").$type().notNull().default([]),
    config: jsonb("config").$type().default({}),
    tags: jsonb("tags").$type().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true })
  },
  (table) => [
    index("workflows_owner_id_idx").on(table.ownerId),
    index("workflows_domain_idx").on(table.domain),
    index("workflows_status_idx").on(table.status),
    index("workflows_is_template_idx").on(table.isTemplate)
  ]
);
var workflowCollaborators = pgTable(
  "workflow_collaborators",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workflowId: uuid("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }).notNull().default("viewer"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("workflow_collaborators_workflow_id_idx").on(table.workflowId),
    index("workflow_collaborators_user_id_idx").on(table.userId)
  ]
);
var executionStatuses = ["pending", "running", "paused", "completed", "failed", "cancelled"];
var stepStatuses = ["pending", "running", "completed", "failed", "skipped"];
var executions = pgTable(
  "executions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workflowId: uuid("workflow_id").notNull().references(() => workflows.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    status: varchar("status", { length: 50 }).$type().notNull().default("pending"),
    progress: real("progress").notNull().default(0),
    currentStepId: varchar("current_step_id", { length: 100 }),
    inputs: jsonb("inputs").$type().default({}),
    outputs: jsonb("outputs").$type().default({}),
    error: varchar("error", { length: 2e3 }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("executions_workflow_id_idx").on(table.workflowId),
    index("executions_user_id_idx").on(table.userId),
    index("executions_status_idx").on(table.status),
    index("executions_created_at_idx").on(table.createdAt)
  ]
);
var stepExecutions = pgTable(
  "step_executions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    executionId: uuid("execution_id").notNull().references(() => executions.id, { onDelete: "cascade" }),
    stepId: varchar("step_id", { length: 100 }).notNull(),
    status: varchar("status", { length: 50 }).$type().notNull().default("pending"),
    progress: real("progress").notNull().default(0),
    inputs: jsonb("inputs").$type().default({}),
    outputs: jsonb("outputs").$type().default({}),
    error: varchar("error", { length: 2e3 }),
    retryCount: integer("retry_count").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("step_executions_execution_id_idx").on(table.executionId),
    index("step_executions_step_id_idx").on(table.stepId),
    index("step_executions_status_idx").on(table.status)
  ]
);
var executionArtifacts = pgTable(
  "execution_artifacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    executionId: uuid("execution_id").notNull().references(() => executions.id, { onDelete: "cascade" }),
    stepId: varchar("step_id", { length: 100 }),
    name: varchar("name", { length: 255 }).notNull(),
    type: varchar("type", { length: 100 }).notNull(),
    path: varchar("path", { length: 1e3 }).notNull(),
    size: integer("size"),
    metadata: jsonb("metadata").$type().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("execution_artifacts_execution_id_idx").on(table.executionId),
    index("execution_artifacts_step_id_idx").on(table.stepId)
  ]
);
var pluginStatuses = ["active", "inactive", "error"];
var plugins = pgTable(
  "plugins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pluginId: varchar("plugin_id", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    version: varchar("version", { length: 50 }).notNull(),
    domain: varchar("domain", { length: 50 }).notNull(),
    description: varchar("description", { length: 2e3 }),
    author: varchar("author", { length: 255 }),
    status: varchar("status", { length: 50 }).$type().notNull().default("inactive"),
    isBuiltIn: boolean("is_built_in").notNull().default(false),
    config: jsonb("config").$type().default({}),
    metadata: jsonb("metadata").$type().default({}),
    installedAt: timestamp("installed_at", { withTimezone: true }).notNull().defaultNow(),
    lastActivatedAt: timestamp("last_activated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("plugins_plugin_id_idx").on(table.pluginId),
    index("plugins_domain_idx").on(table.domain),
    index("plugins_status_idx").on(table.status)
  ]
);
var pluginDependencies = pgTable(
  "plugin_dependencies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pluginId: uuid("plugin_id").notNull().references(() => plugins.id, { onDelete: "cascade" }),
    dependsOnPluginId: varchar("depends_on_plugin_id", { length: 255 }).notNull(),
    versionConstraint: varchar("version_constraint", { length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("plugin_dependencies_plugin_id_idx").on(table.pluginId)
  ]
);
var documentTypes = ["paper", "protocol", "documentation", "tutorial", "workflow", "note"];
var processingStatuses = ["pending", "processing", "indexed", "error"];
var documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 500 }).notNull(),
    type: varchar("type", { length: 50 }).$type().notNull(),
    content: varchar("content", { length: 1e5 }),
    status: varchar("status", { length: 50 }).$type().notNull().default("pending"),
    source: varchar("source", { length: 1e3 }),
    doi: varchar("doi", { length: 255 }),
    authors: jsonb("authors").$type().default([]),
    tags: jsonb("tags").$type().default([]),
    domain: varchar("domain", { length: 50 }),
    language: varchar("language", { length: 10 }).default("en"),
    metadata: jsonb("metadata").$type().default({}),
    uploadedById: uuid("uploaded_by_id").references(() => users.id),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("documents_type_idx").on(table.type),
    index("documents_status_idx").on(table.status),
    index("documents_domain_idx").on(table.domain),
    index("documents_doi_idx").on(table.doi)
  ]
);
var documentChunks = pgTable(
  "document_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
    content: varchar("content", { length: 1e4 }).notNull(),
    position: integer("position").notNull(),
    charStart: integer("char_start").notNull(),
    charEnd: integer("char_end").notNull(),
    pageNumber: integer("page_number"),
    section: varchar("section", { length: 255 }),
    embedding: vector("embedding", { dimensions: 1536 }),
    // OpenAI ada-002 dimensions
    metadata: jsonb("metadata").$type().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("document_chunks_document_id_idx").on(table.documentId),
    index("document_chunks_position_idx").on(table.position)
    // Note: Vector index should be created with HNSW or IVFFlat
    // CREATE INDEX ON document_chunks USING hnsw (embedding vector_cosine_ops);
  ]
);
var labMemberRoles = ["owner", "admin", "member", "viewer"];
var datasetTypes = [
  "experiment",
  "simulation",
  "screening",
  "literature",
  "molecule",
  "material",
  "sequence",
  "other"
];
var datasetVisibilities = ["private", "lab", "public"];
var experimentStatuses = ["draft", "running", "completed", "failed", "archived"];
var labs = pgTable(
  "labs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    description: varchar("description", { length: 2e3 }),
    organization: varchar("organization", { length: 255 }),
    domain: varchar("domain", { length: 50 }),
    // drug-discovery, materials-science, etc.
    avatarUrl: varchar("avatar_url", { length: 500 }),
    settings: jsonb("settings").$type().default({}),
    isActive: boolean("is_active").notNull().default(true),
    createdById: uuid("created_by_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("labs_slug_idx").on(table.slug),
    index("labs_domain_idx").on(table.domain),
    index("labs_created_by_idx").on(table.createdById)
  ]
);
var labMembers = pgTable(
  "lab_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    labId: uuid("lab_id").notNull().references(() => labs.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }).$type().notNull().default("member"),
    isActive: boolean("is_active").notNull().default(true),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    invitedById: uuid("invited_by_id").references(() => users.id)
  },
  (table) => [
    index("lab_members_lab_id_idx").on(table.labId),
    index("lab_members_user_id_idx").on(table.userId),
    unique("lab_members_lab_user_unique").on(table.labId, table.userId)
  ]
);
var labDatasets = pgTable(
  "lab_datasets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    labId: uuid("lab_id").notNull().references(() => labs.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: varchar("description", { length: 5e3 }),
    type: varchar("type", { length: 50 }).$type().notNull(),
    visibility: varchar("visibility", { length: 50 }).$type().notNull().default("lab"),
    // Data location
    storageUrl: varchar("storage_url", { length: 1e3 }),
    filePath: varchar("file_path", { length: 500 }),
    fileSize: integer("file_size"),
    // bytes
    fileFormat: varchar("file_format", { length: 50 }),
    // csv, json, parquet, etc.
    // Metadata
    schema: jsonb("schema").$type(),
    rowCount: integer("row_count"),
    columnCount: integer("column_count"),
    tags: jsonb("tags").$type().default([]),
    metadata: jsonb("metadata").$type().default({}),
    // Versioning
    version: varchar("version", { length: 50 }).default("1.0.0"),
    parentId: uuid("parent_id"),
    // Previous version
    // GraphRAG integration
    isIndexed: boolean("is_indexed").notNull().default(false),
    indexedAt: timestamp("indexed_at", { withTimezone: true }),
    // Ownership
    createdById: uuid("created_by_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("lab_datasets_lab_id_idx").on(table.labId),
    index("lab_datasets_type_idx").on(table.type),
    index("lab_datasets_visibility_idx").on(table.visibility),
    index("lab_datasets_created_by_idx").on(table.createdById)
  ]
);
var labExperiments = pgTable(
  "lab_experiments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    labId: uuid("lab_id").notNull().references(() => labs.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: varchar("description", { length: 5e3 }),
    hypothesis: varchar("hypothesis", { length: 2e3 }),
    status: varchar("status", { length: 50 }).$type().notNull().default("draft"),
    // Experiment configuration
    workflowId: uuid("workflow_id"),
    parameters: jsonb("parameters").$type().default({}),
    // Results
    results: jsonb("results").$type(),
    conclusions: varchar("conclusions", { length: 5e3 }),
    // Input/Output datasets
    inputDatasetIds: jsonb("input_dataset_ids").$type().default([]),
    outputDatasetIds: jsonb("output_dataset_ids").$type().default([]),
    // Metadata
    tags: jsonb("tags").$type().default([]),
    metadata: jsonb("metadata").$type().default({}),
    // Timeline
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    // Ownership
    createdById: uuid("created_by_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("lab_experiments_lab_id_idx").on(table.labId),
    index("lab_experiments_status_idx").on(table.status),
    index("lab_experiments_created_by_idx").on(table.createdById)
  ]
);
var labInvitations = pgTable(
  "lab_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    labId: uuid("lab_id").notNull().references(() => labs.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    role: varchar("role", { length: 50 }).$type().notNull().default("member"),
    token: varchar("token", { length: 100 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    invitedById: uuid("invited_by_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("lab_invitations_lab_id_idx").on(table.labId),
    index("lab_invitations_email_idx").on(table.email),
    index("lab_invitations_token_idx").on(table.token)
  ]
);
var usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  workflows: many(workflows),
  executions: many(executions),
  documents: many(documents),
  collaborations: many(workflowCollaborators)
}));
var sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id]
  })
}));
var workflowsRelations = relations(workflows, ({ one, many }) => ({
  owner: one(users, {
    fields: [workflows.ownerId],
    references: [users.id]
  }),
  parentTemplate: one(workflows, {
    fields: [workflows.parentTemplateId],
    references: [workflows.id]
  }),
  executions: many(executions),
  collaborators: many(workflowCollaborators)
}));
var workflowCollaboratorsRelations = relations(workflowCollaborators, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowCollaborators.workflowId],
    references: [workflows.id]
  }),
  user: one(users, {
    fields: [workflowCollaborators.userId],
    references: [users.id]
  })
}));
var executionsRelations = relations(executions, ({ one, many }) => ({
  workflow: one(workflows, {
    fields: [executions.workflowId],
    references: [workflows.id]
  }),
  user: one(users, {
    fields: [executions.userId],
    references: [users.id]
  }),
  stepExecutions: many(stepExecutions),
  artifacts: many(executionArtifacts)
}));
var stepExecutionsRelations = relations(stepExecutions, ({ one }) => ({
  execution: one(executions, {
    fields: [stepExecutions.executionId],
    references: [executions.id]
  })
}));
var executionArtifactsRelations = relations(executionArtifacts, ({ one }) => ({
  execution: one(executions, {
    fields: [executionArtifacts.executionId],
    references: [executions.id]
  })
}));
var pluginsRelations = relations(plugins, ({ many }) => ({
  dependencies: many(pluginDependencies)
}));
var pluginDependenciesRelations = relations(pluginDependencies, ({ one }) => ({
  plugin: one(plugins, {
    fields: [pluginDependencies.pluginId],
    references: [plugins.id]
  })
}));
var documentsRelations = relations(documents, ({ one, many }) => ({
  uploadedBy: one(users, {
    fields: [documents.uploadedById],
    references: [users.id]
  }),
  chunks: many(documentChunks)
}));
var documentChunksRelations = relations(documentChunks, ({ one }) => ({
  document: one(documents, {
    fields: [documentChunks.documentId],
    references: [documents.id]
  })
}));
var labsRelations = relations(labs, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [labs.createdById],
    references: [users.id]
  }),
  members: many(labMembers),
  datasets: many(labDatasets),
  experiments: many(labExperiments),
  invitations: many(labInvitations)
}));
var labMembersRelations = relations(labMembers, ({ one }) => ({
  lab: one(labs, {
    fields: [labMembers.labId],
    references: [labs.id]
  }),
  user: one(users, {
    fields: [labMembers.userId],
    references: [users.id]
  }),
  invitedBy: one(users, {
    fields: [labMembers.invitedById],
    references: [users.id]
  })
}));
var labDatasetsRelations = relations(labDatasets, ({ one }) => ({
  lab: one(labs, {
    fields: [labDatasets.labId],
    references: [labs.id]
  }),
  createdBy: one(users, {
    fields: [labDatasets.createdById],
    references: [users.id]
  })
}));
var labExperimentsRelations = relations(labExperiments, ({ one }) => ({
  lab: one(labs, {
    fields: [labExperiments.labId],
    references: [labs.id]
  }),
  createdBy: one(users, {
    fields: [labExperiments.createdById],
    references: [users.id]
  })
}));
var labInvitationsRelations = relations(labInvitations, ({ one }) => ({
  lab: one(labs, {
    fields: [labInvitations.labId],
    references: [labs.id]
  }),
  invitedBy: one(users, {
    fields: [labInvitations.invitedById],
    references: [users.id]
  })
}));
function createDbConnection(options) {
  const client = postgres(options.connectionString, {
    max: options.max ?? 10,
    idle_timeout: options.idleTimeout ?? 20
  });
  return drizzle(client, { schema: schema_exports });
}

// src/db/drizzle.ts
var _db = null;
function getDb() {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    _db = createDbConnection({ connectionString });
  }
  return _db;
}
function initializeDb(connectionString) {
  _db = createDbConnection({ connectionString });
  return _db;
}
function getCurrentDb() {
  return _db;
}

export { authProviders, createDbConnection, datasetTypes, datasetVisibilities, documentChunks, documentChunksRelations, documentTypes, documents, documentsRelations, executionArtifacts, executionArtifactsRelations, executionStatuses, executions, executionsRelations, experimentStatuses, getCurrentDb, getDb, initializeDb, labDatasets, labDatasetsRelations, labExperiments, labExperimentsRelations, labInvitations, labInvitationsRelations, labMemberRoles, labMembers, labMembersRelations, labs, labsRelations, pluginDependencies, pluginDependenciesRelations, pluginStatuses, plugins, pluginsRelations, processingStatuses, researchDomains, sessions, sessionsRelations, stepExecutions, stepExecutionsRelations, stepStatuses, userRoles, users, usersRelations, workflowCollaborators, workflowCollaboratorsRelations, workflowStatuses, workflows, workflowsRelations };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map
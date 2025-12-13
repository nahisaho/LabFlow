/**
 * Database Relations
 *
 * Drizzle ORM relation definitions
 */

import { relations } from 'drizzle-orm';
import { users, sessions } from './users.js';
import { workflows, workflowCollaborators } from './workflows.js';
import { executions, stepExecutions, executionArtifacts } from './executions.js';
import { plugins, pluginDependencies } from './plugins.js';
import { documents, documentChunks } from './knowledge.js';
import { labs, labMembers, labDatasets, labExperiments, labInvitations } from './labs.js';

/**
 * User relations
 */
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  workflows: many(workflows),
  executions: many(executions),
  documents: many(documents),
  collaborations: many(workflowCollaborators),
}));

/**
 * Session relations
 */
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

/**
 * Workflow relations
 */
export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  owner: one(users, {
    fields: [workflows.ownerId],
    references: [users.id],
  }),
  parentTemplate: one(workflows, {
    fields: [workflows.parentTemplateId],
    references: [workflows.id],
  }),
  executions: many(executions),
  collaborators: many(workflowCollaborators),
}));

/**
 * Workflow collaborator relations
 */
export const workflowCollaboratorsRelations = relations(workflowCollaborators, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowCollaborators.workflowId],
    references: [workflows.id],
  }),
  user: one(users, {
    fields: [workflowCollaborators.userId],
    references: [users.id],
  }),
}));

/**
 * Execution relations
 */
export const executionsRelations = relations(executions, ({ one, many }) => ({
  workflow: one(workflows, {
    fields: [executions.workflowId],
    references: [workflows.id],
  }),
  user: one(users, {
    fields: [executions.userId],
    references: [users.id],
  }),
  stepExecutions: many(stepExecutions),
  artifacts: many(executionArtifacts),
}));

/**
 * Step execution relations
 */
export const stepExecutionsRelations = relations(stepExecutions, ({ one }) => ({
  execution: one(executions, {
    fields: [stepExecutions.executionId],
    references: [executions.id],
  }),
}));

/**
 * Execution artifact relations
 */
export const executionArtifactsRelations = relations(executionArtifacts, ({ one }) => ({
  execution: one(executions, {
    fields: [executionArtifacts.executionId],
    references: [executions.id],
  }),
}));

/**
 * Plugin relations
 */
export const pluginsRelations = relations(plugins, ({ many }) => ({
  dependencies: many(pluginDependencies),
}));

/**
 * Plugin dependency relations
 */
export const pluginDependenciesRelations = relations(pluginDependencies, ({ one }) => ({
  plugin: one(plugins, {
    fields: [pluginDependencies.pluginId],
    references: [plugins.id],
  }),
}));

/**
 * Document relations
 */
export const documentsRelations = relations(documents, ({ one, many }) => ({
  uploadedBy: one(users, {
    fields: [documents.uploadedById],
    references: [users.id],
  }),
  chunks: many(documentChunks),
}));

/**
 * Document chunk relations
 */
export const documentChunksRelations = relations(documentChunks, ({ one }) => ({
  document: one(documents, {
    fields: [documentChunks.documentId],
    references: [documents.id],
  }),
}));

/**
 * Lab relations
 */
export const labsRelations = relations(labs, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [labs.createdById],
    references: [users.id],
  }),
  members: many(labMembers),
  datasets: many(labDatasets),
  experiments: many(labExperiments),
  invitations: many(labInvitations),
}));

/**
 * Lab member relations
 */
export const labMembersRelations = relations(labMembers, ({ one }) => ({
  lab: one(labs, {
    fields: [labMembers.labId],
    references: [labs.id],
  }),
  user: one(users, {
    fields: [labMembers.userId],
    references: [users.id],
  }),
  invitedBy: one(users, {
    fields: [labMembers.invitedById],
    references: [users.id],
  }),
}));

/**
 * Lab dataset relations
 */
export const labDatasetsRelations = relations(labDatasets, ({ one }) => ({
  lab: one(labs, {
    fields: [labDatasets.labId],
    references: [labs.id],
  }),
  createdBy: one(users, {
    fields: [labDatasets.createdById],
    references: [users.id],
  }),
}));

/**
 * Lab experiment relations
 */
export const labExperimentsRelations = relations(labExperiments, ({ one }) => ({
  lab: one(labs, {
    fields: [labExperiments.labId],
    references: [labs.id],
  }),
  createdBy: one(users, {
    fields: [labExperiments.createdById],
    references: [users.id],
  }),
}));

/**
 * Lab invitation relations
 */
export const labInvitationsRelations = relations(labInvitations, ({ one }) => ({
  lab: one(labs, {
    fields: [labInvitations.labId],
    references: [labs.id],
  }),
  invitedBy: one(users, {
    fields: [labInvitations.invitedById],
    references: [users.id],
  }),
}));

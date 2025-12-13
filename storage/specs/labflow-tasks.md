# LabFlow Task Breakdown

**Project**: LabFlow
**Feature**: AI for Science Starter Kit - MVP
**Last Updated**: 2025-12-13
**Version**: 1.0
**Status**: Draft

---

## 1. Overview

This document breaks down the LabFlow design into actionable implementation tasks with full requirements traceability.

### 1.1 Task ID Schema

```
TASK-[CATEGORY]-[NUMBER]
```

| Category | Description |
|----------|-------------|
| INFRA | Infrastructure & Project Setup |
| AUTH | Authentication System |
| CORE | Core Library |
| WKFL | Workflow Engine |
| GRAG | GraphRAG & Knowledge |
| PLUG | Plugin Architecture |
| WEB | Web Application |
| CLI | Command Line Interface |
| TEST | Testing & Quality |
| DOCS | Documentation |

---

## 2. P0 Tasks (Critical - Launch Blockers)

### 2.1 Infrastructure & Project Setup

#### TASK-INFRA-001: Initialize Monorepo Structure

**Priority**: P0
**Story Points**: 3
**Estimated Hours**: 4
**Status**: Not Started

**Description**:
Set up the pnpm workspace monorepo structure following Article I (Library-First Architecture).

**Requirements Coverage**:
- Structure: Monorepo with Library-First Architecture

**Acceptance Criteria**:
- [ ] `pnpm-workspace.yaml` configured with packages/*
- [ ] `packages/core/` directory created
- [ ] `packages/cli/` directory created
- [ ] `packages/web/` directory created
- [ ] Root `package.json` with workspace scripts
- [ ] `turbo.json` for build orchestration

**Dependencies**: None

**Test-First Checklist** (Article III):
- [ ] Tests written BEFORE implementation
- [ ] Red: Failing test committed
- [ ] Green: Minimal implementation passes test
- [ ] Blue: Refactored with confidence

**Implementation Notes**:
```bash
packages/
├── core/           # @labflow/core
│   ├── src/
│   ├── tests/
│   └── package.json
├── cli/            # @labflow/cli
│   ├── src/
│   ├── tests/
│   └── package.json
└── web/            # @labflow/web
    ├── src/
    └── package.json
```

**Validation**:
```bash
pnpm install
pnpm build
```

---

#### TASK-INFRA-002: Configure TypeScript & Build System

**Priority**: P0
**Story Points**: 2
**Estimated Hours**: 3
**Status**: Not Started

**Description**:
Set up TypeScript 5.x configuration with strict mode and path aliases.

**Requirements Coverage**:
- Tech Stack: TypeScript 5.x

**Acceptance Criteria**:
- [ ] Root `tsconfig.json` with strict mode
- [ ] Package-specific `tsconfig.json` extending root
- [ ] Path aliases configured (@labflow/*)
- [ ] Turborepo build pipeline working
- [ ] ESLint + Prettier configured

**Dependencies**:
- TASK-INFRA-001: Monorepo structure

**Implementation Notes**:
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

---

#### TASK-INFRA-003: Database Schema & Migrations

**Priority**: P0
**Story Points**: 5
**Estimated Hours**: 8
**Status**: Not Started

**Description**:
Set up PostgreSQL database with pgvector extension using Drizzle ORM.

**Requirements Coverage**:
- ADR-002: PostgreSQL + pgvector

**Acceptance Criteria**:
- [ ] Drizzle ORM configured
- [ ] Core tables created: users, organizations, workflows, executions
- [ ] pgvector extension enabled
- [ ] documents table with vector embedding column
- [ ] Plugins tables: plugins, organization_plugins, workflow_step_types
- [ ] Migration scripts working
- [ ] Seed data for development

**Dependencies**:
- TASK-INFRA-001: Monorepo structure

**Implementation Notes**:
```typescript
// packages/core/src/db/schema/users.ts
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  // ... see design doc
});
```

**Validation**:
```bash
pnpm db:migrate
pnpm db:seed
```

---

### 2.2 Authentication System

#### TASK-AUTH-001: Write Tests for Multi-Provider Authentication (RED)

**Priority**: P0
**Story Points**: 3
**Estimated Hours**: 5
**Status**: Not Started

**Description**:
Write failing tests for the multi-provider authentication system.

**Test-First Phase**: ❤️ RED (Failing Tests)

**Requirements Coverage**:
- DASH-AUTH-001: Multi-provider switching
- DASH-AUTH-002: Local authentication
- DASH-AUTH-003: Entra ID (OAuth 2.0/OIDC)
- DASH-AUTH-004: Shibboleth (SAML 2.0)

**Acceptance Criteria**:
- [ ] Test file created: `packages/core/src/auth/tests/providers.test.ts`
- [ ] Tests for LocalAuthProvider
- [ ] Tests for EntraIDProvider
- [ ] Tests for ShibbolethProvider
- [ ] Tests for AuthProviderFactory (strategy pattern)
- [ ] Tests FAIL (red phase)
- [ ] Git commit: `test: add failing tests for multi-auth providers`

**Implementation Notes**:
```typescript
// packages/core/src/auth/tests/providers.test.ts
describe('DASH-AUTH-001: Multi-Provider Authentication', () => {
  describe('LocalAuthProvider', () => {
    it('should authenticate with valid email and password', async () => {
      const provider = new LocalAuthProvider(config);
      const result = await provider.authenticate({
        email: 'user@example.com',
        password: 'validpassword123'
      });
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
    });

    it('should hash passwords with Argon2id', async () => {
      // DASH-AUTH-011
    });
  });

  describe('AuthProviderFactory', () => {
    it('should return LocalAuthProvider when AUTH_PROVIDER=local', () => {
      const provider = AuthProviderFactory.create('local');
      expect(provider).toBeInstanceOf(LocalAuthProvider);
    });
  });
});
```

---

#### TASK-AUTH-002: Implement AuthProviderFactory (GREEN)

**Priority**: P0
**Story Points**: 5
**Estimated Hours**: 8
**Status**: Not Started

**Description**:
Implement the authentication provider factory using Strategy pattern.

**Test-First Phase**: 💚 GREEN (Passing Tests)

**Requirements Coverage**:
- DASH-AUTH-001: Multi-provider switching

**Acceptance Criteria**:
- [ ] AuthProvider interface defined
- [ ] AuthProviderFactory implemented
- [ ] Environment-based provider selection
- [ ] All tests from TASK-AUTH-001 PASS
- [ ] Git commit: `feat: implement DASH-AUTH-001 (auth provider factory)`

**Dependencies**:
- TASK-AUTH-001: Tests must exist first

**Implementation Notes**:
```typescript
// packages/core/src/auth/providers/factory.ts
export class AuthProviderFactory {
  static create(providerType: AuthProviderType): AuthProvider {
    switch (providerType) {
      case 'local': return new LocalAuthProvider();
      case 'entra': return new EntraIDProvider();
      case 'shibboleth': return new ShibbolethProvider();
      default: throw new Error(`Unknown provider: ${providerType}`);
    }
  }
}
```

---

#### TASK-AUTH-003: Implement LocalAuthProvider

**Priority**: P0
**Story Points**: 5
**Estimated Hours**: 8
**Status**: Not Started

**Description**:
Implement local authentication with Argon2id password hashing.

**Requirements Coverage**:
- DASH-AUTH-002: Local authentication
- DASH-AUTH-011: Argon2id password hashing
- DASH-AUTH-015: Password reset

**Acceptance Criteria**:
- [ ] LocalAuthProvider class implemented
- [ ] Argon2id password hashing
- [ ] JWT token generation
- [ ] Password reset flow
- [ ] All related tests pass

**Dependencies**:
- TASK-AUTH-002: AuthProviderFactory

**Implementation Notes**:
```typescript
// packages/core/src/auth/providers/local.ts
export class LocalAuthProvider implements AuthProvider {
  async authenticate(credentials: LocalCredentials): Promise<AuthResult> {
    const user = await this.userRepository.findByEmail(credentials.email);
    if (!user || !await this.verifyArgon2id(credentials.password, user.passwordHash)) {
      throw new UnauthorizedError('Invalid credentials');
    }
    return this.createSession(user);
  }
}
```

---

#### TASK-AUTH-004: Implement EntraIDProvider

**Priority**: P0
**Story Points**: 5
**Estimated Hours**: 8
**Status**: Not Started

**Description**:
Implement Microsoft Entra ID authentication using OAuth 2.0/OIDC.

**Requirements Coverage**:
- DASH-AUTH-003: Entra ID (OAuth 2.0/OIDC)

**Acceptance Criteria**:
- [ ] EntraIDProvider class implemented
- [ ] OAuth 2.0 authorization code flow
- [ ] OIDC token validation
- [ ] User attribute mapping
- [ ] All related tests pass

**Dependencies**:
- TASK-AUTH-002: AuthProviderFactory

---

#### TASK-AUTH-005: Implement ShibbolethProvider

**Priority**: P0
**Story Points**: 8
**Estimated Hours**: 12
**Status**: Not Started

**Description**:
Implement Shibboleth authentication using SAML 2.0.

**Requirements Coverage**:
- DASH-AUTH-004: Shibboleth (SAML 2.0)

**Acceptance Criteria**:
- [ ] ShibbolethProvider class implemented
- [ ] SAML 2.0 SP functionality
- [ ] IdP metadata parsing
- [ ] Attribute mapping (eduPerson schema)
- [ ] JWT conversion from SAML assertion
- [ ] All related tests pass

**Dependencies**:
- TASK-AUTH-002: AuthProviderFactory

---

#### TASK-AUTH-006: Implement Security Features

**Priority**: P0
**Story Points**: 5
**Estimated Hours**: 8
**Status**: Not Started

**Description**:
Implement authentication security features.

**Requirements Coverage**:
- DASH-AUTH-010: MFA support
- DASH-AUTH-012: Session timeout
- DASH-AUTH-013: Account lockout
- DASH-AUTH-016: Audit logging

**Acceptance Criteria**:
- [ ] MFA (TOTP) support
- [ ] Session timeout (15 min idle)
- [ ] Account lockout (3 failures = 30 min)
- [ ] Audit log for all auth events

**Dependencies**:
- TASK-AUTH-003: LocalAuthProvider

---

### 2.3 Core Library - Workflow Engine

#### TASK-WKFL-001: Write Tests for Workflow Domain (RED)

**Priority**: P0
**Story Points**: 3
**Estimated Hours**: 5
**Status**: Not Started

**Description**:
Write failing tests for workflow domain entities.

**Test-First Phase**: ❤️ RED (Failing Tests)

**Requirements Coverage**:
- WKFL-COMM-001: Workflow metadata
- WKFL-COMM-002: Version management

**Acceptance Criteria**:
- [ ] Tests for Workflow aggregate
- [ ] Tests for Step entity
- [ ] Tests for Execution entity
- [ ] Tests FAIL
- [ ] Git commit: `test: add failing tests for workflow domain`

---

#### TASK-WKFL-002: Implement Workflow Domain Model (GREEN)

**Priority**: P0
**Story Points**: 5
**Estimated Hours**: 8
**Status**: Not Started

**Description**:
Implement workflow domain entities using DDD patterns.

**Requirements Coverage**:
- WKFL-COMM-001: Workflow metadata
- WKFL-COMM-006: Intermediate result persistence

**Acceptance Criteria**:
- [ ] Workflow aggregate implemented
- [ ] Step entity implemented
- [ ] Execution entity implemented
- [ ] All tests pass
- [ ] Git commit: `feat: implement workflow domain model`

**Dependencies**:
- TASK-WKFL-001: Tests

**Implementation Notes**:
```typescript
// packages/core/src/workflow/domain/workflow.ts
export class Workflow {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly templateId: string,
    public name: string,
    public status: WorkflowStatus,
    public steps: Step[]
  ) {}

  addStep(step: Step): void { ... }
  validate(): ValidationResult { ... }
}
```

---

#### TASK-WKFL-003: Implement WorkflowService

**Priority**: P0
**Story Points**: 5
**Estimated Hours**: 8
**Status**: Not Started

**Description**:
Implement workflow application service.

**Requirements Coverage**:
- DASH-PROJ-001: Project CRUD
- WKFL-COMM-003: Template details
- WKFL-COMM-007: Save as template

**Acceptance Criteria**:
- [ ] createFromTemplate() method
- [ ] addStep() method
- [ ] validate() method
- [ ] export() method
- [ ] All tests pass

**Dependencies**:
- TASK-WKFL-002: Domain model

---

#### TASK-WKFL-004: Implement ExecutionService

**Priority**: P0
**Story Points**: 8
**Estimated Hours**: 12
**Status**: Not Started

**Description**:
Implement workflow execution service with BullMQ integration.

**Requirements Coverage**:
- DASH-PROG-001: Progress visualization
- DASH-PROG-003: Progress percentage
- WKFL-COMM-005: Resume from failure

**Acceptance Criteria**:
- [ ] start(workflowId) method
- [ ] pause(executionId) method
- [ ] resume(executionId) method
- [ ] cancel(executionId) method
- [ ] BullMQ job queue integration
- [ ] Progress tracking

**Dependencies**:
- TASK-WKFL-003: WorkflowService
- TASK-INFRA-003: Database

---

#### TASK-WKFL-005: Implement StepExecutor Strategy

**Priority**: P0
**Story Points**: 5
**Estimated Hours**: 8
**Status**: Not Started

**Description**:
Implement step executor using Strategy pattern for different step types.

**Requirements Coverage**:
- WKFL-DRUG-002: BioEmu integration
- WKFL-MATL-002: MatterGen integration
- WKFL-CLIM-004: Aurora integration

**Acceptance Criteria**:
- [ ] StepExecutor interface
- [ ] MatterGenExecutor implementation
- [ ] BaseStepExecutor with common logic
- [ ] Step type registry

**Dependencies**:
- TASK-WKFL-004: ExecutionService

---

### 2.4 Plugin Architecture

#### TASK-PLUG-001: Write Tests for Plugin System (RED)

**Priority**: P0
**Story Points**: 3
**Estimated Hours**: 5
**Status**: Not Started

**Description**:
Write failing tests for the plugin architecture.

**Test-First Phase**: ❤️ RED (Failing Tests)

**Requirements Coverage**:
- PLUG-CORE-001: Plugin architecture
- PLUG-CORE-002: Plugin lifecycle
- PLUG-INTF-001: Plugin interface

**Acceptance Criteria**:
- [ ] Tests for PluginLoader
- [ ] Tests for PluginRegistry
- [ ] Tests for PluginContext
- [ ] Tests for LabFlowPlugin interface
- [ ] Tests FAIL
- [ ] Git commit: `test: add failing tests for plugin system`

---

#### TASK-PLUG-002: Implement Plugin Manager (GREEN)

**Priority**: P0
**Story Points**: 8
**Estimated Hours**: 12
**Status**: Not Started

**Description**:
Implement the core plugin manager with lifecycle management.

**Requirements Coverage**:
- PLUG-CORE-001: Plugin architecture
- PLUG-CORE-002: Plugin lifecycle
- PLUG-CORE-005: Version compatibility

**Acceptance Criteria**:
- [ ] PluginLoader: discover, load, unload, validate
- [ ] PluginRegistry: register, unregister, getByType, getByDomain
- [ ] PluginContext: config, services, logger, cache
- [ ] Plugin interface defined
- [ ] All tests pass

**Dependencies**:
- TASK-PLUG-001: Tests

**Implementation Notes**:
```typescript
// packages/core/src/plugin/manager.ts
export class PluginManager {
  private registry = new PluginRegistry();
  private loader = new PluginLoader();

  async loadPlugin(pluginPath: string): Promise<void> {
    const plugin = await this.loader.load(pluginPath);
    await plugin.initialize(this.createContext());
    this.registry.register(plugin);
  }
}
```

---

#### TASK-PLUG-003: Implement Plugin Interface

**Priority**: P0
**Story Points**: 5
**Estimated Hours**: 8
**Status**: Not Started

**Description**:
Define and implement the standard plugin interface with extension points.

**Requirements Coverage**:
- PLUG-INTF-001: Plugin interface
- PLUG-INTF-002: Extension points
- PLUG-INTF-005: Standard utilities

**Acceptance Criteria**:
- [ ] LabFlowPlugin interface defined
- [ ] WorkflowStepDefinition type
- [ ] DataConnector interface
- [ ] VisualizationComponent interface
- [ ] UIExtension interface

**Implementation Notes**:
```typescript
// packages/core/src/plugin/interface.ts
export interface LabFlowPlugin {
  id: string;
  name: string;
  version: string;
  domain: 'drug' | 'materials' | 'climate' | 'genomics' | 'common';
  dependencies?: string[];

  initialize(context: PluginContext): Promise<void>;
  getWorkflowSteps(): WorkflowStepDefinition[];
  getDataConnectors(): DataConnector[];
  getVisualizations(): VisualizationComponent[];
  getUIExtensions(): UIExtension[];
  cleanup(): Promise<void>;
}
```

---

#### TASK-PLUG-004: Implement Drug Discovery Plugin

**Priority**: P0
**Story Points**: 8
**Estimated Hours**: 12
**Status**: Not Started

**Description**:
Implement the drug discovery domain plugin.

**Requirements Coverage**:
- PLUG-DRUG-001: Molecular structure editor
- PLUG-DRUG-002: ADMET, docking workflow steps
- PLUG-DRUG-003: ChEMBL, PubChem connectors
- PLUG-DRUG-004: 3Dmol.js visualization

**Acceptance Criteria**:
- [ ] DrugDiscoveryPlugin class
- [ ] ADMET prediction step
- [ ] Docking simulation step
- [ ] ChEMBL data connector
- [ ] 3D molecule visualization

**Dependencies**:
- TASK-PLUG-002: Plugin Manager

---

#### TASK-PLUG-005: Implement Materials Science Plugin

**Priority**: P0
**Story Points**: 8
**Estimated Hours**: 12
**Status**: Not Started

**Description**:
Implement the materials science domain plugin.

**Requirements Coverage**:
- PLUG-MAT-001: Crystal structure editor
- PLUG-MAT-002: MatterGen, MatterSim steps
- PLUG-MAT-003: Materials Project connector
- PLUG-MAT-004: Crystal visualization

**Acceptance Criteria**:
- [ ] MaterialsSciencePlugin class
- [ ] MatterGen generation step
- [ ] MatterSim simulation step
- [ ] Materials Project connector
- [ ] Crystal structure visualization

**Dependencies**:
- TASK-PLUG-002: Plugin Manager

---

### 2.5 CLI Interface (Article II)

#### TASK-CLI-001: Implement CLI Framework

**Priority**: P0
**Story Points**: 3
**Estimated Hours**: 5
**Status**: Not Started

**Description**:
Set up CLI framework using Commander.js following Article II.

**Requirements Coverage**:
- Article II: CLI Interface requirement

**Acceptance Criteria**:
- [ ] Commander.js setup
- [ ] `labflow` command entry point
- [ ] Help text generation
- [ ] Version command
- [ ] Error handling

**Implementation Notes**:
```typescript
// packages/cli/src/index.ts
import { program } from 'commander';

program
  .name('labflow')
  .description('LabFlow CLI - AI for Science Starter Kit')
  .version('1.0.0');
```

---

#### TASK-CLI-002: Implement Workflow Commands

**Priority**: P0
**Story Points**: 5
**Estimated Hours**: 8
**Status**: Not Started

**Description**:
Implement CLI commands for workflow management.

**Acceptance Criteria**:
- [ ] `labflow workflow list`
- [ ] `labflow workflow create --template <name>`
- [ ] `labflow workflow run <id>`
- [ ] `labflow workflow status <id>`

**Dependencies**:
- TASK-CLI-001: CLI Framework
- TASK-WKFL-003: WorkflowService

---

#### TASK-CLI-003: Implement Plugin Commands

**Priority**: P0
**Story Points**: 3
**Estimated Hours**: 5
**Status**: Not Started

**Description**:
Implement CLI commands for plugin management.

**Requirements Coverage**:
- PLUG-MGMT-002: CLI plugin management

**Acceptance Criteria**:
- [ ] `labflow plugin list`
- [ ] `labflow plugin install <name>`
- [ ] `labflow plugin uninstall <name>`
- [ ] `labflow plugin create <name>` (scaffold)

**Dependencies**:
- TASK-CLI-001: CLI Framework
- TASK-PLUG-002: Plugin Manager

---

### 2.6 API Server

#### TASK-API-001: Implement Hono API Server

**Priority**: P0
**Story Points**: 5
**Estimated Hours**: 8
**Status**: Not Started

**Description**:
Set up Hono API server with middleware.

**Requirements Coverage**:
- ADR-004: Hono API Framework

**Acceptance Criteria**:
- [ ] Hono app initialization
- [ ] CORS middleware
- [ ] Request validation middleware
- [ ] Error handling middleware
- [ ] Request ID generation
- [ ] Logging middleware

**Implementation Notes**:
```typescript
// packages/core/src/api/server.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();
app.use('*', cors());
app.use('*', requestId());
app.use('*', logger());
```

---

#### TASK-API-002: Implement Auth Endpoints

**Priority**: P0
**Story Points**: 5
**Estimated Hours**: 8
**Status**: Not Started

**Description**:
Implement authentication API endpoints.

**Acceptance Criteria**:
- [ ] GET `/api/v1/auth/providers`
- [ ] POST `/api/v1/auth/login`
- [ ] POST `/api/v1/auth/logout`
- [ ] POST `/api/v1/auth/register`
- [ ] GET `/api/v1/auth/callback/entra`
- [ ] POST `/api/v1/auth/callback/shibboleth`
- [ ] GET `/api/v1/auth/me`

**Dependencies**:
- TASK-API-001: Hono server
- TASK-AUTH-002: AuthProviderFactory

---

#### TASK-API-003: Implement Workflow Endpoints

**Priority**: P0
**Story Points**: 5
**Estimated Hours**: 8
**Status**: Not Started

**Description**:
Implement workflow management API endpoints.

**Acceptance Criteria**:
- [ ] GET `/api/v1/workflows`
- [ ] POST `/api/v1/workflows`
- [ ] GET `/api/v1/workflows/:id`
- [ ] PUT `/api/v1/workflows/:id`
- [ ] DELETE `/api/v1/workflows/:id`
- [ ] POST `/api/v1/workflows/:id/execute`
- [ ] GET `/api/v1/executions/:id`
- [ ] POST `/api/v1/executions/:id/cancel`

**Dependencies**:
- TASK-API-001: Hono server
- TASK-WKFL-004: ExecutionService

---

#### TASK-API-004: Implement Plugin Endpoints

**Priority**: P0
**Story Points**: 3
**Estimated Hours**: 5
**Status**: Not Started

**Description**:
Implement plugin management API endpoints.

**Acceptance Criteria**:
- [ ] GET `/api/v1/plugins`
- [ ] GET `/api/v1/plugins/:id`
- [ ] POST `/api/v1/plugins/:id/install`
- [ ] DELETE `/api/v1/plugins/:id/uninstall`
- [ ] POST `/api/v1/plugins/:id/enable`
- [ ] POST `/api/v1/plugins/:id/disable`
- [ ] GET, PUT `/api/v1/plugins/:id/config`

**Dependencies**:
- TASK-API-001: Hono server
- TASK-PLUG-002: Plugin Manager

---

### 2.7 Web Application

#### TASK-WEB-001: Initialize Next.js Application

**Priority**: P0
**Story Points**: 3
**Estimated Hours**: 5
**Status**: Not Started

**Description**:
Set up Next.js 15 with App Router and Tailwind CSS.

**Requirements Coverage**:
- Tech Stack: Next.js 15, React 19, Tailwind CSS 4

**Acceptance Criteria**:
- [ ] Next.js 15 with App Router
- [ ] Tailwind CSS 4 configuration
- [ ] shadcn/ui components setup
- [ ] Dark mode support
- [ ] Japanese locale

**Dependencies**:
- TASK-INFRA-001: Monorepo structure

---

#### TASK-WEB-002: Implement Authentication Pages

**Priority**: P0
**Story Points**: 5
**Estimated Hours**: 8
**Status**: Not Started

**Description**:
Implement login page with multi-provider support.

**Requirements Coverage**:
- DASH-AUTH-005: Provider selection UI

**Acceptance Criteria**:
- [ ] Login page with provider selection
- [ ] Local login form
- [ ] Entra ID login button
- [ ] Shibboleth login button
- [ ] Registration page
- [ ] Password reset flow

**Dependencies**:
- TASK-WEB-001: Next.js app
- TASK-API-002: Auth endpoints

---

#### TASK-WEB-003: Implement Dashboard

**Priority**: P0
**Story Points**: 8
**Estimated Hours**: 12
**Status**: Not Started

**Description**:
Implement the main dashboard with domain cards.

**Requirements Coverage**:
- DASH-QACT-001: Quick action buttons
- DASH-PROG-001: Progress visualization

**Acceptance Criteria**:
- [ ] Domain cards (Drug, Materials, Climate, Genomics)
- [ ] Quick actions
- [ ] Recent projects list
- [ ] Execution progress view
- [ ] Resource monitor widget

**Dependencies**:
- TASK-WEB-002: Auth pages
- TASK-API-003: Workflow endpoints

---

#### TASK-WEB-004: Implement Workflow Builder

**Priority**: P0
**Story Points**: 8
**Estimated Hours**: 12
**Status**: Not Started

**Description**:
Implement visual workflow builder with drag-and-drop.

**Requirements Coverage**:
- VISZ-WKFL-001: DAG visualization
- WKFL-COMM-004: Skip option

**Acceptance Criteria**:
- [ ] DAG visualization with React Flow
- [ ] Step drag-and-drop
- [ ] Step configuration panels
- [ ] Status color coding
- [ ] Real-time execution progress

**Dependencies**:
- TASK-WEB-003: Dashboard
- TASK-PLUG-004, TASK-PLUG-005: Domain plugins

---

---

## 3. P1 Tasks (High - Required for Launch)

### 3.1 GraphRAG Integration

#### TASK-GRAG-001: Implement GraphRAG Service

**Priority**: P1
**Story Points**: 8
**Estimated Hours**: 12
**Status**: Not Started

**Description**:
Integrate Microsoft GraphRAG for knowledge extraction.

**Requirements Coverage**:
- KNOW-GRAG-001: GraphRAG integration
- KNOW-GRAG-002: Entity extraction
- KNOW-GRAG-003: Relation extraction

**Acceptance Criteria**:
- [ ] GraphRAG service wrapper
- [ ] Document ingestion pipeline
- [ ] Entity extraction (compounds, proteins, etc.)
- [ ] Relation extraction
- [ ] Community detection

**Dependencies**:
- TASK-INFRA-003: Database with pgvector

---

#### TASK-GRAG-002: Implement Knowledge Base API

**Priority**: P1
**Story Points**: 5
**Estimated Hours**: 8
**Status**: Not Started

**Description**:
Implement knowledge base management endpoints.

**Acceptance Criteria**:
- [ ] GET, POST `/api/v1/knowledge-bases`
- [ ] POST `/api/v1/knowledge-bases/:id/query`
- [ ] Natural language query support
- [ ] Citation retrieval

**Dependencies**:
- TASK-GRAG-001: GraphRAG Service

---

### 3.2 LLM Integration (Esperanto)

#### TASK-LLM-001: Integrate Esperanto Abstraction Layer

**Priority**: P1
**Story Points**: 5
**Estimated Hours**: 8
**Status**: Not Started

**Description**:
Set up Esperanto for unified LLM interface with Ollama (dev) and Azure OpenAI (prod).

**Requirements Coverage**:
- Tech Stack: Esperanto + Ollama (dev) + Azure OpenAI (prod)

**Acceptance Criteria**:
- [ ] Esperanto configuration
- [ ] Ollama provider for development
- [ ] Azure OpenAI provider for production
- [ ] Environment-based provider switching
- [ ] Embedding generation

**Dependencies**:
- TASK-INFRA-001: Monorepo

---

### 3.3 Testing & Quality

#### TASK-TEST-001: Integration Test Suite

**Priority**: P1
**Story Points**: 8
**Estimated Hours**: 12
**Status**: Not Started

**Description**:
Set up integration tests with real database (Article IX).

**Requirements Coverage**:
- Article IX: Integration Testing with real services

**Acceptance Criteria**:
- [ ] Test database setup/teardown
- [ ] API integration tests
- [ ] Workflow execution tests
- [ ] Authentication flow tests
- [ ] Coverage ≥ 80%

**Dependencies**:
- All P0 implementation tasks

---

#### TASK-TEST-002: E2E Test Suite

**Priority**: P1
**Story Points**: 5
**Estimated Hours**: 8
**Status**: Not Started

**Description**:
Set up end-to-end tests with Playwright.

**Acceptance Criteria**:
- [ ] Playwright configuration
- [ ] Login flow tests
- [ ] Workflow creation tests
- [ ] Dashboard tests

**Dependencies**:
- TASK-WEB-004: Web application

---

### 3.4 Additional Plugins

#### TASK-PLUG-006: Implement Climate Plugin

**Priority**: P1
**Story Points**: 5
**Estimated Hours**: 8
**Status**: Not Started

**Description**:
Implement the climate/environment domain plugin.

**Requirements Coverage**:
- PLUG-CLIM-001: Weather data viewer
- PLUG-CLIM-002: Aurora integration
- PLUG-CLIM-003: ERA5 connector

**Acceptance Criteria**:
- [ ] ClimatePlugin class
- [ ] Aurora prediction step
- [ ] ERA5 data connector
- [ ] GeoMap visualization

**Dependencies**:
- TASK-PLUG-002: Plugin Manager

---

#### TASK-PLUG-007: Implement Genomics Plugin

**Priority**: P1
**Story Points**: 5
**Estimated Hours**: 8
**Status**: Not Started

**Description**:
Implement the genomics domain plugin.

**Requirements Coverage**:
- PLUG-GEN-001: Sequence viewer
- PLUG-GEN-002: BioEmu integration
- PLUG-GEN-003: UniProt connector

**Acceptance Criteria**:
- [ ] GenomicsPlugin class
- [ ] BioEmu structure prediction step
- [ ] UniProt data connector
- [ ] Protein 3D visualization

**Dependencies**:
- TASK-PLUG-002: Plugin Manager

---

---

## 4. P2 Tasks (Medium - Nice to Have for MVP)

### 4.1 Advanced Features

#### TASK-ADV-001: Implement Natural Language Interface

**Priority**: P2
**Story Points**: 8
**Estimated Hours**: 12
**Status**: Not Started

**Description**:
Implement natural language workflow generation.

**Requirements Coverage**:
- DASH-NLI-001: Natural language input
- DASH-NLI-002: Intent parsing
- DASH-NLI-007: Pattern recognition

**Acceptance Criteria**:
- [ ] Natural language input component
- [ ] Intent extraction
- [ ] Workflow recommendation
- [ ] Japanese language support

**Dependencies**:
- TASK-LLM-001: Esperanto integration

---

#### TASK-ADV-002: Implement Collaboration Features

**Priority**: P2
**Story Points**: 8
**Estimated Hours**: 12
**Status**: Not Started

**Description**:
Implement project sharing and team features.

**Requirements Coverage**:
- COLB-SHAR-001: Project sharing
- COLB-TEAM-001: Team management

**Acceptance Criteria**:
- [ ] Project sharing with permissions
- [ ] Team creation/management
- [ ] Activity feed
- [ ] Comments

---

### 4.2 Learning Module

#### TASK-LERN-001: Implement Learning Path System

**Priority**: P2
**Story Points**: 5
**Estimated Hours**: 8
**Status**: Not Started

**Description**:
Implement the learning module framework.

**Requirements Coverage**:
- LERN-PATH-001: Learning levels
- LERN-CONT-001: Content formats

**Acceptance Criteria**:
- [ ] Learning path definition
- [ ] Progress tracking
- [ ] Interactive code execution
- [ ] Quiz system

---

---

## 5. P3 Tasks (Low - Future)

### 5.1 Advanced Integrations

#### TASK-FUT-001: HPC Integration

**Priority**: P3
**Story Points**: 13
**Status**: Not Started

**Requirements Coverage**:
- PERF-HPC-JOB-001: Slurm integration

---

#### TASK-FUT-002: GxP Compliance Mode

**Priority**: P3
**Story Points**: 13
**Status**: Not Started

**Requirements Coverage**:
- SECU-GXP-001: 21 CFR Part 11

---

---

## 6. Requirements Coverage Matrix

| Requirement ID | Priority | Tasks | Status |
|----------------|----------|-------|--------|
| DASH-AUTH-001 | P0 | TASK-AUTH-001, TASK-AUTH-002 | Not Started |
| DASH-AUTH-002 | P0 | TASK-AUTH-003 | Not Started |
| DASH-AUTH-003 | P0 | TASK-AUTH-004 | Not Started |
| DASH-AUTH-004 | P0 | TASK-AUTH-005 | Not Started |
| DASH-AUTH-005 | P0 | TASK-WEB-002 | Not Started |
| DASH-AUTH-010-016 | P0 | TASK-AUTH-006 | Not Started |
| DASH-PROJ-001 | P0 | TASK-WKFL-003 | Not Started |
| DASH-PROG-001 | P0 | TASK-WKFL-004, TASK-WEB-003 | Not Started |
| WKFL-COMM-001-007 | P0 | TASK-WKFL-001~005 | Not Started |
| PLUG-CORE-001-006 | P0 | TASK-PLUG-001~003 | Not Started |
| PLUG-INTF-001-005 | P0 | TASK-PLUG-003 | Not Started |
| PLUG-DRUG-001-004 | P0 | TASK-PLUG-004 | Not Started |
| PLUG-MAT-001-004 | P0 | TASK-PLUG-005 | Not Started |
| PLUG-CLIM-001-004 | P1 | TASK-PLUG-006 | Not Started |
| PLUG-GEN-001-004 | P1 | TASK-PLUG-007 | Not Started |
| KNOW-GRAG-001-008 | P1 | TASK-GRAG-001~002 | Not Started |
| Article I | P0 | TASK-INFRA-001 | Not Started |
| Article II | P0 | TASK-CLI-001~003 | Not Started |
| Article III | P0 | All RED-GREEN-BLUE tasks | Not Started |
| Article V | P0 | This document | Not Started |
| Article IX | P1 | TASK-TEST-001 | Not Started |

**Coverage Summary**:
- Total Requirements Covered: 50+
- P0 Requirements: All mapped
- **Coverage Goal**: 100% ✅

---

## 7. Task Dependencies Graph

```
TASK-INFRA-001 (Monorepo)
├── TASK-INFRA-002 (TypeScript)
├── TASK-INFRA-003 (Database)
│   └── TASK-GRAG-001 (GraphRAG)
│       └── TASK-GRAG-002 (KB API)
│
├── TASK-AUTH-001 (Tests - RED)
│   └── TASK-AUTH-002 (Factory - GREEN)
│       ├── TASK-AUTH-003 (Local)
│       │   └── TASK-AUTH-006 (Security)
│       ├── TASK-AUTH-004 (Entra)
│       └── TASK-AUTH-005 (Shibboleth)
│
├── TASK-PLUG-001 (Tests - RED)
│   └── TASK-PLUG-002 (Manager - GREEN)
│       └── TASK-PLUG-003 (Interface)
│           ├── TASK-PLUG-004 (Drug)
│           ├── TASK-PLUG-005 (Materials)
│           ├── TASK-PLUG-006 (Climate) [P1]
│           └── TASK-PLUG-007 (Genomics) [P1]
│
├── TASK-WKFL-001 (Tests - RED)
│   └── TASK-WKFL-002 (Domain - GREEN)
│       └── TASK-WKFL-003 (Service)
│           └── TASK-WKFL-004 (Execution)
│               └── TASK-WKFL-005 (StepExecutor)
│
├── TASK-CLI-001 (Framework)
│   ├── TASK-CLI-002 (Workflow Cmds)
│   └── TASK-CLI-003 (Plugin Cmds)
│
├── TASK-API-001 (Hono Server)
│   ├── TASK-API-002 (Auth APIs)
│   ├── TASK-API-003 (Workflow APIs)
│   └── TASK-API-004 (Plugin APIs)
│
└── TASK-WEB-001 (Next.js)
    └── TASK-WEB-002 (Auth Pages)
        └── TASK-WEB-003 (Dashboard)
            └── TASK-WEB-004 (Workflow Builder)

Critical Path: TASK-INFRA-001 → TASK-INFRA-003 → TASK-AUTH-002 → TASK-WKFL-004 → TASK-WEB-004
```

---

## 8. Sprint Planning

### Sprint 1: Foundation (Week 1-2)

**Goal**: Set up infrastructure and core authentication

**Tasks**:
- TASK-INFRA-001: Monorepo (3 points)
- TASK-INFRA-002: TypeScript (2 points)
- TASK-INFRA-003: Database (5 points)
- TASK-AUTH-001: Auth Tests (3 points)
- TASK-AUTH-002: Auth Factory (5 points)
- TASK-AUTH-003: Local Auth (5 points)

**Total**: 23 story points

---

### Sprint 2: Core Systems (Week 3-4)

**Goal**: Complete auth and start workflow engine

**Tasks**:
- TASK-AUTH-004: Entra ID (5 points)
- TASK-AUTH-005: Shibboleth (8 points)
- TASK-AUTH-006: Security (5 points)
- TASK-WKFL-001: Workflow Tests (3 points)
- TASK-WKFL-002: Workflow Domain (5 points)

**Total**: 26 story points

---

### Sprint 3: Plugin System (Week 5-6)

**Goal**: Complete workflow engine and plugin architecture

**Tasks**:
- TASK-WKFL-003: Workflow Service (5 points)
- TASK-WKFL-004: Execution Service (8 points)
- TASK-PLUG-001: Plugin Tests (3 points)
- TASK-PLUG-002: Plugin Manager (8 points)
- TASK-PLUG-003: Plugin Interface (5 points)

**Total**: 29 story points

---

### Sprint 4: Domain Plugins & CLI (Week 7-8)

**Goal**: Implement domain plugins and CLI

**Tasks**:
- TASK-PLUG-004: Drug Plugin (8 points)
- TASK-PLUG-005: Materials Plugin (8 points)
- TASK-CLI-001: CLI Framework (3 points)
- TASK-CLI-002: Workflow Cmds (5 points)
- TASK-CLI-003: Plugin Cmds (3 points)

**Total**: 27 story points

---

### Sprint 5: API & Web (Week 9-10)

**Goal**: Implement API server and web frontend

**Tasks**:
- TASK-API-001: Hono Server (5 points)
- TASK-API-002: Auth Endpoints (5 points)
- TASK-API-003: Workflow Endpoints (5 points)
- TASK-API-004: Plugin Endpoints (3 points)
- TASK-WEB-001: Next.js App (3 points)
- TASK-WEB-002: Auth Pages (5 points)

**Total**: 26 story points

---

### Sprint 6: Web & Integration (Week 11-12)

**Goal**: Complete web app and integration testing

**Tasks**:
- TASK-WEB-003: Dashboard (8 points)
- TASK-WEB-004: Workflow Builder (8 points)
- TASK-TEST-001: Integration Tests (8 points)

**Total**: 24 story points

---

## 9. Estimated Effort Summary

| Category | Tasks | Story Points | Hours |
|----------|-------|--------------|-------|
| Infrastructure | 3 | 10 | 15 |
| Authentication | 6 | 31 | 49 |
| Workflow Engine | 5 | 24 | 38 |
| Plugin System | 7 | 40 | 62 |
| CLI | 3 | 11 | 18 |
| API | 4 | 18 | 29 |
| Web | 4 | 24 | 37 |
| GraphRAG | 2 | 13 | 20 |
| Testing | 2 | 13 | 20 |
| **Total P0** | **36** | **184** | **288** |

**P1 Additional**: ~50 story points
**Total MVP**: ~234 story points
**Estimated Duration**: 12 weeks (6 sprints)

---

## 10. Constitutional Compliance Validation

### Article I: Library-First ✅
- [ ] All features implemented in `packages/core/`
- [ ] Library has independent test suite
- [ ] Library exports public API

### Article II: CLI Interface ✅
- [ ] CLI interface implemented (TASK-CLI-*)
- [ ] All major operations exposed
- [ ] Help text provided

### Article III: Test-First ✅
- [ ] RED tasks before GREEN tasks
- [ ] Git history shows Red-Green-Blue cycle
- [ ] All tests passing

### Article V: Traceability ✅
- [ ] All requirements mapped to tasks
- [ ] All tasks mapped to code
- [ ] All code mapped to tests
- [ ] Coverage matrix maintained

### Article IX: Integration Testing ✅
- [ ] Integration tests use real database
- [ ] Integration tests use real cache
- [ ] Mocks justified (if used)

---

## 11. Next Steps

1. Review task breakdown with team
2. Allocate tasks to developers
3. Begin Sprint 1 implementation
4. OR use orchestrator: `@orchestrator implement labflow`

---

**Document End**

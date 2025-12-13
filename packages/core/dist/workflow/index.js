// src/workflow/domain/step.ts
var Step = class _Step {
  _id;
  _name;
  _type;
  _domain;
  _config;
  _requiredConfigFields;
  _position;
  _dependencies;
  _status;
  _statusHistory;
  _output;
  _metrics;
  _optional;
  constructor(params) {
    this._id = params.id;
    this._name = params.name;
    this._type = params.type;
    this._domain = params.domain;
    this._config = params.config ?? {};
    this._requiredConfigFields = params.requiredConfigFields ?? [];
    this._position = params.position ?? { x: 0, y: 0 };
    this._dependencies = params.dependencies ?? [];
    this._status = params.status ?? "pending";
    this._statusHistory = [{ status: this._status, timestamp: /* @__PURE__ */ new Date() }];
    this._metrics = {};
    this._optional = params.optional ?? false;
  }
  // Getters
  get id() {
    return this._id;
  }
  get name() {
    return this._name;
  }
  get type() {
    return this._type;
  }
  get domain() {
    return this._domain;
  }
  get config() {
    return { ...this._config };
  }
  get position() {
    return { ...this._position };
  }
  get dependencies() {
    return [...this._dependencies];
  }
  get status() {
    return this._status;
  }
  get statusHistory() {
    return [...this._statusHistory];
  }
  get output() {
    return this._output;
  }
  get metrics() {
    return { ...this._metrics };
  }
  get optional() {
    return this._optional;
  }
  /**
   * Update step name
   */
  updateName(name) {
    this._name = name;
  }
  /**
   * Update step configuration
   */
  updateConfig(config) {
    this._config = { ...this._config, ...config };
  }
  /**
   * Update step position
   */
  updatePosition(position) {
    this._position = { ...position };
  }
  /**
   * Add dependency
   */
  addDependency(stepId) {
    if (!this._dependencies.includes(stepId)) {
      this._dependencies.push(stepId);
    }
  }
  /**
   * Remove dependency
   */
  removeDependency(stepId) {
    const index = this._dependencies.indexOf(stepId);
    if (index > -1) {
      this._dependencies.splice(index, 1);
    }
  }
  /**
   * Update status
   */
  updateStatus(status) {
    this._status = status;
    this._statusHistory.push({ status, timestamp: /* @__PURE__ */ new Date() });
  }
  /**
   * Validate config against required fields
   */
  validateConfig() {
    const missingFields = [];
    for (const field of this._requiredConfigFields) {
      if (!(field in this._config) || this._config[field] === void 0) {
        missingFields.push(field);
      }
    }
    return {
      valid: missingFields.length === 0,
      missingFields
    };
  }
  /**
   * Check if this step depends on another step
   */
  dependsOn(stepId) {
    return this._dependencies.includes(stepId);
  }
  /**
   * Start step execution
   */
  start() {
    if (this._status !== "pending") {
      throw new Error(`Cannot start step in ${this._status} state`);
    }
    this._status = "running";
    this._statusHistory.push({ status: "running", timestamp: /* @__PURE__ */ new Date() });
    this._metrics.startTime = /* @__PURE__ */ new Date();
  }
  /**
   * Complete step execution
   */
  complete(output) {
    if (this._status !== "running") {
      throw new Error(`Cannot complete step in ${this._status} state`);
    }
    this._status = "completed";
    this._statusHistory.push({ status: "completed", timestamp: /* @__PURE__ */ new Date() });
    this._metrics.endTime = /* @__PURE__ */ new Date();
    if (this._metrics.startTime) {
      this._metrics.duration = this._metrics.endTime.getTime() - this._metrics.startTime.getTime();
    }
    if (output !== void 0) {
      this._output = output;
    }
  }
  /**
   * Fail step execution
   */
  fail(error) {
    if (this._status !== "running") {
      throw new Error(`Cannot fail step in ${this._status} state`);
    }
    this._status = "failed";
    this._statusHistory.push({ status: "failed", timestamp: /* @__PURE__ */ new Date() });
    this._metrics.endTime = /* @__PURE__ */ new Date();
    if (this._metrics.startTime) {
      this._metrics.duration = this._metrics.endTime.getTime() - this._metrics.startTime.getTime();
    }
    if (error) {
      this._output = { error };
    }
  }
  /**
   * Skip step (WKFL-COMM-004)
   */
  skip(reason) {
    if (this._status !== "pending") {
      throw new Error(`Cannot skip step in ${this._status} state`);
    }
    if (!this._optional) {
      throw new Error("Cannot skip required step");
    }
    this._status = "skipped";
    this._statusHistory.push({ status: "skipped", timestamp: /* @__PURE__ */ new Date() });
    if (reason) {
      this._output = { skipReason: reason };
    }
  }
  /**
   * Reset step to pending state
   */
  reset() {
    this._status = "pending";
    this._statusHistory.push({ status: "pending", timestamp: /* @__PURE__ */ new Date() });
    this._output = void 0;
    this._metrics = {};
  }
  /**
   * Set step output
   */
  setOutput(output) {
    this._output = output;
  }
  /**
   * Check if step is skippable
   */
  isSkippable() {
    return this._optional;
  }
  /**
   * Clone step with new ID
   */
  clone(newId) {
    return new _Step({
      id: newId ?? crypto.randomUUID(),
      name: this._name,
      type: this._type,
      domain: this._domain,
      config: { ...this._config },
      requiredConfigFields: [...this._requiredConfigFields],
      position: { ...this._position },
      dependencies: [...this._dependencies],
      status: "pending",
      optional: this._optional
    });
  }
  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      id: this._id,
      name: this._name,
      type: this._type,
      domain: this._domain,
      config: this._config,
      requiredConfigFields: this._requiredConfigFields,
      position: this._position,
      dependencies: this._dependencies,
      status: this._status,
      optional: this._optional,
      output: this._output,
      metrics: this._metrics
    };
  }
  /**
   * Deserialize from JSON
   */
  static fromJSON(json) {
    return new _Step({
      id: json.id,
      name: json.name,
      type: json.type,
      domain: json.domain,
      config: json.config,
      requiredConfigFields: json.requiredConfigFields,
      position: json.position,
      dependencies: json.dependencies,
      status: json.status,
      optional: json.optional
    });
  }
};

// src/workflow/domain/workflow.ts
var Workflow = class _Workflow {
  _id;
  _name;
  _description;
  _domain;
  _templateId;
  _version;
  _versionHistory;
  _status;
  _userId;
  _organizationId;
  _steps;
  _createdAt;
  _updatedAt;
  constructor(params) {
    this._id = params.id;
    this._name = params.name;
    this._description = params.description;
    this._domain = params.domain;
    this._templateId = params.templateId;
    this._version = params.version ?? 1;
    this._versionHistory = [];
    this._status = params.status ?? "draft";
    this._userId = params.userId;
    this._organizationId = params.organizationId;
    this._steps = /* @__PURE__ */ new Map();
    this._createdAt = params.createdAt ?? /* @__PURE__ */ new Date();
    this._updatedAt = params.updatedAt ?? /* @__PURE__ */ new Date();
  }
  // Getters
  get id() {
    return this._id;
  }
  get name() {
    return this._name;
  }
  get description() {
    return this._description;
  }
  get domain() {
    return this._domain;
  }
  get templateId() {
    return this._templateId;
  }
  get version() {
    return this._version;
  }
  get status() {
    return this._status;
  }
  get userId() {
    return this._userId;
  }
  get organizationId() {
    return this._organizationId;
  }
  get steps() {
    return Array.from(this._steps.values());
  }
  get createdAt() {
    return this._createdAt;
  }
  get updatedAt() {
    return this._updatedAt;
  }
  /**
   * Get workflow metadata
   */
  getMetadata() {
    return {
      id: this._id,
      name: this._name,
      description: this._description,
      domain: this._domain,
      templateId: this._templateId,
      version: this._version,
      status: this._status,
      userId: this._userId,
      organizationId: this._organizationId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      stepCount: this._steps.size
    };
  }
  /**
   * Add a step to the workflow
   */
  addStep(step) {
    if (this._status === "archived") {
      throw new Error("Cannot modify archived workflow");
    }
    if (this._steps.has(step.id)) {
      throw new Error(`Step with ID ${step.id} already exists`);
    }
    for (const depId of step.dependencies) {
      if (!this._steps.has(depId)) {
        throw new Error(`Dependency step ${depId} not found`);
      }
    }
    this._steps.set(step.id, step);
    this._incrementVersion();
  }
  /**
   * Remove a step from the workflow
   */
  /**
   * Remove a step from the workflow
   */
  removeStep(stepId) {
    if (this._status === "archived") {
      throw new Error("Cannot modify archived workflow");
    }
    for (const step of this._steps.values()) {
      if (step.dependencies.includes(stepId)) {
        throw new Error(`Cannot remove step ${stepId}: step ${step.id} depends on it`);
      }
    }
    this._steps.delete(stepId);
    this._incrementVersion();
  }
  /**
   * Get a step by ID
   */
  getStep(stepId) {
    return this._steps.get(stepId);
  }
  /**
   * Update workflow name
   */
  updateName(name) {
    if (this._status === "archived") {
      throw new Error("Cannot modify archived workflow");
    }
    this._name = name;
    this._incrementVersion();
  }
  /**
   * Update workflow description
   */
  updateDescription(description) {
    if (this._status === "archived") {
      throw new Error("Cannot modify archived workflow");
    }
    this._description = description;
    this._incrementVersion();
  }
  /**
   * Increment version (private helper)
   */
  _incrementVersion() {
    this._version += 1;
    this._updatedAt = /* @__PURE__ */ new Date();
  }
  /**
   * Reorder steps
   */
  reorderSteps(stepIds) {
    if (this._status === "archived") {
      throw new Error("Cannot modify archived workflow");
    }
    for (const id of stepIds) {
      if (!this._steps.has(id)) {
        throw new Error(`Step ${id} not found`);
      }
    }
    const newSteps = /* @__PURE__ */ new Map();
    for (const id of stepIds) {
      newSteps.set(id, this._steps.get(id));
    }
    this._steps = newSteps;
    this._incrementVersion();
  }
  /**
   * Activate workflow (draft -> active)
   */
  activate() {
    if (this._status !== "draft") {
      throw new Error(`Cannot activate workflow in ${this._status} state`);
    }
    this._status = "active";
    this._updatedAt = /* @__PURE__ */ new Date();
  }
  /**
   * Complete workflow (active -> completed)
   */
  complete() {
    if (this._status !== "active") {
      throw new Error(`Cannot complete workflow in ${this._status} state`);
    }
    this._status = "completed";
    this._updatedAt = /* @__PURE__ */ new Date();
  }
  /**
   * Validate workflow structure
   */
  validate() {
    const errors = [];
    if (this._steps.size === 0) {
      errors.push("Workflow must have at least one step");
    }
    for (const step of this._steps.values()) {
      for (const depId of step.dependencies) {
        if (!this._steps.has(depId)) {
          errors.push(`Step ${step.id} depends on non-existent step ${depId}`);
        }
      }
    }
    try {
      this.validateNoCycles();
    } catch {
      errors.push("Workflow contains circular dependencies");
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
  /**
   * Clone workflow with new ID
   */
  clone(newId) {
    const cloned = new _Workflow({
      id: newId,
      name: this._name,
      description: this._description,
      domain: this._domain,
      templateId: this._id,
      version: 1,
      status: "draft",
      userId: this._userId,
      organizationId: this._organizationId
    });
    const stepIdMap = /* @__PURE__ */ new Map();
    for (const step of this._steps.values()) {
      stepIdMap.set(step.id, crypto.randomUUID());
    }
    for (const step of this._steps.values()) {
      const newStepId = stepIdMap.get(step.id);
      const newDependencies = step.dependencies.map((depId) => stepIdMap.get(depId) ?? depId);
      const clonedStep = new Step({
        id: newStepId,
        name: step.name,
        type: step.type,
        domain: step.domain,
        config: { ...step.config },
        position: { ...step.position },
        dependencies: newDependencies,
        status: "pending"
      });
      cloned._steps.set(newStepId, clonedStep);
    }
    return cloned;
  }
  /**
   * Create template from workflow (strips user-specific data)
   */
  toTemplate() {
    return {
      name: this._name,
      description: this._description,
      domain: this._domain,
      steps: this.steps.map((s) => ({
        name: s.name,
        type: s.type,
        domain: s.domain,
        config: s.config,
        dependencies: s.dependencies
      }))
    };
  }
  /**
   * Create version snapshot (WKFL-COMM-002)
   */
  createSnapshot() {
    const snapshot = {
      version: this._version,
      data: this.toJSON(),
      createdAt: /* @__PURE__ */ new Date()
    };
    this._versionHistory.push(snapshot);
    return snapshot;
  }
  /**
   * Get version history
   */
  get versionHistory() {
    return [...this._versionHistory];
  }
  /**
   * Publish workflow (WKFL-COMM-002)
   */
  publish() {
    if (this._steps.size === 0) {
      throw new Error("Cannot publish workflow without steps");
    }
    this.validateNoCycles();
    this._status = "published";
    this._version += 1;
    this._updatedAt = /* @__PURE__ */ new Date();
  }
  /**
   * Archive workflow
   */
  archive() {
    this._status = "archived";
    this._updatedAt = /* @__PURE__ */ new Date();
  }
  /**
   * Create a draft copy
   */
  createDraft() {
    const draft = new _Workflow({
      id: crypto.randomUUID(),
      name: `${this._name} (Copy)`,
      description: this._description,
      domain: this._domain,
      templateId: this._id,
      version: 1,
      status: "draft",
      userId: this._userId,
      organizationId: this._organizationId
    });
    for (const step of this._steps.values()) {
      draft.addStep(step.clone());
    }
    return draft;
  }
  /**
   * Validate workflow is a valid DAG (no cycles)
   */
  validateNoCycles() {
    const visited = /* @__PURE__ */ new Set();
    const recursionStack = /* @__PURE__ */ new Set();
    const hasCycle = (stepId) => {
      visited.add(stepId);
      recursionStack.add(stepId);
      const step = this._steps.get(stepId);
      if (step) {
        for (const depId of step.dependencies) {
          if (!visited.has(depId) && hasCycle(depId)) {
            return true;
          }
          if (recursionStack.has(depId)) {
            return true;
          }
        }
      }
      recursionStack.delete(stepId);
      return false;
    };
    for (const stepId of this._steps.keys()) {
      if (!visited.has(stepId) && hasCycle(stepId)) {
        throw new Error("Workflow contains a cycle");
      }
    }
  }
  /**
   * Get execution order (topological sort)
   */
  getExecutionOrder() {
    const order = [];
    const visited = /* @__PURE__ */ new Set();
    const visit = (stepId) => {
      if (visited.has(stepId)) return;
      visited.add(stepId);
      const step = this._steps.get(stepId);
      if (step) {
        for (const depId of step.dependencies) {
          visit(depId);
        }
      }
      order.push(stepId);
    };
    for (const stepId of this._steps.keys()) {
      visit(stepId);
    }
    return order;
  }
  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      id: this._id,
      name: this._name,
      description: this._description,
      domain: this._domain,
      templateId: this._templateId,
      version: this._version,
      status: this._status,
      userId: this._userId,
      organizationId: this._organizationId,
      steps: this.steps.map((s) => s.toJSON()),
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString()
    };
  }
  /**
   * Deserialize from JSON
   */
  static fromJSON(json) {
    const workflow = new _Workflow({
      id: json.id,
      name: json.name,
      description: json.description,
      domain: json.domain,
      templateId: json.templateId,
      version: json.version,
      status: json.status,
      userId: json.userId,
      organizationId: json.organizationId,
      createdAt: json.createdAt ? new Date(json.createdAt) : void 0,
      updatedAt: json.updatedAt ? new Date(json.updatedAt) : void 0
    });
    if (json.steps) {
      for (const stepJson of json.steps) {
        const step = Step.fromJSON(stepJson);
        workflow._steps.set(step.id, step);
      }
    }
    return workflow;
  }
};

// src/workflow/domain/execution.ts
var Execution = class _Execution {
  _id;
  _workflowId;
  _userId;
  _status;
  _progress;
  _totalSteps;
  _results;
  _error;
  _failedStepId;
  _parameters;
  _environment;
  _startedAt;
  _completedAt;
  constructor(params) {
    this._id = params.id;
    this._workflowId = params.workflowId;
    this._userId = params.userId;
    this._status = params.status ?? "queued";
    this._progress = params.progress ?? 0;
    this._totalSteps = params.totalSteps ?? 0;
    this._results = /* @__PURE__ */ new Map();
    this._parameters = params.parameters ?? {};
    this._environment = params.environment ?? {};
    this._startedAt = params.startedAt ?? /* @__PURE__ */ new Date();
  }
  // Getters
  get id() {
    return this._id;
  }
  get workflowId() {
    return this._workflowId;
  }
  get userId() {
    return this._userId;
  }
  get status() {
    return this._status;
  }
  get progress() {
    return this._progress;
  }
  get totalSteps() {
    return this._totalSteps;
  }
  get results() {
    return Array.from(this._results.values());
  }
  get error() {
    return this._error;
  }
  get failedStepId() {
    return this._failedStepId;
  }
  get parameters() {
    return { ...this._parameters };
  }
  get environment() {
    return { ...this._environment };
  }
  get startedAt() {
    return this._startedAt;
  }
  get completedAt() {
    return this._completedAt;
  }
  get duration() {
    if (!this._completedAt) return void 0;
    return this._completedAt.getTime() - this._startedAt.getTime();
  }
  /**
   * Start execution
   */
  start() {
    if (this._status !== "queued") {
      throw new Error(`Cannot start execution in ${this._status} state`);
    }
    this._status = "running";
    this._startedAt = /* @__PURE__ */ new Date();
  }
  /**
   * Set total number of steps
   */
  setTotalSteps(count) {
    this._totalSteps = count;
    this._updateProgress();
  }
  /**
   * Set execution parameters
   */
  setParameters(params) {
    this._parameters = { ...params };
  }
  /**
   * Set execution environment
   */
  setEnvironment(env) {
    this._environment = { ...env };
  }
  /**
   * Record step result (WKFL-COMM-006)
   */
  recordStepResult(result) {
    this._results.set(result.stepId, result);
    if (result.status === "failed") {
      this._failedStepId = result.stepId;
    }
    this._updateProgress();
  }
  /**
   * Update progress based on completed/skipped steps
   */
  _updateProgress() {
    if (this._totalSteps === 0) {
      this._progress = 0;
      return;
    }
    const completed = Array.from(this._results.values()).filter(
      (r) => r.status === "completed" || r.status === "skipped"
    ).length;
    this._progress = Math.round(completed / this._totalSteps * 100);
  }
  /**
   * Estimate remaining time based on average step duration
   */
  get estimatedRemainingTime() {
    const completedResults = Array.from(this._results.values()).filter(
      (r) => r.status === "completed" && r.duration
    );
    if (completedResults.length === 0) return void 0;
    const avgDuration = completedResults.reduce((sum, r) => sum + (r.duration ?? 0), 0) / completedResults.length;
    const remainingSteps = this._totalSteps - completedResults.length;
    return Math.round(avgDuration * remainingSteps);
  }
  /**
   * Get result for a specific step
   */
  getStepResult(stepId) {
    return this._results.get(stepId);
  }
  /**
   * Pause execution (WKFL-COMM-005)
   */
  pause() {
    if (this._status !== "running") {
      throw new Error(`Cannot pause execution in ${this._status} state`);
    }
    this._status = "paused";
  }
  /**
   * Resume execution (WKFL-COMM-005)
   */
  resume() {
    if (this._status !== "paused" && this._status !== "failed") {
      throw new Error(`Cannot resume execution in ${this._status} state`);
    }
    this._status = "running";
    this._failedStepId = void 0;
  }
  /**
   * Resume from failed step (WKFL-COMM-005)
   */
  resumeFromFailure() {
    if (this._status !== "failed") {
      throw new Error(`Cannot resume from failure in ${this._status} state`);
    }
    if (this._failedStepId) {
      this._results.delete(this._failedStepId);
    }
    this._status = "running";
    this._error = void 0;
    this._failedStepId = void 0;
    this._updateProgress();
  }
  /**
   * Retry a specific step (WKFL-COMM-005)
   */
  retryStep(stepId) {
    this._results.delete(stepId);
    if (this._failedStepId === stepId) {
      this._failedStepId = void 0;
      this._error = void 0;
    }
    if (this._status === "failed") {
      this._status = "running";
    }
    this._updateProgress();
  }
  /**
   * Cancel execution
   */
  cancel() {
    if (this._status === "completed") {
      throw new Error("Cannot cancel completed execution");
    }
    this._status = "cancelled";
    this._completedAt = /* @__PURE__ */ new Date();
  }
  /**
   * Complete execution
   */
  complete() {
    this._status = "completed";
    this._progress = 100;
    this._completedAt = /* @__PURE__ */ new Date();
  }
  /**
   * Fail execution
   */
  fail(error) {
    this._status = "failed";
    this._error = error;
    this._completedAt = /* @__PURE__ */ new Date();
  }
  /**
   * Get failed step IDs for retry (WKFL-COMM-005)
   */
  getFailedStepIds() {
    return Array.from(this._results.values()).filter((r) => r.status === "failed").map((r) => r.stepId);
  }
  /**
   * Get completed step IDs for resume (WKFL-COMM-005)
   */
  getCompletedStepIds() {
    return Array.from(this._results.values()).filter((r) => r.status === "completed").map((r) => r.stepId);
  }
  /**
   * Get execution summary
   */
  getSummary() {
    const results = Array.from(this._results.values());
    return {
      totalSteps: this._totalSteps,
      completedSteps: results.filter((r) => r.status === "completed").length,
      failedSteps: results.filter((r) => r.status === "failed").length,
      skippedSteps: results.filter((r) => r.status === "skipped").length,
      progress: this._progress,
      duration: this.duration,
      status: this._status
    };
  }
  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      id: this._id,
      workflowId: this._workflowId,
      userId: this._userId,
      status: this._status,
      progress: this._progress,
      totalSteps: this._totalSteps,
      results: Array.from(this._results.values()),
      error: this._error,
      failedStepId: this._failedStepId,
      parameters: this._parameters,
      environment: this._environment,
      startedAt: this._startedAt.toISOString(),
      completedAt: this._completedAt?.toISOString()
    };
  }
  /**
   * Deserialize from JSON
   */
  static fromJSON(json) {
    const execution = new _Execution({
      id: json.id,
      workflowId: json.workflowId,
      userId: json.userId,
      status: json.status,
      progress: json.progress,
      totalSteps: json.totalSteps,
      parameters: json.parameters,
      environment: json.environment,
      startedAt: json.startedAt ? new Date(json.startedAt) : void 0
    });
    if (json.results) {
      for (const result of json.results) {
        execution._results.set(result.stepId, result);
      }
    }
    if (json.error) {
      execution._error = json.error;
    }
    if (json.failedStepId) {
      execution._failedStepId = json.failedStepId;
    }
    if (json.completedAt) {
      execution._completedAt = new Date(json.completedAt);
    }
    return execution;
  }
};

// src/workflow/services/workflow-service.ts
var WorkflowService = class {
  constructor(repository) {
    this.repository = repository;
  }
  /**
   * Create a new workflow (DASH-PROJ-001, DASH-PROJ-005)
   */
  async create(input) {
    const workflow = new Workflow({
      id: crypto.randomUUID(),
      name: input.name,
      description: input.description,
      domain: input.domain,
      userId: input.userId,
      organizationId: input.organizationId,
      status: "draft",
      version: 1
    });
    await this.repository.save(workflow);
    return workflow;
  }
  /**
   * Create workflow from template
   */
  async createFromTemplate(templateId, options) {
    const template = await this.repository.findById(templateId);
    if (!template) {
      throw new Error("Template not found");
    }
    const newId = crypto.randomUUID();
    const workflow = new Workflow({
      id: newId,
      name: options.name ?? `${template.name} (Copy)`,
      description: template.description,
      domain: template.domain,
      templateId,
      userId: options.userId,
      organizationId: options.organizationId,
      status: "draft",
      version: 1
    });
    const stepIdMap = /* @__PURE__ */ new Map();
    for (const step of template.steps) {
      stepIdMap.set(step.id, crypto.randomUUID());
    }
    for (const step of template.steps) {
      const newStepId = stepIdMap.get(step.id);
      const newDependencies = step.dependencies.map((depId) => stepIdMap.get(depId) ?? depId);
      const clonedStep = new Step({
        id: newStepId,
        name: step.name,
        type: step.type,
        domain: step.domain,
        config: { ...step.config },
        position: { ...step.position },
        dependencies: newDependencies,
        status: "pending"
      });
      workflow.addStep(clonedStep);
    }
    await this.repository.save(workflow);
    return workflow;
  }
  /**
   * Get workflow by ID
   */
  async getById(id) {
    return this.repository.findById(id);
  }
  /**
   * List workflows by user
   */
  async listByUser(userId) {
    return this.repository.findByUserId(userId);
  }
  /**
   * List workflows by domain
   */
  async listByDomain(domain) {
    return this.repository.findByDomain(domain);
  }
  /**
   * Update workflow (WKFL-COMM-001)
   */
  async update(id, input) {
    const workflow = await this.repository.findById(id);
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    if (workflow.status === "archived") {
      throw new Error("Cannot modify archived workflow");
    }
    if (input.name !== void 0) {
      workflow.updateName(input.name);
    }
    if (input.description !== void 0) {
      workflow.updateDescription(input.description);
    }
    await this.repository.save(workflow);
    return workflow;
  }
  /**
   * Delete workflow (DASH-PROJ-001)
   */
  async delete(id, options) {
    const workflow = await this.repository.findById(id);
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    if (options?.soft) {
      workflow.archive();
      await this.repository.save(workflow);
    } else {
      await this.repository.delete(id);
    }
  }
  /**
   * Add step to workflow
   */
  async addStep(workflowId, input) {
    const workflow = await this.repository.findById(workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    const step = new Step({
      id: crypto.randomUUID(),
      name: input.name,
      type: input.type,
      domain: input.domain,
      config: input.config,
      position: input.position,
      dependencies: input.dependencies,
      optional: input.optional
    });
    workflow.addStep(step);
    await this.repository.save(workflow);
    return workflow;
  }
  /**
   * Remove step from workflow
   */
  async removeStep(workflowId, stepId) {
    const workflow = await this.repository.findById(workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    workflow.removeStep(stepId);
    await this.repository.save(workflow);
    return workflow;
  }
  /**
   * Update step configuration
   */
  async updateStep(workflowId, stepId, input) {
    const workflow = await this.repository.findById(workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    const step = workflow.getStep(stepId);
    if (!step) {
      throw new Error("Step not found");
    }
    if (input.name !== void 0) {
      step.updateName(input.name);
    }
    if (input.config !== void 0) {
      step.updateConfig(input.config);
    }
    if (input.position !== void 0) {
      step.updatePosition(input.position);
    }
    await this.repository.save(workflow);
    return workflow;
  }
  /**
   * Create version snapshot (WKFL-COMM-002)
   */
  async createSnapshot(workflowId) {
    const workflow = await this.repository.findById(workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    const snapshot = workflow.createSnapshot();
    await this.repository.save(workflow);
    return snapshot;
  }
  /**
   * Get version history (WKFL-COMM-002)
   */
  async getVersionHistory(workflowId) {
    const workflow = await this.repository.findById(workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    return workflow.versionHistory;
  }
  /**
   * Activate workflow
   */
  async activate(workflowId) {
    const workflow = await this.repository.findById(workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    if (workflow.steps.length === 0) {
      throw new Error("Cannot activate workflow without steps");
    }
    workflow.activate();
    await this.repository.save(workflow);
    return workflow;
  }
  /**
   * Archive workflow
   */
  async archive(workflowId) {
    const workflow = await this.repository.findById(workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    workflow.archive();
    await this.repository.save(workflow);
    return workflow;
  }
  /**
   * Clone workflow
   */
  async clone(workflowId, options) {
    const original = await this.repository.findById(workflowId);
    if (!original) {
      throw new Error("Workflow not found");
    }
    const newId = crypto.randomUUID();
    const cloned = original.clone(newId);
    if (options.name) {
      cloned.updateName(options.name);
    }
    const workflow = new Workflow({
      id: cloned.id,
      name: cloned.name,
      description: cloned.description,
      domain: cloned.domain,
      templateId: original.id,
      userId: options.userId,
      status: "draft",
      version: 1
    });
    for (const step of cloned.steps) {
      workflow.addStep(step);
    }
    await this.repository.save(workflow);
    return workflow;
  }
  /**
   * Validate workflow structure
   */
  async validate(workflowId) {
    const workflow = await this.repository.findById(workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    return workflow.validate();
  }
  /**
   * Check if user can access workflow
   */
  async canAccess(workflowId, userId) {
    const workflow = await this.repository.findById(workflowId);
    if (!workflow) {
      return false;
    }
    if (workflow.status === "published") {
      return true;
    }
    return workflow.userId === userId;
  }
};

// src/workflow/services/execution-service.ts
var ExecutionService = class {
  constructor(executionRepository, workflowRepository) {
    this.executionRepository = executionRepository;
    this.workflowRepository = workflowRepository;
  }
  /**
   * Start a new execution for a workflow
   */
  async start(input) {
    const workflow = await this.workflowRepository.findById(input.workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    if (workflow.status !== "active" && workflow.status !== "published") {
      throw new Error(`Cannot execute workflow in ${workflow.status} status`);
    }
    const execution = new Execution({
      id: crypto.randomUUID(),
      workflowId: input.workflowId,
      userId: input.userId,
      status: "queued",
      totalSteps: workflow.getMetadata?.()?.stepCount ?? workflow.steps?.length ?? 0,
      parameters: input.parameters,
      environment: input.environment
    });
    execution.start();
    await this.executionRepository.save(execution);
    return execution;
  }
  /**
   * Get execution by ID
   */
  async getById(id) {
    return this.executionRepository.findById(id);
  }
  /**
   * Get all executions for a workflow
   */
  async getByWorkflowId(workflowId) {
    return this.executionRepository.findByWorkflowId(workflowId);
  }
  /**
   * Get all executions for a user
   */
  async getByUserId(userId) {
    return this.executionRepository.findByUserId(userId);
  }
  /**
   * Pause execution
   */
  async pause(executionId) {
    const execution = await this.executionRepository.findById(executionId);
    if (!execution) {
      throw new Error("Execution not found");
    }
    execution.pause();
    await this.executionRepository.save(execution);
  }
  /**
   * Resume execution (WKFL-COMM-005)
   */
  async resume(executionId) {
    const execution = await this.executionRepository.findById(executionId);
    if (!execution) {
      throw new Error("Execution not found");
    }
    execution.resume();
    await this.executionRepository.save(execution);
  }
  /**
   * Cancel execution
   */
  async cancel(executionId) {
    const execution = await this.executionRepository.findById(executionId);
    if (!execution) {
      throw new Error("Execution not found");
    }
    execution.cancel();
    await this.executionRepository.save(execution);
  }
  /**
   * Resume from failed step (WKFL-COMM-005)
   */
  async resumeFromFailure(executionId) {
    const execution = await this.executionRepository.findById(executionId);
    if (!execution) {
      throw new Error("Execution not found");
    }
    execution.resumeFromFailure();
    await this.executionRepository.save(execution);
  }
  /**
   * Retry a specific step
   */
  async retryStep(executionId, stepId) {
    const execution = await this.executionRepository.findById(executionId);
    if (!execution) {
      throw new Error("Execution not found");
    }
    execution.retryStep(stepId);
    await this.executionRepository.save(execution);
  }
  /**
   * Record step result (WKFL-COMM-006)
   */
  async recordStepResult(executionId, result) {
    const execution = await this.executionRepository.findById(executionId);
    if (!execution) {
      throw new Error("Execution not found");
    }
    execution.recordStepResult(result);
    await this.executionRepository.save(execution);
  }
  /**
   * Get execution progress (DASH-PROG-001, DASH-PROG-003)
   */
  async getProgress(executionId) {
    const execution = await this.executionRepository.findById(executionId);
    if (!execution) {
      throw new Error("Execution not found");
    }
    const summary = execution.getSummary();
    return {
      progress: execution.progress,
      status: execution.status,
      totalSteps: summary.totalSteps,
      completedSteps: summary.completedSteps,
      estimatedRemainingTime: execution.estimatedRemainingTime
    };
  }
  /**
   * Get execution summary
   */
  async getSummary(executionId) {
    const execution = await this.executionRepository.findById(executionId);
    if (!execution) {
      throw new Error("Execution not found");
    }
    return execution.getSummary();
  }
  /**
   * Mark execution as completed
   */
  async complete(executionId) {
    const execution = await this.executionRepository.findById(executionId);
    if (!execution) {
      throw new Error("Execution not found");
    }
    execution.complete();
    await this.executionRepository.save(execution);
  }
  /**
   * Mark execution as failed
   */
  async fail(executionId, error) {
    const execution = await this.executionRepository.findById(executionId);
    if (!execution) {
      throw new Error("Execution not found");
    }
    execution.fail(error);
    await this.executionRepository.save(execution);
  }
  /**
   * Get result for a specific step
   */
  async getStepResult(executionId, stepId) {
    const execution = await this.executionRepository.findById(executionId);
    if (!execution) {
      throw new Error("Execution not found");
    }
    return execution.getStepResult(stepId);
  }
  /**
   * Check if user can access execution
   */
  async canAccess(executionId, userId) {
    const execution = await this.executionRepository.findById(executionId);
    if (!execution) {
      return false;
    }
    return execution.userId === userId;
  }
};

export { Execution, ExecutionService, Step, Workflow, WorkflowService };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map
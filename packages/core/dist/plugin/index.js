// src/plugin/registry.ts
var PluginRegistry = class {
  plugins = /* @__PURE__ */ new Map();
  metadata = /* @__PURE__ */ new Map();
  /**
   * Register a plugin
   */
  register(plugin) {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin ${plugin.id} is already registered`);
    }
    if (plugin.dependencies) {
      for (const depId of plugin.dependencies) {
        if (!this.plugins.has(depId)) {
          throw new Error(
            `Plugin ${plugin.id} depends on ${depId} which is not loaded`
          );
        }
      }
    }
    this.plugins.set(plugin.id, plugin);
    this.metadata.set(plugin.id, {
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      domain: plugin.domain,
      description: plugin.description,
      author: plugin.author,
      dependencies: plugin.dependencies,
      status: "registered",
      loadedAt: /* @__PURE__ */ new Date()
    });
  }
  /**
   * Unregister a plugin
   */
  unregister(pluginId) {
    for (const [id, plugin] of this.plugins) {
      if (plugin.dependencies?.includes(pluginId)) {
        throw new Error(
          `Cannot unregister ${pluginId}: plugin ${id} depends on it`
        );
      }
    }
    this.plugins.delete(pluginId);
    this.metadata.delete(pluginId);
  }
  /**
   * Get a plugin by ID
   */
  get(pluginId) {
    return this.plugins.get(pluginId);
  }
  /**
   * Get all plugins
   */
  getAll() {
    return Array.from(this.plugins.values());
  }
  /**
   * Get plugins by domain
   */
  getByDomain(domain) {
    return Array.from(this.plugins.values()).filter(
      (p) => p.domain === domain || p.domain === "common"
    );
  }
  /**
   * Get plugin metadata
   */
  getMetadata(pluginId) {
    return this.metadata.get(pluginId);
  }
  /**
   * Get all plugin metadata
   */
  getAllMetadata() {
    return Array.from(this.metadata.values());
  }
  /**
   * Update plugin status
   */
  updateStatus(pluginId, status, error) {
    const meta = this.metadata.get(pluginId);
    if (meta) {
      meta.status = status;
      if (error) {
        meta.error = error;
      }
    }
  }
  /**
   * Check if a plugin is registered
   */
  has(pluginId) {
    return this.plugins.has(pluginId);
  }
  /**
   * Get plugin count
   */
  get size() {
    return this.plugins.size;
  }
  /**
   * Clear all plugins
   */
  clear() {
    this.plugins.clear();
    this.metadata.clear();
  }
};

// src/plugin/loader.ts
var PluginLoader = class {
  /**
   * Load a plugin from a path or module name
   */
  async load(pluginPath) {
    try {
      const module = await import(pluginPath);
      const plugin = module.default || module.plugin;
      if (!plugin) {
        throw new Error(`No plugin export found in ${pluginPath}`);
      }
      this.validatePlugin(plugin);
      return plugin;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load plugin from ${pluginPath}: ${error.message}`);
      }
      throw error;
    }
  }
  /**
   * Validate that an object implements the LabFlowPlugin interface
   */
  validatePlugin(plugin) {
    if (!plugin || typeof plugin !== "object") {
      throw new Error("Plugin must be an object");
    }
    const p = plugin;
    if (typeof p.id !== "string" || !p.id) {
      throw new Error("Plugin must have a string id");
    }
    if (typeof p.name !== "string" || !p.name) {
      throw new Error("Plugin must have a string name");
    }
    if (typeof p.version !== "string" || !p.version) {
      throw new Error("Plugin must have a string version");
    }
    if (typeof p.domain !== "string" || !p.domain) {
      throw new Error("Plugin must have a string domain");
    }
    if (typeof p.initialize !== "function") {
      throw new Error("Plugin must have an initialize method");
    }
    if (typeof p.getWorkflowSteps !== "function") {
      throw new Error("Plugin must have a getWorkflowSteps method");
    }
    if (typeof p.getDataConnectors !== "function") {
      throw new Error("Plugin must have a getDataConnectors method");
    }
    if (typeof p.getVisualizations !== "function") {
      throw new Error("Plugin must have a getVisualizations method");
    }
    if (typeof p.getUIExtensions !== "function") {
      throw new Error("Plugin must have a getUIExtensions method");
    }
    if (typeof p.cleanup !== "function") {
      throw new Error("Plugin must have a cleanup method");
    }
  }
  /**
   * Check if a plugin version is compatible with the core version
   */
  isVersionCompatible(pluginVersion, coreVersion) {
    const pluginMajorStr = pluginVersion.split(".")[0];
    const coreMajorStr = coreVersion.split(".")[0];
    const pluginMajor = parseInt(pluginMajorStr ?? "0", 10);
    const coreMajor = parseInt(coreMajorStr ?? "0", 10);
    if (coreMajor === 0) {
      return true;
    }
    return pluginMajor === coreMajor;
  }
};

// src/plugin/manager.ts
var PluginManager = class {
  registry;
  loader;
  context = null;
  constructor() {
    this.registry = new PluginRegistry();
    this.loader = new PluginLoader();
  }
  /**
   * Initialize the plugin manager with context
   */
  async initialize(context) {
    this.context = context;
  }
  /**
   * Load and initialize a plugin
   */
  async loadPlugin(pluginPath) {
    if (!this.context) {
      throw new Error("Plugin manager not initialized");
    }
    const plugin = await this.loader.load(pluginPath);
    this.registry.register(plugin);
    try {
      await plugin.initialize(this.context);
      this.registry.updateStatus(plugin.id, "initialized");
      this.registry.updateStatus(plugin.id, "active");
      return this.registry.getMetadata(plugin.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.registry.updateStatus(plugin.id, "error", message);
      throw error;
    }
  }
  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginId) {
    const plugin = this.registry.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }
    await plugin.cleanup();
    this.registry.unregister(pluginId);
  }
  /**
   * Get a loaded plugin by ID
   */
  getPlugin(pluginId) {
    return this.registry.get(pluginId);
  }
  /**
   * Get all loaded plugins
   */
  getAllPlugins() {
    return this.registry.getAll();
  }
  /**
   * Get plugins by domain
   */
  getPluginsByDomain(domain) {
    return this.registry.getByDomain(domain);
  }
  /**
   * Get all plugin metadata
   */
  getAllMetadata() {
    return this.registry.getAllMetadata();
  }
  /**
   * Get all workflow step definitions from all plugins
   */
  getAllWorkflowSteps() {
    return this.registry.getAll().flatMap((p) => p.getWorkflowSteps());
  }
  /**
   * Get all data connectors from all plugins
   */
  getAllDataConnectors() {
    return this.registry.getAll().flatMap((p) => p.getDataConnectors());
  }
  /**
   * Get all visualizations from all plugins
   */
  getAllVisualizations() {
    return this.registry.getAll().flatMap((p) => p.getVisualizations());
  }
  /**
   * Get all UI extensions from all plugins
   */
  getAllUIExtensions() {
    return this.registry.getAll().flatMap((p) => p.getUIExtensions());
  }
  /**
   * Shutdown all plugins
   */
  async shutdown() {
    const plugins = this.registry.getAll();
    for (const plugin of plugins) {
      try {
        await plugin.cleanup();
        this.registry.updateStatus(plugin.id, "unloaded");
      } catch (error) {
        console.error(`Error cleaning up plugin ${plugin.id}:`, error);
      }
    }
    this.registry.clear();
  }
};

export { PluginLoader, PluginManager, PluginRegistry };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map
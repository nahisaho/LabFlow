#!/usr/bin/env node

// src/index.ts
import { Command as Command2 } from "commander";

// src/commands/index.ts
import "commander";

// src/actions/init.ts
import * as fs from "fs/promises";
import * as path from "path";
async function initProject(options) {
  const projectDir = path.resolve(process.cwd(), options.name);
  await fs.mkdir(projectDir, { recursive: true });
  await fs.mkdir(path.join(projectDir, "data"), { recursive: true });
  await fs.mkdir(path.join(projectDir, "workflows"), { recursive: true });
  await fs.mkdir(path.join(projectDir, "results"), { recursive: true });
  const config = {
    name: options.name,
    domain: options.domain,
    version: "1.0.0",
    created: (/* @__PURE__ */ new Date()).toISOString()
  };
  await fs.writeFile(
    path.join(projectDir, "labflow.config.json"),
    JSON.stringify(config, null, 2)
  );
  if (options.notebook) {
    const notebook = generateNotebook(options.domain);
    const notebookName = `${options.name}-${options.domain}.ipynb`;
    await fs.writeFile(path.join(projectDir, notebookName), notebook);
  }
  const readme = generateReadme(options.name, options.domain);
  await fs.writeFile(path.join(projectDir, "README.md"), readme);
}
function generateNotebook(domain) {
  const templates = {
    "drug-discovery": getDrugDiscoveryTemplate(),
    materials: getMaterialsTemplate(),
    climate: getClimateTemplate(),
    genomics: getGenomicsTemplate()
  };
  const template = templates[domain] ?? templates["drug-discovery"];
  const notebook = {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: {
        display_name: "Python 3",
        language: "python",
        name: "python3"
      },
      language_info: {
        name: "python",
        version: "3.10.0"
      }
    },
    cells: [
      // 概要 (Overview)
      markdownCell(`# ${template.title}

${template.description}`),
      markdownCell("## \u6982\u8981\n\n\u3053\u306E\u30CE\u30FC\u30C8\u30D6\u30C3\u30AF\u3067\u306F\u3001LabFlow\u3092\u4F7F\u7528\u3057\u3066" + template.overview),
      // 環境セットアップ (Setup)
      markdownCell("## \u74B0\u5883\u30BB\u30C3\u30C8\u30A2\u30C3\u30D7"),
      codeCell(template.setupCode),
      // データ読み込み (Data Loading)
      markdownCell("## \u30C7\u30FC\u30BF\u8AAD\u307F\u8FBC\u307F"),
      codeCell(template.dataLoadCode),
      // 前処理 (Preprocessing)
      markdownCell("## \u30C7\u30FC\u30BF\u524D\u51E6\u7406"),
      codeCell(template.preprocessCode),
      // モデル実行 (Model Execution)
      markdownCell("## \u30E2\u30C7\u30EB\u5B9F\u884C"),
      codeCell(template.modelCode),
      // 結果可視化 (Visualization)
      markdownCell("## \u7D50\u679C\u53EF\u8996\u5316"),
      codeCell(template.vizCode),
      // エクスポート (Export)
      markdownCell("## \u7D50\u679C\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8"),
      codeCell(template.exportCode)
    ]
  };
  return JSON.stringify(notebook, null, 2);
}
function markdownCell(content) {
  return {
    cell_type: "markdown",
    metadata: {},
    source: content.split("\n").map(
      (line, i, arr) => i < arr.length - 1 ? line + "\n" : line
    )
  };
}
function codeCell(code) {
  return {
    cell_type: "code",
    metadata: {},
    source: code.split("\n").map(
      (line, i, arr) => i < arr.length - 1 ? line + "\n" : line
    ),
    execution_count: null,
    outputs: []
  };
}
function getDrugDiscoveryTemplate() {
  return {
    title: "Drug Discovery Workflow",
    description: "LabFlow\u5275\u85AC\u30EF\u30FC\u30AF\u30D5\u30ED\u30FC\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8",
    overview: "\u85AC\u7269\u5019\u88DC\u306E\u30B9\u30AF\u30EA\u30FC\u30CB\u30F3\u30B0\u3068\u4E88\u6E2C\u3092\u884C\u3044\u307E\u3059\u3002",
    setupCode: `# LabFlow \u30BB\u30C3\u30C8\u30A2\u30C3\u30D7
from labflow import LabFlow, WorkflowBuilder
from labflow.domains import DrugDiscovery

# \u521D\u671F\u5316
lf = LabFlow()
dd = DrugDiscovery()`,
    dataLoadCode: `# SMILES \u30C7\u30FC\u30BF\u306E\u8AAD\u307F\u8FBC\u307F
import pandas as pd

# \u30B5\u30F3\u30D7\u30EB\u30C7\u30FC\u30BF
data = pd.read_csv('data/compounds.csv')
print(f"Loaded {len(data)} compounds")
data.head()`,
    preprocessCode: `# \u5206\u5B50\u8A18\u8FF0\u5B50\u306E\u8A08\u7B97
from rdkit import Chem
from rdkit.Chem import Descriptors

def calculate_descriptors(smiles):
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return None
    return {
        'MW': Descriptors.MolWt(mol),
        'LogP': Descriptors.MolLogP(mol),
        'TPSA': Descriptors.TPSA(mol),
    }

data['descriptors'] = data['smiles'].apply(calculate_descriptors)`,
    modelCode: `# \u6D3B\u6027\u4E88\u6E2C\u30E2\u30C7\u30EB\u306E\u5B9F\u884C
results = dd.predict_activity(
    smiles=data['smiles'].tolist(),
    target='binding_affinity'
)
print(f"Predictions completed: {len(results)} compounds")`,
    vizCode: `# \u7D50\u679C\u306E\u53EF\u8996\u5316
import matplotlib.pyplot as plt

plt.figure(figsize=(10, 6))
plt.scatter(results['predicted'], results['confidence'])
plt.xlabel('Predicted Activity')
plt.ylabel('Confidence')
plt.title('Drug Discovery Results')
plt.show()`,
    exportCode: `# \u7D50\u679C\u306E\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8
results.to_csv('results/predictions.csv', index=False)
print("Results exported to results/predictions.csv")`
  };
}
function getMaterialsTemplate() {
  return {
    title: "Materials Science Workflow",
    description: "LabFlow\u6750\u6599\u79D1\u5B66\u30EF\u30FC\u30AF\u30D5\u30ED\u30FC\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8",
    overview: "\u65B0\u6750\u6599\u306E\u7279\u6027\u4E88\u6E2C\u3068\u8A2D\u8A08\u3092\u884C\u3044\u307E\u3059\u3002",
    setupCode: `# LabFlow \u30BB\u30C3\u30C8\u30A2\u30C3\u30D7
from labflow import LabFlow, WorkflowBuilder
from labflow.domains import MaterialsScience

# \u521D\u671F\u5316
lf = LabFlow()
ms = MaterialsScience()`,
    dataLoadCode: `# \u6750\u6599\u30C7\u30FC\u30BF\u306E\u8AAD\u307F\u8FBC\u307F
import pandas as pd

# CIF\u69CB\u9020\u30D5\u30A1\u30A4\u30EB\u307E\u305F\u306F\u7D44\u6210\u30C7\u30FC\u30BF
data = pd.read_csv('data/materials.csv')
print(f"Loaded {len(data)} materials")
data.head()`,
    preprocessCode: `# \u7279\u5FB4\u91CF\u30A8\u30F3\u30B8\u30CB\u30A2\u30EA\u30F3\u30B0
from pymatgen.core import Composition

def get_composition_features(formula):
    comp = Composition(formula)
    return {
        'num_elements': len(comp.elements),
        'avg_atomic_mass': comp.average_electroneg,
    }

data['features'] = data['formula'].apply(get_composition_features)`,
    modelCode: `# \u7279\u6027\u4E88\u6E2C\u30E2\u30C7\u30EB\u306E\u5B9F\u884C
results = ms.predict_properties(
    compositions=data['formula'].tolist(),
    properties=['band_gap', 'formation_energy']
)
print(f"Predictions completed: {len(results)} materials")`,
    vizCode: `# \u7D50\u679C\u306E\u53EF\u8996\u5316
import matplotlib.pyplot as plt

fig, axes = plt.subplots(1, 2, figsize=(12, 5))
axes[0].hist(results['band_gap'], bins=30)
axes[0].set_xlabel('Band Gap (eV)')
axes[1].hist(results['formation_energy'], bins=30)
axes[1].set_xlabel('Formation Energy (eV/atom)')
plt.tight_layout()
plt.show()`,
    exportCode: `# \u7D50\u679C\u306E\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8
results.to_csv('results/material_predictions.csv', index=False)
print("Results exported to results/material_predictions.csv")`
  };
}
function getClimateTemplate() {
  return {
    title: "Climate & Weather Workflow",
    description: "LabFlow\u6C17\u5019\u30FB\u6C17\u8C61\u30EF\u30FC\u30AF\u30D5\u30ED\u30FC\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8",
    overview: "\u6C17\u8C61\u4E88\u6E2C\u3068\u30C7\u30FC\u30BF\u5206\u6790\u3092\u884C\u3044\u307E\u3059\u3002",
    setupCode: `# LabFlow \u30BB\u30C3\u30C8\u30A2\u30C3\u30D7
from labflow import LabFlow, WorkflowBuilder
from labflow.domains import Climate

# \u521D\u671F\u5316
lf = LabFlow()
climate = Climate()`,
    dataLoadCode: `# \u6C17\u8C61\u30C7\u30FC\u30BF\u306E\u8AAD\u307F\u8FBC\u307F
import xarray as xr

# ERA5 \u518D\u89E3\u6790\u30C7\u30FC\u30BF
data = xr.open_dataset('data/era5_sample.nc')
print(data)`,
    preprocessCode: `# \u30C7\u30FC\u30BF\u524D\u51E6\u7406
# \u6642\u9593\u7BC4\u56F2\u306E\u9078\u629E
data_subset = data.sel(time=slice('2024-01-01', '2024-01-31'))

# \u7A7A\u9593\u88DC\u9593
data_interp = data_subset.interp(lat=np.arange(-90, 91, 1), lon=np.arange(0, 360, 1))`,
    modelCode: `# Aurora \u6C17\u8C61\u4E88\u6E2C\u30E2\u30C7\u30EB\u306E\u5B9F\u884C
results = climate.predict_weather(
    initial_conditions=data_subset,
    forecast_hours=72,
    variables=['temperature', 'precipitation']
)
print(f"Forecast generated for {len(results.time)} time steps")`,
    vizCode: `# \u7D50\u679C\u306E\u53EF\u8996\u5316
import matplotlib.pyplot as plt
import cartopy.crs as ccrs

fig, ax = plt.subplots(figsize=(12, 6), subplot_kw={'projection': ccrs.PlateCarree()})
results['temperature'].isel(time=0).plot(ax=ax, transform=ccrs.PlateCarree())
ax.coastlines()
plt.title('Temperature Forecast')
plt.show()`,
    exportCode: `# \u7D50\u679C\u306E\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8
results.to_netcdf('results/forecast.nc')
print("Results exported to results/forecast.nc")`
  };
}
function getGenomicsTemplate() {
  return {
    title: "Genomics Workflow",
    description: "LabFlow\u30B2\u30CE\u30DF\u30AF\u30B9\u30EF\u30FC\u30AF\u30D5\u30ED\u30FC\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8",
    overview: "\u30BF\u30F3\u30D1\u30AF\u8CEA\u69CB\u9020\u4E88\u6E2C\u3068\u914D\u5217\u5206\u6790\u3092\u884C\u3044\u307E\u3059\u3002",
    setupCode: `# LabFlow \u30BB\u30C3\u30C8\u30A2\u30C3\u30D7
from labflow import LabFlow, WorkflowBuilder
from labflow.domains import Genomics

# \u521D\u671F\u5316
lf = LabFlow()
genomics = Genomics()`,
    dataLoadCode: `# \u914D\u5217\u30C7\u30FC\u30BF\u306E\u8AAD\u307F\u8FBC\u307F
from Bio import SeqIO

# FASTA\u30D5\u30A1\u30A4\u30EB
sequences = list(SeqIO.parse('data/sequences.fasta', 'fasta'))
print(f"Loaded {len(sequences)} sequences")
for seq in sequences[:3]:
    print(f"  {seq.id}: {len(seq.seq)} residues")`,
    preprocessCode: `# \u914D\u5217\u306E\u524D\u51E6\u7406
# \u9577\u3055\u30D5\u30A3\u30EB\u30BF\u30EA\u30F3\u30B0
filtered_seqs = [s for s in sequences if 50 <= len(s.seq) <= 1000]
print(f"Filtered to {len(filtered_seqs)} sequences")

# \u30A2\u30DF\u30CE\u9178\u7D44\u6210
from collections import Counter
aa_counts = Counter(str(filtered_seqs[0].seq))`,
    modelCode: `# BioEmu \u69CB\u9020\u4E88\u6E2C\u30E2\u30C7\u30EB\u306E\u5B9F\u884C
results = genomics.predict_structure(
    sequences=[str(s.seq) for s in filtered_seqs[:5]],
    num_conformations=10
)
print(f"Structure predictions completed: {len(results)} proteins")`,
    vizCode: `# \u7D50\u679C\u306E\u53EF\u8996\u5316
import py3Dmol

# \u69CB\u9020\u8868\u793A
view = py3Dmol.view(width=600, height=400)
view.addModel(results[0]['pdb'], 'pdb')
view.setStyle({'cartoon': {'color': 'spectrum'}})
view.zoomTo()
view.show()`,
    exportCode: `# \u7D50\u679C\u306E\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8
for i, result in enumerate(results):
    with open(f'results/structure_{i}.pdb', 'w') as f:
        f.write(result['pdb'])
print(f"Exported {len(results)} PDB files to results/")`
  };
}
function generateReadme(name, domain) {
  return `# ${name}

LabFlow project for ${domain} research.

## Getting Started

1. Install dependencies:
   \`\`\`bash
   pip install labflow
   \`\`\`

2. Run the workflow:
   \`\`\`bash
   labflow workflow run workflows/main.yaml
   \`\`\`

## Project Structure

- \`data/\` - Input data files
- \`workflows/\` - Workflow definitions
- \`results/\` - Output results

## Documentation

See [LabFlow Documentation](https://labflow.ai/docs) for more information.
`;
}

// src/actions/search.ts
import {
  SemanticSearchService,
  createEmbeddingProvider,
  createVectorStore,
  KnowledgeBase,
  LiteratureSearchService
} from "@labflow/core/knowledge";
var searchService = null;
function getSearchService() {
  if (!searchService) {
    const embeddingProvider = createEmbeddingProvider({
      type: "mock",
      dimensions: 384
    });
    const vectorStore = createVectorStore({ type: "memory" });
    searchService = new SemanticSearchService({
      embeddingProvider,
      vectorStore
    });
  }
  return searchService;
}
async function searchDocuments(query, options = {}) {
  const service = getSearchService();
  const results = await service.search(query, {
    limit: options.limit ?? 10,
    filter: options.domain ? { domain: options.domain } : void 0
  });
  return results.map((result) => ({
    id: result.id,
    content: result.content,
    score: result.score,
    metadata: result.metadata
  }));
}
var literatureService = null;
function getLiteratureSearchService() {
  if (!literatureService) {
    const knowledgeBase = new KnowledgeBase({
      embedding: {
        model: "text-embedding-mock",
        dimensions: 384,
        maxTokens: 8191
      },
      vectorStore: {
        type: "memory",
        collectionName: "literature"
      },
      chunkSize: 1e3,
      chunkOverlap: 200
    });
    literatureService = new LiteratureSearchService(knowledgeBase);
  }
  return literatureService;
}
async function searchLiterature(query, options = {}) {
  const service = getLiteratureSearchService();
  const results = await service.search({
    query,
    domain: options.domain,
    yearRange: options.yearRange,
    minCitations: options.minCitations,
    limit: options.limit ?? 10
  });
  return results.map((result) => ({
    id: result.paper.id,
    title: result.paper.title,
    authors: result.paper.metadata.authors,
    year: result.paper.metadata.year,
    domain: result.paper.metadata.domain,
    citations: result.paper.metadata.citations,
    score: result.score,
    highlights: result.highlights ?? []
  }));
}
async function searchLiteratureByDomain(domain, query, limit = 10) {
  const service = getLiteratureSearchService();
  const results = await service.searchByDomain(domain, query, limit);
  return results.map((result) => ({
    id: result.paper.id,
    title: result.paper.title,
    authors: result.paper.metadata.authors,
    year: result.paper.metadata.year,
    domain: result.paper.metadata.domain,
    citations: result.paper.metadata.citations,
    score: result.score,
    highlights: result.highlights ?? []
  }));
}
function getLiteratureStats() {
  const service = getLiteratureSearchService();
  return service.getStats();
}

// src/actions/export.ts
import * as fs2 from "fs/promises";
import "path";
async function exportWorkflow(workflowFile, options) {
  const content = await fs2.readFile(workflowFile, "utf-8");
  const workflow = JSON.parse(content);
  let output;
  let outputPath;
  switch (options.format) {
    case "notebook":
      output = workflowToNotebook(workflow);
      outputPath = options.output ?? workflowFile.replace(/\.(json|yaml|yml)$/, ".ipynb");
      break;
    case "yaml":
      output = workflowToYaml(workflow);
      outputPath = options.output ?? workflowFile.replace(/\.json$/, ".yaml");
      break;
    case "json":
    default:
      output = JSON.stringify(workflow, null, 2);
      outputPath = options.output ?? workflowFile.replace(/\.(yaml|yml)$/, ".json");
      break;
  }
  await fs2.writeFile(outputPath, output);
}
function workflowToNotebook(workflow) {
  const cells = [];
  cells.push(
    markdownCell2(`# ${workflow.name}

${workflow.description ?? ""}`)
  );
  cells.push(markdownCell2("## Setup"));
  cells.push(
    codeCell2(`# LabFlow Workflow: ${workflow.name}
from labflow import LabFlow, WorkflowRunner

lf = LabFlow()
runner = WorkflowRunner(lf)`)
  );
  for (const step of workflow.steps) {
    cells.push(markdownCell2(`## Step: ${step.id}`));
    cells.push(codeCell2(generateStepCode(step)));
  }
  cells.push(markdownCell2("## Results"));
  cells.push(
    codeCell2(`# Display results
print("Workflow completed successfully")
runner.get_results()`)
  );
  const notebook = {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: {
        display_name: "Python 3",
        language: "python",
        name: "python3"
      },
      language_info: {
        name: "python",
        version: "3.10.0"
      }
    },
    cells
  };
  return JSON.stringify(notebook, null, 2);
}
function workflowToYaml(workflow) {
  const lines = [];
  lines.push(`name: ${workflow.name}`);
  if (workflow.description) {
    lines.push(`description: ${workflow.description}`);
  }
  if (workflow.version) {
    lines.push(`version: ${workflow.version}`);
  }
  lines.push("steps:");
  for (const step of workflow.steps) {
    lines.push(`  - id: ${step.id}`);
    lines.push(`    type: ${step.type}`);
    if (step.config && Object.keys(step.config).length > 0) {
      lines.push("    config:");
      for (const [key, value] of Object.entries(step.config)) {
        lines.push(`      ${key}: ${JSON.stringify(value)}`);
      }
    }
  }
  return lines.join("\n");
}
function generateStepCode(step) {
  const configStr = step.config ? JSON.stringify(step.config, null, 2).split("\n").map((line, i) => i === 0 ? line : "    " + line).join("\n") : "{}";
  return `# Step: ${step.id} (${step.type})
config = ${configStr}
result_${step.id} = runner.run_step('${step.id}', '${step.type}', config)
print(f"Step ${step.id} completed")`;
}
function markdownCell2(content) {
  return {
    cell_type: "markdown",
    metadata: {},
    source: content.split("\n").map(
      (line, i, arr) => i < arr.length - 1 ? line + "\n" : line
    )
  };
}
function codeCell2(code) {
  return {
    cell_type: "code",
    metadata: {},
    source: code.split("\n").map(
      (line, i, arr) => i < arr.length - 1 ? line + "\n" : line
    ),
    execution_count: null,
    outputs: []
  };
}

// src/actions/workflow.ts
import * as fs3 from "fs/promises";
import * as path3 from "path";
async function listWorkflows(directory = process.cwd()) {
  const workflows = [];
  const workflowDir = path3.join(directory, "workflows");
  try {
    const files = await fs3.readdir(workflowDir);
    if (!files || !Array.isArray(files)) {
      return workflows;
    }
    for (const file of files) {
      if (file.endsWith(".json") || file.endsWith(".yaml") || file.endsWith(".yml")) {
        const filePath = path3.join(workflowDir, file);
        const info = await getWorkflowInfo(filePath);
        workflows.push(info);
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
  return workflows;
}
async function getWorkflowInfo(filePath) {
  try {
    const content = await fs3.readFile(filePath, "utf-8");
    const workflow = JSON.parse(content);
    const validation = validateWorkflowObject(workflow);
    return {
      name: workflow.name ?? path3.basename(filePath, path3.extname(filePath)),
      path: filePath,
      description: workflow.description,
      version: workflow.version,
      status: validation.isValid ? "valid" : "invalid",
      stepCount: workflow.steps?.length ?? 0
    };
  } catch {
    return {
      name: path3.basename(filePath, path3.extname(filePath)),
      path: filePath,
      status: "unknown",
      stepCount: 0
    };
  }
}
async function validateWorkflow(workflowOrPath) {
  try {
    let workflow;
    if (typeof workflowOrPath === "string") {
      const content = await fs3.readFile(workflowOrPath, "utf-8");
      workflow = JSON.parse(content);
    } else {
      workflow = workflowOrPath;
    }
    const result = validateWorkflowObject(workflow);
    return {
      valid: result.isValid,
      errors: result.errors,
      warnings: result.warnings
    };
  } catch (error) {
    return {
      valid: false,
      errors: [
        {
          path: "",
          message: `Failed to parse workflow: ${error.message}`,
          code: "PARSE_ERROR"
        }
      ],
      warnings: []
    };
  }
}
function validateWorkflowObject(workflow) {
  const errors = [];
  const warnings = [];
  if (!workflow.name || typeof workflow.name !== "string") {
    errors.push({
      path: "name",
      message: "Workflow name is required and must be a string",
      code: "REQUIRED_FIELD"
    });
  }
  if (!workflow.steps || !Array.isArray(workflow.steps)) {
    errors.push({
      path: "steps",
      message: "Workflow steps are required and must be an array",
      code: "REQUIRED_FIELD"
    });
  } else if (workflow.steps.length === 0) {
    warnings.push({
      path: "steps",
      message: "Workflow has no steps defined",
      code: "EMPTY_STEPS"
    });
  } else {
    const stepIds = /* @__PURE__ */ new Set();
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      const stepPath = `steps[${i}]`;
      if (!step.id || typeof step.id !== "string") {
        errors.push({
          path: `${stepPath}.id`,
          message: "Step ID is required and must be a string",
          code: "REQUIRED_FIELD"
        });
      } else {
        if (stepIds.has(step.id)) {
          errors.push({
            path: `${stepPath}.id`,
            message: `Duplicate step ID: ${step.id}`,
            code: "DUPLICATE_ID"
          });
        }
        stepIds.add(step.id);
      }
      if (!step.type || typeof step.type !== "string") {
        errors.push({
          path: `${stepPath}.type`,
          message: "Step type is required and must be a string",
          code: "REQUIRED_FIELD"
        });
      }
      if (step.depends) {
        if (!Array.isArray(step.depends)) {
          errors.push({
            path: `${stepPath}.depends`,
            message: "Step depends must be an array",
            code: "INVALID_TYPE"
          });
        } else {
          for (const dep of step.depends) {
            if (typeof dep !== "string") {
              errors.push({
                path: `${stepPath}.depends`,
                message: "Dependency must be a string",
                code: "INVALID_TYPE"
              });
            }
          }
        }
      }
    }
    if (workflow.steps.length > 0) {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        if (step.depends && Array.isArray(step.depends)) {
          for (const dep of step.depends) {
            if (!stepIds.has(dep)) {
              errors.push({
                path: `steps[${i}].depends`,
                message: `Unknown dependency: ${dep}`,
                code: "UNKNOWN_DEPENDENCY"
              });
            }
          }
        }
      }
    }
  }
  if (workflow.version && !/^\d+\.\d+\.\d+/.test(workflow.version)) {
    warnings.push({
      path: "version",
      message: "Version should follow semantic versioning (e.g., 1.0.0)",
      code: "VERSION_FORMAT"
    });
  }
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// src/actions/ask.ts
import {
  NLIService,
  detectLanguage,
  extractIntent,
  InputPattern
} from "@labflow/core";
var nliService = null;
function getNLIService() {
  if (!nliService) {
    nliService = new NLIService();
  }
  return nliService;
}
var WORKFLOW_DESCRIPTIONS = {
  "drug-discovery": {
    "admet-prediction": {
      name: "ADMET Prediction",
      description: "Predict absorption, distribution, metabolism, excretion, and toxicity",
      descriptionJa: "ADMET\uFF08\u5438\u53CE\u3001\u5206\u5E03\u3001\u4EE3\u8B1D\u3001\u6392\u6CC4\u3001\u6BD2\u6027\uFF09\u3092\u4E88\u6E2C"
    },
    "binding-prediction": {
      name: "Binding Affinity Prediction",
      description: "Predict protein-ligand binding affinity",
      descriptionJa: "\u30BF\u30F3\u30D1\u30AF\u8CEA-\u30EA\u30AC\u30F3\u30C9\u7D50\u5408\u89AA\u548C\u6027\u3092\u4E88\u6E2C"
    },
    "molecule-generation": {
      name: "Molecule Generation",
      description: "Generate novel molecules with desired properties",
      descriptionJa: "\u76EE\u7684\u306E\u7279\u6027\u3092\u6301\u3064\u65B0\u898F\u5206\u5B50\u3092\u751F\u6210"
    },
    "lead-optimization": {
      name: "Lead Optimization",
      description: "Optimize lead compounds for better properties",
      descriptionJa: "\u30EA\u30FC\u30C9\u5316\u5408\u7269\u306E\u7279\u6027\u3092\u6700\u9069\u5316"
    }
  },
  materials: {
    "material-generation": {
      name: "Material Generation",
      description: "Generate novel materials with MatterGen",
      descriptionJa: "MatterGen\u3067\u65B0\u898F\u6750\u6599\u3092\u751F\u6210"
    },
    "property-prediction": {
      name: "Property Prediction",
      description: "Predict material properties",
      descriptionJa: "\u6750\u6599\u7279\u6027\u3092\u4E88\u6E2C"
    },
    "stability-prediction": {
      name: "Stability Prediction",
      description: "Predict material stability with MatterSim",
      descriptionJa: "MatterSim\u3067\u6750\u6599\u306E\u5B89\u5B9A\u6027\u3092\u4E88\u6E2C"
    }
  },
  climate: {
    "weather-prediction": {
      name: "Weather Prediction",
      description: "Weather forecasting with Aurora",
      descriptionJa: "Aurora\u306B\u3088\u308B\u5929\u6C17\u4E88\u5831"
    },
    "climate-analysis": {
      name: "Climate Analysis",
      description: "Analyze climate data and trends",
      descriptionJa: "\u6C17\u5019\u30C7\u30FC\u30BF\u3068\u30C8\u30EC\u30F3\u30C9\u3092\u5206\u6790"
    }
  },
  genomics: {
    "protein-structure": {
      name: "Protein Structure Prediction",
      description: "Predict protein 3D structure",
      descriptionJa: "\u30BF\u30F3\u30D1\u30AF\u8CEA\u306E3D\u69CB\u9020\u3092\u4E88\u6E2C"
    },
    "sequence-analysis": {
      name: "Sequence Analysis",
      description: "Analyze DNA/RNA/protein sequences",
      descriptionJa: "DNA/RNA/\u30BF\u30F3\u30D1\u30AF\u8CEA\u914D\u5217\u3092\u5206\u6790"
    }
  }
};
async function processQuery(query, options = {}) {
  const service = getNLIService();
  const intent = await service.analyzeIntent(query, {
    language: options.language
  });
  const extractedInfo = await service.extractInfo(query);
  const suggestions = generateSuggestions(intent, extractedInfo, query);
  return {
    query,
    language: intent.language,
    intent,
    extractedInfo,
    suggestions
  };
}
function generateSuggestions(intent, info, _query) {
  const suggestions = [];
  const isJapanese = intent.language === "ja";
  for (const workflowId of intent.recommendedWorkflows) {
    const domain = info.domain ?? detectDomainFromWorkflow(workflowId);
    const domainWorkflows = WORKFLOW_DESCRIPTIONS[domain];
    if (domainWorkflows && domainWorkflows[workflowId]) {
      const wf = domainWorkflows[workflowId];
      suggestions.push({
        id: workflowId,
        name: wf.name,
        description: isJapanese ? wf.descriptionJa : wf.description,
        confidence: intent.confidence,
        command: `labflow workflow run ${workflowId}`
      });
    } else {
      suggestions.push({
        id: workflowId,
        name: formatWorkflowName(workflowId),
        description: isJapanese ? `${workflowId} \u30EF\u30FC\u30AF\u30D5\u30ED\u30FC\u3092\u5B9F\u884C` : `Run ${workflowId} workflow`,
        confidence: intent.confidence * 0.8,
        command: `labflow workflow run ${workflowId}`
      });
    }
  }
  suggestions.sort((a, b) => b.confidence - a.confidence);
  return suggestions;
}
function detectDomainFromWorkflow(workflowId) {
  const domainKeywords = {
    "drug-discovery": ["admet", "binding", "molecule", "lead", "docking", "activity"],
    materials: ["material", "crystal", "bandgap", "stability", "matter"],
    climate: ["weather", "climate", "aurora", "forecast"],
    genomics: ["protein", "sequence", "gene", "structure", "alignment"]
  };
  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    if (keywords.some((kw) => workflowId.toLowerCase().includes(kw))) {
      return domain;
    }
  }
  return "drug-discovery";
}
function formatWorkflowName(workflowId) {
  return workflowId.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}
function formatAskResult(result, verbose = false) {
  const lines = [];
  const isJapanese = result.language === "ja";
  if (isJapanese) {
    lines.push("\u{1F4CA} \u5206\u6790\u7D50\u679C");
    lines.push("");
  } else {
    lines.push("\u{1F4CA} Analysis Result");
    lines.push("");
  }
  const patternLabels = {
    [InputPattern.Predict]: { en: "Prediction", ja: "\u4E88\u6E2C" },
    [InputPattern.Generate]: { en: "Generation", ja: "\u751F\u6210" },
    [InputPattern.Optimize]: { en: "Optimization", ja: "\u6700\u9069\u5316" },
    [InputPattern.Analyze]: { en: "Analysis", ja: "\u5206\u6790" },
    [InputPattern.Compare]: { en: "Comparison", ja: "\u6BD4\u8F03" },
    [InputPattern.Unknown]: { en: "Unknown", ja: "\u4E0D\u660E" }
  };
  const patternLabel = patternLabels[result.intent.pattern];
  lines.push(
    isJapanese ? `\u{1F3AF} \u30A4\u30F3\u30C6\u30F3\u30C8: ${patternLabel.ja}` : `\u{1F3AF} Intent: ${patternLabel.en}`
  );
  if (result.extractedInfo.domain) {
    lines.push(
      isJapanese ? `\u{1F52C} \u30C9\u30E1\u30A4\u30F3: ${result.extractedInfo.domain}` : `\u{1F52C} Domain: ${result.extractedInfo.domain}`
    );
  }
  const confidencePercent = Math.round(result.intent.confidence * 100);
  lines.push(
    isJapanese ? `\u{1F4C8} \u4FE1\u983C\u5EA6: ${confidencePercent}%` : `\u{1F4C8} Confidence: ${confidencePercent}%`
  );
  lines.push("");
  if (result.suggestions.length > 0) {
    lines.push(
      isJapanese ? "\u{1F4A1} \u63A8\u5968\u30EF\u30FC\u30AF\u30D5\u30ED\u30FC:" : "\u{1F4A1} Recommended Workflows:"
    );
    lines.push("");
    for (const [index, suggestion] of result.suggestions.entries()) {
      lines.push(`  ${index + 1}. ${suggestion.name}`);
      lines.push(`     ${suggestion.description}`);
      lines.push(`     $ ${suggestion.command}`);
      lines.push("");
    }
  }
  if (result.intent.needsClarification) {
    lines.push("");
    lines.push(isJapanese ? "\u2753 \u78BA\u8A8D:" : "\u2753 Clarification needed:");
    lines.push(`   ${result.intent.clarificationQuestion}`);
    if (result.intent.clarificationOptions) {
      lines.push("");
      lines.push(isJapanese ? "   \u9078\u629E\u80A2:" : "   Options:");
      result.intent.clarificationOptions.forEach((opt, i) => {
        lines.push(`   ${i + 1}. ${opt}`);
      });
    }
  }
  if (verbose) {
    lines.push("");
    lines.push("\u2500".repeat(40));
    lines.push(isJapanese ? "\u8A73\u7D30\u60C5\u5831:" : "Detailed Info:");
    lines.push(JSON.stringify(result.extractedInfo, null, 2));
  }
  return lines.join("\n");
}
function getClarificationOptions(result) {
  return result.intent.clarificationOptions ?? [];
}

// src/utils/format.ts
function formatAsTable(data, columnsOrOptions) {
  if (data.length === 0) {
    return "No data to display";
  }
  let columns;
  let options = {};
  if (Array.isArray(columnsOrOptions)) {
    columns = columnsOrOptions;
  } else {
    options = columnsOrOptions ?? {};
    columns = Object.keys(data[0]).map((key) => ({
      key,
      header: key.charAt(0).toUpperCase() + key.slice(1),
      width: Math.max(
        key.length,
        ...data.map((row) => {
          const val = String(row[key] ?? "");
          const maxLen = options.maxContentLength ?? 50;
          return val.length > maxLen ? maxLen : val.length;
        })
      )
    }));
  }
  const widths = columns.map((col) => {
    const headerWidth = col.header.length;
    const maxDataWidth = Math.max(
      ...data.map((row) => {
        const val = String(row[col.key] ?? "");
        const maxLen = options.maxContentLength ?? val.length;
        return Math.min(val.length, maxLen);
      })
    );
    return col.width ?? Math.max(headerWidth, maxDataWidth);
  });
  const header = columns.map((col, i) => padString(col.header, widths[i], col.align ?? "left")).join(" \u2502 ");
  const separator = widths.map((w) => "\u2500".repeat(w)).join("\u2500\u253C\u2500");
  const rows = data.map(
    (row) => columns.map((col, i) => {
      let val = String(row[col.key] ?? "");
      if (options.maxContentLength && val.length > options.maxContentLength) {
        val = val.slice(0, options.maxContentLength - 3) + "...";
      }
      return padString(val, widths[i], col.align ?? "left");
    }).join(" \u2502 ")
  );
  return [header, separator, ...rows].join("\n");
}
function formatAsJson(data, indent = 2) {
  return JSON.stringify(data, null, indent);
}
function padString(str, width, align) {
  const truncated = str.length > width ? str.slice(0, width - 1) + "\u2026" : str;
  const padding = width - truncated.length;
  switch (align) {
    case "right":
      return " ".repeat(padding) + truncated;
    case "center":
      const left = Math.floor(padding / 2);
      const right = padding - left;
      return " ".repeat(left) + truncated + " ".repeat(right);
    case "left":
    default:
      return truncated + " ".repeat(padding);
  }
}

// src/utils/prompt.ts
import * as readline from "readline";
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}
async function select(options) {
  const rl = createReadlineInterface();
  console.log(options.message);
  options.choices.forEach((choice, index) => {
    const isDefault = choice.value === options.defaultValue;
    const marker = isDefault ? "\u25CF" : "\u25CB";
    console.log(`  ${marker} ${index + 1}. ${choice.label}`);
  });
  return new Promise((resolve2) => {
    rl.question("\u9078\u629E (\u756A\u53F7\u3092\u5165\u529B): ", (answer) => {
      rl.close();
      const index = parseInt(answer.trim(), 10) - 1;
      if (index >= 0 && index < options.choices.length) {
        resolve2(options.choices[index].value);
      } else if (!answer.trim() && options.defaultValue) {
        resolve2(options.defaultValue);
      } else {
        console.log("\u274C \u7121\u52B9\u306A\u9078\u629E\u3067\u3059");
        resolve2(select(options));
      }
    });
  });
}
async function confirm(options) {
  const rl = createReadlineInterface();
  const defaultText = options.defaultValue !== void 0 ? options.defaultValue ? " [Y/n]" : " [y/N]" : " [y/n]";
  return new Promise((resolve2) => {
    rl.question(`${options.message}${defaultText}: `, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      if (normalized === "y" || normalized === "yes") {
        resolve2(true);
      } else if (normalized === "n" || normalized === "no") {
        resolve2(false);
      } else if (!answer.trim() && options.defaultValue !== void 0) {
        resolve2(options.defaultValue);
      } else {
        resolve2(confirm(options));
      }
    });
  });
}
var styles = {
  bold: (text) => `\x1B[1m${text}\x1B[0m`,
  dim: (text) => `\x1B[2m${text}\x1B[0m`,
  green: (text) => `\x1B[32m${text}\x1B[0m`,
  red: (text) => `\x1B[31m${text}\x1B[0m`,
  yellow: (text) => `\x1B[33m${text}\x1B[0m`,
  blue: (text) => `\x1B[34m${text}\x1B[0m`,
  cyan: (text) => `\x1B[36m${text}\x1B[0m`
};

// src/commands/index.ts
function createAskCommand(program2) {
  program2.command("ask").description("Ask LabFlow in natural language (Japanese/English)").argument("<query...>", "Your question or request").option("-l, --language <lang>", "Force language (ja/en)").option("-v, --verbose", "Show detailed analysis").option("-i, --interactive", "Interactive mode with follow-up questions").action(async (queryParts, options) => {
    try {
      const query = queryParts.join(" ");
      console.log("");
      console.log(styles.cyan("\u{1F50D} Analyzing your request..."));
      console.log("");
      const result = await processQuery(query, {
        language: options.language,
        verbose: options.verbose
      });
      console.log(formatAskResult(result, options.verbose));
      if (options.interactive && result.suggestions.length > 0) {
        console.log("");
        const shouldRun = await confirm({
          message: result.language === "ja" ? "\u63A8\u5968\u30EF\u30FC\u30AF\u30D5\u30ED\u30FC\u3092\u5B9F\u884C\u3057\u307E\u3059\u304B?" : "Would you like to run a recommended workflow?",
          defaultValue: false
        });
        if (shouldRun) {
          const choices = result.suggestions.map((s, i) => ({
            value: s.command,
            label: `${s.name} - ${s.description}`
          }));
          const selectedCommand = await select({
            message: result.language === "ja" ? "\u30EF\u30FC\u30AF\u30D5\u30ED\u30FC\u3092\u9078\u629E:" : "Select workflow:",
            choices
          });
          console.log("");
          console.log(styles.green(`$ ${selectedCommand}`));
          console.log("");
        }
      }
      if (result.intent.needsClarification && options.interactive) {
        const clarificationOptions = getClarificationOptions(result);
        if (clarificationOptions.length > 0) {
          const choices = clarificationOptions.map((opt) => ({
            value: opt,
            label: opt
          }));
          const selectedOption = await select({
            message: result.intent.clarificationQuestion ?? "Please select:",
            choices
          });
          const clarifiedQuery = `${query} ${selectedOption}`;
          const clarifiedResult = await processQuery(clarifiedQuery, options);
          console.log("");
          console.log(formatAskResult(clarifiedResult, options.verbose));
        }
      }
    } catch (error) {
      console.error("Error processing query:", error);
      process.exit(1);
    }
  });
}
function createInitCommand(program2) {
  program2.command("init").description("Initialize a new LabFlow project").option("-n, --name <name>", "Project name").option(
    "-d, --domain <domain>",
    "Research domain (drug-discovery, materials, climate, genomics)"
  ).option("-t, --template <template>", "Workflow template to use").option("--notebook", "Generate template Jupyter notebook").action(async (options) => {
    try {
      await initProject({
        name: options.name ?? "labflow-project",
        domain: options.domain ?? "drug-discovery",
        notebook: options.notebook ?? false,
        template: options.template
      });
      console.log("\u2713 Project initialized successfully");
    } catch (error) {
      console.error("Error initializing project:", error);
      process.exit(1);
    }
  });
}
function createWorkflowCommand(program2) {
  const workflow = program2.command("workflow").description("Workflow management commands");
  workflow.command("list").description("List available workflows").action(async () => {
    try {
      const workflows = await listWorkflows();
      console.log("Available workflows:");
      workflows.forEach((wf) => {
        console.log(`  - ${wf.name}: ${wf.description}`);
      });
    } catch (error) {
      console.error("Error listing workflows:", error);
      process.exit(1);
    }
  });
  workflow.command("run <workflow>").description("Run a workflow").option("-c, --config <config>", "Configuration file").action(async (workflowId, options) => {
    console.log(`Running workflow ${workflowId}...`, options);
  });
  workflow.command("validate <file>").description("Validate a workflow file").action(async (file) => {
    try {
      const fs4 = await import("fs/promises");
      const content = await fs4.readFile(file, "utf-8");
      const workflowDef = JSON.parse(content);
      const result = await validateWorkflow(workflowDef);
      if (result.valid) {
        console.log("\u2713 Workflow is valid");
      } else {
        console.log("\u2717 Workflow validation failed:");
        result.errors.forEach((err) => console.log(`  - ${err}`));
        process.exit(1);
      }
    } catch (error) {
      console.error("Error validating workflow:", error);
      process.exit(1);
    }
  });
}
function createSearchCommand(program2) {
  const search = program2.command("search").description("Search documents and literature");
  search.command("docs").description("Search documents using semantic search").argument("<query>", "Search query").option("-l, --limit <limit>", "Maximum number of results", "10").option("-d, --domain <domain>", "Filter by domain").option("-f, --format <format>", "Output format (json, table)", "table").action(async (query, options) => {
    try {
      const results = await searchDocuments(query, {
        limit: Number(options.limit) || 10,
        domain: options.domain
      });
      if (options.format === "json") {
        console.log(formatAsJson(results));
      } else {
        console.log(formatAsTable(results));
      }
    } catch (error) {
      console.error("Error searching:", error);
      process.exit(1);
    }
  });
  search.command("literature").alias("lit").description("Search scientific literature with GraphRAG").argument("<query>", "Search query").option("-l, --limit <limit>", "Maximum number of results", "10").option("-d, --domain <domain>", "Filter by domain (drug-discovery, materials-science, climate, genomics, chemistry, physics, biology)").option("--year-start <year>", "Filter by start year").option("--year-end <year>", "Filter by end year").option("--min-citations <count>", "Minimum citation count").option("-f, --format <format>", "Output format (json, table)", "table").action(async (query, options) => {
    try {
      console.log("");
      console.log(styles.cyan("\u{1F52C} Searching scientific literature..."));
      console.log("");
      const searchOptions = {
        limit: Number(options.limit) || 10,
        domain: options.domain,
        yearRange: options.yearStart || options.yearEnd ? {
          start: options.yearStart ? Number(options.yearStart) : void 0,
          end: options.yearEnd ? Number(options.yearEnd) : void 0
        } : void 0,
        minCitations: options.minCitations ? Number(options.minCitations) : void 0
      };
      const results = await searchLiterature(query, searchOptions);
      if (results.length === 0) {
        console.log(styles.yellow("No papers found. Try adjusting your search criteria."));
        console.log("");
        console.log("Tips:");
        console.log("  - Use broader search terms");
        console.log("  - Remove domain filters");
        console.log("  - Expand year range");
        return;
      }
      if (options.format === "json") {
        console.log(formatAsJson(results));
      } else {
        formatLiteratureResults(results);
      }
    } catch (error) {
      console.error("Error searching literature:", error);
      process.exit(1);
    }
  });
  search.command("domain <domain>").description("Search within a specific research domain").argument("<query>", "Search query").option("-l, --limit <limit>", "Maximum number of results", "10").option("-f, --format <format>", "Output format (json, table)", "table").action(async (domain, query, options) => {
    try {
      const validDomains = ["drug-discovery", "materials-science", "climate", "genomics", "chemistry", "physics", "biology"];
      if (!validDomains.includes(domain)) {
        console.error(`Invalid domain. Choose from: ${validDomains.join(", ")}`);
        process.exit(1);
      }
      console.log("");
      console.log(styles.cyan(`\u{1F52C} Searching ${domain} literature...`));
      console.log("");
      const results = await searchLiteratureByDomain(
        domain,
        query,
        Number(options.limit) || 10
      );
      if (results.length === 0) {
        console.log(styles.yellow(`No papers found in ${domain}.`));
        return;
      }
      if (options.format === "json") {
        console.log(formatAsJson(results));
      } else {
        formatLiteratureResults(results);
      }
    } catch (error) {
      console.error("Error searching domain:", error);
      process.exit(1);
    }
  });
  search.command("stats").description("Show literature database statistics").action(() => {
    try {
      const stats = getLiteratureStats();
      console.log("");
      console.log(styles.cyan("\u{1F4CA} Literature Database Statistics"));
      console.log("");
      console.log(`Total Papers: ${stats.totalPapers}`);
      console.log(`Total Entities: ${stats.totalEntities}`);
      console.log("");
      console.log("Papers by Domain:");
      for (const [domain, count] of Object.entries(stats.papersByDomain)) {
        if (count > 0) {
          console.log(`  ${domain}: ${count}`);
        }
      }
      console.log("");
    } catch (error) {
      console.error("Error getting statistics:", error);
      process.exit(1);
    }
  });
}
function formatLiteratureResults(results) {
  console.log(`Found ${results.length} papers:
`);
  for (const result of results) {
    console.log(styles.green(`\u{1F4C4} ${result.title}`));
    console.log(`   Authors: ${result.authors.join(", ")}`);
    if (result.year) {
      console.log(`   Year: ${result.year}`);
    }
    if (result.domain) {
      console.log(`   Domain: ${result.domain}`);
    }
    if (result.citations !== void 0) {
      console.log(`   Citations: ${result.citations}`);
    }
    console.log(`   Score: ${(result.score * 100).toFixed(1)}%`);
    if (result.highlights.length > 0) {
      console.log("   Highlights:");
      for (const highlight of result.highlights.slice(0, 2)) {
        console.log(`     "${highlight.substring(0, 100)}..."`);
      }
    }
    console.log("");
  }
}
function createExportCommand(program2) {
  program2.command("export").description("Export workflow to different formats").argument("<workflow>", "Workflow file to export").option(
    "-f, --format <format>",
    "Output format (notebook, json, yaml)",
    "notebook"
  ).option("-o, --output <output>", "Output file path").action(async (workflow, options) => {
    try {
      await exportWorkflow(workflow, {
        format: options.format ?? "notebook",
        output: options.output
      });
      console.log("\u2713 Export completed successfully");
    } catch (error) {
      console.error("Error exporting workflow:", error);
      process.exit(1);
    }
  });
}

// src/index.ts
var program = new Command2();
program.name("labflow").description("LabFlow CLI - AI for Science Starter Kit").version("0.0.1");
createAskCommand(program);
createInitCommand(program);
createWorkflowCommand(program);
createSearchCommand(program);
createExportCommand(program);
program.parse();
//# sourceMappingURL=index.js.map
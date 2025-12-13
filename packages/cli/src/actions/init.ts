/**
 * Init Action
 *
 * WKFL-NBIO-002: labflow init --notebook
 * WKFL-NBIO-003: Template notebook sections
 * WKFL-NBIO-010: Domain-specific templates
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export interface InitProjectOptions {
  name: string;
  domain: string;
  notebook: boolean;
  template?: string;
}

/**
 * Initialize a new LabFlow project
 */
export async function initProject(options: InitProjectOptions): Promise<void> {
  const projectDir = path.resolve(process.cwd(), options.name);

  // Create project directory
  await fs.mkdir(projectDir, { recursive: true });
  await fs.mkdir(path.join(projectDir, 'data'), { recursive: true });
  await fs.mkdir(path.join(projectDir, 'workflows'), { recursive: true });
  await fs.mkdir(path.join(projectDir, 'results'), { recursive: true });

  // Create config file
  const config = {
    name: options.name,
    domain: options.domain,
    version: '1.0.0',
    created: new Date().toISOString(),
  };

  await fs.writeFile(
    path.join(projectDir, 'labflow.config.json'),
    JSON.stringify(config, null, 2)
  );

  // Create template notebook if requested
  if (options.notebook) {
    const notebook = generateNotebook(options.domain);
    const notebookName = `${options.name}-${options.domain}.ipynb`;
    await fs.writeFile(path.join(projectDir, notebookName), notebook);
  }

  // Create README
  const readme = generateReadme(options.name, options.domain);
  await fs.writeFile(path.join(projectDir, 'README.md'), readme);
}

/**
 * Generate a Jupyter notebook for the specified domain (WKFL-NBIO-003)
 */
export function generateNotebook(domain: string): string {
  const templates: Record<string, NotebookTemplate> = {
    'drug-discovery': getDrugDiscoveryTemplate(),
    materials: getMaterialsTemplate(),
    climate: getClimateTemplate(),
    genomics: getGenomicsTemplate(),
  };

  const template = templates[domain] ?? templates['drug-discovery'];

  const notebook: JupyterNotebook = {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: {
        display_name: 'Python 3',
        language: 'python',
        name: 'python3',
      },
      language_info: {
        name: 'python',
        version: '3.10.0',
      },
    },
    cells: [
      // 概要 (Overview)
      markdownCell(`# ${template.title}\n\n${template.description}`),
      markdownCell('## 概要\n\nこのノートブックでは、LabFlowを使用して' + template.overview),

      // 環境セットアップ (Setup)
      markdownCell('## 環境セットアップ'),
      codeCell(template.setupCode),

      // データ読み込み (Data Loading)
      markdownCell('## データ読み込み'),
      codeCell(template.dataLoadCode),

      // 前処理 (Preprocessing)
      markdownCell('## データ前処理'),
      codeCell(template.preprocessCode),

      // モデル実行 (Model Execution)
      markdownCell('## モデル実行'),
      codeCell(template.modelCode),

      // 結果可視化 (Visualization)
      markdownCell('## 結果可視化'),
      codeCell(template.vizCode),

      // エクスポート (Export)
      markdownCell('## 結果エクスポート'),
      codeCell(template.exportCode),
    ],
  };

  return JSON.stringify(notebook, null, 2);
}

interface NotebookTemplate {
  title: string;
  description: string;
  overview: string;
  setupCode: string;
  dataLoadCode: string;
  preprocessCode: string;
  modelCode: string;
  vizCode: string;
  exportCode: string;
}

interface JupyterNotebook {
  nbformat: number;
  nbformat_minor: number;
  metadata: {
    kernelspec: {
      display_name: string;
      language: string;
      name: string;
    };
    language_info: {
      name: string;
      version: string;
    };
  };
  cells: NotebookCell[];
}

interface NotebookCell {
  cell_type: 'markdown' | 'code';
  metadata: Record<string, unknown>;
  source: string[];
  execution_count?: number | null;
  outputs?: unknown[];
}

function markdownCell(content: string): NotebookCell {
  return {
    cell_type: 'markdown',
    metadata: {},
    source: content.split('\n').map((line, i, arr) =>
      i < arr.length - 1 ? line + '\n' : line
    ),
  };
}

function codeCell(code: string): NotebookCell {
  return {
    cell_type: 'code',
    metadata: {},
    source: code.split('\n').map((line, i, arr) =>
      i < arr.length - 1 ? line + '\n' : line
    ),
    execution_count: null,
    outputs: [],
  };
}

function getDrugDiscoveryTemplate(): NotebookTemplate {
  return {
    title: 'Drug Discovery Workflow',
    description: 'LabFlow創薬ワークフローテンプレート',
    overview: '薬物候補のスクリーニングと予測を行います。',
    setupCode: `# LabFlow セットアップ
from labflow import LabFlow, WorkflowBuilder
from labflow.domains import DrugDiscovery

# 初期化
lf = LabFlow()
dd = DrugDiscovery()`,
    dataLoadCode: `# SMILES データの読み込み
import pandas as pd

# サンプルデータ
data = pd.read_csv('data/compounds.csv')
print(f"Loaded {len(data)} compounds")
data.head()`,
    preprocessCode: `# 分子記述子の計算
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
    modelCode: `# 活性予測モデルの実行
results = dd.predict_activity(
    smiles=data['smiles'].tolist(),
    target='binding_affinity'
)
print(f"Predictions completed: {len(results)} compounds")`,
    vizCode: `# 結果の可視化
import matplotlib.pyplot as plt

plt.figure(figsize=(10, 6))
plt.scatter(results['predicted'], results['confidence'])
plt.xlabel('Predicted Activity')
plt.ylabel('Confidence')
plt.title('Drug Discovery Results')
plt.show()`,
    exportCode: `# 結果のエクスポート
results.to_csv('results/predictions.csv', index=False)
print("Results exported to results/predictions.csv")`,
  };
}

function getMaterialsTemplate(): NotebookTemplate {
  return {
    title: 'Materials Science Workflow',
    description: 'LabFlow材料科学ワークフローテンプレート',
    overview: '新材料の特性予測と設計を行います。',
    setupCode: `# LabFlow セットアップ
from labflow import LabFlow, WorkflowBuilder
from labflow.domains import MaterialsScience

# 初期化
lf = LabFlow()
ms = MaterialsScience()`,
    dataLoadCode: `# 材料データの読み込み
import pandas as pd

# CIF構造ファイルまたは組成データ
data = pd.read_csv('data/materials.csv')
print(f"Loaded {len(data)} materials")
data.head()`,
    preprocessCode: `# 特徴量エンジニアリング
from pymatgen.core import Composition

def get_composition_features(formula):
    comp = Composition(formula)
    return {
        'num_elements': len(comp.elements),
        'avg_atomic_mass': comp.average_electroneg,
    }

data['features'] = data['formula'].apply(get_composition_features)`,
    modelCode: `# 特性予測モデルの実行
results = ms.predict_properties(
    compositions=data['formula'].tolist(),
    properties=['band_gap', 'formation_energy']
)
print(f"Predictions completed: {len(results)} materials")`,
    vizCode: `# 結果の可視化
import matplotlib.pyplot as plt

fig, axes = plt.subplots(1, 2, figsize=(12, 5))
axes[0].hist(results['band_gap'], bins=30)
axes[0].set_xlabel('Band Gap (eV)')
axes[1].hist(results['formation_energy'], bins=30)
axes[1].set_xlabel('Formation Energy (eV/atom)')
plt.tight_layout()
plt.show()`,
    exportCode: `# 結果のエクスポート
results.to_csv('results/material_predictions.csv', index=False)
print("Results exported to results/material_predictions.csv")`,
  };
}

function getClimateTemplate(): NotebookTemplate {
  return {
    title: 'Climate & Weather Workflow',
    description: 'LabFlow気候・気象ワークフローテンプレート',
    overview: '気象予測とデータ分析を行います。',
    setupCode: `# LabFlow セットアップ
from labflow import LabFlow, WorkflowBuilder
from labflow.domains import Climate

# 初期化
lf = LabFlow()
climate = Climate()`,
    dataLoadCode: `# 気象データの読み込み
import xarray as xr

# ERA5 再解析データ
data = xr.open_dataset('data/era5_sample.nc')
print(data)`,
    preprocessCode: `# データ前処理
# 時間範囲の選択
data_subset = data.sel(time=slice('2024-01-01', '2024-01-31'))

# 空間補間
data_interp = data_subset.interp(lat=np.arange(-90, 91, 1), lon=np.arange(0, 360, 1))`,
    modelCode: `# Aurora 気象予測モデルの実行
results = climate.predict_weather(
    initial_conditions=data_subset,
    forecast_hours=72,
    variables=['temperature', 'precipitation']
)
print(f"Forecast generated for {len(results.time)} time steps")`,
    vizCode: `# 結果の可視化
import matplotlib.pyplot as plt
import cartopy.crs as ccrs

fig, ax = plt.subplots(figsize=(12, 6), subplot_kw={'projection': ccrs.PlateCarree()})
results['temperature'].isel(time=0).plot(ax=ax, transform=ccrs.PlateCarree())
ax.coastlines()
plt.title('Temperature Forecast')
plt.show()`,
    exportCode: `# 結果のエクスポート
results.to_netcdf('results/forecast.nc')
print("Results exported to results/forecast.nc")`,
  };
}

function getGenomicsTemplate(): NotebookTemplate {
  return {
    title: 'Genomics Workflow',
    description: 'LabFlowゲノミクスワークフローテンプレート',
    overview: 'タンパク質構造予測と配列分析を行います。',
    setupCode: `# LabFlow セットアップ
from labflow import LabFlow, WorkflowBuilder
from labflow.domains import Genomics

# 初期化
lf = LabFlow()
genomics = Genomics()`,
    dataLoadCode: `# 配列データの読み込み
from Bio import SeqIO

# FASTAファイル
sequences = list(SeqIO.parse('data/sequences.fasta', 'fasta'))
print(f"Loaded {len(sequences)} sequences")
for seq in sequences[:3]:
    print(f"  {seq.id}: {len(seq.seq)} residues")`,
    preprocessCode: `# 配列の前処理
# 長さフィルタリング
filtered_seqs = [s for s in sequences if 50 <= len(s.seq) <= 1000]
print(f"Filtered to {len(filtered_seqs)} sequences")

# アミノ酸組成
from collections import Counter
aa_counts = Counter(str(filtered_seqs[0].seq))`,
    modelCode: `# BioEmu 構造予測モデルの実行
results = genomics.predict_structure(
    sequences=[str(s.seq) for s in filtered_seqs[:5]],
    num_conformations=10
)
print(f"Structure predictions completed: {len(results)} proteins")`,
    vizCode: `# 結果の可視化
import py3Dmol

# 構造表示
view = py3Dmol.view(width=600, height=400)
view.addModel(results[0]['pdb'], 'pdb')
view.setStyle({'cartoon': {'color': 'spectrum'}})
view.zoomTo()
view.show()`,
    exportCode: `# 結果のエクスポート
for i, result in enumerate(results):
    with open(f'results/structure_{i}.pdb', 'w') as f:
        f.write(result['pdb'])
print(f"Exported {len(results)} PDB files to results/")`,
  };
}

function generateReadme(name: string, domain: string): string {
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

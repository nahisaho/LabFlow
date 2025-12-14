/**
 * Model Catalog Adapter
 * 
 * Converts core package model data to web components format
 */

import type { ExtendedModelMetadata, ModelDomain as WebModelDomain, ParameterSpec } from './index';

/**
 * Core model metadata type (matching @labflow/core)
 */
export interface CoreModelMetadata {
  id: string;
  name: string;
  version: string;
  domain: string;
  taskTypes: string[];
  inputFormats: string[];
  outputFormats: string[];
  estimatedTime: string;
  license: string;
  description: string;
  descriptionJa: string;
  exampleCode: string;
  exampleExplanationJa: string;
}

/**
 * Domain mapping from core to web
 */
const domainMapping: Record<string, WebModelDomain> = {
  'materials': 'materials-science',
  'drug-discovery': 'drug-discovery',
  'climate': 'climate',
  'genomics': 'genomics',
};

/**
 * Default parameters for each model
 */
const defaultParameters: Record<string, ParameterSpec[]> = {
  mattergen: [
    {
      name: 'chemical_system',
      type: 'string',
      required: true,
      description: 'Chemical system to generate (e.g., "Li-Fe-O")',
      descriptionJa: '生成する化学系（例: "Li-Fe-O"）',
    },
    {
      name: 'num_samples',
      type: 'number',
      required: true,
      description: 'Number of structures to generate',
      descriptionJa: '生成する構造の数',
      default: 10,
      min: 1,
      max: 1000,
    },
    {
      name: 'bandgap',
      type: 'string',
      required: false,
      description: 'Band gap condition (e.g., ">2.0 eV")',
      descriptionJa: 'バンドギャップ条件（例: ">2.0 eV"）',
    },
  ],
  mattersim: [
    {
      name: 'structure_file',
      type: 'string',
      required: true,
      description: 'Path to input CIF file',
      descriptionJa: '入力CIFファイルのパス',
    },
    {
      name: 'predict_properties',
      type: 'select',
      required: true,
      description: 'Properties to predict',
      descriptionJa: '予測するプロパティ',
      options: ['formation_energy', 'bulk_modulus', 'band_gap', 'all'],
      default: 'all',
    },
  ],
  aurora: [
    {
      name: 'latitude',
      type: 'number',
      required: true,
      description: 'Latitude of location',
      descriptionJa: '予測地点の緯度',
      min: -90,
      max: 90,
    },
    {
      name: 'longitude',
      type: 'number',
      required: true,
      description: 'Longitude of location',
      descriptionJa: '予測地点の経度',
      min: -180,
      max: 180,
    },
    {
      name: 'forecast_hours',
      type: 'number',
      required: true,
      description: 'Hours to forecast',
      descriptionJa: '予測時間（時間）',
      default: 72,
      min: 1,
      max: 240,
    },
    {
      name: 'variables',
      type: 'select',
      required: true,
      description: 'Variables to predict',
      descriptionJa: '予測する変数',
      options: ['temperature', 'precipitation', 'wind_speed', 'pressure', 'all'],
      default: 'all',
    },
  ],
  bioemu: [
    {
      name: 'sequence',
      type: 'string',
      required: true,
      description: 'Amino acid sequence',
      descriptionJa: 'アミノ酸配列',
    },
    {
      name: 'num_ensemble',
      type: 'number',
      required: false,
      description: 'Number of conformations to generate',
      descriptionJa: '生成するコンフォメーション数',
      default: 5,
      min: 1,
      max: 100,
    },
  ],
  tamgen: [
    {
      name: 'target_pdb',
      type: 'string',
      required: true,
      description: 'Path to target PDB file',
      descriptionJa: 'ターゲットPDBファイルのパス',
    },
    {
      name: 'num_samples',
      type: 'number',
      required: true,
      description: 'Number of molecules to generate',
      descriptionJa: '生成する分子の数',
      default: 100,
      min: 1,
      max: 1000,
    },
    {
      name: 'mw_min',
      type: 'number',
      required: false,
      description: 'Minimum molecular weight',
      descriptionJa: '最小分子量',
      default: 200,
    },
    {
      name: 'mw_max',
      type: 'number',
      required: false,
      description: 'Maximum molecular weight',
      descriptionJa: '最大分子量',
      default: 500,
    },
    {
      name: 'logp_min',
      type: 'number',
      required: false,
      description: 'Minimum logP',
      descriptionJa: '最小logP',
      default: -1,
    },
    {
      name: 'logp_max',
      type: 'number',
      required: false,
      description: 'Maximum logP',
      descriptionJa: '最大logP',
      default: 5,
    },
  ],
};

/**
 * Model tags
 */
const modelTags: Record<string, string[]> = {
  mattergen: ['結晶構造', '生成AI', '材料設計'],
  mattersim: ['物性予測', 'シミュレーション', '深層学習'],
  aurora: ['気象予測', '基盤モデル', '時系列'],
  bioemu: ['タンパク質', '構造予測', 'アンサンブル'],
  tamgen: ['創薬', '分子生成', 'ターゲット認識'],
};

/**
 * Convert core model metadata to web format
 */
export function coreToWebModel(core: CoreModelMetadata): ExtendedModelMetadata {
  return {
    id: core.id,
    name: core.name,
    description: core.description,
    descriptionJa: core.descriptionJa,
    domain: domainMapping[core.domain] || 'materials-science',
    version: core.version,
    tags: modelTags[core.id] || [],
    parameters: defaultParameters[core.id] || [],
    estimatedTime: core.estimatedTime,
    license: core.license,
    inputFormats: core.inputFormats,
    outputFormats: core.outputFormats,
    exampleCode: core.exampleCode,
    exampleExplanationJa: core.exampleExplanationJa,
    taskTypes: core.taskTypes,
  };
}

/**
 * Convert multiple core models to web format
 */
export function coreToWebModels(coreModels: CoreModelMetadata[]): ExtendedModelMetadata[] {
  return coreModels.map(coreToWebModel);
}

/**
 * Get standard model data for web components
 * This provides static data when core package is not available
 */
export function getStandardWebModels(): ExtendedModelMetadata[] {
  return [
    {
      id: 'mattergen',
      name: 'MatterGen',
      description: 'Generative model for crystal structures with property conditioning',
      descriptionJa: '特性条件付き結晶構造生成モデル。化学組成、空間群、物性値を指定して新規結晶構造を生成します。',
      domain: 'materials-science',
      version: '1.0.0',
      tags: ['結晶構造', '生成AI', '材料設計'],
      parameters: defaultParameters.mattergen,
      estimatedTime: '5〜30分',
      license: 'MIT',
      inputFormats: ['JSON', 'Text'],
      outputFormats: ['CIF', 'JSON'],
      taskTypes: ['generation'],
      exampleCode: `from labflow import MatterGen

# モデルの初期化
model = MatterGen.load()

# 条件付き生成
structures = model.generate(
    chemical_system="Li-Fe-O",
    num_samples=100,
    bandgap=">2.0 eV"
)

# 結果の保存
for i, struct in enumerate(structures):
    struct.to_cif(f"structure_{i}.cif")`,
      exampleExplanationJa: 'MatterGenを使用して、リチウム-鉄-酸素系で2.0eV以上のバンドギャップを持つ結晶構造を100個生成する例です。',
    },
    {
      id: 'mattersim',
      name: 'MatterSim',
      description: 'Universal atomistic simulation with deep learning potentials',
      descriptionJa: '深層学習ポテンシャルによるユニバーサル原子シミュレーション。構造最適化、物性予測、分子動力学を実行します。',
      domain: 'materials-science',
      version: '1.0.0',
      tags: ['物性予測', 'シミュレーション', '深層学習'],
      parameters: defaultParameters.mattersim,
      estimatedTime: '1〜10分',
      license: 'MIT',
      inputFormats: ['CIF', 'JSON'],
      outputFormats: ['JSON', 'CSV'],
      taskTypes: ['simulation', 'prediction'],
      exampleCode: `from labflow import MatterSim

# モデルの初期化
model = MatterSim.load()

# 構造の読み込みと物性予測
structure = model.load_structure("input.cif")
properties = model.predict(structure)

print(f"Formation energy: {properties['formation_energy']:.3f} eV/atom")
print(f"Bulk modulus: {properties['bulk_modulus']:.1f} GPa")`,
      exampleExplanationJa: 'MatterSimを使用して、CIFファイルから読み込んだ結晶構造の形成エネルギーと体積弾性率を予測する例です。',
    },
    {
      id: 'aurora',
      name: 'Aurora',
      description: 'High-resolution weather prediction foundation model',
      descriptionJa: '高解像度気象予測基盤モデル。気温、気圧、風速、降水量などを最大10日先まで予測します。',
      domain: 'climate',
      version: '1.0.0',
      tags: ['気象予測', '基盤モデル', '時系列'],
      parameters: defaultParameters.aurora,
      estimatedTime: '10〜60分',
      license: 'Apache-2.0',
      inputFormats: ['GeoJSON', 'JSON'],
      outputFormats: ['JSON', 'NetCDF', 'CSV'],
      taskTypes: ['prediction'],
      exampleCode: `from labflow import Aurora

# モデルの初期化
model = Aurora.load()

# 予測の実行
forecast = model.predict(
    location=(35.6762, 139.6503),  # 東京
    forecast_hours=72,
    variables=["temperature", "precipitation", "wind_speed"]
)

# 結果の確認
print(forecast.summary())
forecast.to_csv("weather_forecast.csv")`,
      exampleExplanationJa: 'Auroraを使用して、東京の72時間先までの気温、降水量、風速を予測する例です。',
    },
    {
      id: 'bioemu',
      name: 'BioEmu',
      description: 'Protein structure prediction and conformational ensemble generation',
      descriptionJa: 'タンパク質構造予測とコンフォメーションアンサンブル生成。配列からの3D構造予測と構造多様性解析を行います。',
      domain: 'genomics',
      version: '1.0.0',
      tags: ['タンパク質', '構造予測', 'アンサンブル'],
      parameters: defaultParameters.bioemu,
      estimatedTime: '5〜30分',
      license: 'MIT',
      inputFormats: ['FASTA', 'Text'],
      outputFormats: ['PDB', 'JSON'],
      taskTypes: ['prediction', 'generation'],
      exampleCode: `from labflow import BioEmu

# モデルの初期化
model = BioEmu.load()

# 配列からの構造予測
sequence = "MKFLILLFNILCLFPVLAADNHGVGPQGASGVD"
structures = model.predict(
    sequence=sequence,
    num_ensemble=10
)

# pLDDTスコアの確認と保存
for i, struct in enumerate(structures):
    print(f"Structure {i}: pLDDT = {struct.plddt_score:.1f}")
    struct.to_pdb(f"structure_{i}.pdb")`,
      exampleExplanationJa: 'BioEmuを使用して、アミノ酸配列から10個のコンフォメーションアンサンブルを生成する例です。',
    },
    {
      id: 'tamgen',
      name: 'TamGen',
      description: 'Target-aware molecule generation for drug discovery',
      descriptionJa: '標的認識分子生成モデル。ターゲットタンパク質に結合する新規分子を設計します。',
      domain: 'drug-discovery',
      version: '1.0.0',
      tags: ['創薬', '分子生成', 'ターゲット認識'],
      parameters: defaultParameters.tamgen,
      estimatedTime: '5〜20分',
      license: 'MIT',
      inputFormats: ['PDB', 'Text'],
      outputFormats: ['SMILES', 'JSON'],
      taskTypes: ['generation'],
      exampleCode: `from labflow import TamGen

# モデルの初期化
model = TamGen.load()

# ターゲットに対する分子生成
molecules = model.generate(
    target_pdb="5HT2A.pdb",
    num_samples=100,
    filters={
        "molecular_weight": (200, 500),
        "logp": (-1, 5)
    }
)

# 結果の確認
for mol in molecules[:10]:
    print(f"SMILES: {mol.smiles}")
    print(f"Predicted affinity: {mol.predicted_affinity:.2f} nM")`,
      exampleExplanationJa: 'TamGenを使用して、ターゲットタンパク質に結合する分子を100個生成する例です。',
    },
  ];
}

/**
 * Model Catalog
 *
 * MODL-CATA-001: Model catalog display
 * MODL-CATA-002: Model metadata
 * MODL-CATA-003: Filtering
 * MODL-CATA-004: Search
 * MODL-CATA-005: Standard models
 * MODL-CATA-006: Usage examples
 */

/**
 * Model domains (MODL-CATA-003)
 */
export enum ModelDomain {
  Materials = 'materials',
  DrugDiscovery = 'drug-discovery',
  Climate = 'climate',
  Genomics = 'genomics',
}

/**
 * Task types (MODL-CATA-003)
 */
export enum ModelTaskType {
  Generation = 'generation',
  Prediction = 'prediction',
  Simulation = 'simulation',
  Optimization = 'optimization',
}

/**
 * Input formats
 */
export enum InputFormat {
  CIF = 'cif',
  FASTA = 'fasta',
  PDB = 'pdb',
  SMILES = 'smiles',
  GeoJSON = 'geojson',
  Text = 'text',
  JSON = 'json',
}

/**
 * Output formats
 */
export enum OutputFormat {
  CIF = 'cif',
  PDB = 'pdb',
  SMILES = 'smiles',
  JSON = 'json',
  CSV = 'csv',
  NetCDF = 'netcdf',
}

/**
 * Model metadata (MODL-CATA-002)
 */
export interface ModelMetadata {
  id: string;
  name: string;
  version: string;
  domain: ModelDomain;
  taskTypes: ModelTaskType[];
  inputFormats: InputFormat[];
  outputFormats: OutputFormat[];
  estimatedTime: string;
  license: string;
  description: string;
  descriptionJa: string;
  exampleCode: string;
  exampleExplanationJa: string;
}

/**
 * Filter options
 */
export interface FilterOptions {
  domain?: ModelDomain;
  taskType?: ModelTaskType;
  inputFormat?: InputFormat;
}

/**
 * Standard models list (MODL-CATA-005)
 */
export const STANDARD_MODELS = ['mattergen', 'mattersim', 'aurora', 'bioemu', 'tamgen'];

/**
 * Standard model definitions
 */
const MODEL_DEFINITIONS: ModelMetadata[] = [
  {
    id: 'mattergen',
    name: 'MatterGen',
    version: '1.0.0',
    domain: ModelDomain.Materials,
    taskTypes: [ModelTaskType.Generation],
    inputFormats: [InputFormat.JSON, InputFormat.Text],
    outputFormats: [OutputFormat.CIF, OutputFormat.JSON],
    estimatedTime: '5〜30分',
    license: 'MIT',
    description: 'Generative model for crystal structures with property conditioning',
    descriptionJa: '特性条件付き結晶構造生成モデル。化学組成、空間群、物性値を指定して新規結晶構造を生成します。',
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
    exampleExplanationJa: 'MatterGenを使用して、リチウム-鉄-酸素系で2.0eV以上のバンドギャップを持つ結晶構造を100個生成する例です。生成された構造はCIFファイルとして保存されます。',
  },
  {
    id: 'mattersim',
    name: 'MatterSim',
    version: '1.0.0',
    domain: ModelDomain.Materials,
    taskTypes: [ModelTaskType.Simulation, ModelTaskType.Prediction],
    inputFormats: [InputFormat.CIF, InputFormat.JSON],
    outputFormats: [OutputFormat.JSON, OutputFormat.CSV],
    estimatedTime: '1〜10分',
    license: 'MIT',
    description: 'Universal atomistic simulation with deep learning potentials',
    descriptionJa: '深層学習ポテンシャルによるユニバーサル原子シミュレーション。構造最適化、物性予測、分子動力学を実行します。',
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
    version: '1.0.0',
    domain: ModelDomain.Climate,
    taskTypes: [ModelTaskType.Prediction],
    inputFormats: [InputFormat.GeoJSON, InputFormat.JSON],
    outputFormats: [OutputFormat.JSON, OutputFormat.NetCDF, OutputFormat.CSV],
    estimatedTime: '10〜60分',
    license: 'Apache-2.0',
    description: 'High-resolution weather prediction foundation model',
    descriptionJa: '高解像度気象予測基盤モデル。気温、気圧、風速、降水量などを最大10日先まで予測します。',
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
    exampleExplanationJa: 'Auroraを使用して、東京の72時間先までの気温、降水量、風速を予測する例です。結果はCSVファイルに出力されます。',
  },
  {
    id: 'bioemu',
    name: 'BioEmu',
    version: '1.0.0',
    domain: ModelDomain.Genomics,
    taskTypes: [ModelTaskType.Prediction, ModelTaskType.Generation],
    inputFormats: [InputFormat.FASTA, InputFormat.Text],
    outputFormats: [OutputFormat.PDB, OutputFormat.JSON],
    estimatedTime: '5〜30分',
    license: 'MIT',
    description: 'Protein structure prediction and conformational ensemble generation',
    descriptionJa: 'タンパク質構造予測とコンフォメーションアンサンブル生成。配列からの3D構造予測と構造多様性解析を行います。',
    exampleCode: `from labflow import BioEmu

# モデルの初期化
model = BioEmu.load()

# 配列からの構造予測
sequence = "MKFLILLFNILCLFPVLAADNHGVGPQGASGVDPITFDINSNQTGVQLTLGGSPKNNPLSPKQTKRHHHHHHH"
structures = model.predict(
    sequence=sequence,
    num_ensemble=10
)

# pLDDTスコアの確認と保存
for i, struct in enumerate(structures):
    print(f"Structure {i}: pLDDT = {struct.plddt_score:.1f}")
    struct.to_pdb(f"structure_{i}.pdb")`,
    exampleExplanationJa: 'BioEmuを使用して、アミノ酸配列から10個のコンフォメーションアンサンブルを生成する例です。各構造のpLDDTスコア（予測信頼度）を表示し、PDBファイルとして保存します。',
  },
  {
    id: 'tamgen',
    name: 'TamGen',
    version: '1.0.0',
    domain: ModelDomain.DrugDiscovery,
    taskTypes: [ModelTaskType.Generation],
    inputFormats: [InputFormat.PDB, InputFormat.Text],
    outputFormats: [OutputFormat.SMILES, OutputFormat.JSON],
    estimatedTime: '5〜20分',
    license: 'MIT',
    description: 'Target-aware molecule generation for drug discovery',
    descriptionJa: '標的認識分子生成モデル。ターゲットタンパク質に結合する新規分子を設計します。',
    exampleCode: `from labflow import TamGen

# モデルの初期化
model = TamGen.load()

# ターゲットに対する分子生成
molecules = model.generate(
    target_pdb="5HT2A.pdb",
    num_samples=100,
    filters={
        "molecular_weight": (200, 500),
        "logp": (-1, 5),
        "tpsa": (0, 140)
    }
)

# 結果の確認
for mol in molecules[:10]:
    print(f"SMILES: {mol.smiles}")
    print(f"Predicted affinity: {mol.predicted_affinity:.2f} nM")`,
    exampleExplanationJa: 'TamGenを使用して、セロトニン受容体（5HT2A）に結合する分子を100個生成する例です。分子量、logP、TPSAでフィルタリングし、予測結合親和性を確認します。',
  },
];

/**
 * Model Catalog class
 */
export class ModelCatalog {
  private models: ModelMetadata[];

  constructor(models: ModelMetadata[] = MODEL_DEFINITIONS) {
    this.models = models;
  }

  /**
   * List all models (MODL-CATA-001)
   */
  listModels(): ModelMetadata[] {
    return [...this.models];
  }

  /**
   * Get model count
   */
  getModelCount(): number {
    return this.models.length;
  }

  /**
   * Get model by ID
   */
  getModel(id: string): ModelMetadata | undefined {
    return this.models.find((m) => m.id.toLowerCase() === id.toLowerCase());
  }

  /**
   * Filter by domain (MODL-CATA-003)
   */
  filterByDomain(domain: ModelDomain): ModelMetadata[] {
    return this.models.filter((m) => m.domain === domain);
  }

  /**
   * Filter by task type (MODL-CATA-003)
   */
  filterByTaskType(taskType: ModelTaskType): ModelMetadata[] {
    return this.models.filter((m) => m.taskTypes.includes(taskType));
  }

  /**
   * Filter by input format (MODL-CATA-003)
   */
  filterByInputFormat(format: InputFormat): ModelMetadata[] {
    return this.models.filter((m) => m.inputFormats.includes(format));
  }

  /**
   * Combined filter (MODL-CATA-003)
   */
  filter(options: FilterOptions): ModelMetadata[] {
    let results = [...this.models];

    if (options.domain) {
      results = results.filter((m) => m.domain === options.domain);
    }

    if (options.taskType) {
      results = results.filter((m) => m.taskTypes.includes(options.taskType!));
    }

    if (options.inputFormat) {
      results = results.filter((m) => m.inputFormats.includes(options.inputFormat!));
    }

    return results;
  }

  /**
   * Search by name or description (MODL-CATA-004)
   */
  search(query: string): ModelMetadata[] {
    const lowerQuery = query.toLowerCase();

    return this.models.filter(
      (m) =>
        m.name.toLowerCase().includes(lowerQuery) ||
        m.description.toLowerCase().includes(lowerQuery) ||
        m.descriptionJa.includes(query)
    );
  }

  /**
   * Add model to catalog
   */
  addModel(model: ModelMetadata): void {
    this.models.push(model);
  }
}

/**
 * Create model catalog with standard models
 */
export function createModelCatalog(): ModelCatalog {
  return new ModelCatalog();
}

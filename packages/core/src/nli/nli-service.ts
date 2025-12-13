/**
 * Natural Language Interface Service
 *
 * DASH-NLI-001: Japanese and English input support
 * DASH-NLI-002: Intent analysis and workflow recommendation
 * DASH-NLI-003: Information extraction
 * DASH-NLI-004: Clarification questions
 * DASH-NLI-007: Input pattern recognition
 */

/**
 * Input patterns (DASH-NLI-007)
 */
export enum InputPattern {
  Predict = 'predict',
  Generate = 'generate',
  Optimize = 'optimize',
  Analyze = 'analyze',
  Compare = 'compare',
  Unknown = 'unknown',
}

/**
 * Intent analysis result (DASH-NLI-002)
 */
export interface IntentAnalysisResult {
  pattern: InputPattern;
  confidence: number;
  language: 'ja' | 'en';
  recommendedWorkflows: string[];
  needsClarification: boolean;
  clarificationQuestion?: string;
  clarificationOptions?: string[];
}

/**
 * Extracted information (DASH-NLI-003)
 */
export interface ExtractedInfo {
  domain?: string;
  targetProperties?: string[];
  inputDataTypes?: string[];
  expectedOutputFormats?: string[];
  constraints?: Record<string, unknown>;
}

/**
 * NLI analysis options
 */
export interface NLIOptions {
  language?: 'ja' | 'en';
}

/**
 * Detect language from input text (DASH-NLI-001)
 */
export function detectLanguage(text: string): 'ja' | 'en' {
  // Count Japanese characters (Hiragana, Katakana, Kanji)
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g;
  const japaneseMatches = text.match(japaneseRegex) || [];

  // If more than 20% Japanese characters, consider it Japanese
  const japaneseRatio = japaneseMatches.length / text.length;
  return japaneseRatio > 0.2 ? 'ja' : 'en';
}

/**
 * Extract intent pattern from text (DASH-NLI-007)
 */
export function extractIntent(text: string): InputPattern {
  const normalizedText = text.toLowerCase();

  // Japanese patterns
  const japanesePatterns: [RegExp, InputPattern][] = [
    [/予測したい|予測する|予測を/, InputPattern.Predict],
    [/生成したい|生成する|作りたい|作成したい/, InputPattern.Generate],
    [/最適化したい|最適化する|改善したい/, InputPattern.Optimize],
    [/分析したい|分析する|解析したい|調べたい/, InputPattern.Analyze],
    [/比較したい|比較する|比べたい/, InputPattern.Compare],
  ];

  // English patterns
  const englishPatterns: [RegExp, InputPattern][] = [
    [/predict|prediction|forecast/, InputPattern.Predict],
    [/generate|create|design|discover/, InputPattern.Generate],
    [/optimize|optimization|improve/, InputPattern.Optimize],
    [/analyze|analysis|examine|investigate/, InputPattern.Analyze],
    [/compare|comparison|diff/, InputPattern.Compare],
  ];

  // Try Japanese patterns
  for (const [regex, pattern] of japanesePatterns) {
    if (regex.test(text)) {
      return pattern;
    }
  }

  // Try English patterns
  for (const [regex, pattern] of englishPatterns) {
    if (regex.test(normalizedText)) {
      return pattern;
    }
  }

  return InputPattern.Unknown;
}

/**
 * Domain keyword mapping
 */
const DOMAIN_KEYWORDS: Record<string, string[]> = {
  'drug-discovery': [
    '創薬', '薬', '薬物', 'drug', 'pharma', 'pharmaceutical',
    '化合物', 'compound', 'molecule', '分子', 'リード', 'lead',
    'ADMET', '結合親和性', 'binding', 'affinity', 'target', '標的',
  ],
  'materials': [
    '材料', 'material', '電池', 'battery', '半導体', 'semiconductor',
    'バンドギャップ', 'bandgap', '結晶', 'crystal', '合金', 'alloy',
    '触媒', 'catalyst', '超伝導', 'superconductor',
  ],
  'climate': [
    '気候', 'climate', '天気', 'weather', '気象', '予報', 'forecast',
    '大気', 'atmosphere', '環境', 'environment', '温度', 'temperature',
  ],
  'genomics': [
    'タンパク質', 'protein', '遺伝子', 'gene', 'DNA', 'RNA',
    '配列', 'sequence', 'FASTA', '構造', 'structure', 'コンフォメーション',
    'ゲノム', 'genome', 'プロテオーム', 'proteome', 'PDB',
  ],
  'chemistry': [
    '化学', 'chemistry', 'DFT', '量子', 'quantum', '電子', 'electron',
    '軌道', 'orbital', '反応', 'reaction', 'MD', '動力学', 'dynamics',
  ],
  'physics': [
    '物理', 'physics', 'シミュレーション', 'simulation', '場', 'field',
    '粒子', 'particle', '量子', 'quantum',
  ],
};

/**
 * Workflow recommendations by domain and pattern
 */
const WORKFLOW_RECOMMENDATIONS: Record<string, Record<InputPattern, string[]>> = {
  'drug-discovery': {
    [InputPattern.Predict]: ['admet-prediction', 'binding-prediction', 'activity-prediction'],
    [InputPattern.Generate]: ['molecule-generation', 'lead-optimization'],
    [InputPattern.Optimize]: ['lead-optimization', 'property-optimization'],
    [InputPattern.Analyze]: ['molecule-analysis', 'docking-analysis'],
    [InputPattern.Compare]: ['molecule-comparison', 'activity-comparison'],
    [InputPattern.Unknown]: ['molecule-generation', 'admet-prediction'],
  },
  'materials': {
    [InputPattern.Predict]: ['property-prediction', 'stability-prediction'],
    [InputPattern.Generate]: ['material-generation', 'crystal-design'],
    [InputPattern.Optimize]: ['material-optimization', 'composition-optimization'],
    [InputPattern.Analyze]: ['dft-analysis', 'structure-analysis'],
    [InputPattern.Compare]: ['material-comparison'],
    [InputPattern.Unknown]: ['material-generation', 'property-prediction'],
  },
  'climate': {
    [InputPattern.Predict]: ['weather-prediction', 'climate-forecast'],
    [InputPattern.Generate]: ['weather-prediction', 'scenario-generation', 'ensemble-generation'],
    [InputPattern.Optimize]: ['model-calibration'],
    [InputPattern.Analyze]: ['climate-analysis', 'trend-analysis'],
    [InputPattern.Compare]: ['model-comparison', 'scenario-comparison'],
    [InputPattern.Unknown]: ['weather-prediction', 'climate-analysis'],
  },
  'genomics': {
    [InputPattern.Predict]: ['protein-structure', 'structure-prediction', 'function-prediction'],
    [InputPattern.Generate]: ['sequence-generation', 'variant-generation'],
    [InputPattern.Optimize]: ['sequence-optimization'],
    [InputPattern.Analyze]: ['sequence-analysis', 'structure-analysis'],
    [InputPattern.Compare]: ['structure-comparison', 'alignment'],
    [InputPattern.Unknown]: ['protein-structure', 'sequence-analysis'],
  },
  'chemistry': {
    [InputPattern.Predict]: ['property-prediction', 'reaction-prediction'],
    [InputPattern.Generate]: ['conformer-generation', 'reaction-design'],
    [InputPattern.Optimize]: ['geometry-optimization', 'reaction-optimization'],
    [InputPattern.Analyze]: ['dft-analysis', 'orbital-analysis'],
    [InputPattern.Compare]: ['isomer-comparison', 'mechanism-comparison'],
    [InputPattern.Unknown]: ['dft-analysis', 'property-prediction'],
  },
  'physics': {
    [InputPattern.Predict]: ['simulation-prediction', 'field-prediction'],
    [InputPattern.Generate]: ['trajectory-generation', 'configuration-generation'],
    [InputPattern.Optimize]: ['parameter-optimization'],
    [InputPattern.Analyze]: ['trajectory-analysis', 'field-analysis'],
    [InputPattern.Compare]: ['model-comparison'],
    [InputPattern.Unknown]: ['simulation-prediction'],
  },
};

/**
 * Clarification templates
 */
const CLARIFICATION_TEMPLATES = {
  ja: {
    general: 'より具体的に教えてください。どのような研究分野で、何を達成したいですか？',
    domain: 'どの研究分野に関連していますか？（創薬、材料科学、気候、ゲノミクス、化学、物理）',
    target: '何を予測/生成/分析したいですか？具体的な対象を教えてください。',
    input: '入力データの形式は何ですか？（PDB、FASTA、SMILES、CIF など）',
  },
  en: {
    general: 'Please be more specific. What research domain and what do you want to achieve?',
    domain: 'Which research domain is this related to? (drug discovery, materials, climate, genomics, chemistry, physics)',
    target: 'What do you want to predict/generate/analyze? Please specify the target.',
    input: 'What is the input data format? (PDB, FASTA, SMILES, CIF, etc.)',
  },
};

/**
 * Data format keywords
 */
const DATA_FORMAT_KEYWORDS: Record<string, string[]> = {
  pdb: ['pdb', 'PDB'],
  fasta: ['fasta', 'FASTA', 'fa'],
  smiles: ['smiles', 'SMILES'],
  sdf: ['sdf', 'SDF', 'mol'],
  cif: ['cif', 'CIF'],
  csv: ['csv', 'CSV'],
  json: ['json', 'JSON'],
  netcdf: ['netcdf', 'NetCDF', 'nc'],
  xyz: ['xyz', 'XYZ'],
};

/**
 * Property keywords
 */
const PROPERTY_KEYWORDS: Record<string, string[]> = {
  'binding-affinity': ['結合親和性', 'binding affinity', 'binding', '親和性', 'affinity', 'Ki', 'Kd'],
  'bandgap': ['バンドギャップ', 'bandgap', 'band gap', 'バンドギャップ'],
  'activity': ['活性', 'activity', 'IC50', 'EC50'],
  'stability': ['安定性', 'stability', '熱力学的安定性'],
  'solubility': ['溶解性', 'solubility'],
  'toxicity': ['毒性', 'toxicity'],
};

/**
 * Natural Language Interface Service
 */
export class NLIService {
  /**
   * Analyze intent from natural language input (DASH-NLI-002)
   */
  async analyzeIntent(
    text: string,
    options: NLIOptions = {}
  ): Promise<IntentAnalysisResult> {
    const language = options.language ?? detectLanguage(text);
    const pattern = extractIntent(text);
    const extractedInfo = await this.extractInfo(text);
    const domain = extractedInfo.domain ?? this.detectDomain(text);

    // Calculate confidence
    const confidence = this.calculateConfidence(text, pattern, domain);

    // Determine if clarification is needed
    const needsClarification = confidence < 0.5 || (pattern === InputPattern.Unknown && !domain);

    // Get workflow recommendations
    const recommendedWorkflows = this.getWorkflowRecommendations(
      domain,
      pattern,
      text
    );

    // Generate clarification question if needed
    let clarificationQuestion: string | undefined;
    let clarificationOptions: string[] | undefined;

    if (needsClarification) {
      const templates = CLARIFICATION_TEMPLATES[language];
      if (pattern === InputPattern.Unknown) {
        clarificationQuestion = templates.general;
      } else if (!domain) {
        clarificationQuestion = templates.domain;
        clarificationOptions = [
          '創薬・製薬',
          '材料科学',
          '気候・環境',
          'ゲノミクス',
          '化学',
          '物理',
        ];
      } else {
        clarificationQuestion = templates.target;
      }
    }

    return {
      pattern,
      confidence,
      language,
      recommendedWorkflows,
      needsClarification,
      clarificationQuestion,
      clarificationOptions,
    };
  }

  /**
   * Extract information from text (DASH-NLI-003)
   */
  async extractInfo(text: string): Promise<ExtractedInfo> {
    const domain = this.detectDomain(text);
    const targetProperties = this.extractProperties(text);
    const inputDataTypes = this.extractDataFormats(text, 'input');
    const expectedOutputFormats = this.extractDataFormats(text, 'output');

    return {
      domain,
      targetProperties: targetProperties.length > 0 ? targetProperties : undefined,
      inputDataTypes: inputDataTypes.length > 0 ? inputDataTypes : undefined,
      expectedOutputFormats: expectedOutputFormats.length > 0 ? expectedOutputFormats : undefined,
    };
  }

  /**
   * Detect research domain from text
   */
  private detectDomain(text: string): string | undefined {
    const normalizedText = text.toLowerCase();

    let maxMatches = 0;
    let detectedDomain: string | undefined;

    for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
      const matches = keywords.filter(
        (kw) => text.includes(kw) || normalizedText.includes(kw.toLowerCase())
      ).length;

      if (matches > maxMatches) {
        maxMatches = matches;
        detectedDomain = domain;
      }
    }

    return detectedDomain;
  }

  /**
   * Extract data formats from text
   */
  private extractDataFormats(text: string, context: 'input' | 'output'): string[] {
    const formats: string[] = [];
    const normalizedText = text.toLowerCase();

    // Check for output context keywords
    const isOutputContext = context === 'output' && 
      (text.includes('出力') || normalizedText.includes('output') || normalizedText.includes('export'));

    // Check for input context keywords
    const isInputContext = context === 'input' && 
      (text.includes('入力') || normalizedText.includes('input') || text.includes('ファイル'));

    for (const [format, keywords] of Object.entries(DATA_FORMAT_KEYWORDS)) {
      for (const keyword of keywords) {
        if (text.includes(keyword) || normalizedText.includes(keyword.toLowerCase())) {
          // For context-specific extraction
          if (context === 'output' && isOutputContext) {
            formats.push(format);
          } else if (context === 'input' && isInputContext) {
            formats.push(format);
          } else if (!isOutputContext && !isInputContext) {
            // Default: add if found
            formats.push(format);
          }
          break;
        }
      }
    }

    return [...new Set(formats)];
  }

  /**
   * Extract target properties from text
   */
  private extractProperties(text: string): string[] {
    const properties: string[] = [];
    const normalizedText = text.toLowerCase();

    for (const [property, keywords] of Object.entries(PROPERTY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (text.includes(keyword) || normalizedText.includes(keyword.toLowerCase())) {
          properties.push(property);
          break;
        }
      }
    }

    return [...new Set(properties)];
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    text: string,
    pattern: InputPattern,
    domain: string | undefined
  ): number {
    let confidence = 0;

    // Pattern recognition adds confidence
    if (pattern !== InputPattern.Unknown) {
      confidence += 0.45;
    }

    // Domain detection adds confidence
    if (domain) {
      confidence += 0.35;
    }

    // Longer, more specific text adds confidence
    if (text.length > 20) {
      confidence += 0.15;
    }
    if (text.length > 50) {
      confidence += 0.15;
    }

    // Multiple domain keywords increase confidence
    const keywordCount = this.countDomainKeywords(text);
    if (keywordCount >= 2) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Count domain keywords in text
   */
  private countDomainKeywords(text: string): number {
    let count = 0;
    const normalizedText = text.toLowerCase();

    for (const keywords of Object.values(DOMAIN_KEYWORDS)) {
      for (const keyword of keywords) {
        if (text.includes(keyword) || normalizedText.includes(keyword.toLowerCase())) {
          count++;
        }
      }
    }

    return count;
  }

  /**
   * Get workflow recommendations
   */
  private getWorkflowRecommendations(
    domain: string | undefined,
    pattern: InputPattern,
    text: string
  ): string[] {
    const recommendations: string[] = [];

    // Domain-specific recommendations
    if (domain && WORKFLOW_RECOMMENDATIONS[domain]) {
      const domainWorkflows = WORKFLOW_RECOMMENDATIONS[domain][pattern] ?? 
        WORKFLOW_RECOMMENDATIONS[domain][InputPattern.Unknown];
      recommendations.push(...domainWorkflows);
    }

    // Fallback: detect from text keywords
    if (recommendations.length === 0) {
      // Protein/structure related
      if (text.includes('タンパク質') || text.includes('protein') || text.includes('構造')) {
        recommendations.push('protein-structure');
      }
      // Molecule related
      if (text.includes('分子') || text.includes('molecule') || text.includes('化合物')) {
        recommendations.push('molecule-generation');
      }
      // Material related
      if (text.includes('材料') || text.includes('material') || text.includes('電池')) {
        recommendations.push('material-generation');
      }
      // Weather related
      if (text.includes('天気') || text.includes('weather') || text.includes('気象')) {
        recommendations.push('weather-prediction');
      }
    }

    return [...new Set(recommendations)];
  }
}

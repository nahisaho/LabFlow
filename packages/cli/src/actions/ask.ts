/**
 * Ask Action
 *
 * Natural Language Interface integration for CLI
 * DASH-NLI-001: Japanese and English input support
 * DASH-NLI-002: Intent analysis and workflow recommendation
 */

import {
  NLIService,
  detectLanguage,
  extractIntent,
  type IntentAnalysisResult,
  type ExtractedInfo,
  InputPattern,
} from '@labflow/core';

export interface AskOptions {
  language?: 'ja' | 'en';
  verbose?: boolean;
  interactive?: boolean;
}

export interface AskResult {
  query: string;
  language: 'ja' | 'en';
  intent: IntentAnalysisResult;
  extractedInfo: ExtractedInfo;
  suggestions: WorkflowSuggestion[];
}

export interface WorkflowSuggestion {
  id: string;
  name: string;
  description: string;
  confidence: number;
  command: string;
}

// NLI Service singleton
let nliService: NLIService | null = null;

function getNLIService(): NLIService {
  if (!nliService) {
    nliService = new NLIService();
  }
  return nliService;
}

/**
 * Workflow descriptions for each domain
 */
const WORKFLOW_DESCRIPTIONS: Record<string, Record<string, { name: string; description: string; descriptionJa: string }>> = {
  'drug-discovery': {
    'admet-prediction': {
      name: 'ADMET Prediction',
      description: 'Predict absorption, distribution, metabolism, excretion, and toxicity',
      descriptionJa: 'ADMET（吸収、分布、代謝、排泄、毒性）を予測',
    },
    'binding-prediction': {
      name: 'Binding Affinity Prediction',
      description: 'Predict protein-ligand binding affinity',
      descriptionJa: 'タンパク質-リガンド結合親和性を予測',
    },
    'molecule-generation': {
      name: 'Molecule Generation',
      description: 'Generate novel molecules with desired properties',
      descriptionJa: '目的の特性を持つ新規分子を生成',
    },
    'lead-optimization': {
      name: 'Lead Optimization',
      description: 'Optimize lead compounds for better properties',
      descriptionJa: 'リード化合物の特性を最適化',
    },
  },
  materials: {
    'material-generation': {
      name: 'Material Generation',
      description: 'Generate novel materials with MatterGen',
      descriptionJa: 'MatterGenで新規材料を生成',
    },
    'property-prediction': {
      name: 'Property Prediction',
      description: 'Predict material properties',
      descriptionJa: '材料特性を予測',
    },
    'stability-prediction': {
      name: 'Stability Prediction',
      description: 'Predict material stability with MatterSim',
      descriptionJa: 'MatterSimで材料の安定性を予測',
    },
  },
  climate: {
    'weather-prediction': {
      name: 'Weather Prediction',
      description: 'Weather forecasting with Aurora',
      descriptionJa: 'Auroraによる天気予報',
    },
    'climate-analysis': {
      name: 'Climate Analysis',
      description: 'Analyze climate data and trends',
      descriptionJa: '気候データとトレンドを分析',
    },
  },
  genomics: {
    'protein-structure': {
      name: 'Protein Structure Prediction',
      description: 'Predict protein 3D structure',
      descriptionJa: 'タンパク質の3D構造を予測',
    },
    'sequence-analysis': {
      name: 'Sequence Analysis',
      description: 'Analyze DNA/RNA/protein sequences',
      descriptionJa: 'DNA/RNA/タンパク質配列を分析',
    },
  },
};

/**
 * Process natural language query and return workflow suggestions
 */
export async function processQuery(
  query: string,
  options: AskOptions = {}
): Promise<AskResult> {
  const service = getNLIService();

  // Analyze intent
  const intent = await service.analyzeIntent(query, {
    language: options.language,
  });

  // Extract additional information
  const extractedInfo = await service.extractInfo(query);

  // Generate workflow suggestions
  const suggestions = generateSuggestions(intent, extractedInfo, query);

  return {
    query,
    language: intent.language,
    intent,
    extractedInfo,
    suggestions,
  };
}

/**
 * Generate workflow suggestions based on analysis
 */
function generateSuggestions(
  intent: IntentAnalysisResult,
  info: ExtractedInfo,
  _query: string
): WorkflowSuggestion[] {
  const suggestions: WorkflowSuggestion[] = [];
  const isJapanese = intent.language === 'ja';

  for (const workflowId of intent.recommendedWorkflows) {
    // Find workflow description
    const domain = info.domain ?? detectDomainFromWorkflow(workflowId);
    const domainWorkflows = WORKFLOW_DESCRIPTIONS[domain];

    if (domainWorkflows && domainWorkflows[workflowId]) {
      const wf = domainWorkflows[workflowId];
      suggestions.push({
        id: workflowId,
        name: wf.name,
        description: isJapanese ? wf.descriptionJa : wf.description,
        confidence: intent.confidence,
        command: `labflow workflow run ${workflowId}`,
      });
    } else {
      // Generic suggestion for unknown workflows
      suggestions.push({
        id: workflowId,
        name: formatWorkflowName(workflowId),
        description: isJapanese
          ? `${workflowId} ワークフローを実行`
          : `Run ${workflowId} workflow`,
        confidence: intent.confidence * 0.8,
        command: `labflow workflow run ${workflowId}`,
      });
    }
  }

  // Sort by confidence
  suggestions.sort((a, b) => b.confidence - a.confidence);

  return suggestions;
}

/**
 * Detect domain from workflow ID
 */
function detectDomainFromWorkflow(workflowId: string): string {
  const domainKeywords: Record<string, string[]> = {
    'drug-discovery': ['admet', 'binding', 'molecule', 'lead', 'docking', 'activity'],
    materials: ['material', 'crystal', 'bandgap', 'stability', 'matter'],
    climate: ['weather', 'climate', 'aurora', 'forecast'],
    genomics: ['protein', 'sequence', 'gene', 'structure', 'alignment'],
  };

  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    if (keywords.some((kw) => workflowId.toLowerCase().includes(kw))) {
      return domain;
    }
  }

  return 'drug-discovery'; // Default
}

/**
 * Format workflow ID to human-readable name
 */
function formatWorkflowName(workflowId: string): string {
  return workflowId
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format result for display
 */
export function formatAskResult(result: AskResult, verbose: boolean = false): string {
  const lines: string[] = [];
  const isJapanese = result.language === 'ja';

  // Header
  if (isJapanese) {
    lines.push('📊 分析結果');
    lines.push('');
  } else {
    lines.push('📊 Analysis Result');
    lines.push('');
  }

  // Intent pattern
  const patternLabels: Record<InputPattern, { en: string; ja: string }> = {
    [InputPattern.Predict]: { en: 'Prediction', ja: '予測' },
    [InputPattern.Generate]: { en: 'Generation', ja: '生成' },
    [InputPattern.Optimize]: { en: 'Optimization', ja: '最適化' },
    [InputPattern.Analyze]: { en: 'Analysis', ja: '分析' },
    [InputPattern.Compare]: { en: 'Comparison', ja: '比較' },
    [InputPattern.Unknown]: { en: 'Unknown', ja: '不明' },
  };

  const patternLabel = patternLabels[result.intent.pattern];
  lines.push(
    isJapanese
      ? `🎯 インテント: ${patternLabel.ja}`
      : `🎯 Intent: ${patternLabel.en}`
  );

  // Domain
  if (result.extractedInfo.domain) {
    lines.push(
      isJapanese
        ? `🔬 ドメイン: ${result.extractedInfo.domain}`
        : `🔬 Domain: ${result.extractedInfo.domain}`
    );
  }

  // Confidence
  const confidencePercent = Math.round(result.intent.confidence * 100);
  lines.push(
    isJapanese
      ? `📈 信頼度: ${confidencePercent}%`
      : `📈 Confidence: ${confidencePercent}%`
  );

  lines.push('');

  // Suggestions
  if (result.suggestions.length > 0) {
    lines.push(
      isJapanese ? '💡 推奨ワークフロー:' : '💡 Recommended Workflows:'
    );
    lines.push('');

    for (const [index, suggestion] of result.suggestions.entries()) {
      lines.push(`  ${index + 1}. ${suggestion.name}`);
      lines.push(`     ${suggestion.description}`);
      lines.push(`     $ ${suggestion.command}`);
      lines.push('');
    }
  }

  // Clarification needed
  if (result.intent.needsClarification) {
    lines.push('');
    lines.push(isJapanese ? '❓ 確認:' : '❓ Clarification needed:');
    lines.push(`   ${result.intent.clarificationQuestion}`);

    if (result.intent.clarificationOptions) {
      lines.push('');
      lines.push(isJapanese ? '   選択肢:' : '   Options:');
      result.intent.clarificationOptions.forEach((opt, i) => {
        lines.push(`   ${i + 1}. ${opt}`);
      });
    }
  }

  // Verbose mode: show extracted info
  if (verbose) {
    lines.push('');
    lines.push('─'.repeat(40));
    lines.push(isJapanese ? '詳細情報:' : 'Detailed Info:');
    lines.push(JSON.stringify(result.extractedInfo, null, 2));
  }

  return lines.join('\n');
}

/**
 * Get clarification options for interactive mode
 */
export function getClarificationOptions(result: AskResult): string[] {
  return result.intent.clarificationOptions ?? [];
}

/**
 * Re-export core NLI functions for convenience
 */
export { detectLanguage, extractIntent, InputPattern };

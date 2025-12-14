/**
 * Hypothesis Generation Service
 *
 * GraphRAG-based research hypothesis generation
 *
 * Requirements:
 * - HYPO-GEN-001: GraphRAG-based hypothesis generation
 * - HYPO-GEN-002: Knowledge gap identification
 * - HYPO-GEN-003: Hypothesis ranking and evaluation
 */

import type {
  GeneratedHypothesis,
  HypothesisGenerationRequest,
  KnowledgeGap,
  EvidenceReference,
  HypothesisEvaluation,
  EvaluationCriteria,
  RefinementSuggestion,
  GenerationSummary,
  ResearchQuestion,
  HypothesisType,
  ConfidenceLevel,
  HypothesisStatus,
} from './types';

/**
 * Default evaluation criteria
 */
const DEFAULT_CRITERIA: EvaluationCriteria = {
  testabilityWeight: 0.3,
  noveltyWeight: 0.25,
  impactWeight: 0.25,
  evidenceWeight: 0.2,
  minOverallScore: 0.5,
};

/**
 * Hypothesis patterns for different types
 */
const HYPOTHESIS_PATTERNS: Record<HypothesisType, { en: string[]; ja: string[] }> = {
  mechanistic: {
    en: [
      '{entity1} functions through {mechanism} to affect {entity2}',
      'The {property} of {entity} is mediated by {mechanism}',
    ],
    ja: [
      '{entity1}は{mechanism}を通じて{entity2}に影響を与える',
      '{entity}の{property}は{mechanism}によって媒介される',
    ],
  },
  correlational: {
    en: [
      'There is a correlation between {entity1} and {entity2}',
      '{property1} and {property2} are associated in {domain}',
    ],
    ja: [
      '{entity1}と{entity2}の間に相関がある',
      '{domain}において{property1}と{property2}は関連している',
    ],
  },
  predictive: {
    en: [
      '{entity} with {property} will exhibit {outcome}',
      'Changes in {variable1} will lead to changes in {variable2}',
    ],
    ja: [
      '{property}を持つ{entity}は{outcome}を示す',
      '{variable1}の変化は{variable2}の変化をもたらす',
    ],
  },
  causal: {
    en: [
      '{entity1} causes {outcome} in {entity2}',
      'Modification of {entity} results in {effect}',
    ],
    ja: [
      '{entity1}は{entity2}において{outcome}を引き起こす',
      '{entity}の修正は{effect}をもたらす',
    ],
  },
  comparative: {
    en: [
      '{entity1} is more {property} than {entity2} under {condition}',
      '{method1} outperforms {method2} for {task}',
    ],
    ja: [
      '{condition}下で{entity1}は{entity2}より{property}である',
      '{task}において{method1}は{method2}より優れている',
    ],
  },
  exploratory: {
    en: [
      'The relationship between {entity1} and {entity2} in {domain} is unexplored',
      'The role of {entity} in {process} remains unclear',
    ],
    ja: [
      '{domain}における{entity1}と{entity2}の関係は未探索である',
      '{process}における{entity}の役割は不明確である',
    ],
  },
};

/**
 * Hypothesis Generation Service
 */
export class HypothesisService {
  private hypotheses: Map<string, GeneratedHypothesis> = new Map();
  private gaps: Map<string, KnowledgeGap> = new Map();
  private evaluations: Map<string, HypothesisEvaluation> = new Map();

  /**
   * Generate hypotheses based on a research topic
   */
  async generateHypotheses(
    request: HypothesisGenerationRequest,
    userId: string
  ): Promise<GeneratedHypothesis[]> {
    const count = request.count ?? 5;
    const types = request.types ?? ['mechanistic', 'correlational', 'predictive'];
    const minConfidence = request.minConfidence ?? 0.3;

    // First, identify knowledge gaps
    const gaps = await this.identifyKnowledgeGaps(request.topic, request.domain);

    const hypotheses: GeneratedHypothesis[] = [];

    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      const hypothesis = this.generateSingleHypothesis(
        request,
        type,
        gaps,
        userId,
        minConfidence
      );

      if (hypothesis.confidenceScore >= minConfidence) {
        hypotheses.push(hypothesis);
        this.hypotheses.set(hypothesis.id, hypothesis);
      }
    }

    // Rank hypotheses
    return this.rankHypotheses(hypotheses);
  }

  /**
   * Generate a single hypothesis
   */
  private generateSingleHypothesis(
    request: HypothesisGenerationRequest,
    type: HypothesisType,
    gaps: KnowledgeGap[],
    userId: string,
    minConfidence: number
  ): GeneratedHypothesis {
    const id = crypto.randomUUID();
    const now = new Date();

    // Generate hypothesis statement based on type and topic
    const patterns = HYPOTHESIS_PATTERNS[type];
    const patternIndex = Math.floor(Math.random() * patterns.en.length);

    // Create placeholder-filled statements
    const statement = this.fillPattern(patterns.en[patternIndex], request);
    const statementJa = this.fillPattern(patterns.ja[patternIndex], request);

    // Generate mock evidence
    const supportingEvidence = this.generateMockEvidence('supporting', 2 + Math.floor(Math.random() * 3));
    const contradictingEvidence = this.generateMockEvidence('contradicting', Math.floor(Math.random() * 2));

    // Calculate scores
    const confidenceScore = this.calculateConfidenceScore(supportingEvidence, contradictingEvidence);
    const testabilityScore = 0.5 + Math.random() * 0.5;
    const noveltyScore = request.noveltyWeight ?? 0.5 + Math.random() * 0.3;
    const impactScore = 0.4 + Math.random() * 0.5;

    // Determine confidence level
    const confidence = this.scoreToConfidenceLevel(confidenceScore);

    // Extract key entities from topic
    const keyEntities = this.extractEntities(request.topic);

    // Generate suggested experiments
    const suggestedExperiments = this.generateExperimentSuggestions(type, keyEntities);

    // Link to related gaps
    const relatedGapIds = gaps.slice(0, 2).map((g) => g.id);

    return {
      id,
      statement,
      statementJa,
      type,
      confidence,
      confidenceScore,
      domain: request.domain ?? 'general',
      relatedGapIds,
      supportingEvidence,
      contradictingEvidence,
      keyEntities,
      keyRelationships: this.generateKeyRelationships(keyEntities),
      testabilityScore,
      noveltyScore,
      impactScore,
      suggestedExperiments,
      relatedHypothesisIds: [],
      status: 'generated',
      generatedFor: userId,
      labId: request.labId,
      reasoning: `${type}仮説として、${request.topic}に関する知見から導出。${supportingEvidence.length}件の支持エビデンスを特定。`,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Fill pattern with request data
   */
  private fillPattern(pattern: string, request: HypothesisGenerationRequest): string {
    const entities = this.extractEntities(request.topic);
    const domain = request.domain ?? '科学';

    let result = pattern
      .replace('{entity}', entities[0] ?? request.topic)
      .replace('{entity1}', entities[0] ?? 'A')
      .replace('{entity2}', entities[1] ?? 'B')
      .replace('{domain}', domain)
      .replace('{property}', '特性')
      .replace('{property1}', '特性1')
      .replace('{property2}', '特性2')
      .replace('{mechanism}', 'メカニズムX')
      .replace('{outcome}', '効果Y')
      .replace('{effect}', '結果Z')
      .replace('{variable1}', '変数1')
      .replace('{variable2}', '変数2')
      .replace('{condition}', '条件C')
      .replace('{method1}', '手法A')
      .replace('{method2}', '手法B')
      .replace('{task}', 'タスクT')
      .replace('{process}', 'プロセスP');

    return result;
  }

  /**
   * Extract entities from topic
   */
  private extractEntities(topic: string): string[] {
    // Simple entity extraction (in production, use NER)
    const words = topic.split(/[\s,、。]+/).filter((w) => w.length > 1);
    return words.slice(0, 3);
  }

  /**
   * Generate mock evidence
   */
  private generateMockEvidence(type: 'supporting' | 'contradicting', count: number): EvidenceReference[] {
    const evidence: EvidenceReference[] = [];

    const paperTitles = [
      'Deep Learning for Molecular Property Prediction',
      'Graph Neural Networks in Drug Discovery',
      'Machine Learning Approaches to Materials Science',
      'Advances in Protein Structure Prediction',
      'AI-Driven Climate Modeling',
    ];

    for (let i = 0; i < count; i++) {
      evidence.push({
        id: crypto.randomUUID(),
        sourceType: 'paper',
        sourceId: `paper-${i + 1}`,
        sourceTitle: paperTitles[i % paperTitles.length],
        excerpt: `This study ${type === 'supporting' ? 'demonstrates' : 'questions'} the relationship...`,
        type,
        relevance: 0.5 + Math.random() * 0.5,
        confidence: 0.6 + Math.random() * 0.4,
      });
    }

    return evidence;
  }

  /**
   * Calculate confidence score from evidence
   */
  private calculateConfidenceScore(
    supporting: EvidenceReference[],
    contradicting: EvidenceReference[]
  ): number {
    const supportScore = supporting.reduce((sum, e) => sum + e.relevance * e.confidence, 0);
    const contradictScore = contradicting.reduce((sum, e) => sum + e.relevance * e.confidence, 0);

    const total = supporting.length + contradicting.length;
    if (total === 0) return 0.5;

    const netScore = (supportScore - contradictScore * 0.5) / total;
    return Math.max(0, Math.min(1, 0.5 + netScore));
  }

  /**
   * Convert score to confidence level
   */
  private scoreToConfidenceLevel(score: number): ConfidenceLevel {
    if (score >= 0.8) return 'high';
    if (score >= 0.6) return 'medium';
    if (score >= 0.4) return 'low';
    return 'speculative';
  }

  /**
   * Generate key relationships
   */
  private generateKeyRelationships(entities: string[]): Array<{ source: string; relation: string; target: string }> {
    if (entities.length < 2) return [];

    const relations = ['affects', 'correlates_with', 'causes', 'inhibits', 'activates'];
    const relationships = [];

    for (let i = 0; i < entities.length - 1; i++) {
      relationships.push({
        source: entities[i],
        relation: relations[i % relations.length],
        target: entities[i + 1],
      });
    }

    return relationships;
  }

  /**
   * Generate experiment suggestions
   */
  private generateExperimentSuggestions(type: HypothesisType, entities: string[]): string[] {
    const suggestions: Record<HypothesisType, string[]> = {
      mechanistic: [
        'ノックアウト/ノックダウン実験を実施',
        '阻害剤を用いた機能阻害実験',
        '詳細な時間経過解析',
      ],
      correlational: [
        '大規模コホート研究',
        '多変量解析による関連性検証',
        '異なる条件下での再現実験',
      ],
      predictive: [
        '予測モデルの検証実験',
        'ホールドアウトデータでの評価',
        '前向き研究の実施',
      ],
      causal: [
        '介入実験の設計と実施',
        'ランダム化比較試験',
        '因果推論モデルの適用',
      ],
      comparative: [
        '標準化された比較実験',
        'ベンチマークデータセットでの評価',
        'クロスバリデーション',
      ],
      exploratory: [
        '予備的スクリーニング',
        '網羅的データ収集',
        '質的研究の実施',
      ],
    };

    return suggestions[type] ?? ['追加実験が必要'];
  }

  /**
   * Identify knowledge gaps
   */
  async identifyKnowledgeGaps(topic: string, domain?: string): Promise<KnowledgeGap[]> {
    // Generate mock knowledge gaps (in production, use GraphRAG)
    const gaps: KnowledgeGap[] = [
      {
        id: crypto.randomUUID(),
        topic: `${topic} - メカニズム`,
        description: `The detailed mechanism of ${topic} remains unclear`,
        descriptionJa: `${topic}の詳細なメカニズムは不明確`,
        relatedEntities: this.extractEntities(topic),
        severity: 0.7,
        researchQuestions: [
          `What is the primary mechanism of ${topic}?`,
          'Are there alternative pathways?',
        ],
        relatedPaperIds: [],
        detectedAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        topic: `${topic} - 応用`,
        description: `Practical applications of ${topic} are underexplored`,
        descriptionJa: `${topic}の実用的な応用は未開拓`,
        relatedEntities: this.extractEntities(topic),
        severity: 0.5,
        researchQuestions: [
          `How can ${topic} be applied in practice?`,
          'What are the barriers to application?',
        ],
        relatedPaperIds: [],
        detectedAt: new Date(),
      },
    ];

    gaps.forEach((g) => this.gaps.set(g.id, g));
    return gaps;
  }

  /**
   * Rank hypotheses by overall score
   */
  private rankHypotheses(hypotheses: GeneratedHypothesis[]): GeneratedHypothesis[] {
    return hypotheses.sort((a, b) => {
      const scoreA = this.calculateOverallScore(a, DEFAULT_CRITERIA);
      const scoreB = this.calculateOverallScore(b, DEFAULT_CRITERIA);
      return scoreB - scoreA;
    });
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(
    hypothesis: GeneratedHypothesis,
    criteria: EvaluationCriteria
  ): number {
    return (
      hypothesis.testabilityScore * criteria.testabilityWeight +
      hypothesis.noveltyScore * criteria.noveltyWeight +
      hypothesis.impactScore * criteria.impactWeight +
      hypothesis.confidenceScore * criteria.evidenceWeight
    );
  }

  /**
   * Evaluate a hypothesis
   */
  async evaluateHypothesis(
    hypothesisId: string,
    criteria?: EvaluationCriteria
  ): Promise<HypothesisEvaluation> {
    const hypothesis = this.hypotheses.get(hypothesisId);
    if (!hypothesis) {
      throw new Error(`Hypothesis not found: ${hypothesisId}`);
    }

    const evalCriteria = criteria ?? DEFAULT_CRITERIA;

    const overallScore = this.calculateOverallScore(hypothesis, evalCriteria);

    const feedback: string[] = [];
    const recommendations: string[] = [];

    if (hypothesis.testabilityScore < 0.5) {
      feedback.push('検証可能性が低い: より具体的な予測を含めることを検討');
      recommendations.push('仮説を操作的に定義し直す');
    }

    if (hypothesis.noveltyScore < 0.5) {
      feedback.push('新規性が低い: 既存研究との差別化が必要');
      recommendations.push('既存文献をレビューし、未探索の側面を特定');
    }

    if (hypothesis.impactScore < 0.5) {
      feedback.push('インパクトが限定的: より広い文脈での意義を検討');
      recommendations.push('研究の実用的・理論的貢献を明確化');
    }

    if (hypothesis.contradictingEvidence.length > hypothesis.supportingEvidence.length) {
      feedback.push('反証エビデンスが多い: 仮説の再検討を推奨');
      recommendations.push('反証エビデンスの詳細を分析し、仮説を修正');
    }

    const evaluation: HypothesisEvaluation = {
      hypothesisId,
      testabilityScore: hypothesis.testabilityScore,
      noveltyScore: hypothesis.noveltyScore,
      impactScore: hypothesis.impactScore,
      evidenceScore: hypothesis.confidenceScore,
      overallScore,
      rank: 0, // Will be set when compared with others
      feedback,
      recommendations,
      evaluatedAt: new Date(),
    };

    this.evaluations.set(hypothesisId, evaluation);
    return evaluation;
  }

  /**
   * Get refinement suggestions
   */
  async getRefinementSuggestions(hypothesisId: string): Promise<RefinementSuggestion[]> {
    const hypothesis = this.hypotheses.get(hypothesisId);
    if (!hypothesis) {
      throw new Error(`Hypothesis not found: ${hypothesisId}`);
    }

    const suggestions: RefinementSuggestion[] = [];

    // Suggest narrowing scope if too broad
    if (hypothesis.keyEntities.length > 3) {
      suggestions.push({
        hypothesisId,
        type: 'narrow_scope',
        refinedStatement: `${hypothesis.statement} (focusing on ${hypothesis.keyEntities[0]})`,
        refinedStatementJa: `${hypothesis.statementJa}（${hypothesis.keyEntities[0]}に焦点を当てて）`,
        explanation: '仮説の範囲が広すぎる可能性があります。特定のエンティティに焦点を当てることで検証可能性が向上します。',
        expectedImprovement: 0.15,
      });
    }

    // Suggest adding constraint if testability is low
    if (hypothesis.testabilityScore < 0.5) {
      suggestions.push({
        hypothesisId,
        type: 'add_constraint',
        refinedStatement: `Under specific conditions, ${hypothesis.statement}`,
        refinedStatementJa: `特定の条件下で、${hypothesis.statementJa}`,
        explanation: '条件を追加することで、仮説がより検証可能になります。',
        expectedImprovement: 0.2,
      });
    }

    return suggestions;
  }

  /**
   * Generate research questions from hypothesis
   */
  async generateResearchQuestions(hypothesisId: string): Promise<ResearchQuestion[]> {
    const hypothesis = this.hypotheses.get(hypothesisId);
    if (!hypothesis) {
      throw new Error(`Hypothesis not found: ${hypothesisId}`);
    }

    const questions: ResearchQuestion[] = [];

    // Primary question
    questions.push({
      id: crypto.randomUUID(),
      hypothesisId,
      question: `Is it true that ${hypothesis.statement}?`,
      questionJa: `${hypothesis.statementJa}は正しいか？`,
      answerType: 'binary',
      requiredMethods: ['statistical_analysis', 'experimental_validation'],
      estimatedEffort: 3,
      priority: 5,
    });

    // Mechanism question
    if (hypothesis.type === 'mechanistic' || hypothesis.type === 'causal') {
      questions.push({
        id: crypto.randomUUID(),
        hypothesisId,
        question: 'What is the underlying mechanism?',
        questionJa: '根底にあるメカニズムは何か？',
        answerType: 'qualitative',
        requiredMethods: ['pathway_analysis', 'molecular_studies'],
        estimatedEffort: 4,
        priority: 4,
      });
    }

    // Quantitative question
    questions.push({
      id: crypto.randomUUID(),
      hypothesisId,
      question: 'What is the magnitude of the effect?',
      questionJa: '効果の大きさはどの程度か？',
      answerType: 'quantitative',
      requiredMethods: ['quantitative_analysis', 'measurement'],
      estimatedEffort: 2,
      priority: 3,
    });

    return questions;
  }

  /**
   * Update hypothesis status
   */
  async updateStatus(
    hypothesisId: string,
    status: HypothesisStatus
  ): Promise<GeneratedHypothesis> {
    const hypothesis = this.hypotheses.get(hypothesisId);
    if (!hypothesis) {
      throw new Error(`Hypothesis not found: ${hypothesisId}`);
    }

    hypothesis.status = status;
    hypothesis.updatedAt = new Date();
    return hypothesis;
  }

  /**
   * Get generation summary
   */
  async getGenerationSummary(
    hypotheses: GeneratedHypothesis[],
    requestId: string,
    topic: string
  ): Promise<GenerationSummary> {
    const byType: Record<HypothesisType, number> = {
      mechanistic: 0,
      correlational: 0,
      predictive: 0,
      causal: 0,
      comparative: 0,
      exploratory: 0,
    };

    const byConfidence: Record<ConfidenceLevel, number> = {
      high: 0,
      medium: 0,
      low: 0,
      speculative: 0,
    };

    let totalNovelty = 0;
    let totalTestability = 0;
    let totalImpact = 0;
    let topScore = 0;
    let topHypothesisId = hypotheses[0]?.id ?? '';

    for (const h of hypotheses) {
      byType[h.type]++;
      byConfidence[h.confidence]++;
      totalNovelty += h.noveltyScore;
      totalTestability += h.testabilityScore;
      totalImpact += h.impactScore;

      const score = this.calculateOverallScore(h, DEFAULT_CRITERIA);
      if (score > topScore) {
        topScore = score;
        topHypothesisId = h.id;
      }
    }

    const count = hypotheses.length || 1;

    return {
      requestId,
      topic,
      totalGenerated: hypotheses.length,
      byType,
      byConfidence,
      averageNovelty: totalNovelty / count,
      averageTestability: totalTestability / count,
      averageImpact: totalImpact / count,
      topHypothesisId,
      knowledgeGapsIdentified: this.gaps.size,
      generatedAt: new Date(),
    };
  }

  /**
   * Get hypothesis by ID
   */
  async getHypothesis(id: string): Promise<GeneratedHypothesis | undefined> {
    return this.hypotheses.get(id);
  }

  /**
   * List hypotheses for a user/lab
   */
  async listHypotheses(options: {
    userId?: string;
    labId?: string;
    status?: HypothesisStatus;
  }): Promise<GeneratedHypothesis[]> {
    let results = Array.from(this.hypotheses.values());

    if (options.userId) {
      results = results.filter((h) => h.generatedFor === options.userId);
    }
    if (options.labId) {
      results = results.filter((h) => h.labId === options.labId);
    }
    if (options.status) {
      results = results.filter((h) => h.status === options.status);
    }

    return results;
  }

  /**
   * Get knowledge gaps
   */
  async getKnowledgeGaps(topic?: string): Promise<KnowledgeGap[]> {
    let results = Array.from(this.gaps.values());
    if (topic) {
      results = results.filter((g) => g.topic.includes(topic));
    }
    return results;
  }
}

// Export singleton instance
export const hypothesisService = new HypothesisService();

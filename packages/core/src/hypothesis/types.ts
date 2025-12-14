/**
 * Hypothesis Generation Module - Types
 *
 * Requirements:
 * - HYPO-GEN-001: GraphRAG-based hypothesis generation
 * - HYPO-GEN-002: Knowledge gap identification
 * - HYPO-GEN-003: Hypothesis ranking and evaluation
 */

/**
 * Hypothesis type categories
 */
export type HypothesisType =
  | 'mechanistic' // How/why something works
  | 'correlational' // Relationship between variables
  | 'predictive' // Prediction about future observation
  | 'causal' // Cause-effect relationship
  | 'comparative' // Comparison between entities
  | 'exploratory'; // Open-ended investigation

/**
 * Hypothesis confidence level
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'speculative';

/**
 * Evidence type
 */
export type EvidenceType =
  | 'supporting' // Supports the hypothesis
  | 'contradicting' // Contradicts the hypothesis
  | 'neutral' // Neither supports nor contradicts
  | 'related'; // Related but not directly supporting/contradicting

/**
 * Hypothesis status
 */
export type HypothesisStatus =
  | 'generated' // Just generated
  | 'under_review' // Being evaluated
  | 'accepted' // Accepted for investigation
  | 'rejected' // Rejected
  | 'validated' // Experimentally validated
  | 'invalidated'; // Experimentally invalidated

/**
 * Knowledge gap definition
 */
export interface KnowledgeGap {
  id: string;
  // Topic/area with gap
  topic: string;
  // Description of what's unknown
  description: string;
  descriptionJa: string;
  // Related entities in knowledge graph
  relatedEntities: string[];
  // Gap severity (0-1)
  severity: number;
  // Potential research questions
  researchQuestions: string[];
  // Related papers that partially address this
  relatedPaperIds: string[];
  detectedAt: Date;
}

/**
 * Evidence reference
 */
export interface EvidenceReference {
  id: string;
  // Source type
  sourceType: 'paper' | 'experiment' | 'database' | 'expert_knowledge';
  // Source ID (paper ID, experiment ID, etc.)
  sourceId: string;
  // Source title/name
  sourceTitle: string;
  // Relevant excerpt/finding
  excerpt: string;
  // Evidence type
  type: EvidenceType;
  // Relevance score (0-1)
  relevance: number;
  // Confidence in this evidence (0-1)
  confidence: number;
}

/**
 * Generated hypothesis
 */
export interface GeneratedHypothesis {
  id: string;
  // Hypothesis statement
  statement: string;
  statementJa: string;
  // Hypothesis type
  type: HypothesisType;
  // Confidence level
  confidence: ConfidenceLevel;
  // Confidence score (0-1)
  confidenceScore: number;
  // Research domain
  domain: string;
  // Related knowledge gaps
  relatedGapIds: string[];
  // Supporting evidence
  supportingEvidence: EvidenceReference[];
  // Contradicting evidence
  contradictingEvidence: EvidenceReference[];
  // Key entities involved
  keyEntities: string[];
  // Key relationships
  keyRelationships: Array<{
    source: string;
    relation: string;
    target: string;
  }>;
  // Testability score (0-1, how easy to test)
  testabilityScore: number;
  // Novelty score (0-1, how novel)
  noveltyScore: number;
  // Impact score (0-1, potential impact if true)
  impactScore: number;
  // Suggested experiments to test
  suggestedExperiments: string[];
  // Related existing hypotheses
  relatedHypothesisIds: string[];
  // Status
  status: HypothesisStatus;
  // User who requested generation
  generatedFor: string;
  // Lab ID if applicable
  labId?: string;
  // Generation reasoning
  reasoning: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Hypothesis generation request
 */
export interface HypothesisGenerationRequest {
  // Research topic/question
  topic: string;
  // Domain context
  domain?: string;
  // Specific entities to focus on
  focusEntities?: string[];
  // Knowledge base ID to use
  knowledgeBaseId?: string;
  // Number of hypotheses to generate
  count?: number;
  // Hypothesis types to consider
  types?: HypothesisType[];
  // Minimum confidence threshold
  minConfidence?: number;
  // Prioritize novelty vs. evidence strength
  noveltyWeight?: number;
  // Lab ID for context
  labId?: string;
}

/**
 * Hypothesis evaluation criteria
 */
export interface EvaluationCriteria {
  // Weight for testability (0-1)
  testabilityWeight: number;
  // Weight for novelty (0-1)
  noveltyWeight: number;
  // Weight for impact (0-1)
  impactWeight: number;
  // Weight for evidence support (0-1)
  evidenceWeight: number;
  // Minimum overall score threshold
  minOverallScore: number;
}

/**
 * Hypothesis evaluation result
 */
export interface HypothesisEvaluation {
  hypothesisId: string;
  // Individual scores
  testabilityScore: number;
  noveltyScore: number;
  impactScore: number;
  evidenceScore: number;
  // Weighted overall score
  overallScore: number;
  // Ranking among generated hypotheses
  rank: number;
  // Detailed feedback
  feedback: string[];
  // Recommended actions
  recommendations: string[];
  evaluatedAt: Date;
}

/**
 * Hypothesis refinement suggestion
 */
export interface RefinementSuggestion {
  hypothesisId: string;
  // Type of refinement
  type: 'narrow_scope' | 'broaden_scope' | 'add_constraint' | 'change_focus' | 'merge' | 'split';
  // Suggested refined statement
  refinedStatement: string;
  refinedStatementJa: string;
  // Explanation
  explanation: string;
  // Expected improvement in score
  expectedImprovement: number;
}

/**
 * Hypothesis generation summary
 */
export interface GenerationSummary {
  requestId: string;
  topic: string;
  totalGenerated: number;
  byType: Record<HypothesisType, number>;
  byConfidence: Record<ConfidenceLevel, number>;
  averageNovelty: number;
  averageTestability: number;
  averageImpact: number;
  topHypothesisId: string;
  knowledgeGapsIdentified: number;
  generatedAt: Date;
}

/**
 * Research question derived from hypothesis
 */
export interface ResearchQuestion {
  id: string;
  hypothesisId: string;
  question: string;
  questionJa: string;
  // Expected answer type
  answerType: 'quantitative' | 'qualitative' | 'binary' | 'comparative';
  // Required methods/approaches
  requiredMethods: string[];
  // Estimated effort (1-5)
  estimatedEffort: number;
  // Priority (1-5)
  priority: number;
}

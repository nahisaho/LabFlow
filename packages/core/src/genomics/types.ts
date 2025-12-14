/**
 * Genomics Workflow Types
 * 
 * Provides type definitions for genomics workflows including sequence analysis,
 * variant calling, and gene expression analysis.
 */

// ============================================================================
// Sequence Types
// ============================================================================

/**
 * Sequence type
 */
export type SequenceType = 'dna' | 'rna' | 'protein';

/**
 * Sequencing platform
 */
export type SequencingPlatform = 
  | 'illumina'
  | 'pacbio'
  | 'nanopore'
  | 'ion_torrent'
  | 'solid';

/**
 * Sequence data format
 */
export type SequenceFormat = 'fastq' | 'fasta' | 'bam' | 'cram' | 'vcf' | 'bed';

/**
 * Sequence file metadata
 */
export interface SequenceFile {
  id: string;
  name: string;
  format: SequenceFormat;
  size: number;
  sequenceType: SequenceType;
  platform?: SequencingPlatform;
  readLength?: number;
  coverage?: number;
  qualityScore?: number;
  uploadedAt: Date;
}

/**
 * Reference genome
 */
export interface ReferenceGenome {
  id: string;
  name: string;
  organism: string;
  assembly: string;
  version: string;
  chromosomes: number;
  totalBases: number;
}

// ============================================================================
// Variant Types
// ============================================================================

/**
 * Variant type
 */
export type VariantType = 
  | 'snv'      // Single Nucleotide Variant
  | 'indel'    // Insertion/Deletion
  | 'mnv'      // Multi-Nucleotide Variant
  | 'sv'       // Structural Variant
  | 'cnv';     // Copy Number Variant

/**
 * Variant impact
 */
export type VariantImpact = 
  | 'high'     // Loss of function
  | 'moderate' // Missense
  | 'low'      // Synonymous
  | 'modifier'; // Non-coding

/**
 * Genomic variant
 */
export interface Variant {
  id: string;
  chromosome: string;
  position: number;
  ref: string;
  alt: string;
  type: VariantType;
  quality: number;
  filter: 'PASS' | string[];
  annotations?: VariantAnnotation;
}

/**
 * Variant annotation
 */
export interface VariantAnnotation {
  gene?: string;
  geneId?: string;
  impact: VariantImpact;
  consequence: string[];
  aminoAcidChange?: string;
  codonChange?: string;
  dbSNP?: string;
  clinVar?: {
    significance: string;
    disease?: string;
  };
  gnomAD?: {
    alleleFrequency: number;
    homozygotes: number;
  };
  prediction?: {
    sift?: { score: number; prediction: string };
    polyphen?: { score: number; prediction: string };
    cadd?: { score: number };
  };
}

// ============================================================================
// Analysis Pipeline Types
// ============================================================================

/**
 * Analysis type
 */
export type GenomicsAnalysisType =
  | 'variant_calling'
  | 'gene_expression'
  | 'methylation'
  | 'chip_seq'
  | 'rna_seq'
  | 'single_cell'
  | 'metagenomics';

/**
 * Variant calling configuration
 */
export interface VariantCallingConfig {
  sampleFiles: string[];
  referenceGenome: string;
  targetRegions?: string; // BED file
  callers: Array<'gatk' | 'deepvariant' | 'freebayes' | 'strelka'>;
  minQuality: number;
  minDepth: number;
  annotationDatabases: string[];
}

/**
 * Gene expression analysis configuration
 */
export interface GeneExpressionConfig {
  sampleFiles: string[];
  referenceGenome: string;
  annotation: string; // GTF file
  normalization: 'tpm' | 'fpkm' | 'deseq2' | 'edger';
  sampleGroups: Array<{
    name: string;
    samples: string[];
  }>;
  contrasts?: Array<{
    name: string;
    numerator: string;
    denominator: string;
  }>;
}

/**
 * Single cell analysis configuration
 */
export interface SingleCellConfig {
  sampleFiles: string[];
  platform: '10x_genomics' | 'smart_seq' | 'drop_seq';
  minGenes: number;
  maxGenes: number;
  minCells: number;
  maxMitochondrial: number;
  clusteringResolution: number;
  expectedCells?: number;
}

// ============================================================================
// Result Types
// ============================================================================

/**
 * Variant calling result
 */
export interface VariantCallingResult {
  id: string;
  config: VariantCallingConfig;
  createdAt: Date;
  totalVariants: number;
  variantsByChr: Record<string, number>;
  variantsByType: Record<VariantType, number>;
  variantsByImpact: Record<VariantImpact, number>;
  qualityMetrics: {
    tiTvRatio: number;
    hetHomRatio: number;
    meanDepth: number;
    callRate: number;
  };
  topVariants: Variant[];
  vcfFile?: string;
}

/**
 * Differential expression result
 */
export interface DifferentialExpressionResult {
  geneId: string;
  geneName: string;
  baseMean: number;
  log2FoldChange: number;
  pValue: number;
  adjustedPValue: number;
  significant: boolean;
}

/**
 * Gene expression result
 */
export interface GeneExpressionResult {
  id: string;
  config: GeneExpressionConfig;
  createdAt: Date;
  totalGenes: number;
  expressedGenes: number;
  sampleCorrelations: Record<string, Record<string, number>>;
  differentialExpression?: {
    contrast: string;
    results: DifferentialExpressionResult[];
    upregulated: number;
    downregulated: number;
  }[];
  enrichment?: {
    goTerms: Array<{
      term: string;
      description: string;
      pValue: number;
      genes: string[];
    }>;
    pathways: Array<{
      pathway: string;
      source: string;
      pValue: number;
      genes: string[];
    }>;
  };
}

/**
 * Cell cluster
 */
export interface CellCluster {
  id: string;
  name: string;
  cellCount: number;
  percentage: number;
  markerGenes: Array<{
    gene: string;
    avgExpression: number;
    pctExpressed: number;
    log2FC: number;
    pValue: number;
  }>;
  predictedCellType?: string;
  confidence?: number;
}

/**
 * Single cell result
 */
export interface SingleCellResult {
  id: string;
  config: SingleCellConfig;
  createdAt: Date;
  qcMetrics: {
    totalCells: number;
    filteredCells: number;
    totalGenes: number;
    medianGenes: number;
    medianUMIs: number;
    medianMitochondrial: number;
  };
  clusters: CellCluster[];
  umap?: {
    coordinates: Array<{ x: number; y: number; cluster: string }>;
  };
  trajectoryAnalysis?: {
    rootCluster: string;
    branches: Array<{
      from: string;
      to: string;
      pseudotime: number;
    }>;
  };
}

// ============================================================================
// Workflow Types
// ============================================================================

/**
 * Genomics workflow status
 */
export type GenomicsWorkflowStatus =
  | 'draft'
  | 'validating'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Genomics workflow
 */
export interface GenomicsWorkflow {
  id: string;
  name: string;
  description?: string;
  type: GenomicsAnalysisType;
  status: GenomicsWorkflowStatus;
  createdAt: Date;
  updatedAt: Date;
  config: VariantCallingConfig | GeneExpressionConfig | SingleCellConfig;
  results?: VariantCallingResult | GeneExpressionResult | SingleCellResult;
  progress?: {
    currentStep: string;
    totalSteps: number;
    completedSteps: number;
    estimatedTimeRemaining?: number;
  };
  logs?: Array<{
    timestamp: Date;
    level: 'info' | 'warning' | 'error';
    message: string;
  }>;
}

// ============================================================================
// Service Input/Output Types
// ============================================================================

export interface CreateVariantCallingInput {
  name: string;
  description?: string;
  config: VariantCallingConfig;
}

export interface CreateGeneExpressionInput {
  name: string;
  description?: string;
  config: GeneExpressionConfig;
}

export interface CreateSingleCellInput {
  name: string;
  description?: string;
  config: SingleCellConfig;
}

export interface GenomicsWorkflowListOptions {
  type?: GenomicsAnalysisType;
  status?: GenomicsWorkflowStatus;
  limit?: number;
  offset?: number;
}

export interface UploadSequenceInput {
  name: string;
  format: SequenceFormat;
  sequenceType: SequenceType;
  platform?: SequencingPlatform;
  file: File | Buffer;
}

/**
 * Learning Module Types
 * 
 * Types for interactive tutorials, courses, and learning progress tracking.
 */

// ============================================================================
// Course Structure Types
// ============================================================================

/**
 * Learning level
 */
export type LearningLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Domain area
 */
export type LearningDomain = 
  | 'drug_discovery'
  | 'materials_science'
  | 'climate_science'
  | 'genomics'
  | 'machine_learning'
  | 'data_analysis'
  | 'workflow_automation';

/**
 * Content type
 */
export type ContentType = 
  | 'video'
  | 'text'
  | 'interactive'
  | 'quiz'
  | 'code_exercise'
  | 'project'
  | 'simulation';

/**
 * Course category
 */
export interface CourseCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  domain: LearningDomain;
  courseCount: number;
}

/**
 * Course
 */
export interface Course {
  id: string;
  title: string;
  description: string;
  domain: LearningDomain;
  level: LearningLevel;
  duration: number; // minutes
  modules: CourseModule[];
  prerequisites: string[]; // course IDs
  skills: string[];
  instructor: Instructor;
  thumbnail: string;
  rating: number;
  enrollmentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Course module (section)
 */
export interface CourseModule {
  id: string;
  title: string;
  description: string;
  order: number;
  duration: number; // minutes
  lessons: Lesson[];
}

/**
 * Lesson
 */
export interface Lesson {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  duration: number; // minutes
  order: number;
  content: LessonContent;
  resources: Resource[];
}

/**
 * Lesson content (varies by type)
 */
export type LessonContent = 
  | VideoContent
  | TextContent
  | InteractiveContent
  | QuizContent
  | CodeExerciseContent
  | ProjectContent
  | SimulationContent;

export interface VideoContent {
  type: 'video';
  url: string;
  transcript?: string;
  chapters: Array<{ title: string; timestamp: number }>;
}

export interface TextContent {
  type: 'text';
  markdown: string;
  images: Array<{ url: string; caption: string }>;
}

export interface InteractiveContent {
  type: 'interactive';
  componentType: string;
  props: Record<string, unknown>;
}

export interface QuizContent {
  type: 'quiz';
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit?: number; // minutes
}

export interface CodeExerciseContent {
  type: 'code_exercise';
  language: string;
  starterCode: string;
  solution: string;
  testCases: TestCase[];
  hints: string[];
}

export interface ProjectContent {
  type: 'project';
  description: string;
  requirements: string[];
  milestones: Milestone[];
  datasets: string[];
  submissionInstructions: string;
}

export interface SimulationContent {
  type: 'simulation';
  simulationType: string;
  parameters: Record<string, unknown>;
  objectives: string[];
}

/**
 * Quiz question
 */
export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'multiple_select' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  points: number;
}

/**
 * Test case for code exercises
 */
export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

/**
 * Project milestone
 */
export interface Milestone {
  id: string;
  title: string;
  description: string;
  deliverables: string[];
  order: number;
}

/**
 * Resource (additional material)
 */
export interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'notebook' | 'dataset' | 'link' | 'paper';
  url: string;
}

/**
 * Instructor
 */
export interface Instructor {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatar: string;
  expertise: string[];
}

// ============================================================================
// Progress Tracking Types
// ============================================================================

/**
 * Course enrollment
 */
export interface CourseEnrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  progress: number; // 0-100
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped';
  lastAccessedAt: Date;
  moduleProgress: ModuleProgress[];
}

/**
 * Module progress
 */
export interface ModuleProgress {
  moduleId: string;
  progress: number; // 0-100
  completedAt?: Date;
  lessonProgress: LessonProgress[];
}

/**
 * Lesson progress
 */
export interface LessonProgress {
  lessonId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number; // 0-100
  startedAt?: Date;
  completedAt?: Date;
  timeSpent: number; // minutes
  attempts: number;
  score?: number; // for quizzes
}

/**
 * Quiz attempt
 */
export interface QuizAttempt {
  id: string;
  userId: string;
  lessonId: string;
  startedAt: Date;
  completedAt?: Date;
  answers: QuizAnswer[];
  score: number;
  passed: boolean;
  timeSpent: number; // seconds
}

/**
 * Quiz answer
 */
export interface QuizAnswer {
  questionId: string;
  answer: string | string[];
  isCorrect: boolean;
  points: number;
}

/**
 * Code submission
 */
export interface CodeSubmission {
  id: string;
  userId: string;
  lessonId: string;
  code: string;
  language: string;
  submittedAt: Date;
  testResults: TestResult[];
  passed: boolean;
  executionTime: number; // ms
}

/**
 * Test result
 */
export interface TestResult {
  testCaseId: string;
  passed: boolean;
  output: string;
  error?: string;
}

/**
 * Project submission
 */
export interface ProjectSubmission {
  id: string;
  userId: string;
  lessonId: string;
  submittedAt: Date;
  repositoryUrl?: string;
  files: Array<{ name: string; url: string }>;
  milestoneStatuses: Array<{ milestoneId: string; completed: boolean }>;
  feedback?: ProjectFeedback;
  status: 'submitted' | 'under_review' | 'approved' | 'needs_revision';
}

/**
 * Project feedback
 */
export interface ProjectFeedback {
  reviewerId: string;
  reviewerName: string;
  score: number;
  comments: string;
  reviewedAt: Date;
}

// ============================================================================
// Achievement & Certification Types
// ============================================================================

/**
 * Achievement
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'course_completion' | 'streak' | 'skill' | 'special';
  requirement: string;
  points: number;
}

/**
 * User achievement
 */
export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  earnedAt: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Certificate
 */
export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  userName: string;
  issuedAt: Date;
  expiresAt?: Date;
  verificationCode: string;
  pdfUrl: string;
}

/**
 * Learning path
 */
export interface LearningPath {
  id: string;
  name: string;
  description: string;
  domain: LearningDomain;
  level: LearningLevel;
  courses: string[]; // course IDs in order
  estimatedDuration: number; // hours
  skills: string[];
  thumbnail: string;
}

/**
 * User learning path enrollment
 */
export interface LearningPathEnrollment {
  id: string;
  userId: string;
  pathId: string;
  enrolledAt: Date;
  progress: number; // 0-100
  currentCourseIndex: number;
  completedAt?: Date;
}

// ============================================================================
// Service Input/Output Types
// ============================================================================

export interface EnrollCourseInput {
  userId: string;
  courseId: string;
}

export interface UpdateLessonProgressInput {
  userId: string;
  courseId: string;
  lessonId: string;
  progress: number;
  timeSpent: number;
}

export interface SubmitQuizInput {
  userId: string;
  lessonId: string;
  answers: Array<{ questionId: string; answer: string | string[] }>;
}

export interface SubmitCodeInput {
  userId: string;
  lessonId: string;
  code: string;
  language: string;
}

export interface SearchCoursesOptions {
  domain?: LearningDomain;
  level?: LearningLevel;
  query?: string;
  limit?: number;
  offset?: number;
}

/**
 * Learning Service
 * 
 * Provides interactive tutorials, courses, progress tracking,
 * and certification for AI in Science education.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  Course,
  CourseCategory,
  CourseModule,
  Lesson,
  LearningDomain,
  LearningLevel,
  CourseEnrollment,
  ModuleProgress,
  LessonProgress,
  QuizAttempt,
  QuizAnswer,
  CodeSubmission,
  ProjectSubmission,
  Achievement,
  UserAchievement,
  Certificate,
  LearningPath,
  LearningPathEnrollment,
  Instructor,
  EnrollCourseInput,
  UpdateLessonProgressInput,
  SubmitQuizInput,
  SubmitCodeInput,
  SearchCoursesOptions,
} from './types.js';

export class LearningService {
  // In-memory storage
  private courses: Map<string, Course> = new Map();
  private categories: Map<string, CourseCategory> = new Map();
  private enrollments: Map<string, CourseEnrollment> = new Map();
  private quizAttempts: Map<string, QuizAttempt[]> = new Map();
  private codeSubmissions: Map<string, CodeSubmission[]> = new Map();
  private projectSubmissions: Map<string, ProjectSubmission[]> = new Map();
  private achievements: Map<string, Achievement> = new Map();
  private userAchievements: Map<string, UserAchievement[]> = new Map();
  private certificates: Map<string, Certificate[]> = new Map();
  private learningPaths: Map<string, LearningPath> = new Map();
  private pathEnrollments: Map<string, LearningPathEnrollment[]> = new Map();

  constructor() {
    this.initializeCourses();
    this.initializeAchievements();
    this.initializeLearningPaths();
  }

  // ============================================================================
  // Course Catalog
  // ============================================================================

  private initializeCourses(): void {
    // Create instructors
    const instructors: Instructor[] = [
      {
        id: 'inst-1',
        name: '田中 博士',
        title: '創薬AI研究者',
        bio: 'AI創薬分野で15年の経験を持つ研究者',
        avatar: '/avatars/tanaka.jpg',
        expertise: ['創薬', '機械学習', '分子シミュレーション'],
      },
      {
        id: 'inst-2',
        name: '鈴木 教授',
        title: '気候科学者',
        bio: '気候モデリングとAI予測の専門家',
        avatar: '/avatars/suzuki.jpg',
        expertise: ['気候科学', '予測モデル', 'データ分析'],
      },
      {
        id: 'inst-3',
        name: '山田 研究員',
        title: 'ゲノミクス専門家',
        bio: 'シングルセル解析とバイオインフォマティクスの第一人者',
        avatar: '/avatars/yamada.jpg',
        expertise: ['ゲノミクス', 'バイオインフォマティクス', 'RNA-seq'],
      },
    ];

    // Initialize categories
    const categoryData: CourseCategory[] = [
      { id: 'cat-1', name: '創薬・医薬品開発', description: 'AI創薬の基礎から実践まで', icon: '💊', domain: 'drug_discovery', courseCount: 5 },
      { id: 'cat-2', name: '材料科学', description: '材料設計とシミュレーション', icon: '🔬', domain: 'materials_science', courseCount: 3 },
      { id: 'cat-3', name: '気候科学', description: '気候予測とモデリング', icon: '🌍', domain: 'climate_science', courseCount: 4 },
      { id: 'cat-4', name: 'ゲノミクス', description: '遺伝子解析とバイオインフォマティクス', icon: '🧬', domain: 'genomics', courseCount: 4 },
      { id: 'cat-5', name: '機械学習基礎', description: 'AI/MLの基礎知識', icon: '🤖', domain: 'machine_learning', courseCount: 6 },
    ];
    categoryData.forEach(c => this.categories.set(c.id, c));

    // Create sample courses
    const courses: Course[] = [
      {
        id: 'course-1',
        title: 'AI創薬入門：分子設計の基礎',
        description: 'GraphRAGと分子生成モデルを使った創薬の基礎を学びます',
        domain: 'drug_discovery',
        level: 'beginner',
        duration: 240,
        prerequisites: [],
        skills: ['分子表現', 'SMILES', 'GraphRAG', '分子生成'],
        instructor: instructors[0],
        thumbnail: '/courses/drug-discovery-intro.jpg',
        rating: 4.8,
        enrollmentCount: 1250,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-06-01'),
        modules: [
          {
            id: 'mod-1-1',
            title: '分子表現の基礎',
            description: 'SMILES、分子グラフ、フィンガープリント',
            order: 1,
            duration: 60,
            lessons: [
              {
                id: 'les-1-1-1',
                title: 'SMILES表記法',
                description: '分子のSMILES表現を理解する',
                type: 'video',
                duration: 15,
                order: 1,
                content: { type: 'video', url: '/videos/smiles-intro.mp4', chapters: [] },
                resources: [],
              },
              {
                id: 'les-1-1-2',
                title: '分子グラフ入門',
                description: 'グラフニューラルネットワークと分子',
                type: 'interactive',
                duration: 20,
                order: 2,
                content: { type: 'interactive', componentType: 'MoleculeViewer', props: {} },
                resources: [],
              },
              {
                id: 'les-1-1-3',
                title: '理解度チェック',
                description: '分子表現の確認クイズ',
                type: 'quiz',
                duration: 10,
                order: 3,
                content: {
                  type: 'quiz',
                  passingScore: 70,
                  questions: [
                    {
                      id: 'q1',
                      question: 'SMILESは何の略ですか？',
                      type: 'multiple_choice',
                      options: [
                        'Simplified Molecular Input Line Entry System',
                        'Simple Molecular Information Language Entry System',
                        'Structured Molecular Input Listing Entry Syntax',
                      ],
                      correctAnswer: 'Simplified Molecular Input Line Entry System',
                      explanation: 'SMILESはSimplified Molecular Input Line Entry Systemの略です',
                      points: 10,
                    },
                  ],
                },
                resources: [],
              },
            ],
          },
          {
            id: 'mod-1-2',
            title: 'GraphRAGによる分子検索',
            description: '知識グラフを使った類似分子検索',
            order: 2,
            duration: 90,
            lessons: [
              {
                id: 'les-1-2-1',
                title: 'GraphRAGの仕組み',
                description: 'グラフベースの検索拡張生成',
                type: 'text',
                duration: 25,
                order: 1,
                content: { type: 'text', markdown: '# GraphRAG入門\n\nGraphRAGは...', images: [] },
                resources: [],
              },
              {
                id: 'les-1-2-2',
                title: '実践：分子検索システム構築',
                description: 'PythonでGraphRAGを実装',
                type: 'code_exercise',
                duration: 45,
                order: 2,
                content: {
                  type: 'code_exercise',
                  language: 'python',
                  starterCode: '# GraphRAG検索の実装\nimport labflow\n\n# TODO: 実装してください',
                  solution: '# 解答コード',
                  testCases: [
                    { id: 'tc1', input: 'CCO', expectedOutput: 'エタノール', isHidden: false },
                  ],
                  hints: ['labflow.graphrag.search()を使用します'],
                },
                resources: [],
              },
            ],
          },
        ],
      },
      {
        id: 'course-2',
        title: '気候予測AIの実践',
        description: 'Aurora AIを使った気象・気候予測を実践的に学ぶ',
        domain: 'climate_science',
        level: 'intermediate',
        duration: 360,
        prerequisites: ['course-ml-basic'],
        skills: ['気候モデル', '時系列予測', 'Aurora AI', 'SSPシナリオ'],
        instructor: instructors[1],
        thumbnail: '/courses/climate-prediction.jpg',
        rating: 4.6,
        enrollmentCount: 890,
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date('2024-07-15'),
        modules: [
          {
            id: 'mod-2-1',
            title: '気候データの理解',
            description: '気象データの種類と前処理',
            order: 1,
            duration: 90,
            lessons: [
              {
                id: 'les-2-1-1',
                title: '気候変数と単位',
                description: '温度、降水量、風速などの理解',
                type: 'text',
                duration: 30,
                order: 1,
                content: { type: 'text', markdown: '# 気候変数\n\n気候データには...', images: [] },
                resources: [],
              },
            ],
          },
        ],
      },
      {
        id: 'course-3',
        title: 'シングルセル解析入門',
        description: 'scRNA-seqデータの解析手法をマスター',
        domain: 'genomics',
        level: 'intermediate',
        duration: 300,
        prerequisites: [],
        skills: ['scRNA-seq', '次元削減', 'クラスタリング', 'マーカー遺伝子'],
        instructor: instructors[2],
        thumbnail: '/courses/single-cell.jpg',
        rating: 4.9,
        enrollmentCount: 1100,
        createdAt: new Date('2024-03-10'),
        updatedAt: new Date('2024-08-01'),
        modules: [
          {
            id: 'mod-3-1',
            title: 'scRNA-seq基礎',
            description: 'シングルセルシーケンシングの原理',
            order: 1,
            duration: 60,
            lessons: [
              {
                id: 'les-3-1-1',
                title: 'シングルセル技術の概要',
                description: '10x Genomics、Smart-seq2など',
                type: 'video',
                duration: 20,
                order: 1,
                content: { type: 'video', url: '/videos/sc-intro.mp4', chapters: [] },
                resources: [],
              },
            ],
          },
        ],
      },
      // 実践プロジェクトコース（Level 3）
      {
        id: 'course-4',
        title: '実践プロジェクト：創薬パイプライン構築',
        description: '実際のデータを使ったEnd-to-End創薬ワークフローの構築',
        domain: 'drug_discovery',
        level: 'advanced',
        duration: 600,
        prerequisites: ['course-1'],
        skills: ['パイプライン設計', 'モデル統合', 'バリデーション', '本番デプロイ'],
        instructor: instructors[0],
        thumbnail: '/courses/drug-pipeline.jpg',
        rating: 4.7,
        enrollmentCount: 450,
        createdAt: new Date('2024-04-01'),
        updatedAt: new Date('2024-09-01'),
        modules: [
          {
            id: 'mod-4-1',
            title: 'プロジェクト概要',
            description: 'プロジェクトの目標と要件',
            order: 1,
            duration: 30,
            lessons: [
              {
                id: 'les-4-1-1',
                title: 'プロジェクト紹介',
                description: '創薬パイプラインの全体像',
                type: 'video',
                duration: 15,
                order: 1,
                content: { type: 'video', url: '/videos/project-intro.mp4', chapters: [] },
                resources: [],
              },
              {
                id: 'les-4-1-2',
                title: '実践課題',
                description: 'End-to-Endパイプラインの構築',
                type: 'project',
                duration: 480,
                order: 2,
                content: {
                  type: 'project',
                  description: '創薬パイプラインを構築し、リード化合物を同定してください',
                  requirements: [
                    'GraphRAGによる標的タンパク質検索',
                    '分子生成モデルによる候補化合物生成',
                    'ADMET予測によるフィルタリング',
                    'ドッキングシミュレーション',
                  ],
                  milestones: [
                    { id: 'ms1', title: '標的同定', description: '疾患関連タンパク質の同定', deliverables: ['標的リスト'], order: 1 },
                    { id: 'ms2', title: '候補生成', description: '1000化合物の生成', deliverables: ['SMILES一覧'], order: 2 },
                    { id: 'ms3', title: 'スクリーニング', description: 'ADMET・ドッキング評価', deliverables: ['評価レポート'], order: 3 },
                    { id: 'ms4', title: '最終報告', description: 'トップ10化合物の提案', deliverables: ['最終レポート'], order: 4 },
                  ],
                  datasets: ['ChEMBL', 'PDB', 'DrugBank'],
                  submissionInstructions: 'GitHubリポジトリのURLとレポートを提出してください',
                },
                resources: [],
              },
            ],
          },
        ],
      },
    ];

    courses.forEach(c => this.courses.set(c.id, c));
  }

  private initializeAchievements(): void {
    const achievements: Achievement[] = [
      { id: 'ach-1', name: 'ファーストステップ', description: '最初のコースを完了', icon: '🎯', type: 'course_completion', requirement: '1コース完了', points: 100 },
      { id: 'ach-2', name: '学習マスター', description: '5つのコースを完了', icon: '🏆', type: 'course_completion', requirement: '5コース完了', points: 500 },
      { id: 'ach-3', name: '7日連続', description: '7日連続で学習', icon: '🔥', type: 'streak', requirement: '7日連続', points: 200 },
      { id: 'ach-4', name: '創薬スペシャリスト', description: '創薬コースをすべて完了', icon: '💊', type: 'skill', requirement: '創薬パス完了', points: 1000 },
      { id: 'ach-5', name: 'コードマスター', description: '50個のコード演習を完了', icon: '💻', type: 'special', requirement: '50コード演習', points: 750 },
    ];
    achievements.forEach(a => this.achievements.set(a.id, a));
  }

  private initializeLearningPaths(): void {
    const paths: LearningPath[] = [
      {
        id: 'path-1',
        name: 'AI創薬スペシャリスト',
        description: 'ゼロからAI創薬のプロフェッショナルへ',
        domain: 'drug_discovery',
        level: 'beginner',
        courses: ['course-ml-basic', 'course-1', 'course-4'],
        estimatedDuration: 40,
        skills: ['機械学習', '分子設計', 'GraphRAG', '創薬パイプライン'],
        thumbnail: '/paths/drug-discovery.jpg',
      },
      {
        id: 'path-2',
        name: '気候科学AIエンジニア',
        description: '気候予測とモデリングのスペシャリストへ',
        domain: 'climate_science',
        level: 'intermediate',
        courses: ['course-2'],
        estimatedDuration: 30,
        skills: ['気候モデル', 'Aurora AI', 'データ分析'],
        thumbnail: '/paths/climate-science.jpg',
      },
      {
        id: 'path-3',
        name: 'ゲノミクスデータサイエンティスト',
        description: 'バイオインフォマティクスのマスターへ',
        domain: 'genomics',
        level: 'intermediate',
        courses: ['course-3'],
        estimatedDuration: 35,
        skills: ['scRNA-seq', 'バイオインフォマティクス', 'データ解析'],
        thumbnail: '/paths/genomics.jpg',
      },
    ];
    paths.forEach(p => this.learningPaths.set(p.id, p));
  }

  // ============================================================================
  // Course Management
  // ============================================================================

  /**
   * Get all course categories
   */
  async getCategories(): Promise<CourseCategory[]> {
    return Array.from(this.categories.values());
  }

  /**
   * Search courses
   */
  async searchCourses(options: SearchCoursesOptions): Promise<{
    courses: Course[];
    total: number;
    hasMore: boolean;
  }> {
    let filtered = Array.from(this.courses.values());

    if (options.domain) {
      filtered = filtered.filter(c => c.domain === options.domain);
    }
    if (options.level) {
      filtered = filtered.filter(c => c.level === options.level);
    }
    if (options.query) {
      const query = options.query.toLowerCase();
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.skills.some(s => s.toLowerCase().includes(query))
      );
    }

    const total = filtered.length;
    const offset = options.offset || 0;
    const limit = options.limit || 20;
    const courses = filtered.slice(offset, offset + limit);

    return {
      courses,
      total,
      hasMore: offset + courses.length < total,
    };
  }

  /**
   * Get course by ID
   */
  async getCourse(id: string): Promise<Course | null> {
    return this.courses.get(id) || null;
  }

  /**
   * Get featured courses
   */
  async getFeaturedCourses(): Promise<Course[]> {
    return Array.from(this.courses.values())
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6);
  }

  /**
   * Get popular courses
   */
  async getPopularCourses(): Promise<Course[]> {
    return Array.from(this.courses.values())
      .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
      .slice(0, 6);
  }

  // ============================================================================
  // Enrollment & Progress
  // ============================================================================

  /**
   * Enroll in a course
   */
  async enrollCourse(input: EnrollCourseInput): Promise<CourseEnrollment> {
    const course = this.courses.get(input.courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const existingEnrollment = Array.from(this.enrollments.values()).find(
      e => e.userId === input.userId && e.courseId === input.courseId
    );
    if (existingEnrollment) {
      return existingEnrollment;
    }

    const moduleProgress: ModuleProgress[] = course.modules.map(m => ({
      moduleId: m.id,
      progress: 0,
      lessonProgress: m.lessons.map(l => ({
        lessonId: l.id,
        status: 'not_started' as const,
        progress: 0,
        timeSpent: 0,
        attempts: 0,
      })),
    }));

    const enrollment: CourseEnrollment = {
      id: uuidv4(),
      userId: input.userId,
      courseId: input.courseId,
      enrolledAt: new Date(),
      progress: 0,
      status: 'enrolled',
      lastAccessedAt: new Date(),
      moduleProgress,
    };

    this.enrollments.set(enrollment.id, enrollment);

    // Update course enrollment count
    course.enrollmentCount++;

    return enrollment;
  }

  /**
   * Get user's enrollments
   */
  async getUserEnrollments(userId: string): Promise<CourseEnrollment[]> {
    return Array.from(this.enrollments.values()).filter(e => e.userId === userId);
  }

  /**
   * Get enrollment by course
   */
  async getEnrollment(userId: string, courseId: string): Promise<CourseEnrollment | null> {
    return Array.from(this.enrollments.values()).find(
      e => e.userId === userId && e.courseId === courseId
    ) || null;
  }

  /**
   * Update lesson progress
   */
  async updateLessonProgress(input: UpdateLessonProgressInput): Promise<CourseEnrollment> {
    const enrollment = await this.getEnrollment(input.userId, input.courseId);
    if (!enrollment) {
      throw new Error('Not enrolled in this course');
    }

    // Find and update lesson progress
    for (const moduleProgress of enrollment.moduleProgress) {
      const lessonProgress = moduleProgress.lessonProgress.find(
        lp => lp.lessonId === input.lessonId
      );
      if (lessonProgress) {
        if (lessonProgress.status === 'not_started') {
          lessonProgress.startedAt = new Date();
        }
        lessonProgress.progress = Math.max(lessonProgress.progress, input.progress);
        lessonProgress.timeSpent += input.timeSpent;
        
        if (input.progress >= 100) {
          lessonProgress.status = 'completed';
          lessonProgress.completedAt = new Date();
        } else {
          lessonProgress.status = 'in_progress';
        }
        break;
      }
    }

    // Recalculate module and course progress
    this.recalculateProgress(enrollment);

    enrollment.lastAccessedAt = new Date();
    if (enrollment.status === 'enrolled') {
      enrollment.status = 'in_progress';
      enrollment.startedAt = new Date();
    }

    // Check for course completion
    if (enrollment.progress >= 100 && enrollment.status !== 'completed') {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
      await this.issueCertificate(input.userId, input.courseId);
    }

    this.enrollments.set(enrollment.id, enrollment);
    return enrollment;
  }

  private recalculateProgress(enrollment: CourseEnrollment): void {
    let totalLessons = 0;
    let completedLessons = 0;

    for (const moduleProgress of enrollment.moduleProgress) {
      const moduleLessons = moduleProgress.lessonProgress.length;
      const moduleCompleted = moduleProgress.lessonProgress.filter(
        lp => lp.status === 'completed'
      ).length;

      totalLessons += moduleLessons;
      completedLessons += moduleCompleted;

      moduleProgress.progress = moduleLessons > 0
        ? Math.round((moduleCompleted / moduleLessons) * 100)
        : 0;

      if (moduleProgress.progress >= 100 && !moduleProgress.completedAt) {
        moduleProgress.completedAt = new Date();
      }
    }

    enrollment.progress = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;
  }

  // ============================================================================
  // Quiz & Code Submissions
  // ============================================================================

  /**
   * Submit quiz answers
   */
  async submitQuiz(input: SubmitQuizInput): Promise<QuizAttempt> {
    const attempt: QuizAttempt = {
      id: uuidv4(),
      userId: input.userId,
      lessonId: input.lessonId,
      startedAt: new Date(),
      completedAt: new Date(),
      answers: [],
      score: 0,
      passed: false,
      timeSpent: 0,
    };

    // Find the lesson and grade
    let totalPoints = 0;
    let earnedPoints = 0;

    for (const course of this.courses.values()) {
      for (const module of course.modules) {
        const lesson = module.lessons.find(l => l.id === input.lessonId);
        if (lesson && lesson.content.type === 'quiz') {
          const quizContent = lesson.content;
          for (const answer of input.answers) {
            const question = quizContent.questions.find(q => q.id === answer.questionId);
            if (question) {
              const isCorrect = Array.isArray(question.correctAnswer)
                ? JSON.stringify(answer.answer) === JSON.stringify(question.correctAnswer)
                : answer.answer === question.correctAnswer;
              
              totalPoints += question.points;
              if (isCorrect) {
                earnedPoints += question.points;
              }

              attempt.answers.push({
                questionId: answer.questionId,
                answer: answer.answer,
                isCorrect,
                points: isCorrect ? question.points : 0,
              });
            }
          }
          attempt.score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
          attempt.passed = attempt.score >= quizContent.passingScore;
          break;
        }
      }
    }

    // Store attempt
    const userAttempts = this.quizAttempts.get(input.userId) || [];
    userAttempts.push(attempt);
    this.quizAttempts.set(input.userId, userAttempts);

    return attempt;
  }

  /**
   * Submit code exercise
   */
  async submitCode(input: SubmitCodeInput): Promise<CodeSubmission> {
    const submission: CodeSubmission = {
      id: uuidv4(),
      userId: input.userId,
      lessonId: input.lessonId,
      code: input.code,
      language: input.language,
      submittedAt: new Date(),
      testResults: [],
      passed: false,
      executionTime: 0,
    };

    // Find lesson and run tests (mock)
    for (const course of this.courses.values()) {
      for (const module of course.modules) {
        const lesson = module.lessons.find(l => l.id === input.lessonId);
        if (lesson && lesson.content.type === 'code_exercise') {
          const codeContent = lesson.content;
          
          // Mock test execution
          for (const testCase of codeContent.testCases) {
            const passed = Math.random() > 0.3; // Mock: 70% pass rate
            submission.testResults.push({
              testCaseId: testCase.id,
              passed,
              output: passed ? testCase.expectedOutput : 'Error: assertion failed',
              error: passed ? undefined : 'Test failed',
            });
          }
          
          submission.passed = submission.testResults.every(r => r.passed);
          submission.executionTime = Math.random() * 1000;
          break;
        }
      }
    }

    // Store submission
    const userSubmissions = this.codeSubmissions.get(input.userId) || [];
    userSubmissions.push(submission);
    this.codeSubmissions.set(input.userId, userSubmissions);

    return submission;
  }

  // ============================================================================
  // Achievements & Certificates
  // ============================================================================

  /**
   * Get all achievements
   */
  async getAllAchievements(): Promise<Achievement[]> {
    return Array.from(this.achievements.values());
  }

  /**
   * Get user's achievements
   */
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return this.userAchievements.get(userId) || [];
  }

  /**
   * Award achievement
   */
  async awardAchievement(userId: string, achievementId: string): Promise<UserAchievement> {
    const achievement = this.achievements.get(achievementId);
    if (!achievement) {
      throw new Error('Achievement not found');
    }

    const userAchievement: UserAchievement = {
      id: uuidv4(),
      userId,
      achievementId,
      earnedAt: new Date(),
    };

    const userAchievements = this.userAchievements.get(userId) || [];
    userAchievements.push(userAchievement);
    this.userAchievements.set(userId, userAchievements);

    return userAchievement;
  }

  /**
   * Issue certificate
   */
  async issueCertificate(userId: string, courseId: string): Promise<Certificate> {
    const course = this.courses.get(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const certificate: Certificate = {
      id: uuidv4(),
      userId,
      courseId,
      courseName: course.title,
      userName: `User ${userId.substring(0, 8)}`,
      issuedAt: new Date(),
      verificationCode: `LF-${uuidv4().substring(0, 8).toUpperCase()}`,
      pdfUrl: `/certificates/${uuidv4()}.pdf`,
    };

    const userCertificates = this.certificates.get(userId) || [];
    userCertificates.push(certificate);
    this.certificates.set(userId, userCertificates);

    // Award course completion achievement
    const completedCourses = userCertificates.length;
    if (completedCourses === 1) {
      await this.awardAchievement(userId, 'ach-1');
    }
    if (completedCourses === 5) {
      await this.awardAchievement(userId, 'ach-2');
    }

    return certificate;
  }

  /**
   * Get user's certificates
   */
  async getUserCertificates(userId: string): Promise<Certificate[]> {
    return this.certificates.get(userId) || [];
  }

  /**
   * Verify certificate
   */
  async verifyCertificate(verificationCode: string): Promise<Certificate | null> {
    for (const userCerts of this.certificates.values()) {
      const cert = userCerts.find(c => c.verificationCode === verificationCode);
      if (cert) return cert;
    }
    return null;
  }

  // ============================================================================
  // Learning Paths
  // ============================================================================

  /**
   * Get all learning paths
   */
  async getLearningPaths(): Promise<LearningPath[]> {
    return Array.from(this.learningPaths.values());
  }

  /**
   * Get learning path by ID
   */
  async getLearningPath(id: string): Promise<LearningPath | null> {
    return this.learningPaths.get(id) || null;
  }

  /**
   * Enroll in learning path
   */
  async enrollLearningPath(userId: string, pathId: string): Promise<LearningPathEnrollment> {
    const path = this.learningPaths.get(pathId);
    if (!path) {
      throw new Error('Learning path not found');
    }

    const enrollment: LearningPathEnrollment = {
      id: uuidv4(),
      userId,
      pathId,
      enrolledAt: new Date(),
      progress: 0,
      currentCourseIndex: 0,
    };

    const userEnrollments = this.pathEnrollments.get(userId) || [];
    userEnrollments.push(enrollment);
    this.pathEnrollments.set(userId, userEnrollments);

    return enrollment;
  }

  /**
   * Get user's learning statistics
   */
  async getUserStats(userId: string): Promise<{
    totalCourses: number;
    completedCourses: number;
    totalHours: number;
    achievements: number;
    certificates: number;
    currentStreak: number;
  }> {
    const enrollments = await this.getUserEnrollments(userId);
    const achievements = await this.getUserAchievements(userId);
    const certificates = await this.getUserCertificates(userId);

    const totalHours = enrollments.reduce((sum, e) => {
      return sum + e.moduleProgress.reduce((mSum, m) => {
        return mSum + m.lessonProgress.reduce((lSum, l) => lSum + l.timeSpent, 0);
      }, 0);
    }, 0) / 60;

    return {
      totalCourses: enrollments.length,
      completedCourses: enrollments.filter(e => e.status === 'completed').length,
      totalHours: Math.round(totalHours * 10) / 10,
      achievements: achievements.length,
      certificates: certificates.length,
      currentStreak: Math.floor(Math.random() * 14) + 1, // Mock streak
    };
  }
}

// Export singleton instance
export const learningService = new LearningService();

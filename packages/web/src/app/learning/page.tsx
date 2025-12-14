'use client';

import { useState } from 'react';
import Link from 'next/link';

// ============================================================================
// Types
// ============================================================================

type LearningLevel = 'beginner' | 'intermediate' | 'advanced';
type LearningDomain = 'drug_discovery' | 'materials_science' | 'climate_science' | 'genomics' | 'machine_learning';

interface Course {
  id: string;
  title: string;
  description: string;
  domain: LearningDomain;
  level: LearningLevel;
  duration: number;
  rating: number;
  enrollmentCount: number;
  thumbnail: string;
  instructor: { name: string; avatar: string };
  progress?: number;
}

interface LearningPath {
  id: string;
  name: string;
  description: string;
  domain: LearningDomain;
  courseCount: number;
  estimatedHours: number;
  enrolled: boolean;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: Date;
}

// ============================================================================
// Mock Data
// ============================================================================

const mockCourses: Course[] = [
  {
    id: 'course-1',
    title: 'AI創薬入門：分子設計の基礎',
    description: 'GraphRAGと分子生成モデルを使った創薬の基礎を学びます',
    domain: 'drug_discovery',
    level: 'beginner',
    duration: 240,
    rating: 4.8,
    enrollmentCount: 1250,
    thumbnail: '💊',
    instructor: { name: '田中 博士', avatar: '👨‍🔬' },
    progress: 65,
  },
  {
    id: 'course-2',
    title: '気候予測AIの実践',
    description: 'Aurora AIを使った気象・気候予測を実践的に学ぶ',
    domain: 'climate_science',
    level: 'intermediate',
    duration: 360,
    rating: 4.6,
    enrollmentCount: 890,
    thumbnail: '🌍',
    instructor: { name: '鈴木 教授', avatar: '👩‍🏫' },
    progress: 30,
  },
  {
    id: 'course-3',
    title: 'シングルセル解析入門',
    description: 'scRNA-seqデータの解析手法をマスター',
    domain: 'genomics',
    level: 'intermediate',
    duration: 300,
    rating: 4.9,
    enrollmentCount: 1100,
    thumbnail: '🧬',
    instructor: { name: '山田 研究員', avatar: '👨‍💻' },
  },
  {
    id: 'course-4',
    title: '実践プロジェクト：創薬パイプライン',
    description: 'End-to-End創薬ワークフローの構築',
    domain: 'drug_discovery',
    level: 'advanced',
    duration: 600,
    rating: 4.7,
    enrollmentCount: 450,
    thumbnail: '🔬',
    instructor: { name: '田中 博士', avatar: '👨‍🔬' },
  },
  {
    id: 'course-5',
    title: '材料科学AI：特性予測',
    description: 'ニューラルネットワークによる材料特性予測',
    domain: 'materials_science',
    level: 'intermediate',
    duration: 280,
    rating: 4.5,
    enrollmentCount: 680,
    thumbnail: '⚗️',
    instructor: { name: '佐藤 教授', avatar: '👨‍🔬' },
  },
  {
    id: 'course-6',
    title: '機械学習基礎',
    description: 'AI for Scienceのための機械学習入門',
    domain: 'machine_learning',
    level: 'beginner',
    duration: 180,
    rating: 4.8,
    enrollmentCount: 2300,
    thumbnail: '🤖',
    instructor: { name: '伊藤 講師', avatar: '👩‍💻' },
    progress: 100,
  },
];

const mockPaths: LearningPath[] = [
  {
    id: 'path-1',
    name: 'AI創薬スペシャリスト',
    description: 'ゼロからAI創薬のプロフェッショナルへ',
    domain: 'drug_discovery',
    courseCount: 5,
    estimatedHours: 40,
    enrolled: true,
  },
  {
    id: 'path-2',
    name: '気候科学AIエンジニア',
    description: '気候予測とモデリングのスペシャリストへ',
    domain: 'climate_science',
    courseCount: 4,
    estimatedHours: 30,
    enrolled: false,
  },
  {
    id: 'path-3',
    name: 'ゲノミクスデータサイエンティスト',
    description: 'バイオインフォマティクスのマスターへ',
    domain: 'genomics',
    courseCount: 5,
    estimatedHours: 35,
    enrolled: false,
  },
];

const mockAchievements: Achievement[] = [
  { id: 'ach-1', name: 'ファーストステップ', description: '最初のコースを完了', icon: '🎯', earned: true, earnedAt: new Date('2024-11-15') },
  { id: 'ach-2', name: '学習マスター', description: '5つのコースを完了', icon: '🏆', earned: false },
  { id: 'ach-3', name: '7日連続', description: '7日連続で学習', icon: '🔥', earned: true, earnedAt: new Date('2024-12-01') },
  { id: 'ach-4', name: '創薬スペシャリスト', description: '創薬コースをすべて完了', icon: '💊', earned: false },
  { id: 'ach-5', name: 'コードマスター', description: '50個のコード演習を完了', icon: '💻', earned: false },
  { id: 'ach-6', name: '早起き学習者', description: '朝6時前に学習開始', icon: '🌅', earned: true, earnedAt: new Date('2024-12-05') },
];

// ============================================================================
// Main Component
// ============================================================================

export default function LearningPage() {
  const [activeTab, setActiveTab] = useState<'courses' | 'paths' | 'my-learning' | 'achievements'>('courses');
  const [filterDomain, setFilterDomain] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');

  const tabs = [
    { id: 'courses', name: 'コース一覧', icon: '📚' },
    { id: 'paths', name: '学習パス', icon: '🛤️' },
    { id: 'my-learning', name: 'マイ学習', icon: '📖' },
    { id: 'achievements', name: '実績', icon: '🏅' },
  ];

  const domainLabels: Record<LearningDomain, string> = {
    drug_discovery: '創薬',
    materials_science: '材料科学',
    climate_science: '気候科学',
    genomics: 'ゲノミクス',
    machine_learning: '機械学習',
  };

  const domainIcons: Record<LearningDomain, string> = {
    drug_discovery: '💊',
    materials_science: '⚗️',
    climate_science: '🌍',
    genomics: '🧬',
    machine_learning: '🤖',
  };

  const levelLabels: Record<LearningLevel, string> = {
    beginner: '入門',
    intermediate: '中級',
    advanced: '上級',
  };

  const levelColors: Record<LearningLevel, string> = {
    beginner: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    advanced: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  const filteredCourses = mockCourses.filter(course => {
    if (filterDomain !== 'all' && course.domain !== filterDomain) return false;
    if (filterLevel !== 'all' && course.level !== filterLevel) return false;
    return true;
  });

  const enrolledCourses = mockCourses.filter(c => c.progress !== undefined);
  const completedCount = enrolledCourses.filter(c => c.progress === 100).length;
  const earnedAchievements = mockAchievements.filter(a => a.earned);

  // Stats
  const stats = {
    totalHours: 24.5,
    completedCourses: 1,
    currentStreak: 7,
    achievements: 3,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ← ダッシュボード
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                📚 学習センター
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-orange-500">
                <span className="text-xl">🔥</span>
                <span className="font-medium">{stats.currentStreak}日連続</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{stats.totalHours}時間</div>
              <div className="text-sm text-indigo-200">総学習時間</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.completedCourses}</div>
              <div className="text-sm text-indigo-200">完了コース</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{enrolledCourses.length}</div>
              <div className="text-sm text-indigo-200">受講中コース</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.achievements}</div>
              <div className="text-sm text-indigo-200">獲得実績</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <select
                value={filterDomain}
                onChange={e => setFilterDomain(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="all">すべての分野</option>
                <option value="drug_discovery">創薬</option>
                <option value="materials_science">材料科学</option>
                <option value="climate_science">気候科学</option>
                <option value="genomics">ゲノミクス</option>
                <option value="machine_learning">機械学習</option>
              </select>
              <select
                value={filterLevel}
                onChange={e => setFilterLevel(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="all">すべてのレベル</option>
                <option value="beginner">入門</option>
                <option value="intermediate">中級</option>
                <option value="advanced">上級</option>
              </select>
              <div className="ml-auto text-sm text-gray-500 dark:text-gray-400">
                {filteredCourses.length}件のコース
              </div>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map(course => (
                <div
                  key={course.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                >
                  {/* Thumbnail */}
                  <div className="h-40 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-6xl">
                    {course.thumbnail}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${levelColors[course.level]}`}>
                        {levelLabels[course.level]}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {domainIcons[course.domain]} {domainLabels[course.domain]}
                      </span>
                    </div>

                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                      {course.description}
                    </p>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-500">★</span>
                        <span className="text-gray-700 dark:text-gray-300">{course.rating}</span>
                        <span className="text-gray-400">({course.enrollmentCount}人)</span>
                      </div>
                      <span className="text-gray-500 dark:text-gray-400">
                        {Math.floor(course.duration / 60)}時間{course.duration % 60}分
                      </span>
                    </div>

                    {/* Progress (if enrolled) */}
                    {course.progress !== undefined && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <span>進捗</span>
                          <span>{course.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${course.progress === 100 ? 'bg-green-500' : 'bg-indigo-600'}`}
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Instructor */}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
                      <span className="text-xl">{course.instructor.avatar}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{course.instructor.name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Learning Paths Tab */}
        {activeTab === 'paths' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                キャリアを加速する学習パス
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                体系的なカリキュラムで専門スキルを習得
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {mockPaths.map(path => (
                <div
                  key={path.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
                >
                  {/* Header */}
                  <div className={`p-6 ${
                    path.domain === 'drug_discovery' ? 'bg-gradient-to-r from-pink-500 to-rose-500' :
                    path.domain === 'climate_science' ? 'bg-gradient-to-r from-cyan-500 to-blue-500' :
                    'bg-gradient-to-r from-emerald-500 to-teal-500'
                  } text-white`}>
                    <div className="text-4xl mb-2">{domainIcons[path.domain]}</div>
                    <h3 className="text-xl font-bold mb-1">{path.name}</h3>
                    <p className="text-white/80 text-sm">{path.description}</p>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{path.courseCount}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">コース</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{path.estimatedHours}h</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">所要時間</div>
                      </div>
                    </div>

                    {path.enrolled ? (
                      <div>
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                          <span>進捗</span>
                          <span>2/5 コース完了</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                          <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '40%' }}></div>
                        </div>
                        <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                          学習を続ける
                        </button>
                      </div>
                    ) : (
                      <button className="w-full px-4 py-2 border border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                        パスを始める
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Learning Tab */}
        {activeTab === 'my-learning' && (
          <div className="space-y-6">
            {/* Continue Learning */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                学習を続ける
              </h2>
              
              {enrolledCourses.length > 0 ? (
                <div className="space-y-4">
                  {enrolledCourses.filter(c => c.progress !== 100).map(course => (
                    <div
                      key={course.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-2xl">
                        {course.thumbnail}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">{course.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <span>{course.instructor.name}</span>
                          <span>•</span>
                          <span>{levelLabels[course.level]}</span>
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <span>進捗 {course.progress}%</span>
                            <span>残り約{Math.ceil((100 - (course.progress || 0)) / 100 * course.duration / 60)}時間</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full"
                              style={{ width: `${course.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
                        続ける
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <span className="text-4xl mb-2 block">📚</span>
                  <p>まだコースに登録していません</p>
                  <button
                    onClick={() => setActiveTab('courses')}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    コースを探す
                  </button>
                </div>
              )}
            </div>

            {/* Completed Courses */}
            {completedCount > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  完了したコース
                </h2>
                <div className="space-y-3">
                  {enrolledCourses.filter(c => c.progress === 100).map(course => (
                    <div
                      key={course.id}
                      className="flex items-center gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <span className="text-2xl">{course.thumbnail}</span>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">{course.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{course.instructor.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-sm">
                          ✓ 完了
                        </span>
                        <button className="px-3 py-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                          修了証
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Learning History */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                学習履歴
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-20 text-gray-500 dark:text-gray-400">今日</span>
                  <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded flex">
                    <div className="w-1/3 bg-indigo-500 rounded-l"></div>
                  </div>
                  <span className="text-gray-600 dark:text-gray-300">45分</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-20 text-gray-500 dark:text-gray-400">昨日</span>
                  <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded flex">
                    <div className="w-1/2 bg-indigo-500 rounded-l"></div>
                  </div>
                  <span className="text-gray-600 dark:text-gray-300">1時間12分</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-20 text-gray-500 dark:text-gray-400">12/10</span>
                  <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded flex">
                    <div className="w-1/4 bg-indigo-500 rounded-l"></div>
                  </div>
                  <span className="text-gray-600 dark:text-gray-300">32分</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-20 text-gray-500 dark:text-gray-400">12/9</span>
                  <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded flex">
                    <div className="w-2/3 bg-indigo-500 rounded-l"></div>
                  </div>
                  <span className="text-gray-600 dark:text-gray-300">1時間45分</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">🏆 {earnedAchievements.length} / {mockAchievements.length}</h2>
                  <p className="text-yellow-100">獲得した実績</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">
                    {earnedAchievements.reduce((sum) => sum + 100, 0)}
                  </div>
                  <p className="text-yellow-100">ポイント</p>
                </div>
              </div>
            </div>

            {/* Earned Achievements */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                獲得済み
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {earnedAchievements.map(achievement => (
                  <div
                    key={achievement.id}
                    className="p-4 border border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{achievement.icon}</span>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{achievement.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{achievement.description}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      獲得日: {achievement.earnedAt?.toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Locked Achievements */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                未獲得
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockAchievements.filter(a => !a.earned).map(achievement => (
                  <div
                    key={achievement.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-lg opacity-75"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl grayscale">{achievement.icon}</span>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{achievement.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{achievement.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">
                        🔒 未解除
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

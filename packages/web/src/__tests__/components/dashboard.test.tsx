/**
 * @file 統合ダッシュボード テスト
 * @description P0機能: 統合ダッシュボードのコンポーネントテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  IntegratedDashboard,
  SimpleDashboard,
  DomainCard,
  DomainCardGrid,
  WelcomeHeader,
  QuickStartPanel,
  NLISearchBox,
  RecentActivityPanel,
  StatsPanel,
  PinnedItemsPanel,
  NotificationPanel,
  DomainStatsBar,
  formatRelativeTime,
  DOMAIN_INFO,
  QUICK_START_ITEMS,
} from '@/components/dashboard';
import type {
  DashboardStats,
  ActivityLog,
  PinnedItem,
  Notification,
} from '@/components/dashboard';

// ============================================================================
// テストデータ
// ============================================================================

const mockStats: DashboardStats = {
  totalProjects: 25,
  activeWorkflows: 8,
  completedWorkflows: 42,
  modelExecutions: 156,
  projectsByDomain: {
    'drug-discovery': 10,
    'materials-science': 7,
    climate: 5,
    genomics: 3,
  },
  weeklyExecutions: 28,
  weeklyChange: 12,
};

const mockActivities: ActivityLog[] = [
  {
    id: 'act-1',
    type: 'project-created',
    title: 'Test Project',
    titleJa: 'テストプロジェクト',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30分前
    domain: 'drug-discovery',
    projectId: 'proj-1',
  },
  {
    id: 'act-2',
    type: 'workflow-completed',
    title: 'MatterGen Inference',
    titleJa: 'MatterGen推論',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2時間前
    domain: 'materials-science',
  },
];

const mockPinnedItems: PinnedItem[] = [
  {
    id: 'pin-1',
    type: 'project',
    name: 'Pinned Project',
    nameJa: 'ピン留めプロジェクト',
    href: '/projects/proj-1',
    domain: 'genomics',
    lastAccessed: new Date(),
  },
];

const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'success',
    title: 'Workflow Complete',
    titleJa: 'ワークフロー完了',
    content: 'TamGen inference completed successfully',
    contentJa: 'TamGenの推論が正常に完了しました',
    createdAt: new Date(),
    isRead: false,
  },
];

// ============================================================================
// DomainCard テスト
// ============================================================================

describe('DomainCard', () => {
  const drugDiscoveryDomain = DOMAIN_INFO['drug-discovery'];

  it('分野情報を正しく表示する', () => {
    render(<DomainCard domain={drugDiscoveryDomain} />);

    expect(screen.getByText('創薬')).toBeInTheDocument();
    expect(screen.getByText(drugDiscoveryDomain.descriptionJa)).toBeInTheDocument();
  });

  it('英語表示に切り替わる', () => {
    render(<DomainCard domain={drugDiscoveryDomain} useJapaneseLabels={false} />);

    expect(screen.getByText('Drug Discovery')).toBeInTheDocument();
  });

  it('プロジェクト数を表示する', () => {
    render(<DomainCard domain={drugDiscoveryDomain} projectCount={10} />);

    expect(screen.getByText('10 プロジェクト')).toBeInTheDocument();
  });

  it('クリックで分野選択ハンドラが呼ばれる', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<DomainCard domain={drugDiscoveryDomain} onClick={handleClick} />);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('関連モデルを表示する', () => {
    render(<DomainCard domain={drugDiscoveryDomain} />);

    drugDiscoveryDomain.models.forEach((model) => {
      expect(screen.getByText(model)).toBeInTheDocument();
    });
  });
});

// ============================================================================
// DomainCardGrid テスト
// ============================================================================

describe('DomainCardGrid', () => {
  it('4つの分野カードを表示する', () => {
    render(<DomainCardGrid />);

    expect(screen.getByText('創薬')).toBeInTheDocument();
    expect(screen.getByText('材料科学')).toBeInTheDocument();
    expect(screen.getByText('気候科学')).toBeInTheDocument();
    expect(screen.getByText('ゲノミクス')).toBeInTheDocument();
  });

  it('プロジェクト数を各カードに渡す', () => {
    render(<DomainCardGrid projectCounts={mockStats.projectsByDomain} />);

    expect(screen.getByText('10 プロジェクト')).toBeInTheDocument();
    expect(screen.getByText('7 プロジェクト')).toBeInTheDocument();
    expect(screen.getByText('5 プロジェクト')).toBeInTheDocument();
    expect(screen.getByText('3 プロジェクト')).toBeInTheDocument();
  });

  it('分野選択時にハンドラが呼ばれる', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(<DomainCardGrid onDomainSelect={handleSelect} />);

    const drugDiscoveryCard = screen.getAllByRole('button')[0];
    await user.click(drugDiscoveryCard);

    expect(handleSelect).toHaveBeenCalledWith(DOMAIN_INFO['drug-discovery']);
  });
});

// ============================================================================
// WelcomeHeader テスト
// ============================================================================

describe('WelcomeHeader', () => {
  it('日本語ウェルカムメッセージを表示する', () => {
    render(<WelcomeHeader />);

    expect(screen.getByText('LabFlow へようこそ')).toBeInTheDocument();
  });

  it('英語ウェルカムメッセージに切り替わる', () => {
    render(<WelcomeHeader useJapaneseLabels={false} />);

    expect(screen.getByText('Welcome to LabFlow')).toBeInTheDocument();
  });
});

// ============================================================================
// QuickStartPanel テスト
// ============================================================================

describe('QuickStartPanel', () => {
  it('クイックスタート項目を表示する', () => {
    render(<QuickStartPanel items={QUICK_START_ITEMS} />);

    expect(screen.getByText('新規プロジェクト')).toBeInTheDocument();
    expect(screen.getByText('テンプレートを使う')).toBeInTheDocument();
    expect(screen.getByText('チュートリアルを開始')).toBeInTheDocument();
  });

  it('クリックでハンドラが呼ばれる', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<QuickStartPanel items={QUICK_START_ITEMS} onItemClick={handleClick} />);

    const createProjectBtn = screen.getByRole('button', { name: /新規プロジェクト/ });
    await user.click(createProjectBtn);

    expect(handleClick).toHaveBeenCalledWith(QUICK_START_ITEMS[0]);
  });

  it('英語表示に切り替わる', () => {
    render(<QuickStartPanel items={QUICK_START_ITEMS} useJapaneseLabels={false} />);

    expect(screen.getByText('New Project')).toBeInTheDocument();
    expect(screen.getByText('Use Template')).toBeInTheDocument();
  });
});

// ============================================================================
// NLISearchBox テスト
// ============================================================================

describe('NLISearchBox', () => {
  it('検索ボックスを表示する', () => {
    render(<NLISearchBox />);

    expect(screen.getByPlaceholderText(/新しい材料を生成したい/)).toBeInTheDocument();
  });

  it('英語プレースホルダーに切り替わる', () => {
    render(<NLISearchBox useJapaneseLabels={false} />);

    expect(screen.getByPlaceholderText(/Generate new materials/)).toBeInTheDocument();
  });

  it('入力値を送信できる', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<NLISearchBox onSubmit={handleSubmit} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'MatterGenを使って新しい材料を生成したい{enter}');

    expect(handleSubmit).toHaveBeenCalledWith('MatterGenを使って新しい材料を生成したい');
  });
});

// ============================================================================
// RecentActivityPanel テスト
// ============================================================================

describe('RecentActivityPanel', () => {
  it('アクティビティリストを表示する', () => {
    render(<RecentActivityPanel activities={mockActivities} />);

    expect(screen.getByText('最近のアクティビティ')).toBeInTheDocument();
    expect(screen.getByText('テストプロジェクト')).toBeInTheDocument();
    expect(screen.getByText('MatterGen推論')).toBeInTheDocument();
  });

  it('空の場合はメッセージを表示する', () => {
    render(<RecentActivityPanel activities={[]} />);

    expect(screen.getByText('アクティビティはありません')).toBeInTheDocument();
  });

  it('maxItemsで表示数を制限する', () => {
    render(<RecentActivityPanel activities={mockActivities} maxItems={1} />);

    expect(screen.getByText('テストプロジェクト')).toBeInTheDocument();
    expect(screen.queryByText('MatterGen推論')).not.toBeInTheDocument();
  });

  it('英語表示に切り替わる', () => {
    render(<RecentActivityPanel activities={mockActivities} useJapaneseLabels={false} />);

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });
});

// ============================================================================
// StatsPanel テスト
// ============================================================================

describe('StatsPanel', () => {
  it('統計情報を表示する', () => {
    render(<StatsPanel stats={mockStats} />);

    expect(screen.getByText('25')).toBeInTheDocument(); // totalProjects
    expect(screen.getByText('8')).toBeInTheDocument(); // activeWorkflows
    expect(screen.getByText('42')).toBeInTheDocument(); // completedWorkflows
    expect(screen.getByText('156')).toBeInTheDocument(); // modelExecutions
  });

  it('日本語ラベルを表示する', () => {
    render(<StatsPanel stats={mockStats} />);

    expect(screen.getByText('プロジェクト')).toBeInTheDocument();
    expect(screen.getByText('実行中ワークフロー')).toBeInTheDocument();
    expect(screen.getByText('完了ワークフロー')).toBeInTheDocument();
    expect(screen.getByText('モデル実行回数')).toBeInTheDocument();
  });

  it('英語ラベルに切り替わる', () => {
    render(<StatsPanel stats={mockStats} useJapaneseLabels={false} />);

    expect(screen.getByText('projects')).toBeInTheDocument();
    expect(screen.getByText('Active Workflows')).toBeInTheDocument();
    expect(screen.getByText('Completed Workflows')).toBeInTheDocument();
    expect(screen.getByText('Model Executions')).toBeInTheDocument();
  });

  it('週間変化率を表示する', () => {
    render(<StatsPanel stats={mockStats} />);

    expect(screen.getByText(/\+12%/)).toBeInTheDocument();
  });
});

// ============================================================================
// PinnedItemsPanel テスト
// ============================================================================

describe('PinnedItemsPanel', () => {
  it('ピン留めアイテムを表示する', () => {
    render(<PinnedItemsPanel items={mockPinnedItems} />);

    expect(screen.getByText('ピン留め')).toBeInTheDocument();
    expect(screen.getByText('ピン留めプロジェクト')).toBeInTheDocument();
  });

  it('空の場合はメッセージを表示する', () => {
    render(<PinnedItemsPanel items={[]} />);

    expect(screen.getByText('ピン留めアイテムはありません')).toBeInTheDocument();
  });

  it('英語表示に切り替わる', () => {
    render(<PinnedItemsPanel items={mockPinnedItems} useJapaneseLabels={false} />);

    expect(screen.getByText('Pinned Items')).toBeInTheDocument();
  });
});

// ============================================================================
// NotificationPanel テスト
// ============================================================================

describe('NotificationPanel', () => {
  it('通知を表示する', () => {
    render(<NotificationPanel notifications={mockNotifications} />);

    expect(screen.getByText('お知らせ')).toBeInTheDocument();
    expect(screen.getByText('ワークフロー完了')).toBeInTheDocument();
    expect(screen.getByText('TamGenの推論が正常に完了しました')).toBeInTheDocument();
  });

  it('未読インジケータを表示する', () => {
    render(<NotificationPanel notifications={mockNotifications} />);

    // 未読通知にはbg-blue-50の背景がある
    const notificationItem = screen.getByText('ワークフロー完了').closest('div[class*="bg-blue-50"]');
    expect(notificationItem).toBeInTheDocument();
  });

  it('英語表示に切り替わる', () => {
    render(<NotificationPanel notifications={mockNotifications} useJapaneseLabels={false} />);

    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });
});

// ============================================================================
// DomainStatsBar テスト
// ============================================================================

describe('DomainStatsBar', () => {
  it('分野別プロジェクト数を表示する', () => {
    render(<DomainStatsBar stats={mockStats.projectsByDomain} />);

    expect(screen.getByText('創薬: 10')).toBeInTheDocument();
    expect(screen.getByText('材料科学: 7')).toBeInTheDocument();
    expect(screen.getByText('気候科学: 5')).toBeInTheDocument();
    expect(screen.getByText('ゲノミクス: 3')).toBeInTheDocument();
  });

  it('英語表示に切り替わる', () => {
    render(<DomainStatsBar stats={mockStats.projectsByDomain} useJapaneseLabels={false} />);

    expect(screen.getByText('Drug Discovery: 10')).toBeInTheDocument();
    expect(screen.getByText('Materials Science: 7')).toBeInTheDocument();
  });
});

// ============================================================================
// formatRelativeTime テスト
// ============================================================================

describe('formatRelativeTime', () => {
  it('数分前を正しくフォーマットする', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinutesAgo, true)).toBe('5分前');
    expect(formatRelativeTime(fiveMinutesAgo, false)).toBe('5m ago');
  });

  it('1時間前を正しくフォーマットする', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    expect(formatRelativeTime(oneHourAgo, true)).toBe('1時間前');
    expect(formatRelativeTime(oneHourAgo, false)).toBe('1h ago');
  });

  it('1日前を正しくフォーマットする', () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(oneDayAgo, true)).toBe('1日前');
    expect(formatRelativeTime(oneDayAgo, false)).toBe('1d ago');
  });

  it('たった今を正しくフォーマットする', () => {
    const now = new Date();
    expect(formatRelativeTime(now, true)).toBe('たった今');
    expect(formatRelativeTime(now, false)).toBe('Just now');
  });
});

// ============================================================================
// IntegratedDashboard テスト
// ============================================================================

describe('IntegratedDashboard', () => {
  it('全セクションを表示する', () => {
    render(
      <IntegratedDashboard
        stats={mockStats}
        recentActivities={mockActivities}
        pinnedItems={mockPinnedItems}
        notifications={mockNotifications}
        layout={{
          visibleSections: ['domain-cards', 'quick-start', 'stats', 'recent-activity', 'pinned', 'notifications'],
        }}
      />
    );

    // ヘッダー
    expect(screen.getByText('LabFlow へようこそ')).toBeInTheDocument();
    
    // 分野カード（複数ある場合はgetAllByText）
    expect(screen.getAllByText('創薬').length).toBeGreaterThan(0);
    expect(screen.getAllByText('材料科学').length).toBeGreaterThan(0);
    
    // クイックスタート
    expect(screen.getByText('新規プロジェクト')).toBeInTheDocument();
    
    // 統計
    expect(screen.getByText('25')).toBeInTheDocument();
    
    // アクティビティ
    expect(screen.getByText('テストプロジェクト')).toBeInTheDocument();
    
    // ピン留め
    expect(screen.getByText('ピン留めプロジェクト')).toBeInTheDocument();
    
    // 通知
    expect(screen.getByText('ワークフロー完了')).toBeInTheDocument();
  });

  it('分野選択ハンドラが呼ばれる', async () => {
    const user = userEvent.setup();
    const handleDomainSelect = vi.fn();

    render(
      <IntegratedDashboard
        stats={mockStats}
        onDomainSelect={handleDomainSelect}
      />
    );

    // 分野カードはすべてbuttonで、検索ボタンの次から始まる
    const allButtons = screen.getAllByRole('button');
    // 検索ボタンをスキップして最初の分野カードをクリック
    const domainCards = allButtons.filter(btn => btn.getAttribute('aria-label')?.includes('創薬'));
    await user.click(domainCards[0]);

    expect(handleDomainSelect).toHaveBeenCalledWith('drug-discovery');
  });

  it('クイックスタートハンドラが呼ばれる', async () => {
    const user = userEvent.setup();
    const handleQuickStart = vi.fn();

    render(
      <IntegratedDashboard
        stats={mockStats}
        onQuickStart={handleQuickStart}
      />
    );

    const createProjectBtn = screen.getByRole('button', { name: /新規プロジェクト/ });
    await user.click(createProjectBtn);

    expect(handleQuickStart).toHaveBeenCalledWith('new-project');
  });

  it('英語表示に切り替わる', () => {
    render(
      <IntegratedDashboard
        stats={mockStats}
        recentActivities={mockActivities}
        useJapaneseLabels={false}
      />
    );

    expect(screen.getByText('Welcome to LabFlow')).toBeInTheDocument();
    // 複数のDrug Discoveryがあるので getAllByText を使用
    expect(screen.getAllByText('Drug Discovery').length).toBeGreaterThan(0);
    expect(screen.getByText('New Project')).toBeInTheDocument();
  });

  it('レイアウトでセクションを非表示にできる', () => {
    render(
      <IntegratedDashboard
        stats={mockStats}
        layout={{
          visibleSections: ['domain-cards'], // クイックスタートを除外
        }}
      />
    );

    // 分野カードは表示される
    expect(screen.getAllByText('創薬').length).toBeGreaterThan(0);
    // クイックスタートは非表示
    expect(screen.queryByText('新規プロジェクト')).not.toBeInTheDocument();
  });
});

// ============================================================================
// SimpleDashboard テスト
// ============================================================================

describe('SimpleDashboard', () => {
  it('シンプル版ダッシュボードを表示する', () => {
    render(<SimpleDashboard />);

    // ヘッダー
    expect(screen.getByText('LabFlow へようこそ')).toBeInTheDocument();
    
    // 分野カード
    expect(screen.getByText('創薬')).toBeInTheDocument();
    expect(screen.getByText('材料科学')).toBeInTheDocument();
    expect(screen.getByText('気候科学')).toBeInTheDocument();
    expect(screen.getByText('ゲノミクス')).toBeInTheDocument();
  });

  it('分野選択ハンドラが呼ばれる', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(<SimpleDashboard onDomainSelect={handleSelect} />);

    // 分野カードを特定（創薬を選択）
    const cards = screen.getAllByRole('button').filter(btn => 
      btn.getAttribute('aria-label')?.includes('創薬')
    );
    await user.click(cards[0]);

    expect(handleSelect).toHaveBeenCalledWith('drug-discovery');
  });
});

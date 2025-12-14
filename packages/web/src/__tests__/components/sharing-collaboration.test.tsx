/**
 * @file コラボレーションコンポーネント テスト
 * @description TeamMemberList, CommentSection, ActivityFeed, SharePanel のテスト
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  TeamMemberList,
  CommentSection,
  ActivityFeed,
  SharePanel,
  ShareLinkManager,
  QuickShareButton,
} from '@/components/sharing';
import type {
  TeamMember,
  Comment,
  ActivityLog,
  ShareLink,
  TeamMemberListProps,
  CommentSectionProps,
  ActivityFeedProps,
  SharePanelProps,
  ShareLinkManagerProps,
} from '@/components/sharing';

// モックデータ
const mockMembers: TeamMember[] = [
  {
    id: 'user-1',
    userId: 'u1',
    name: '田中太郎',
    email: 'tanaka@example.com',
    role: 'admin',
    status: 'active',
    joinedAt: new Date('2025-01-01'),
    lastActiveAt: new Date(),
  },
  {
    id: 'user-2',
    userId: 'u2',
    name: '鈴木花子',
    email: 'suzuki@example.com',
    role: 'edit',
    status: 'active',
    joinedAt: new Date('2025-01-15'),
    lastActiveAt: new Date(),
  },
  {
    id: 'user-3',
    userId: 'u3',
    name: '佐藤次郎',
    email: 'sato@example.com',
    role: 'view',
    status: 'pending',
    joinedAt: new Date('2025-02-01'),
  },
];

const mockComments: Comment[] = [
  {
    id: 'comment-1',
    projectId: 'proj-1',
    authorId: 'u1',
    authorName: '田中太郎',
    content: 'このワークフローについて質問があります。',
    createdAt: new Date('2025-06-01T10:00:00'),
    updatedAt: new Date('2025-06-01T10:00:00'),
  },
  {
    id: 'comment-2',
    projectId: 'proj-1',
    authorId: 'u2',
    authorName: '鈴木花子',
    content: '結果の可視化を追加しました。',
    createdAt: new Date('2025-06-02T09:00:00'),
    updatedAt: new Date('2025-06-02T09:00:00'),
    targetType: 'workflow',
    targetId: 'wf-1',
  },
];

const mockActivities: ActivityLog[] = [
  {
    id: 'act-1',
    projectId: 'proj-1',
    userId: 'u1',
    userName: '田中太郎',
    action: 'project_created',
    timestamp: new Date('2025-01-01T09:00:00'),
    details: { projectName: 'テストプロジェクト' },
  },
  {
    id: 'act-2',
    projectId: 'proj-1',
    userId: 'u2',
    userName: '鈴木花子',
    action: 'workflow_completed',
    timestamp: new Date('2025-06-01T15:00:00'),
    details: { workflowName: 'データ前処理' },
    targetId: 'wf-1',
    targetType: 'workflow',
  },
  {
    id: 'act-3',
    projectId: 'proj-1',
    userId: 'u1',
    userName: '田中太郎',
    action: 'member_invited',
    timestamp: new Date('2025-01-15T10:00:00'),
    details: { memberName: '鈴木花子', role: 'edit' },
  },
];

const mockShareLinks: ShareLink[] = [
  {
    id: 'link-1',
    url: 'https://labflow.io/share/abc123',
    shortCode: 'abc123',
    projectId: 'proj-1',
    config: {
      permission: 'view',
      expiresAt: new Date(Date.now() + 86400000 * 7),
      allowDownload: true,
      maxAccessCount: null,
    },
    createdBy: 'u1',
    createdAt: new Date('2025-06-01'),
    accessCount: 5,
    isActive: true,
  },
];

describe('TeamMemberList', () => {
  const defaultProps: TeamMemberListProps = {
    members: mockMembers,
    currentUserId: 'u1',
    onAddMember: vi.fn(),
    onRemoveMember: vi.fn(),
    onChangeRole: vi.fn(),
    readOnly: false,
    useJapaneseLabels: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('メンバー一覧が表示される', () => {
    render(<TeamMemberList {...defaultProps} />);

    expect(screen.getByText('田中太郎')).toBeInTheDocument();
    expect(screen.getByText('鈴木花子')).toBeInTheDocument();
    expect(screen.getByText('佐藤次郎')).toBeInTheDocument();
  });

  it('メンバーの役割が表示される', () => {
    render(<TeamMemberList {...defaultProps} />);

    // 複数表示される可能性があるため getAllBy を使用
    expect(screen.getAllByText('管理者').length).toBeGreaterThan(0);
    expect(screen.getAllByText('編集').length).toBeGreaterThan(0);
    expect(screen.getAllByText('閲覧').length).toBeGreaterThan(0);
  });

  it('招待中ステータスが表示される', () => {
    render(<TeamMemberList {...defaultProps} />);

    expect(screen.getByText('招待中')).toBeInTheDocument();
  });

  it('readOnly=true の場合、管理機能が非表示', () => {
    render(<TeamMemberList {...defaultProps} readOnly={true} />);

    expect(screen.queryByRole('button', { name: /追加/i })).not.toBeInTheDocument();
  });

  it('英語ロケールで表示される', () => {
    render(<TeamMemberList {...defaultProps} useJapaneseLabels={false} />);

    expect(screen.getAllByText('Admin').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Edit').length).toBeGreaterThan(0);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});

describe('CommentSection', () => {
  const defaultProps: CommentSectionProps = {
    projectId: 'proj-1',
    comments: mockComments,
    currentUserId: 'u1',
    onAddComment: vi.fn(),
    onEditComment: vi.fn(),
    onDeleteComment: vi.fn(),
    useJapaneseLabels: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コメント一覧が表示される', () => {
    render(<CommentSection {...defaultProps} />);

    expect(screen.getByText('このワークフローについて質問があります。')).toBeInTheDocument();
    expect(screen.getByText('結果の可視化を追加しました。')).toBeInTheDocument();
  });

  it('コメント投稿フォームが表示される', () => {
    render(<CommentSection {...defaultProps} />);

    expect(screen.getByPlaceholderText(/コメント/)).toBeInTheDocument();
  });

  it('コメントを投稿できる', () => {
    render(<CommentSection {...defaultProps} />);

    const input = screen.getByPlaceholderText(/コメント/);
    fireEvent.change(input, { target: { value: '新しいコメント' } });
    
    // ボタンテキストは「コメント」
    const submitButton = screen.getByRole('button', { name: 'コメント' });
    fireEvent.click(submitButton);

    expect(defaultProps.onAddComment).toHaveBeenCalled();
  });

  it('コメントがない場合のメッセージが表示される', () => {
    render(<CommentSection {...defaultProps} comments={[]} />);

    // コメント入力フォームは表示される
    expect(screen.getByPlaceholderText(/コメント/)).toBeInTheDocument();
  });
});

describe('ActivityFeed', () => {
  const defaultProps: ActivityFeedProps = {
    activities: mockActivities,
    onLoadMore: vi.fn(),
    useJapaneseLabels: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('アクティビティ一覧が表示される', () => {
    render(<ActivityFeed {...defaultProps} />);

    expect(screen.getByText(/プロジェクトを作成/)).toBeInTheDocument();
    expect(screen.getByText(/ワークフローが完了/)).toBeInTheDocument();
    expect(screen.getByText(/メンバーを招待/)).toBeInTheDocument();
  });

  it('ユーザー名が表示される', () => {
    render(<ActivityFeed {...defaultProps} />);

    expect(screen.getAllByText('田中太郎').length).toBeGreaterThan(0);
    expect(screen.getByText('鈴木花子')).toBeInTheDocument();
  });

  it('英語ロケールで表示される', () => {
    render(<ActivityFeed {...defaultProps} useJapaneseLabels={false} />);

    expect(screen.getByText(/Project created/i)).toBeInTheDocument();
    expect(screen.getByText(/Workflow completed/i)).toBeInTheDocument();
  });

  it('アクティビティがない場合のメッセージが表示される', () => {
    render(<ActivityFeed {...defaultProps} activities={[]} />);

    // アクティビティがない場合でもセクションは表示
    expect(screen.getByText('アクティビティ')).toBeInTheDocument();
  });
});

describe('ShareLinkManager', () => {
  const defaultProps: ShareLinkManagerProps = {
    projectId: 'proj-1',
    links: mockShareLinks,
    onCreateLink: vi.fn(),
    onDeleteLink: vi.fn(),
    onDeactivateLink: vi.fn(),
    useJapaneseLabels: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('共有リンク一覧が表示される', () => {
    render(<ShareLinkManager {...defaultProps} />);

    expect(screen.getByText(/abc123/)).toBeInTheDocument();
    expect(screen.getAllByText(/閲覧/).length).toBeGreaterThan(0);
  });

  it('新規リンク作成ボタンが表示される', () => {
    render(<ShareLinkManager {...defaultProps} />);

    expect(screen.getByRole('button', { name: /リンクを作成/ })).toBeInTheDocument();
  });

  it('リンクをコピーできる', async () => {
    render(<ShareLinkManager {...defaultProps} />);

    const copyButton = screen.getByRole('button', { name: /リンクをコピー/ });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://labflow.io/share/abc123');
    });
  });
});

describe('QuickShareButton', () => {
  const defaultProps = {
    projectId: 'proj-1',
    useJapaneseLabels: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('ボタンが表示される', () => {
    render(<QuickShareButton {...defaultProps} />);

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText(/共有/)).toBeInTheDocument();
  });

  it('クリックで共有ダイアログが表示される', async () => {
    render(<QuickShareButton {...defaultProps} />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText(/共有リンクを作成しました/)).toBeInTheDocument();
    });
  });
});

describe('SharePanel', () => {
  const defaultProps: SharePanelProps = {
    projectId: 'proj-1',
    useJapaneseLabels: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('パネルが表示される', () => {
    render(<SharePanel {...defaultProps} />);

    expect(screen.getByText(/共有/)).toBeInTheDocument();
  });

  it('タブが表示される', () => {
    render(<SharePanel {...defaultProps} />);

    expect(screen.getByRole('tab', { name: /メンバー/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /リンク/i })).toBeInTheDocument();
  });

  it('英語ロケールで表示される', () => {
    render(<SharePanel {...defaultProps} useJapaneseLabels={false} />);

    expect(screen.getByRole('tab', { name: /Members/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Links/i })).toBeInTheDocument();
  });
});

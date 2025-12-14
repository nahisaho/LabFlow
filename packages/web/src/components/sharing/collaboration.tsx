/**
 * @file コラボレーションコンポーネント
 * @description チームメンバー管理、コメント、アクティビティフィード
 * @module @labflow/web/components/sharing/collaboration
 */

'use client';

import React, { useState, useCallback } from 'react';
import type {
  TeamMember,
  TeamMemberListProps,
  Comment,
  CommentSectionProps,
  ActivityLog,
  ActivityFeedProps,
  SharePermission,
} from './types';
import {
  PERMISSION_LABELS,
  ACTIVITY_ACTION_LABELS,
  formatRelativeTime,
  formatDateTime,
  formatMemberStatus,
} from './utils';

// =============================================================================
// ラベル定義
// =============================================================================

const LABELS = {
  en: {
    members: {
      title: 'Team Members',
      add: 'Add Member',
      addPlaceholder: 'Enter email address',
      you: '(You)',
      remove: 'Remove',
      changeRole: 'Change role',
      noMembers: 'No team members yet',
      invite: 'Invite',
      cancel: 'Cancel',
    },
    comments: {
      title: 'Comments',
      add: 'Add a comment...',
      submit: 'Comment',
      edit: 'Edit',
      delete: 'Delete',
      reply: 'Reply',
      resolve: 'Resolve',
      resolved: 'Resolved',
      noComments: 'No comments yet',
      addFirst: 'Be the first to comment',
      edited: 'edited',
    },
    activity: {
      title: 'Activity',
      loadMore: 'Load more',
      noActivity: 'No activity yet',
    },
  },
  ja: {
    members: {
      title: 'チームメンバー',
      add: 'メンバーを追加',
      addPlaceholder: 'メールアドレスを入力',
      you: '（あなた）',
      remove: '削除',
      changeRole: '役割を変更',
      noMembers: 'チームメンバーがいません',
      invite: '招待',
      cancel: 'キャンセル',
    },
    comments: {
      title: 'コメント',
      add: 'コメントを追加...',
      submit: 'コメント',
      edit: '編集',
      delete: '削除',
      reply: '返信',
      resolve: '解決',
      resolved: '解決済み',
      noComments: 'コメントがありません',
      addFirst: '最初のコメントを追加しましょう',
      edited: '編集済み',
    },
    activity: {
      title: 'アクティビティ',
      loadMore: 'もっと見る',
      noActivity: 'アクティビティがありません',
    },
  },
};

// =============================================================================
// チームメンバー管理
// =============================================================================

/** メンバーアバター */
function MemberAvatar({ member, size = 'md' }: { member: TeamMember; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  if (member.avatarUrl) {
    return (
      <img
        src={member.avatarUrl}
        alt={member.name}
        className={`${sizeClasses[size]} rounded-full object-cover`}
      />
    );
  }

  // イニシャルアバター
  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
  ];
  const colorIndex = member.userId.charCodeAt(0) % colors.length;

  return (
    <div className={`${sizeClasses[size]} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-medium`}>
      {initials}
    </div>
  );
}

/** メンバー追加フォーム */
interface AddMemberFormProps {
  onAdd: (email: string, role: SharePermission) => void;
  onCancel: () => void;
  useJapaneseLabels?: boolean;
}

function AddMemberForm({ onAdd, onCancel, useJapaneseLabels = true }: AddMemberFormProps) {
  const l = useJapaneseLabels ? LABELS.ja : LABELS.en;
  const locale = useJapaneseLabels ? 'ja' : 'en';
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<SharePermission>('view');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onAdd(email.trim(), role);
      setEmail('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-50 rounded-lg space-y-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={l.members.addPlaceholder}
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        required
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as SharePermission)}
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {(['view', 'comment', 'edit', 'admin'] as SharePermission[]).map((r) => (
          <option key={r} value={r}>
            {PERMISSION_LABELS[r][locale]}
          </option>
        ))}
      </select>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors text-sm"
        >
          {l.members.cancel}
        </button>
        <button
          type="submit"
          className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
        >
          {l.members.invite}
        </button>
      </div>
    </form>
  );
}

/**
 * チームメンバーリスト
 */
export function TeamMemberList({
  members,
  currentUserId,
  onAddMember,
  onRemoveMember,
  onChangeRole,
  readOnly = false,
  useJapaneseLabels = true,
}: TeamMemberListProps) {
  const l = useJapaneseLabels ? LABELS.ja : LABELS.en;
  const locale = useJapaneseLabels ? 'ja' : 'en';
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = useCallback((email: string, role: SharePermission) => {
    if (onAddMember) {
      onAddMember(email, role);
    }
    setIsAdding(false);
  }, [onAddMember]);

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">{l.members.title}</h3>
        {!readOnly && onAddMember && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {l.members.add}
          </button>
        )}
      </div>

      {/* 追加フォーム */}
      {isAdding && (
        <AddMemberForm
          onAdd={handleAdd}
          onCancel={() => setIsAdding(false)}
          useJapaneseLabels={useJapaneseLabels}
        />
      )}

      {/* メンバー一覧 */}
      {members.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p>{l.members.noMembers}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((member) => {
            const isCurrentUser = member.userId === currentUserId;
            const { label: statusLabel, color: statusColor } = formatMemberStatus(member.status, locale);

            return (
              <div
                key={member.userId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <MemberAvatar member={member} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{member.name}</span>
                      {isCurrentUser && (
                        <span className="text-xs text-gray-500">{l.members.you}</span>
                      )}
                      <span
                        className="px-2 py-0.5 text-xs rounded-full"
                        style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!readOnly && onChangeRole && !isCurrentUser ? (
                    <select
                      value={member.role}
                      onChange={(e) => onChangeRole(member.userId, e.target.value as SharePermission)}
                      className="text-sm px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
                    >
                      {(['view', 'comment', 'edit', 'admin'] as SharePermission[]).map((r) => (
                        <option key={r} value={r}>
                          {PERMISSION_LABELS[r][locale]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-sm text-gray-600 px-2 py-1 bg-gray-100 rounded">
                      {PERMISSION_LABELS[member.role][locale]}
                    </span>
                  )}

                  {!readOnly && onRemoveMember && !isCurrentUser && (
                    <button
                      onClick={() => onRemoveMember(member.userId)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                      title={l.members.remove}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// コメントセクション
// =============================================================================

/** 単一コメント */
interface CommentItemProps {
  comment: Comment;
  isAuthor: boolean;
  onEdit?: (content: string) => void;
  onDelete?: () => void;
  onReply?: () => void;
  onResolve?: () => void;
  onAddReaction?: (emoji: string) => void;
  readOnly?: boolean;
  useJapaneseLabels?: boolean;
}

function CommentItem({
  comment,
  isAuthor,
  onEdit,
  onDelete,
  onReply,
  onResolve,
  onAddReaction,
  readOnly = false,
  useJapaneseLabels = true,
}: CommentItemProps) {
  const l = useJapaneseLabels ? LABELS.ja : LABELS.en;
  const locale = useJapaneseLabels ? 'ja' : 'en';
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const handleSaveEdit = () => {
    if (onEdit && editContent.trim()) {
      onEdit(editContent.trim());
      setIsEditing(false);
    }
  };

  return (
    <div className={`p-3 rounded-lg ${comment.resolved ? 'bg-green-50 border border-green-100' : 'bg-gray-50'}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {comment.authorName[0].toUpperCase()}
          </div>
          <div>
            <span className="font-medium text-gray-900 text-sm">{comment.authorName}</span>
            <span className="text-xs text-gray-500 ml-2">
              {formatRelativeTime(comment.createdAt, locale)}
              {comment.updatedAt && ` (${l.comments.edited})`}
            </span>
          </div>
        </div>
        {comment.resolved && (
          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
            {l.comments.resolved}
          </span>
        )}
      </div>

      {/* 本文 */}
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded"
            >
              {l.members.cancel}
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              保存
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
      )}

      {/* リアクション */}
      {comment.reactions && Object.keys(comment.reactions).length > 0 && (
        <div className="flex gap-1 mt-2">
          {Object.entries(comment.reactions).map(([emoji, userIds]) => (
            <button
              key={emoji}
              onClick={() => onAddReaction?.(emoji)}
              className="px-2 py-0.5 text-sm bg-gray-100 rounded-full hover:bg-gray-200"
            >
              {emoji} {userIds.length}
            </button>
          ))}
        </div>
      )}

      {/* アクション */}
      {!readOnly && !isEditing && (
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-200">
          {onReply && (
            <button
              onClick={onReply}
              className="text-xs text-gray-500 hover:text-blue-500"
            >
              {l.comments.reply}
            </button>
          )}
          {isAuthor && onEdit && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-gray-500 hover:text-blue-500"
            >
              {l.comments.edit}
            </button>
          )}
          {isAuthor && onDelete && (
            <button
              onClick={onDelete}
              className="text-xs text-gray-500 hover:text-red-500"
            >
              {l.comments.delete}
            </button>
          )}
          {!comment.resolved && onResolve && (
            <button
              onClick={onResolve}
              className="text-xs text-gray-500 hover:text-green-500"
            >
              {l.comments.resolve}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * コメントセクション
 */
export function CommentSection({
  projectId,
  targetId,
  targetType,
  comments,
  currentUserId,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onAddReaction,
  onResolve,
  readOnly = false,
  useJapaneseLabels = true,
}: CommentSectionProps) {
  const l = useJapaneseLabels ? LABELS.ja : LABELS.en;
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() && onAddComment) {
      onAddComment(newComment.trim());
      setNewComment('');
    }
  };

  // コメントをスレッド形式にグループ化
  const rootComments = comments.filter((c) => !c.parentId);
  const repliesMap = new Map<string, Comment[]>();
  comments.forEach((c) => {
    if (c.parentId) {
      const replies = repliesMap.get(c.parentId) ?? [];
      replies.push(c);
      repliesMap.set(c.parentId, replies);
    }
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">{l.comments.title}</h3>

      {/* コメント入力 */}
      {!readOnly && onAddComment && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={l.comments.add}
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {l.comments.submit}
          </button>
        </form>
      )}

      {/* コメント一覧 */}
      {rootComments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p>{l.comments.noComments}</p>
          <p className="text-sm mt-1">{l.comments.addFirst}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rootComments.map((comment) => (
            <div key={comment.id}>
              <CommentItem
                comment={comment}
                isAuthor={comment.authorId === currentUserId}
                onEdit={onEditComment ? (content) => onEditComment(comment.id, content) : undefined}
                onDelete={onDeleteComment ? () => onDeleteComment(comment.id) : undefined}
                onResolve={onResolve ? () => onResolve(comment.id) : undefined}
                onAddReaction={onAddReaction ? (emoji) => onAddReaction(comment.id, emoji) : undefined}
                readOnly={readOnly}
                useJapaneseLabels={useJapaneseLabels}
              />
              {/* 返信 */}
              {repliesMap.get(comment.id)?.map((reply) => (
                <div key={reply.id} className="ml-8 mt-2">
                  <CommentItem
                    comment={reply}
                    isAuthor={reply.authorId === currentUserId}
                    onEdit={onEditComment ? (content) => onEditComment(reply.id, content) : undefined}
                    onDelete={onDeleteComment ? () => onDeleteComment(reply.id) : undefined}
                    onAddReaction={onAddReaction ? (emoji) => onAddReaction(reply.id, emoji) : undefined}
                    readOnly={readOnly}
                    useJapaneseLabels={useJapaneseLabels}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// アクティビティフィード
// =============================================================================

/**
 * アクティビティフィード
 */
export function ActivityFeed({
  activities,
  maxItems = 20,
  onLoadMore,
  filter,
  useJapaneseLabels = true,
}: ActivityFeedProps) {
  const l = useJapaneseLabels ? LABELS.ja : LABELS.en;
  const locale = useJapaneseLabels ? 'ja' : 'en';

  // フィルタリング
  let filteredActivities = activities;
  if (filter) {
    if (filter.actions) {
      filteredActivities = filteredActivities.filter((a) => filter.actions!.includes(a.action));
    }
    if (filter.userId) {
      filteredActivities = filteredActivities.filter((a) => a.userId === filter.userId);
    }
    if (filter.fromDate) {
      filteredActivities = filteredActivities.filter((a) => a.timestamp >= filter.fromDate!);
    }
    if (filter.toDate) {
      filteredActivities = filteredActivities.filter((a) => a.timestamp <= filter.toDate!);
    }
  }

  const displayedActivities = filteredActivities.slice(0, maxItems);

  const getActionIcon = (action: string) => {
    const icons: Record<string, string> = {
      project_created: 'M12 4v16m8-8H4',
      project_updated: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      workflow_started: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z',
      workflow_completed: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      workflow_failed: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
      member_invited: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
      member_joined: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
      member_left: 'M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6',
      comment_added: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
      share_link_created: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
      export_created: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
      import_completed: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
    };
    return icons[action] ?? 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">{l.activity.title}</h3>

      {displayedActivities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{l.activity.noActivity}</p>
        </div>
      ) : (
        <div className="space-y-0">
          {displayedActivities.map((activity, index) => (
            <div key={activity.id} className="flex gap-3 py-3 relative">
              {/* タイムライン */}
              {index < displayedActivities.length - 1 && (
                <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gray-200" />
              )}
              
              {/* アイコン */}
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 z-10">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getActionIcon(activity.action)} />
                </svg>
              </div>

              {/* コンテンツ */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{activity.userName}</span>
                  {' '}
                  <span className="text-gray-600">
                    {ACTIVITY_ACTION_LABELS[activity.action]?.[locale] ?? activity.action}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatRelativeTime(activity.timestamp, locale)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {onLoadMore && filteredActivities.length > maxItems && (
        <button
          onClick={onLoadMore}
          className="w-full py-2 text-sm text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
        >
          {l.activity.loadMore}
        </button>
      )}
    </div>
  );
}

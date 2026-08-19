import React, { useState } from 'react';
import { X, Check, Minus, Pencil, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import type { MeishiGroup } from '../../types/app';
import { useSwipeBack } from '../../hooks/useSwipeBack';
import { useToast } from '../Toast';
import { ConfirmDialog } from '../ConfirmDialog';

/**
 * The 名刺帳 grouping sheet (リメンバーの「グループ」を参考).
 *
 * Two unrelated jobs share one sheet because they share every row: picking
 * which group filters the list below (`onSelectFilter`), and — from the
 * multi-select edit toolbar — filing the selected cards into a group
 * (`onAssign`). Exactly one of the two is passed; which one decides both the
 * header copy and what a tap on a row does. 全て/未分類 are permanent and
 * never show the edit-mode delete/rename controls a user-made group gets.
 */
interface MeishiGroupSheetProps {
  onClose: () => void;
  groups: MeishiGroup[];
  allCount: number;
  unclassifiedCount: number;
  groupCounts: Record<string, number>;
  activeFilter?: 'all' | 'unclassified' | string;
  onSelectFilter?: (filter: 'all' | 'unclassified' | string) => void;
  onAssign?: (groupId: string | null) => void;
  onAddGroup: (name: string) => Promise<void>;
  onRenameGroup: (groupId: string, name: string) => Promise<void>;
  onDeleteGroup: (groupId: string) => Promise<void>;
}

export const MeishiGroupSheet: React.FC<MeishiGroupSheetProps> = ({
  onClose, groups, allCount, unclassifiedCount, groupCounts,
  activeFilter, onSelectFilter, onAssign,
  onAddGroup, onRenameGroup, onDeleteGroup,
}) => {
  useSwipeBack(onClose);
  const toast = useToast();

  const [isEditingGroups, setIsEditingGroups] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  async function commitAdd() {
    const name = draftName.trim();
    setIsAdding(false);
    setDraftName('');
    if (!name) return;
    try {
      await onAddGroup(name);
    } catch {
      toast.error('グループを作成できませんでした');
    }
  }

  async function commitRename(groupId: string) {
    const name = renameDraft.trim();
    setRenamingId(null);
    if (!name) return;
    try {
      await onRenameGroup(groupId, name);
    } catch {
      toast.error('グループ名を変更できませんでした');
    }
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    try {
      await onDeleteGroup(id);
    } catch {
      toast.error('グループを削除できませんでした');
    }
  }

  function handleRowTap(filter: 'all' | 'unclassified' | string) {
    if (isEditingGroups) return;
    if (onSelectFilter) {
      onSelectFilter(filter);
      onClose();
    } else if (onAssign) {
      onAssign(filter === 'unclassified' ? null : filter === 'all' ? null : filter);
      onClose();
    }
  }

  const deletingGroup = groups.find((g) => g.id === pendingDeleteId);

  return (
    <>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className="fixed inset-0 bg-surface z-[120] flex flex-col pt-safe lg:max-w-md lg:left-auto lg:shadow-lg"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-ink">グループ</h1>
          <button aria-label="閉じる" onClick={onClose} className="tap-44 p-2.5 -mr-2.5 text-ink">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex justify-end px-4 pb-2">
          <button
            onClick={() => setIsEditingGroups((v) => !v)}
            className="tap-44 text-sm font-bold text-primary px-2 py-1"
          >
            {isEditingGroups ? '完了' : '編集'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-safe">
          {onSelectFilter && (
            <GroupRow
              label="すべての名刺"
              count={allCount}
              checked={activeFilter === 'all'}
              onTap={() => handleRowTap('all')}
            />
          )}

          {groups.map((group) => (
            renamingId === group.id ? (
              <div key={group.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-line">
                <input
                  autoFocus
                  value={renameDraft}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onBlur={() => commitRename(group.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  maxLength={30}
                  className="flex-1 text-[15px] font-bold text-ink bg-transparent outline-none"
                />
              </div>
            ) : (
              <div key={group.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-line">
                {isEditingGroups ? (
                  <button
                    aria-label={`${group.name}を削除`}
                    onClick={() => setPendingDeleteId(group.id)}
                    className="tap-44 w-6 h-6 rounded-full bg-danger flex items-center justify-center flex-shrink-0"
                  >
                    <Minus className="w-4 h-4 text-white" strokeWidth={3} />
                  </button>
                ) : (
                  <CheckSlot checked={!!onSelectFilter && activeFilter === group.id} />
                )}
                <button
                  onClick={() => handleRowTap(group.id)}
                  disabled={isEditingGroups}
                  className="flex-1 flex items-center justify-between text-left py-0.5"
                >
                  <span className="text-[15px] font-bold text-ink">{group.name}</span>
                  {!isEditingGroups && (
                    <span className="text-sm text-ink-faint">{groupCounts[group.id] ?? 0}枚</span>
                  )}
                </button>
                {isEditingGroups && (
                  <button
                    aria-label={`${group.name}の名前を変更`}
                    onClick={() => { setRenamingId(group.id); setRenameDraft(group.name); }}
                    className="tap-44 p-1 text-ink-muted flex-shrink-0"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
            )
          ))}

          {isAdding ? (
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-line">
              <input
                autoFocus
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={commitAdd}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                placeholder="グループ名を入力してください"
                maxLength={30}
                className="flex-1 text-[15px] font-bold text-ink bg-transparent outline-none placeholder:text-ink-faint placeholder:font-normal"
              />
            </div>
          ) : !isEditingGroups && (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center gap-2 px-4 py-3.5 border-b border-line text-accent"
            >
              <Plus className="w-4 h-4" />
              <span className="text-[15px] font-bold">グループ追加</span>
            </button>
          )}

          <GroupRow
            label="未分類"
            count={unclassifiedCount}
            checked={activeFilter === 'unclassified'}
            onTap={() => handleRowTap('unclassified')}
          />
        </div>
      </motion.div>

      <ConfirmDialog
        isOpen={!!pendingDeleteId}
        title="グループを削除しますか？"
        message={deletingGroup ? `「${deletingGroup.name}」に含まれる名刺は未分類に戻ります。` : undefined}
        confirmLabel="削除する"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </>
  );
};

const CheckSlot: React.FC<{ checked: boolean }> = ({ checked }) => (
  <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
    {checked && <Check className="w-4 h-4 text-primary" strokeWidth={3} />}
  </div>
);

const GroupRow: React.FC<{ label: string; count: number; checked: boolean; onTap: () => void }> = (
  { label, count, checked, onTap },
) => (
  <button onClick={onTap} className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-line text-left">
    <CheckSlot checked={checked} />
    <span className="flex-1 text-[15px] font-bold text-ink">{label}</span>
    <span className="text-sm text-ink-faint">{count}枚</span>
  </button>
);

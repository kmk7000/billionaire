import React from 'react';
import { CheckCircle2, Circle as CircleIcon, IdCard } from 'lucide-react';
import type { Meishi } from '../../types/app';

export const MeishiCard: React.FC<{
  meishi: Meishi;
  isEditMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onClick?: (meishi: Meishi) => void;
}> = ({ meishi, isEditMode, isSelected, onSelect, onClick }) => {
  const formattedDate = (meishi.updatedAt && !meishi.isMyCard)
    ? new Date(meishi.updatedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.')
    : '';

  return (
    <div
      className={`bg-surface px-5 py-4 border-b border-line flex items-center gap-4 hover:bg-canvas transition-colors duration-200 cursor-pointer h-[130px] ${isSelected ? 'bg-primary/5' : ''} ${meishi.isMyCard ? 'bg-canvas/30' : ''}`}
      onClick={() => {
        if (isEditMode) {
          onSelect && onSelect(meishi.id);
        } else {
          onClick && onClick(meishi);
        }
      }}
    >
      {isEditMode && (
        <div className="flex-shrink-0 mr-2">
          {isSelected ? (
            <CheckCircle2 className="w-6 h-6 text-primary fill-primary" stroke="white" />
          ) : (
            <CircleIcon className="w-6 h-6 text-ink-faint" />
          )}
        </div>
      )}
      <div className="flex-1">
        {formattedDate && (
          <p className="text-[13px] font-bold text-ink-faint mb-2">{formattedDate}</p>
        )}
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-[18px] font-bold text-ink">{meishi.name || '名前なし'}</h3>
          {meishi.isMyCard && (
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">本人</span>
          )}
        </div>
        <p className="text-[12px] font-bold text-ink-muted mb-0.5">
          {meishi.position || '職位なし'} {meishi.department && `/ ${meishi.department}`}
        </p>
        <p className="text-[12px] font-bold text-ink-muted">{meishi.company || '会社名なし'}</p>
      </div>
      {/* Cards entered by hand have no photo. This used to fall back to a
          random picsum.photos image, which showed an unrelated stock photo in
          the slot where the card scan belongs. */}
      <div className="w-[120px] h-[70px] bg-canvas rounded border border-line overflow-hidden flex-shrink-0">
        {meishi.imageUrl ? (
          <img
            src={meishi.imageUrl}
            alt={`${meishi.company || ''} ${meishi.name || ''}`.trim() || '名刺'}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="w-full h-full flex items-center justify-center">
            <IdCard className="w-5 h-5 text-ink-faint" />
          </span>
        )}
      </div>
    </div>
  );
};

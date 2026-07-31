import React from 'react';
import { CheckCircle2, Circle as CircleIcon } from 'lucide-react';
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
      className={`bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer h-[130px] ${isSelected ? 'bg-[#0A0A0A]/5' : ''} ${meishi.isMyCard ? 'bg-gray-50/30' : ''}`}
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
            <CheckCircle2 className="w-6 h-6 text-[#0A0A0A] fill-[#0A0A0A]" stroke="white" />
          ) : (
            <CircleIcon className="w-6 h-6 text-gray-300" />
          )}
        </div>
      )}
      <div className="flex-1">
        {formattedDate && (
          <p className="text-[13px] font-bold text-gray-400 mb-2">{formattedDate}</p>
        )}
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-[18px] font-bold text-gray-900">{meishi.name || '名前なし'}</h3>
          {meishi.isMyCard && (
            <span className="text-[10px] font-bold text-[#0A0A0A] bg-[#0A0A0A]/10 px-2 py-0.5 rounded-full border border-[#0A0A0A]/20">本人</span>
          )}
        </div>
        <p className="text-[12px] font-bold text-gray-500 mb-0.5">
          {meishi.position || '職位なし'} {meishi.department && `/ ${meishi.department}`}
        </p>
        <p className="text-[12px] font-bold text-gray-500">{meishi.company || '会社名なし'}</p>
      </div>
      <div className="w-[120px] h-[70px] bg-gray-50 rounded border border-gray-200 overflow-hidden flex-shrink-0">
        <img 
          src={meishi.imageUrl || `https://picsum.photos/seed/${meishi.id}/200/120`} 
          alt="Meishi" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};

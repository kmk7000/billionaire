import React, { useState } from 'react';
import { MessageSquare, ChevronRight, Mail, ArrowLeft, Edit2, Trash2, MoreHorizontal, Download, Phone, MoreVertical, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Tab, Meishi } from '../../types/app';

export const MeishiDetailView: React.FC<{ 
  meishi: Meishi; 
  onBack: () => void; 
  onEdit: () => void;
  onDelete: (id: string) => void;
}> = ({ meishi, onBack, onEdit, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'memo'>('info');
  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);

  const handleSaveToContacts = () => {
    const vCard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${meishi.name}`,
      `ORG:${meishi.company}`,
      `TITLE:${meishi.position}`,
      meishi.phone ? `TEL;TYPE=CELL:${meishi.phone}` : '',
      meishi.email ? `EMAIL:${meishi.email}` : '',
      meishi.address ? `ADR;TYPE=WORK:;;${meishi.address};;;;` : '',
      'END:VCARD'
    ].filter(line => line !== '').join('\n');

    const blob = new Blob([vCard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${meishi.name}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsMoreOptionsOpen(false);
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-white z-[100] flex flex-col overflow-y-auto no-scrollbar pt-safe"
    >
      {/* Header */}
      <div className="sticky top-0 bg-white px-4 py-3 flex items-center justify-between z-10">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button onClick={() => setIsMoreOptionsOpen(true)} className="p-1">
          <MoreVertical className="w-6 h-6 text-gray-900" />
        </button>
      </div>

      {/* Profile Section */}
      <div className="px-6 pt-4 pb-8 flex justify-between items-start">
        <div className="flex-1 pr-4">
          <h2 className="text-[28px] font-bold text-gray-900 mb-1">{meishi.name}</h2>
          <p className="text-[16px] text-gray-900 font-medium mb-1">{meishi.position}</p>
          <p className="text-[16px] text-gray-400 font-medium">{meishi.company}</p>
        </div>
        <div className="w-20 h-20 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
          <img 
            src={meishi.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${meishi.id}`} 
            alt="Profile" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 flex justify-between items-center mb-10">
        <button className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${meishi.phone ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
          <Phone className="w-6 h-6" />
        </button>
        <button className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${meishi.phone ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
          <MessageSquare className="w-6 h-6" />
        </button>
        <button className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${meishi.email ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
          <Mail className="w-6 h-6" />
        </button>
        <button className="w-14 h-14 rounded-full bg-black flex items-center justify-center text-white hover:bg-gray-800 transition-colors">
          <Gift className="w-6 h-6" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-6 mb-6">
        <button 
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-3 text-[15px] font-bold transition-colors relative ${activeTab === 'info' ? 'text-black' : 'text-gray-400'}`}
        >
          名刺情報
          {activeTab === 'info' && (
            <motion.div 
              layoutId="detailTabIndicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" 
            />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('memo')}
          className={`flex-1 py-3 text-[15px] font-bold transition-colors relative ${activeTab === 'memo' ? 'text-black' : 'text-gray-400'}`}
        >
          メモ
          {activeTab === 'memo' && (
            <motion.div 
              layoutId="detailTabIndicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" 
            />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === 'info' ? (
          <div className="space-y-8">
            {/* Information Section */}
            <div className="px-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[17px] font-bold text-gray-900">情報</h3>
                <button onClick={onEdit} className="text-[14px] text-gray-400 flex items-center gap-1">
                  編集 <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <span className="w-24 text-[15px] text-gray-400 font-medium">会社</span>
                  <span className="flex-1 text-[15px] text-gray-900 font-medium">{meishi.company}</span>
                </div>
                {meishi.department && (
                  <div className="flex items-start">
                    <span className="w-24 text-[15px] text-gray-400 font-medium">部署</span>
                    <span className="flex-1 text-[15px] text-gray-900 font-medium">{meishi.department}</span>
                  </div>
                )}
                {meishi.phone && (
                  <div className="flex items-start">
                    <span className="w-24 text-[15px] text-gray-400 font-medium">電話番号</span>
                    <span className="flex-1 text-[15px] text-gray-900 font-medium">{meishi.phone}</span>
                  </div>
                )}
                {meishi.email && (
                  <div className="flex items-start">
                    <span className="w-24 text-[15px] text-gray-400 font-medium">メール</span>
                    <span className="flex-1 text-[15px] text-gray-900 font-medium">{meishi.email}</span>
                  </div>
                )}
                {meishi.address && (
                  <div className="flex items-start">
                    <span className="w-24 text-[15px] text-gray-400 font-medium">住所</span>
                    <span className="flex-1 text-[15px] text-gray-900 font-medium">
                      {meishi.address}
                      {meishi.detailedAddress && <><br />{meishi.detailedAddress}</>}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Group Section */}
            <div className="px-6 pt-6 border-t border-gray-50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[17px] font-bold text-gray-900">グループ</h3>
                <button className="text-[14px] text-gray-400 flex items-center gap-1">
                  設定 <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[15px] text-gray-300 font-medium">
                保存されたグループがありません
              </p>
            </div>

            {/* Registration Date Section */}
            <div className="px-6 pt-6 border-t border-gray-50">
              <h3 className="text-[17px] font-bold text-gray-900 mb-4">名刺登録日</h3>
              <p className="text-[17px] text-gray-900 font-medium">
                {meishi.createdAt 
                  ? (meishi.createdAt.toDate ? meishi.createdAt.toDate() : new Date(meishi.createdAt)).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
                  : meishi.updatedAt 
                    ? new Date(meishi.updatedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
                    : '2026年3月22日'}
              </p>
            </div>

            {/* Sharing Section */}
            <div className="px-6 pt-6 border-t border-gray-50 pb-10">
              <h3 className="text-[17px] font-bold text-gray-900 mb-6">名刺を渡す</h3>
              <div className="flex gap-10">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center text-white">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <span className="text-[13px] text-gray-900 font-medium">メッセージ</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-[#06C755] flex items-center justify-center text-white">
                    <span className="font-bold text-sm">LINE</span>
                  </div>
                  <span className="text-[13px] text-gray-900 font-medium">LINE</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <MoreHorizontal className="w-6 h-6" />
                  </div>
                  <span className="text-[13px] text-gray-900 font-medium">その他</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <p className="text-gray-400 text-sm">メモがありません</p>
          </div>
        )}
      </div>

      {/* More Options Bottom Sheet */}
      <AnimatePresence>
        {isMoreOptionsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[200] flex items-end"
            onClick={() => setIsMoreOptionsOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full rounded-t-3xl p-6 pb-12"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
              
              <div className="space-y-2">
                <button 
                  onClick={() => {
                    setIsMoreOptionsOpen(false);
                    onEdit();
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <Edit2 className="w-6 h-6 text-gray-900" />
                    <span className="font-bold text-gray-900">名刺情報の編集</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900" />
                </button>

                <button 
                  onClick={handleSaveToContacts}
                  className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <Download className="w-6 h-6 text-gray-900" />
                    <span className="font-bold text-gray-900">携帯の連絡先に保存</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900" />
                </button>

                <button 
                  onClick={() => {
                    setIsConfirmDeleteDialogOpen(true);
                    setIsMoreOptionsOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <Trash2 className="w-6 h-6 text-red-500" />
                    <span className="font-bold text-red-500">名刺の削除</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {isConfirmDeleteDialogOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[300]"
              onClick={() => setIsConfirmDeleteDialogOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: '-50%', x: '-50%' }}
              animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
              exit={{ opacity: 0, scale: 0.95, y: '-50%', x: '-50%' }}
              className="fixed top-1/2 left-1/2 w-[90%] max-w-sm bg-white rounded-2xl z-[310] p-6 text-center shadow-xl"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                名刺を削除しますか？
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                削除した名刺は復元できません。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsConfirmDeleteDialogOpen(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => {
                    onDelete(meishi.id);
                    setIsConfirmDeleteDialogOpen(false);
                  }}
                  className="flex-1 py-3 px-4 bg-[#FF4B4B] text-white rounded-xl font-bold hover:bg-red-600"
                >
                  削除
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

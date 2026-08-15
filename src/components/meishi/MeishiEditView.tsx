import React, { useState } from 'react';
import { User, ChevronRight, ArrowLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Meishi } from '../../types/app';
import { resizeImage } from '../../utils/imageUtils';

export const MeishiEditView: React.FC<{ 
  meishi: Meishi; 
  onBack: () => void; 
  onSave: (updatedMeishi: Meishi) => void 
}> = ({ meishi, onBack, onSave }) => {
  const [formData, setFormData] = useState<Meishi>(meishi);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const galleryInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const resizedBase64 = await resizeImage(base64, 400, 400);
        setFormData(prev => ({ ...prev, imageUrl: resizedBase64 }));
        setShowPhotoOptions(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-surface z-[200] flex flex-col overflow-y-auto no-scrollbar pt-safe"
    >
      {/* Header */}
      <div className="sticky top-0 bg-surface px-4 py-3 flex items-center justify-between border-b border-line z-10">
        <div className="flex items-center gap-4">
          <button aria-label="戻る" onClick={onBack} className="p-2 -ml-2 text-ink">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h3 className="text-[17px] font-bold text-ink">名刺情報の編集</h3>
        </div>
        <button onClick={handleSave} className="text-[17px] text-ink font-bold px-2">保存</button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Profile Image Section */}
        <div className="flex justify-between items-start">
          <div className="flex-1 space-y-6">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-ink-muted">名前</label>
              <input 
                type="text" 
                placeholder="名前"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full py-2.5 px-3 rounded-md border border-line focus:border-black outline-none transition-all"
              />
            </div>
          </div>
          <div className="ml-6 relative">
            <div 
              onClick={() => setShowPhotoOptions(true)}
              className="w-20 h-20 rounded-full bg-primary-soft flex items-center justify-center text-ink-faint overflow-hidden border border-line cursor-pointer"
            >
              {formData.imageUrl ? (
                <img src={formData.imageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10" />
              )}
            </div>
            <button 
              onClick={() => setShowPhotoOptions(true)}
              className="absolute bottom-0 left-0 right-0 py-1 bg-ink/60 text-[10px] font-bold text-white text-center rounded-b-full"
            >
              編集
            </button>
            
            {/* Hidden Inputs */}
            <input 
              type="file" 
              ref={galleryInputRef} 
              onChange={handleProfileImageChange} 
              accept="image/*" 
              className="hidden" 
            />
            <input 
              type="file" 
              ref={cameraInputRef} 
              onChange={handleProfileImageChange} 
              accept="image/*" 
              capture="environment"
              className="hidden" 
            />
          </div>
        </div>

        {/* Photo Options Modal */}
        <AnimatePresence>
          {showPhotoOptions && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPhotoOptions(false)}
                className="fixed inset-0 bg-ink/40 z-[300]"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-3xl z-[301] px-6 pt-6 pb-12"
              >
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xl font-bold text-ink">プロフィール写真</h4>
                  <button onClick={() => setShowPhotoOptions(false)} className="p-2 -mr-2 text-ink-faint">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="divide-y divide-line">
                  <button 
                    onClick={() => galleryInputRef.current?.click()}
                    className="w-full flex items-center justify-between py-4 group"
                  >
                    <span className="text-[17px] text-ink">写真ライブラリから選択</span>
                    <ChevronRight className="w-5 h-5 text-ink-faint group-active:translate-x-1 transition-transform" />
                  </button>
                  
                  <button 
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full flex items-center justify-between py-4 group"
                  >
                    <span className="text-[17px] text-ink">写真を撮る</span>
                    <ChevronRight className="w-5 h-5 text-ink-faint group-active:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Other Fields */}
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-ink-muted">役職</label>
            <input 
              type="text" 
              placeholder="例) チームリーダー"
              value={formData.position}
              onChange={e => setFormData({...formData, position: e.target.value})}
              className="w-full py-2.5 px-3 rounded-md border border-line focus:border-black outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-ink-muted">部署</label>
            <input 
              type="text" 
              placeholder="例) 経営戦略室"
              value={formData.department || ''}
              onChange={e => setFormData({...formData, department: e.target.value})}
              className="w-full py-2.5 px-3 rounded-md border border-line focus:border-black outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-ink-muted">会社</label>
            <input 
              type="text" 
              placeholder="会社名"
              value={formData.company}
              onChange={e => setFormData({...formData, company: e.target.value})}
              className="w-full py-2.5 px-3 rounded-md border border-line focus:border-black outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-ink-muted">携帯電話</label>
            <input 
              type="tel" 
              placeholder="01012345678"
              value={formData.mobile || ''}
              onChange={e => setFormData({...formData, mobile: e.target.value})}
              className="w-full py-2.5 px-3 rounded-md border border-line focus:border-black outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-ink-muted">メール</label>
            <input 
              type="email" 
              placeholder="remember@rmbr.com"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full py-2.5 px-3 rounded-md border border-line focus:border-black outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-ink-muted">電話</label>
            <input 
              type="tel" 
              placeholder="0212345678"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full py-2.5 px-3 rounded-md border border-line focus:border-black outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-ink-muted">ファックス</label>
            <input 
              type="tel" 
              placeholder="0212345678"
              value={formData.fax || ''}
              onChange={e => setFormData({...formData, fax: e.target.value})}
              className="w-full py-2.5 px-3 rounded-md border border-line focus:border-black outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-ink-muted">住所</label>
            <input 
              type="text" 
              placeholder="東京都港区..."
              value={formData.address || ''}
              onChange={e => setFormData({...formData, address: e.target.value})}
              className="w-full py-2.5 px-3 rounded-md border border-line focus:border-black outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5 pb-10">
            <label className="text-sm font-bold text-ink-muted">建物名・部屋番号</label>
            <input 
              type="text" 
              placeholder="6階"
              value={formData.detailedAddress || ''}
              onChange={e => setFormData({...formData, detailedAddress: e.target.value})}
              className="w-full py-2.5 px-3 rounded-md border border-line focus:border-black outline-none transition-all"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

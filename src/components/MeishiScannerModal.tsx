import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Flashlight, 
  ImageIcon, 
  MoreHorizontal, 
  RotateCw, 
  Wand2, 
  Crop, 
  ScanLine, 
  ChevronRight, 
  ChevronLeft, 
  Send, 
  Briefcase, 
  Loader2, 
  CheckCircle2, 
  Edit2 
} from 'lucide-react';
import { useMeishiScanner } from '../hooks/useMeishiScanner';

export interface MeishiScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMeishi: (capturedImage: string, capturedBack: string | null, settings: 'send' | 'save') => Promise<void>;
  isProcessing: boolean;
  isRegisteringMyMeishi?: boolean;
  onOpenDirectInput?: () => void;
  onViewSavedMeishis?: () => void;
}

export const MeishiScannerModal: React.FC<MeishiScannerModalProps> = ({
  isOpen,
  onClose,
  onSaveMeishi,
  isProcessing,
  isRegisteringMyMeishi = false,
  onOpenDirectInput,
  onViewSavedMeishis,
}) => {
  const {
    videoRef,
    meishiFileInputRef,
    meishiStep,
    setMeishiStep,
    meishiSide,
    capturedMeishiImage,
    capturedMeishiBack,
    isScanning,
    useScanned,
    scanDetected,
    toggleUseScanned,
    meishiSettings,
    setMeishiSettings,
    isFlashOn,
    isCapturing,
    isMeishiMoreOptionsOpen,
    setIsMeishiMoreOptionsOpen,
    toggleFlash,
    captureImage,
    addBackSide,
    handleAlbumClick,
    handleFileChange,
    handleClose,
  } = useMeishiScanner({ isOpen, onClose });

  const handleConfirmMeishi = () => {
    setMeishiStep('settings');
  };

  const handleFinalSave = async () => {
    if (!capturedMeishiImage) return;
    await onSaveMeishi(capturedMeishiImage, capturedMeishiBack, meishiSettings);
    setMeishiStep('success');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-0 bg-black z-[200] flex flex-col max-w-md mx-auto overflow-hidden pt-safe"
      >
        {/* Hidden File Input for Album Pick */}
        <input 
          type="file" 
          ref={meishiFileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />

        {meishiStep === 'camera' && (
          <>
            {/* Camera View Header */}
            <div className="p-4 flex justify-between items-center z-10 text-white bg-gradient-to-b from-black/60 to-transparent">
              <button aria-label="フラッシュを切り替え" 
                onClick={toggleFlash}
                className={`p-2 rounded-full transition-colors ${isFlashOn ? 'bg-amber-400 text-black' : 'bg-white/10 text-white'}`}
              >
                <Flashlight className="w-6 h-6" />
              </button>
              <span className="font-bold text-sm">
                {isRegisteringMyMeishi ? 'マイ名刺登録' : '名刺スキャン'}
              </span>
              <button aria-label="閉じる" onClick={handleClose} className="p-2">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Camera Viewfinder */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />

              {/* Capture Flash animation */}
              {isCapturing && (
                <div className="absolute inset-0 bg-white animate-pulse z-20" />
              )}

              {/* Overlay with Guide Frame */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {/* Dark Mask around the guide frame */}
                <div className="absolute inset-0 bg-black/40" />

                {/* Guide Frame */}
                <div className="relative w-[85%] aspect-[1.6/1] z-10 shadow-2xl">
                  {/* Guide corners */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#0A0A0A] rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#0A0A0A] rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#0A0A0A] rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#0A0A0A] rounded-br-lg" />

                  {/* Inner subtle border */}
                  <div className="absolute inset-0 border border-white/30 rounded-lg" />

                  {/* Animated scanning line */}
                  <motion.div 
                    animate={{ y: ["0%", "100%", "0%"] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                    className="w-full h-0.5 bg-[#0A0A0A] shadow-[0_0_8px_#0A0A0A]"
                  />
                </div>

                <div className="mt-6 z-10 text-white font-bold text-lg drop-shadow-md">
                  {meishiSide === 'front' ? '表面を枠に合わせてください' : '裏面を枠に合わせてください'}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="p-8 pb-12 flex items-center justify-around bg-white">
              <button 
                onClick={handleAlbumClick}
                className="flex flex-col items-center gap-1 text-gray-900 active:scale-95 transition-transform"
              >
                <ImageIcon className="w-7 h-7" />
                <span className="text-xs font-bold">アルバム</span>
              </button>

              <button aria-label="撮影する" 
                onClick={captureImage}
                className="w-20 h-20 rounded-full border-4 border-[#0A0A0A] p-1 flex items-center justify-center active:scale-95 transition-transform"
              >
                <div className="w-full h-full rounded-full bg-[#0A0A0A]" />
              </button>

              <button 
                onClick={() => setIsMeishiMoreOptionsOpen(true)}
                className="flex flex-col items-center gap-1 text-gray-900 active:scale-95 transition-transform"
              >
                <MoreHorizontal className="w-7 h-7" />
                <span className="text-xs font-bold">その他</span>
              </button>
            </div>
          </>
        )}

        {meishiStep === 'preview' && (
          <div className="flex-1 flex flex-col bg-black">
            {/* Header */}
            <div className="p-4 flex items-center justify-end text-white">
              <button aria-label="閉じる" onClick={handleClose}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-4">
              <div className="relative w-full max-w-sm min-h-[140px] rounded-lg overflow-hidden shadow-2xl border border-white/20 bg-white flex items-center justify-center">
                <img
                  src={meishiSide === 'front' ? capturedMeishiImage! : capturedMeishiBack!}
                  alt="Captured Meishi"
                  className="w-full h-auto max-h-[46vh] object-contain"
                />
                {isScanning && (
                  <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-2 text-white">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-xs font-medium">名刺を読み取っています...</span>
                  </div>
                )}
              </div>

              {/* Scan result control. Hidden until the scan finishes so the
                  user is never offered a toggle that does nothing. */}
              {!isScanning && (
                <div className="mt-4 w-full max-w-sm">
                  <button
                    onClick={toggleUseScanned}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-white active:scale-95 transition-transform"
                  >
                    <span className="flex items-center gap-2 text-sm font-bold">
                      <ScanLine className="w-4 h-4" />
                      {useScanned ? 'スキャン補正' : '撮影した原本'}
                    </span>
                    <span className="text-xs text-white/70">
                      {useScanned ? '原本に戻す' : '補正を使う'}
                    </span>
                  </button>
                  <p className="mt-2 text-[11px] text-white/50 text-center leading-relaxed">
                    {scanDetected
                      ? '名刺の輪郭を検出して、傾きと影を補正しました。'
                      : '名刺の輪郭を検出できませんでした。枠内いっぱいに収めて再撮影すると精度が上がります。'}
                  </p>
                </div>
              )}

              {meishiSide === 'front' && !capturedMeishiBack && (
                <button 
                  onClick={addBackSide}
                  className="mt-8 flex items-center gap-1 text-white font-bold bg-white/10 px-4 py-2 rounded-full border border-white/20 active:scale-95 transition-transform"
                >
                  裏面追加 <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {meishiSide === 'back' && (
                <div className="mt-8 text-white/60 text-sm font-medium">
                  両面の撮影が完了しました
                </div>
              )}
            </div>

            <div className="p-8 flex gap-4">
              <button 
                onClick={() => setMeishiStep('camera')}
                className="flex-1 py-4 rounded-lg font-bold border border-white text-white active:scale-95 transition-transform"
              >
                再撮影
              </button>
              <button 
                onClick={handleConfirmMeishi}
                className="flex-1 py-4 rounded-lg font-bold bg-white text-black active:scale-95 transition-transform"
              >
                確認
              </button>
            </div>
          </div>
        )}

        {meishiStep === 'settings' && (
          <div className="flex-1 flex flex-col bg-gray-50">
            <div className="p-4 flex items-center justify-between bg-white border-b sticky top-0 z-10">
              <button onClick={() => setMeishiStep('preview')}>
                <ChevronLeft className="w-6 h-6 text-gray-900" />
              </button>
              <span className="font-bold text-gray-900">名刺登録設定</span>
              <div className="w-6" />
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Previews */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-500 text-center">表面</p>
                  <div className="aspect-[1.6/1] w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white">
                    <img 
                      src={capturedMeishiImage!} 
                      alt="Front" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                </div>
                {capturedMeishiBack && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 text-center">裏面</p>
                    <div className="aspect-[1.6/1] w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white">
                      <img 
                        src={capturedMeishiBack} 
                        alt="Back" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#0A0A0A]/10 flex items-center justify-center text-[#0A0A0A]">
                      <Send className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">名刺を送る</p>
                      <p className="text-xs text-gray-500">登録と同時に相手に送信します</p>
                    </div>
                  </div>
                  <div 
                    onClick={() => setMeishiSettings(meishiSettings === 'send' ? 'save' : 'send')}
                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${meishiSettings === 'send' ? 'bg-[#0A0A0A]' : 'bg-gray-200'}`}
                  >
                    <motion.div 
                      animate={{ x: meishiSettings === 'send' ? 24 : 4 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                    />
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#0A0A0A]/10 flex items-center justify-center text-[#0A0A0A]">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">名刺帳に保存</p>
                      <p className="text-xs text-gray-500">名刺帳に新しい名刺を登録します</p>
                    </div>
                  </div>
                  <div 
                    onClick={() => setMeishiSettings(meishiSettings === 'save' ? 'send' : 'save')}
                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${meishiSettings === 'save' ? 'bg-[#0A0A0A]' : 'bg-gray-200'}`}
                  >
                    <motion.div 
                      animate={{ x: meishiSettings === 'save' ? 24 : 4 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border-t">
              <button 
                onClick={handleFinalSave}
                disabled={isProcessing}
                className="w-full py-4 rounded-xl font-bold bg-[#0A0A0A] hover:bg-black text-white shadow-lg shadow-[#0A0A0A]/20 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98 transition-transform"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    AI解析・保存中...
                  </>
                ) : (
                  '名刺を保存する'
                )}
              </button>
            </div>
          </div>
        )}

        {meishiStep === 'success' && (
          <div className="flex-1 flex flex-col bg-white relative">
            <button aria-label="閉じる" 
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-8">
                <div className="w-20 h-20 bg-[#0A0A0A]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-[#0A0A0A]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 leading-tight">
                  <span className="text-[#0A0A0A]">1枚</span>の名刺を<br />
                  登録しました！
                </h3>
                <p className="mt-4 text-gray-400 text-sm leading-relaxed max-w-[240px] mx-auto">
                  AI解析により名刺情報を正確に入力中.<br />
                  名刺帳からご確認いただけます。
                </p>
              </div>
            </div>

            <div className="p-6 bg-white border-t">
              <button 
                onClick={() => {
                  handleClose();
                  onViewSavedMeishis?.();
                }}
                className="w-full py-4 rounded-xl font-bold bg-white border-2 border-[#0A0A0A] text-[#0A0A0A] hover:bg-[#0A0A0A]/5 transition-colors"
              >
                見に行く
              </button>
            </div>
          </div>
        )}

        {/* More Options Sheet */}
        <AnimatePresence>
          {isMeishiMoreOptionsOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[250] flex items-end justify-center"
              onClick={() => setIsMeishiMoreOptionsOpen(false)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="w-full bg-white rounded-t-2xl p-6 space-y-4 max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-bold text-gray-900 mb-2 text-center">その他の登録方法</h3>
                <button 
                  onClick={() => {
                    setIsMeishiMoreOptionsOpen(false);
                    onOpenDirectInput?.();
                  }}
                  className="w-full p-4 bg-gray-50 rounded-xl flex items-center gap-3 hover:bg-gray-100 transition-colors"
                >
                  <Edit2 className="w-5 h-5 text-[#0A0A0A]" />
                  <span className="font-bold text-gray-900">直接入力して登録</span>
                </button>
                <button 
                  onClick={() => {
                    setIsMeishiMoreOptionsOpen(false);
                    handleAlbumClick();
                  }}
                  className="w-full p-4 bg-gray-50 rounded-xl flex items-center gap-3 hover:bg-gray-100 transition-colors"
                >
                  <ImageIcon className="w-5 h-5 text-[#0A0A0A]" />
                  <span className="font-bold text-gray-900">アルバムから選択</span>
                </button>
                <button 
                  onClick={() => setIsMeishiMoreOptionsOpen(false)}
                  className="w-full py-3 text-gray-500 font-bold text-center mt-2"
                >
                  キャンセル
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default MeishiScannerModal;

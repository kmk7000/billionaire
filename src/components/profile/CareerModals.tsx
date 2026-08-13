import React from 'react';
import { ArrowLeft, ChevronRight, ChevronDown, Edit3, Check, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { JAPANESE_COMPANIES, PREFECTURES, COUNTRIES } from '../../constants/profileData';
import { calculateCareerDuration, type CareerEditor } from '../../hooks/useCareerEditor';

export const CareerModals: React.FC<{ career: CareerEditor }> = ({ career: c }) => (
  <>
    {/* Career List Overlay */}
    <AnimatePresence>
      {c.isListOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 bg-white z-[60] overflow-y-auto no-scrollbar max-w-md mx-auto pt-safe"
        >
          {/* Header */}
          <div className="flex items-center p-4 bg-white sticky top-0 z-10">
            <button aria-label="戻る" onClick={c.closeList} className="mr-3">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h2 className="text-lg font-bold text-gray-900">経歴編集</h2>
          </div>

          <div className="flex flex-col">
            {/* Total Years */}
            <div className="p-4 bg-white">
              <label className="block text-sm font-bold text-gray-400 mb-2">
                総経歴年数
              </label>
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <input
                  type="text"
                  value={c.totalCareerYears}
                  onChange={(e) => c.setTotalCareerYears(e.target.value)}
                  onBlur={() => c.handleSaveTotalCareerYears(c.totalCareerYears)}
                  placeholder="例) 15"
                  className="w-full text-gray-900 placeholder-gray-300 focus:outline-none text-lg"
                />
                <ChevronRight className="w-5 h-5 text-gray-900 flex-shrink-0" />
              </div>
            </div>

            {/* Divider */}
            <div className="h-2 bg-gray-50 w-full"></div>

            {/* Add Career */}
            <div className="p-4 bg-white">
              <h3 className="text-sm font-bold text-gray-400 mb-4">経歴追加</h3>
              <button
                onClick={c.openNewCareer}
                className="w-full flex items-center justify-between py-3 border-b border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <Edit3 className="w-5 h-5 text-gray-900" />
                  <span className="font-bold text-gray-900">直接入力する</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-900" />
              </button>
            </div>

            {/* Career List */}
            {c.careers.length > 0 && (
              <div className="p-4 bg-white pt-0">
                <div className="space-y-6">
                  {c.careers.map((careerItem) => (
                    <div
                      key={careerItem.id}
                      onClick={() => c.openExistingCareer(careerItem)}
                      className="flex flex-col cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-900 text-lg mb-1">{careerItem.companyName}</h4>
                        <ChevronRight className="w-5 h-5 text-gray-900 flex-shrink-0" />
                      </div>
                      <p className="text-sm text-gray-400 mb-3">
                        {careerItem.startDate.replace('-', '.')} ~ {careerItem.isCurrent ? '現在' : careerItem.endDate?.replace('-', '.')} ({calculateCareerDuration(careerItem.startDate, careerItem.endDate, careerItem.isCurrent)})
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Career Edit Overlay */}
    <AnimatePresence>
      {c.isEditOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 bg-white z-[60] overflow-y-auto no-scrollbar max-w-md mx-auto pt-safe"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <button onClick={() => c.setIsEditOpen(false)}>
                <ArrowLeft className="w-6 h-6 text-gray-900" />
              </button>
              <h2 className="text-lg font-bold text-gray-900">{c.editingCareerId ? '経歴編集' : '経歴追加'}</h2>
            </div>
            <button
              onClick={c.handleSaveCareer}
              disabled={!c.company || !c.startDate || (!c.isCurrent && !c.endDate)}
              className={`font-bold text-sm ${(!c.company || !c.startDate || (!c.isCurrent && !c.endDate)) ? 'text-gray-300' : 'text-[#0A0A0A]'}`}
            >
              完了
            </button>
          </div>

          <div className="p-4">
            {/* Company Field */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                会社 <span className="text-red-500">*</span>
              </label>
              <div
                onClick={() => c.setIsCompanySearchOpen(true)}
                className="w-full border border-gray-200 rounded-md h-[45px] px-4 flex justify-between items-center cursor-pointer"
              >
                <span className={c.company ? 'text-gray-900' : 'text-gray-400'}>
                  {c.company || '例）LINEヤフー'}
                </span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => c.setIsCurrent(!c.isCurrent)}
                  className="flex items-center gap-2"
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${c.isCurrent ? 'border-gray-900 bg-gray-900' : 'border-gray-300'}`}>
                    {c.isCurrent && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm text-gray-900">在職中</span>
                </button>
              </div>
            </div>

            {/* Date Fields */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  入社 <span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => c.openDatePicker('start')}
                  className="w-full border border-gray-200 rounded-md h-[45px] px-4 flex justify-between items-center cursor-pointer"
                >
                  <span className={c.startDate ? 'text-gray-900' : 'text-gray-400'}>
                    {c.startDate ? `${c.startDate.split('-')[0]}年 ${c.startDate.split('-')[1]}月` : '入社年月'}
                  </span>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  退社 {!c.isCurrent && <span className="text-red-500">*</span>}
                </label>
                <div
                  onClick={() => {
                    if (!c.isCurrent) c.openDatePicker('end');
                  }}
                  className={`w-full border border-gray-200 rounded-md h-[45px] px-4 flex justify-between items-center ${c.isCurrent ? 'bg-gray-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className={c.endDate && !c.isCurrent ? 'text-gray-900' : 'text-gray-400'}>
                    {c.isCurrent ? '退社年月' : (c.endDate ? `${c.endDate.split('-')[0]}年 ${c.endDate.split('-')[1]}月` : '退社年月')}
                  </span>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Conditional Fields when Company is selected */}
            {c.company && (
              <>
                {/* Title Field */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    役職
                  </label>
                  <input
                    type="text"
                    value={c.title}
                    onChange={(e) => c.setTitle(e.target.value)}
                    placeholder="例）チームリーダー/課長"
                    className="w-full border border-gray-200 rounded-md h-[45px] px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900"
                  />
                </div>

                {/* Department Field */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    部署
                  </label>
                  <input
                    type="text"
                    value={c.department}
                    onChange={(e) => c.setDepartment(e.target.value)}
                    placeholder="例）企画戦略室"
                    className="w-full border border-gray-200 rounded-md h-[45px] px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900"
                  />
                </div>

                {/* Description Field */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-gray-900">
                      業務説明
                    </label>
                  </div>
                  <div className="relative">
                    <textarea
                      value={c.description}
                      onChange={(e) => c.setDescription(e.target.value)}
                      placeholder="例）プロジェクト管理およびチームリーダーの役割を遂行&#10;・顧客の要件分析および解決策の提案&#10;・データ分析を通じたインサイトの導出"
                      className="w-full border border-gray-200 rounded-md p-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 min-h-[200px] resize-none"
                      maxLength={5000}
                    />
                    <div className="absolute bottom-3 left-4 text-xs text-gray-400">
                      専門性のために50文字以上を推奨します
                    </div>
                    <div className="absolute bottom-3 right-4 text-xs text-gray-400">
                      {c.description.length}/5000字
                    </div>
                  </div>
                </div>

                {/* Location Field */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    会社所在地
                  </label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <select
                        value={c.locationRegion}
                        onChange={(e) => {
                          c.setLocationRegion(e.target.value);
                          if (e.target.value !== '海外') {
                            c.setLocationCountry('');
                          }
                        }}
                        className="w-full border border-gray-200 rounded-md h-[45px] px-4 text-gray-900 appearance-none focus:outline-none focus:border-gray-900 bg-white"
                      >
                        <option value="" disabled hidden className="text-gray-400">地域を選択</option>
                        {PREFECTURES.map(pref => (
                          <option key={pref} value={pref}>{pref}</option>
                        ))}
                        <option value="海外">海外</option>
                      </select>
                      <ChevronRight className="w-5 h-5 text-gray-900 absolute right-4 top-1/2 transform -translate-y-1/2 rotate-90 pointer-events-none" />
                    </div>

                    {c.locationRegion === '海外' && (
                      <div className="relative flex-1">
                        <select
                          value={c.locationCountry}
                          onChange={(e) => c.setLocationCountry(e.target.value)}
                          className="w-full border border-gray-200 rounded-md h-[45px] px-4 text-gray-900 appearance-none focus:outline-none focus:border-gray-900 bg-white"
                        >
                          <option value="" disabled hidden className="text-gray-400">国家</option>
                          {COUNTRIES.map(country => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                        <ChevronRight className="w-5 h-5 text-gray-900 absolute right-4 top-1/2 transform -translate-y-1/2 rotate-90 pointer-events-none" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Delete Button */}
                {c.editingCareerId && (
                  <div className="mt-12 mb-8 flex justify-center">
                    <button
                      onClick={c.handleDeleteCareer}
                      className="text-gray-500 font-medium hover:text-red-500 transition-colors"
                    >
                      経歴を削除
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Company Search Overlay */}
    <AnimatePresence>
      {c.isCompanySearchOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 bg-white z-[70] overflow-y-auto no-scrollbar max-w-md mx-auto pt-safe"
        >
          <div className="p-4 flex items-center gap-3 border-b border-gray-100">
            <div className="flex-1 bg-gray-50 rounded-lg flex items-center px-3 py-2">
              <Search className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                value={c.companySearchQuery}
                onChange={(e) => c.setCompanySearchQuery(e.target.value)}
                placeholder="会社名を入力"
                className="bg-transparent w-full text-sm focus:outline-none"
                autoFocus
              />
              {c.companySearchQuery && (
                <button onClick={() => c.setCompanySearchQuery('')}>
                  <X className="w-4 h-4 text-gray-400 bg-gray-200 rounded-full p-0.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => {
                c.setIsCompanySearchOpen(false);
                c.setCompanySearchQuery('');
              }}
              className="text-sm font-medium"
            >
              キャンセル
            </button>
          </div>

          <div className="p-4">
            {c.companySearchQuery ? (
              <div>
                {JAPANESE_COMPANIES.filter(name => name.includes(c.companySearchQuery)).map((companyName, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      c.setCompany(companyName);
                      c.setIsCompanySearchOpen(false);
                      c.setCompanySearchQuery('');
                    }}
                    className="py-3 border-b border-gray-100 text-sm cursor-pointer"
                  >
                    {companyName}
                  </div>
                ))}
                <div className="text-center mt-8">
                  <p className="text-sm text-gray-500 mb-2">お探しの会社名がありませんか？</p>
                  <button
                    onClick={() => {
                      c.setCompany(c.companySearchQuery);
                      c.setIsCompanySearchOpen(false);
                      c.setCompanySearchQuery('');
                    }}
                    className="text-[#0A0A0A] text-sm font-medium underline"
                  >
                    '{c.companySearchQuery}' を直接入力
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-sm text-gray-400 mt-8">
                最近検索した会社名がありません
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Date Picker Overlay */}
    <AnimatePresence>
      {c.isDatePickerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => c.setIsDatePickerOpen(null)}
            className="fixed inset-0 bg-black/40 z-[80] max-w-md mx-auto"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white z-[90] rounded-t-2xl max-w-md mx-auto"
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <button
                onClick={c.clearDate}
                className="text-[#0A0A0A] font-medium"
              >
                削除
              </button>
              <button
                onClick={c.confirmDate}
                className="text-[#0A0A0A] font-medium"
              >
                完了
              </button>
            </div>

            <div className="flex justify-center items-center h-48 gap-8 px-8">
              <div className="flex-1 h-full overflow-y-auto snap-y snap-mandatory no-scrollbar relative" id="year-scroll">
                <div className="h-20"></div>
                {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <div
                    key={year}
                    onClick={() => c.setTempDate(prev => ({ ...prev, year }))}
                    className={`h-8 flex items-center justify-center snap-center cursor-pointer ${c.tempDate.year === year ? 'text-xl font-bold text-gray-900' : 'text-gray-400'}`}
                  >
                    {year}年
                  </div>
                ))}
                <div className="h-20"></div>
              </div>
              <div className="flex-1 h-full overflow-y-auto snap-y snap-mandatory no-scrollbar relative" id="month-scroll">
                <div className="h-20"></div>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <div
                    key={month}
                    onClick={() => c.setTempDate(prev => ({ ...prev, month }))}
                    className={`h-8 flex items-center justify-center snap-center cursor-pointer ${c.tempDate.month === month ? 'text-xl font-bold text-gray-900' : 'text-gray-400'}`}
                  >
                    {month}月
                  </div>
                ))}
                <div className="h-20"></div>
              </div>
              {/* Selection Highlight */}
              <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 h-8 bg-gray-100 rounded-lg -z-10 pointer-events-none"></div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  </>
);

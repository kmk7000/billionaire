import React, { useState, useEffect } from 'react';
import { 
  UserPlus,
  ThumbsUp,
  BookOpen,
  Megaphone,
  HelpCircle,
  Headset,
  UserCircle,
  CreditCard, 
  MessageSquare, 
  Briefcase, 
  User, 
  Plus, 
  Search, 
  Bell, 
  TrendingUp,
  Building2,
  Clock,
  ChevronRight,
  Camera,
  Filter,
  Mail,
  Apple,
  LogOut,
  Loader2,
  Check,
  Home,
  Contact,
  FileText,
  Share2,
  BarChart2,
  GraduationCap,
  ArrowLeft,
  Settings,
  Edit2,
  UserCog,
  ChevronDown,
  ChevronLeft,
  X,
  Trash2,
  XCircle,
  Flashlight,
  Image as ImageIcon,
  MoreHorizontal,
  Send,
  RotateCw,
  Wand2,
  PenLine,
  Copy,
  Crop,
  Menu,
  MapPin,
  ArrowUpDown,
  Edit3,
  AlertCircle,
  Target,
  RefreshCw,
  Minus,
  ChevronUp,
  Users,
  CheckCircle2,
  Circle as CircleIcon,
  Download,
  Phone,
  Smartphone,
  Printer,
  MoreVertical,
  Gift,
  History,
  Cake,
  Sparkles,
  PenSquare,
  ShieldCheck,
  Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleMap, useJsApiLoader, Marker as GoogleMarker, InfoWindow, Circle } from '@react-google-maps/api';
import { 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut, 
  signInWithCustomToken,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  onSnapshot, 
  serverTimestamp, 
  orderBy,
  where,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  addDoc,
  deleteField,
  deleteDoc
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType, EmailAuthProvider } from './firebase';
import { linkWithCredential, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import SimpleLoginSettings from './components/SimpleLoginSettings';
import MeishiScannerModal from './components/MeishiScannerModal';
import { PublicCardView } from './components/PublicCardView';
import { resizeImage } from './utils/imageUtils';

// --- Types ---
type Tab = 'today' | 'meishi' | 'connect' | 'jobs' | 'community';

interface Career {
  id: string;
  companyName: string;
  isCurrent: boolean;
  startDate: string; // YYYY-MM
  endDate?: string; // YYYY-MM
  title?: string;
  department?: string;
  description?: string;
  location?: string;
}

interface Education {
  id: string;
  schoolName: string;
  degree?: string;
  major?: string;
  startDate?: string; // YYYY
  endDate?: string; // YYYY
  isCurrent: boolean;
  description?: string;
}

interface Language {
  id: string;
  language: string;
  level: string;
}

interface Lecture {
  id: string;
  title: string;
  date: string;
}

interface Publication {
  id: string;
  title: string;
  date: string;
}

interface Article {
  id: string;
  title: string;
  url: string;
}

interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  company?: string;
  position?: string;
  role: string;
  introduction?: string;
  isJobSeekingIntro?: boolean;
  totalCareerYears?: string;
  careers?: Career[];
  educations?: Education[];
  jobs?: string[];
  skills?: string[];
  languages?: Language[];
  websites?: string[];
  lectures?: Lecture[];
  publications?: Publication[];
  articles?: Article[];
  gender?: '男性' | '女性' | '選択しない';
  birthYear?: number;
  birthday?: string;
  awards?: string[];
  certificates?: string[];
}

interface Meishi {
  id: string;
  ownerUid?: string;
  name: string;
  company: string;
  position: string;
  department?: string;
  email: string;
  phone: string;
  mobile?: string;
  fax?: string;
  address?: string;
  detailedAddress?: string;
  imageUrl?: string;
  imageUrlBack?: string;
  isMyCard?: boolean;
  updatedAt: string;
  createdAt?: any;
  lat?: number;
  lng?: number;
  history?: Meishi[];
}

interface Post {
  id: string;
  category: string;
  title: string;
  content: string;
  authorCompany: string;
  likes: number;
  comments: number;
  createdAt: string;
}

interface Job {
  id: string;
  company: string;
  title: string;
  location: string;
  salary: string;
  cultureScore: number;
  tags: string[];
  logoUrl?: string;
}

// --- Mock Data ---
const MOCK_MEISHI: Meishi[] = [
  { id: '1', name: '田中 健一', company: '株式会社トヨタ', position: '営業部長', email: 'tanaka@toyota.jp', phone: '090-1234-5678', updatedAt: '2024.03.20' },
  { id: '2', name: '佐藤 由衣', company: 'ソフトバンクグループ', position: 'パートナーシップマネージャー', email: 'yui.sato@softbank.co.jp', phone: '080-8765-4321', updatedAt: '2024.03.18' },
  { id: '3', name: '伊藤 涼介', company: '電通', position: '企画チーム', email: 'ito@dentsu.co.jp', phone: '070-1111-2222', updatedAt: '2024.03.15' },
];

const MOCK_POSTS: Post[] = [
  { id: '1', category: 'キャリア', title: '30代後半での転職、正直どうですか？', content: '現在大手メーカーで営業をしていますが、スタートアップへの転職を考えています...', authorCompany: '大手メーカー', likes: 124, comments: 45, createdAt: '10分前' },
  { id: '2', category: '給与・年収', title: 'コンサル業界のボーナス事情', content: '今年のボーナス、去年に比べてかなり上がった気がします。皆さんのところはどうですか？', authorCompany: '外資系コンサル', likes: 89, comments: 32, createdAt: '1時間前' },
  { id: '3', category: '職場環境', title: 'リモートワーク廃止の動きについて', content: 'うちの会社も週5出社に戻るという噂が...。モチベーション維持が難しいです。', authorCompany: 'IT企業', likes: 210, comments: 156, createdAt: '3時間前' },
];

const MOCK_JOBS: Job[] = [
  { id: '1', company: 'Rakuten', title: 'シニアプロダクトマネージャー', location: '東京都 世田谷区', salary: '1,000万〜1,500万円', cultureScore: 4.2, tags: ['リモート可', '英語活かせる', 'フレックス'] },
  { id: '2', company: 'Sony', title: 'AIエンジニア', location: '東京都 港区', salary: '800万〜1,200万円', cultureScore: 4.5, tags: ['技術力重視', '福利厚生充実'] },
  { id: '3', company: 'Mercari', title: 'マーケティングスペシャリスト', location: '東京都 港区', salary: '700万〜1,100万円', cultureScore: 4.8, tags: ['急成長', '自由な社風'] },
];

// --- Components ---

const TermsAgreement: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
  const [agreements, setAgreements] = useState({
    all: false,
    age: false,
    tos: false,
    privacyRequired: false,
    privacyOptional: false,
    marketing: false,
  });

  const handleToggleAll = () => {
    const newValue = !agreements.all;
    setAgreements({
      all: newValue,
      age: newValue,
      tos: newValue,
      privacyRequired: newValue,
      privacyOptional: newValue,
      marketing: newValue,
    });
  };

  const handleToggle = (key: keyof typeof agreements) => {
    if (key === 'all') return;
    const nextAgreements = { ...agreements, [key]: !agreements[key] };
    const allChecked = nextAgreements.age && nextAgreements.tos && nextAgreements.privacyRequired && nextAgreements.privacyOptional && nextAgreements.marketing;
    setAgreements({ ...nextAgreements, all: allChecked });
  };

  const canProceed = agreements.age && agreements.tos && agreements.privacyRequired;

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto shadow-2xl relative">
      <div className="p-4">
        <button onClick={onBack} className="p-2 -ml-2">
          <ChevronRight className="w-6 h-6 rotate-180" />
        </button>
      </div>

      <div className="flex-1 px-6 pt-4">
        <h2 className="font-bold text-gray-900 mb-8 terms-heading">
          利用規約に同意してください
        </h2>

        <div 
          onClick={handleToggleAll}
          className={`p-5 border rounded-xl mb-8 flex items-center gap-3 cursor-pointer transition-colors ${agreements.all ? 'border-gray-900 bg-gray-50' : 'border-gray-200'}`}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${agreements.all ? 'bg-gray-900 border-gray-900' : 'border-gray-300'}`}>
            <Check className={`w-4 h-4 transition-colors ${agreements.all ? 'text-white' : 'text-gray-300'}`} />
          </div>
          <span className="font-bold text-gray-900">すべてに同意します</span>
        </div>

        <div className="space-y-6">
          {[
            { key: 'age', label: '(必須) 14歳以上です', required: true },
            { key: 'tos', label: '(必須) サービス利用規約', required: true, hasDetail: true },
            { key: 'privacyRequired', label: '(必須) 個人情報の収集および利用', required: true, hasDetail: true },
            { key: 'privacyOptional', label: '(任意) 個人情報の収集および利用', required: false, hasDetail: true },
            { key: 'marketing', label: '(任意) イベント等の特典・情報の受信', required: false, hasDetail: true },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between group cursor-pointer" onClick={() => handleToggle(item.key as any)}>
              <div className="flex items-center gap-3">
                <Check className={`w-4 h-4 transition-colors ${agreements[item.key as keyof typeof agreements] ? 'text-gray-900' : 'text-gray-300'}`} />
                <span className={`text-sm ${agreements[item.key as keyof typeof agreements] ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                  {item.label}
                </span>
              </div>
              {item.hasDetail && <ChevronRight className="w-4 h-4 text-gray-300" />}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">
        <button
          disabled={!canProceed}
          onClick={onNext}
          className={`w-full py-4 rounded-xl font-bold transition-colors ${canProceed ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'}`}
        >
          次へ
        </button>
      </div>
    </div>
  );
};

const EmailSignup: React.FC<{ onBack: () => void; onComplete: (email: string, pass: string) => void }> = ({ onBack, onComplete }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isValid = email.includes('@') && password.length >= 8;

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto shadow-2xl">
      <div className="p-4">
        <button onClick={onBack} className="p-2 -ml-2">
          <ChevronRight className="w-6 h-6 rotate-180" />
        </button>
      </div>

      <div className="flex-1 px-6 pt-4">
        <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-12">
          使用するメールアドレスを入力し、<br />パスワードを設定してください
        </h2>

        <div className="space-y-10">
          <div className="relative border-b border-gray-200 pb-2">
            <label className="absolute -top-6 left-0 text-xs font-bold text-gray-400">メールアドレス</label>
            <input
              type="email"
              placeholder="メールアドレスを入力"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent outline-none text-gray-900 placeholder:text-gray-200"
            />
          </div>

          <div className="relative border-b border-gray-200 pb-2">
            <label className="absolute -top-6 left-0 text-xs font-bold text-gray-400">パスワード</label>
            <input
              type="password"
              placeholder="8文字以上入力"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent outline-none text-gray-900 placeholder:text-gray-200"
            />
          </div>
        </div>
      </div>

      <div className="p-6">
        <button
          disabled={!isValid}
          onClick={() => onComplete(email, password)}
          className={`w-full py-4 rounded-xl font-bold transition-colors ${isValid ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}
        >
          登録する
        </button>
      </div>
    </div>
  );
};

const MeishiCard: React.FC<{ 
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

const MeishiDetailView: React.FC<{ 
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
      className="fixed inset-0 bg-white z-[100] flex flex-col overflow-y-auto no-scrollbar"
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

const MeishiEditView: React.FC<{ 
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
      className="fixed inset-0 bg-white z-[200] flex flex-col overflow-y-auto no-scrollbar"
    >
      {/* Header */}
      <div className="sticky top-0 bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-900">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h3 className="text-[17px] font-bold text-gray-900">名刺情報の編集</h3>
        </div>
        <button onClick={handleSave} className="text-[17px] text-gray-900 font-bold px-2">保存</button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Profile Image Section */}
        <div className="flex justify-between items-start">
          <div className="flex-1 space-y-6">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700">名前</label>
              <input 
                type="text" 
                placeholder="名前"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full py-2.5 px-3 rounded-md border border-gray-200 focus:border-black outline-none transition-all"
              />
            </div>
          </div>
          <div className="ml-6 relative">
            <div 
              onClick={() => setShowPhotoOptions(true)}
              className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden border border-gray-200 cursor-pointer"
            >
              {formData.imageUrl ? (
                <img src={formData.imageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10" />
              )}
            </div>
            <button 
              onClick={() => setShowPhotoOptions(true)}
              className="absolute bottom-0 left-0 right-0 py-1 bg-black/60 text-[10px] font-bold text-white text-center rounded-b-full"
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
                className="fixed inset-0 bg-black/40 z-[300]"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[301] px-6 pt-6 pb-12"
              >
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xl font-bold text-gray-900">プロフィール写真</h4>
                  <button onClick={() => setShowPhotoOptions(false)} className="p-2 -mr-2 text-gray-400">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="divide-y divide-gray-100">
                  <button 
                    onClick={() => galleryInputRef.current?.click()}
                    className="w-full flex items-center justify-between py-4 group"
                  >
                    <span className="text-[17px] text-gray-900">写真ライブラリから選択</span>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-active:translate-x-1 transition-transform" />
                  </button>
                  
                  <button 
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full flex items-center justify-between py-4 group"
                  >
                    <span className="text-[17px] text-gray-900">写真を撮る</span>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-active:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Other Fields */}
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">役職</label>
            <input 
              type="text" 
              placeholder="例) チームリーダー"
              value={formData.position}
              onChange={e => setFormData({...formData, position: e.target.value})}
              className="w-full py-2.5 px-3 rounded-md border border-gray-200 focus:border-black outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">部署</label>
            <input 
              type="text" 
              placeholder="例) 経営戦略室"
              value={formData.department || ''}
              onChange={e => setFormData({...formData, department: e.target.value})}
              className="w-full py-2.5 px-3 rounded-md border border-gray-200 focus:border-black outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">会社</label>
            <input 
              type="text" 
              placeholder="会社名"
              value={formData.company}
              onChange={e => setFormData({...formData, company: e.target.value})}
              className="w-full py-2.5 px-3 rounded-md border border-gray-200 focus:border-black outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">携帯電話</label>
            <input 
              type="tel" 
              placeholder="01012345678"
              value={formData.mobile || ''}
              onChange={e => setFormData({...formData, mobile: e.target.value})}
              className="w-full py-2.5 px-3 rounded-md border border-gray-200 focus:border-black outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">メール</label>
            <input 
              type="email" 
              placeholder="remember@rmbr.com"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full py-2.5 px-3 rounded-md border border-gray-200 focus:border-black outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">電話</label>
            <input 
              type="tel" 
              placeholder="0212345678"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full py-2.5 px-3 rounded-md border border-gray-200 focus:border-black outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">ファックス</label>
            <input 
              type="tel" 
              placeholder="0212345678"
              value={formData.fax || ''}
              onChange={e => setFormData({...formData, fax: e.target.value})}
              className="w-full py-2.5 px-3 rounded-md border border-gray-200 focus:border-black outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">住所</label>
            <input 
              type="text" 
              placeholder="東京都港区..."
              value={formData.address || ''}
              onChange={e => setFormData({...formData, address: e.target.value})}
              className="w-full py-2.5 px-3 rounded-md border border-gray-200 focus:border-black outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5 pb-10">
            <label className="text-sm font-bold text-gray-700">建物名・部屋番号</label>
            <input 
              type="text" 
              placeholder="6階"
              value={formData.detailedAddress || ''}
              onChange={e => setFormData({...formData, detailedAddress: e.target.value})}
              className="w-full py-2.5 px-3 rounded-md border border-gray-200 focus:border-black outline-none transition-all"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

const MeishiMapView: React.FC<{ onBack: () => void, meishis: Meishi[] }> = ({ onBack, meishis }) => {
  const [mapCenter, setMapCenter] = useState({ lat: 35.6894, lng: 139.6917 }); // Tokyo Metropolitan Government Building
  const [zoom, setZoom] = useState(15);
  const [selectedMeishi, setSelectedMeishi] = useState<Meishi | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [radius, setRadius] = useState<number>(500);
  const [isRadiusDropdownOpen, setIsRadiusDropdownOpen] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [isLocationSearchOpen, setIsLocationSearchOpen] = useState(false);
  const [locationName, setLocationName] = useState("東京都庁");
  const [searchQuery, setSearchQuery] = useState("");
  const [addressResults, setAddressResults] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [meishiResults, setMeishiResults] = useState<Meishi[]>([]);

  // 현재 위치 가져오기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn("Error getting current location, using default (Tokyo):", error);
          // 기본 위치(도쿄도청) 유지
          setMapCenter({ lat: 35.6894, lng: 139.6917 });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, []);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  const meishisWithCoords = React.useMemo(() => {
    return meishis.map((m, i) => ({
      ...m,
      lat: m.lat || 35.6894 + (Math.random() - 0.5) * 0.005,
      lng: m.lng || 139.6917 + (Math.random() - 0.5) * 0.005,
    }));
  }, [meishis]);

  // Haversine formula to calculate distance between two points in meters
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
  };

  const filteredMeishis = React.useMemo(() => {
    return meishisWithCoords.filter(m => {
      if (!m.lat || !m.lng) return false;
      const dist = getDistance(mapCenter.lat, mapCenter.lng, m.lat, m.lng);
      return dist <= radius;
    });
  }, [meishisWithCoords, mapCenter, radius]);

  const mapContainerStyle = {
    width: '100%',
    height: '100%',
    minHeight: '400px'
  };

  const mapOptions = {
    disableDefaultUI: true,
    zoomControl: false,
    gestureHandling: 'greedy',
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
      },
      {
        featureType: "transit",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
      }
    ]
  };

  const handleSearchArea = () => {
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 1500);
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationName("現在地");
          setZoom(15);
        },
        (error) => {
          console.warn("Error getting current location:", error);
          alert("現在地を取得できませんでした。位置情報へのアクセスが許可されているか確認してください。");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert("お使いのブラウザは位置情報機能をサポートしていません。");
    }
  };

  const [placesError, setPlacesError] = useState<string | null>(null);

  // Google Places Autocomplete Search
  useEffect(() => {
    if (!isLoaded || !searchQuery.trim()) {
      setAddressResults([]);
      setMeishiResults([]);
      setPlacesError(null);
      return;
    }

    const timer = setTimeout(() => {
      // Search Meishis
      const lowerQuery = searchQuery.toLowerCase();
      const filteredMeishis = meishisWithCoords.filter(m => 
        m.company?.toLowerCase().includes(lowerQuery) || 
        m.name.toLowerCase().includes(lowerQuery) ||
        m.address?.toLowerCase().includes(lowerQuery)
      );
      setMeishiResults(filteredMeishis);

      // Search Addresses
      try {
        if (!window.google?.maps?.places) {
          setPlacesError("Places APIが読み込まれていません。");
          return;
        }
        const autocompleteService = new window.google.maps.places.AutocompleteService();
        autocompleteService.getPlacePredictions(
          { input: searchQuery, componentRestrictions: { country: 'jp' } },
          (predictions, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              setAddressResults(predictions);
              setPlacesError(null);
            } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              setAddressResults([]);
              setPlacesError(null);
            } else {
              setAddressResults([]);
              if (status === window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
                setPlacesError("Google Cloud Consoleで「Places API」を有効にしてください。");
              } else if (status === window.google.maps.places.PlacesServiceStatus.UNKNOWN_ERROR) {
                setPlacesError("Places APIが有効になっていない可能性があります。Google Cloud Consoleを確認してください。");
              } else {
                setPlacesError(`検索エラーが発生しました (${status})`);
              }
            }
          }
        );
      } catch (err) {
        console.error("Error in Places Autocomplete:", err);
        setPlacesError("検索中にエラーが発生しました。");
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, isLoaded, meishisWithCoords]);

  const handleSelectAddress = (placeId: string, mainText: string) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ placeId: placeId }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
        const location = results[0].geometry.location;
        setMapCenter({ lat: location.lat(), lng: location.lng() });
        setLocationName(mainText); // Use main text directly as name
        setIsLocationSearchOpen(false);
        setSearchQuery("");
      } else {
        if (status === google.maps.GeocoderStatus.REQUEST_DENIED || status === google.maps.GeocoderStatus.UNKNOWN_ERROR) {
          alert("Geocoding APIが有効になっていません。Google Cloud Consoleで「Geocoding API」を有効にしてください。");
        } else {
          alert(`住所の詳細を取得できませんでした。(${status})`);
        }
        console.error("Geocoding error:", status);
      }
    });
  };

  const handleSelectMeishiLocation = (meishi: Meishi) => {
    if (meishi.lat && meishi.lng) {
      setMapCenter({ lat: meishi.lat, lng: meishi.lng });
      setLocationName(meishi.company || meishi.name);
      setIsLocationSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-white z-[60] flex flex-col max-w-md mx-auto shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center p-4 bg-white">
        <button onClick={onBack} className="p-1 -ml-1">
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        <h1 className="ml-4 text-lg font-bold text-gray-900">名刺地図</h1>
      </div>

      {/* Filters Bar */}
      <div className="flex justify-between items-center px-4 py-2 bg-[#f5f5f5] border-b border-gray-200 relative z-20">
        <button 
          onClick={() => setIsLocationSearchOpen(true)}
          className="flex items-center gap-1 text-sm font-medium text-gray-700 max-w-[50%] truncate"
        >
          <span className="truncate">{locationName}</span>
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        </button>
        <div className="relative">
          <button 
            onClick={() => setIsRadiusDropdownOpen(!isRadiusDropdownOpen)}
            className="flex items-center gap-1 text-sm font-medium text-gray-700"
          >
            <span>半径 {radius >= 1000 ? `${radius / 1000}km` : `${radius}m`}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          
          {/* Radius Dropdown */}
          <AnimatePresence>
            {isRadiusDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsRadiusDropdownOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50"
                >
                  {/* Triangle pointer */}
                  <div className="absolute -top-2 right-6 w-4 h-4 bg-white border-t border-l border-gray-100 transform rotate-45" />
                  
                  <div className="relative bg-white z-10">
                    {[
                      { label: '500m', value: 500 },
                      { label: '1km', value: 1000 },
                      { label: '2km', value: 2000 },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setRadius(option.value);
                          setIsRadiusDropdownOpen(false);
                          if (option.value === 500) setZoom(15);
                          else if (option.value === 1000) setZoom(14);
                          else if (option.value === 2000) setZoom(13);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 text-left text-base hover:bg-gray-50 transition-colors ${
                          radius === option.value ? 'text-gray-900 font-medium' : 'text-gray-700'
                        } ${option.value !== 2000 ? 'border-b border-gray-100' : ''}`}
                      >
                        <span>{option.label}</span>
                        {radius === option.value && <Check className="w-5 h-5 text-blue-500" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-[#f8f8f8] overflow-hidden z-0 w-full h-full min-h-0">
        {isLoaded && !loadError && apiKey ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={zoom}
            options={mapOptions}
            onLoad={(map) => setMapInstance(map)}
            onDragEnd={() => {
              if (mapInstance) {
                const newCenter = mapInstance.getCenter();
                if (newCenter) {
                  setMapCenter({ lat: newCenter.lat(), lng: newCenter.lng() });
                }
              }
            }}
          >
            <Circle
              center={mapCenter}
              radius={radius}
              options={{
                fillColor: '#0A0A0A',
                fillOpacity: 0.1,
                strokeColor: '#0A0A0A',
                strokeOpacity: 0.8,
                strokeWeight: 1,
                clickable: false,
                zIndex: 1
              }}
            />
            {filteredMeishis.map((m) => (
              <GoogleMarker
                key={m.id}
                position={{ lat: m.lat!, lng: m.lng! }}
                onClick={() => setSelectedMeishi(m)}
                icon={{
                  url: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                  scaledSize: new google.maps.Size(30, 30),
                }}
                label={{
                  text: m.company || '',
                  className: 'bg-white px-2 py-1 rounded-full shadow-md border border-gray-200 text-[10px] font-bold text-gray-800 -translate-y-10',
                }}
              />
            ))}

            {selectedMeishi && (
              <InfoWindow
                position={{ lat: selectedMeishi.lat!, lng: selectedMeishi.lng! }}
                onCloseClick={() => setSelectedMeishi(null)}
              >
                <div className="p-1 min-w-[120px]">
                  <p className="font-bold text-sm text-gray-900">{selectedMeishi.name}</p>
                  <p className="text-xs text-gray-500">{selectedMeishi.company}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{selectedMeishi.position}</p>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 p-8 text-center">
            {loadError || !apiKey ? (
              <div className="max-w-xs">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">地図の読み込みエラー</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4 text-left">
                  地図を表示できません。以下の点をご確認ください：<br/><br/>
                  1. <strong>APIキーの設定</strong>: 環境変数 <code className="bg-gray-100 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> が正しく設定されているか。<br/>
                  2. <strong>APIの有効化</strong>: Google Cloud Consoleで「<strong>Maps JavaScript API</strong>」が有効になっているか。
                </p>
                <div className="p-3 bg-white rounded-xl border border-dashed border-gray-300 text-left">
                  <p className="text-[10px] text-gray-400 font-mono break-all">
                    ※ ApiNotActivatedMapError が発生した場合は、Google Cloud Consoleの「APIとサービス」から「Maps JavaScript API」を有効にしてください。
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-4" />
                <p className="text-sm text-gray-400 font-medium">地図を読み込んでいます...</p>
              </div>
            )}
          </div>
        )}

        {/* Center Search Radius Indicator (Mock) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
          <div className="w-16 h-16 rounded-full border-2 border-orange-500/30 bg-orange-500/5 flex items-center justify-center">
            <div className="w-1 h-4 bg-orange-500/40 absolute"></div>
            <div className="h-1 w-4 bg-orange-500/40 absolute"></div>
          </div>
        </div>

        {/* Top Left: Current Location */}
        <div className="absolute top-4 left-4 z-[1000]">
          <button 
            onClick={handleCurrentLocation}
            className="w-11 h-11 bg-white rounded-lg shadow-lg flex items-center justify-center border border-orange-500 active:scale-95 transition-transform"
          >
            <Target className="w-7 h-7 text-orange-500" />
          </button>
        </div>

        {/* Top Right: Search this area */}
        <div className="absolute top-4 right-4 z-[1000]">
          <button 
            onClick={handleSearchArea}
            disabled={isSearching}
            className="bg-white px-4 py-2.5 rounded-lg shadow-lg border border-orange-500 text-xs font-bold text-orange-500 flex items-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <div className="relative w-4 h-4">
                <div className="absolute inset-0 border-2 border-orange-500/40 rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-orange-500 rounded-full"></div>
              </div>
            )}
            この位置で再検索
          </button>
        </div>

        {/* Middle Right: Zoom Controls */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col shadow-lg rounded-lg overflow-hidden border border-gray-200 z-[1000]">
          <button 
            onClick={() => setZoom(prev => Math.min(prev + 1, 20))}
            className="w-12 h-12 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100"
          >
            <Plus className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setZoom(prev => Math.max(prev - 1, 3))}
            className="w-12 h-12 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <Minus className="w-6 h-6" />
          </button>
        </div>

        {/* Bottom Right: Action Buttons */}
        <div className="absolute bottom-6 right-4 flex gap-3 z-[1000]">
          <button className="bg-white px-6 py-3 rounded-xl shadow-xl border border-orange-500 flex items-center gap-2.5 text-sm font-bold text-gray-800 active:scale-95 transition-transform">
            <div className="w-4 h-4 rounded-full border-2 border-orange-500 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
            </div>
            会社
          </button>
          <button 
            onClick={onBack}
            className="bg-white px-6 py-3 rounded-xl shadow-xl border border-orange-500 flex items-center gap-2.5 text-sm font-bold text-gray-800 active:scale-95 transition-transform"
          >
            <ChevronUp className="w-5 h-5 text-orange-500" />
            リスト
          </button>
        </div>
      </div>

      {/* Footer Status Bar */}
      <div className="p-4 bg-white flex items-center justify-between border-t border-gray-100 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] z-[1000]">
        <span className="text-xs text-gray-600 font-medium">この周辺に検索された名刺がありません。</span>
        <button className="bg-orange-100/50 text-orange-400 px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2 opacity-80 cursor-not-allowed">
          <RefreshCw className="w-4 h-4" />
          さらに読み込む
        </button>
      </div>
      {/* Location Search Modal */}
      <AnimatePresence>
        {isLocationSearchOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[70] flex flex-col max-w-md mx-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">基準位置変更</h2>
              <button onClick={() => setIsLocationSearchOpen(false)} className="p-1">
                <X className="w-6 h-6 text-gray-900" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 bg-white border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="検索"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto bg-white">
              {!searchQuery.trim() ? (
                <div className="h-full flex items-center justify-center p-8 text-center">
                  <p className="text-gray-500 font-medium leading-relaxed">
                    基準位置となる住所または名刺を<br />検索してください
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-6">
                  {/* Meishi Results */}
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 mb-3">私の名刺帳内の名刺検索結果</h3>
                    {meishiResults.length === 0 ? (
                      <p className="text-sm text-gray-400 py-2">検索結果がありません。</p>
                    ) : (
                      <div className="space-y-3">
                        {meishiResults.map((meishi) => (
                          <button
                            key={meishi.id}
                            onClick={() => handleSelectMeishiLocation(meishi)}
                            className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg text-left transition-colors"
                          >
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                              <Briefcase className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{meishi.company || meishi.name}</p>
                              <p className="text-xs text-gray-500">{meishi.address || '住所情報なし'}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Address Results */}
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 mb-3">住所検索結果</h3>
                    {placesError ? (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                        <p className="text-sm text-red-600 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          {placesError}
                        </p>
                      </div>
                    ) : addressResults.length === 0 ? (
                      <p className="text-sm text-gray-400 py-2">検索結果がありません。</p>
                    ) : (
                      <div className="space-y-4">
                        {addressResults.map((prediction) => (
                          <button
                            key={prediction.place_id}
                            onClick={() => handleSelectAddress(prediction.place_id, prediction.structured_formatting.main_text)}
                            className="w-full flex items-start gap-4 p-2 hover:bg-gray-50 rounded-lg text-left transition-colors"
                          >
                            <div className="w-12 h-12 rounded-full bg-[#0A0A0A] flex items-center justify-center shrink-0 mt-1">
                              <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-medium text-gray-900 truncate">
                                {prediction.structured_formatting.main_text}
                              </p>
                              <p className="text-sm text-gray-600 truncate mt-0.5">
                                {prediction.structured_formatting.secondary_text}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};



const ForumPost: React.FC<{ post: Post }> = ({ post }) => (
  <div className="bg-white p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{post.category}</span>
      <span className="text-[10px] text-gray-400">{post.authorCompany} • {post.createdAt}</span>
    </div>
    <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{post.title}</h3>
    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{post.content}</p>
    <div className="flex items-center gap-4 text-xs text-gray-400">
      <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {post.likes}</span>
      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {post.comments}</span>
    </div>
  </div>
);

const JobCard: React.FC<{ job: Job }> = ({ job }) => (
  <div className="bg-white p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
    <div className="flex gap-4">
      <div className="w-12 h-12 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden">
        <Building2 className="w-6 h-6 text-gray-300" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-gray-900">{job.title}</h3>
          <div className="flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded">
            <span className="text-[10px] font-bold text-green-700">{job.cultureScore}</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-1">{job.company}</p>
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
          <span>{job.location}</span>
          <span>•</span>
          <span className="text-blue-600 font-medium">{job.salary}</span>
        </div>
        <div className="flex gap-1 flex-wrap">
          {job.tags.map(tag => (
            <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const LoginScreen = ({ onLogin, onLineLogin, onEmailSignup }: { onLogin: () => void; onLineLogin: () => void; onEmailSignup: () => void }) => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12 max-w-md mx-auto shadow-2xl">
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2 font-serif">Remember</h1>
      <p className="text-gray-500 font-medium">チャンスが広がる、キャリアブリッジ</p>
    </div>

    <div className="w-full space-y-3 mb-8">
      {/* LINE Login (Equivalent to Kakao in Japan) */}
      <button 
        onClick={onLineLogin}
        className="w-full bg-[#06C755] text-white font-bold py-4 rounded-lg flex items-center justify-center gap-3 shadow-sm active:scale-[0.98] transition-transform"
      >
        <MessageSquare className="w-5 h-5 fill-current" />
        LINEで登録
      </button>

      {/* Social Icons Row */}
      <div className="flex justify-center gap-4 py-4">
        <button onClick={onLogin} className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        </button>
        <button onClick={onEmailSignup} className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50">
          <Mail className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </div>

    <div className="w-full flex items-center gap-4 mb-8">
      <div className="flex-1 h-[1px] bg-gray-100"></div>
      <span className="text-xs text-gray-400 font-medium">または</span>
      <div className="flex-1 h-[1px] bg-gray-100"></div>
    </div>

    <button 
      onClick={onLogin}
      className="w-full bg-gray-900 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] transition-transform mb-8"
    >
      <span className="font-serif italic text-xl mr-1">C</span>
      既存ユーザーログイン
    </button>

    <div className="text-center">
      <p className="text-xs text-gray-400">
        アカウントをお忘れですか？ <span className="underline font-bold text-gray-500 cursor-pointer">アカウントを探す</span>
      </p>
    </div>
  </div>
);

const JAPANESE_COMPANIES = [
  "トヨタ自動車", "ソニーグループ", "任天堂", "ソフトバンクグループ", 
  "楽天グループ", "LINEヤフー", "メルカリ", "サイバーエージェント", 
  "DeNA", "グリー", "ミクシィ", "リクルートホールディングス", 
  "ファーストリテイリング", "本田技研工業", "パナソニック"
];

const JAPANESE_UNIVERSITIES = [
  "東京大学", "京都大学", "大阪大学", "名古屋大学", "東北大学", 
  "北海道大学", "九州大学", "慶應義塾大学", "早稲田大学", "上智大学", 
  "東京理科大学", "明治大学", "青山学院大学", "立教大学", "中央大学", "法政大学"
];

const JAPANESE_MAJORS = [
  "経営学", "経済学", "法学", "文学", "教育学", "社会学", 
  "理学", "工学", "農学", "医学", "薬学", "情報学", "芸術学"
];

const DEGREES = [
  "学士", "修士", "博士", "専門職学位", "準学士", "高校卒業", "その他"
];

const SKILL_RECOMMENDATIONS: Record<string, string[]> = {
  "経営・戦略・企画": ["経営戦略", "事業企画", "戦略企画", "新規事業開発", "事業開発(BD)", "GTM戦略", "プラットフォーム戦略", "OKR", "KPI管理", "中長期戦略", "シナリオプランニング", "BCGマトリックス", "ポーターの5フォース分析", "M&A", "企業買収・合併", "デューデリジェンス(Due Diligence)", "企業価値評価(Valuation)", "PMI", "投資戦略", "ベンチャー投資(VC)", "プライベート・エクイティ(PE)", "IPO", "財務モデリング", "DCF分析", "LBO", "SPAC", "スタートアップ投資", "アクセラレーター", "法人設立", "海外法人管理", "経営", "投資誘致", "DX", "ESG経営", "経営企画", "事業戦略・企画", "新規事業企画・開発", "事業分析(BA)", "商品企画", "技術企画", "事業運営", "PM・PMO(プロジェクト)", "プロジェクト管理", "PMP", "PMO", "PMBOK", "PRINCE2", "リスク管理", "スケジュール管理", "予算管理", "WBS", "マイルストーン管理", "ステークホルダーマネジメント", "MS Project", "Jira", "Asana", "Monday.com", "新規市場参入", "海外市場開拓", "グローバルパートナーシップ", "提携交渉", "契約構造設計", "エコシステム構築", "チャネルパートナー管理", "技術パートナーシップ", "OEM/ODM", "創業企画", "リーンスタートアップ", "ピボット戦略", "MVP設計", "IRデッキ作成", "スタートアップメントリング", "アクセラレーティング", "創業エコシステム", "海外進出戦略", "ローカライゼーション戦略", "海外法人運営"],
  "サービス企画・運営": ["製品企画", "サービス企画", "プロドクトマネジメント", "PO(Product Owner)", "PRD作成", "ロードマップ策定", "スプリントプランニング", "バックログ管理", "ユーザーストーリー", "アジャイル", "スクラム", "カンバン", "OKR", "サービス運営", "カスタマーサクセス", "UI/UX", "データ分析", "KPI管理", "グロースハック", "プロダクトマネジメント"],
  "マーケティング・広告": ["デジタルマーケティング", "コンテンツマーケティング", "SEO", "SEM", "SNSマーケティング", "ソーシャルメディアマーケティング", "ブランドマーケティング", "パフォーマンスマーケティング", "CRM", "PR", "広告運用", "データ分析", "市場調査", "ブランディング", "ブランド戦略", "ブランドアイデンティティ", "ブランドマネジメント", "リブランディング", "ATL", "BTL", "IMC", "ブランドポジショニング", "ブランドストーリーテリング", "ブランド体験設計", "ブランドガイドライン", "ブランドキャンペーン", "パブリックブランディング", "コーポレートブランディング", "グロースハック", "CPC", "CPM", "CPA", "ROAS", "ROI", "CTR", "CVR", "A/Bテスト", "コンバージョン率最適化(CRO)", "リターゲティング", "プログラマティック広告", "Google広告", "Meta広告", "アドテクノロジー", "DSP/SSP", "DMP", "インフルエンサーマーケティング", "バイラルマーケティング", "コミュニティマネジメント", "YouTubeマーケティング", "Instagramマーケティング", "TikTokマーケティング", "ショートフォームコンテンツ", "UGC", "エディトリアルコンテンツ", "ニュースレター", "ポッドキャスト", "メールマーケティング", "顧客セグメンテーション", "リテンションマーケティング", "LTV分析", "マーケティングオートメーション", "プッシュ通知", "MAT", "アプリマーケティング", "ASO", "マーケティングファネル", "カスタマージャーニー設計", "パーソナライゼーション", "Braze", "Salesforce Marketing Cloud", "HubSpot", "広報戦略", "メディアリレーション", "危機管理広報", "記者対応", "プレスリリース", "イベント企画", "スポンサーシップ", "PPL", "ブランドジャーナリズム"],
  "営業": ["営業手法", "B2B営業", "B2C営業", "ソリューション営業", "チャネル営業", "エンタープライズセールス", "SMB営業", "インサイドセールス", "アウトバウンドセールス", "インバウンドセールス", "パートナーシップ", "提携・アライアンス", "セールスパイプライン管理", "契約交渉", "キーアカウントマネジメント(KAM)", "営業戦略立案", "RFP対応", "提案書作成", "顧客分析", "リードジェネレーション", "リードナーチャリング", "セールスフォーキャスト", "Salesforce", "HubSpot", "ZOHO CRM", "フィールドセールス", "アカウントマネジメント", "代理店営業", "海外営業", "営業企画", "カスタマーサクセス"],
  "SW開発": ["HTML/CSS", "JavaScript", "TypeScript", "React", "Vue.js", "Next.js", "Nuxt.js", "Svelte", "Angular", "ウェブアクセシビリティ", "レスポンシブWeb", "Tailwind CSS", "Storybook", "フロントエンド", "バックエンド", "Node.js", "Python", "Java", "Kotlin", "Go", "Rust", "Ruby", "PHP", "Spring Boot", "Django", "FastAPI", "NestJS", "GraphQL", "REST API", "gRPC", "MSA", "サーバーレス", "iOS(Swift)", "Android(Kotlin)", "Flutter", "React Native", "SwiftUI", "Jetpack Compose", "アプリ配信", "ストア管理", "AWS", "GCP", "Azure", "Docker", "Kubernetes", "CI/CD", "Terraform", "Ansible", "Jenkins", "GitHub Actions", "SRE", "モニタリング", "ロギング", "Datadog", "Prometheus", "MySQL", "PostgreSQL", "Oracle", "MSSQL", "MongoDB", "Redis", "Elasticsearch", "Cassandra", "DynamoDB", "Firestore", "Neo4j", "情報セキュリティ", "セキュリティアーキテクチャ", "ペネトレーションテスト(ペンテスト)", "脆弱性分析", "SIEM", "ゼロトラスト", "IAM", "ISMS", "ISO 27001", "個人情報保護", "DLP", "クラウドセキュリティ", "AppSec", "フルスタック", "iOS", "Android", "インフラ", "DevOps", "クラウド", "データベース", "セキュリティ", "QA", "アーキテクチャ", "アジャイル", "スクラム"],
  "AI・データ": ["LLM開発", "RAG実装", "AIエージェント", "ファインチューニング", "モデルサービング", "OpenAI API", "Anthropic API", "Langchain", "ベクトルDB", "機械学習", "ディープラーニング", "自然言語処理(NLP)", "コンピュータビジョン", "推薦システム", "予測モデリング", "特徴量エンジニアリング", "モデル学習・デプロイ", "MLOps", "TensorFlow", "PyTorch", "Scikit-learn", "Hugging Face", "LLM", "生成AI(GenAI)", "RAG", "プロンプトエンジニアリング", "データ分析", "データエンジニアリング", "データパイプライン", "ETL/ELT", "データウェアハウス", "データレイク", "Airflow", "dbt", "Spark", "Kafka", "Hadoop", "Flink", "Databricks", "Snowflake", "BigQuery", "Redshift", "統計モデリング", "ビッグデータ", "AIモデル開発", "データサイエンス", "ビジネスインテリジェンス(BI)", "KPI設計", "コホート分析", "ファネル分析", "統計分析", "回帰分析", "ベイズ分析", "時系列分析", "クラスタリング", "異常検知", "テキストマイニング", "SQL", "Python", "R", "Excel", "Tableau", "Power BI", "Looker", "Google Analytics(GA4)", "Amplitude", "Mixpanel", "Firebase", "Redash", "Metabase", "SAS", "SPSS"],
  "デザイン/UX": ["UI/UXデザイン", "UXリサーチ", "ユーザーリサーチ", "ユーザビリティテスト", "インタビュー", "ペルソナ設計", "カスタマージャーニーマップ", "IA(情報アーキテクチャ)", "ヒューリスティック評価", "定性調査", "定量調査", "プロトタイピング", "ワイヤーフレーム", "デザインシステム", "Figma", "Adobe XD", "Sketch", "Framer", "インタラクションデザイン", "モーションデザイン", "アクセシビリティデザイン", "UIデザイン", "UXデザイン", "Webデザイン", "グラフィックデザイン", "プロダクトデザイン", "ブランディング", "ブランドデザイン", "ビジュアルアイデンティティ", "タイポグラフィ", "パッケージデザイン", "印刷デザイン", "Photoshop", "Illustrator", "InDesign", "After Effects", "3Dデザイン", "Blender"],
  "HR・総務": ["採用", "労務", "人事企画", "教育・研修", "組織開発", "評価制度", "総務", "ファシリティマネジメント", "社内コミュニケーション", "ダイバーシティ", "採用戦略", "ヘッドハンティング", "ソーシング", "インタビュー設計", "オンボーディング", "採用ブランディング", "人材パイプライン", "ATS運用", "ダイバーシティ・エクイティ&インクルージョン(DEI)", "組織文化", "成果管理", "報酬設計", "職務体系", "HR戦略", "HRD", "教育訓練", "リーダーシップ開発", "コーチング", "組織開発(OD)", "チェンジマネジメント", "組織診断", "労務管理", "就業規則", "労働基準法", "給与管理", "福利厚生設計", "HRIS", "Workday", "SAP HCM", "労使関係"],
  "財務・会計・税務": ["財務企画", "財務分析", "財務企画(FP&A)", "予算管理", "原価分析", "損益管理(P&L)", "資金調達", "財務諸表分析", "財務モデリング", "DCF", "IRR/NPV", "シナリオ分析", "会計", "原価計算", "管理会計", "IFRS", "K-GAAP", "US GAAP", "税務", "法人税", "消費税(VAT)", "税効果会計", "連結決算", "内部監査", "外部監査", "ERP会計", "経理", "財務", "IR", "内部統制", "監査", "M&A", "決算業務"],
  "法務・コンプライアンス": ["情報セキュリティ", "ISMS", "ISO 27001", "個人情報保護", "DLP", "企業法務", "契約審査", "コンプライアンス", "知的財産", "リスクマネジメント", "訴訟対応", "ガバナンス", "M&A法務", "労働法務", "法務", "契約交渉", "知的財産権(IP)", "特許", "商標", "著作権", "ライセンシング", "会社法", "コーポレートガバナンス", "訴訟管理", "法律相談", "規制対応", "公正取引", "GDPR", "PIPA", "金融規制", "医療規制", "環境規制", "ESGコンプライアンス", "内部統制", "監査", "薬事規制 (PMDA/FDA等)", "ESG戦略", "サステナビリティ経営", "カーボンニュートラル", "カーボンフットプリント", "RE100", "TCFD", "GRI", "CDP報告", "ESG評価対応", "サプライチェーンESG", "社会的価値", "環境経営", "炭素排出権", "温室効果ガスインベントリ", "LCA(ライフサイクルアセスメント)", "環境ラベル・認証", "気候変動リスク", "環境コンサルティング"],
  "コンサルティング": ["コンサルティング", "経営コンサルティング", "戦略コンサルティング", "ITコンサルティング", "業務改善・オペレーション改善", "チェンジマネジメント(Change Management)", "ステークホルダーマネジメント", "ワークショップ・ファシリテーション", "構造化問題解決", "仮説検証・分析", "プレゼン資料作成(Deck)", "業務コンサルティング", "人事コンサルティング", "財務コンサルティング", "DXコンサルティング", "PMO", "リサーチ", "データ分析"],
  "リサーチ・分析": ["市場調査", "競合調査", "ユーザーリサーチ", "データ分析", "統計解析", "定量調査", "定性調査", "トレンド分析", "インサイト抽出", "レポート作成", "消費者リサーチ", "FGI", "アンケート設計", "マーケティングROI分析", "顧客インサイト"],
  "広報・対外協力": ["PR", "メディアリレーションズ", "社内広報", "危機管理広報", "IR", "CSR", "ESG", "パブリックアフェアーズ", "イベント企画", "スポンサーシップ"],
  "金融": ["IR / 資本市場", "IR(インベスター・リレーションズ)", "IPO", "株式分析", "債券分析", "デリバティブ", "リスク管理", "ヘッジング", "ALM", "流動性管理", "信用分析", "資本構成の最適化", "投資銀行業務", "アセットマネジメント", "プライベートバンキング", "リテールバンキング", "コーポレートファイナンス", "コンプライアンス", "フィンテック", "トレーディング", "リサーチ", "プライベートバンキング(PB)", "保険商品開発", "アンダーライティング", "保険計理", "損害査定", "与信審査", "外国為替ディーリング", "デジタルバンキング", "オープンバンキング", "ブロックチェーン", "暗号資産", "DeFi", "ロボアドバイザー", "決済代行(PG)", "Toss/KakaoBankエコシステム", "証券分析", "資産運用"],
  "研究開発職(R&D)": ["基礎研究", "応用研究", "製品開発", "技術開発", "特許出願", "論文執筆", "産学連携", "実験・評価", "データ解析", "シミュレーション", "研究開発(R&D)", "技術事業化", "技術ロードマップ", "課題企画", "国策課題", "技術移転"],
  "設計職・エンジニアリング": ["機械設計", "電気・電子設計", "回路設計", "制御設計", "システム設計", "CAD/CAM", "CAE", "品質工学", "生産技術", "プロセスエンジニアリング", "半導体", "バッテリー", "ディスプレイ", "材料工学", "化学工学", "機械工学", "電気・電子", "バイオ工学", "ロボティクス", "自動運転", "航空宇宙"],
  "建設・不動産": ["建築設計", "施工管理", "土木設計", "都市計画", "不動産開発", "プロパティマネジメント", "アセットマネジメント", "ファシリティマネジメント", "不動産仲介", "鑑定評価"],
  "生産・製造": ["生産管理", "品質管理", "製造技術", "プロセスエンジニアリング", "サプライチェーンマネジメント", "工場長", "設備保全", "安全衛生", "リーン生産", "IoT導入", "運営管理", "運営戦略", "プロセス改善", "業務自動化", "RPA", "リーン(Lean)", "6シグマ", "品質管理(QC/QA)", "ISO 9001", "KPI運用", "SLA管理", "製造工程設計", "工場自動化", "スマートファクトリー", "設備管理", "品質保証(QA)", "品質管理(QC)", "FMEA", "IATF 16949", "ISO 13485"],
  "流通・MD・貿易・運送": ["マーチャンダイジング", "バイヤー", "ロジスティクス", "サプライチェーンマネジメント", "貿易実務", "倉庫管理", "配送管理", "在庫管理", "店舗開発", "EC運営", "サプライチェーンマネジメント(SCM)", "物流管理", "購買管理", "調達戦略", "グローバル物流", "関税/通関", "3PL", "WMS", "TMS", "ERP(SAP/Oracle)", "S&OP", "輸出入管理", "通関", "関税", "インコタームズ(Incoterms)", "FOB/CIF", "信用状(L/C)", "FTA活用", "原産地管理"],
  "放送・メディア・文化": ["映像編集", "モーショングラフィックス", "インフォグラフィック", "サムネイルデザイン", "PPTデザイン", "ソーシャルコンテンツデザイン", "Premiere Pro", "Final Cut Pro", "DaVinci Resolve", "番組制作", "ディレクター", "プロデューサー", "編集", "ライティング", "撮影", "音声", "コンテンツ企画", "配信運用", "映像制作", "YouTube運営", "ポッドキャスト", "コピーライティング", "スクリプト作成", "翻訳・通訳", "エディティング", "ジャーナリズム"],
  "医療・保健": ["医師", "看護師", "薬剤師", "医療事務", "臨床検査技師", "理学療法士", "作業療法士", "保健師", "医療機器営業", "治験コーディネーター", "臨床試験", "臨床研究", "医学研究", "疫学調査", "バイオマーカー", "医療機器開発", "EMR/EHR", "デジタルヘルス", "遠隔医療", "ヘルスケアAI", "医療画像解析", "保険請求", "医療ビッグデータ", "HIPAA"],
  "製薬・バイオ": ["創薬研究", "臨床開発", "薬事申請", "品質保証(QA)", "品質管理(QC)", "MR", "メディカルアフェアーズ", "バイオインフォマティクス", "製造", "安全性情報管理", "新薬開発", "GCP", "IRB"],
  "教育": ["教員", "講師", "インストラクター", "教材開発", "カリキュラム設計", "教育企画", "eラーニング", "スクール運営", "キャリアカウンセラー", "学生支援", "HRD", "ラーニングデザイン", "LMS運用", "職務教育", "リーダーシップ教育", "コーチング", "講義企画"],
  "生活・ローカルサービス職": ["店舗運営", "接客", "店長", "スーパーバイザー", "カスタマーサポート", "調理", "美容師", "エステティシャン", "フィットネスインストラクター", "清掃管理"],
  "公職者・宗教人": ["国家公務員", "地方公務員", "警察官", "消防官", "自衛官", "教員", "外交官", "税務職員", "裁判所職員", "NPO/NGO職員"],
  "その他専門職": ["弁護士", "公認会計士", "税理士", "弁理士", "司法書士", "行政書士", "社会保険労務士", "中小企業診断士", "不動産鑑定士", "通訳・翻訳", "英語ビジネスコミュニケーション", "日本語", "中国語", "グローバルHR", "駐在員管理", "異文化コミュニケーション"]
};

const ALL_SKILLS = Array.from(new Set(Object.values(SKILL_RECOMMENDATIONS).flat()));

const LANGUAGES = [
  "英語", "日本語", "中国語", "ドイツ語", "フランス語", "スペイン語", 
  "ギリシャ語", "オランダ語", "ノルウェー語", "デンマーク語", "ロシア語", 
  "ルーマニア語", "マレー語", "モンゴル語", "ミャンマー語", "ベトナム語", 
  "セルビア語", "スウェーデン語", "スロバキア語", "アラビア語", "イタリア語", 
  "インドネシア語", "チェコ語", "タイ語", "トルコ語", "ポルトガル語", 
  "ポーランド語", "フィリピン語", "韓国語", "ハンガリー語", "ヘブライ語", "ヒンディー語"
];

const LANGUAGE_LEVELS = [
  "ネイティブレベル",
  "ビジネスレベル",
  "日常会話レベル"
];

const JOB_CATEGORIES = [
  {
    category: "経営・戦略・企画",
    roles: [
      "法人代表・CEO",
      "戦略企画(Corporate)",
      "事業戦略・企画",
      "新規事業企画・開発",
      "事業開発(BD)",
      "事業分析(BA)",
      "商品企画",
      "技術企画",
      "事業運営",
      "PM・PMO(プロジェクト)",
      "その他戦略・企画職"
    ]
  },
  {
    category: "サービス企画・運営",
    roles: [
      "サービス企画・PM/PO(プロダクト)",
      "ゲーム企画",
      "サービス運営",
      "CX・CS",
      "その他サービス企画・運営職"
    ]
  },
  {
    category: "法務・コンプライアンス",
    roles: [
      "弁護士",
      "弁理士",
      "司法書士",
      "法務",
      "コンプライアンス・順法監視",
      "内部監査",
      "倫理経営・ESG・CSR",
      "特許・知的財産権(IP)",
      "裁判官・検察官",
      "その他法務・コンプライアンス"
    ]
  },
  {
    category: "コンサルティング",
    roles: [
      "戦略コンサルティング",
      "オペレーションコンサルティング",
      "ITコンサルティング",
      "セキュリティコンサルティング",
      "人事コンサルティング",
      "教育コンサルティング",
      "その他コンサルタント"
    ]
  },
  {
    category: "リサーチ・分析",
    roles: [
      "人文・社会・経済",
      "市場調査",
      "その他調査・分析職"
    ]
  },
  {
    category: "マーケティング・広告",
    roles: [
      "マーケティング戦略・企画",
      "ブランドマーケティング",
      "パフォーマンスマーケティング",
      "CRMマーケティング",
      "コンテンツマーケティング",
      "プロモーションマーケティング",
      "広告企画(AE)",
      "コピーライター(CW)",
      "アートディレクター(AD)",
      "メディア(プランニング・バイイング)",
      "広告管理・運営",
      "その他マーケティング職"
    ]
  },
  {
    category: "広報・対外協力",
    roles: [
      "広報・PR",
      "広報企画",
      "展示・イベント企画(MICE)",
      "対外協力・渉外",
      "その他広報職"
    ]
  },
  {
    category: "営業",
    roles: [
      "営業戦略・企画",
      "営業管理・支援",
      "店舗開発",
      "国内B2B営業",
      "国内B2C営業",
      "国内B2G営業",
      "海外B2B営業",
      "海外B2C営業",
      "海外B2G営業",
      "技術営業・SE",
      "IT・ソリューション営業",
      "個人金融営業",
      "法人金融営業",
      "保険商品営業",
      "製薬営業",
      "医療機器営業",
      "機械・設備営業",
      "部品・素材営業",
      "テレマーケティング(TM)",
      "その他営業職"
    ]
  },
  {
    category: "金融",
    roles: [
      "ECM",
      "DCM",
      "買収金融",
      "インフラ金融",
      "インフラ運用",
      "不動産金融",
      "不動産運用",
      "ストラクチャードファイナンス",
      "株式運用",
      "債券運用",
      "ETF運用",
      "M&A Advisory",
      "アクセラレーター",
      "Venture Capital",
      "グロース投資",
      "Private Equity",
      "ファンド出資",
      "ファンド組成",
      "ファンド管理",
      "PB/WM",
      "外国為替取引(Dealing)",
      "外国為替管理",
      "証券トレーディング",
      "証券リサーチ",
      "企業信用評価",
      "企業技術評価",
      "与信審査",
      "投資審査",
      "債権管理",
      "リスク管理",
      "金融商品開発",
      "保険商品開発",
      "アンダーライティング",
      "保険審査",
      "損害評価",
      "損害査定人",
      "保険設計士",
      "保険計理人",
      "その他金融職"
    ]
  },
  {
    category: "SW開発",
    roles: [
      "バックエンド",
      "フロントエンド",
      "フルスタック",
      "iOS",
      "Android",
      "クロスプラットフォーム",
      "ゲーム開発",
      "アプリケーション",
      "組み込み",
      "ブロックチェーン",
      "ERP",
      "Webパブリッシング",
      "DevOps",
      "セキュリティエンジニア",
      "ネットワークエンジニア",
      "システムエンジニア",
      "クラウドエンジニア",
      "データアーキテクト",
      "ソリューションアーキテクト",
      "クラウドアーキテクト",
      "システムアーキテクト",
      "ソフトウェアアーキテクト",
      "テクニカルアーキテクト",
      "QA・テスター・検証",
      "技術支援",
      "その他SW開発"
    ]
  },
  {
    category: "AI・データ",
    roles: [
      "AI・ML・DL",
      "MLOps",
      "DBA",
      "データエンジニア",
      "データサイエンティスト",
      "データアナリスト",
      "その他AI・データ"
    ]
  },
  {
    category: "研究開発職(R&D)",
    roles: [
      "半導体R&D",
      "ロボットR&D",
      "ディスプレイR&D",
      "電気・電子R&D",
      "自動車・造船・航空R&D",
      "機械R&D",
      "金属・材料R&D",
      "製薬・バイオR&D",
      "食品・健康機能食品R&D",
      "化学・繊維R&D",
      "エネルギー・環境R&D",
      "その他研究開発職"
    ]
  },
  {
    category: "設計職・エンジニアリング",
    roles: [
      "回路設計",
      "プロセス設計",
      "制御設計",
      "機構設計",
      "機械設計",
      "通信・ネットワーク設計",
      "金型設計",
      "建築設計",
      "土木設計",
      "プラント設計",
      "都市・造園設計",
      "機械設備",
      "電気設備",
      "通信・ネットワーク設備",
      "消防設備",
      "その他設計・エンジニアリング"
    ]
  },
  {
    category: "デザイン/UX",
    roles: [
      "ブランドデザイン",
      "産業・製品デザイン",
      "ITプロダクト/UXデザイン",
      "UI/GUIデザイン",
      "UXリサーチ",
      "UXライター",
      "モーション・映像デザイン",
      "キャラクター・アニメーションデザイン",
      "イラストレーション",
      "広告デザイン",
      "出版・編集デザイン",
      "ファッションデザイン",
      "VMD・展示・空間デザイン",
      "インテリアデザイン",
      "その他デザイン/UX"
    ]
  },
  {
    category: "建設・不動産",
    roles: [
      "建築士",
      "CM",
      "監理",
      "施工",
      "工務",
      "現場管理",
      "不動産開発・分譲・競売",
      "建設安全管理",
      "建設環境管理",
      "施設・建物管理",
      "測量・計測",
      "その他建設・不動産関連職"
    ]
  },
  {
    category: "生産・製造",
    roles: [
      "生産管理",
      "生産技術",
      "工程管理",
      "工務",
      "品質管理",
      "品質認証・保証",
      "製造・加工",
      "組立・包装",
      "産業安全管理",
      "産業環境管理",
      "その他生産・製造職"
    ]
  },
  {
    category: "流通・MD・貿易・運送",
    roles: [
      "通関士",
      "物流企画",
      "流通企画",
      "オンラインMD",
      "営業MD",
      "ファッションMD",
      "ビューティーMD",
      "リテールMD",
      "食品MD",
      "購買・調達・ソーシング",
      "流通管理",
      "物流管理・SCM",
      "輸出入・貿易事務・フォワーディング",
      "資材・在庫",
      "配送・運送・運転",
      "その他流通・MD"
    ]
  },
  {
    category: "放送・メディア・文化",
    roles: [
      "コンテンツ企画",
      "文化・芸術企画",
      "監督・演出・PD",
      "アナウンサー・アンカー",
      "記者・リポーター",
      "作家",
      "配給・製作者",
      "音楽・音響",
      "映像・写真",
      "出版企画",
      "出版編集・校正",
      "印刷・製本",
      "その他メディア・文化"
    ]
  },
  {
    category: "医療・保健",
    roles: [
      "医師",
      "歯科医師",
      "韓医師",
      "獣医師",
      "看護師",
      "看護助手",
      "薬剤師",
      "漢方薬剤師",
      "医療技師",
      "保健管理者",
      "臨床心理士",
      "その他医療・保健職"
    ]
  },
  {
    category: "製薬・バイオ",
    roles: [
      "Medical Affairs",
      "RA",
      "QA",
      "QC",
      "PV",
      "Market Access",
      "臨床",
      "その他製薬・バイオ"
    ]
  },
  {
    category: "教育",
    roles: [
      "教育企画",
      "技術・専門教育講師",
      "大学教授",
      "大学講師",
      "学校・特殊学校教師",
      "幼稚園・保育教師",
      "塾・学校・訪問講師",
      "その他教育職"
    ]
  },
  {
    category: "生活・ローカルサービス職",
    roles: [
      "宿泊・旅行",
      "飲食業",
      "不動産仲介",
      "運動・余暇・レジャー",
      "ビューティー・ファッション・美容",
      "警備・物理セキュリティ",
      "設置・修理・整備",
      "その他サービス職"
    ]
  },
  {
    category: "公職者・宗教人",
    roles: [
      "公務員",
      "軍人",
      "政治家",
      "宗教人",
      "その他公職者"
    ]
  },
  {
    category: "その他専門職",
    roles: [
      "翻訳・通訳",
      "不動産鑑定士",
      "社会福祉士",
      "行政書士",
      "その他専門職"
    ]
  }
];



const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", 
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県", 
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", 
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", 
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県", 
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県", 
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

const COUNTRIES = [
  "アメリカ", "カナダ", "イギリス", "ドイツ", "フランス", "イタリア", "スペイン",
  "中国", "韓国", "台湾", "香港", "シンガポール", "オーストラリア", "ニュージーランド",
  "インド", "ベトナム", "タイ", "マレーシア", "インドネシア", "フィリピン", "その他"
];

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [publicHandle, setPublicHandle] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const cardParam = params.get('card') || params.get('c') || params.get('handle');
    if (cardParam) return cardParam;

    const pathname = window.location.pathname;
    if (pathname.startsWith('/c/')) {
      const handleInPath = pathname.replace('/c/', '').trim();
      if (handleInPath) return handleInPath;
    }
    return null;
  });
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [activeMeishiTab, setActiveMeishiTab] = useState<'my' | 'team' | 'group'>('my');
  const [selectedMeishiForDetail, setSelectedMeishiForDetail] = useState<Meishi | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileTab, setProfileTab] = useState(0);
  const [isIntroEditOpen, setIsIntroEditOpen] = useState(false);
  const [introText, setIntroText] = useState('');
  const [isJobSeekingIntro, setIsJobSeekingIntro] = useState(false);
  const [isSimpleLoginSettingsOpen, setIsSimpleLoginSettingsOpen] = useState(false);

  // Career Edit States
  const [isCareerListOpen, setIsCareerListOpen] = useState(false);
  const [editingCareerId, setEditingCareerId] = useState<string | null>(null);
  const [totalCareerYears, setTotalCareerYears] = useState('');
  const [isCareerEditOpen, setIsCareerEditOpen] = useState(false);
  const [careerCompany, setCareerCompany] = useState('');
  const [careerIsCurrent, setCareerIsCurrent] = useState(false);
  const [careerStartDate, setCareerStartDate] = useState('');
  const [careerEndDate, setCareerEndDate] = useState('');
  const [careerTitle, setCareerTitle] = useState('');
  const [careerDepartment, setCareerDepartment] = useState('');
  const [careerDescription, setCareerDescription] = useState('');
  const [careerLocationRegion, setCareerLocationRegion] = useState('');
  const [careerLocationCountry, setCareerLocationCountry] = useState('');
  const [isCompanySearchOpen, setIsCompanySearchOpen] = useState(false);
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<'start' | 'end' | null>(null);
  const [tempDate, setTempDate] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });

  // Education Edit States
  const [isEducationEditOpen, setIsEducationEditOpen] = useState(false);
  const [eduSchool, setEduSchool] = useState('');
  const [eduDegree, setEduDegree] = useState('');
  const [eduMajor, setEduMajor] = useState('');
  const [eduStartDate, setEduStartDate] = useState('');
  const [eduEndDate, setEduEndDate] = useState('');
  const [eduIsCurrent, setEduIsCurrent] = useState(false);
  const [eduDescription, setEduDescription] = useState('');
  const [isSchoolSearchOpen, setIsSchoolSearchOpen] = useState(false);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [isMajorSearchOpen, setIsMajorSearchOpen] = useState(false);
  const [majorSearchQuery, setMajorSearchQuery] = useState('');
  const [isDegreeSelectOpen, setIsDegreeSelectOpen] = useState(false);
  const [isEduYearPickerOpen, setIsEduYearPickerOpen] = useState<'start' | 'end' | null>(null);
  const [tempEduYear, setTempEduYear] = useState(new Date().getFullYear());

  // Job Edit States
  const [isJobEditOpen, setIsJobEditOpen] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [openJobCategory, setOpenJobCategory] = useState<string | null>(null);
  const [jobSearchQuery, setJobSearchQuery] = useState("");
  const [jobSelectionError, setJobSelectionError] = useState(false);

  // Skill Edit States
  const [isSkillEditOpen, setIsSkillEditOpen] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillSearchQuery, setSkillSearchQuery] = useState("");

  // Language Edit States
  const [isLanguageEditOpen, setIsLanguageEditOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [isLanguageSelectOpen, setIsLanguageSelectOpen] = useState(false);
  const [isLevelSelectOpen, setIsLevelSelectOpen] = useState(false);
  const [editingLanguageId, setEditingLanguageId] = useState<string | null>(null);

  // Website Edit States
  const [isWebsiteEditOpen, setIsWebsiteEditOpen] = useState(false);
  const [websiteUrls, setWebsiteUrls] = useState<string[]>([""]);

  // Lecture Edit State
  const [isLectureEditOpen, setIsLectureEditOpen] = useState(false);
  const [lectureTitle, setLectureTitle] = useState("");
  const [lectureDate, setLectureDate] = useState("");
  const [isLectureDatePickerOpen, setIsLectureDatePickerOpen] = useState(false);
  const [tempLectureDate, setTempLectureDate] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });

  // Publication Edit State
  const [isPublicationEditOpen, setIsPublicationEditOpen] = useState(false);
  const [publicationTitle, setPublicationTitle] = useState("");
  const [publicationDate, setPublicationDate] = useState("");
  const [isPublicationDatePickerOpen, setIsPublicationDatePickerOpen] = useState(false);
  const [tempPublicationDate, setTempPublicationDate] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });

  // Article Edit State
  const [isArticleListEditOpen, setIsArticleListEditOpen] = useState(false);
  const [isArticleEditOpen, setIsArticleEditOpen] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [articleTitle, setArticleTitle] = useState("");
  const [articleUrl, setArticleUrl] = useState("");
  const [isArticleDeleteModalOpen, setIsArticleDeleteModalOpen] = useState(false);

  // Personal Info Edit State
  const [isPersonalInfoEditOpen, setIsPersonalInfoEditOpen] = useState(false);
  const [gender, setGender] = useState<'男性' | '女性' | '選択しない' | undefined>(undefined);
  const [birthYear, setBirthYear] = useState<number | undefined>(undefined);

  // Awards Edit State
  const [isAwardsEditOpen, setIsAwardsEditOpen] = useState(false);
  const [awardsList, setAwardsList] = useState<string[]>([""]);

  // Certificates Edit State
  const [isCertificatesEditOpen, setIsCertificatesEditOpen] = useState(false);
  const [certificatesList, setCertificatesList] = useState<string[]>([""]);

  // Meishi Registration States
  const [isMeishiCameraOpen, setIsMeishiCameraOpen] = useState(false);
  const [isMeishiOtherMethodsOpen, setIsMeishiOtherMethodsOpen] = useState(false);
  const [isMeishiDirectInputOpen, setIsMeishiDirectInputOpen] = useState(false);
  const [meishiDirectInputData, setMeishiDirectInputData] = useState({
    name: '',
    position: '',
    department: '',
    company: '',
    mobile: '',
    email: '',
    phone: '',
    fax: '',
    address: '',
    detailedAddress: '',
    profileImage: null as string | null
  });
  const [isMeishiOcrProcessing, setIsMeishiOcrProcessing] = useState(false);
  const [isRegisteringMyMeishi, setIsRegisteringMyMeishi] = useState(false);
  const meishiManualProfileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isIntroEditOpen && userProfile) {
      setIntroText(userProfile.introduction || '');
      setIsJobSeekingIntro(userProfile.isJobSeekingIntro || false);
    }
  }, [isIntroEditOpen, userProfile]);

  React.useEffect(() => {
    if (isJobEditOpen && userProfile) {
      setSelectedJobs(userProfile.jobs || []);
    }
  }, [isJobEditOpen, userProfile]);

  const [isMorePageOpen, setIsMorePageOpen] = useState(false);
  const [isSettingsPageOpen, setIsSettingsPageOpen] = useState(false);
  const [isAccountManagementOpen, setIsAccountManagementOpen] = useState(false);
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);
  const [isWithdrawalChecked, setIsWithdrawalChecked] = useState(false);
  const [isPasswordSetupPopupOpen, setIsPasswordSetupPopupOpen] = useState(false);
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [isPasswordChangeOpen, setIsPasswordChangeOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isPasswordResetSuccessOpen, setIsPasswordResetSuccessOpen] = useState(false);
  const [isPasswordResetErrorOpen, setIsPasswordResetErrorOpen] = useState(false);
  const [isMeishiMapOpen, setIsMeishiMapOpen] = useState(false);
  const [meishis, setMeishis] = useState<Meishi[]>([]);
  const [meishiSortOrder, setMeishiSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isMeishiEditOpen, setIsMeishiEditOpen] = useState(false);
  const [selectedMeishis, setSelectedMeishis] = useState<string[]>([]);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMyMeishiDeleteDialogOpen, setIsMyMeishiDeleteDialogOpen] = useState(false);
  const myMeishi = meishis.find(m => m.isMyCard);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCommunityBoard, setSelectedCommunityBoard] = useState<string>('all');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginView, setLoginView] = useState<'main' | 'terms' | 'signup'>('main');
  const [completedProfileSteps, setCompletedProfileSteps] = useState<number[]>([]);

  const handleDeleteSelectedMeishis = () => {
    if (selectedMeishis.length === 0) return;
    setIsMoreMenuOpen(false);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteMeishi = async (id: string) => {
    if (!user) return;
    try {
      setMeishis(prev => prev.filter(m => m.id !== id));
      await deleteDoc(doc(db, 'meishi', id));
      setSelectedMeishiForDetail(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'meishi');
    }
  };

  const confirmDeleteMyMeishi = async () => {
    if (!myMeishi || !user) return;
    try {
      setMeishis(prev => prev.filter(m => m.id !== myMeishi.id));
      await deleteDoc(doc(db, 'meishi', myMeishi.id));
      setIsMyMeishiDeleteDialogOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'meishi');
    }
  };

  const confirmDeleteMeishis = async () => {
    if (selectedMeishis.length === 0 || !user) return;
    try {
      // Optimistic update for immediate UI feedback
      setMeishis(prev => prev.filter(m => !selectedMeishis.includes(m.id)));
      
      for (const id of selectedMeishis) {
        await deleteDoc(doc(db, 'meishi', id));
      }
      setSelectedMeishis([]);
      setIsEditMode(false);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'meishi');
    }
  };

  const handleShareSelectedMeishis = async () => {
    if (selectedMeishis.length === 0) return;
    
    const selectedData = meishis.filter(m => selectedMeishis.includes(m.id));
    const shareText = selectedData.map(m => 
      `【${m.name}】\n会社: ${m.company}\n役職: ${m.title}\nEmail: ${m.email}\nTEL: ${m.phone}`
    ).join('\n\n');

    if (navigator.share) {
      try {
        await navigator.share({
          title: '名刺情報の共有',
          text: shareText,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        console.log('Copied to clipboard');
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
    
    setIsMoreMenuOpen(false);
    setIsEditMode(false);
    setSelectedMeishis([]);
  };

  const toggleProfileStep = (step: number) => {
    setCompletedProfileSteps(prev => 
      prev.includes(step) ? prev.filter(s => s !== step) : [...prev, step]
    );
  };

  const sortedMeishis = React.useMemo(() => {
    return [...meishis].sort((a, b) => {
      // Prioritize My Card
      if (a.isMyCard && !b.isMyCard) return -1;
      if (!a.isMyCard && b.isMyCard) return 1;

      const dateA = new Date(a.updatedAt || 0).getTime();
      const dateB = new Date(b.updatedAt || 0).getTime();
      return meishiSortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [meishis, meishiSortOrder]);

  // Auth state listener
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Ensure user document exists in Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          try {
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              role: 'user',
              createdAt: serverTimestamp()
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
          }
        }
      }
      setUser(currentUser);
      setIsAuthReady(true);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore data listeners
  React.useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setMeishis([]);
      setPosts([]);
      return;
    }

    // Listen to User Profile
    const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfile);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}`));

    // Listen to Meishi
    const meishiQuery = query(
      collection(db, 'meishi'),
      where('ownerUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeMeishi = onSnapshot(meishiQuery, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data({ serverTimestamps: 'estimate' }) } as any));
      setMeishis(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'meishi'));

    // Listen to Posts
    const postsQuery = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setPosts(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'posts'));

    return () => {
      unsubscribeProfile();
      unsubscribeMeishi();
      unsubscribePosts();
    };
  }, [user]);

  const handleLineLogin = async () => {
    try {
      const response = await fetch('/api/auth/line/url');
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();

      const authWindow = window.open(
        url,
        'line_oauth_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        alert('ポップアップがブロックされました。LINEログインを続けるにはポップアップを許可してください。');
      }
    } catch (error) {
      console.error('LINE login error:', error);
    }
  };

  // Listen for success message from popup
  React.useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.customToken) {
        try {
          await signInWithCustomToken(auth, event.data.customToken);
        } catch (error) {
          console.error('Firebase custom token sign-in failed:', error);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSaveIntro = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        introduction: introText,
        isJobSeekingIntro: isJobSeekingIntro
      });
      setIsIntroEditOpen(false);
      if (!completedProfileSteps.includes(2)) {
        toggleProfileStep(2); // Mark intro as completed
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  React.useEffect(() => {
    if (isCareerListOpen && userProfile) {
      setTotalCareerYears(userProfile.totalCareerYears || '');
    }
  }, [isCareerListOpen, userProfile]);

  const handleSaveTotalCareerYears = async (years: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        totalCareerYears: years
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const calculateDuration = (startDate: string, endDate?: string, isCurrent?: boolean) => {
    if (!startDate) return '';
    const start = new Date(startDate);
    const end = isCurrent || !endDate ? new Date() : new Date(endDate);
    
    let months = (end.getFullYear() - start.getFullYear()) * 12;
    months -= start.getMonth();
    months += end.getMonth();
    
    // Add 1 to include both start and end months
    months += 1;

    if (months < 1) return '0ヶ月';
    
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) return `${remainingMonths}ヶ月`;
    if (remainingMonths === 0) return `${years}年`;
    return `${years}年 ${remainingMonths}ヶ月`;
  };

  const handleSaveCareer = async () => {
    if (!user || !careerCompany || !careerStartDate) return;
    if (!careerIsCurrent && !careerEndDate) return;

    try {
      const careerData: Career = {
        id: editingCareerId || Date.now().toString(),
        companyName: careerCompany,
        isCurrent: careerIsCurrent,
        startDate: careerStartDate,
        ...(careerIsCurrent ? {} : { endDate: careerEndDate }),
        title: careerTitle,
        department: careerDepartment,
        description: careerDescription,
        location: careerLocationRegion === '海外' ? careerLocationCountry : careerLocationRegion,
      };

      let updatedCareers = userProfile?.careers || [];
      if (editingCareerId) {
        updatedCareers = updatedCareers.map(c => c.id === editingCareerId ? careerData : c);
      } else {
        updatedCareers = [...updatedCareers, careerData];
      }

      await updateDoc(doc(db, 'users', user.uid), {
        careers: updatedCareers
      });

      setIsCareerEditOpen(false);
      setEditingCareerId(null);
      if (!completedProfileSteps.includes(3)) {
        toggleProfileStep(3); // Mark career as completed
      }
      
      // Reset form
      setCareerCompany('');
      setCareerIsCurrent(false);
      setCareerStartDate('');
      setCareerEndDate('');
      setCareerTitle('');
      setCareerDepartment('');
      setCareerDescription('');
      setCareerLocationRegion('');
      setCareerLocationCountry('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleDeleteCareer = async () => {
    if (!user || !editingCareerId) return;
    try {
      const updatedCareers = userProfile?.careers?.filter(c => c.id !== editingCareerId) || [];
      await updateDoc(doc(db, 'users', user.uid), {
        careers: updatedCareers
      });

      setIsCareerEditOpen(false);
      setEditingCareerId(null);
      
      // Reset form
      setCareerCompany('');
      setCareerIsCurrent(false);
      setCareerStartDate('');
      setCareerEndDate('');
      setCareerTitle('');
      setCareerDepartment('');
      setCareerDescription('');
      setCareerLocationRegion('');
      setCareerLocationCountry('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleSaveEducation = async () => {
    if (!user || !eduSchool) return;

    try {
      const newEdu: Education = {
        id: Date.now().toString(),
        schoolName: eduSchool,
        degree: eduDegree,
        major: eduMajor,
        startDate: eduStartDate,
        ...(eduIsCurrent ? {} : { endDate: eduEndDate }),
        isCurrent: eduIsCurrent,
        description: eduDescription
      };

      const updatedEdus = [...(userProfile?.educations || []), newEdu];

      await updateDoc(doc(db, 'users', user.uid), {
        educations: updatedEdus
      });

      setIsEducationEditOpen(false);
      if (!completedProfileSteps.includes(6)) {
        toggleProfileStep(6); // Mark education as completed
      }
      
      // Reset form
      setEduSchool('');
      setEduDegree('');
      setEduMajor('');
      setEduStartDate('');
      setEduEndDate('');
      setEduIsCurrent(false);
      setEduDescription('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleSaveJob = async () => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        jobs: selectedJobs
      });

      setIsJobEditOpen(false);
      // Assuming job is step 7 or we just don't have a specific step for it in the 6 cards.
      // Wait, let's check if there's a step for it. The cards only go up to 6.
      // We'll just close the modal.
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleSaveSkill = async () => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        skills: selectedSkills
      });

      setIsSkillEditOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleSaveLanguage = async () => {
    if (!user || !selectedLanguage || !selectedLevel) return;

    try {
      const currentLanguages = userProfile?.languages || [];
      let updatedLanguages;

      if (editingLanguageId) {
        updatedLanguages = currentLanguages.map(lang => 
          lang.id === editingLanguageId 
            ? { ...lang, language: selectedLanguage, level: selectedLevel }
            : lang
        );
      } else {
        updatedLanguages = [
          ...currentLanguages,
          {
            id: Date.now().toString(),
            language: selectedLanguage,
            level: selectedLevel
          }
        ];
      }

      await updateDoc(doc(db, 'users', user.uid), {
        languages: updatedLanguages
      });

      setIsLanguageEditOpen(false);
      setSelectedLanguage("");
      setSelectedLevel("");
      setEditingLanguageId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const deleteLanguage = async (id: string) => {
    if (!user || !userProfile?.languages) return;
    
    try {
      const updatedLanguages = userProfile.languages.filter(lang => lang.id !== id);
      await updateDoc(doc(db, 'users', user.uid), {
        languages: updatedLanguages
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleSaveWebsite = async () => {
    if (!user) return;

    try {
      const validUrls = websiteUrls.filter(url => url.trim() !== "");
      await updateDoc(doc(db, 'users', user.uid), {
        websites: validUrls
      });

      setIsWebsiteEditOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleSaveLecture = async () => {
    if (!user || !lectureTitle || !lectureDate) return;

    try {
      const newLecture: Lecture = {
        id: Date.now().toString(),
        title: lectureTitle,
        date: lectureDate
      };

      await updateDoc(doc(db, 'users', user.uid), {
        lectures: arrayUnion(newLecture)
      });

      setIsLectureEditOpen(false);
      setLectureTitle("");
      setLectureDate("");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleSavePublication = async () => {
    if (!user || !publicationTitle || !publicationDate) return;

    try {
      const newPublication: Publication = {
        id: Date.now().toString(),
        title: publicationTitle,
        date: publicationDate
      };

      await updateDoc(doc(db, 'users', user.uid), {
        publications: arrayUnion(newPublication)
      });

      setIsPublicationEditOpen(false);
      setPublicationTitle("");
      setPublicationDate("");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleSaveArticle = async () => {
    if (!user || !articleTitle || !articleUrl) return;

    try {
      const updatedArticles = [...(userProfile?.articles || [])];
      
      if (editingArticleId) {
        const index = updatedArticles.findIndex(a => a.id === editingArticleId);
        if (index !== -1) {
          updatedArticles[index] = { ...updatedArticles[index], title: articleTitle, url: articleUrl };
        }
      } else {
        const newArticle: Article = {
          id: Date.now().toString(),
          title: articleTitle,
          url: articleUrl
        };
        updatedArticles.push(newArticle);
      }

      await updateDoc(doc(db, 'users', user.uid), {
        articles: updatedArticles
      });

      setIsArticleEditOpen(false);
      setArticleTitle("");
      setArticleUrl("");
      setEditingArticleId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleDeleteArticle = async () => {
    if (!user || !editingArticleId) return;
    
    try {
      const updatedArticles = (userProfile?.articles || []).filter(a => a.id !== editingArticleId);
      
      await updateDoc(doc(db, 'users', user.uid), {
        articles: updatedArticles
      });

      setIsArticleDeleteModalOpen(false);
      setIsArticleEditOpen(false);
      setArticleTitle("");
      setArticleUrl("");
      setEditingArticleId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleSavePersonalInfo = async () => {
    if (!user) return;

    try {
      const updateData: any = {};
      if (gender !== undefined) updateData.gender = gender || deleteField();
      if (birthYear !== undefined) updateData.birthYear = birthYear || deleteField();

      await updateDoc(doc(db, 'users', user.uid), updateData);

      setIsPersonalInfoEditOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleAddAwardInput = () => {
    setAwardsList([...awardsList, ""]);
  };

  const handleAwardChange = (index: number, value: string) => {
    const newAwards = [...awardsList];
    newAwards[index] = value;
    setAwardsList(newAwards);
  };

  const handleSaveAwards = async () => {
    if (!user) return;

    try {
      const validAwards = awardsList.filter(url => url.trim() !== "");
      
      await updateDoc(doc(db, 'users', user.uid), {
        awards: validAwards.length > 0 ? validAwards : deleteField()
      });

      setIsAwardsEditOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleAddCertificateInput = () => {
    setCertificatesList([...certificatesList, ""]);
  };

  const handleCertificateChange = (index: number, value: string) => {
    const newCertificates = [...certificatesList];
    newCertificates[index] = value;
    setCertificatesList(newCertificates);
  };

  const handleSaveCertificates = async () => {
    if (!user) return;

    try {
      const validCertificates = certificatesList.filter(url => url.trim() !== "");
      
      await updateDoc(doc(db, 'users', user.uid), {
        certificates: validCertificates.length > 0 ? validCertificates : deleteField()
      });

      setIsCertificatesEditOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleMeishiManualProfileClick = () => {
    meishiManualProfileInputRef.current?.click();
  };

  const handleMeishiManualProfileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const resizedBase64 = await resizeImage(base64, 400, 400); // Profile image can be smaller
        setMeishiDirectInputData(prev => ({ ...prev, profileImage: resizedBase64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenMeishiCamera = () => {
    setIsRegisteringMyMeishi(false);
    setIsMeishiOtherMethodsOpen(false);
    setIsMeishiCameraOpen(true);
  };

  const handleOpenMyMeishiCamera = () => {
    setIsRegisteringMyMeishi(true);
    setIsMeishiOtherMethodsOpen(false);
    setIsMeishiCameraOpen(true);
  };

  const handleCloseMeishiCamera = () => {
    setIsMeishiCameraOpen(false);
    setIsMeishiDirectInputOpen(false);
    setIsRegisteringMyMeishi(false);
  };

  const processMeishiOcrAndSave = async (frontImage: string, backImage: string | null, settings: 'send' | 'save') => {
    if (!frontImage) return;
    setIsMeishiOcrProcessing(true);
    try {
      const { GoogleGenAI, Type } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const base64Image = frontImage.split(',')[1];
      
      const parts: any[] = [
        { text: "Extract information from this business card. Return JSON with name, company, position, email, phone. If a field is not found, use an empty string. Language is Japanese. If there are two images, the second one is the back side of the card." },
        { inlineData: { data: base64Image, mimeType: "image/jpeg" } }
      ];

      if (backImage) {
        const base64Back = backImage.split(',')[1];
        parts.push({ inlineData: { data: base64Back, mimeType: "image/jpeg" } });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              company: { type: Type.STRING },
              position: { type: Type.STRING },
              department: { type: Type.STRING },
              email: { type: Type.STRING },
              phone: { type: Type.STRING },
              mobile: { type: Type.STRING },
              fax: { type: Type.STRING },
              address: { type: Type.STRING },
              detailedAddress: { type: Type.STRING }
            },
            required: ["name", "company", "position", "email", "phone"]
          }
        }
      });

      const result = JSON.parse(response.text);
      
      if (user) {
        const newMeishiId = doc(collection(db, 'meishi')).id;
        const newMeishi: Meishi = {
          id: newMeishiId,
          ownerUid: user.uid,
          ...result,
          updatedAt: new Date().toISOString(),
          createdAt: serverTimestamp(),
          imageUrl: frontImage,
          imageUrlBack: backImage || null,
          isMyCard: isRegisteringMyMeishi
        };
        
        await setDoc(doc(db, 'meishi', newMeishiId), newMeishi);
        setIsRegisteringMyMeishi(false);
      }
    } catch (error) {
      console.error("OCR error:", error);
      alert("名刺の認識に失敗しました。");
    } finally {
      setIsMeishiOcrProcessing(false);
    }
  };

  const handleSaveMeishiDirect = async () => {
    if (!userProfile) return;
    setIsMeishiOcrProcessing(true);
    try {
      const newMeishiId = doc(collection(db, 'meishi')).id;
      const newMeishi: Meishi = {
        id: newMeishiId,
        ownerUid: userProfile.uid,
        name: meishiDirectInputData.name,
        company: meishiDirectInputData.company,
        position: meishiDirectInputData.position,
        department: meishiDirectInputData.department,
        email: meishiDirectInputData.email,
        phone: meishiDirectInputData.phone,
        mobile: meishiDirectInputData.mobile,
        fax: meishiDirectInputData.fax,
        address: meishiDirectInputData.address,
        detailedAddress: meishiDirectInputData.detailedAddress,
        imageUrl: meishiDirectInputData.profileImage || '',
        isMyCard: isRegisteringMyMeishi,
        updatedAt: new Date().toISOString(),
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'meishi', newMeishiId), newMeishi);
      setIsMeishiDirectInputOpen(false);
      setIsRegisteringMyMeishi(false);
    } catch (error) {
      console.error("Error saving manual meishi:", error);
      alert("名刺の保存に失敗しました。");
    } finally {
      setIsMeishiOcrProcessing(false);
    }
  };

  const handleAddWebsiteInput = () => {
    setWebsiteUrls([...websiteUrls, ""]);
  };

  const handleWebsiteChange = (index: number, value: string) => {
    const newUrls = [...websiteUrls];
    newUrls[index] = value;
    setWebsiteUrls(newUrls);
  };

  const renderHeader = () => {
    switch (activeTab) {
      case 'today':
        return (
          <header className="bg-white px-4 h-[52px] flex items-center justify-between sticky top-0 z-10 border-b border-gray-100">
            <h1 className="text-2xl font-bold font-serif tracking-tighter text-[#0A0A0A]">Billionaire</h1>
            <div className="flex items-center gap-4">
              <Search className="w-6 h-6 text-gray-700" />
              <div className="relative">
                <Bell className="w-6 h-6 text-gray-700" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">6</div>
              </div>
              <Menu className="w-6 h-6 text-gray-700 cursor-pointer" onClick={() => setIsMorePageOpen(true)} />
            </div>
          </header>
        );
      case 'meishi':
        return (
          <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
            <div className="px-4 h-[52px] flex justify-between items-center">
              <h1 className="text-xl font-black tracking-tight text-gray-900">名刺帳</h1>
              <div className="flex gap-4">
                <Search className="w-6 h-6 text-gray-700" />
                <div className="relative">
                  <Bell className="w-6 h-6 text-gray-700" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">99+</div>
                </div>
                <Menu className="w-6 h-6 text-gray-700 cursor-pointer" onClick={() => setIsMorePageOpen(true)} />
              </div>
            </div>

            <div className="flex gap-6 overflow-x-auto no-scrollbar px-4 py-2 relative">
              {[
                { id: 'my', label: 'マイ名刺帳' },
                { id: 'team', label: 'チーム名刺帳' },
                { id: 'group', label: 'グループ連絡先' }
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveMeishiTab(tab.id as 'my' | 'team' | 'group')}
                  className={`relative text-sm font-bold whitespace-nowrap pb-2 transition-colors ${activeMeishiTab === tab.id ? 'text-gray-900' : 'text-gray-400'}`}
                >
                  {tab.label}
                  {activeMeishiTab === tab.id && (
                    <motion.div
                      layoutId="meishiTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </header>
        );
      case 'community':
        return (
          <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
            <div className="px-4 h-[52px] flex justify-between items-center">
              <h1 className="text-xl font-black tracking-tight text-gray-900">コミュニティ</h1>
              <div className="flex gap-4">
                <Search className="w-6 h-6 text-gray-700" />
                <Bell className="w-6 h-6 text-gray-700" />
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto px-4 pb-2 no-scrollbar text-sm font-bold text-gray-400">
              <span className="text-gray-900 border-b-2 border-gray-900 pb-1 whitespace-nowrap">ホーム</span>
              <span className="whitespace-nowrap">キャリア</span>
              <span className="whitespace-nowrap">給与・年収</span>
              <span className="whitespace-nowrap">職場環境</span>
              <span className="whitespace-nowrap">転職相談</span>
            </div>
          </header>
        );
      case 'jobs':
        return (
          <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 h-[52px] flex items-center justify-between">
            <h1 className="text-xl font-black tracking-tight text-gray-900">求人</h1>
            <div className="flex gap-4">
              <Filter className="w-6 h-6 text-gray-700" />
              <Bell className="w-6 h-6 text-gray-700" />
            </div>
          </header>
        );
      case 'connect':
        return (
          <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 h-[52px] flex items-center justify-between">
            <h1 className="text-xl font-black tracking-tight text-gray-900">コネクト</h1>
            <Bell className="w-6 h-6 text-gray-700" />
          </header>
        );
    }
  };

  const handleEmailSignupComplete = async (email: string, pass: string) => {
    // In a real app, we'd use createUserWithEmailAndPassword
    // For this demo, we'll just simulate a login
    console.log('Signup with:', email, pass);
    handleLogin(); // Fallback to google login for demo purposes or just mock it
  };

  if (publicHandle) {
    return (
      <PublicCardView 
        handle={publicHandle} 
        onBackToApp={() => setPublicHandle(null)} 
        currentUserId={user?.uid} 
      />
    );
  }

  if (!isAuthReady || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <AnimatePresence mode="wait">
        {loginView === 'main' && (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen"
          >
            <LoginScreen onLogin={handleLogin} onLineLogin={handleLineLogin} onEmailSignup={() => setLoginView('terms')} />
          </motion.div>
        )}
        {loginView === 'terms' && (
          <motion.div
            key="terms"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50"
          >
            <TermsAgreement onNext={() => setLoginView('signup')} onBack={() => setLoginView('main')} />
          </motion.div>
        )}
        {loginView === 'signup' && (
          <motion.div
            key="signup"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50"
          >
            <EmailSignup onBack={() => setLoginView('terms')} onComplete={handleEmailSignupComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-[#141A21]">
      {/* Desktop Web Header Bar (Remember Web Style) */}
      <header className="hidden lg:block w-full bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('today')}>
              <h1 className="text-2xl font-black font-serif tracking-tight text-[#0A0A0A]">Billionaire</h1>
              <span className="text-[10px] font-extrabold bg-[#0A0A0A]/10 text-[#0A0A0A] px-2 py-0.5 rounded-full uppercase tracking-wider">REMEMBER SYNC</span>
            </div>

            {/* Global Web Search Input */}
            <div className="relative w-72 xl:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="会社名、お名前、職種、キーワードで検索..." 
                className="w-full bg-[#F5F6F8] border border-transparent focus:border-[#0A0A0A] focus:bg-white text-xs pl-9 pr-4 py-2 rounded-full outline-none transition-all"
              />
            </div>
          </div>

          {/* Main Top Web Navigation Tabs */}
          <nav className="flex items-center gap-1 font-bold text-sm">
            {[
              { id: 'community', label: 'コミュニティ', icon: Share2 },
              { id: 'meishi', label: '名刺/ネットワーク', icon: Contact },
              { id: 'today', label: 'トゥデイ', icon: Home },
              { id: 'jobs', label: '転職・キャリア', icon: Briefcase },
              { id: 'connect', label: 'コネクト', icon: FileText },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as Tab)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-[#0A0A0A] text-white shadow-xs' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Desktop Right Header Action Items */}
          <div className="flex items-center gap-2.5">
            <button 
              onClick={handleOpenMeishiCamera}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#0A0A0A] text-white font-bold text-xs rounded-lg hover:bg-black transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              名刺登録
            </button>

            <button 
              onClick={() => {
                setActiveTab('community');
                setIsPostModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#C9483B] text-white font-bold text-xs rounded-lg hover:bg-[#B03A2E] transition-colors shadow-xs"
            >
              <PenSquare className="w-4 h-4" />
              投稿する
            </button>

            <div className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
            </div>

            <button 
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center font-bold text-xs">
                {userProfile?.displayName?.[0] || 'B'}
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Responsive Layout Grid (Remember Web Style) */}
      <div className="max-w-7xl mx-auto px-0 lg:px-6 py-0 lg:py-6 flex gap-6 items-start">
        {/* Desktop Left Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-4 sticky top-22">
          {/* User Profile Card Widget */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center font-bold text-base shadow-xs">
                {userProfile?.displayName?.[0] || 'B'}
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-1">
                  <h3 className="font-bold text-sm text-gray-900 truncate">
                    {userProfile?.displayName || 'Billionaire User'}
                  </h3>
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" title="認証済み" />
                </div>
                <p className="text-xs text-gray-500 truncate">株式会社サンプル ・ 営業部</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center py-2 px-1 bg-gray-50 rounded-lg text-xs font-medium text-gray-600 mb-3">
              <div>
                <p className="text-[10px] text-gray-400">登録名刺</p>
                <p className="font-bold text-gray-900">{meishis.length}枚</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">コミュニティ</p>
                <p className="font-bold text-gray-900">{posts.length}件</p>
              </div>
            </div>

            <button 
              onClick={() => setPublicHandle('billionaire_demo')}
              className="w-full py-2 bg-gray-100 text-[#0A0A0A] font-bold text-xs rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              マイ公開デジタル名刺 URL
            </button>
          </div>

          {/* Remember Community Category Navigation */}
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-xs space-y-1">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1">
              REMEMBER COMMUNITY
            </p>
            {[
              { label: '🔥 人気投稿 (Hot)', board: 'all', icon: TrendingUp },
              { label: '💬 ビジネス相談 & Q&A', board: 'qa', icon: MessageSquare },
              { label: '💻 IT / 企画 / 開発', board: 'it', icon: FileText },
              { label: '📈 マーケティング / 営業', board: 'marketing', icon: Briefcase },
              { label: '👔 CEO & 経営陣', board: 'exec', icon: Building2 },
              { label: '📌 保存した記事', board: 'saved', icon: Bookmark },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.board}
                  onClick={() => {
                    setActiveTab('community');
                    setSelectedCommunityBoard(item.board);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                    selectedCommunityBoard === item.board && activeTab === 'community'
                      ? 'bg-[#0A0A0A] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 opacity-80" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center Main App Content Container */}
        <div className="flex-1 min-w-0 bg-white lg:rounded-2xl lg:shadow-xs lg:border lg:border-gray-200 min-h-screen lg:min-h-[850px] overflow-hidden flex flex-col max-w-md lg:max-w-none mx-auto lg:mx-0 shadow-2xl lg:shadow-none w-full">
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="lg:hidden">
            {renderHeader()}
          </div>

          <main className="flex-1 overflow-y-auto pb-20 lg:pb-6">
        <AnimatePresence mode="wait">
          {activeTab === 'meishi' && (
            <motion.div
              key="meishi"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col"
            >
              {/* Meishi Content based on active tab */}
              {activeMeishiTab === 'team' ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    大切な会社の営業資産、<br />チーム名刺帳で管理しましょう！
                  </h3>
                  <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                    役職員の変動があっても紛失することなく<br />安全に管理できます。
                  </p>
                  <div className="bg-gray-100 text-gray-500 font-bold py-2 px-6 rounded-full text-sm">
                    準備中
                  </div>
                </div>
              ) : activeMeishiTab === 'group' ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white flex-1">
                  <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                    グループ連絡先
                  </p>
                  <div className="bg-gray-100 text-gray-500 font-bold py-2 px-6 rounded-full text-sm">
                    準備中
                  </div>
                </div>
              ) : (
                <>
                  {/* Filter Bar */}
                  <div className="px-4 py-1.5 h-[35px] flex justify-between items-center bg-white border-b border-gray-100">
                    <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
                      <span>すべて ({meishis.length})</span>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium text-gray-600">
                      <button 
                        onClick={() => setIsMeishiMapOpen(true)}
                        className="flex items-center gap-1 hover:text-[#0A0A0A] transition-colors"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>地図</span>
                      </button>
                      <button 
                        onClick={() => setMeishiSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                        className="flex items-center gap-1 hover:text-[#0A0A0A] transition-colors"
                      >
                        <ArrowUpDown className="w-3 h-3" />
                        <span>登録日順 {meishiSortOrder === 'desc' ? '↓' : '↑'}</span>
                      </button>
                      <button 
                        onClick={() => {
                          setIsEditMode(!isEditMode);
                          if (isEditMode) setSelectedMeishis([]);
                        }}
                        className={`flex items-center gap-1 transition-colors ${isEditMode ? 'text-[#0A0A0A]' : 'hover:text-[#0A0A0A]'}`}
                      >
                        {isEditMode ? <X className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                        <span>{isEditMode ? 'キャンセル' : '編集'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Meishi List */}
                  <div className="flex flex-col bg-white">
                    {sortedMeishis.length > 0 ? (
                      sortedMeishis.map(m => (
                        <MeishiCard 
                          key={m.id} 
                          meishi={m} 
                          isEditMode={isEditMode}
                          isSelected={selectedMeishis.includes(m.id)}
                          onSelect={(id) => {
                            setSelectedMeishis(prev => 
                              prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
                            );
                          }}
                          onClick={(meishi) => setSelectedMeishiForDetail(meishi)}
                        />
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-sm text-gray-400">名刺をスキャンして<br />ネットワークを広げましょう</p>
                      </div>
                    )}
                  </div>

                  {/* Floating Action Button */}
                  {!isEditMode && (
                    <button 
                      onClick={handleOpenMeishiCamera}
                      className="fixed bottom-24 right-4 bg-[#0A0A0A] hover:bg-black text-white px-5 py-3.5 rounded-full shadow-xl flex items-center gap-2 font-bold active:scale-95 transition-transform z-20"
                    >
                      <Plus className="w-5 h-5" />
                      <span>名刺登録</span>
                    </button>
                  )}
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'community' && (
            <motion.div
              key="forum"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-white p-4 mb-2 flex items-center gap-3 border-b border-gray-100">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 bg-gray-50 rounded-full px-4 py-2 text-sm text-gray-400">
                  今の気持ちを投稿してみましょう
                </div>
              </div>
              {posts.map(p => (
                <ForumPost key={p.id} post={p} />
              ))}
            </motion.div>
          )}

          {activeTab === 'connect' && (
            <motion.div
              key="connect"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4"
            >
              <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">コネクト</h2>
                <p className="text-gray-500 text-sm">
                  新しいつながりを見つけましょう。
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'jobs' && (
            <motion.div
              key="jobs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="p-4 bg-white border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900 mb-4">注目の求人</h2>
                <div className="flex gap-3 overflow-x-auto no-scrollbar">
                  {MOCK_JOBS.map(j => (
                    <div key={j.id} className="min-w-[200px] border border-gray-100 rounded-xl p-3 bg-white shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-gray-50 rounded border border-gray-100 flex items-center justify-center">
                          <Building2 className="w-3 h-3 text-gray-300" />
                        </div>
                        <span className="text-xs font-bold text-gray-600">{j.company}</span>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-1 mb-1">{j.title}</h3>
                      <p className="text-[10px] text-blue-600 font-bold">{j.salary}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-2">
                {MOCK_JOBS.map(j => (
                  <JobCard key={j.id} job={j} />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'today' && (
            <motion.div
              key="today"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white min-h-screen pb-24"
            >
              <div className="p-4">
                {/* User Profile */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <h2 className="text-base font-bold text-gray-900">{user.displayName || 'ゲストユーザー'}</h2>
                  </div>
                  <button 
                    onClick={() => setIsProfileOpen(true)}
                    className="px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700"
                  >
                    マイプロフィール
                  </button>
                </div>

                {/* Profile Completion */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900 text-xs">プロフィールを完成させる <span className="text-gray-400 font-normal">({completedProfileSteps.length}/6)</span></h3>
                    <button className="flex items-center text-gray-400 text-xs gap-1">
                      折りたたむ <ChevronRight className="w-3 h-3 -rotate-90" />
                    </button>
                  </div>
                  
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i <= completedProfileSteps.length ? 'bg-black' : 'bg-gray-100'}`}></div>
                    ))}
                  </div>

                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x no-scrollbar">
                    {/* Card 1 */}
                    <div className="min-w-[200px] bg-white border border-gray-200 rounded-lg p-3.5 snap-start">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-gray-700" />
                        <h4 className="font-bold text-gray-900 text-xs">プロフィール写真</h4>
                      </div>
                      <p className="text-xs text-gray-500 mb-4 h-8 leading-relaxed">
                        あなたを代表するプロフィール写真を追加してください
                      </p>
                      <button 
                        onClick={() => toggleProfileStep(1)}
                        className={`w-full font-bold py-2 rounded text-xs ${completedProfileSteps.includes(1) ? 'bg-gray-100 text-gray-500' : 'bg-black text-white'}`}
                      >
                        {completedProfileSteps.includes(1) ? '完了' : '写真を追加'}
                      </button>
                    </div>

                    {/* Card 2 */}
                    <div className="min-w-[200px] bg-white border border-gray-200 rounded-lg p-3.5 snap-start">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-gray-700" />
                        <h4 className="font-bold text-gray-900 text-xs">自己紹介</h4>
                      </div>
                      <p className="text-xs text-gray-500 mb-4 h-8 leading-relaxed">
                        あなたを紹介する簡単な説明を入力してください
                      </p>
                      <button 
                        onClick={() => setIsIntroEditOpen(true)}
                        className={`w-full font-bold py-2 rounded text-xs ${completedProfileSteps.includes(2) ? 'bg-gray-100 text-gray-500' : 'bg-black text-white'}`}
                      >
                        {completedProfileSteps.includes(2) ? '完了' : '紹介を入力'}
                      </button>
                    </div>

                    {/* Card 3 */}
                    <div className="min-w-[200px] bg-white border border-gray-200 rounded-lg p-3.5 snap-start">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="w-4 h-4 text-gray-700" />
                        <h4 className="font-bold text-gray-900 text-xs">経歴情報</h4>
                      </div>
                      <p className="text-xs text-gray-500 mb-4 h-8 leading-relaxed">
                        代表的な経歴を入力してください
                      </p>
                      <button 
                        onClick={() => setIsCareerListOpen(true)}
                        className={`w-full font-bold py-2 rounded text-xs ${completedProfileSteps.includes(3) ? 'bg-gray-100 text-gray-500' : 'bg-black text-white'}`}
                      >
                        {completedProfileSteps.includes(3) ? '完了' : '経歴を入力'}
                      </button>
                    </div>

                    {/* Card 4 */}
                    <div className="min-w-[200px] bg-white border border-gray-200 rounded-lg p-3.5 snap-start">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-gray-700" />
                        <h4 className="font-bold text-gray-900 text-xs">総経歴年数</h4>
                      </div>
                      <p className="text-xs text-gray-500 mb-4 h-8 leading-relaxed">
                        総経歴年数を教えてください
                      </p>
                      <button 
                        onClick={() => toggleProfileStep(4)}
                        className={`w-full font-bold py-2 rounded text-xs ${completedProfileSteps.includes(4) ? 'bg-gray-100 text-gray-500' : 'bg-black text-white'}`}
                      >
                        {completedProfileSteps.includes(4) ? '完了' : '経歴年数を入力'}
                      </button>
                    </div>

                    {/* Card 5 */}
                    <div className="min-w-[200px] bg-white border border-gray-200 rounded-lg p-3.5 snap-start">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart2 className="w-4 h-4 text-gray-700" />
                        <h4 className="font-bold text-gray-900 text-xs">スキル</h4>
                      </div>
                      <p className="text-xs text-gray-500 mb-4 h-8 leading-relaxed">
                        職務スキルを教えてください
                      </p>
                      <button 
                        onClick={() => toggleProfileStep(5)}
                        className={`w-full font-bold py-2 rounded text-xs ${completedProfileSteps.includes(5) ? 'bg-gray-100 text-gray-500' : 'bg-black text-white'}`}
                      >
                        {completedProfileSteps.includes(5) ? '完了' : 'スキルを追加'}
                      </button>
                    </div>

                    {/* Card 6 */}
                    <div className="min-w-[200px] bg-white border border-gray-200 rounded-lg p-3.5 snap-start">
                      <div className="flex items-center gap-2 mb-2">
                        <GraduationCap className="w-4 h-4 text-gray-700" />
                        <h4 className="font-bold text-gray-900 text-xs">学歴</h4>
                      </div>
                      <p className="text-xs text-gray-500 mb-4 h-8 leading-relaxed">
                        最終学歴を教えてください
                      </p>
                      <button 
                        onClick={() => setIsEducationEditOpen(true)}
                        className={`w-full font-bold py-2 rounded text-xs ${completedProfileSteps.includes(6) ? 'bg-gray-100 text-gray-500' : 'bg-black text-white'}`}
                      >
                        {completedProfileSteps.includes(6) ? '完了' : '学歴を入力'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white border border-gray-100 rounded-xl p-4 mb-8 shadow-sm flex justify-between items-center">
                  <button className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-10 h-10 rounded-full bg-[#3870EA] flex items-center justify-center border border-[#3870EA]">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">人脈</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-10 h-10 rounded-full bg-[#3870EA] flex items-center justify-center border border-[#3870EA]">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">受信した提案</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-10 h-10 rounded-full bg-[#3870EA] flex items-center justify-center border border-[#3870EA]">
                      <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">P</div>
                    </div>
                    <span className="text-xs font-medium text-gray-700">ポイント</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-10 h-10 rounded-full bg-[#3870EA] flex items-center justify-center border border-[#3870EA]">
                      <div className="w-5 h-5 border-2 border-white rounded-sm relative">
                        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white -translate-x-1/2"></div>
                        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-white -translate-y-1/2"></div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-700">ギフト</span>
                  </button>
                </div>

                {/* Tips Section */}
                <div>
                  <h3 className="font-bold text-base text-gray-900 mb-4">新規会員のためのTIP</h3>
                  
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <span className="inline-block px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded mb-2">発信者表示</span>
                      <p className="font-bold text-gray-900 text-xs leading-relaxed">
                        名刺を連絡先に保存する必要はありません。電話がかかってくるとRememberがお知らせします。
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-4">
                      <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-500 text-[10px] font-bold rounded mb-2">スカウト提案</span>
                      <p className="font-bold text-gray-900 text-xs leading-relaxed">
                        良いスカウト提案をたくさん受けるには、このようにプロフィールを作成してみてください。
                      </p>
                    </div>

                    <div 
                      className="bg-gray-50 rounded-xl p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={handleOpenMyMeishiCamera}
                    >
                      <span className="inline-block px-2 py-0.5 bg-yellow-50 text-yellow-600 text-[10px] font-bold rounded mb-2">自分の名刺登録</span>
                      <p className="font-bold text-gray-900 text-xs leading-relaxed">
                        自分の名刺を登録すると良い2つの利点をお知...
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Action Button */}
                <button 
                  onClick={handleOpenMeishiCamera}
                  className="fixed bottom-20 right-4 bg-[#0A0A0A] hover:bg-black text-white px-5 py-3 rounded-full font-bold shadow-lg flex items-center gap-1 z-30"
                >
                <Plus className="w-5 h-5" />
                名刺登録
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
        </div>

        {/* Desktop Right Sidebar (Remember Web Style) */}
        <aside className="hidden lg:block w-80 shrink-0 space-y-4 sticky top-22">
          {/* Real-time Trending Posts Widget (リアルタイム人気記事 Top 5) */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <h3 className="font-bold text-sm text-gray-900">リアルタイム人気記事 Top 5</h3>
              </div>
              <span className="text-[10px] text-gray-400">Remember Live</span>
            </div>

            <div className="space-y-3">
              {[
                { rank: 1, title: 'LINEヤフー vs メルカリ 年収交渉・転職ノウハウ', comments: 42, board: 'IT・企画' },
                { rank: 2, title: '2026 B2B営業 名刺スキャンAI自動化の導入事例', comments: 28, board: '営業・マーケ' },
                { rank: 3, title: 'スタートアップ C-Level 交流会＆ネットワーキング', comments: 19, board: 'CEO・経営' },
                { rank: 4, title: 'Remember 名刺連携機能による顧客管理のコツ', comments: 34, board: 'Q&A' },
                { rank: 5, title: '有給休暇の活用と海外出張ビジネスマナー', comments: 15, board: 'フリートーク' },
              ].map((item) => (
                <div 
                  key={item.rank}
                  onClick={() => setActiveTab('community')}
                  className="flex items-start gap-2.5 cursor-pointer group p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className={`font-black text-xs w-4 text-center ${item.rank <= 3 ? 'text-[#C9483B]' : 'text-gray-400'}`}>
                    {item.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 group-hover:text-[#0A0A0A] transition-colors line-clamp-1">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                      <span>{item.board}</span>
                      <span>・</span>
                      <span className="flex items-center gap-0.5 text-[#0A0A0A] font-medium">
                        <MessageSquare className="w-2.5 h-2.5" />
                        {item.comments}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Professional Connections */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
            <h3 className="font-bold text-sm text-gray-900 mb-3">おすすめビジネスネットワーク</h3>
            <div className="space-y-3">
              {[
                { name: '山田 太郎', company: 'LINEヤフー株式会社', role: 'プロダクトマネージャー' },
                { name: '佐藤 健太', company: 'CyberAgent Inc.', role: 'マーケティングリード' },
                { name: '鈴木 花子', company: 'Rakuten Group', role: 'B2B Business Dev' },
              ].map((prof, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-700">
                      {prof.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{prof.name}</p>
                      <p className="text-[10px] text-gray-500 truncate max-w-[130px]">{prof.company}</p>
                    </div>
                  </div>
                  <button className="px-2.5 py-1 bg-gray-100 text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-colors rounded-md text-[11px] font-bold">
                    + Connect
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* App & Digital Business Card QR Widget */}
          <div className="bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#2B2B2B] text-white rounded-xl p-4 shadow-xs flex items-center gap-4">
            <div className="bg-white p-2 rounded-lg shrink-0">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(window.location.origin + '?c=billionaire_demo')}`} 
                alt="Mobile App QR"
                className="w-16 h-16"
              />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-amber-300">スマホ名刺スキャン Sync</p>
              <p className="text-[11px] text-blue-100 mt-1 leading-snug">
                QRコードをスキャンして、モバイルアプリとデジタル名刺をすぐに確認できます。
              </p>
            </div>
          </div>

          {/* Desktop Footer */}
          <div className="text-[11px] text-gray-400 space-y-1.5 px-2">
            <div className="flex flex-wrap gap-2 text-gray-500 font-medium">
              <a href="#" className="hover:underline">利用規約</a>
              <span>・</span>
              <a href="#" className="hover:underline font-bold text-gray-700">プライバシーポリシー</a>
              <span>・</span>
              <a href="#" className="hover:underline">ヘルプセンター</a>
              <span>・</span>
              <a href="#" className="hover:underline">会社概要</a>
            </div>
            <p>© 2026 Billionaire Inc. All rights reserved.</p>
          </div>
        </aside>
      </div>

      {/* Bottom Navigation (Mobile Only) */}
      {!isEditMode ? (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 flex justify-around items-center py-2 px-2 z-20 pb-safe lg:hidden">
          <button 
            onClick={() => setActiveTab('today')}
            className={`flex flex-col items-center gap-1 flex-1 py-1 ${activeTab === 'today' ? 'text-gray-900' : 'text-gray-400'}`}
          >
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-medium">トゥデイ</span>
          </button>
          <button 
            onClick={() => setActiveTab('meishi')}
            className={`flex flex-col items-center gap-1 flex-1 py-1 ${activeTab === 'meishi' ? 'text-gray-900' : 'text-gray-400'}`}
          >
            <Contact className="w-6 h-6" />
            <span className="text-[10px] font-medium">名刺帳</span>
          </button>
          <button 
            onClick={() => setActiveTab('connect')}
            className={`flex flex-col items-center gap-1 flex-1 py-1 ${activeTab === 'connect' ? 'text-gray-900' : 'text-gray-400'}`}
          >
            <FileText className="w-6 h-6" />
            <span className="text-[10px] font-medium">コネクト</span>
          </button>
          <button 
            onClick={() => setActiveTab('jobs')}
            className={`flex flex-col items-center gap-1 flex-1 py-1 ${activeTab === 'jobs' ? 'text-gray-900' : 'text-gray-400'}`}
          >
            <Briefcase className="w-6 h-6" />
            <span className="text-[10px] font-medium">採用公告</span>
          </button>
          <button 
            onClick={() => setActiveTab('community')}
            className={`flex flex-col items-center gap-1 flex-1 py-1 ${activeTab === 'community' ? 'text-gray-900' : 'text-gray-400'}`}
          >
            <Share2 className="w-6 h-6" />
            <span className="text-[10px] font-medium">コミュニティ</span>
          </button>
        </nav>
      ) : (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-gray-900 text-white flex justify-around items-center py-2 px-2 z-20 pb-safe lg:hidden">
          <button className="flex flex-col items-center gap-1 flex-1 py-1 text-gray-300 hover:text-white transition-colors">
            <Users className="w-6 h-6" />
            <span className="text-[10px] font-medium">グループ</span>
          </button>
          <button className="flex flex-col items-center gap-1 flex-1 py-1 text-gray-300 hover:text-white transition-colors">
            <Mail className="w-6 h-6" />
            <span className="text-[10px] font-medium">メール</span>
          </button>
          <button className="flex flex-col items-center gap-1 flex-1 py-1 text-gray-300 hover:text-white transition-colors">
            <MessageSquare className="w-6 h-6" />
            <span className="text-[10px] font-medium">メッセージ</span>
          </button>
          <button 
            onClick={() => setIsMoreMenuOpen(true)}
            className="flex flex-col items-center gap-1 flex-1 py-1 text-gray-300 hover:text-white transition-colors"
          >
            <MoreHorizontal className="w-6 h-6" />
            <span className="text-[10px] font-medium">その他</span>
          </button>
        </nav>
      )}

      {/* My Profile Overlay */}
      <AnimatePresence>
        {isProfileOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-50 overflow-y-auto no-scrollbar max-w-md mx-auto"
          >
            {/* Profile Page Content */}
            <div className="flex items-center justify-between p-4 sticky top-0 bg-white z-10 border-b border-gray-50">
              <div className="flex items-center gap-4">
                <button onClick={() => setIsProfileOpen(false)} className="p-1 -ml-1 hover:bg-gray-100 rounded-full transition-colors">
                  <ArrowLeft className="w-6 h-6 text-gray-900" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">{user?.displayName || 'ユーザー'}</h1>
              </div>
              <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                <UserCog className="w-6 h-6 text-gray-900" />
              </button>
            </div>

            <div className="px-4 pb-8">
              {/* Dark Card */}
              <div className="bg-gradient-to-br from-[#1a1a1a] to-[#333333] rounded-2xl p-6 text-white relative overflow-hidden mb-6 shadow-xl border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold tracking-tight">{user?.displayName || 'ユーザー名'}</h2>
                  <Edit2 className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white transition-colors" />
                </div>
                <button 
                  onClick={() => setIsIntroEditOpen(true)}
                  className="text-gray-400 text-sm flex items-center gap-1 mb-4 hover:text-white transition-colors group"
                >
                  コネクトひとこと紹介を追加 <Plus className="w-3 h-3 group-hover:scale-110 transition-transform" />
                </button>

                {myMeishi && (
                  <div className="mb-6 space-y-0.5">
                    <p className="text-lg font-bold text-white">{myMeishi.company}</p>
                    <p className="text-sm text-gray-300">{myMeishi.position}</p>
                    <p className="text-sm text-gray-400">{myMeishi.department}</p>
                  </div>
                )}

                <div className="text-sm text-gray-400 font-medium">
                  フォロワー <span className="font-bold text-white">128</span> <span className="mx-2 text-gray-600">|</span> フォロー中 <span className="font-bold text-white">129</span>
                </div>
                
                {/* Profile Avatar */}
                <div className="absolute bottom-6 right-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-[#e5e5e5] rounded-full border-4 border-[#1a1a1a] flex items-center justify-center overflow-hidden shadow-inner">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                    <button className="absolute bottom-0 right-0 w-7 h-7 bg-[#262626] rounded-full flex items-center justify-center border-2 border-[#1a1a1a] shadow-lg hover:bg-[#333333] transition-colors">
                      <Camera className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex justify-between bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100 shadow-sm">
                {[
                  { label: '届いた提案', value: '0' },
                  { label: '新着メッセージ', value: '0' },
                  { label: '応募状況', value: '0' },
                  { label: '週間閲覧数', value: '0' },
                ].map((stat, idx) => (
                  <div key={idx} className="flex flex-col items-center flex-1 border-r last:border-r-0 border-gray-200 px-1">
                    <span className="font-bold text-lg text-gray-900 leading-none">{stat.value}</span>
                    <span className="text-[10px] text-gray-500 mt-2 font-medium">{stat.label}</span>
                  </div>
                ))}
              </div>

              {/* Notification Banner */}
              <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center relative">
                    <Mail className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{user?.displayName || 'ユーザー'}様、</p>
                    <p className="text-sm font-bold text-gray-900">新しい提案が届きました！</p>
                  </div>
                </div>
                <button className="bg-black text-white text-xs font-bold px-4 py-2 rounded relative">
                  確認する
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">1</span>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar">
                {['マイ名刺', 'プロフィール', '履歴書管理', 'お知らせ', '投稿'].map((tab, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setProfileTab(idx)}
                    className={`px-4 py-3 text-[12px] font-bold whitespace-nowrap transition-colors ${profileTab === idx ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {profileTab === 0 ? (
                /* My Business Card Tab */
                <div className="space-y-6">
                  {/* Business Card Registration Box */}
                  {!myMeishi ? (
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-2xl p-12 flex flex-col items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors group"
                      onClick={handleOpenMyMeishiCamera}
                    >
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6 text-gray-900" />
                      </div>
                      <p className="text-sm text-gray-500 font-medium text-center">
                        在職中の会社の名刺を登録してください
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] text-gray-400">
                          名刺 最終アップデート {new Date(myMeishi.updatedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.')}
                        </span>
                        <button 
                          onClick={handleOpenMyMeishiCamera}
                          className="text-xs font-bold text-gray-900 underline underline-offset-4"
                        >
                          名刺 交換
                        </button>
                      </div>

                      <div className="aspect-[1.6/1] w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white mb-6 p-1">
                        <div className="w-full h-full rounded-lg overflow-hidden">
                          <img src={myMeishi.imageUrl} alt="Business Card" className="w-full h-full object-contain" />
                        </div>
                      </div>

                      <button className="w-full bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform mb-10">
                        <Share2 className="w-4 h-4" />
                        <span>マイ名刺を共有する</span>
                      </button>

                      {/* 名刺情報 (Business Card Information) */}
                      <div className="pt-8 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-lg font-bold text-gray-900">名刺情報</h3>
                          <button className="text-sm text-gray-400 font-medium">編集</button>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-start">
                            <span className="w-24 text-gray-500 text-sm">会社</span>
                            <span className="flex-1 text-gray-900 text-sm font-medium">{myMeishi.company}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="w-24 text-gray-500 text-sm">部署</span>
                            <span className="flex-1 text-gray-900 text-sm font-medium">{myMeishi.department || '-'}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="w-24 text-gray-500 text-sm">役職</span>
                            <span className="flex-1 text-gray-900 text-sm font-medium">{myMeishi.position}</span>
                          </div>
                        </div>
                      </div>

                      {/* 連絡先 (Contact Information) */}
                      <div className="mt-10 pt-8 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-lg font-bold text-gray-900">連絡先</h3>
                          <button className="text-sm text-gray-400 font-medium">編集</button>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-start">
                            <span className="w-24 text-gray-500 text-sm">携帯電話</span>
                            <span className="flex-1 text-gray-900 text-sm font-medium">{myMeishi.mobile || '-'}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="w-24 text-gray-500 text-sm">電話番号</span>
                            <span className="flex-1 text-gray-900 text-sm font-medium">{myMeishi.phone || '-'}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="w-24 text-gray-500 text-sm">メールアドレス</span>
                            <span className="flex-1 text-gray-900 text-sm font-medium">{myMeishi.email}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="w-24 text-gray-500 text-sm">FAX</span>
                            <span className="flex-1 text-gray-900 text-sm font-medium">{myMeishi.fax || '-'}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="w-24 text-gray-500 text-sm">住所</span>
                            <span className="flex-1 text-gray-900 text-sm font-medium leading-relaxed">
                              {myMeishi.address} {myMeishi.detailedAddress}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Map Placeholder */}
                      <div className="mt-8 rounded-xl overflow-hidden h-48 bg-gray-100 relative">
                        <img 
                          src="https://picsum.photos/seed/map/600/400" 
                          alt="Map" 
                          className="w-full h-full object-cover opacity-60"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-200 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#0A0A0A]" />
                            <span className="text-xs font-bold text-gray-900">地図を見る</span>
                          </div>
                        </div>
                      </div>

                      {/* Business Card History */}
                      <div className="mt-10 pt-8 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-8">
                          <h3 className="text-[18px] font-bold text-gray-900">名刺ヒストリー</h3>
                          <button className="text-sm text-gray-500">編集</button>
                        </div>
                        {myMeishi.history && myMeishi.history.length > 0 ? (
                          <div className="relative space-y-12 pl-4">
                            {/* Timeline Line */}
                            <div className="absolute left-[6px] top-2 bottom-2 w-[1px] bg-gray-200"></div>
                            
                            {myMeishi.history.map((h, idx) => (
                              <div key={idx} className="relative flex items-start justify-between gap-4">
                                {/* Timeline Dot */}
                                <div className="absolute -left-[14px] top-1.5 w-3.5 h-3.5 rounded-full bg-gray-300 border-2 border-white z-10"></div>
                                
                                <div className="flex-1">
                                  <p className="text-sm font-bold text-gray-900 mb-1">{h.company}</p>
                                  <p className="text-sm text-gray-800 mb-1">{h.position}</p>
                                  <p className="text-sm text-gray-400">{h.updatedAt ? new Date(h.updatedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '年 ').replace(/\//g, '月 ') + '日' : '2025年 09月 02日'}</p>
                                </div>
                                
                                <div className="w-24 h-16 rounded border border-gray-200 overflow-hidden flex-shrink-0">
                                  <img 
                                    src={h.imageUrl || "https://picsum.photos/seed/card/200/120"} 
                                    alt="Card Preview" 
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="relative pl-4">
                            <div className="absolute left-[6px] top-2 bottom-2 w-[1px] bg-gray-200"></div>
                            <div className="relative flex items-start gap-4">
                              <div className="absolute -left-[14px] top-1.5 w-3.5 h-3.5 rounded-full bg-gray-300 border-2 border-white z-10"></div>
                              <p className="text-sm text-gray-400">履歴がありません</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Birthday */}
                      <div className="mt-10 pt-8 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-8">
                          <h3 className="text-[18px] font-bold text-gray-900">誕生日</h3>
                          <button className="text-sm text-gray-500">編集</button>
                        </div>
                        <div className="flex items-center gap-3 pl-1">
                          <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
                          <span className="text-sm text-gray-900">
                            {userProfile?.birthday || '10月 20日'} (陽暦)
                          </span>
                        </div>
                      </div>

                      {/* Delete My Card */}
                      <div className="mt-10 pt-8 border-t border-gray-100 pb-10">
                        <button 
                          onClick={() => setIsMyMeishiDeleteDialogOpen(true)}
                          className="w-full py-4 rounded-xl border border-red-100 text-red-500 font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                          <span>自分の名刺を削除</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : profileTab === 1 ? (
                /* Profile Tab (Existing Content) */
                <div className="space-y-10">
                  {/* Profile Completion Section */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-gray-900">プロフィールを完成させる</h3>
                      <span className="text-xs text-gray-400">残り{6 - completedProfileSteps.length}個</span>
                    </div>
                    <div className="flex gap-1 mb-6">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full ${i <= completedProfileSteps.length ? 'bg-black' : 'bg-gray-100'}`}></div>
                      ))}
                    </div>

                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x no-scrollbar">
                  {/* Card 1 */}
                  <div className="min-w-[160px] flex-1 bg-gray-50 rounded-xl p-4 flex flex-col items-center text-center snap-start">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm">
                      <User className="w-6 h-6 text-gray-900" />
                    </div>
                    <h4 className="font-bold text-sm mb-2 text-gray-900">プロフィール写真</h4>
                    <p className="text-[10px] text-gray-500 mb-4 leading-relaxed flex-1">
                      会員様を代表するプロフィール写真を追加してください
                    </p>
                    <button 
                      onClick={() => toggleProfileStep(1)}
                      className={`w-full border text-xs font-bold py-2 rounded ${completedProfileSteps.includes(1) ? 'bg-gray-200 border-gray-200 text-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
                    >
                      {completedProfileSteps.includes(1) ? '完了' : '写真追加'}
                    </button>
                  </div>
                  {/* Card 2 */}
                  <div className="min-w-[160px] flex-1 bg-gray-50 rounded-xl p-4 flex flex-col items-center text-center snap-start">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm">
                      <Edit2 className="w-6 h-6 text-gray-900" />
                    </div>
                    <h4 className="font-bold text-sm mb-2 text-gray-900">自己紹介</h4>
                    <p className="text-[10px] text-gray-500 mb-4 leading-relaxed flex-1">
                      会員様を紹介する簡単な説明を入力してください
                    </p>
                    <button 
                      onClick={() => setIsIntroEditOpen(true)}
                      className={`w-full border text-xs font-bold py-2 rounded ${completedProfileSteps.includes(2) ? 'bg-gray-200 border-gray-200 text-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
                    >
                      {completedProfileSteps.includes(2) ? '完了' : '紹介入力'}
                    </button>
                  </div>
                  {/* Card 3 */}
                  <div className="min-w-[160px] flex-1 bg-gray-50 rounded-xl p-4 flex flex-col items-center text-center snap-start">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm">
                      <Briefcase className="w-6 h-6 text-gray-900" />
                    </div>
                    <h4 className="font-bold text-sm mb-2 text-gray-900">経歴情報</h4>
                    <p className="text-[10px] text-gray-500 mb-4 leading-relaxed flex-1">
                      代表的な経歴を入力してください
                    </p>
                    <button 
                      onClick={() => setIsCareerListOpen(true)}
                      className={`w-full border text-xs font-bold py-2 rounded ${completedProfileSteps.includes(3) ? 'bg-gray-200 border-gray-200 text-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
                    >
                      {completedProfileSteps.includes(3) ? '完了' : '経歴入力'}
                    </button>
                  </div>
                  {/* Card 4 */}
                  <div className="min-w-[160px] flex-1 bg-gray-50 rounded-xl p-4 flex flex-col items-center text-center snap-start">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm">
                      <Clock className="w-6 h-6 text-gray-900" />
                    </div>
                    <h4 className="font-bold text-sm mb-2 text-gray-900">総経歴年数</h4>
                    <p className="text-[10px] text-gray-500 mb-4 leading-relaxed flex-1">
                      総経歴年数を教えてください
                    </p>
                    <button 
                      onClick={() => toggleProfileStep(4)}
                      className={`w-full border text-xs font-bold py-2 rounded ${completedProfileSteps.includes(4) ? 'bg-gray-200 border-gray-200 text-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
                    >
                      {completedProfileSteps.includes(4) ? '完了' : '年数入力'}
                    </button>
                  </div>
                  {/* Card 5 */}
                  <div className="min-w-[160px] flex-1 bg-gray-50 rounded-xl p-4 flex flex-col items-center text-center snap-start">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm">
                      <BarChart2 className="w-6 h-6 text-gray-900" />
                    </div>
                    <h4 className="font-bold text-sm mb-2 text-gray-900">スキル</h4>
                    <p className="text-[10px] text-gray-500 mb-4 leading-relaxed flex-1">
                      職務スキルを教えてください
                    </p>
                    <button 
                      onClick={() => toggleProfileStep(5)}
                      className={`w-full border text-xs font-bold py-2 rounded ${completedProfileSteps.includes(5) ? 'bg-gray-200 border-gray-200 text-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
                    >
                      {completedProfileSteps.includes(5) ? '完了' : 'スキル追加'}
                    </button>
                  </div>
                  {/* Card 6 */}
                  <div className="min-w-[160px] flex-1 bg-gray-50 rounded-xl p-4 flex flex-col items-center text-center snap-start">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm">
                      <GraduationCap className="w-6 h-6 text-gray-900" />
                    </div>
                    <h4 className="font-bold text-sm mb-2 text-gray-900">学歴</h4>
                    <p className="text-[10px] text-gray-500 mb-4 leading-relaxed flex-1">
                      最終学歴を教えてください
                    </p>
                    <button 
                      onClick={() => setIsEducationEditOpen(true)}
                      className={`w-full border text-xs font-bold py-2 rounded ${completedProfileSteps.includes(6) ? 'bg-gray-200 border-gray-200 text-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
                    >
                      {completedProfileSteps.includes(6) ? '完了' : '学歴入力'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Dashed Sections */}
              <div className="space-y-6">
                {[
                  { title: '紹介', action: '+ 紹介追加', onClick: () => setIsIntroEditOpen(true) },
                  { title: '経歴', action: '+ 経歴追加', onClick: () => setIsCareerListOpen(true) },
                  { title: '学歴', action: '+ 学歴追加', onClick: () => setIsEducationEditOpen(true) },
                  { title: '職務', action: '+ 職務追加', onClick: () => {
                    setSelectedJobs(userProfile?.jobs || []);
                    setIsJobEditOpen(true);
                  } },
                  { title: '専門分野・スキル', action: '+ 専門分野・スキル追加', onClick: () => {
                    setSelectedSkills(userProfile?.skills || []);
                    setIsSkillEditOpen(true);
                  } },
                  { title: '外国語', action: '+ 外国語追加', onClick: () => {
                    setSelectedLanguage("");
                    setSelectedLevel("");
                    setEditingLanguageId(null);
                    setIsLanguageEditOpen(true);
                  } },
                  { title: 'ウェブサイト・ブログ', action: '+ ウェブサイト・ブログ追加', onClick: () => {
                    setWebsiteUrls(userProfile?.websites?.length ? userProfile.websites : [""]);
                    setIsWebsiteEditOpen(true);
                  } },
                  { title: '講義・諮問活動', action: '+ 講義・諮問活動追加', onClick: () => {
                    setLectureTitle("");
                    setLectureDate("");
                    setIsLectureEditOpen(true);
                  } },
                  { title: '論文・著書', action: '+ 論文・著書追加', onClick: () => {
                    setPublicationTitle("");
                    setPublicationDate("");
                    setIsPublicationEditOpen(true);
                  } },
                  { title: '記事', action: '+ 記事追加', onClick: () => {
                    setArticleTitle("");
                    setArticleUrl("");
                    setIsArticleEditOpen(true);
                  } },
                ].map((section, idx) => {
                  const hasData = 
                    (section.title === '紹介' && !!userProfile?.introduction) ||
                    (section.title === '経歴' && (!!(userProfile?.careers && userProfile.careers.length > 0) || !!userProfile?.totalCareerYears)) ||
                    (section.title === '学歴' && !!(userProfile?.educations && userProfile.educations.length > 0)) ||
                    (section.title === '職務' && !!(userProfile?.jobs && userProfile.jobs.length > 0)) ||
                    (section.title === '専門分野・スキル' && !!(userProfile?.skills && userProfile.skills.length > 0)) ||
                    (section.title === '外国語' && !!(userProfile?.languages && userProfile.languages.length > 0)) ||
                    (section.title === 'ウェブサイト・ブログ' && !!(userProfile?.websites && userProfile.websites.length > 0)) ||
                    (section.title === '講義・諮問活動' && !!(userProfile?.lectures && userProfile.lectures.length > 0)) ||
                    (section.title === '論文・著書' && !!(userProfile?.publications && userProfile.publications.length > 0)) ||
                    (section.title === '記事' && !!(userProfile?.articles && userProfile.articles.length > 0));

                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-900">{section.title}</h3>
                        {hasData && (
                          <button 
                            onClick={section.title === '記事' ? () => setIsArticleListEditOpen(true) : section.onClick}
                            className="text-gray-500 text-sm flex items-center gap-1"
                          >
                            編集 <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {section.title === '紹介' && userProfile?.introduction ? (
                        <div className="bg-gray-50 rounded-lg p-4 relative group">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{userProfile.introduction}</p>
                        </div>
                      ) : section.title === '経歴' && (!!(userProfile?.careers && userProfile.careers.length > 0) || !!userProfile?.totalCareerYears) ? (
                        <div className="space-y-3">
                          {userProfile?.totalCareerYears && (
                            <div className="mb-2">
                              <span className="text-gray-500 text-sm">総経歴年数 </span>
                              <span className="text-blue-500 font-bold">{userProfile.totalCareerYears}年</span>
                            </div>
                          )}
                          {userProfile?.careers && userProfile.careers.map((career) => (
                            <div key={career.id} className="bg-gray-50 rounded-lg p-4 relative group">
                              <h4 className="font-bold text-gray-900">{career.companyName}</h4>
                              {(career.title || career.department) && (
                                <p className="text-sm text-gray-700 mt-1">
                                  {career.department} {career.title}
                                </p>
                              )}
                              <p className="text-sm text-gray-500 mt-1">
                                {career.startDate.replace('-', '.')} ~ {career.isCurrent ? '在職中' : career.endDate?.replace('-', '.')}
                              </p>
                              {career.description && (
                                <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                                  {career.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : section.title === '学歴' && userProfile?.educations && userProfile.educations.length > 0 ? (
                        <div className="space-y-3">
                          {userProfile.educations.map((edu) => (
                            <div key={edu.id} className="bg-gray-50 rounded-lg p-4 relative group">
                              <h4 className="font-bold text-gray-900">{edu.schoolName}</h4>
                              <p className="text-sm text-gray-700 mt-1">
                                {edu.major} {edu.degree ? `(${edu.degree})` : ''}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {edu.startDate ? `${edu.startDate}年` : ''} ~ {edu.isCurrent ? '在学中' : (edu.endDate ? `${edu.endDate}年` : '')}
                              </p>
                              {edu.description && (
                                <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{edu.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : section.title === '職務' && userProfile?.jobs && userProfile.jobs.length > 0 ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {userProfile.jobs.map((job, i) => (
                              <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                                {job}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : section.title === '専門分野・スキル' && userProfile?.skills && userProfile.skills.length > 0 ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {userProfile.skills.map((skill, i) => (
                              <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : section.title === '外国語' && userProfile?.languages && userProfile.languages.length > 0 ? (
                        <div className="space-y-3">
                          {userProfile.languages.map((lang) => (
                            <div key={lang.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white">
                              <div>
                                <div className="font-bold text-gray-900">{lang.language}</div>
                                <div className="text-sm text-gray-500 mt-1">{lang.level}</div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedLanguage(lang.language);
                                    setSelectedLevel(lang.level);
                                    setEditingLanguageId(lang.id);
                                    setIsLanguageEditOpen(true);
                                  }}
                                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteLanguage(lang.id)}
                                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : section.title === 'ウェブサイト・ブログ' && userProfile?.websites && userProfile.websites.length > 0 ? (
                        <div className="space-y-3">
                          {userProfile.websites.map((url, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white">
                              <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate mr-4">
                                {url}
                              </a>
                              <button
                                onClick={() => {
                                  setWebsiteUrls(userProfile.websites || [""]);
                                  setIsWebsiteEditOpen(true);
                                }}
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : section.title === '講義・諮問活動' && userProfile?.lectures && userProfile.lectures.length > 0 ? (
                        <div className="space-y-3">
                          {userProfile.lectures.map((lecture) => (
                            <div key={lecture.id} className="bg-gray-50 rounded-lg p-4 relative group">
                              <h4 className="font-bold text-gray-900">{lecture.title}</h4>
                              <p className="text-sm text-gray-500 mt-1">
                                {lecture.date.replace('-', '年 ')}月
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : section.title === '論文・著書' && userProfile?.publications && userProfile.publications.length > 0 ? (
                        <div className="space-y-3">
                          {userProfile.publications.map((publication) => (
                            <div key={publication.id} className="bg-gray-50 rounded-lg p-4 relative group">
                              <h4 className="font-bold text-gray-900">{publication.title}</h4>
                              <p className="text-sm text-gray-500 mt-1">
                                {publication.date.replace('-', '年 ')}月
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : section.title === '記事' && userProfile?.articles && userProfile.articles.length > 0 ? (
                        <div className="space-y-4">
                          {userProfile.articles.map((article) => (
                            <div key={article.id} className="relative group">
                              <div className="flex items-start">
                                <span className="text-gray-500 mr-2">•</span>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-gray-900">{article.title}</h4>
                                  <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 block truncate">
                                    {article.url}
                                  </a>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <button 
                          onClick={section.onClick}
                          className="w-full border border-dashed border-gray-300 rounded-lg py-4 text-gray-400 text-sm font-medium flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                          {section.action}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

                {/* Personal Info Section */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">人的事項</h3>
                      <p className="text-xs text-gray-400 mt-1">採用担当者にのみ公開</p>
                    </div>
                    <button 
                      onClick={() => {
                        setGender(userProfile?.gender);
                        setBirthYear(userProfile?.birthYear);
                        setIsPersonalInfoEditOpen(true);
                      }}
                      className="text-gray-500 text-sm flex items-center gap-1"
                    >
                      編集 <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-700 space-y-2">
                    {userProfile?.birthYear ? (
                      <p>• {userProfile.birthYear}年</p>
                    ) : (
                      <p className="text-gray-400">• 出生年度未設定</p>
                    )}
                    {userProfile?.gender ? (
                      <p>• {userProfile.gender}</p>
                    ) : (
                      <p className="text-gray-400">• 性別未設定</p>
                    )}
                  </div>
                </div>

                {/* Awards Section */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-gray-900">受賞及びその他の履歴</h3>
                    {userProfile?.awards && userProfile.awards.length > 0 && (
                      <button 
                        onClick={() => {
                          setAwardsList(userProfile.awards && userProfile.awards.length > 0 ? userProfile.awards : [""]);
                          setIsAwardsEditOpen(true);
                        }}
                        className="text-gray-500 text-sm flex items-center gap-1"
                      >
                        編集 <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-3">採用担当者にのみ公開</p>
                  
                  {userProfile?.awards && userProfile.awards.length > 0 ? (
                    <div className="space-y-2">
                      {userProfile.awards.map((award, idx) => (
                        <p key={idx} className="text-sm text-gray-700">• {award}</p>
                      ))}
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        setAwardsList([""]);
                        setIsAwardsEditOpen(true);
                      }}
                      className="w-full border border-dashed border-gray-300 rounded-lg py-4 text-gray-400 text-sm font-medium flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      + 受賞及びその他の履歴追加
                    </button>
                  )}
                </div>

                {/* Certificates Section */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-gray-900">資格証</h3>
                    {userProfile?.certificates && userProfile.certificates.length > 0 && (
                      <button 
                        onClick={() => {
                          setCertificatesList(userProfile.certificates && userProfile.certificates.length > 0 ? userProfile.certificates : [""]);
                          setIsCertificatesEditOpen(true);
                        }}
                        className="text-gray-500 text-sm flex items-center gap-1"
                      >
                        編集 <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-3">採用担当者にのみ公開</p>
                  
                  {userProfile?.certificates && userProfile.certificates.length > 0 ? (
                    <div className="space-y-2">
                      {userProfile.certificates.map((cert, idx) => (
                        <p key={idx} className="text-sm text-gray-700">• {cert}</p>
                      ))}
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        setCertificatesList([""]);
                        setIsCertificatesEditOpen(true);
                      }}
                      className="w-full border border-dashed border-gray-300 rounded-lg py-4 text-gray-400 text-sm font-medium flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      + 資格証追加
                    </button>
                  )}
                </div>

                {/* Preferred Conditions */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-900">希望する提案条件設定</h3>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full border border-gray-400 flex items-center justify-center text-[8px]">i</span>
                        採用担当者とヘッドハンターにのみ公開されます
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {/* Contact Info Section */}
                <section className="pt-8 border-t border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-6 flex items-center justify-between">
                    <span>連絡先</span>
                    {myMeishi && <Edit3 className="w-4 h-4 text-gray-400 cursor-pointer" />}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <span className="w-24 text-sm text-gray-500">携帯電話</span>
                      <span className="text-sm text-gray-900 font-medium">{myMeishi?.mobile || 'なし'}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-24 text-sm text-gray-500">固定電話</span>
                      <span className="text-sm text-gray-900 font-medium">{myMeishi?.phone || 'なし'}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-24 text-sm text-gray-500">メール</span>
                      <span className="text-sm text-gray-900 font-medium">{myMeishi?.email || 'なし'}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-24 text-sm text-gray-500">ファックス</span>
                      <span className="text-sm text-gray-900 font-medium">{myMeishi?.fax || 'なし'}</span>
                    </div>
                  </div>
                </section>

                {/* Birthday Section */}
                <section className="pb-10 pt-8 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900">誕生日</h3>
                    <button className="text-sm text-gray-400 hover:text-gray-600">編集</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                    <span className="text-sm text-gray-900 font-medium">{userProfile?.birthday || '未設定'}</span>
                  </div>
                </section>

                </div>
              ) : (
                /* Other Tabs Placeholder */
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <p className="text-sm">準備中です</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Meishi Delete Confirmation */}
      <AnimatePresence>
        {isMyMeishiDeleteDialogOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[300]"
              onClick={() => setIsMyMeishiDeleteDialogOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: '-50%', x: '-50%' }}
              animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
              exit={{ opacity: 0, scale: 0.95, y: '-50%', x: '-50%' }}
              className="fixed top-1/2 left-1/2 w-[90%] max-w-sm bg-white rounded-2xl z-[310] p-6 text-center shadow-xl"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                自分の名刺を削除しますか？
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                削除した名刺は復元できません。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsMyMeishiDeleteDialogOpen(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={confirmDeleteMyMeishi}
                  className="flex-1 py-3 px-4 bg-[#FF4B4B] text-white rounded-xl font-bold hover:bg-red-600"
                >
                  削除
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Introduction Edit Overlay */}
      <AnimatePresence>
        {isIntroEditOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-gray-50 z-[60] overflow-y-auto no-scrollbar max-w-md mx-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setIsIntroEditOpen(false)}>
                  <ArrowLeft className="w-6 h-6 text-gray-900" />
                </button>
                <h2 className="text-lg font-bold text-gray-900">紹介</h2>
              </div>
              <button 
                onClick={handleSaveIntro}
                className="text-orange-500 font-bold text-sm"
              >
                保存
              </button>
            </div>

            <div className="p-4 bg-white mb-2">
              <h3 className="font-bold text-[12px] text-gray-900 mb-2">プロフィール紹介</h3>
              <p className="text-[12px] text-gray-500 mb-4 leading-relaxed">
                自分の専門性を十分に表現できるように100文字以上の作成を推奨します。
              </p>
              
              <div className="relative">
                <textarea
                  value={introText}
                  onChange={(e) => setIntroText(e.target.value)}
                  placeholder="例）ファッション分野で勤務し、デザインおよびブランドディレクティングの豊富な経歴を持っており、現在はヨーロッパおよびアメリカのファッションブランドを対象にデザイン企画コンサルティングを提供するクリエイティブスタジオを運営しています。&#13;&#10;&#13;&#10;*すべてのユーザーに公開されます。機密情報は記入しないでください。"
                  className="w-full h-64 p-4 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-0 resize-none"
                  maxLength={5000}
                />
                <div className="text-right text-xs text-gray-400 mt-2">
                  {introText.length}/5000文字
                </div>
              </div>
            </div>

            <div className="p-4 bg-white flex items-center justify-between">
              <div className="flex-1 pr-4">
                <h3 className="font-bold text-gray-900 mb-1">求職用紹介作成</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  採用担当者にのみ表示する具体的な数値が含まれた内容を作成するにはオプションをオンにしてください。
                </p>
              </div>
              <button 
                onClick={() => setIsJobSeekingIntro(!isJobSeekingIntro)}
                className={`w-12 h-6 rounded-full transition-colors relative ${isJobSeekingIntro ? 'bg-orange-500' : 'bg-gray-200'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${isJobSeekingIntro ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Career List Overlay */}
      <AnimatePresence>
        {isCareerListOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[60] overflow-y-auto no-scrollbar max-w-md mx-auto"
          >
            {/* Header */}
            <div className="flex items-center p-4 bg-white sticky top-0 z-10">
              <button onClick={() => setIsCareerListOpen(false)} className="mr-3">
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
                    value={totalCareerYears}
                    onChange={(e) => setTotalCareerYears(e.target.value)}
                    onBlur={() => handleSaveTotalCareerYears(totalCareerYears)}
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
                  onClick={() => {
                    setEditingCareerId(null);
                    setCareerCompany('');
                    setCareerIsCurrent(false);
                    setCareerStartDate('');
                    setCareerEndDate('');
                    setCareerTitle('');
                    setCareerDepartment('');
                    setCareerDescription('');
                    setCareerLocationRegion('');
                    setCareerLocationCountry('');
                    setIsCareerEditOpen(true);
                  }}
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
              {userProfile?.careers && userProfile.careers.length > 0 && (
                <div className="p-4 bg-white pt-0">
                  <div className="space-y-6">
                    {userProfile.careers.map((career) => (
                      <div 
                        key={career.id} 
                        onClick={() => {
                          setEditingCareerId(career.id);
                          setCareerCompany(career.companyName);
                          setCareerIsCurrent(career.isCurrent);
                          setCareerStartDate(career.startDate);
                          setCareerEndDate(career.endDate || '');
                          setCareerTitle(career.title || '');
                          setCareerDepartment(career.department || '');
                          setCareerDescription(career.description || '');
                          const loc = career.location || '';
                          if (PREFECTURES.includes(loc)) {
                            setCareerLocationRegion(loc);
                            setCareerLocationCountry('');
                          } else if (loc) {
                            setCareerLocationRegion('海外');
                            setCareerLocationCountry(loc);
                          } else {
                            setCareerLocationRegion('');
                            setCareerLocationCountry('');
                          }
                          setIsCareerEditOpen(true);
                        }}
                        className="flex flex-col cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-gray-900 text-lg mb-1">{career.companyName}</h4>
                          <ChevronRight className="w-5 h-5 text-gray-900 flex-shrink-0" />
                        </div>
                        <p className="text-sm text-gray-400 mb-3">
                          {career.startDate.replace('-', '.')} ~ {career.isCurrent ? '現在' : career.endDate?.replace('-', '.')} ({calculateDuration(career.startDate, career.endDate, career.isCurrent)})
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
        {isCareerEditOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[60] overflow-y-auto no-scrollbar max-w-md mx-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setIsCareerEditOpen(false)}>
                  <ArrowLeft className="w-6 h-6 text-gray-900" />
                </button>
                <h2 className="text-lg font-bold text-gray-900">{editingCareerId ? '経歴編集' : '経歴追加'}</h2>
              </div>
              <button 
                onClick={handleSaveCareer}
                disabled={!careerCompany || !careerStartDate || (!careerIsCurrent && !careerEndDate)}
                className={`font-bold text-sm ${(!careerCompany || !careerStartDate || (!careerIsCurrent && !careerEndDate)) ? 'text-gray-300' : 'text-blue-500'}`}
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
                  onClick={() => setIsCompanySearchOpen(true)}
                  className="w-full border border-gray-200 rounded-md h-[45px] px-4 flex justify-between items-center cursor-pointer"
                >
                  <span className={careerCompany ? 'text-gray-900' : 'text-gray-400'}>
                    {careerCompany || '例）LINEヤフー'}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                
                <div className="mt-3 flex items-center gap-2">
                  <button 
                    onClick={() => setCareerIsCurrent(!careerIsCurrent)}
                    className="flex items-center gap-2"
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${careerIsCurrent ? 'border-gray-900 bg-gray-900' : 'border-gray-300'}`}>
                      {careerIsCurrent && <Check className="w-3 h-3 text-white" />}
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
                    onClick={() => {
                      setTempDate(careerStartDate ? { year: parseInt(careerStartDate.split('-')[0]), month: parseInt(careerStartDate.split('-')[1]) } : { year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
                      setIsDatePickerOpen('start');
                    }}
                    className="w-full border border-gray-200 rounded-md h-[45px] px-4 flex justify-between items-center cursor-pointer"
                  >
                    <span className={careerStartDate ? 'text-gray-900' : 'text-gray-400'}>
                      {careerStartDate ? `${careerStartDate.split('-')[0]}年 ${careerStartDate.split('-')[1]}月` : '入社年月'}
                    </span>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </div>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    退社 {!careerIsCurrent && <span className="text-red-500">*</span>}
                  </label>
                  <div 
                    onClick={() => {
                      if (!careerIsCurrent) {
                        setTempDate(careerEndDate ? { year: parseInt(careerEndDate.split('-')[0]), month: parseInt(careerEndDate.split('-')[1]) } : { year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
                        setIsDatePickerOpen('end');
                      }
                    }}
                    className={`w-full border border-gray-200 rounded-md h-[45px] px-4 flex justify-between items-center ${careerIsCurrent ? 'bg-gray-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span className={careerEndDate && !careerIsCurrent ? 'text-gray-900' : 'text-gray-400'}>
                      {careerIsCurrent ? '退社年月' : (careerEndDate ? `${careerEndDate.split('-')[0]}年 ${careerEndDate.split('-')[1]}月` : '退社年月')}
                    </span>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Conditional Fields when Company is selected */}
              {careerCompany && (
                <>
                  {/* Title Field */}
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      役職
                    </label>
                    <input
                      type="text"
                      value={careerTitle}
                      onChange={(e) => setCareerTitle(e.target.value)}
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
                      value={careerDepartment}
                      onChange={(e) => setCareerDepartment(e.target.value)}
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
                        value={careerDescription}
                        onChange={(e) => setCareerDescription(e.target.value)}
                        placeholder="例）プロジェクト管理およびチームリーダーの役割を遂行&#10;・顧客の要件分析および解決策の提案&#10;・データ分析を通じたインサイトの導出"
                        className="w-full border border-gray-200 rounded-md p-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 min-h-[200px] resize-none"
                        maxLength={5000}
                      />
                      <div className="absolute bottom-3 left-4 text-xs text-gray-400">
                        専門性のために50文字以上を推奨します
                      </div>
                      <div className="absolute bottom-3 right-4 text-xs text-gray-400">
                        {careerDescription.length}/5000字
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
                          value={careerLocationRegion}
                          onChange={(e) => {
                            setCareerLocationRegion(e.target.value);
                            if (e.target.value !== '海外') {
                              setCareerLocationCountry('');
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

                      {careerLocationRegion === '海外' && (
                        <div className="relative flex-1">
                          <select
                            value={careerLocationCountry}
                            onChange={(e) => setCareerLocationCountry(e.target.value)}
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
                  {editingCareerId && (
                    <div className="mt-12 mb-8 flex justify-center">
                      <button 
                        onClick={handleDeleteCareer}
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
        {isCompanySearchOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[70] overflow-y-auto no-scrollbar max-w-md mx-auto"
          >
            <div className="p-4 flex items-center gap-3 border-b border-gray-100">
              <div className="flex-1 bg-gray-50 rounded-lg flex items-center px-3 py-2">
                <Search className="w-5 h-5 text-gray-400 mr-2" />
                <input 
                  type="text"
                  value={companySearchQuery}
                  onChange={(e) => setCompanySearchQuery(e.target.value)}
                  placeholder="会社名を入力"
                  className="bg-transparent w-full text-sm focus:outline-none"
                  autoFocus
                />
                {companySearchQuery && (
                  <button onClick={() => setCompanySearchQuery('')}>
                    <X className="w-4 h-4 text-gray-400 bg-gray-200 rounded-full p-0.5" />
                  </button>
                )}
              </div>
              <button 
                onClick={() => {
                  setIsCompanySearchOpen(false);
                  setCompanySearchQuery('');
                }}
                className="text-sm font-medium"
              >
                キャンセル
              </button>
            </div>

            <div className="p-4">
              {companySearchQuery ? (
                <div>
                  {JAPANESE_COMPANIES.filter(c => c.includes(companySearchQuery)).map((company, idx) => (
                    <div 
                      key={idx}
                      onClick={() => {
                        setCareerCompany(company);
                        setIsCompanySearchOpen(false);
                        setCompanySearchQuery('');
                      }}
                      className="py-3 border-b border-gray-100 text-sm cursor-pointer"
                    >
                      {company}
                    </div>
                  ))}
                  <div className="text-center mt-8">
                    <p className="text-sm text-gray-500 mb-2">お探しの会社名がありませんか？</p>
                    <button 
                      onClick={() => {
                        setCareerCompany(companySearchQuery);
                        setIsCompanySearchOpen(false);
                        setCompanySearchQuery('');
                      }}
                      className="text-orange-500 text-sm font-medium underline"
                    >
                      '{companySearchQuery}' を直接入力
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
        {isDatePickerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDatePickerOpen(null)}
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
                  onClick={() => {
                    if (isDatePickerOpen === 'start') setCareerStartDate('');
                    if (isDatePickerOpen === 'end') setCareerEndDate('');
                    setIsDatePickerOpen(null);
                  }}
                  className="text-blue-500 font-medium"
                >
                  削除
                </button>
                <button 
                  onClick={() => {
                    const formattedDate = `${tempDate.year}-${tempDate.month.toString().padStart(2, '0')}`;
                    if (isDatePickerOpen === 'start') setCareerStartDate(formattedDate);
                    if (isDatePickerOpen === 'end') setCareerEndDate(formattedDate);
                    setIsDatePickerOpen(null);
                  }}
                  className="text-blue-500 font-medium"
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
                      onClick={() => setTempDate(prev => ({ ...prev, year }))}
                      className={`h-8 flex items-center justify-center snap-center cursor-pointer ${tempDate.year === year ? 'text-xl font-bold text-gray-900' : 'text-gray-400'}`}
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
                      onClick={() => setTempDate(prev => ({ ...prev, month }))}
                      className={`h-8 flex items-center justify-center snap-center cursor-pointer ${tempDate.month === month ? 'text-xl font-bold text-gray-900' : 'text-gray-400'}`}
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

      {/* Education Edit Overlay */}
      <AnimatePresence>
        {isEducationEditOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[60] overflow-y-auto no-scrollbar max-w-md mx-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setIsEducationEditOpen(false)}>
                  <ArrowLeft className="w-6 h-6 text-gray-900" />
                </button>
                <h2 className="text-lg font-bold text-gray-900">学歴追加</h2>
              </div>
              <button 
                onClick={handleSaveEducation}
                disabled={!eduSchool}
                className={`font-bold text-sm ${!eduSchool ? 'text-gray-300' : 'text-gray-900'}`}
              >
                保存
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* School Field */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  学校 <span className="text-red-500">*</span>
                </label>
                <div 
                  onClick={() => setIsSchoolSearchOpen(true)}
                  className="w-full border border-gray-200 rounded-md h-[45px] px-4 flex justify-between items-center cursor-pointer"
                >
                  <span className={eduSchool ? 'text-gray-900' : 'text-gray-400'}>
                    {eduSchool || '例）東京大学'}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Degree Field */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  学位
                </label>
                <div 
                  onClick={() => setIsDegreeSelectOpen(true)}
                  className="w-full border border-gray-200 rounded-md h-[45px] px-4 flex justify-between items-center cursor-pointer"
                >
                  <span className={eduDegree ? 'text-gray-900' : 'text-gray-400'}>
                    {eduDegree || '学位を選択'}
                  </span>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Major Field */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  専攻
                </label>
                <div 
                  onClick={() => setIsMajorSearchOpen(true)}
                  className="w-full border border-gray-200 rounded-md h-[45px] px-4 flex justify-between items-center cursor-pointer"
                >
                  <span className={eduMajor ? 'text-gray-900' : 'text-gray-400'}>
                    {eduMajor || '例）経営学'}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Date Fields */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    入学
                  </label>
                  <div 
                    onClick={() => {
                      setTempEduYear(eduStartDate ? parseInt(eduStartDate) : new Date().getFullYear());
                      setIsEduYearPickerOpen('start');
                    }}
                    className="w-full border border-gray-200 rounded-md h-[45px] px-4 flex justify-between items-center cursor-pointer"
                  >
                    <span className={eduStartDate ? 'text-gray-900' : 'text-gray-400'}>
                      {eduStartDate ? `${eduStartDate}年` : '入学年度'}
                    </span>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </div>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    卒業
                  </label>
                  <div 
                    onClick={() => {
                      if (!eduIsCurrent) {
                        setTempEduYear(eduEndDate ? parseInt(eduEndDate) : new Date().getFullYear());
                        setIsEduYearPickerOpen('end');
                      }
                    }}
                    className={`w-full border border-gray-200 rounded-md h-[45px] px-4 flex justify-between items-center ${eduIsCurrent ? 'bg-gray-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span className={eduEndDate && !eduIsCurrent ? 'text-gray-900' : 'text-gray-400'}>
                      {eduIsCurrent ? '卒業年度' : (eduEndDate ? `${eduEndDate}年` : '卒業年度')}
                    </span>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Is Current Checkbox */}
              <button 
                onClick={() => setEduIsCurrent(!eduIsCurrent)}
                className="flex items-center gap-2"
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${eduIsCurrent ? 'border-gray-900 bg-gray-900' : 'border-gray-300'}`}>
                  {eduIsCurrent && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm text-gray-900">在学中</span>
              </button>

              {/* Description Field */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  研究分野および論文の説明
                </label>
                <div className="relative">
                  <textarea
                    value={eduDescription}
                    onChange={(e) => setEduDescription(e.target.value.slice(0, 5000))}
                    placeholder="例）スマートフォンセールスにおいてバイラルマーケティングが与える影響の分析(2018)"
                    className="w-full border border-gray-200 rounded-lg p-3 h-40 resize-none focus:outline-none focus:border-gray-400 text-sm"
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                    {eduDescription.length}/5000字
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* School Search Overlay */}
      <AnimatePresence>
        {isSchoolSearchOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[70] overflow-y-auto no-scrollbar max-w-md mx-auto"
          >
            <div className="p-4 flex items-center gap-3 border-b border-gray-100">
              <div className="flex-1 bg-gray-50 rounded-lg flex items-center px-3 py-2">
                <Search className="w-5 h-5 text-gray-400 mr-2" />
                <input 
                  type="text"
                  value={schoolSearchQuery}
                  onChange={(e) => setSchoolSearchQuery(e.target.value)}
                  placeholder="学校名を入力"
                  className="bg-transparent w-full text-sm focus:outline-none"
                  autoFocus
                />
                {schoolSearchQuery && (
                  <button onClick={() => setSchoolSearchQuery('')}>
                    <X className="w-4 h-4 text-gray-400 bg-gray-200 rounded-full p-0.5" />
                  </button>
                )}
              </div>
              <button 
                onClick={() => {
                  setIsSchoolSearchOpen(false);
                  setSchoolSearchQuery('');
                }}
                className="text-sm font-medium"
              >
                キャンセル
              </button>
            </div>

            <div className="p-4">
              {schoolSearchQuery ? (
                <div>
                  {JAPANESE_UNIVERSITIES.filter(c => c.includes(schoolSearchQuery)).map((school, idx) => (
                    <div 
                      key={idx}
                      onClick={() => {
                        setEduSchool(school);
                        setIsSchoolSearchOpen(false);
                        setSchoolSearchQuery('');
                      }}
                      className="py-3 border-b border-gray-100 text-sm cursor-pointer"
                    >
                      {school}
                    </div>
                  ))}
                  <div className="text-center mt-8">
                    <p className="text-sm text-gray-500 mb-2">お探しの学校名がありませんか？</p>
                    <button 
                      onClick={() => {
                        setEduSchool(schoolSearchQuery);
                        setIsSchoolSearchOpen(false);
                        setSchoolSearchQuery('');
                      }}
                      className="text-orange-500 text-sm font-medium underline"
                    >
                      '{schoolSearchQuery}' を直接入力
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-sm text-gray-400 mt-8">
                  最近検索した学校名がありません
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Major Search Overlay */}
      <AnimatePresence>
        {isMajorSearchOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[70] overflow-y-auto no-scrollbar max-w-md mx-auto"
          >
            <div className="p-4 flex items-center gap-3 border-b border-gray-100">
              <div className="flex-1 bg-gray-50 rounded-lg flex items-center px-3 py-2">
                <Search className="w-5 h-5 text-gray-400 mr-2" />
                <input 
                  type="text"
                  value={majorSearchQuery}
                  onChange={(e) => setMajorSearchQuery(e.target.value)}
                  placeholder="専攻を入力"
                  className="bg-transparent w-full text-sm focus:outline-none"
                  autoFocus
                />
                {majorSearchQuery && (
                  <button onClick={() => setMajorSearchQuery('')}>
                    <X className="w-4 h-4 text-gray-400 bg-gray-200 rounded-full p-0.5" />
                  </button>
                )}
              </div>
              <button 
                onClick={() => {
                  setIsMajorSearchOpen(false);
                  setMajorSearchQuery('');
                }}
                className="text-sm font-medium"
              >
                キャンセル
              </button>
            </div>

            <div className="p-4">
              {majorSearchQuery ? (
                <div>
                  {JAPANESE_MAJORS.filter(c => c.includes(majorSearchQuery)).map((major, idx) => (
                    <div 
                      key={idx}
                      onClick={() => {
                        setEduMajor(major);
                        setIsMajorSearchOpen(false);
                        setMajorSearchQuery('');
                      }}
                      className="py-3 border-b border-gray-100 text-sm cursor-pointer"
                    >
                      {major}
                    </div>
                  ))}
                  <div className="text-center mt-8">
                    <p className="text-sm text-gray-500 mb-2">お探しの専攻がありませんか？</p>
                    <button 
                      onClick={() => {
                        setEduMajor(majorSearchQuery);
                        setIsMajorSearchOpen(false);
                        setMajorSearchQuery('');
                      }}
                      className="text-orange-500 text-sm font-medium underline"
                    >
                      '{majorSearchQuery}' を直接入力
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-sm text-gray-400 mt-8">
                  最近検索した専攻がありません
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Degree Select Overlay */}
      <AnimatePresence>
        {isDegreeSelectOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDegreeSelectOpen(false)}
              className="fixed inset-0 bg-black/40 z-[80] max-w-md mx-auto"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white z-[90] rounded-t-2xl max-w-md mx-auto"
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-900">学位を選択</h3>
                <button onClick={() => setIsDegreeSelectOpen(false)}>
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-4 space-y-2">
                {DEGREES.map((degree) => (
                  <button
                    key={degree}
                    onClick={() => {
                      setEduDegree(degree);
                      setIsDegreeSelectOpen(false);
                    }}
                    className="w-full text-left py-3 px-4 rounded-lg hover:bg-gray-50 text-sm text-gray-900"
                  >
                    {degree}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Education Year Picker Overlay */}
      <AnimatePresence>
        {isEduYearPickerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEduYearPickerOpen(null)}
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
                  onClick={() => {
                    if (isEduYearPickerOpen === 'start') setEduStartDate('');
                    if (isEduYearPickerOpen === 'end') setEduEndDate('');
                    setIsEduYearPickerOpen(null);
                  }}
                  className="text-blue-500 font-medium"
                >
                  削除
                </button>
                <button 
                  onClick={() => {
                    const formattedYear = tempEduYear.toString();
                    if (isEduYearPickerOpen === 'start') setEduStartDate(formattedYear);
                    if (isEduYearPickerOpen === 'end') setEduEndDate(formattedYear);
                    setIsEduYearPickerOpen(null);
                  }}
                  className="text-blue-500 font-medium"
                >
                  完了
                </button>
              </div>
              
              <div className="flex justify-center items-center h-48 px-8 relative">
                <div className="w-full h-full overflow-y-auto snap-y snap-mandatory no-scrollbar relative" id="edu-year-scroll">
                  <div className="h-20"></div>
                  {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() + 5 - i).map(year => (
                    <div 
                      key={year} 
                      onClick={() => setTempEduYear(year)}
                      className={`h-8 flex items-center justify-center snap-center cursor-pointer ${tempEduYear === year ? 'text-xl font-bold text-gray-900' : 'text-gray-400'}`}
                    >
                      {year}年
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

      {/* Job Edit Overlay */}
      <AnimatePresence>
        {isJobEditOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-50 flex flex-col"
          >
            <div className="sticky top-0 bg-white z-20">
              <div className="px-4 py-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">職務選択</h2>
                <button onClick={() => setIsJobEditOpen(false)} className="p-1 -mr-1">
                  <X className="w-6 h-6 text-gray-900" />
                </button>
              </div>
              <AnimatePresence>
                {jobSelectionError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 pb-2"
                  >
                    <div className="bg-[#EF5350] text-white text-[15px] font-medium py-3.5 px-4 text-center rounded-lg shadow-sm">
                      職務は最大5つまで登録できます。
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="px-4 pb-4 border-b border-gray-100">
              <div className="bg-gray-50 rounded-lg flex items-center px-3 py-2.5">
                <Search className="w-5 h-5 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="職務を検索してください"
                  value={jobSearchQuery}
                  onChange={(e) => setJobSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none flex-1 text-sm text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pb-40">
              {JOB_CATEGORIES.map(category => {
                const isCategoryMatch = category.category.toLowerCase().includes(jobSearchQuery.toLowerCase());
                const filteredRoles = category.roles.filter(role => role.toLowerCase().includes(jobSearchQuery.toLowerCase()));
                
                if (!isCategoryMatch && filteredRoles.length === 0) return null;
                
                const rolesToShow = isCategoryMatch ? category.roles : filteredRoles;

                return (
                  <div key={category.category} className="border-b border-gray-100">
                    <button
                      onClick={() => setOpenJobCategory(openJobCategory === category.category ? null : category.category)}
                      className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-bold text-gray-900">{category.category}</span>
                      <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${openJobCategory === category.category ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {openJobCategory === category.category && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden bg-gray-50"
                        >
                          <div className="py-2">
                            {rolesToShow.map((role) => {
                              const isSelected = selectedJobs.includes(role);
                              return (
                                <button
                                  key={role}
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedJobs(selectedJobs.filter(j => j !== role));
                                      setJobSelectionError(false);
                                    } else if (selectedJobs.length < 5) {
                                      setSelectedJobs([...selectedJobs, role]);
                                      setJobSelectionError(false);
                                    } else {
                                      setJobSelectionError(true);
                                      setTimeout(() => setJobSelectionError(false), 3000);
                                    }
                                  }}
                                  className={`w-full text-left px-6 py-3 text-sm flex items-center justify-between transition-colors ${isSelected ? 'text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-100'}`}
                                >
                                  {role}
                                  {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
            
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-20 max-w-md mx-auto">
              {selectedJobs.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedJobs.map(job => {
                    const category = JOB_CATEGORIES.find(c => c.roles.includes(job))?.category || '';
                    return (
                      <span key={job} className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-full text-xs border border-gray-100">
                        {category} &gt; {job}
                        <button onClick={() => setSelectedJobs(selectedJobs.filter(j => j !== job))} className="p-0.5 hover:bg-gray-200 rounded-full ml-1">
                          <X className="w-3 h-3 text-gray-400" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedJobs([])}
                  className="flex-1 py-3.5 border border-gray-300 rounded-lg font-bold text-gray-900 bg-white hover:bg-gray-50 transition-colors"
                >
                  選択初期化
                </button>
                <button 
                  onClick={handleSaveJob}
                  className="flex-1 py-3.5 rounded-lg font-bold text-white bg-black hover:bg-gray-900 transition-colors"
                >
                  適用
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skill Edit Overlay */}
      <AnimatePresence>
        {isSkillEditOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-50 flex flex-col"
          >
            <div className="sticky top-0 bg-white z-20">
              <div className="px-4 py-4 flex items-center justify-between relative">
                <div className="w-6" />
                <h2 className="text-lg font-bold text-gray-900">専門分野・スキル選択</h2>
                <button onClick={() => setIsSkillEditOpen(false)} className="p-1 -mr-1">
                  <X className="w-6 h-6 text-gray-900" />
                </button>
              </div>
              
              {/* Selected Skills Chips */}
              {selectedSkills.length > 0 && (
                <div className="px-4 pb-4">
                  <div className="flex flex-wrap gap-2">
                    {selectedSkills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-black text-white rounded-full text-sm font-medium flex items-center gap-1">
                        {skill}
                        <button onClick={() => setSelectedSkills(prev => prev.filter(s => s !== skill))} className="p-0.5 hover:bg-gray-800 rounded-full">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="px-4 pb-4">
                <div className="relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="スキルを検索"
                    value={skillSearchQuery}
                    onChange={(e) => setSkillSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 h-[45px] bg-gray-100 border-transparent rounded-md text-sm focus:bg-white focus:border-black focus:ring-0 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-32">
              <div className="space-y-6">
                {skillSearchQuery ? (
                  // Search Results
                  <div className="space-y-2">
                    {ALL_SKILLS
                      .filter(skill => skill.toLowerCase().includes(skillSearchQuery.toLowerCase()))
                      .map((skill, idx) => {
                        const isSelected = selectedSkills.includes(skill);
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedSkills(prev => prev.filter(s => s !== skill));
                              } else {
                                setSelectedSkills(prev => [...prev, skill]);
                              }
                            }}
                            className={`w-full flex items-center justify-between p-4 rounded-xl border ${
                              isSelected ? 'border-black bg-gray-50' : 'border-gray-200 bg-white'
                            }`}
                          >
                            <span className={`text-sm font-medium ${isSelected ? 'text-black' : 'text-gray-700'}`}>
                              {skill}
                            </span>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-black bg-black' : 'border-gray-300'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                ) : (
                  // Recommended Skills View
                  <div className="space-y-6">
                    {(() => {
                      if (!userProfile?.jobs || userProfile.jobs.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500 text-sm">
                            職務を追加すると、おすすめのスキルが表示されます。
                          </div>
                        );
                      }

                      const allRecommendedSkills = new Set<string>();
                      userProfile.jobs.forEach(job => {
                        const category = JOB_CATEGORIES.find(c => c.roles.includes(job))?.category;
                        if (category && SKILL_RECOMMENDATIONS[category]) {
                          SKILL_RECOMMENDATIONS[category].forEach(skill => allRecommendedSkills.add(skill));
                        }
                      });

                      const uniqueSkills = Array.from(allRecommendedSkills);

                      if (uniqueSkills.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500 text-sm">
                            おすすめのスキルがありません。
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-4">
                          <h3 className="text-base font-bold text-gray-900">専門分野・スキル推薦</h3>
                          <div className="flex flex-wrap gap-2">
                            {uniqueSkills.map((skill, skillIdx) => {
                              const isSelected = selectedSkills.includes(skill);
                              return (
                                <button
                                  key={skillIdx}
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedSkills(prev => prev.filter(s => s !== skill));
                                    } else {
                                      setSelectedSkills(prev => [...prev, skill]);
                                    }
                                  }}
                                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                                    isSelected 
                                      ? 'bg-black text-white border-black' 
                                      : 'bg-white text-gray-600 border-dashed border-gray-300 hover:border-gray-400'
                                  }`}
                                >
                                  {skill}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
              <div className="flex gap-3 max-w-md mx-auto">
                <button 
                  onClick={() => setSelectedSkills([])}
                  className="flex-1 py-3.5 border border-gray-300 rounded-lg font-bold text-gray-900 bg-white hover:bg-gray-50 transition-colors"
                >
                  選択初期化
                </button>
                <button 
                  onClick={handleSaveSkill}
                  className="flex-1 py-3.5 rounded-lg font-bold text-white bg-black hover:bg-gray-900 transition-colors"
                >
                  適用
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Language Edit Overlay */}
      <AnimatePresence>
        {isLanguageEditOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-50 flex flex-col"
          >
            <div className="sticky top-0 bg-white z-20 border-b border-gray-100">
              <div className="px-4 py-4 flex items-center justify-between relative">
                <button 
                  onClick={() => {
                    setIsLanguageEditOpen(false);
                    setSelectedLanguage("");
                    setSelectedLevel("");
                    setEditingLanguageId(null);
                  }} 
                  className="p-1 -ml-1"
                >
                  <ArrowLeft className="w-6 h-6 text-gray-900" />
                </button>
                <h2 className="text-lg font-bold text-gray-900">外国語追加</h2>
                <button 
                  onClick={handleSaveLanguage}
                  disabled={!selectedLanguage || !selectedLevel}
                  className={`font-bold ${!selectedLanguage || !selectedLevel ? 'text-gray-300' : 'text-blue-600'}`}
                >
                  保存
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="space-y-6">
                {/* Language Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-900">
                    言語 <span className="text-red-500">*</span>
                  </label>
                  <button
                    onClick={() => setIsLanguageSelectOpen(true)}
                    className="w-full flex items-center justify-between h-[45px] px-4 border border-gray-200 rounded-md bg-white text-left"
                  >
                    <span className={selectedLanguage ? "text-gray-900" : "text-gray-400"}>
                      {selectedLanguage || "言語を選択してください"}
                    </span>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Level Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-900">
                    レベル <span className="text-red-500">*</span>
                  </label>
                  <button
                    onClick={() => setIsLevelSelectOpen(true)}
                    className="w-full flex items-center justify-between h-[45px] px-4 border border-gray-200 rounded-md bg-white text-left"
                  >
                    <span className={selectedLevel ? "text-gray-900" : "text-gray-400"}>
                      {selectedLevel || "レベルを選択してください"}
                    </span>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Sheets for Selection */}
            <AnimatePresence>
              {isLanguageSelectOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsLanguageSelectOpen(false)}
                    className="fixed inset-0 bg-black/40 z-[60]"
                  />
                  <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-[70] flex flex-col max-h-[80vh]"
                  >
                    <div className="flex items-center justify-end p-4 border-b border-gray-100">
                      <button 
                        onClick={() => setIsLanguageSelectOpen(false)}
                        className="font-bold text-blue-600"
                      >
                        完了
                      </button>
                    </div>
                    <div className="overflow-y-auto py-2">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setSelectedLanguage(lang)}
                          className={`w-full text-center py-3 text-[14px] ${
                            selectedLanguage === lang ? 'bg-gray-100 font-bold text-gray-900' : 'text-gray-600'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isLevelSelectOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsLevelSelectOpen(false)}
                    className="fixed inset-0 bg-black/40 z-[60]"
                  />
                  <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-[70] flex flex-col"
                  >
                    <div className="flex items-center justify-end p-4 border-b border-gray-100">
                      <button 
                        onClick={() => setIsLevelSelectOpen(false)}
                        className="font-bold text-blue-600"
                      >
                        完了
                      </button>
                    </div>
                    <div className="py-2">
                      {LANGUAGE_LEVELS.map((level) => (
                        <button
                          key={level}
                          onClick={() => setSelectedLevel(level)}
                          className={`w-full text-center py-3 text-[14px] ${
                            selectedLevel === level ? 'bg-gray-100 font-bold text-gray-900' : 'text-gray-600'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>

      {/* More Page Overlay */}
      <AnimatePresence>
        {isMorePageOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[100] flex flex-col max-w-md mx-auto"
          >
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white border-b border-gray-100 h-[52px] flex items-center px-4 gap-3">
              <button onClick={() => setIsMorePageOpen(false)} className="p-1 -ml-1">
                <ArrowLeft className="w-6 h-6 text-gray-900" />
              </button>
              <h1 className="text-lg font-bold text-gray-900">もっと見る</h1>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar">
              {/* Top Icons Grid */}
              <div className="grid grid-cols-4 gap-4 p-6 border-b border-gray-100">
                <button className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                    <Megaphone className="w-6 h-6 text-gray-700" />
                  </div>
                  <span className="text-[11px] font-bold text-gray-700">お知らせ</span>
                </button>
                <button className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                    <HelpCircle className="w-6 h-6 text-gray-700" />
                  </div>
                  <span className="text-[11px] font-bold text-gray-700">ヘルプ</span>
                </button>
                <button className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                    <Headset className="w-6 h-6 text-gray-700" />
                  </div>
                  <span className="text-[11px] font-bold text-gray-700">1:1 お問い合わせ</span>
                </button>
                <button 
                  onClick={() => setIsSettingsPageOpen(true)}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                    <Settings className="w-6 h-6 text-gray-700" />
                  </div>
                  <span className="text-[11px] font-bold text-gray-700">設定</span>
                </button>
              </div>

              {/* My Info Section */}
              <div className="py-4">
                <div className="px-4 py-2">
                  <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">マイ情報</h3>
                </div>
                <button 
                  onClick={() => {
                    setIsMorePageOpen(false);
                    setProfileTab(1);
                    setIsProfileOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <UserCircle className="w-6 h-6 text-gray-700" />
                    <span className="text-[15px] font-bold text-gray-900">プロフィール管理</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Useful Features Section */}
              <div className="py-4">
                <div className="px-4 py-2">
                  <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">便利な機能</h3>
                </div>
                <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="w-6 h-6 text-gray-700" />
                    <span className="text-[15px] font-bold text-gray-900">アルバムから名刺を取り込む</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-gray-700" />
                    <span className="text-[15px] font-bold text-gray-900">名刺を直接入力</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Phone className="w-6 h-6 text-gray-700" />
                    <span className="text-[15px] font-bold text-gray-900">着信時に相手の名刺情報を表示</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Business Services Section */}
              <div className="py-4">
                <div className="px-4 py-2">
                  <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">企業用サービス</h3>
                </div>
                <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <BarChart2 className="w-6 h-6 text-gray-700" />
                    <span className="text-[15px] font-bold text-gray-900">会社員向けアンケート</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Megaphone className="w-6 h-6 text-gray-700" />
                    <span className="text-[15px] font-bold text-gray-900">会社員ターゲット広告</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <UserPlus className="w-6 h-6 text-gray-700" />
                    <span className="text-[15px] font-bold text-gray-900">Rememberヘッドハンティングサービス</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-6 h-6 text-gray-700" />
                    <span className="text-[15px] font-bold text-gray-900">キャリア採用ソリューション</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-gray-700" />
                    <span className="text-[15px] font-bold text-gray-900">チーム名刺帳</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Other Section */}
              <div className="py-4 mb-8">
                <div className="px-4 py-2">
                  <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">その他</h3>
                </div>
                <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-6 h-6 text-gray-700" />
                    <span className="text-[15px] font-bold text-gray-900">プロローグ</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <ThumbsUp className="w-6 h-6 text-gray-700" />
                    <span className="text-[15px] font-bold text-gray-900">Rememberを推薦する</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Page Overlay */}
      <AnimatePresence>
        {isSettingsPageOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[110] flex flex-col max-w-md mx-auto"
          >
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white border-b border-gray-100 h-[52px] flex items-center px-4 gap-3">
              <button onClick={() => setIsSettingsPageOpen(false)} className="p-1 -ml-1">
                <ArrowLeft className="w-6 h-6 text-gray-900" />
              </button>
              <h1 className="text-lg font-bold text-gray-900">設定</h1>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
              {/* Account Section */}
              <div className="bg-white border-b border-gray-100">
                <div className="px-4 py-3">
                  <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">アカウント</h3>
                </div>
                <button 
                  onClick={() => setIsAccountManagementOpen(true)}
                  className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-[15px] font-bold text-gray-900">アカウント管理</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
                <button 
                  onClick={() => {
                    const isSocialUser = user?.providerData.some(p => p.providerId === 'google.com');
                    // Check if user has a password set. 
                    // For simplicity in this demo, we assume social users without password set 
                    // will have only google.com in providerData.
                    // If they have password set, they should have 'password' in providerData.
                    const hasPassword = user?.providerData.some(p => p.providerId === 'password');
                    
                    if (isSocialUser && !hasPassword) {
                      setIsPasswordResetOpen(true);
                    } else {
                      setIsPasswordChangeOpen(true);
                    }
                  }}
                  className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-[15px] font-bold text-gray-900">パスワード再設定</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <span className="text-[15px] font-bold text-gray-900">簡易ログイン設定</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                  <span className="text-[15px] font-bold text-gray-900">携帯電話番号変更</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] text-gray-500">010-8526-8170</span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
              </div>

              {/* Business Card Section */}
              <div className="bg-white border-b border-gray-100">
                <div className="px-4 py-3">
                  <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">名刺</h3>
                </div>
                <button className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <span className="text-[15px] font-bold text-gray-900">着信時に相手の名刺情報を表示</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] text-gray-500">オフ</span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
                <button className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <span className="text-[15px] font-bold text-gray-900">携帯電話の連絡先に保存</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <span className="text-[15px] font-bold text-gray-900">ファイルに書き出し</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                  <span className="text-[15px] font-bold text-gray-900">名刺撮影時にマイ名刺を送る</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* General Section */}
              <div className="bg-white border-b border-gray-100">
                <div className="px-4 py-3">
                  <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">一般</h3>
                </div>
                <button className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <span className="text-[15px] font-bold text-gray-900">通知管理</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                  <span className="text-[15px] font-bold text-gray-900">画面テーマ</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] text-gray-500">システム設定モード</span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
              </div>

              {/* Other Section */}
              <div className="bg-white border-b border-gray-100 mb-8">
                <div className="px-4 py-3">
                  <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">その他</h3>
                </div>
                <button className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <span className="text-[15px] font-bold text-gray-900">法的通知</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <span className="text-[15px] font-bold text-gray-900">パスコードロック設定</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] text-gray-500">オフ</span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
                <button className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <span className="text-[15px] font-bold text-gray-900">サーバーと情報を再同期</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
                <button 
                  onClick={() => {
                    handleLogout();
                    setIsSettingsPageOpen(false);
                    setIsMorePageOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-[15px] font-bold text-red-500">ログアウト</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account Management Overlay */}
      <AnimatePresence>
        {isAccountManagementOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[120] flex flex-col max-w-md mx-auto"
          >
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white border-b border-gray-100 h-[52px] flex items-center px-4 gap-3">
              <button onClick={() => setIsAccountManagementOpen(false)} className="p-1 -ml-1">
                <ArrowLeft className="w-6 h-6 text-gray-900" />
              </button>
              <h1 className="text-lg font-bold text-gray-900">アカウント</h1>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="bg-white">
                <button 
                  onClick={() => {
                    const isSocialUser = user?.providerData.some(p => p.providerId === 'google.com');
                    if (isSocialUser) {
                      setIsPasswordSetupPopupOpen(true);
                    } else {
                      // Normal account change logic would go here
                    }
                  }}
                  className="w-full flex items-center justify-between px-4 py-5 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-[16px] font-bold text-gray-900">アカウント変更</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] text-gray-500">{user?.email || 'milk454537@gmail.com'}</span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
                <button 
                  onClick={() => setIsWithdrawalOpen(true)}
                  className="w-full flex items-center justify-between px-4 py-5 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-[16px] font-bold text-gray-900">Rememberを退会</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Withdrawal Overlay */}
      <AnimatePresence>
        {isWithdrawalOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[130] flex flex-col max-w-md mx-auto"
          >
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white h-[52px] flex items-center px-4">
              <button onClick={() => setIsWithdrawalOpen(false)} className="p-1 -ml-1">
                <ArrowLeft className="w-6 h-6 text-gray-900" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-4">
              <div className="text-center mb-8">
                <h2 className="text-[24px] font-bold text-gray-900 mb-2">Rememberを退会</h2>
                <p className="text-[14px] text-gray-500">退会する前に以下の内容を必ずご確認ください</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-5 mb-8">
                <ul className="space-y-4 text-[13px] text-gray-600 leading-relaxed">
                  <li className="flex gap-2">
                    <span className="shrink-0">1.</span>
                    <span>退会すると、登録された連絡先はすべて削除され、復旧することはできません。</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0">2.</span>
                    <span>携帯電話番号の変更は、[設定] &gt; [携帯電話番号変更]から可能です。</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0">3.</span>
                    <span>アカウント(メール)の変更は、[設定] &gt; [アカウント管理] &gt; [アカウント変更]から可能です。</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0">4.</span>
                    <span>チーム名刺帳組織の管理者は、組織を削除するか管理者を委譲した後に退会できます。</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0">5.</span>
                    <span>キャリア人材検索チームアカウントの管理者は、チームアカウントを削除した後に退会できます。</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0">6.</span>
                    <span>もし利用過程で不便な点がございましたら、[1:1お問い合わせ]に内容を残してください。</span>
                  </li>
                </ul>
              </div>

              <div className="flex items-center gap-3 mb-10">
                <button 
                  onClick={() => setIsWithdrawalChecked(!isWithdrawalChecked)}
                  className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${isWithdrawalChecked ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'}`}
                >
                  <Check className={`w-4 h-4 ${isWithdrawalChecked ? 'text-white' : 'text-transparent'}`} />
                </button>
                <span className="text-[15px] font-bold text-gray-900">すべて削除して退会します</span>
              </div>

              <button 
                disabled={!isWithdrawalChecked}
                onClick={async () => {
                  if (!user) return;
                  try {
                    // In a real app, we would delete user data from Firestore here
                    // and then delete the Auth account.
                    // For this demo, we'll just log out.
                    await signOut(auth);
                    setIsWithdrawalOpen(false);
                    setIsAccountManagementOpen(false);
                    setIsSettingsPageOpen(false);
                    setIsMorePageOpen(false);
                    setActiveTab('today');
                  } catch (error) {
                    console.error('Withdrawal failed:', error);
                  }
                }}
                className={`w-full py-4 rounded-lg text-[16px] font-bold transition-colors ${isWithdrawalChecked ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'}`}
              >
                退会する
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Change Overlay */}
      <AnimatePresence>
        {isPasswordChangeOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[120] flex flex-col max-w-md mx-auto"
          >
            <header className="sticky top-0 z-10 bg-white h-[52px] flex items-center px-4 gap-3 border-b border-gray-100">
              <button onClick={() => setIsPasswordChangeOpen(false)} className="p-1 -ml-1">
                <ArrowLeft className="w-6 h-6 text-gray-900" />
              </button>
              <h1 className="text-lg font-bold text-gray-900">パスワード再設定</h1>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar p-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[14px] font-bold text-gray-900">現在のパスワード *</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="現在のパスワード入力"
                    className="w-full h-[48px] px-4 border border-gray-200 rounded-md bg-gray-50 text-[15px] focus:outline-none focus:border-black"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[14px] font-bold text-gray-900">新しいパスワード *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="新しいパスワード入力"
                    className="w-full h-[48px] px-4 border border-gray-200 rounded-md bg-gray-50 text-[15px] focus:outline-none focus:border-black"
                  />
                  <p className="text-[13px] text-gray-500">
                    英数字・記号のうち2種類以上を組み合わせて8文字以上で入力してください。
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[14px] font-bold text-gray-900">新しいパスワード再入力 *</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="新しいパスワード再入力"
                    className="w-full h-[48px] px-4 border border-gray-200 rounded-md bg-gray-50 text-[15px] focus:outline-none focus:border-black"
                  />
                </div>

                <button 
                  onClick={async () => {
                    if (!currentPassword || !password || !confirmPassword) {
                      alert('すべての項目を入力してください');
                      return;
                    }
                    if (password !== confirmPassword) {
                      setIsPasswordResetErrorOpen(true);
                      return;
                    }
                    // Password change logic
                    if (!user || !user.email) return;
                    try {
                      const credential = EmailAuthProvider.credential(user.email, currentPassword);
                      await reauthenticateWithCredential(user, credential);
                      await updatePassword(user, password);
                      
                      setIsPasswordChangeOpen(false);
                      setIsPasswordResetSuccessOpen(true);
                      setCurrentPassword('');
                      setPassword('');
                      setConfirmPassword('');
                    } catch (error) {
                      console.error('Password change failed:', error);
                      setIsPasswordResetErrorOpen(true);
                    }
                  }}
                  className={`w-full h-[52px] rounded-md text-[16px] font-bold text-white transition-colors ${
                    !currentPassword || !password || !confirmPassword 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'bg-black hover:bg-gray-800'
                  }`}
                  disabled={!currentPassword || !password || !confirmPassword}
                >
                  パスワード再設定
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isPasswordResetSuccessOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl w-full max-w-[320px] p-8 text-center shadow-2xl"
            >
              <h3 className="text-[18px] font-bold text-gray-900 mb-4">
                パスワードを変更しました
              </h3>
              <p className="text-[14px] text-gray-600 mb-8">
                既存にログインされた他の機器とブラウザでは再度ログインしてください。
              </p>
              <button
                onClick={() => setIsPasswordResetSuccessOpen(false)}
                className="w-full h-[48px] bg-black rounded-md text-[16px] font-bold text-white hover:bg-gray-800 transition-colors"
              >
                確認
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Reset Error Popup */}
      <AnimatePresence>
        {isPasswordResetErrorOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl w-full max-w-[320px] p-8 text-center shadow-2xl"
            >
              <h3 className="text-[18px] font-bold text-gray-900 mb-4">
                エラー
              </h3>
              <p className="text-[14px] text-gray-600 mb-8">
                パスワード変更に失敗しました。現在のパスワードを確認してください。
              </p>
              <button
                onClick={() => setIsPasswordResetErrorOpen(false)}
                className="w-full h-[48px] bg-black rounded-md text-[16px] font-bold text-white hover:bg-gray-800 transition-colors"
              >
                確認
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isPasswordResetOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[120] flex flex-col max-w-md mx-auto"
          >
            <header className="sticky top-0 z-10 bg-white h-[52px] flex items-center px-4 gap-3 border-b border-gray-100">
              <button onClick={() => setIsPasswordResetOpen(false)} className="p-1 -ml-1">
                <ArrowLeft className="w-6 h-6 text-gray-900" />
              </button>
              <h1 className="text-lg font-bold text-gray-900">パスワード再設定</h1>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar p-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[14px] font-bold text-gray-900">パスワード</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="パスワード入力"
                    className="w-full h-[48px] px-4 border border-gray-200 rounded-md bg-gray-50 text-[15px] focus:outline-none focus:border-black"
                  />
                  <p className="text-[13px] text-gray-500">
                    パスワードが入力されていません。パスワードを入力するとメールでログインできます。
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[14px] font-bold text-gray-900">パスワード再入力</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="パスワード再入力"
                    className="w-full h-[48px] px-4 border border-gray-200 rounded-md bg-gray-50 text-[15px] focus:outline-none focus:border-black"
                  />
                </div>

                <button 
                  onClick={async () => {
                    if (password !== confirmPassword) {
                      alert('パスワードが一致しません');
                      return;
                    }
                    if (!user || !user.email) return;
                    try {
                      const credential = EmailAuthProvider.credential(user.email, password);
                      await linkWithCredential(user, credential);
                      setIsPasswordResetOpen(false);
                      setIsPasswordResetSuccessOpen(true);
                      setPassword('');
                      setConfirmPassword('');
                    } catch (error) {
                      console.error('Password reset failed:', error);
                      alert('パスワード設定に失敗しました');
                    }
                  }}
                  className="w-full h-[52px] bg-black rounded-md text-[16px] font-bold text-white transition-colors"
                >
                  パスワード再設定
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isPasswordSetupPopupOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPasswordSetupPopupOpen(false)}
              className="absolute inset-0 bg-black/50"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-xl w-full max-w-[320px] overflow-hidden shadow-2xl"
            >
              <div className="h-[150px] w-[320px] flex flex-col justify-center px-6 text-center">
                <h3 className="text-[15px] font-bold text-gray-900 mb-6">
                  パスワードを先に設定してください。
                </h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsPasswordSetupPopupOpen(false)}
                    className="flex-1 h-[44px] border border-gray-300 rounded-md text-[14px] font-bold text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    閉じる
                  </button>
                  <button
                    onClick={() => {
                      // Logic to navigate to password setup would go here
                      setIsPasswordSetupPopupOpen(false);
                    }}
                    className="flex-1 h-[44px] bg-black rounded-md text-[14px] font-bold text-white hover:bg-gray-800 transition-colors"
                  >
                    設定
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isWebsiteEditOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-50 flex flex-col"
          >
            <div className="sticky top-0 bg-white z-20 border-b border-gray-100">
              <div className="flex items-center justify-between p-4 relative">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsWebsiteEditOpen(false)} 
                    className="p-1 -ml-1"
                  >
                    <ArrowLeft className="w-6 h-6 text-gray-900" />
                  </button>
                  <h2 className="text-lg font-bold text-gray-900">ウェブサイト・ブログ編集</h2>
                </div>
                <button 
                  onClick={handleSaveWebsite}
                  className="font-bold text-blue-600 text-sm"
                >
                  保存
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-gray-900">
                    リンク・URL
                  </label>
                  {websiteUrls.map((url, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => handleWebsiteChange(index, e.target.value)}
                        placeholder="ウェブサイトやブログのリンクを入力"
                        className="w-full h-[45px] px-4 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-0"
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleAddWebsiteInput}
                  className="flex items-center gap-2 text-gray-900 font-bold py-2"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  追加
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lecture Edit Overlay */}
      <AnimatePresence>
        {isLectureEditOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[60] overflow-y-auto no-scrollbar max-w-md mx-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setIsLectureEditOpen(false)}>
                  <ArrowLeft className="w-6 h-6 text-gray-900" />
                </button>
                <h2 className="text-lg font-bold text-gray-900">講義・諮問活動追加</h2>
              </div>
              <button 
                onClick={handleSaveLecture}
                disabled={!lectureTitle || !lectureDate}
                className={`font-bold text-sm ${(!lectureTitle || !lectureDate) ? 'text-gray-300' : 'text-gray-900'}`}
              >
                保存
              </button>
            </div>

            <div className="p-4 bg-white">
              <div className="space-y-6">
                {/* Title Field */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    タイトル <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={lectureTitle}
                    onChange={(e) => setLectureTitle(e.target.value)}
                    placeholder="講義や諮問活動の内容を入力"
                    className="w-full border border-gray-200 rounded-md h-[45px] px-4 text-sm focus:outline-none focus:border-black focus:ring-0"
                  />
                </div>

                {/* Date Field */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    活動時期
                  </label>
                  <div 
                    onClick={() => {
                      setTempLectureDate(lectureDate ? { year: parseInt(lectureDate.split('-')[0]), month: parseInt(lectureDate.split('-')[1]) } : { year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
                      setIsLectureDatePickerOpen(true);
                    }}
                    className="w-full border border-gray-200 rounded-md h-[45px] px-4 flex justify-between items-center cursor-pointer"
                  >
                    <span className={lectureDate ? 'text-gray-900' : 'text-gray-400'}>
                      {lectureDate ? `${lectureDate.split('-')[0]}年 ${lectureDate.split('-')[1]}月` : '例）2025年 4月'}
                    </span>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lecture Date Picker Overlay */}
      <AnimatePresence>
        {isLectureDatePickerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLectureDatePickerOpen(false)}
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
                  onClick={() => {
                    setLectureDate('');
                    setIsLectureDatePickerOpen(false);
                  }}
                  className="text-blue-500 font-medium"
                >
                  削除
                </button>
                <button 
                  onClick={() => {
                    setLectureDate(`${tempLectureDate.year}-${tempLectureDate.month.toString().padStart(2, '0')}`);
                    setIsLectureDatePickerOpen(false);
                  }}
                  className="text-blue-500 font-medium"
                >
                  完了
                </button>
              </div>
              <div className="flex justify-center items-center h-48 gap-8 px-8 relative">
                <div className="flex-1 h-full overflow-y-auto snap-y snap-mandatory no-scrollbar relative" id="lecture-year-scroll">
                  <div className="h-20"></div>
                  {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() + 10 - i).map(year => (
                    <div 
                      key={year} 
                      onClick={() => setTempLectureDate(prev => ({ ...prev, year }))}
                      className={`h-8 flex items-center justify-center snap-center cursor-pointer ${tempLectureDate.year === year ? 'text-xl font-bold text-gray-900' : 'text-gray-400'}`}
                    >
                      {year}年
                    </div>
                  ))}
                  <div className="h-20"></div>
                </div>
                <div className="flex-1 h-full overflow-y-auto snap-y snap-mandatory no-scrollbar relative" id="lecture-month-scroll">
                  <div className="h-20"></div>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <div 
                      key={month} 
                      onClick={() => setTempLectureDate(prev => ({ ...prev, month }))}
                      className={`h-8 flex items-center justify-center snap-center cursor-pointer ${tempLectureDate.month === month ? 'text-xl font-bold text-gray-900' : 'text-gray-400'}`}
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

      {/* Publication Edit Overlay */}
      <AnimatePresence>
        {isPublicationEditOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[60] overflow-y-auto no-scrollbar max-w-md mx-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setIsPublicationEditOpen(false)}>
                  <ArrowLeft className="w-6 h-6 text-gray-900" />
                </button>
                <h2 className="text-lg font-bold text-gray-900">論文・著書追加</h2>
              </div>
              <button 
                onClick={handleSavePublication}
                disabled={!publicationTitle || !publicationDate}
                className={`font-bold text-sm ${(!publicationTitle || !publicationDate) ? 'text-gray-300' : 'text-gray-900'}`}
              >
                保存
              </button>
            </div>

            <div className="p-4 bg-white">
              <div className="space-y-6">
                {/* Title Field */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    タイトル <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={publicationTitle}
                    onChange={(e) => setPublicationTitle(e.target.value)}
                    placeholder="論文や著書のタイトルを入力"
                    className="w-full border border-gray-200 rounded-md h-[45px] px-4 text-sm focus:outline-none focus:border-black focus:ring-0"
                  />
                </div>

                {/* Date Field */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    発行年月
                  </label>
                  <div 
                    onClick={() => {
                      setTempPublicationDate(publicationDate ? { year: parseInt(publicationDate.split('-')[0]), month: parseInt(publicationDate.split('-')[1]) } : { year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
                      setIsPublicationDatePickerOpen(true);
                    }}
                    className="w-full border border-gray-200 rounded-md h-[45px] px-4 flex justify-between items-center cursor-pointer"
                  >
                    <span className={publicationDate ? 'text-gray-900' : 'text-gray-400'}>
                      {publicationDate ? `${publicationDate.split('-')[0]}年 ${publicationDate.split('-')[1]}月` : '例）2025年 4月'}
                    </span>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Publication Date Picker Overlay */}
      <AnimatePresence>
        {isPublicationDatePickerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPublicationDatePickerOpen(false)}
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
                  onClick={() => {
                    setPublicationDate('');
                    setIsPublicationDatePickerOpen(false);
                  }}
                  className="text-blue-500 font-medium"
                >
                  削除
                </button>
                <button 
                  onClick={() => {
                    setPublicationDate(`${tempPublicationDate.year}-${tempPublicationDate.month.toString().padStart(2, '0')}`);
                    setIsPublicationDatePickerOpen(false);
                  }}
                  className="text-blue-500 font-medium"
                >
                  完了
                </button>
              </div>
              <div className="flex justify-center items-center h-48 gap-8 px-8 relative">
                <div className="flex-1 h-full overflow-y-auto snap-y snap-mandatory no-scrollbar relative" id="publication-year-scroll">
                  <div className="h-20"></div>
                  {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() + 10 - i).map(year => (
                    <div 
                      key={year} 
                      onClick={() => setTempPublicationDate(prev => ({ ...prev, year }))}
                      className={`h-8 flex items-center justify-center snap-center cursor-pointer ${tempPublicationDate.year === year ? 'text-xl font-bold text-gray-900' : 'text-gray-400'}`}
                    >
                      {year}年
                    </div>
                  ))}
                  <div className="h-20"></div>
                </div>
                <div className="flex-1 h-full overflow-y-auto snap-y snap-mandatory no-scrollbar relative" id="publication-month-scroll">
                  <div className="h-20"></div>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <div 
                      key={month} 
                      onClick={() => setTempPublicationDate(prev => ({ ...prev, month }))}
                      className={`h-8 flex items-center justify-center snap-center cursor-pointer ${tempPublicationDate.month === month ? 'text-xl font-bold text-gray-900' : 'text-gray-400'}`}
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

      {/* Article List Edit Overlay */}
      <AnimatePresence>
        {isArticleListEditOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[60] overflow-y-auto no-scrollbar max-w-md mx-auto"
          >
            {/* Header */}
            <div className="flex items-center p-4 bg-white border-b border-gray-100 sticky top-0 z-10">
              <button onClick={() => setIsArticleListEditOpen(false)} className="mr-3">
                <ArrowLeft className="w-6 h-6 text-gray-900" />
              </button>
              <h2 className="text-lg font-bold text-gray-900">記事編集</h2>
            </div>

            <div className="p-4 bg-white">
              <button
                onClick={() => {
                  setEditingArticleId(null);
                  setArticleTitle("");
                  setArticleUrl("");
                  setIsArticleEditOpen(true);
                }}
                className="w-full flex items-center text-orange-500 font-bold mb-6"
              >
                <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center mr-2">
                  <span className="text-sm leading-none">+</span>
                </div>
                記事追加
              </button>

              <div className="space-y-0">
                {userProfile?.articles?.map((article) => (
                  <div 
                    key={article.id} 
                    className="flex items-center justify-between py-4 border-b border-gray-100 cursor-pointer"
                    onClick={() => {
                      setEditingArticleId(article.id);
                      setArticleTitle(article.title);
                      setArticleUrl(article.url);
                      setIsArticleEditOpen(true);
                    }}
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <h4 className="text-gray-900 font-medium truncate">{article.title}</h4>
                      <p className="text-sm text-gray-400 truncate mt-1">{article.url}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Article Edit Overlay */}
      <AnimatePresence>
        {isArticleEditOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[60] overflow-y-auto no-scrollbar max-w-md mx-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setIsArticleEditOpen(false)}>
                  <ArrowLeft className="w-6 h-6 text-gray-900" />
                </button>
                <h2 className="text-lg font-bold text-gray-900">{editingArticleId ? '記事編集' : '記事追加'}</h2>
              </div>
              <button 
                onClick={handleSaveArticle}
                disabled={!articleTitle || !articleUrl || (articleUrl.length > 0 && !articleUrl.startsWith('http://') && !articleUrl.startsWith('https://'))}
                className={`font-bold text-sm ${(!articleTitle || !articleUrl || (articleUrl.length > 0 && !articleUrl.startsWith('http://') && !articleUrl.startsWith('https://'))) ? 'text-gray-300' : 'text-orange-500'}`}
              >
                保存
              </button>
            </div>

            <div className="p-4 bg-white">
              <div className="space-y-6">
                {/* Title Field */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    記事のタイトル <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={articleTitle}
                      onChange={(e) => setArticleTitle(e.target.value)}
                      placeholder="記事を表示するテキストを入力"
                      className="w-full border border-gray-200 rounded-md h-[45px] px-4 text-sm focus:outline-none focus:border-black focus:ring-0 pr-10"
                    />
                    {articleTitle && (
                      <button 
                        onClick={() => setArticleTitle('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                      >
                        <XCircle className="w-5 h-5 fill-gray-300 text-white" />
                      </button>
                    )}
                  </div>
                </div>

                {/* URL Field */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    リンク・URL <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={articleUrl}
                      onChange={(e) => setArticleUrl(e.target.value)}
                      placeholder="記事のリンクを入力"
                      className={`w-full border rounded-md h-[45px] px-4 text-sm focus:outline-none focus:ring-0 pr-10 ${
                        articleUrl.length > 0 && !articleUrl.startsWith('http://') && !articleUrl.startsWith('https://')
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-gray-200 focus:border-black'
                      }`}
                    />
                    {articleUrl && (
                      <button 
                        onClick={() => setArticleUrl('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                      >
                        <XCircle className="w-5 h-5 fill-gray-300 text-white" />
                      </button>
                    )}
                  </div>
                  {articleUrl.length > 0 && !articleUrl.startsWith('http://') && !articleUrl.startsWith('https://') && (
                    <p className="text-red-500 text-sm mt-2 font-medium">
                      正しいリンク・URLの形式ではありません<br/>
                      (アドレスの前に https://, http:// が含まれている必要があります)
                    </p>
                  )}
                </div>
              </div>
              
              {editingArticleId && (
                <div className="mt-12 flex justify-center">
                  <button 
                    onClick={() => setIsArticleDeleteModalOpen(true)}
                    className="text-gray-500 font-medium"
                  >
                    記事削除
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Awards Edit Overlay */}
      <AnimatePresence>
        {isAwardsEditOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[60] flex flex-col"
          >
            <div className="sticky top-0 bg-white z-20 border-b border-gray-100">
              <div className="flex items-center justify-between p-4 relative">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsAwardsEditOpen(false)} 
                    className="p-1 -ml-1"
                  >
                    <ArrowLeft className="w-6 h-6 text-gray-900" />
                  </button>
                  <h2 className="text-lg font-bold text-gray-900">受賞及びその他の履歴編集</h2>
                </div>
                <button 
                  onClick={handleSaveAwards}
                  className="font-bold text-orange-500 text-sm"
                >
                  保存
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-gray-900">
                    受賞及びその他の履歴
                  </label>
                  {awardsList.map((award, index) => (
                    <div key={index} className="relative">
                      <input
                        type="text"
                        value={award}
                        onChange={(e) => handleAwardChange(index, e.target.value)}
                        placeholder="例) 2018 ベストアナリスト"
                        className="w-full h-[45px] px-4 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-0 pr-10"
                      />
                      {award && (
                        <button 
                          onClick={() => handleAwardChange(index, "")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                        >
                          <XCircle className="w-5 h-5 fill-gray-300 text-white" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleAddAwardInput}
                  className="flex items-center gap-2 text-gray-900 font-bold py-2"
                >
                  <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center">
                    <span className="text-sm leading-none">+</span>
                  </div>
                  追加
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Certificates Edit Overlay */}
      <AnimatePresence>
        {isCertificatesEditOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[60] flex flex-col"
          >
            <div className="sticky top-0 bg-white z-20 border-b border-gray-100">
              <div className="flex items-center justify-between p-4 relative">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsCertificatesEditOpen(false)} 
                    className="p-1 -ml-1"
                  >
                    <ArrowLeft className="w-6 h-6 text-gray-900" />
                  </button>
                  <h2 className="text-lg font-bold text-gray-900">資格証編集</h2>
                </div>
                <button 
                  onClick={handleSaveCertificates}
                  className="font-bold text-orange-500 text-sm"
                >
                  保存
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-gray-900">
                    資格証
                  </label>
                  {certificatesList.map((cert, index) => (
                    <div key={index} className="relative">
                      <input
                        type="text"
                        value={cert}
                        onChange={(e) => handleCertificateChange(index, e.target.value)}
                        placeholder="例) 国際財務分析師(CFA)"
                        className="w-full h-[45px] px-4 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-0 pr-10"
                      />
                      {cert && (
                        <button 
                          onClick={() => handleCertificateChange(index, "")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                        >
                          <XCircle className="w-5 h-5 fill-gray-300 text-white" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleAddCertificateInput}
                  className="flex items-center gap-2 text-gray-900 font-bold py-2"
                >
                  <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center">
                    <span className="text-sm leading-none">+</span>
                  </div>
                  追加
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Personal Info Edit Overlay */}
      <AnimatePresence>
        {isPersonalInfoEditOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[60] overflow-y-auto no-scrollbar max-w-md mx-auto flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center p-4 bg-white border-b border-gray-100 sticky top-0 z-10">
              <button onClick={() => setIsPersonalInfoEditOpen(false)} className="mr-3">
                <X className="w-6 h-6 text-gray-900" />
              </button>
              <h2 className="text-lg font-bold text-gray-900">人的事項</h2>
            </div>

            <div className="p-5 bg-white flex-1">
              {/* Gender Section */}
              <div className="mb-8">
                <h3 className="font-bold text-gray-900 mb-4">性別</h3>
                <div className="flex gap-2">
                  {['男性', '女性', '選択しない'].map((option) => (
                    <button
                      key={option}
                      onClick={() => setGender(option as '男性' | '女性' | '選択しない')}
                      className={`flex-1 py-3.5 rounded-md font-bold text-[15px] border transition-colors ${
                        gender === option
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Birth Year Section */}
              <div className="mb-8">
                <h3 className="font-bold text-gray-900 mb-4">出生年度</h3>
                <div className="relative">
                  <select
                    value={birthYear || ''}
                    onChange={(e) => setBirthYear(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full border border-gray-300 rounded-md h-[52px] px-4 text-[15px] focus:outline-none focus:border-black focus:ring-0 appearance-none bg-white"
                  >
                    <option value="" disabled>選択してください</option>
                    {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-5 h-5 text-gray-600 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <p className="text-[13px] text-gray-400 leading-relaxed mt-12">
                * 採用提案および求人支援の確認のため、採用担当者とヘッドハンターにのみ公開されます。
              </p>
            </div>

            {/* Bottom Fixed Button */}
            <div className="p-4 bg-white mt-auto">
              <button
                onClick={handleSavePersonalInfo}
                disabled={gender === userProfile?.gender && birthYear === userProfile?.birthYear}
                className={`w-full font-bold py-4 rounded-lg transition-colors ${
                  (gender !== userProfile?.gender || birthYear !== userProfile?.birthYear)
                    ? 'bg-black text-white hover:bg-gray-800'
                    : 'bg-[#e5e5e5] text-white cursor-not-allowed'
                }`}
              >
                保存
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Article Confirmation Modal */}
      <AnimatePresence>
        {isArticleDeleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl w-full max-w-[320px] p-6 text-center"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                記事を<br/>削除しますか？
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsArticleDeleteModalOpen(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-lg text-gray-900 font-bold"
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteArticle}
                  className="flex-1 py-3 bg-[#f05656] text-white rounded-lg font-bold"
                >
                  削除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Meishi Registration Bottom Sheet */}
      <AnimatePresence>
        {isMeishiOtherMethodsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100] flex items-end"
            onClick={() => setIsMeishiOtherMethodsOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full rounded-t-3xl p-6 pb-12 max-w-md mx-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
              <h3 className="text-xl font-bold text-gray-900 mb-8">名刺登録</h3>
              
              <div className="space-y-4">
                <button 
                  onClick={handleOpenMeishiCamera}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-[#0A0A0A]/10 flex items-center justify-center text-[#0A0A0A]">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900">カメラで撮影</p>
                    <p className="text-sm text-gray-500">名刺を撮影して自動で情報を入力します</p>
                  </div>
                </button>

                <button 
                  onClick={() => {
                    setIsMeishiOtherMethodsOpen(false);
                    handleOpenMeishiCamera();
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900">アルバムから選択</p>
                    <p className="text-sm text-gray-500">保存されている名刺画像を選択します</p>
                  </div>
                </button>

                <button 
                  onClick={() => {
                    setIsMeishiOtherMethodsOpen(false);
                    setIsMeishiDirectInputOpen(true);
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                    <Edit2 className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900">直接入力</p>
                    <p className="text-sm text-gray-500">情報を手動で入力して登録します</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modular Meishi Scanner Component */}
      <MeishiScannerModal
        isOpen={isMeishiCameraOpen}
        onClose={handleCloseMeishiCamera}
        onSaveMeishi={processMeishiOcrAndSave}
        isProcessing={isMeishiOcrProcessing}
        isRegisteringMyMeishi={isRegisteringMyMeishi}
        onOpenDirectInput={() => {
          setIsMeishiCameraOpen(false);
          setIsMeishiDirectInputOpen(true);
        }}
        onViewSavedMeishis={() => setActiveTab('meishi')}
      />

      {/* Meishi Direct Input Screen */}
      <AnimatePresence>
        {isMeishiDirectInputOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[300] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsMeishiDirectInputOpen(false)}
                  className="p-2 text-gray-900 hover:bg-gray-100 rounded-full"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h3 className="text-xl font-bold text-gray-900">直接入力</h3>
              </div>
              <button 
                onClick={handleSaveMeishiDirect}
                className="text-[#0A0A0A] font-bold text-lg px-4"
              >
                次へ
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Profile Image Section */}
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">名前</label>
                    <input 
                      type="text" 
                      placeholder="名前"
                      value={meishiDirectInputData.name}
                      onChange={e => setMeishiDirectInputData({...meishiDirectInputData, name: e.target.value})}
                      className="w-full p-4 rounded-xl border border-gray-200 focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="ml-6 flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden border border-gray-200">
                    {meishiDirectInputData.profileImage ? (
                      <img src={meishiDirectInputData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12" />
                    )}
                  </div>
                  <button 
                    onClick={handleMeishiManualProfileClick}
                    className="mt-2 text-xs font-bold text-white bg-gray-600 px-4 py-1.5 rounded-full flex items-center gap-1"
                  >
                    <span>編集</span>
                  </button>
                </div>
              </div>

              {/* Other Fields */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">役職</label>
                  <input 
                    type="text" 
                    placeholder="例) チームリーダー"
                    value={meishiDirectInputData.position}
                    onChange={e => setMeishiDirectInputData({...meishiDirectInputData, position: e.target.value})}
                    className="w-full p-4 rounded-xl border border-gray-200 focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] outline-none transition-all bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">部署</label>
                  <input 
                    type="text" 
                    placeholder="例) 経営戦略室"
                    value={meishiDirectInputData.department}
                    onChange={e => setMeishiDirectInputData({...meishiDirectInputData, department: e.target.value})}
                    className="w-full p-4 rounded-xl border border-gray-200 focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] outline-none transition-all bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">会社</label>
                  <input 
                    type="text" 
                    placeholder="会社名検索"
                    value={meishiDirectInputData.company}
                    onChange={e => setMeishiDirectInputData({...meishiDirectInputData, company: e.target.value})}
                    className="w-full p-4 rounded-xl border border-gray-200 focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] outline-none transition-all bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">携帯電話</label>
                  <input 
                    type="tel" 
                    placeholder="01012345678"
                    value={meishiDirectInputData.mobile}
                    onChange={e => setMeishiDirectInputData({...meishiDirectInputData, mobile: e.target.value})}
                    className="w-full p-4 rounded-xl border border-gray-200 focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] outline-none transition-all bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">メール</label>
                  <input 
                    type="email" 
                    placeholder="remember@rmbr.com"
                    value={meishiDirectInputData.email}
                    onChange={e => setMeishiDirectInputData({...meishiDirectInputData, email: e.target.value})}
                    className="w-full p-4 rounded-xl border border-gray-200 focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] outline-none transition-all bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">電話</label>
                  <input 
                    type="tel" 
                    placeholder="0212345678"
                    value={meishiDirectInputData.phone}
                    onChange={e => setMeishiDirectInputData({...meishiDirectInputData, phone: e.target.value})}
                    className="w-full p-4 rounded-xl border border-gray-200 focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] outline-none transition-all bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">ファックス</label>
                  <input 
                    type="tel" 
                    placeholder="0212345678"
                    value={meishiDirectInputData.fax}
                    onChange={e => setMeishiDirectInputData({...meishiDirectInputData, fax: e.target.value})}
                    className="w-full p-4 rounded-xl border border-gray-200 focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] outline-none transition-all bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">住所</label>
                  <input 
                    type="text" 
                    placeholder="東京都港区..."
                    value={meishiDirectInputData.address}
                    onChange={e => setMeishiDirectInputData({...meishiDirectInputData, address: e.target.value})}
                    className="w-full p-4 rounded-xl border border-gray-200 focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] outline-none transition-all bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500">建物名・部屋番号</label>
                  <input 
                    type="text" 
                    placeholder="6階"
                    value={meishiDirectInputData.detailedAddress}
                    onChange={e => setMeishiDirectInputData({...meishiDirectInputData, detailedAddress: e.target.value})}
                    className="w-full p-4 rounded-xl border border-gray-200 focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] outline-none transition-all bg-gray-50"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedMeishiForDetail && (
          <MeishiDetailView 
            meishi={selectedMeishiForDetail} 
            onBack={() => setSelectedMeishiForDetail(null)} 
            onEdit={() => setIsMeishiEditOpen(true)}
            onDelete={handleDeleteMeishi}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isMeishiEditOpen && selectedMeishiForDetail && (
          <MeishiEditView 
            meishi={selectedMeishiForDetail}
            onBack={() => setIsMeishiEditOpen(false)}
            onSave={(updated) => {
              setMeishis(prev => prev.map(m => m.id === updated.id ? updated : m));
              setSelectedMeishiForDetail(updated);
              setIsMeishiEditOpen(false);
              updateDoc(doc(db, 'meishi', updated.id), {
                ...updated,
                updatedAt: serverTimestamp()
              }).catch(error => handleFirestoreError(error, OperationType.UPDATE, `meishi/${updated.id}`));
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isMeishiOcrProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[300] flex flex-col items-center justify-center text-white"
          >
            <div className="relative w-64 h-40 border-2 border-white/20 rounded-lg overflow-hidden mb-8 bg-gray-900/50">
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <Contact className="w-20 h-20" />
              </div>
              <motion.div 
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-0.5 bg-white shadow-[0_0_15px_#FFFFFF] z-10"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
            </div>
            <Loader2 className="w-10 h-10 animate-spin text-white mb-4" />
            <p className="font-bold text-lg">名刺をスキャン中...</p>
            <p className="text-sm text-gray-400 mt-2">情報を読み取っています</p>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isSimpleLoginSettingsOpen && (
          <SimpleLoginSettings 
            onBack={() => setIsSimpleLoginSettingsOpen(false)} 
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isMeishiMapOpen && (
          <MeishiMapView 
            onBack={() => setIsMeishiMapOpen(false)} 
            meishis={meishis} 
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isMoreMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-2xl z-[70] overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-900">その他</h3>
                <button onClick={() => setIsMoreMenuOpen(false)} className="p-2">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-2 pb-8">
                <button 
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    setIsSimpleLoginSettingsOpen(true);
                  }}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left rounded-xl"
                >
                  <Settings className="w-5 h-5 text-gray-700" />
                  <span className="font-bold text-gray-900">簡単ログイン設定</span>
                </button>
                <button 
                  onClick={handleDeleteSelectedMeishis}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left rounded-xl"
                >
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <span className="font-bold text-red-500">名刺を削除</span>
                </button>
                <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left rounded-xl">
                  <Download className="w-5 h-5 text-gray-700" />
                  <span className="font-bold text-gray-900">ファイルへエクスポート</span>
                </button>
                <button 
                  onClick={handleShareSelectedMeishis}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left rounded-xl"
                >
                  <Share2 className="w-5 h-5 text-gray-700" />
                  <span className="font-bold text-gray-900">複数共有</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isDeleteDialogOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[100]"
              onClick={() => setIsDeleteDialogOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: '-50%', x: '-50%' }}
              animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
              exit={{ opacity: 0, scale: 0.95, y: '-50%', x: '-50%' }}
              className="fixed top-1/2 left-1/2 w-[90%] max-w-sm bg-white rounded-2xl z-[110] p-6 text-center shadow-xl"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {selectedMeishis.length}枚の名刺を削除しますか？
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                削除した名刺は復元できません。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={confirmDeleteMeishis}
                  className="flex-1 py-3 px-4 bg-[#FF4B4B] text-white rounded-xl font-bold hover:bg-red-600"
                >
                  削除
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <input 
        type="file" 
        ref={meishiManualProfileInputRef}
        onChange={handleMeishiManualProfileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}

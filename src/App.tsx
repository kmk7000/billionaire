import React, { useState } from 'react';
import { UserPlus, ThumbsUp, BookOpen, Megaphone, HelpCircle, Headset, UserCircle, CreditCard, MessageSquare, Briefcase, User, Plus, Search, Bell, TrendingUp, Building2, Clock, ChevronRight, Camera, Filter, Mail, Loader2, Check, Home, Contact, FileText, Share2, BarChart2, GraduationCap, ArrowLeft, Settings, Edit2, UserCog, ChevronDown, X, Trash2, XCircle, Menu, MapPin, Edit3, Users, Download, Phone, History, Sparkles, PenSquare, ShieldCheck, Bookmark, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { signInWithPopup, onAuthStateChanged, signOut, signInWithCustomToken, linkWithCredential, reauthenticateWithCredential, updatePassword, User as FirebaseUser } from 'firebase/auth';
import { collection, query, onSnapshot, serverTimestamp, orderBy, where, doc, setDoc, getDoc, updateDoc, arrayUnion, deleteField, deleteDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType, EmailAuthProvider } from './firebase';
import type { Tab, Career, Education, Language, Lecture, Publication, Article, UserProfile, Meishi, Post, Job } from './types/app';
import { JAPANESE_COMPANIES, JAPANESE_UNIVERSITIES, JAPANESE_MAJORS, DEGREES, SKILL_RECOMMENDATIONS, ALL_SKILLS, LANGUAGES, LANGUAGE_LEVELS, JOB_CATEGORIES, PREFECTURES, COUNTRIES } from './constants/profileData';
import { resizeImage } from './utils/imageUtils';
import { TermsAgreement } from './components/auth/TermsAgreement';
import { EmailSignup } from './components/auth/EmailSignup';
import { LoginScreen } from './components/auth/LoginScreen';
import { MeishiDetailView } from './components/meishi/MeishiDetailView';
import { MeishiEditView } from './components/meishi/MeishiEditView';
import { MeishiMapView } from './components/meishi/MeishiMapView';
import { TodayScreen } from './screens/TodayScreen';
import { MeishiListScreen } from './screens/MeishiListScreen';
import { CommunityScreen } from './screens/CommunityScreen';
import { ConnectScreen } from './screens/ConnectScreen';
import { JobsScreen } from './screens/JobsScreen';
import { BottomNav } from './components/layout/BottomNav';
import { DesktopSidebar } from './components/layout/DesktopSidebar';
import { CareerModals } from './components/profile/CareerModals';
import { useCareerEditor } from './hooks/useCareerEditor';
import { EducationModals } from './components/profile/EducationModals';
import { useEducationEditor } from './hooks/useEducationEditor';
import { SkillModals } from './components/profile/SkillModals';
import { useSkillEditor } from './hooks/useSkillEditor';
import { JobModals } from './components/profile/JobModals';
import { useJobEditor } from './hooks/useJobEditor';
import { LanguageModals } from './components/profile/LanguageModals';
import { useLanguageEditor } from './hooks/useLanguageEditor';
import { WebsiteModals } from './components/profile/WebsiteModals';
import { useWebsiteEditor } from './hooks/useWebsiteEditor';
import { LectureModals } from './components/profile/LectureModals';
import { useLectureEditor } from './hooks/useLectureEditor';
import { PublicationModals } from './components/profile/PublicationModals';
import { usePublicationEditor } from './hooks/usePublicationEditor';
import { ArticleModals } from './components/profile/ArticleModals';
import { useArticleEditor } from './hooks/useArticleEditor';
import { AwardsModals } from './components/profile/AwardsModals';
import { AwardsSection } from './components/profile/AwardsSection';
import { useAwardsEditor } from './hooks/useAwardsEditor';
import { CertificatesModals } from './components/profile/CertificatesModals';
import { CertificatesSection } from './components/profile/CertificatesSection';
import { useCertificatesEditor } from './hooks/useCertificatesEditor';
import SimpleLoginSettings from './components/SimpleLoginSettings';
import MeishiScannerModal from './components/MeishiScannerModal';
import { PublicCardView } from './components/PublicCardView';

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















  // Personal Info Edit State
  const [isPersonalInfoEditOpen, setIsPersonalInfoEditOpen] = useState(false);
  const [gender, setGender] = useState<'男性' | '女性' | '選択しない' | undefined>(undefined);
  const [birthYear, setBirthYear] = useState<number | undefined>(undefined);





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

  const career = useCareerEditor(user, userProfile, completedProfileSteps, toggleProfileStep);
  const education = useEducationEditor(user, userProfile, completedProfileSteps, toggleProfileStep);
  const skill = useSkillEditor(user, userProfile);
  const job = useJobEditor(user, userProfile);
  const language = useLanguageEditor(user, userProfile);
  const website = useWebsiteEditor(user, userProfile);
  const lecture = useLectureEditor(user);
  const publication = usePublicationEditor(user);
  const article = useArticleEditor(user, userProfile);
  const awards = useAwardsEditor(user, userProfile);
  const certificates = useCertificatesEditor(user, userProfile);

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
            <MeishiListScreen
              key="meishi"
              activeMeishiTab={activeMeishiTab}
              meishis={meishis}
              sortedMeishis={sortedMeishis}
              meishiSortOrder={meishiSortOrder}
              onToggleSortOrder={() => setMeishiSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              isEditMode={isEditMode}
              onToggleEditMode={() => {
                setIsEditMode(!isEditMode);
                if (isEditMode) setSelectedMeishis([]);
              }}
              selectedMeishis={selectedMeishis}
              onToggleSelect={(id) => setSelectedMeishis(prev =>
                prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
              )}
              onSelectMeishi={(meishi) => setSelectedMeishiForDetail(meishi)}
              onOpenMap={() => setIsMeishiMapOpen(true)}
              onOpenCamera={handleOpenMeishiCamera}
            />
          )}

          {activeTab === 'community' && (
            <CommunityScreen key="forum" posts={posts} />
          )}

          {activeTab === 'connect' && (
            <ConnectScreen key="connect" />
          )}

          {activeTab === 'jobs' && (
            <JobsScreen key="jobs" />
          )}

          {activeTab === 'today' && (
            <TodayScreen
              key="today"
              user={user}
              completedProfileSteps={completedProfileSteps}
              toggleProfileStep={toggleProfileStep}
              onOpenProfile={() => setIsProfileOpen(true)}
              onOpenIntroEdit={() => setIsIntroEditOpen(true)}
              onOpenCareerList={() => career.openList()}
              onOpenEducationEdit={() => education.open()}
              onOpenMyMeishiCamera={handleOpenMyMeishiCamera}
              onOpenMeishiCamera={handleOpenMeishiCamera}
            />
          )}
        </AnimatePresence>
      </main>
        </div>

        {/* Desktop Right Sidebar (Remember Web Style) */}
        <DesktopSidebar onNavigateCommunity={() => setActiveTab('community')} />
      </div>

      {/* Bottom Navigation (Mobile Only) */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        isEditMode={isEditMode}
        onOpenMoreMenu={() => setIsMoreMenuOpen(true)}
      />

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
                      onClick={() => career.openList()}
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
                      onClick={() => education.open()}
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
                  { title: '経歴', action: '+ 経歴追加', onClick: () => career.openList() },
                  { title: '学歴', action: '+ 学歴追加', onClick: () => education.open() },
                  { title: '職務', action: '+ 職務追加', onClick: () => job.open() },
                  { title: '専門分野・スキル', action: '+ 専門分野・スキル追加', onClick: () => skill.open() },
                  { title: '外国語', action: '+ 外国語追加', onClick: () => language.openNew() },
                  { title: 'ウェブサイト・ブログ', action: '+ ウェブサイト・ブログ追加', onClick: () => website.open() },
                  { title: '講義・諮問活動', action: '+ 講義・諮問活動追加', onClick: () => lecture.open() },
                  { title: '論文・著書', action: '+ 論文・著書追加', onClick: () => publication.open() },
                  { title: '記事', action: '+ 記事追加', onClick: () => article.openNew() },
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
                          onClick={section.title === '記事' ? article.openList : section.onClick}
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
                                  onClick={() => language.openExisting(lang)}
                                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => language.deleteLanguage(lang.id)}
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
                                onClick={website.open}
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

                <AwardsSection userProfile={userProfile} awards={awards} />

                <CertificatesSection userProfile={userProfile} certificates={certificates} />

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

      <CareerModals career={career} />

      <EducationModals education={education} />

      <JobModals job={job} />

      <SkillModals skill={skill} userProfile={userProfile} />

      <LanguageModals language={language} />

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
      <WebsiteModals website={website} />

      <LectureModals lecture={lecture} />

      <PublicationModals publication={publication} />

      <ArticleModals article={article} />



      <AwardsModals awards={awards} />

      <CertificatesModals certificates={certificates} />

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

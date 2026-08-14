import React, { useState } from 'react';
import { UserPlus, ThumbsUp, BookOpen, Megaphone, HelpCircle, Headset, UserCircle, CreditCard, MessageSquare, User, Plus, Search, Bell, TrendingUp, Building2, Clock, ChevronRight, Camera, Mail, Loader2, Check, Home, Contact, Share2, BarChart2, GraduationCap, ArrowLeft, Settings, Edit2, UserCog, ChevronDown, X, Trash2, XCircle, Menu, MapPin, Edit3, Users, Download, Phone, History, Sparkles, PenSquare, ShieldCheck, Bookmark, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { signInWithPopup, signInWithCredential, GoogleAuthProvider, onAuthStateChanged, signOut, signInWithCustomToken, linkWithCredential, reauthenticateWithCredential, updatePassword, createUserWithEmailAndPassword, signInWithEmailAndPassword, User as FirebaseUser } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { collection, query, onSnapshot, serverTimestamp, orderBy, where, doc, setDoc, getDoc, updateDoc, arrayUnion, deleteField, deleteDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType, EmailAuthProvider } from './firebase';
import type { Tab, Career, Education, Language, Lecture, Publication, Article, UserProfile, Meishi } from './types/app';
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
import { BottomNav } from './components/layout/BottomNav';
import { DesktopSidebar } from './components/layout/DesktopSidebar';
import { BoardSidebar } from './components/community/BoardSidebar';
import { RecommendedSidebar } from './components/community/RecommendedSidebar';
import { PostDetailOverlay } from './components/community/PostDetailOverlay';
import { WritePostModal } from './components/community/WritePostModal';
import { useCommunityPosts } from './hooks/useCommunityPosts';
import { useCommunityWrite } from './hooks/useCommunityWrite';
import { useNativePush } from './hooks/useNativePush';
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
import { PersonalInfoModals } from './components/profile/PersonalInfoModals';
import { PersonalInfoSection } from './components/profile/PersonalInfoSection';
import { usePersonalInfoEditor } from './hooks/usePersonalInfoEditor';
import { SettingsModals } from './components/settings/SettingsModals';
import { useAccountSettings } from './hooks/useAccountSettings';
import { ProfileOverlay } from './components/profile/ProfileOverlay';
import MeishiScannerModal from './components/MeishiScannerModal';
import { PublicCardView } from './components/PublicCardView';
import { SearchOverlay } from './components/SearchOverlay';
import { PublicCardModal } from './components/profile/PublicCardModal';
import { usePublicCard } from './hooks/usePublicCard';
import { NotificationsPanel } from './components/NotificationsPanel';

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
  const [selectedCommunityBoard, setSelectedCommunityBoard] = useState<string>('all');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const { posts, loading: communityLoading } = useCommunityPosts(selectedCommunityBoard);
  const communityWrite = useCommunityWrite(user, userProfile);
  useNativePush(user);
  const selectedPost = posts.find((p) => p.id === selectedPostId) || null;
  const [loading, setLoading] = useState(true);
  const [loginView, setLoginView] = useState<'main' | 'terms' | 'signup'>('main');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPublicCardOpen, setIsPublicCardOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

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

  // Profile completion is derived from actual saved data, so it survives
  // reloads and can't drift from reality (previously it was a local toggle
  // that reset on every refresh).
  const completedProfileSteps = React.useMemo(() => {
    const steps: number[] = [];
    if (userProfile?.photoURL || user?.photoURL) steps.push(1);
    if (userProfile?.introduction) steps.push(2);
    if (userProfile?.careers?.length) steps.push(3);
    if (userProfile?.totalCareerYears) steps.push(4);
    if (userProfile?.skills?.length) steps.push(5);
    if (userProfile?.educations?.length) steps.push(6);
    return steps;
  }, [userProfile, user]);

  // Editors still call this after saving; completion now derives from data,
  // so there is nothing left to toggle manually.
  const toggleProfileStep = (_step: number) => {};

  const profilePhotoInputRef = React.useRef<HTMLInputElement>(null);
  const handleProfilePhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const resized = await resizeImage(reader.result as string, 400, 400);
        await updateDoc(doc(db, 'users', user.uid), { photoURL: resized });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    };
    reader.readAsDataURL(file);
  };
  const openProfilePhotoPicker = () => profilePhotoInputRef.current?.click();

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
  const personalInfo = usePersonalInfoEditor(user, userProfile);
  const accountSettings = useAccountSettings(user, setActiveTab);
  const publicCard = usePublicCard(user, userProfile, myMeishi);

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

    return () => {
      unsubscribeProfile();
      unsubscribeMeishi();
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
    setLoginError(null);
    try {
      if (Capacitor.isNativePlatform()) {
        // signInWithPopup needs window.open, which WKWebView doesn't support
        // (and Google blocks embedded-webview OAuth anyway) — do native
        // Google Sign-In instead, then hand the ID token to the JS SDK so
        // auth.currentUser/onAuthStateChanged stay the single source of truth.
        const result = await FirebaseAuthentication.signInWithGoogle();
        const idToken = result.credential?.idToken;
        if (!idToken) throw new Error(`No ID token in native Google Sign-In result: ${JSON.stringify(result)}`);
        await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
      } else {
        await signInWithPopup(auth, googleProvider);
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      const detail = [error?.code, error?.message, error?.customData ? JSON.stringify(error.customData) : null]
        .filter(Boolean)
        .join(' | ');
      setLoginError(detail || String(error));
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





  const headerActions = (
    <>
      <button aria-label="検索" onClick={() => setIsSearchOpen(true)} className="p-0 leading-none">
        <Search className="w-6 h-6 text-ink-muted" />
      </button>
      <button aria-label="お知らせ" onClick={() => setIsNotificationsOpen(true)} className="p-0 leading-none">
        <Bell className="w-6 h-6 text-ink-muted" />
      </button>
    </>
  );

  const renderHeader = () => {
    switch (activeTab) {
      case 'today':
        return (
          <header className="bg-surface px-4 h-[52px] flex items-center justify-between sticky top-0 z-10 border-b border-line">
            <h1 className="text-2xl font-bold font-serif tracking-tighter text-primary">Billionaire</h1>
            <div className="flex items-center gap-4">
              {headerActions}
              <button aria-label="メニュー" onClick={accountSettings.openMorePage} className="p-0 leading-none">
                <Menu className="w-6 h-6 text-ink-muted cursor-pointer" />
              </button>
            </div>
          </header>
        );
      case 'meishi':
        return (
          <header className="sticky top-0 z-10 bg-surface border-b border-line">
            <div className="px-4 h-[52px] flex justify-between items-center">
              <h1 className="text-xl font-black tracking-tight text-ink">名刺帳</h1>
              <div className="flex gap-4">
                {headerActions}
                <button aria-label="メニュー" onClick={accountSettings.openMorePage} className="p-0 leading-none">
                  <Menu className="w-6 h-6 text-ink-muted cursor-pointer" />
                </button>
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
                  className={`relative text-sm font-bold whitespace-nowrap pb-2 transition-colors ${activeMeishiTab === tab.id ? 'text-ink' : 'text-ink-faint'}`}
                >
                  {tab.label}
                  {activeMeishiTab === tab.id && (
                    <motion.div
                      layoutId="meishiTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
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
          <header className="sticky top-0 z-10 bg-surface border-b border-line">
            <div className="px-4 h-[52px] flex justify-between items-center">
              <h1 className="text-xl font-black tracking-tight text-ink">コミュニティ</h1>
              <div className="flex gap-4">
                {headerActions}
              </div>
            </div>
          </header>
        );
    }
  };

  const handleEmailSignupComplete = async (email: string, pass: string) => {
    setLoginError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      if (error?.code === 'auth/email-already-in-use') {
        // Existing account: treat the flow as a login attempt instead.
        try {
          await signInWithEmailAndPassword(auth, email, pass);
          return;
        } catch (loginErr: any) {
          console.error('Email login failed:', loginErr);
          setLoginError(loginErr?.code === 'auth/invalid-credential' || loginErr?.code === 'auth/wrong-password'
            ? 'このメールアドレスは登録済みです。パスワードが正しくありません。'
            : loginErr?.message || String(loginErr));
          setLoginView('main');
          return;
        }
      }
      console.error('Email signup failed:', error);
      setLoginError(
        error?.code === 'auth/weak-password' ? 'パスワードは8文字以上で設定してください。'
        : error?.code === 'auth/invalid-email' ? 'メールアドレスの形式が正しくありません。'
        : error?.message || String(error)
      );
      setLoginView('main');
    }
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
        <Loader2 className="w-8 h-8 text-[#0A0A0A] animate-spin" />
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
            <LoginScreen onLogin={handleLogin} onLineLogin={handleLineLogin} onEmailSignup={() => setLoginView('terms')} errorMessage={loginError} />
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
    <div className="min-h-screen bg-canvas text-ink">
      {/* Desktop Web Header Bar (Remember Web Style) */}
      <header className="hidden lg:block w-full bg-primary sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('today')}>
              <h1 className="text-2xl font-black font-serif tracking-tight text-white">Billionaire</h1>
            </div>

            {/* Global Web Search (opens the shared search overlay) */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="relative w-72 xl:w-80 text-left cursor-text"
            >
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <span className="block w-full bg-white/10 border border-transparent hover:bg-white/15 text-gray-400 text-xs pl-9 pr-4 py-2 rounded-full transition-all">
                会社名、お名前、職種、キーワードで検索...
              </span>
            </button>
          </div>

          {/* Main Top Web Navigation Tabs */}
          <nav className="flex items-center gap-1 font-bold text-sm">
            {[
              { id: 'community', label: 'コミュニティ', icon: Share2 },
              { id: 'meishi', label: '名刺/ネットワーク', icon: Contact },
              { id: 'today', label: 'トゥデイ', icon: Home },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as Tab)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-surface text-primary'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
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
              className="flex items-center gap-1.5 px-3 py-2 bg-surface text-primary font-bold text-xs rounded-lg hover:bg-primary-soft transition-colors duration-200"
            >
              <Plus className="w-4 h-4" />
              名刺登録
            </button>

            <button
              onClick={() => {
                setActiveTab('community');
                communityWrite.open(selectedCommunityBoard);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-accent text-white font-bold text-xs rounded-lg hover:opacity-90 transition-colors duration-200"
            >
              <PenSquare className="w-4 h-4" />
              投稿する
            </button>

            <button
              aria-label="お知らせ"
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2 text-gray-300 hover:bg-white/10 hover:text-white rounded-lg cursor-pointer"
            >
              <Bell className="w-5 h-5" />
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-surface text-primary flex items-center justify-center font-bold text-xs">
                {userProfile?.displayName?.[0] || 'B'}
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Responsive Layout Grid (Remember Web Style) */}
      <div className="max-w-7xl mx-auto px-0 lg:px-6 py-0 lg:py-6 flex gap-6 items-start">
        {/* Desktop Left Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-4 sticky top-20">
          {/* User Profile Panel */}
          <div className="bg-surface p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center font-bold text-base">
                {userProfile?.displayName?.[0] || 'B'}
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-1">
                  <h3 className="font-bold text-sm text-ink truncate">
                    {userProfile?.displayName || 'Billionaire User'}
                  </h3>
                  <ShieldCheck className="w-4 h-4 text-success shrink-0" title="認証済み" />
                </div>
                <p className="text-xs text-ink-muted truncate">株式会社サンプル ・ 営業部</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center py-2 px-1 bg-canvas rounded-lg text-xs font-medium text-ink-muted mb-3">
              <div>
                <p className="text-[10px] text-ink-faint">登録名刺</p>
                <p className="font-bold text-ink">{meishis.length}枚</p>
              </div>
              <div>
                <p className="text-[10px] text-ink-faint">コミュニティ</p>
                <p className="font-bold text-ink">{posts.length}件</p>
              </div>
            </div>

            <button
              onClick={() => setIsPublicCardOpen(true)}
              className="w-full py-2 bg-primary-soft text-primary font-bold text-xs rounded-lg hover:bg-line transition-colors duration-200 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              マイ公開デジタル名刺 URL
            </button>
          </div>

          {/* Remember Community Board Navigation */}
          <BoardSidebar
            selectedBoard={selectedCommunityBoard}
            onSelectBoard={(boardId) => {
              setActiveTab('community');
              setSelectedCommunityBoard(boardId);
            }}
          />
        </aside>

        {/* Center Main App Content Container */}
        <div className="flex-1 min-w-0 bg-surface min-h-screen lg:min-h-[850px] overflow-hidden flex flex-col max-w-md lg:max-w-none mx-auto lg:mx-0 shadow-2xl lg:shadow-none w-full">
          {/* Mobile Header (Hidden on Desktop) — pt-safe clears the notch/Dynamic Island in the native app shell */}
          <div className="lg:hidden pt-safe bg-surface">
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
            <CommunityScreen
              key="forum"
              posts={posts}
              loading={communityLoading}
              selectedBoard={selectedCommunityBoard}
              onSelectBoard={setSelectedCommunityBoard}
              onSelectPost={setSelectedPostId}
              onOpenWrite={() => communityWrite.open(selectedCommunityBoard)}
            />
          )}

          {activeTab === 'today' && (
            <TodayScreen
              key="today"
              user={user}
              photoURL={userProfile?.photoURL || user.photoURL || undefined}
              completedProfileSteps={completedProfileSteps}
              onOpenProfile={() => setIsProfileOpen(true)}
              onOpenIntroEdit={() => setIsIntroEditOpen(true)}
              onOpenCareerList={() => career.openList()}
              onOpenEducationEdit={() => education.open()}
              onOpenSkillEdit={() => skill.open()}
              onPickProfilePhoto={openProfilePhotoPicker}
              onOpenMyMeishiCamera={handleOpenMyMeishiCamera}
              onOpenMeishiCamera={handleOpenMeishiCamera}
            />
          )}
        </AnimatePresence>
      </main>
        </div>

        {/* Desktop Right Sidebar (Remember Web Style) */}
        {activeTab === 'community' ? (
          <RecommendedSidebar posts={posts} onSelectPost={setSelectedPostId} />
        ) : (
          <DesktopSidebar posts={posts} onSelectPost={(postId) => setSelectedPostId(postId)} />
        )}
      </div>

      <AnimatePresence>
        {selectedPost && (
          <PostDetailOverlay
            key="post-detail"
            post={selectedPost}
            user={user}
            userProfile={userProfile}
            onBack={() => setSelectedPostId(null)}
          />
        )}
      </AnimatePresence>

      <WritePostModal write={communityWrite} onPosted={(postId) => setSelectedPostId(postId)} />

      <AnimatePresence>
        {isSearchOpen && (
          <SearchOverlay
            key="search"
            meishis={meishis}
            posts={posts}
            onClose={() => setIsSearchOpen(false)}
            onSelectMeishi={(meishi) => setSelectedMeishiForDetail(meishi)}
            onSelectPost={(postId) => setSelectedPostId(postId)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNotificationsOpen && (
          <NotificationsPanel key="notifications" onClose={() => setIsNotificationsOpen(false)} />
        )}
      </AnimatePresence>

      <PublicCardModal
        isOpen={isPublicCardOpen}
        onClose={() => setIsPublicCardOpen(false)}
        publicCard={publicCard}
        onPreview={(handle) => { setIsPublicCardOpen(false); setPublicHandle(handle); }}
        hasMyMeishi={!!myMeishi}
      />

      {/* Hidden profile-photo picker (triggered from Today card / profile overlay) */}
      <input
        ref={profilePhotoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleProfilePhotoSelected}
      />

      {/* Bottom Navigation (Mobile Only) */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        isEditMode={isEditMode}
        onOpenMoreMenu={() => setIsMoreMenuOpen(true)}
      />

      <ProfileOverlay
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        userProfile={userProfile}
        myMeishi={myMeishi}
        profileTab={profileTab}
        onChangeProfileTab={setProfileTab}
        completedProfileSteps={completedProfileSteps}
        onPickProfilePhoto={openProfilePhotoPicker}
        onOpenIntroEdit={() => setIsIntroEditOpen(true)}
        onOpenCamera={handleOpenMyMeishiCamera}
        onDeleteMyMeishi={() => setIsMyMeishiDeleteDialogOpen(true)}
        career={career}
        education={education}
        job={job}
        skill={skill}
        language={language}
        website={website}
        lecture={lecture}
        publication={publication}
        article={article}
        awards={awards}
        certificates={certificates}
        personalInfo={personalInfo}
        myPosts={posts.filter(p => p.authorId === user.uid)}
        onSelectPost={(postId) => setSelectedPostId(postId)}
        onOpenPublicCard={() => setIsPublicCardOpen(true)}
        publicHandle={publicCard.handle}
      />

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
            className="fixed inset-0 bg-gray-50 z-[60] overflow-y-auto no-scrollbar max-w-md mx-auto pt-safe"
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
                className="text-[#0A0A0A] font-bold text-sm"
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
                className={`w-12 h-6 rounded-full transition-colors relative ${isJobSeekingIntro ? 'bg-[#0A0A0A]' : 'bg-gray-200'}`}
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

      <SettingsModals settings={accountSettings} user={user} onOpenProfileManagement={() => { setProfileTab(1); setIsProfileOpen(true); }} />
      <WebsiteModals website={website} />

      <LectureModals lecture={lecture} />

      <PublicationModals publication={publication} />

      <ArticleModals article={article} />



      <AwardsModals awards={awards} />

      <CertificatesModals certificates={certificates} />

      <PersonalInfoModals personalInfo={personalInfo} />


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
                  <div className="w-12 h-12 rounded-full bg-[#0A0A0A]/10 flex items-center justify-center text-[#0A0A0A]">
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
            className="fixed inset-0 bg-white z-[300] flex flex-col pt-safe"
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
            onSaveMemo={(memo) => {
              const updated = { ...selectedMeishiForDetail, memo };
              setMeishis(prev => prev.map(m => m.id === updated.id ? updated : m));
              setSelectedMeishiForDetail(updated);
              updateDoc(doc(db, 'meishi', updated.id), { memo, updatedAt: serverTimestamp() })
                .catch(error => handleFirestoreError(error, OperationType.UPDATE, `meishi/${updated.id}`));
            }}
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
            className="fixed inset-0 bg-black/90 z-[300] flex flex-col items-center justify-center text-white pt-safe"
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
                    accountSettings.openSimpleLoginSettings();
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

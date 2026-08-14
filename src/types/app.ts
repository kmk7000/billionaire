// UI-level types used by the app shell (distinct from Firestore models in db.ts)
export type Tab = 'today' | 'meishi' | 'community';

export interface Career {
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

export interface Education {
  id: string;
  schoolName: string;
  degree?: string;
  major?: string;
  startDate?: string; // YYYY
  endDate?: string; // YYYY
  isCurrent: boolean;
  description?: string;
}

export interface Language {
  id: string;
  language: string;
  level: string;
}

export interface Lecture {
  id: string;
  title: string;
  date: string;
}

export interface Publication {
  id: string;
  title: string;
  date: string;
}

export interface Article {
  id: string;
  title: string;
  url: string;
}

export interface UserProfile {
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

export interface Meishi {
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
  memo?: string;
  isMyCard?: boolean;
  updatedAt: string;
  createdAt?: any;
  lat?: number;
  lng?: number;
  history?: Meishi[];
}

export interface Post {
  id: string;
  category: string;
  title: string;
  content: string;
  authorCompany: string;
  likes: number;
  comments: number;
  createdAt: string;
}

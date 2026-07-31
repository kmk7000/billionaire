// Firestore Data Models for Billionaire (ビリオネア)
// Strictly typed interfaces matching firestore.rules and firebase-blueprint.json

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  locale?: string; // default 'ja'
  createdAt: any;
  updatedAt: any;
}

export interface Company {
  id: string;
  name: string;
  nameKana?: string;
  corporateNumber?: string;
  domains: string[];
  industryCode?: string;
  employeeRange?: string;
  prefecture?: string;
  verified: boolean;
}

export interface Employment {
  id: string;
  userId: string;
  companyId: string;
  companyName: string;
  department?: string;
  section?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  verificationStatus: 'none' | 'pending' | 'verified' | 'rejected';
  verificationMethod?: 'email' | 'card' | 'document';
  verifiedAt?: any;
}

export interface DigitalCard {
  id: string;
  userId: string;
  employmentId?: string;
  handle: string; // unique public link ID
  companyName: string;
  companyNameKana?: string;
  department?: string;
  title?: string;
  lastName: string;
  firstName: string;
  lastNameKana?: string;
  firstNameKana?: string;
  email: string;
  telCompany?: string;
  telMobile?: string;
  address?: string;
  website?: string;
  introText?: string;
  templateId: string; // design template 1-5
  isPublic: boolean;
  viewCount: number;
  qrCodeUrl?: string;
  createdAt: any;
  updatedAt: any;
}

export interface ContactCard {
  id: string;
  ownerId: string; // The user who saved this card
  source: 'ocr' | 'qr' | 'manual' | 'import';
  rawImageFrontUrl?: string;
  rawImageBackUrl?: string;
  companyName: string;
  companyNameKana?: string;
  department?: string;
  title?: string;
  lastName: string;
  firstName: string;
  lastNameKana?: string;
  firstNameKana?: string;
  email?: string;
  telCompany?: string;
  telMobile?: string;
  postalCode?: string;
  address?: string;
  website?: string;
  metAt?: string; // YYYY-MM-DD
  metPlace?: string;
  memo?: string;
  tags?: string[];
  confidence?: Record<string, number>;
  linkedUserId?: string; // if exchanged with a registered Billionaire user
  createdAt: any;
  updatedAt: any;
}

export interface CommunityBoard {
  id: string;
  type: 'company' | 'industry' | 'topic' | 'qa';
  key: string;
  nameJa: string;
  description: string;
  companyId?: string;
  accessRule?: {
    verifiedCompanyOnly?: boolean;
    industryCodes?: string[];
  };
}

export interface CommunityPost {
  id: string;
  boardId: string;
  authorId: string; // Never exposed to other clients directly
  anonHandle: string; // e.g. "匿名の営業部長"
  authorLabel: string; // e.g. "IT業界 ・ 営業" or "株式会社サンプル (認証済)"
  companyVerified: boolean;
  title: string;
  body: string;
  images?: string[];
  poll?: {
    options: { text: string; votes: number }[];
    totalVotes: number;
  };
  likeCount: number;
  commentCount: number;
  status: 'published' | 'held' | 'hidden' | 'deleted';
  createdAt: any;
  updatedAt: any;
}

export interface CommunityComment {
  id: string;
  postId: string;
  parentId?: string; // For nested replies
  authorId: string;
  anonHandle: string;
  authorLabel: string;
  companyVerified: boolean;
  body: string;
  likeCount: number;
  status: 'published' | 'held' | 'hidden' | 'deleted';
  createdAt: any;
}

export interface ReportItem {
  id: string;
  reporterId: string;
  targetType: 'post' | 'comment' | 'user' | 'card';
  targetId: string;
  reason: 'inappropriate' | 'harassment' | 'spam' | 'confidential_leak' | 'impersonation';
  detail?: string;
  status: 'open' | 'reviewing' | 'actioned' | 'dismissed';
  handledBy?: string;
  handledAt?: any;
  createdAt: any;
}

export interface UserBlock {
  id: string; // `${blockerId}_${blockedId}`
  blockerId: string;
  blockedId: string;
  createdAt: any;
}

# CareerBridge Japan (Billionaire)

일본 시장용 전자명함 + 직장인 익명 커뮤니티 웹앱. Google AI Studio에서 생성된 프로젝트를 Claude Code로 이관하여 개발을 이어간다.
제품 마스터 명세는 [docs/SPEC.md](docs/SPEC.md) 참고.

## 실행 방법

```bash
npm install        # 의존성 설치
npm run dev        # 개발 서버 (Express + Vite middleware, http://localhost:3000)
npm run build      # 프로덕션 빌드 (vite build → dist/)
npm run lint       # 타입 체크 (tsc --noEmit)
```

환경변수는 `.env.local`에 설정 (`.env.example` 참고):
- `GEMINI_API_KEY` — 명함 OCR (Gemini) 기능에 필요
- `LINE_CLIENT_ID` / `LINE_CLIENT_SECRET` / `APP_URL` — LINE 로그인 (server.ts)
- `VITE_GOOGLE_MAPS_API_KEY` — 지도 기능
- `FIREBASE_SERVICE_ACCOUNT_KEY` — 서버측 커스텀 토큰 발급 (LINE 로그인용, 선택)

## 기술 스택

- React 19 + TypeScript (strict) + Vite 6 + Tailwind CSS 4 (`@tailwindcss/vite`)
- Firebase (Auth + Firestore) — 설정: `firebase-applet-config.json`, 초기화: `src/firebase.ts`
- Gemini API (`@google/genai`) — 명함 OCR
- Express (`server.ts`) — 개발 서버 + LINE OAuth 콜백 처리
- lucide-react (아이콘), motion (애니메이션), @react-google-maps/api (지도)

## 구조

```
server.ts                        # Express 서버: LINE OAuth + Vite middleware
firestore.rules                  # Firestore 보안 규칙
src/
├── App.tsx                      # 앱 셸 + 상태 허브 (~1,560줄. 8,298줄 원본에서 81% 감소)
├── firebase.ts                  # Firebase 초기화 + 에러 핸들러
├── types/
│   ├── db.ts                    # Firestore 데이터 모델 타입
│   └── app.ts                   # UI 레벨 타입 (Meishi, UserProfile, Post, Job 등)
├── constants/
│   ├── theme.ts                 # 디자인 토큰
│   ├── profileData.ts           # 선택지 목록 (기업/대학/직종/도도부현 등)
│   └── mockData.ts              # 목 데이터
├── screens/                     # 탭 화면: Today, MeishiList, Community, Connect, Jobs
├── components/
│   ├── auth/                    # LoginScreen, TermsAgreement, EmailSignup
│   ├── meishi/                  # MeishiCard, MeishiDetailView, MeishiEditView, MeishiMapView
│   ├── community/               # BoardSidebar, BoardChipBar, PostCard, BestPostsSection,
│   │                             # RecommendedSidebar, PostDetailOverlay, CommentThread,
│   │                             # WritePostModal (리멤버 커뮤니티 웹 벤치마킹, docs/SPEC.md §2.2A)
│   ├── jobs/ layout/             # JobCard, BottomNav, DesktopSidebar
│   ├── settings/                # SettingsModals (더보기→설정→계정관리→탈퇴, 비밀번호 변경/재설정)
│   ├── profile/                 # ProfileOverlay(마이프로필 오버레이 골격) + MyMeishiTab +
│   │                             # ProfileDetailsTab + 도메인별 XxxModals/XxxSection 12종
│   │                             # (Career/Education/Skill/Job/Language/Website/Lecture/
│   │                             # Publication/Article/Awards/Certificates/PersonalInfo)
│   └── (루트)                    # MeishiScannerModal, PublicCardView, SimpleLoginSettings
├── services/firestoreService.ts # Firestore CRUD
├── constants/communityBoards.ts # 리멤버 벤치마킹 11개 게시판 정적 목록 (Firestore 컬렉션 아님)
├── hooks/                       # useMeishiScanner(OCR), useContactsData, useCommunityPosts,
│                                 # useCommunityComments, useCommunityWrite,
│                                 # useCareerEditor, useEducationEditor, useSkillEditor, useJobEditor,
│                                 # useLanguageEditor, useWebsiteEditor, useLectureEditor,
│                                 # usePublicationEditor, useArticleEditor, useAwardsEditor,
│                                 # useCertificatesEditor, usePersonalInfoEditor,
│                                 # useAccountSettings (편집 상태+Firestore/Auth 저장)
└── utils/                       # imageUtils, anonHandle(익명 닉네임 생성), formatRelativeTime
```

## 알려진 이슈 / 이관 시 주의사항

1. **`src/App.tsx` 분리 리팩토링 완료** (8,298줄 → 1,563줄, 원본 대비 81% 감소). 프로필 편집 모달 12종(경력·학력·스킬·직무·언어·웹사이트·강연·출판·기사·수상·자격증·개인정보) + 설정/계정관리 1종을 각각 `useXxxEditor`/`useXxx` 훅과 `XxxModals`(+필요 시 `XxxSection`) 컴포넌트로 분리했고, 이 섹션들을 담던 마이프로필 오버레이 자체도 `components/profile/ProfileOverlay.tsx`(골격) + `MyMeishiTab.tsx`(마이名刺 탭) + `ProfileDetailsTab.tsx`(プロフィール 탭)로 분리했다. App.tsx에는 이제 최상위 라우팅·인증 상태·명함 CRUD·초기 렌더링 셸만 남아있다. 새 도메인을 추가할 때는 이 패턴(도메인 전용 훅으로 state+Firestore 핸들러를 캡슐화 → 그 훅을 받는 순수 프레젠테이션 `XxxModals` 컴포넌트)을 그대로 따를 것.
2. **Firebase 프로젝트가 AI Studio 관리 프로젝트** (`ai-studio-applet-webapp-c0fee`) — 데이터가 Google 관리 인프라에 있음. 정식 출시 전 자체 Firebase 프로젝트로 이전 필요 (config 교체 + `firestore.rules` 배포).
3. **`GEMINI_API_KEY`가 클라이언트 번들에 주입됨** (`vite.config.ts`의 `define`) — 배포 시 키가 노출된다. OCR 호출을 서버 라우트로 옮겨야 함.
4. **LINE Client ID가 `server.ts`에 하드코딩** (`"2009585479"`) — env 변수 `LINE_CLIENT_ID`를 읽도록 수정 필요.
5. i18n 미적용 — 사용자 노출 문자열이 App.tsx에 하드코딩되어 있음 (SPEC은 `ja.json` 분리 요구).
6. **커뮤니티 기능은 리멤버(Remember) 웹(`community.rememberapp.co.kr`) 구조를 벤치마킹해 전면 구축 완료** — 게시판 사이드바/칩바, 베스트 투고 랭킹, 새 투고/추천 투고 피드, 게시글 상세+댓글, 글쓰기, 신고/차단까지 동작한다. **단, `firestore.rules`를 프로덕션 Firebase 프로젝트에 아직 배포하지 않았다.** 로컬에서 `authorUid`/`content` → `authorId`/`body` 필드 불일치 버그를 고치고 `comments`/`reports`/`blocks` 규칙을 추가했지만, 배포 전까지는 게시글 작성이 "Missing or insufficient permissions"로 실패한다 (브라우저로 직접 검증 완료). 배포 명령: `firebase deploy --only firestore:rules`.

## 코딩 규칙 (docs/SPEC.md §9 요약)

- TypeScript strict, `any` 금지
- 일본어 카피는 정중체(です・ます), 버튼 라벨은 동사형 (「保存する」 등)
- 명함 데이터의 크로스 유저 노출 금지, `posts.author_id` 클라이언트 반환 금지
- 커밋 메시지는 Conventional Commits

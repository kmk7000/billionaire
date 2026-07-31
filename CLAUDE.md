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
├── App.tsx                      # ⚠️ 앱 셸 + 상태 허브 (~5,600줄, 분리 리팩토링 진행 중)
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
│   ├── community/ jobs/ layout/ # ForumPost, JobCard, BottomNav, DesktopSidebar
│   └── (루트)                    # MeishiScannerModal, PublicCardView, SimpleLoginSettings
├── services/firestoreService.ts # Firestore CRUD
├── hooks/                       # useMeishiScanner(OCR), useContactsData, useCommunityPosts
└── utils/imageUtils.ts          # 이미지 처리
```

## 알려진 이슈 / 이관 시 주의사항

1. **`src/App.tsx` 분리 리팩토링 진행 중** (8,298줄 → 현재 ~5,600줄). 남은 큰 덩어리는 마이프로필 오버레이(`isProfileOpen`)와 약 40개의 편집 모달(`{isXxxOpen && (...)}` 블록, 약 4,000줄). 다음 단계: 각 모달을 관련 로컬 상태·저장 핸들러와 함께 컴포넌트로 이동 (경력/학력/스킬/설정 등 도메인 단위로).
2. **Firebase 프로젝트가 AI Studio 관리 프로젝트** (`ai-studio-applet-webapp-c0fee`) — 데이터가 Google 관리 인프라에 있음. 정식 출시 전 자체 Firebase 프로젝트로 이전 필요 (config 교체 + `firestore.rules` 배포).
3. **`GEMINI_API_KEY`가 클라이언트 번들에 주입됨** (`vite.config.ts`의 `define`) — 배포 시 키가 노출된다. OCR 호출을 서버 라우트로 옮겨야 함.
4. **LINE Client ID가 `server.ts`에 하드코딩** (`"2009585479"`) — env 변수 `LINE_CLIENT_ID`를 읽도록 수정 필요.
5. i18n 미적용 — 사용자 노출 문자열이 App.tsx에 하드코딩되어 있음 (SPEC은 `ja.json` 분리 요구).

## 코딩 규칙 (docs/SPEC.md §9 요약)

- TypeScript strict, `any` 금지
- 일본어 카피는 정중체(です・ます), 버튼 라벨은 동사형 (「保存する」 등)
- 명함 데이터의 크로스 유저 노출 금지, `posts.author_id` 클라이언트 반환 금지
- 커밋 메시지는 Conventional Commits

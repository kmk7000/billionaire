# CareerBridge Japan (Billionaire)

일본 시장용 전자명함 + 직장인 익명 커뮤니티 웹앱. Google AI Studio에서 생성된 프로젝트를 Claude Code로 이관하여 개발을 이어간다.
제품 마스터 명세는 [docs/SPEC.md](docs/SPEC.md) 참고.

## 실행 방법

```bash
npm install        # 의존성 설치
npm run dev        # 개발 서버 (Express + Vite middleware, http://localhost:3000)
npm run build      # 프로덕션 빌드 (vite build → dist/)
npm run lint       # 타입 체크 (tsc --noEmit)

# 네이티브 앱 (Capacitor)
npm run cap:sync    # 웹 빌드 후 ios/android 네이티브 프로젝트에 동기화
npm run cap:ios     # 동기화 후 Xcode로 ios/App/App.xcworkspace 열기
npm run cap:android # 동기화 후 Android Studio로 android/ 열기
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
│   └── app.ts                   # UI 레벨 타입 (Meishi, UserProfile, Post 등)
├── constants/
│   ├── theme.ts                 # 디자인 토큰
│   ├── profileData.ts           # 선택지 목록 (기업/대학/직종/도도부현 등)
│   └── mockData.ts              # 목 데이터
├── screens/                     # 탭 화면: Today, MeishiList, Community
├── components/
│   ├── auth/                    # LoginScreen, TermsAgreement, EmailSignup
│   ├── meishi/                  # MeishiCard, MeishiDetailView, MeishiEditView, MeishiMapView
│   ├── community/               # BoardSidebar, BoardChipBar, PostCard, BestPostsSection,
│   │                             # RecommendedSidebar, PostDetailOverlay, CommentThread,
│   │                             # WritePostModal (리멤버 커뮤니티 웹 벤치마킹, docs/SPEC.md §2.2A)
│   ├── layout/                  # BottomNav, DesktopSidebar
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
6. **採用公告(구인정보)/コネクト(커넥트) 탭은 의도적으로 제거된 상태** — 둘 다 정적 스텁이었고(구인정보는 하드코딩 목데이터 렌더링만, 커넥트는 문구 한 줄) 나중에 실제 기능으로 다시 만들 예정이라 우선 삭제했다. `Tab` 타입(`src/types/app.ts`)에서 `'connect'`/`'jobs'`를 뺐고, `BottomNav`/데스크톱 헤더 내비게이션/`App.tsx`의 탭 렌더링에서도 제거했다. 관련 파일(`ConnectScreen.tsx`, `JobsScreen.tsx`, `components/jobs/JobCard.tsx`, `Job` 타입, `MOCK_JOBS`)은 완전히 삭제했으며, 필요해지면 git 히스토리에서 복원하거나 새로 설계해서 추가할 것.
7. **커뮤니티 기능은 리멤버(Remember) 웹(`community.rememberapp.co.kr`) 구조를 벤치마킹해 전면 구축 완료** — 게시판 사이드바/칩바, 베스트 투고 랭킹, 새 투고/추천 투고 피드, 게시글 상세+댓글, 글쓰기, 신고/차단까지 동작한다. `firestore.rules`의 `authorUid`/`content` → `authorId`/`body` 필드 불일치 버그를 고치고 `comments`/`reports`/`blocks` 규칙을 추가한 뒤 프로덕션 Firebase 프로젝트에 배포 완료(`firebase deploy --only firestore:rules`) — 브라우저에서 실제 글쓰기/댓글/좋아요/신고/차단까지 전부 검증됨. 데스크톱 레이아웃은 리멤버 실제 사이트를 DOM까지 조사해 검정 헤더+플랫 패널(둥근 모서리/그림자 없이 여백으로만 구분) 스타일로 맞춰뒀다(모바일은 기존 카드 스타일 유지).
8. **Capacitor로 iOS/Android 네이티브 셸 통합 완료** — 기존 웹 코드를 다시 만들지 않고 그대로 `ios/`, `android/` 네이티브 프로젝트로 감쌌다(`capacitor.config.ts`, appId `com.billionaire.app`). 카메라 사용 목적 문구(`Info.plist`의 `NSCameraUsageDescription` 등, `AndroidManifest.xml`의 `CAMERA` 권한)를 넣어 애플 심사에서 요구하는 최소한의 네이티브 통합을 갖췄고, `@capacitor/push-notifications`로 네이티브 푸시 등록까지 붙였다(`src/hooks/useNativePush.ts` — 기기 토큰을 `users/{uid}.pushToken`에 저장). 다음 단계로 필요한 것:
   - **iOS**: Xcode(설치돼 있음)로 `npm run cap:ios` → 서명(Signing & Capabilities)에 개발자 계정 연결, Push Notifications capability 추가, 실기기/시뮬레이터 빌드 확인.
   - **Android**: Android Studio가 이 환경에 설치되어 있지 않음(`ANDROID_HOME` 미설정) — 사용자가 Android Studio 설치 후 `npm run cap:android`로 프로젝트를 열어야 빌드/실행 가능.
   - **푸시 발송 서버**: 지금은 클라이언트가 기기 토큰을 저장하는 부분까지만 되어 있고, 실제로 알림을 "보내는" 쪽(Firebase Cloud Messaging 연동, 커뮤니티 좋아요/댓글 시 서버에서 발송)은 아직 없음 — 별도 작업 필요.
   - **LINE 로그인**: `server.ts`의 `/api/auth/line/url` 콜백은 배포된 HTTPS 서버가 있어야 네이티브 앱에서도 동작한다(로컬호스트로는 불가) — 서버 배포가 선행되어야 함.
   - 명함 스캔은 기존 `getUserMedia` 기반 커스텀 카메라 UI를 그대로 재사용 중이며(Capacitor 네이티브 셸 안에서는 카메라 권한이 PWA와 달리 앱 단위로 영구 저장되므로 이것만으로도 안정성 문제가 크게 개선됨), `@capacitor/camera` 플러그인으로 교체하는 건 필요해지면 나중에 고려.
9. **디자인 토큰 시스템** — 색상/그림자/radius 토큰이 `src/index.css`의 Tailwind 4 `@theme` 블록에 정의되어 있다(`ink`/`ink-muted`/`ink-faint`/`line`/`surface`/`canvas`/`primary`/`primary-soft`/`accent`(朱色)/`success`/`warning`/`danger`). 새 UI는 반드시 이 토큰 클래스(`text-ink`, `bg-canvas` 등)를 쓰고 `gray-*`/`bg-white`/`bg-black`/hex 하드코딩을 금지. 구 `src/constants/theme.ts`는 삭제됨.
10. **스텁/빈 기능 정리 완료 (2026-08)** — 검색(`SearchOverlay`: 명함+커뮤니티 통합, 모바일 3개 헤더+데스크톱 헤더 연결), 알림 패널(`NotificationsPanel`: 정직한 빈 상태, 가짜 배지 제거), 명함 상세 메모(Firestore `meishi.memo`)와 tel/sms/mailto 액션, 이메일 실제 가입(createUserWithEmailAndPassword), 프로필 완성도(로컬 토글 → 실데이터 파생), 프로필 사진 업로드(리사이즈 후 users.photoURL에 dataURL 저장), 마이프로필 投稿 탭(내 게시글 목록). 가짜 데이터(팔로워 128/129, 가짜 제안 배너, 목 트렌딩, 가짜 커뮤니티 카테고리 탭) 제거됨. **아직 스텁인 것**: チーム名刺帳/グループ連絡先(準備中), 프로필 履歴書管理/お知らせ 탭(準備中です), 알림 백엔드, 알림 백엔드.
11. **공개 디지털 명함 / 유저별 핸들 구현 완료 (2026-08)** — `my_cards/{uid}`(유저당 1장, 문서 ID가 uid라 list 쿼리 불필요) + `handles/{handle}`(문서 ID가 핸들 자체, `create`만 허용해 트랜잭션 없이 원자적 유일성 보장). 규칙 배포 완료. 카드 내용은 마이 명함(`meishi.isMyCard`)+프로필에서 파생되며, 원본이 바뀌면 `isStale`로 감지해 「最新の内容に更新する」로 재동기화한다(자동 저장 안 함). 비공개 전환 시 URL을 알아도 404. 진입점: 데스크톱 좌측 사이드바 버튼 + 마이프로필 マイ名刺タブ의 「マイ名刺を共有する」. 관련 파일: `hooks/usePublicCard.ts`, `components/profile/PublicCardModal.tsx`, `services/firestoreService.ts`의 `handleService`.
    - **주의**: `tsconfig.json`에 `strict`가 꺼져 있어 판별 유니온(`{ok:true}|{ok:false,reason}`) 내로잉이 동작하지 않는다. `HandleCheck`는 옵셔널 필드 인터페이스로 정의했다. (CLAUDE.md 코딩 규칙의 "TypeScript strict"와 실제 tsconfig가 불일치 — 정리 필요)

## 코딩 규칙 (docs/SPEC.md §9 요약)

- TypeScript strict, `any` 금지
- 일본어 카피는 정중체(です・ます), 버튼 라벨은 동사형 (「保存する」 등)
- 명함 데이터의 크로스 유저 노출 금지, `posts.author_id` 클라이언트 반환 금지
- 커밋 메시지는 Conventional Commits

# CareerBridge Japan (Billionaire)

일본 시장용 전자명함 + 직장인 익명 커뮤니티 웹앱. Google AI Studio에서 생성된 프로젝트를 Claude Code로 이관하여 개발을 이어간다.
제품 마스터 명세는 [docs/SPEC.md](docs/SPEC.md) 참고.

## 실행 방법

```bash
npm install        # 의존성 설치
npm run dev        # 개발 서버 (Express + Vite middleware, http://localhost:3000)
npm run build      # 앱 프로덕션 빌드 (vite build → dist/)
npm run build:admin # 관리 콘솔 빌드 (→ dist-admin/, 앱과 별도 배포)
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
3. ~~`GEMINI_API_KEY`가 클라이언트 번들에 주입됨~~ **해결됨 (2026-08)** — `GoogleGenAI` 호출을 `server.ts`의 `POST /api/ocr/meishi`(명함 OCR) / `POST /api/ocr/card-corners`(자동 스캔 윤곽 검출)로 이전. 키는 서버 프로세스의 `process.env`에만 존재하고 클라이언트 번들에는 전혀 주입되지 않는다(`vite.config.ts`의 `define` 제거). 두 라우트 모두 `admin.auth().verifyIdToken`으로 Firebase ID 토큰을 요구하고, uid별 인메모리 레이트리밋(10분에 30회)을 건다 — 단, 이 레이트리밋은 단일 프로세스 기준이라 서버를 여러 인스턴스로 스케일하면 재설계 필요. 클라이언트는 `src/services/ocrClient.ts`(fetch + ID 토큰 첨부)를 통해 호출한다.
4. **LINE 로그인 (2026-08 배포 완료, 단 자격증명 미설정)** — 라우트는 `functions/src/lineRoutes.ts`로 옮겨 OCR과 같은 함수에 배포돼 있다. dev 서버와 배포본이 같은 라우터를 mount한다.
    - **하드코딩된 Client ID(`"2009585479"`)는 제거**했다. 이제 `LINE_CLIENT_ID`/`LINE_CLIENT_SECRET`을 Secret Manager에서 읽는다.
    - **아직 동작하지 않는다. 실제로 한 번도 동작한 적이 없다** — `.env.local`의 `LINE_CLIENT_SECRET`이 계속 비어 있었으므로 토큰 교환이 항상 실패했다. 현재 배포된 시크릿은 **공백 placeholder**(시크릿이 존재해야 배포가 되므로)라 두 라우트 모두 `503 LINE login is not configured`를 명확히 반환한다.
    - 켜려면: LINE Developers 콘솔에서 Channel ID/Secret을 받아 `firebase functions:secrets:set LINE_CLIENT_ID` / `LINE_CLIENT_SECRET` 후 재배포하고, 콜백 URL `https://asia-northeast1-ai-studio-applet-webapp-c0fee.cloudfunctions.net/api/api/auth/line/callback`을 LINE 콘솔에 **바이트 단위로 동일하게** 등록해야 한다.
    - **공개 엔드포인트가 되면서 고친 보안 결함 3건** (localhost에선 넘어갔지만 인터넷에 열리면 실제 취약점):
      - `state`가 리터럴 `'random_state'`였다(코드에 "실제 앱에선 랜덤값 쓰라"는 주석까지 있었다). 누구나 콜백을 위조할 수 있다. 지금은 **HMAC 서명 + 10분 만료**이고 검증 실패 시 코드 교환 자체를 하지 않는다.
      - `postMessage(..., '*')`로 커스텀 토큰을 뿌렸다 — 이 창을 연 어떤 오리진이든 Firebase 자격증명을 읽을 수 있었다. 지금은 **여는 쪽 오리진을 서명된 state 안에 담아** 발급 시 허용목록과 대조하고, 그 오리진에만 postMessage한다.
      - 토큰을 `<script>` 문자열에 그대로 보간했다. 지금은 `JSON.stringify`로 인코딩한다.
      - 검증: 허용 오리진 200 / 비허용 403 / 위조 state 400 / state 안의 오리진 변조 400 / state 없음 400 / 정상 state는 LINE까지 도달.
    - **네이티브는 딥링크 흐름으로 별도 구현 (2026-08)** — 웹의 팝업+`postMessage`는 네이티브에서 원리상 불가능하다(WKWebView에 `window.open`이 없고, 돌려줄 opener도 없다). 앱은 `@capacitor/browser`로 시스템 브라우저를 열고, 콜백이 커스텀 스킴 `com.billionaire.app://line-auth`로 앱에 돌아온다(`@capacitor/app`의 `appUrlOpen`). 구현: `src/services/lineAuth.ts`.
      - **딥링크에 커스텀 토큰을 실으면 안 된다.** 커스텀 스킴은 **독점이 아니라서** 같은 스킴을 등록한 다른 앱이 리다이렉트를 가로챌 수 있고, Firebase 커스텀 토큰은 그 계정으로의 완전한 로그인 자격증명이다. 그래서 딥링크에는 **일회용 code만** 싣고, 앱이 HTTPS로 `POST /api/auth/line/exchange`에 `{code, verifier}`를 보내 교환한다(PKCE 방식 — 시작할 때 `SHA-256(verifier)`를 challenge로 커밋해두고 마지막에 verifier를 제시). 가로챈 쪽은 **쓸 수 없는 code만** 얻는다.
      - **verifier가 틀려도 code는 소모된다** — 무차별 대입 여지를 없앤다. 만료/미존재/재사용 응답 메시지를 동일하게 해 code 존재 여부도 노출하지 않는다.
      - 검증: challenge 없는 native 요청 400 / 잘못된 verifier 403(+code 소모 확인) / 올바른 verifier 200 / 재사용 400 / 만료 400 / 미존재 400.
      - **iOS `Info.plist`에 `com.billionaire.app` 스킴 등록** 필요(구글 로그인 스킴과 별개로 추가함).
      - **`line_auth_codes` 컬렉션에는 규칙을 두지 않는다** — 기본 거부(`match /{path=**}`)에 걸려 클라이언트는 접근 불가하고 Admin SDK만 읽고 쓴다. `take()`는 트랜잭션 안에서 삭제해 동시성에서도 일회용을 보장한다.
      - **`getFirestore()`를 인자 없이 쓰면 안 된다.** 이 프로젝트의 Firestore는 `(default)`가 아니라 **이름 있는 데이터베이스**(`firebase.json`의 `firestore.database` 참고)다. 인자 없이 호출하면 존재하지 않는 `(default)`를 보고 **원인을 전혀 알 수 없는 `5 NOT_FOUND`**로 500이 난다. 배포 후 실제로 밟았고 로그를 보고서야 찾았다.
5. i18n 미적용 — 사용자 노출 문자열이 App.tsx에 하드코딩되어 있음 (SPEC은 `ja.json` 분리 요구).
6. **採用公告(구인정보)/コネクト(커넥트) 탭은 의도적으로 제거된 상태** — 둘 다 정적 스텁이었고(구인정보는 하드코딩 목데이터 렌더링만, 커넥트는 문구 한 줄) 나중에 실제 기능으로 다시 만들 예정이라 우선 삭제했다. `Tab` 타입(`src/types/app.ts`)에서 `'connect'`/`'jobs'`를 뺐고, `BottomNav`/데스크톱 헤더 내비게이션/`App.tsx`의 탭 렌더링에서도 제거했다. 관련 파일(`ConnectScreen.tsx`, `JobsScreen.tsx`, `components/jobs/JobCard.tsx`, `Job` 타입, `MOCK_JOBS`)은 완전히 삭제했으며, 필요해지면 git 히스토리에서 복원하거나 새로 설계해서 추가할 것.
7. **커뮤니티 기능은 리멤버(Remember) 웹(`community.rememberapp.co.kr`) 구조를 벤치마킹해 전면 구축 완료** — 게시판 사이드바/칩바, 베스트 투고 랭킹, 새 투고/추천 투고 피드, 게시글 상세+댓글, 글쓰기, 신고/차단까지 동작한다. `firestore.rules`의 `authorUid`/`content` → `authorId`/`body` 필드 불일치 버그를 고치고 `comments`/`reports`/`blocks` 규칙을 추가한 뒤 프로덕션 Firebase 프로젝트에 배포 완료(`firebase deploy --only firestore:rules`) — 브라우저에서 실제 글쓰기/댓글/좋아요/신고/차단까지 전부 검증됨. 데스크톱 레이아웃은 리멤버 실제 사이트를 DOM까지 조사해 검정 헤더+플랫 패널(둥근 모서리/그림자 없이 여백으로만 구분) 스타일로 맞춰뒀다(모바일은 기존 카드 스타일 유지).
8. **Capacitor로 iOS/Android 네이티브 셸 통합 완료** — 기존 웹 코드를 다시 만들지 않고 그대로 `ios/`, `android/` 네이티브 프로젝트로 감쌌다(`capacitor.config.ts`, appId `com.billionaire.app`). 카메라 사용 목적 문구(`Info.plist`의 `NSCameraUsageDescription` 등, `AndroidManifest.xml`의 `CAMERA` 권한)를 넣어 애플 심사에서 요구하는 최소한의 네이티브 통합을 갖췄고, `@capacitor/push-notifications`로 네이티브 푸시 등록까지 붙였다(`src/hooks/useNativePush.ts` — 기기 토큰을 `users/{uid}.pushToken`에 저장). 다음 단계로 필요한 것:
   - **iOS**: Xcode(설치돼 있음)로 `npm run cap:ios` → 서명(Signing & Capabilities)에 개발자 계정 연결, Push Notifications capability 추가, 실기기/시뮬레이터 빌드 확인.
   - **Android**: Android Studio가 이 환경에 설치되어 있지 않음(`ANDROID_HOME` 미설정) — 사용자가 Android Studio 설치 후 `npm run cap:android`로 프로젝트를 열어야 빌드/실행 가능.
   - **푸시 발송 서버**: 지금은 클라이언트가 기기 토큰을 저장하는 부분까지만 되어 있고, 실제로 알림을 "보내는" 쪽(Firebase Cloud Messaging 연동, 커뮤니티 좋아요/댓글 시 서버에서 발송)은 아직 없음 — 별도 작업 필요.
   - **LINE 로그인**: `server.ts`의 `/api/auth/line/url` 콜백은 배포된 HTTPS 서버가 있어야 네이티브 앱에서도 동작한다(로컬호스트로는 불가) — 서버 배포가 선행되어야 함.
   - 명함 스캔은 기존 `getUserMedia` 기반 커스텀 카메라 UI를 그대로 재사용 중이며(Capacitor 네이티브 셸 안에서는 카메라 권한이 PWA와 달리 앱 단위로 영구 저장되므로 이것만으로도 안정성 문제가 크게 개선됨), `@capacitor/camera` 플러그인으로 교체하는 건 필요해지면 나중에 고려.
9. **디자인 토큰 시스템 — 전면 마이그레이션 완료 (2026-08)** — 색상/그림자/radius 토큰이 `src/index.css`의 Tailwind 4 `@theme` 블록에 정의되어 있다(`ink`/`ink-muted`/`ink-faint`/`line`/`surface`/`canvas`/`primary`/`primary-soft`/`accent`(朱色)/`success`/`warning`/`danger`). 구 `src/constants/theme.ts`는 삭제됨.
    - **레거시 클래스 673건을 17개 파일에서 일괄 치환**해 이제 `gray-*`/`bg-white`/토큰값 hex는 0건이다. 새 UI도 반드시 토큰 클래스만 쓸 것.
    - **표준 매핑**: `bg-white`→`bg-surface`, `bg-gray-50`→`bg-canvas`, `bg-gray-100/200/300`→`bg-primary-soft`, `text-gray-900/800`→`text-ink`, `text-gray-700/600/500`→`text-ink-muted`, `text-gray-400/200`→`text-ink-faint`, `border-gray-*`→`border-line`, `text-red-500`→`text-danger`, `bg-black/NN`(스크림)→`bg-ink/NN`, `bg-black`(버튼)→`bg-primary`.
    - **일괄 치환하면 안 되는 것들** (실제로 이번에 걸린 함정):
      - **`text-white`(123건)와 `border-white`는 그대로 둔다.** 어두운 배경 위에서 정상이다.
      - **`text-gray-300`은 배경에 따라 갈린다.** 데스크톱 헤더(`App.tsx`, 배경 `rgb(10,10,10)`)와 다크 하단바(`BottomNav`)에서는 `text-white/60`으로, 밝은 배경(약관·댓글·게시글)에서는 `text-ink-faint`로 보냈다. 전부 `text-ink-faint`로 밀었으면 어두운 헤더에서 대비가 무너졌다.
      - **`MeishiScannerModal`의 `bg-black` 4건은 의도적으로 유지.** 카메라 뷰파인더 표면이지 테마 색이 아니다.
      - **`#06C755`(LINE 브랜드 그린) 유지.** 브랜드 색은 토큰화 대상이 아니다.
    - 토큰값과 동일한 raw hex(`#0A0A0A`→primary, `#141A21`→ink, `#5B6672`→ink-muted, `#8B95A1`→ink-faint, `#E5E8EB`→line, `#F7F8FA`→canvas, `#C9483B`→accent)도 전부 토큰 클래스로 바꿨다.
10. **스텁/빈 기능 정리 완료 (2026-08)** — 검색(`SearchOverlay`: 명함+커뮤니티 통합, 모바일 3개 헤더+데스크톱 헤더 연결), 알림 패널(`NotificationsPanel`: 정직한 빈 상태, 가짜 배지 제거), 명함 상세 메모(Firestore `meishi.memo`)와 tel/sms/mailto 액션, 이메일 실제 가입(createUserWithEmailAndPassword), 프로필 완성도(로컬 토글 → 실데이터 파생), 프로필 사진 업로드(리사이즈 후 users.photoURL에 dataURL 저장), 마이프로필 投稿 탭(내 게시글 목록). 가짜 데이터(팔로워 128/129, 가짜 제안 배너, 목 트렌딩, 가짜 커뮤니티 카테고리 탭) 제거됨. **아직 스텁인 것**: チーム名刺帳/グループ連絡先(準備中), 프로필 履歴書管理/お知らせ 탭(準備中です), 알림 백엔드, 알림 백엔드.
11. **공개 디지털 명함 / 유저별 핸들 구현 완료 (2026-08)** — `my_cards/{uid}`(유저당 1장, 문서 ID가 uid라 list 쿼리 불필요) + `handles/{handle}`(문서 ID가 핸들 자체, `create`만 허용해 트랜잭션 없이 원자적 유일성 보장). 규칙 배포 완료. 카드 내용은 마이 명함(`meishi.isMyCard`)+프로필에서 파생되며, 원본이 바뀌면 `isStale`로 감지해 「最新の内容に更新する」로 재동기화한다(자동 저장 안 함). 비공개 전환 시 URL을 알아도 404. 진입점: 데스크톱 좌측 사이드바 버튼 + 마이프로필 マイ名刺タブ의 「マイ名刺を共有する」. 관련 파일: `hooks/usePublicCard.ts`, `components/profile/PublicCardModal.tsx`, `services/firestoreService.ts`의 `handleService`.
    - **주의**: `tsconfig.json`에 `strict`가 꺼져 있어 판별 유니온(`{ok:true}|{ok:false,reason}`) 내로잉이 동작하지 않는다. `HandleCheck`는 옵셔널 필드 인터페이스로 정의했다. (CLAUDE.md 코딩 규칙의 "TypeScript strict"와 실제 tsconfig가 불일치 — 정리 필요)
12. **관리 콘솔(管理コンソール) — 앱과 분리된 별도 데스크톱 페이지 (2026-08)** — 운영자가 문의/신고/커뮤니티/계정을 처리하는 화면. **앱(`dist/`)에는 일절 포함되지 않는다.**
    - **빌드 분리**: `admin.html` + `src/admin/` + `vite.admin.config.ts` → `npm run build:admin` → `dist-admin/`. 소비자용 `vite build`는 `index.html`만 입력으로 잡으므로 관리자 코드가 `dist/`에 들어가지 않는다(검증: `dist/`에서 `管理コンソール`/`adminInquiryService` 문자열 0건). **Capacitor가 `dist/`를 네이티브 앱에 복사하므로, 이 분리가 곧 "관리자 화면이 App Store/Play 심사와 회원 단말에 실리지 않는다"는 뜻이다.**
    - **개발 중에는** 기존 dev 서버 그대로 `http://localhost:3000/admin.html`에서 열린다(Vite가 루트 HTML 엔트리를 서빙). 프로덕션에서만 산출물이 갈린다.
    - **배포**: `dist-admin/`는 앱과 다른 호스트(예: `admin.example.com`)에 올리고 Cloudflare Access / IP 허용목록 / VPN 뒤에 두는 것을 전제로 설계했다. 네트워크 게이트는 코드와 정찰을 막고, 실제 데이터 보호는 여전히 `firestore.rules`의 `isAdmin()`이 한다 — 둘은 대체재가 아니라 계층이다.
    - **구조**: `src/admin/AdminApp.tsx`(인증+역할 게이트+사이드바 레이아웃), `AdminLogin.tsx`(별도 오리진이라 자체 로그인 필요), `ui.tsx`(공용 조각), `panels/`(Overview/Inquiries/Reports/Content/Users 5종). 쿼리는 `src/services/adminService.ts`에 모여 있고 앱과 공유한다.
    - **디자인**: ui-ux-pro-max(density 9 / variance 2 / motion 2). 다크 사이드바 + 고밀도 테이블 + 우측 드로어 상세. 생성기가 제안한 블루/앰버 팔레트는 **쓰지 않았다** — 제품과 그 제품을 관리하는 콘솔의 팔레트가 갈리면 같은 가이드의 `consistency`(우선순위 4)와 `color-semantic`을 스스로 어기게 된다. 대신 구조·밀도·`number-tabular` 권고만 따르고 색은 앱 토큰을 유지했다. 데이터 컬럼(ID/일시/카운터)은 `--font-mono`(시스템 스택, 웹폰트 요청 0).
    - **관리자 권한 부여는 Firebase 콘솔에서만 가능**하다. `isAdmin()`은 `users/{uid}.role == 'admin'`만 본다(하드코딩 이메일 백도어 제거함). `users` 규칙이 모든 쓰기에 `data.uid == request.auth.uid`를 요구하므로 앱에서 자신이나 타인을 승격시킬 수 없다 — 의도된 마찰이다.
    - **관리자 쓰기는 필드 단위로 제한**했다. `posts`/`comments`는 `status`(+`updatedAt`)만, `inquiries`/`reports`는 `status`/`adminNote`/`handledBy`/`handledAt`만. 운영자가 회원 글 본문을 고쳐 쓰는 일이 규칙 차원에서 불가능하다. 모더레이션은 삭제가 아니라 `status: 'hidden'` 소프트 숨김.
    - **의도적으로 넣지 않은 것**: `meishi` 컬렉션 열람. 규칙상 admin은 읽을 수 있지만, 명함에 담긴 제3자 개인정보는 운영자가 훑어볼 대상이 아니다(리멤버는 한 발 더 나아가 타이피스트가 명함 한 장의 전체를 구조적으로 볼 수 없게 필드를 쪼개 배분한다). 사용자 목록도 최근 50건 + 이메일 완전일치 조회로 제한.
    - **아직 없는 것**: 문의 답장 메일 발송(서버 필요 — 현재는 `mailto:`), **관리자 행위 감사 로그**(운영자가 2명 이상이 되는 시점의 최우선 과제), 문의/신고 페이지네이션(각 200건 상한).
    - 쿼리는 `where` + `orderBy` 조합을 피해 복합 인덱스 없이 동작하도록 짰다(필터는 클라이언트). 건수가 커지면 인덱스 + 서버 필터로 옮길 것.
    - **주의**: `src/firebase.ts`의 `handleFirestoreError`는 원본 `FirebaseError`를 삼키고 JSON 문자열을 담은 새 `Error`를 던진다. `err.code === 'permission-denied'` 판별이 동작하지 않으므로 메시지 문자열로 판단해야 한다(`AdminApp.load()` 참고).

13. **着信時に相手の名刺情報を表示 — iOS만 구현 완료, Android는 미착수 (2026-08)** — 리멤버가 내세우는 발신자 표시 기능. **WebView(React) 코드로는 절대 구현 불가능** — 수신 전화 화면은 OS가 그리므로 두 플랫폼 모두 완전히 별도의 네이티브 코드가 필요하다.
    - **iOS 구현 방식**: Apple `CXCallDirectoryExtension` — 회사명+이름 **텍스트 한 줄만** 가능(사진·직함 불가), **사용자가 설정 → 電話 → 通話のブロックと識別에서 직접 켜야** 동작(앱이 자동으로 켤 수 없음), 갱신 시점은 iOS가 배터리/CPU 상황을 보고 알아서 스케줄링(실시간 아님, 명함 저장 후 반영까지 지연될 수 있음). 이게 애플이 허용하는 전부다 — Today TIP이나 설정 문구에 "실시간"이나 "사진 표시" 같은 과장 카피를 넣지 말 것.
    - **아키텍처**: 확장(extension)은 별도 샌드박스 프로세스라 WebView·Firestore를 못 본다. 데이터는 App Group(`group.com.billionaire.app.callerid`)을 통해서만 전달된다: JS(`src/hooks/useCallerIdSync.ts`, meishis 변경 시 자동 동기화) → Capacitor 플러그인(`ios/App/App/Plugins/CallerIdIndexPlugin.swift`, App Group UserDefaults에 기록 + `CXCallDirectoryManager.reloadExtension` 호출) → 확장(`ios/App/CallDirectoryExtension/CallDirectoryHandler.swift`, 같은 UserDefaults를 읽어 `CXCallDirectoryProvider`에 등록). 전화번호는 `src/utils/phoneNumber.ts`가 국가코드 없는 일본 국내번호(0으로 시작)를 81…로 정규화하며, 애매한 형식은 등록하지 않고 버린다(iOS는 오름차순이 아니거나 중복된 항목이 하나라도 있으면 전체 로드를 취소함).
    - **Xcode 프로젝트 변경은 GUI 없이 `xcodeproj` Ruby gem으로 처리**했다(`ios/add_call_directory_extension.rb`, 멱등적 — 재실행해도 안전). `CallDirectoryExtension` 타겟 추가, Info.plist(`NSExtensionPointIdentifier = com.apple.callkit.call-directory`), 양쪽 타겟에 App Groups 엔타이틀먼트, App 타겟에 Embed App Extensions 빌드 페이즈까지 스크립트로 반영했고, `xcodebuild -sdk iphonesimulator CODE_SIGNING_ALLOWED=NO`로 두 타겟 모두 컴파일 성공까지 확인했다.
    - **남은 수동 작업 (Xcode에서 한 번)**: `CODE_SIGN_STYLE = Automatic`으로 해뒀으므로, Apple Developer 계정이 연결된 Xcode에서 처음 빌드하면 App Groups가 자동으로 프로비저닝된다. 자동으로 안 잡히면 두 타겟(App, CallDirectoryExtension) 각각 Signing & Capabilities → + Capability → App Groups → `group.com.billionaire.app.callerid` 추가.
    - **Android는 아직 없음** — 사용자가 명시적으로 "iOS 먼저, Android는 iOS 완성 후"로 순서를 정했다. Android 쪽은 `CallScreeningService` + `RoleManager.ROLE_CALL_SCREENING` + 커스텀 오버레이 Activity로 사진·직함까지 포함한 리멤버 수준의 풀스크린 화면이 가능(iOS보다 표현력이 훨씬 높음)하지만, 이 개발 환경엔 Android Studio가 없어(`ANDROID_HOME` 미설정, 8번 항목 참고) 실제 빌드·기기 테스트는 사용자 환경에서 해야 한다.
    - **실기기에서 드러난 결함 3건 — 전부 "조용히 아무것도 안 함" 유형 (2026-08)**. 사용자가 저장된 번호로 전화를 받았는데 표시가 안 되어 발견했다.
      - **`useCallerIdSync`가 명함당 번호를 하나만 등록했다** (`normalizePhoneNumber(mobile) || normalizePhoneNumber(phone)`). 명함에는 携帯電話·電話番号가 둘 다 있고 상대는 어느 쪽으로든 걸 수 있는데, 携帯가 있으면 会社 번호는 통째로 버려졌다. 지금은 `buildCallerIdEntries()`가 **두 번호를 모두** 등록한다(FAX는 제외 — 음성 발신을 하지 않는다). 번호 단위로 중복 제거하므로 여러 명함이 같은 대표번호를 공유해도 안전하다.
      - **`normalizePhoneNumber`가 쓰레기 번호를 만들어냈다.** `0081-70-…`(일본 국제전화 접두)는 앞의 0만 떼여 `810081…`이 됐고, `070-1234-5678 (内線123)`처럼 주석이 붙은 표기는 내선번호까지 붙어 `81…5678123`이 됐다. 둘 다 **어디에도 걸리지 않는 번호가 등록된 것**이라 실패가 눈에 보이지도 않는다. 지금은 `00` 접두를 국제표기로 처리하고, 국내번호는 **10~11자리**(고정·0120·0570=10, 휴대·050·0800=11)만 통과시킨다 — 범위를 벗어나면 등록하지 않고 버린다.
      - **확장이 incremental 로드에서 기존 항목을 지우지 않았다.** 앱은 항상 전체 목록을 쓰므로 매 로드가 전면 교체인데, iOS가 `isIncremental` 컨텍스트로 부르면 이전 항목이 그대로 남아 **삭제한 명함이 계속 식별되고**, 이미 있는 번호를 다시 add하면 로드 전체가 실패해 디렉터리가 옛 상태에 머문다. `context.isIncremental`일 때 `removeAllIdentificationEntries()`를 호출한다.
    - **진단 가능성이 원래 없었다는 게 진짜 문제였다.** `getStatus`는 사용자가 iOS 설정에서 켰는지(`getEnabledStatusForExtension`)만 알려줬는데, 이건 「동작한다」의 절반일 뿐이다. App Group이 안 잡혀서 번호가 한 건도 안 넘어가도 상태는 `有効`로 표시된다. 지금은 `appGroupAvailable`과 `entryCount`를 함께 반환하고, 시트가 `登録済み N件 / 対象 M件`으로 대조해 보여준다 — App Group 실패는 경고 배너로, 건수 부족은 `名刺を今すぐ同期` 안내로 이어진다. 백그라운드 동기화는 여전히 조용히 `console.warn`만 하지만(카드 변경마다 도는 훅이라 토스트가 아무 때나 뜨면 안 된다), 시트의 수동 동기화 버튼은 실패를 토스트로 알린다.
    - **`ios/App/`에는 `.xcworkspace`가 없다** (Capacitor 8 = SPM, CocoaPods 아님). `xcodebuild`는 `-project App.xcodeproj`로 부를 것 — `-workspace`는 does not exist로 실패한다. `npx cap open ios`는 알아서 처리하므로 `npm run cap:ios`는 그대로 동작한다.
    - **앱 내 on/off 스위치 (2026-08)** — iOS는 확장 자체를 앱이 켜고 끄는 API를 주지 않는다(사용자만 설정에서 가능). 하지만 **확장이 볼 데이터는 전적으로 우리 것**이므로, 스위치를 끄면 빈 목록을 써서 인덱스를 비운다 — iOS 토글이 켜져 있어도 식별이 멈춘다. 겉치레가 아니라 실제로 동작하는 유일한 형태의 off다. 상태는 `users/{uid}.callerIdEnabled`(bool, **없으면 on**)에 저장하고 `useCallerIdSync(meishis, enabled)`가 반응한다. 없을 때를 off로 취급하면 기존 사용자 전원이 조용히 꺼지므로 기본값은 반드시 on이다.
    - **스위치가 두 개고 주인이 다르다.** ①앱 스위치(우리) ②iOS 설정 스위치(사용자). 「안 된다」의 해결법이 서로 다르므로 시트는 둘 다 따로 보여준다.
    - **비iOS에서도 진입점을 노출한다 (2026-08)** — 이전엔 `Capacitor.getPlatform() !== 'ios'`면 두 진입점을 통째로 숨겼는데, 그러면 **웹 사용자는 이 기능의 존재 자체를 모른다.** 지금은 행을 항상 보여주고, 시트가 「iOSアプリ専用の機能です」를 설명하며 **동작하지 않을 컨트롤(토글·설정 열기·동기화)은 렌더하지 않는다.** 10번 항목의 "스텁 금지" 원칙과 충돌하지 않는다 — 진입점이 죽은 게 아니라 설명으로 이어지기 때문이다.
    - **`getStatus`는 실패해도 reject하지 않는다.** reject하면 JS쪽에서 "플러그인이 아예 없음"과 구분이 안 되는데 둘은 해결책이 정반대다(전자는 확장 미설치, 후자는 빌드에 플러그인 누락). 지금은 항상 resolve하고 에러 텍스트를 같이 싣는다. JS의 `CallerIdState.available`이 "플러그인이 응답했는가"를 따로 들고 있어서, 시트가 「この端末では利用できません」과 「端末側の設定が未完了です」를 구분해 띄운다. **예전 폴백은 플러그인 호출 실패를 App Group 실패로 오진해 사용자를 엉뚱한 곳으로 보냈다.**
    - **프라이버시 설계**: 트루콜러류(전 세계 사용자 연락처를 크라우드소싱해 타인 번호까지 역조회)와 달리, **로그인한 사용자 본인이 저장한 명함의 번호만** 로컬로 동기화한다. 서버로 타인의 전화번호를 보내 조회하는 경로는 없다. `useCallerIdSync`는 `isMyCard`(본인 명함)를 제외한다 — 식별 대상은 "나에게 걸려오는 남"이지 내 번호가 아니기 때문.
    - **UI 진입점**: `もっと見る`>`便利な機能`와 `設定`>`名刺` 두 곳 모두 `src/components/settings/CallerIdInfoSheet.tsx`를 여는 것으로 통일했다. 이 시트가 실제 상태(有効/無効/未確認)를 `CXCallDirectoryManager.getEnabledStatusForExtension`으로 조회해 보여주고, iOS 설정 앱을 여는 버튼과 함께 "사진 없음/실시간 아님/자동으로 켤 수 없음" 3가지 한계를 명시한다. **`Capacitor.getPlatform() !== 'ios'`면 두 진입점 모두 완전히 숨김** — Android/web에서 눌러도 안 되는 버튼을 보여주는 대신, 아예 없는 것으로 취급(10번 항목의 "스텁 정리" 원칙과 동일).
    - **버그 발견 겸 수정**: `TodayScreen.tsx`의 発信者表示 TIP 카피가 "電話がかかってくるとRememberがお知らせします"로 **경쟁사 이름이 그대로 박혀 있었다**(리멤버 마케팅 문구를 참고하며 브랜드명을 안 바꾼 흔적으로 추정). "Billionaire"가 아니라 아예 잘못된 회사명을 사용자에게 노출하고 있었던 것 — 이번에 발견해서 고쳤다.

14. **실기기(iPhone) 첫 설치에서 드러난 문제들 (2026-08)** — 이 앱은 그동안 브라우저와 시뮬레이터에서만 돌렸고, 실기기 설치는 이때가 처음이었다. 아래는 전부 **실기기에서만 재현되는** 것들이라 다시 밟지 않도록 기록한다.
    - **`server.iosScheme: 'https'`는 원리상 동작하지 않는다. 다시 추가하지 말 것.** Capacitor의 `InstanceDescriptor.normalize()`(`node_modules/@capacitor/ios/.../CAPInstanceDescriptor.swift`)는 `WKWebView.handlesURLScheme(scheme) == false`일 때만 값을 유지하는데, WKWebView는 https를 네이티브로 처리하므로 이 값은 **경고 한 줄 없이 버려지고 기본값 `capacitor`로 리셋**된다. 기기에서 직접 확인함 — 번들된 `capacitor.config.json`에는 `"iosScheme": "https"`가 그대로 들어있는데 앱은 `Loading app at capacitor://localhost`로 뜬다. **iOS는 항상 `capacitor://localhost` 오리진이고 이건 바꿀 수 없다.** 따라서 정상 웹 오리진을 요구하는 코드는 스킴을 바꾸는 게 아니라 네이티브에서 우회해야 한다.
    - **무한 로딩 스피너의 진짜 원인은 `popupRedirectResolver`였다.** Firebase의 `browserPopupRedirectResolver`는 iOS에서 `_shouldInitProactively === true`(`_isIOS()` 검사)라 `initializeAuth` 시점에 apis.google.com의 gapi 인증 iframe을 **선제 로드**한다. 오리진이 `capacitor://`라 CORS로 `gapi.iframes` 모듈만 못 받는데, Firebase의 `loadGapi()`는 `gapi.load(..., { callback, ontimeout })` 구조라서 **callback은 정상 발화**하고(→ `ontimeout`은 영원히 안 옴) 그 안의 `resolve(gapi.iframes.getContext())`가 TypeError를 던진다. 이 throw는 Promise executor 밖이라 **reject도 안 되고 resolve도 안 되어 promise가 영구 pending** → `initializeAuth`가 거기서 멈춤(감싼 try/catch는 reject에만 쓸모 있고 hang에는 무력) → `onAuthStateChanged` 미발화 → `App.tsx`의 `isAuthReady` 게이트가 영영 안 열림. **네이티브에서는 `popupRedirectResolver`를 전달하지 않는다**(`src/firebase.ts`). 네이티브 로그인은 `FirebaseAuthentication.signInWithGoogle()` + `signInWithCredential`이라 resolver가 애초에 필요 없다(`signInWithPopup`은 웹 분기 전용).
    - **앱 타겟에 직접 넣은 Capacitor 플러그인은 자동 등록되지 않는다.** `CapacitorBridge.registerPlugins()`는 번들된 `capacitor.config.json`의 `packageClassList`에 있는 클래스만 `NSClassFromString`으로 찾아 등록하는데, 이 목록은 `cap sync`가 **npm 플러그인 패키지에서만** 생성한다. 앱 타겟 안의 플러그인(`CallerIdIndexPlugin`)은 컴파일은 되지만 등록이 안 되어 JS에서 `{"code":"UNIMPLEMENTED"}`가 돌아온다. 해결책은 `capacitorDidLoad()`를 오버라이드하는 `CAPBridgeViewController` 서브클래스(`ios/App/App/MainViewController.swift`)에서 등록하는 것.
      - **반드시 `registerPluginInstance(...)`여야 한다. `registerPluginType(...)`은 조용한 no-op다.** (2026-08 — UNIMPLEMENTED의 진짜 마지막 원인) Capacitor 8의 구현이 `public func registerPluginType(_:) { if autoRegisterPlugins { return } ... }`인데, `autoRegisterPlugins`는 기본값 `true`이고 `CAPBridgeViewController.loadView()`가 이 값을 넘기지 않고 브리지를 만든다. 즉 **아무 일도 안 하고 그냥 리턴한다 — 에러도 로그도 없다.** 아래 window/스토리보드 문제를 다 고치고 `capacitorDidLoad`가 실제로 도는 것까지 로그로 확인한 뒤에도 계속 `{"code":"UNIMPLEMENTED"}`가 났던 이유가 이것이다. `registerPluginInstance`에는 그 가드가 없다.
      - **이 서브클래스는 `Main.storyboard`에서 지정한다.** (2026-08 정정 — 예전에 여기에 "스토리보드는 아예 읽히지 않으니 SceneDelegate에서 지정해야 한다"고 적어뒀는데 **틀렸다.**) `Info.plist`의 scene manifest에 `UISceneStoryboardFile = Main`이 있어서, UIKit이 `scene(_:willConnectTo:)`가 불리기 **전에** 스토리보드의 initial VC를 만들어 window에 꽂아둔다. 실기기/시뮬레이터에서 진입 시점의 `window`를 찍어 확인했다 — `window=EXISTS rootVC=CAPBridgeViewController`.
      - **그래서 SceneDelegate에서 window를 또 만들면 브리지가 2개가 된다.** webview도 2개고 **둘 다 JS를 돌리는데 플러그인 등록은 한쪽에만** 있다. 어느 window가 key가 되느냐에 따라 플러그인 존재 여부가 갈려서, **시뮬레이터에서는 되고 실기기에서는 `{"code":"UNIMPLEMENTED"}`가 나오는** 재현 어려운 증상이 됐다. 지금은 SceneDelegate가 window를 만들지 않고 스토리보드가 `MainViewController`를 직접 지정한다 — 루트 VC는 하나뿐이고 그게 등록을 한다. 검증: `DIAG registered` 로그가 정확히 1회, 앱 window도 1개(나머지 하나는 UIKit의 `UITrackingElementWindowController`).
    - **`[ FirebaseAuthentication ] <FirebaseAuthenticationPlugin.RuntimeError>` 로그 1줄은 정상이다.** 플러그인이 초기화 때 `addIDTokenDidChangeListener`를 걸고 그 리스너가 `getIdToken()`을 부르는데, `skipNativeAuth: true`(8번·위 설계 참고)라 네이티브 Firebase Auth에는 설계상 유저가 없으므로 "No user is signed in."이 반환된다. 플러그인은 이를 로그만 찍고 `return`한다. **버그가 아니고 앱 코드로 없앨 수도 없다.**
    - **`onSnapshot` 에러 콜백에서 `handleFirestoreError`를 쓰면 안 된다.** 이 함수는 로그 후 `throw`하는데, 리스너 콜백은 try/catch 밖이라 예외가 그대로 튀어나가 Capacitor가 "STARTUP JS ERROR"로 잡고, 더 나쁜 건 그 아래 `if (onError) onError(error)` 폴백이 **도달 불가능한 죽은 코드**가 된다는 점이다. 비throw 버전 `logFirestoreError`(`src/firebase.ts`)를 쓸 것. 현재 `subscribeContacts`/`subscribePosts` 두 곳에 적용돼 있다.
    - **로그인 전에는 인증이 필요한 컬렉션을 구독하지 말 것.** `useCommunityPosts`가 마운트 즉시 `posts`를 구독하고 있어서, 규칙상 인증이 필요한 탓에 **모든 방문자가 로그인 화면에서 PERMISSION_DENIED를 보고 있었다**. `isEnabled` 인자를 추가해 `!!user`일 때만 구독한다. 새 구독 훅을 만들 때도 같은 게이팅을 할 것.
15. **iOS 키보드/뷰포트 관련 (2026-08)** — 입력란이 있는 화면을 만들 때 반드시 알아야 할 두 가지. 둘 다 실기기에서만 재현된다.
    - **자동 확대**: iOS는 포커스된 입력의 `font-size`가 **16px 미만**이면 페이지 전체를 확대하고, viewport에 `maximum-scale`이 없으면 되돌릴 방법이 없다. 이 앱은 입력 66개가 대부분 13~15px 디자인이라, 전부 16px로 키우는 대신 **네이티브에서만 viewport 배율을 잠갔다**(`src/main.tsx`, `Capacitor.isNativePlatform()` 분기). WKWebView는 배율 제한을 존중한다(Capacitor가 `ignoresViewportScaleLimits`를 건드리지 않아 WebKit 기본값 `false`). **웹 빌드는 확대를 유지**한다 — 웹에서 줌 차단은 실제 접근성 저하다. 참고로 Capacitor의 `ios.zoomEnabled`는 `scrollViewWillBeginZooming`에서 핀치 제스처만 끄므로 **포커스 자동 확대에는 무력**하다.
    - **키보드가 올라오면 fixed 오버레이가 밀려 올라간다 → `@capacitor/keyboard`의 `resize: Native`가 필수다.** 이 플러그인이 없으면 WKWebView가 전체 높이를 유지한 채 iOS가 **문서를 스크롤**해 입력을 보이게 하는데, `position: fixed`는 (축소된 시각 뷰포트가 아니라) 레이아웃 뷰포트 기준이라 전체화면 오버레이가 통째로 화면 밖으로 밀린다. 사용자에게는 "오버레이 아래쪽 빈 영역이 먼저 보이고 위로 스크롤해야 입력란이 나옴"으로 보인다.
      - **측정값이 진단의 핵심이었다**(학교 검색 오버레이 열린 상태): `documentElement.scrollTop === 595`인데 `오버레이.scrollTop === 0` — 즉 **오버레이는 스크롤되지 않았고 문서가 스크롤됐다**. 비슷한 증상이 또 나오면 추측하지 말고 이 두 값을 먼저 찍어볼 것.
      - 이 문제를 오버레이 CSS로 고치려는 시도는 헛수고다(sticky 헤더로 안 고쳐진다 — 실제로 한 번 헛짚었음). 원인이 오버레이 내부 스크롤이 아니기 때문이다.
    - **전체화면 오버레이는 헤더를 `sticky top-0 z-10 bg-surface`로 고정할 것.** 위 키보드 문제와는 별개의 결함이지만, 고정하지 않으면 스크롤 시 검색 입력·저장 버튼이 화면 밖으로 사라진다. `src/`의 `fixed inset-0 … overflow-y-auto` 오버레이 16개를 전수 점검했고 현재 미고정은 0개다. 새 오버레이를 만들 때도 이 패턴을 지킬 것.

16. **Firestore 문서 값은 렌더 직전까지 신뢰하면 안 된다 (2026-08)** — `setUserProfile(docSnap.data() as UserProfile)`(`App.tsx`)는 **캐스트지 검증이 아니다.** 타입은 컴파일 타임에만 존재하므로 문서에 뭐가 들어있든 그대로 컴포넌트로 흘러간다.
    - **규칙(rules)이 막아준다고 안심할 수 없다.** Firestore는 latency compensation 때문에 **서버가 거부하기 전에 로컬 캐시에 먼저 적용**하고 스냅샷 리스너를 깨운다. 즉 규칙이 금지하는 값도 왕복하는 동안 한 번은 렌더된다. 실제로 `users.phone`에 숫자를 쓰는 거부될 write 하나가 `formatMobileNumber`의 `digits.slice`를 터뜨려 **앱 전체가 백지**가 됐다(에러 바운더리 없음). 규칙 배포 직후 검증 중에 자체적으로 재현했다.
    - 따라서 **Firestore 값을 받는 표시 함수는 타입 시그니처와 무관하게 런타임 가드를 둘 것.** 현재 `formatMobileNumber(value: unknown)`은 비문자열을 문자열화한 뒤 숫자만 남겨서, 이상한 값은 예외 대신 빈 문자열로 렌더된다. 경계에서 좁히는 것도 같이 한다(`PhoneNumberPage`의 `typeof userProfile?.phone === 'string' ? … : ''`).

17. **명함의 번호 칸은 `phone`·`mobile` 두 개다. 한쪽만 보는 코드를 만들지 말 것 (2026-08)** — 편집 폼은 `携帯電話`(`mobile`)/`電話`(`phone`)/`FAX`(`fax`)를 모두 입력받는데, 읽는 쪽이 `phone`만 보는 버그가 **세 군데**에서 따로 나왔다.
    - `useCallerIdSync`: `mobile || phone`이라 회사 번호가 등록에서 누락 → 두 번호 모두 등록으로 수정(13번 항목).
    - `MeishiDetailView`의 情報 섹션: `mobile`/`fax`를 **아예 렌더하지 않아서**, 携帯電話에만 번호가 있는 명함은 「전화번호가 없는 명함」처럼 보였다.
    - 같은 화면의 전화/메시지 버튼: `meishi.phone`만 보고 활성화를 판단해 위와 같은 명함에서 **영구 비활성**이었다. 지금은 `mobile || phone`(사람에게 직접 닿는 휴대폰 우선).
    - 새로 명함 데이터를 읽는 코드를 쓸 때는 **항상 두 필드를 다 고려**할 것.

18. **명함 전화번호에 국가 선택 (2026-08)** — `normalizePhoneNumber`가 일본 고정이었다. 한국 명함의 `010-7105-9914`가 **일본 번호로 읽혀 `+81 10 7105 9914`로 등록**됐다 — 아무에게도 닿지 않는 번호인데 에러가 없어 성공과 구분되지 않았다.
    - 국가는 **명함 단위**(`Meishi.phoneCountry`, ISO 3166-1 alpha-2, **없으면 JP**)다. 명함 한 장의 번호들은 같은 나라이므로 번호별로 두지 않았다. 기존 명함은 전부 값이 없고 곧 일본이므로 동작이 바뀌지 않는다.
    - 목록은 `src/constants/phoneCountries.ts`. **`trunkPrefix`가 핵심이다** — 국내 표기 앞에 붙었다가 국제전화에서 떨어지는 자리. 대부분 `'0'`이지만 **NANP(+1)·홍콩·싱가포르는 없다**(이미 전체 길이로 적는다). 여기서 틀리면 양쪽 방향 모두 번호가 깨지므로 파서의 가정이 아니라 **데이터로** 뒀다. `nsnMin`/`nsnMax`로 걸리지 않는 번호(내선 포함 표기 등)를 걸러낸다.
    - ITU 전체 표를 흉내내지 않았다. 항목마다 **정확해야** 하므로 실제로 명함을 교환하는 범위(15개국)만 넣었다.
    - `+`나 `00`으로 시작하면 번호 자체가 국가코드를 말하고 있으므로 **명함의 국가 설정보다 우선**한다.
    - 상세 화면은 **JP가 아닐 때만** 「国」 행을 보여준다(일본 명함에선 소음, 해외 명함에선 걸리느냐 마느냐의 차이).
19. **Firestore 규칙은 배포 직후 바로 테스트하지 말 것 (2026-08)** — 새 규칙을 배포하고 곧바로 검증했더니 `phoneCountry`에 `'KOREA'`와 숫자 `82`가 **통과**했다. 규칙이 틀린 줄 알고 뒤졌는데, 잠시 뒤 같은 테스트를 다시 돌리니 셋 다 정상적으로 거부됐다. **전파가 프론트엔드마다 원자적이지 않아서** 배포 직후에는 옛 규칙과 새 규칙이 섞여 응답한다. 검증 전에 시간을 두고, 이상하면 규칙 로직을 의심하기 전에 **한 번 더 돌려볼 것**.

20. **着信表示의 "지연"은 두 가지를 구분해야 한다 (2026-08)** — 사용자가 "즉시 표시됐으면 좋겠다"고 할 때 실제로 무엇이 느린지.
    - **통화 수신 시점의 조회는 지연이 없다.** iOS는 확장이 등록해둔 디렉터리를 자체 저장소에 들고 있다가 매칭하며, **전화가 올 때 확장을 호출하지 않는다.** 번호만 들어가 있으면 표시는 즉시다.
    - **지연은 "명함 저장 → iOS가 디렉터리를 다시 읽는" 구간에만 있다.** `CXCallDirectoryManager.reloadExtension`은 요청일 뿐이고 실행 시점은 iOS가 정한다. **강제할 API가 없다** — 앱이 할 수 있는 건 요청뿐이다.
    - **확장이 iOS 설정에서 꺼져 있으면 `reloadExtension`은 에러를 반환한다.** 예전엔 이걸 `call.reject`로 올려서 「동기화 실패」라고 알렸는데, 데이터는 이미 App Group에 **정상 기록된 뒤**였다. 사용자를 없는 고장을 찾게 만드는 오보라, 지금은 `{count, reloaded, reloadError}`로 resolve하고 시트가 「保存しました。iOS側の設定をオンにすると反映されます」로 구분해 안내한다.

21. **명함 촬영이 "초점이 안 맞는" 것처럼 보인 진짜 원인은 해상도였다 (2026-08)** — `getUserMedia({ video: { facingMode: 'environment' } })`처럼 **크기를 요구하지 않으면 브라우저는 640×480을 준다.** 이 화면은 거기서 가이드 프레임(가로 85%, 1.6:1)만 잘라내므로 실제 명함은 **약 540×340**밖에 안 된다. 명함 글씨는 그 크기에서 판독이 불가능하다 — 사용자에게는 "초점이 안 맞는다"로 보이고, 뒤이은 OCR은 읽을 게 없어 실패한다.
    - `width/height: { ideal: 3840/2160 }`로 요청한다. `ideal`은 기기가 지원하는 최대치로 **알아서 낮춰지므로** 모든 카메라에서 안전하다.
    - `focusMode: 'continuous'`는 DOM 타입에 없다. `any` 금지 규칙 때문에 `CameraConstraints` 타입을 좁게 확장했다(`useMeishiScanner.ts` 상단). 초기 요청과 `applyConstraints` **양쪽에** 넣는다 — 일부 브라우저는 초기 요청에 모르는 키가 있으면 무시하지 않고 video 블록 전체를 over-constrained로 버린다.
    - **OCR용 이미지와 저장용 이미지는 품질이 달라야 한다.** 예전엔 캡처 직후 `resizeImage(기본값 1000px/0.7)`을 한 번 태우고 그 결과를 OCR과 Firestore 저장에 **둘 다** 썼다. 인식에 필요한 디테일이 인식 전에 버려진 것이다. 지금은 캡처를 2400px/0.92로 유지해 OCR에 보내고, Firestore에 넣기 직전에 1000px/0.7로 다시 줄인다(문서 1MB 한도 + 앞/뒤 2장).
22. **저장이 실패해도 성공 화면이 떴다 (2026-08)** — `processMeishiOcrAndSave`가 에러를 잡아 토스트만 띄우고 **호출자에게는 아무것도 알리지 않아서**, `handleFinalSave`가 무조건 `setMeishiStep('success')`를 했다. 화면엔 「1枚の名刺を登録しました！」가 뜨고 그 위에 실패 토스트가 겹쳤다 — 저장된 건 하나도 없는데. 지금은 `Promise<boolean>`을 돌려주고 `true`일 때만 성공 단계로 넘어간다. **에러를 삼키는 함수를 만들 때는 호출자가 분기할 수단을 반드시 같이 줄 것.**
23. **`名刺登録設定`의 토글 2개는 아무 동작도 하지 않았다 (2026-08)** — `settings: 'send' | 'save'` 값이 `processMeishiOcrAndSave`의 인자로 선언만 되고 **본문에서 한 번도 읽히지 않았다.** 게다가 둘이 배타적이라 `名刺を送る`를 켜면 화면상 `名刺帳に保存`이 꺼지는데 저장은 그대로 실행됐다 — **UI가 사실과 반대되는 말을 하고 있었다.** 명함 교환 기능이 아직 없으므로 `名刺を送る`는 `準備中` 표시로 바꾸고, `名刺帳に保存`은 실제로 항상 일어나는 일이므로 체크 표시로 고정했다(10번 항목의 스텁 금지 원칙).

24. **설치된 앱에서는 `/api/*` 상대경로가 절대 동작하지 않는다 (2026-08)** — 명함 OCR(`/api/ocr/meishi`)과 자동 윤곽 검출(`/api/ocr/card-corners`)이 **실기기에서만 100% 실패**하던 원인. `ocrClient.ts`가 `fetch('/api/ocr/meishi')`처럼 **상대경로**를 썼는데, 설치된 앱의 오리진은 iOS `capacitor://localhost` / Android `https://localhost`(14번 항목 — iOS 스킴은 변경 불가)라 이 경로는 **번들된 웹 자산**을 가리킨다. 거기엔 그런 라우트가 없다. 브라우저에서는 앱과 API가 같은 오리진이라 멀쩡히 동작하므로 **개발 중에는 절대 재현되지 않는다.**
    - 지금은 `VITE_API_BASE_URL`(절대 오리진)을 읽고, 네이티브인데 값이 없으면 `OcrUnavailableError`를 던진다.
    - **배포 완료 (2026-08)**: Cloud Functions 2세대 `api`(asia-northeast1). URL은 `https://asia-northeast1-ai-studio-applet-webapp-c0fee.cloudfunctions.net/api`이고 **이게 그대로 `VITE_API_BASE_URL`**이다 — 함수 이름 `api`가 첫 경로 세그먼트라 Express는 그 뒤(`/api/ocr/meishi`)를 받는다. `.env.local`에 설정돼 있고 `.env.local`은 gitignore 대상이므로 **다른 환경에서 빌드할 땐 반드시 다시 넣어야 한다** — 빠뜨리면 웹은 멀쩡한데 앱만 조용히 실패한다.
    - **핵심 코드는 `functions/src/ocrRoutes.ts` 하나**다. dev 서버(`server.ts`)와 배포본이 같은 라우터를 mount하므로 갈라질 수 없다.
    - **CORS 허용 오리진에 `capacitor://localhost`가 반드시 있어야 한다.** 없으면 브라우저가 서버에 닿기도 전에 막는다. 검증: preflight 204 + 일치하는 allow-origin, 무관한 오리진은 헤더 없음.
    - `GEMINI_API_KEY`는 Secret Manager(`defineSecret`)로 런타임 주입한다. **`.value()`는 import 시점에 읽으면 안 된다** — 배포 도구가 모듈을 분석하는 동안에는 비어 있다. 그래서 `getApiKey: () => …` 게터로 받아 최초 사용 시에 읽는다. 빌드 산출물에 키가 0건인 것 확인함.
    - `firebase-admin`의 `Auth` 타입을 import하면 루트와 `functions/`의 설치본이 **명목적으로 달라 타입 에러**가 난다. 구조적 타입(`TokenVerifier`)으로 받는다.
    - **배포 첫 시도는 `iam.serviceaccounts.actAs` 403으로 실패한다.** Firebase가 방금 켠 API들의 서비스 계정이 아직 전파되지 않아서다. **잠시 뒤 재시도하면 그대로 성공한다** — 권한 설정을 뒤질 필요 없다.
    - Blaze 결제가 켜져 있어도 `functions:list`는 Cloud Functions API가 활성화되기 전까지 403 `SERVICE_DISABLED`를 낸다. **이건 결제 문제가 아니다** — `firebase deploy`가 알아서 켠다.
    - **에러 메시지를 원인별로 갈랐다.** 예전엔 서버에 닿지도 못했는데 「명함 인식 실패 — 밝은 곳에서 다시 찍으세요」라고 안내했다. 사진을 본 적도 없으면서 사진 탓을 한 것이다. `fetch`가 reject하는 경우(오프라인·DNS·TLS·CORS)도 같이 `OcrUnavailableError`로 묶었다. `detectCardCorners`는 "못 찾음"(null 반환 → 원본 사용)과 "물어볼 수가 없음"(재throw)을 구분한다.
25. **촬영 크롭은 가이드 프레임을 계산하지 말고 측정할 것 (2026-08)** — 「틀에 맞춰 찍었는데 사진이 밀려서 찍힌다」의 원인. `captureImage`가 가이드 위치를 상수로 재계산했는데(`가로 85%`, `1.6:1`, **컨테이너 정중앙**), 실제로는 중앙이 아니다. 오버레이가 `flex flex-col justify-center`로 **가이드 프레임 + 아래 캡션을 한 덩어리로** 중앙정렬하므로 프레임 자체는 캡션 높이의 절반만큼 위로 올라간다.
    - 브라우저에서 실측: 비디오 580px 높이에서 옛 코드는 top=**190px**을 가정했지만 실제 프레임은 top=**164px** — **26px 오차**(`mt-6` 24px + 캡션 줄높이 ≈ 28px의 절반). 그만큼 아래에서 잘라내니 결과물이 밀렸다.
    - 지금은 `guideRef`로 `getBoundingClientRect()`를 찍어 비디오 박스 기준 상대좌표를 쓴다. 가정이 사라져서 **레이아웃이 또 바뀌어도 따라간다.**

## 코딩 규칙 (docs/SPEC.md §9 요약)

- TypeScript strict, `any` 금지
- 일본어 카피는 정중체(です・ます), 버튼 라벨은 동사형 (「保存する」 등)
- 명함 데이터의 크로스 유저 노출 금지, `posts.author_id` 클라이언트 반환 금지
- 커밋 메시지는 Conventional Commits

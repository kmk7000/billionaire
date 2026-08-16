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
    - **앱 타겟에 직접 넣은 Capacitor 플러그인은 자동 등록되지 않는다.** `CapacitorBridge.registerPlugins()`는 번들된 `capacitor.config.json`의 `packageClassList`에 있는 클래스만 `NSClassFromString`으로 찾아 등록하는데, 이 목록은 `cap sync`가 **npm 플러그인 패키지에서만** 생성한다. 앱 타겟 안의 플러그인(`CallerIdIndexPlugin`)은 컴파일은 되지만 등록이 안 되어 JS에서 `{"code":"UNIMPLEMENTED"}`가 돌아온다. 해결책은 `capacitorDidLoad()`를 오버라이드하는 `CAPBridgeViewController` 서브클래스(`ios/App/App/MainViewController.swift`)에서 `bridge?.registerPluginType(...)`을 호출하는 것.
      - **함정**: 이 서브클래스는 **`SceneDelegate.swift`에서 지정해야 한다.** 이 앱의 scene은 root view controller를 코드로 만들기 때문에(`window?.rootViewController = MainViewController()`) `Main.storyboard`의 `customClass`는 **아예 읽히지 않는다** — 스토리보드만 고치면 아무 효과가 없다(한 번 헛짚었음).
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

## 코딩 규칙 (docs/SPEC.md §9 요약)

- TypeScript strict, `any` 금지
- 일본어 카피는 정중체(です・ます), 버튼 라벨은 동사형 (「保存する」 등)
- 명함 데이터의 크로스 유저 노출 금지, `posts.author_id` 클라이언트 반환 금지
- 커밋 메시지는 Conventional Commits

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
├── App.tsx                      # ⚠️ 메인 앱 전체 (~8,300줄 단일 파일 — AI Studio 산출물)
├── firebase.ts                  # Firebase 초기화 + 에러 핸들러
├── types/db.ts                  # Firestore 데이터 모델 타입
├── services/firestoreService.ts # Firestore CRUD
├── hooks/                       # useMeishiScanner(OCR), useContactsData, useCommunityPosts
├── components/                  # MeishiScannerModal, PublicCardView, SimpleLoginSettings
├── constants/theme.ts           # 디자인 토큰
└── utils/imageUtils.ts          # 이미지 처리
```

## 알려진 이슈 / 이관 시 주의사항

1. **`src/App.tsx`가 ~8,300줄 단일 파일** — AI Studio가 한 파일에 몰아넣은 상태. 기능 수정 시 점진적으로 컴포넌트/화면 단위로 분리할 것 (SPEC 규칙: 300줄 초과 시 분할).
2. **Firebase 프로젝트가 AI Studio 관리 프로젝트** (`ai-studio-applet-webapp-c0fee`) — 데이터가 Google 관리 인프라에 있음. 정식 출시 전 자체 Firebase 프로젝트로 이전 필요 (config 교체 + `firestore.rules` 배포).
3. **`GEMINI_API_KEY`가 클라이언트 번들에 주입됨** (`vite.config.ts`의 `define`) — 배포 시 키가 노출된다. OCR 호출을 서버 라우트로 옮겨야 함.
4. **LINE Client ID가 `server.ts`에 하드코딩** (`"2009585479"`) — env 변수 `LINE_CLIENT_ID`를 읽도록 수정 필요.
5. i18n 미적용 — 사용자 노출 문자열이 App.tsx에 하드코딩되어 있음 (SPEC은 `ja.json` 분리 요구).

## 코딩 규칙 (docs/SPEC.md §9 요약)

- TypeScript strict, `any` 금지
- 일본어 카피는 정중체(です・ます), 버튼 라벨은 동사형 (「保存する」 등)
- 명함 데이터의 크로스 유저 노출 금지, `posts.author_id` 클라이언트 반환 금지
- 커밋 메시지는 Conventional Commits

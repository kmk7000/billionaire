# 일본 시장용 전자명함 + 직장인 익명 커뮤니티 서비스 개발 지시서

> 이 문서는 AI 개발 에이전트(Claude Code / Cursor / Codex 등)에게 그대로 첨부하여 사용하는 마스터 프롬프트 겸 제품 명세서다.

---

## 0. 역할 지정 (Role)

**너는 시니어 풀스택 모바일 앱 개발자이자 프로덕트 아키텍트다.**

- 10년 이상 iOS/Android/Web을 동시에 출시해 온 경험이 있으며, 특히 일본 시장(App Store JP / Google Play JP) 심사와 일본 법규 대응 경험이 있다.
- 너는 코드를 짜기 전에 **아키텍처 판단 → 데이터 모델 → API 계약 → 화면 명세 → 구현** 순서로 사고한다.
- UI/UX는 전문 프로덕트 디자이너 수준의 결과물을 낸다. "일단 동작하는" 코드가 아니라 **출시 가능한 품질**의 코드를 쓴다.
- 불확실한 사항은 임의로 가정하지 말고 **가정(Assumption) 목록**으로 명시한 뒤 진행한다.
- 모든 산출물은 실제 파일로 생성하며, 스텁(`// TODO: implement`)을 남기지 않는다.

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 프로젝트 코드명 | `MeishiConnect` (가칭, 최종 브랜드명 미확정) |
| 타겟 시장 | 일본 (1차: 도쿄·오사카 화이트칼라 직장인) |
| 벤치마크 | 한국 **리멤버(Remember)** — 명함 관리 + 직장인 커뮤니티 + 커리어 |
| 핵심 가치 제안 | "紙の名刺を、キャリアの資産に。" (종이 명함을 커리어 자산으로) |
| 플랫폼 | iOS / Android 네이티브 앱 + 반응형 웹 (동시 운영) |
| 핵심 기능 | ① 전자명함(스캔·교환·관리) ② 직장인 익명 커뮤니티 |
| 수익화 (Phase 2 이후) | 스카우트/채용 DB, 기업 플랜, 프리미엄 검색 |

### 1.1 일본 시장 경쟁 환경 (반드시 인지할 것)

| 구분 | 기존 강자 | 우리의 차별점 |
|---|---|---|
| 명함 관리 | Sansan / Eight (개인용), myBridge (LINE) | 명함첩에서 끝나지 않고 **익명 커뮤니티·커리어로 연결** |
| 익명 직장인 커뮤니티 | OpenWork, 転職会議, X(트위터) 뒷계정 | 회사 인증 기반 **실체 있는 익명성**, 명함 데이터와 자연 연동 |
| 커리어/스카우트 | ビズリーチ, doda, Green | 명함=경력 증명 데이터로 **자동 프로필 생성** |

> **핵심 전략**: 일본에는 "Eight(명함)"와 "OpenWork(익명 리뷰)"가 따로 존재한다. 리멤버의 강점은 이 둘을 **하나의 유저 그래프**로 묶은 것이다. 이 통합이 본 제품의 유일한 해자다. 모든 기능 판단은 "이것이 명함↔커뮤니티↔커리어 루프를 강화하는가"를 기준으로 한다.

### 1.2 일본 명함 문화 대응 (한국과 다른 점 — 필수 반영)

1. **명함 교환은 상견례 의식**이다. 좌석 순서·직급 순서로 교환하며, 한 자리에서 5~10장이 오간다 → **다장 일괄 스캔(複数枚一括撮影)** 필수.
2. **세로형(縦型) 명함**이 약 20~30% 존재 → OCR이 세로쓰기(縦書き)를 인식해야 한다.
3. 표기 체계가 복잡: `株式会社` 전치/후치(前株/後株), `部署 > 課 > 係` 3단 조직, 役職(部長·課長·係長·主任·担当), 후리가나(ふりがな) 별도 필드.
4. **양면 명함**이 흔하다(앞: 일본어, 뒤: 영어) → 앞뒷면 병합 스캔 지원.
5. 개인정보 민감도가 한국보다 높다 → 명함 데이터의 **무단 공유·크롤링은 절대 금지**, 교환은 반드시 상호 동의 기반.

---

## 2. 기능 명세 (Functional Spec)

### 2.1 전자명함 (デジタル名刺)

#### A. 명함 스캔·등록
- 카메라 촬영 / 앨범 업로드 / **일괄 촬영(최대 10장 연속)**
- OCR 파이프라인:
  1. 이미지 전처리(원근 보정, 명함 경계 감지, 그림자 제거, 자동 회전)
  2. 일본어 OCR (세로/가로 혼재 대응)
  3. LLM 기반 필드 구조화 → JSON 정규화
  4. 유저 확인 화면(수정 가능) → 저장
- 정확도 목표: 필드 단위 95% 이상. **불확실 필드는 노란 하이라이트로 표시하고 사용자 확인을 유도**한다.

**OCR 추출 필드 스키마**
```json
{
  "company_name": "株式会社サンプル",
  "company_name_kana": "カブシキガイシャサンプル",
  "department": "営業本部 第一営業部",
  "section": "法人営業課",
  "title": "課長",
  "last_name": "田中", "first_name": "太郎",
  "last_name_kana": "たなか", "first_name_kana": "たろう",
  "last_name_en": "Tanaka", "first_name_en": "Taro",
  "email": "t.tanaka@sample.co.jp",
  "tel_company": "03-1234-5678",
  "tel_mobile": "090-1234-5678",
  "fax": "03-1234-5679",
  "postal_code": "107-0062",
  "address": "東京都港区南青山1-1-1",
  "website": "https://sample.co.jp",
  "confidence": { "company_name": 0.98, "title": 0.72 }
}
```

#### B. 내 디지털 명함 (マイ名刺)
- 프로필 카드 생성: 사진, 회사, 부서, 직책, 연락처, 한 줄 소개, SNS 링크
- **QR 코드 교환**: 대면에서 QR 스캔 한 번으로 상호 교환 (양방향 동의 모델)
- 공유 URL: `https://{domain}/c/{handle}` — OG 이미지 자동 생성, 앱 미설치자도 열람 가능
- **Apple Wallet / Google Wallet 패스 발급** (Phase 2)
- 명함 디자인 템플릿 5종 이상 (일본 비즈니스 톤: 절제된 화이트/네이비/그레이 계열)

#### C. 명함첩 (名刺管理)
- 리스트 / 그리드 뷰 전환
- 검색: 성명, 회사명, 카나 검색, **로마자 검색**, 부서, 태그, 만난 날짜
- **カナ順(50음순) 인덱스 사이드바** — 일본 유저에게는 필수 UI 패턴 (あ/か/さ/た/な…)
- 회사별 자동 그룹핑, 태그, 메모, 만난 장소·날짜 기록
- 명함 변경 감지: 상대가 이직/승진 시 자동 업데이트 알림 (양측 앱 유저인 경우)
- CSV / vCard 내보내기, 구글 연락처 동기화

#### D. 인맥 그래프
- "같은 회사 사람 N명", "1촌/2촌 연결" 시각화
- 상대의 프로필 열람 이력 알림(프리미엄)

---

### 2.2 직장인 익명 커뮤니티 (匿名コミュニティ)

#### A. 회사 인증 (会社認証) — 서비스 신뢰의 근간
인증 수단 (하나 이상 통과 시 인증 배지 부여):
1. **회사 이메일 도메인 인증** (주 수단) — `@company.co.jp` 로 6자리 코드 발송
2. 명함 스캔 인증 (본인 명함 + 셀피 대조, 수동 심사)
3. 재직증명서/급여명세서(給与明細) 업로드 → 수동 심사

- 무료 도메인(gmail/yahoo/outlook 등) **차단 리스트** 운영
- 인증 후 표기는 **회사명 + 업계**만 노출, 개인 식별 정보는 절대 노출 금지
- 퇴사 후에도 "元○○社" 로 6개월간 열람 가능 (설정값)

#### B. 게시판 구조
```
전체 피드 (おすすめ / 新着)
├── 회사 라운지 (自社ラウンジ)      ← 같은 회사 인증자만 입장
├── 업계 라운지 (業界ラウンジ)      ← IT, 金融, 商社, メーカー, コンサル, 広告, 医療, 公務員 …
├── 토픽 게시판
│   ├── 転職・キャリア (이직/커리어)
│   ├── 給与・待遇 (급여/처우)
│   ├── 職場の人間関係 (직장 인간관계)
│   ├── マネジメント (매니지먼트)
│   ├── 副業・投資 (부업/투자)
│   └── 雑談 (잡담)
└── Q&A (질문 → 답변 채택)
```

#### C. 게시글 기능
- 익명 닉네임 자동 생성(사용자 변경 불가, 스레드 단위 고정 표시 예: `匿名の営業部長`)
- 작성자 표기: `業界名 + 職種` 또는 `会社名(인증됨)` 중 사용자 선택
- 좋아요(いいね) / 댓글 / 대댓글 / 북마크 / 공유
- 이미지 첨부(최대 4장, EXIF 위치정보 자동 제거 — **필수**)
- 투표(アンケート) 기능
- 익명 DM (양측 수락 시 개설)

#### D. 신뢰·안전 (UGC 심사 통과의 핵심 — 절대 생략 금지)
> App Store Review Guideline 1.2 (User-Generated Content) 및 일본 정보유통플랫폼대처법 대응.
> 아래 5개가 없으면 **심사 리젝된다**.

1. **콘텐츠 필터**: 게시 전 NG워드 + AI 모더레이션(욕설·차별·개인정보·회사 기밀·명예훼손) 자동 검사
2. **신고(報告) 버튼**: 모든 게시글/댓글/유저에 노출
3. **유저 차단(ブロック)**: 차단 시 상호 콘텐츠 완전 비노출
4. **24시간 내 대응**: 신고 접수 → 24시간 내 처리하는 관리자 대시보드 + 운영 SLA
5. **이용약관 동의(EULA)**: 무관용(zero-tolerance) 조항 명시, 가입 시 명시적 동의

추가 안전장치:
- 개인명·전화번호·메일주소 자동 마스킹
- 특정 개인 저격 게시물 자동 탐지 → 보류(shadow hold)
- 신고 누적 3회 시 자동 비공개 → 관리자 리뷰
- 계정 정지/영구 차단 단계별 정책

---

### 2.3 커리어 (Phase 2)
- 명함 데이터 기반 **직무경력서(職務経歴書) 자동 초안 생성**
- 스카우트 수신 설정 (현재 회사 관계자에게는 비노출 — "現職ブロック" 필수 기능)
- 기업 계정: 스카우트 발송, 후보자 검색

---

## 3. 기술 스택 (Tech Stack)

**모노레포 기반 코드 공유 — 웹/앱 동시 운영의 핵심**

```
meishi-connect/
├── apps/
│   ├── mobile/          # Expo (React Native) — iOS/Android
│   ├── web/             # Next.js 15 (App Router) — 웹 서비스 + 랜딩 + 공개 명함 페이지
│   └── admin/           # Next.js — 운영 관리자 (모더레이션, 인증 심사, 통계)
├── packages/
│   ├── ui/              # 디자인 시스템 (Tamagui 또는 NativeWind 기반 공용 컴포넌트)
│   ├── core/            # 비즈니스 로직, 타입, zod 스키마, API 클라이언트 (플랫폼 무관)
│   ├── api/             # tRPC 라우터 정의 (타입 안전 계약)
│   └── config/          # eslint, tsconfig, tailwind preset 공유
└── supabase/            # DB 마이그레이션, RLS 정책, Edge Functions
```

| 레이어 | 선택 | 사유 |
|---|---|---|
| 언어 | TypeScript (strict) | 웹/앱 타입 공유 |
| 모노레포 | Turborepo + pnpm | 빌드 캐시, 워크스페이스 |
| 모바일 | Expo SDK (최신 안정), Expo Router | OTA 업데이트, 카메라·푸시 통합 용이 |
| 웹 | Next.js App Router | SEO(공개 명함 페이지·커뮤니티 SEO 유입) |
| UI 공유 | **NativeWind + Tailwind** (RN/Web 동일 토큰) | 디자인 토큰 1소스 |
| 상태 | TanStack Query + Zustand | 서버상태/클라이언트상태 분리 |
| 백엔드 | Supabase (Postgres + Auth + Storage + Realtime) | RLS로 익명성 경계 강제 가능, 초기 속도 |
| API 계약 | tRPC (또는 Supabase RPC + zod) | 프론트-백 타입 일치 |
| OCR | Google Cloud Vision (일본어 세로쓰기 지원) → LLM 후처리 구조화 | 일본어 OCR 정확도 |
| 모더레이션 | LLM 기반 분류 + NG워드 사전 | 실시간 필터 |
| 푸시 | Expo Notifications (APNs/FCM) | |
| 인증 | 이메일 OTP + Apple 로그인(iOS 필수) + **LINE 로그인** | 일본은 LINE 필수급 |
| 분석 | PostHog 또는 Firebase Analytics | 퍼널 추적 |
| 에러 | Sentry | |
| CI/CD | GitHub Actions + EAS Build/Submit + Vercel | |
| 이미지 | Supabase Storage + 서버측 리사이즈/EXIF 제거 | 개인정보 보호 |

> **제약**: 커뮤니티 기능은 WebView 껍데기 앱으로 제출하면 App Store 4.2(Minimum Functionality)로 리젝될 확률이 높다. **네이티브 구현을 원칙으로 한다.** 웹은 별도 반응형 사이트로 운영한다.

---

## 4. 데이터 모델 (핵심 테이블)

```sql
-- 유저
users(id uuid pk, auth_id, email, phone, display_name, avatar_url,
      locale default 'ja', created_at, deleted_at)

-- 회사 마스터 (법인번호 기반 정규화)
companies(id, name, name_kana, corporate_number, domain[], industry_code,
          employee_range, prefecture, verified boolean)

-- 재직 정보 / 인증 상태
employments(id, user_id, company_id, department, section, title,
            start_date, end_date, is_current,
            verification_status enum('none','pending','verified','rejected'),
            verification_method enum('email','card','document'))

-- 내 디지털 명함
my_cards(id, user_id, employment_id, handle unique, template_id,
         intro_text, links jsonb, is_public, view_count)

-- 수집한 명함 (OCR 결과 + 원본)
contacts(id, owner_id, source enum('ocr','qr','manual','import'),
         raw_image_front_url, raw_image_back_url, ocr_json jsonb,
         company_name, department, title, last_name, first_name,
         last_name_kana, first_name_kana, email, tel_company, tel_mobile,
         address, met_at date, met_place, memo, linked_user_id nullable)

contact_tags(contact_id, tag_id)

-- 명함 교환 (양방향 동의)
exchanges(id, from_user_id, to_user_id, status enum('pending','accepted','declined'),
          method enum('qr','link','nfc'), created_at)

-- 커뮤니티
boards(id, type enum('company','industry','topic','qa'), key, name_ja, description, access_rule jsonb)
posts(id, board_id, author_id, anon_handle, author_label,
      title, body, images jsonb, poll jsonb,
      like_count, comment_count, status enum('published','held','hidden','deleted'), created_at)
comments(id, post_id, parent_id, author_id, anon_handle, body, like_count, status)
reactions(user_id, target_type, target_id, kind)
bookmarks(user_id, post_id)

-- 안전
reports(id, reporter_id, target_type, target_id, reason enum, detail,
        status enum('open','reviewing','actioned','dismissed'),
        handled_by, handled_at)   -- 24시간 SLA 추적
blocks(blocker_id, blocked_id, created_at)
moderation_logs(id, target_type, target_id, model_verdict jsonb, action, actor)

-- 알림
notifications(id, user_id, type, payload jsonb, read_at)
```

**RLS 정책 요구사항 (반드시 구현)**
- `contacts`: `owner_id = auth.uid()` 인 행만 접근. 타인 명함첩 조회 절대 불가.
- `posts.author_id`: 클라이언트로 **절대 반환되지 않아야 한다**. 뷰(`posts_public`)를 통해 `anon_handle`만 노출.
- 회사 라운지: 해당 `company_id`에 `verification_status='verified'` 인 유저만 SELECT 가능.
- 차단 관계는 쿼리 레벨에서 양방향 필터링.

---

## 5. UI/UX 디자인 시스템

### 5.1 디자인 방향성
- 컨셉: **「静かな信頼(조용한 신뢰)」** — 일본 비즈니스 유저는 화려한 UI를 신뢰하지 않는다. 여백, 정렬, 절제된 대비로 신뢰감을 만든다.
- 명함첩 = 정보 밀도가 높은 실용 도구 / 커뮤니티 = 편안한 읽기 경험. **두 영역의 밀도를 의도적으로 다르게** 설계한다.
- 금지: 과도한 그라데이션, 네온 컬러, 이모지 남발, 둥근 모서리 20px 이상, 불필요한 애니메이션.

### 5.2 디자인 토큰
```ts
// packages/ui/tokens.ts
export const color = {
  ink:        '#141A21',   // 기본 텍스트 (순검정 금지 — 일본어 한자 가독성)
  inkMuted:   '#5B6672',
  inkFaint:   '#8B95A1',
  line:       '#E5E8EB',
  surface:    '#FFFFFF',
  canvas:     '#F7F8FA',
  primary:    '#0B4F8C',   // 藍(아이) 계열 네이비 — 일본 비즈니스 신뢰색
  primarySoft:'#E8F0F8',
  accent:     '#C9483B',   // 朱色(슈이로) — 도장/인주 컬러, 강조는 여기 한 곳만
  success:    '#1F8A5B',
  warning:    '#B8860B',
  danger:     '#C0392B',
} as const;

export const radius = { sm: 4, md: 8, lg: 12, card: 10, full: 999 };
export const space  = { 1:4, 2:8, 3:12, 4:16, 5:20, 6:24, 8:32, 10:40, 12:48 };
```

**시그니처 요소**: 명함 카드 좌측에 세로로 들어가는 **朱色 1px 인주 라인** — 일본 명함의 사판(社判) 문화를 차용한 식별자. 이 요소 외의 모든 곳은 무채색으로 조용하게 유지한다.

### 5.3 타이포그래피 — 일본어 UI의 성패를 가른다
```ts
export const font = {
  ja: 'Noto Sans JP',       // 본문. 한자 자형이 일본식(区/直/骨)이어야 함 — 한국/중국 폰트 대체 금지
  jaDisplay: 'Zen Kaku Gothic New', // 헤드라인·명함 템플릿
  num: 'Inter',             // 숫자/영문 (일본어 폰트의 숫자는 폭이 어색함)
};

export const type = {
  display: { size: 24, lineHeight: 1.4,  weight: 700, tracking: 0.02 },
  title:   { size: 18, lineHeight: 1.5,  weight: 700 },
  body:    { size: 15, lineHeight: 1.75, weight: 400 }, // 일본어는 행간 1.7~1.8이 표준
  caption: { size: 13, lineHeight: 1.6,  weight: 400 },
  label:   { size: 11, lineHeight: 1.4,  weight: 500, tracking: 0.06 },
};
```

**일본어 조판 필수 규칙**
1. 행간(line-height) **1.7 이상**. 한국어/영어 기준 1.5를 쓰면 일본어는 답답해 보인다.
2. `word-break: break-strict` / `line-break: strict`, `overflow-wrap: anywhere` — 금칙문자(、。」）) 행두 방지.
3. 텍스트 양끝맞춤 금지, 좌측 정렬 고정.
4. 회사명은 최대 2줄 말줄임(`株式会社`가 길다). 리스트에서는 `株式会社` 접두어 축약 표시 옵션 제공.
5. 후리가나 필드는 본문보다 2px 작게, `inkFaint` 컬러.
6. 버튼 라벨은 **동사 그대로**: 「保存する」「交換する」「投稿する」— 「送信」같은 시스템 용어 금지.

### 5.4 컴포넌트 라이브러리 (필수 구현)
`Button(primary/secondary/ghost/danger)`, `Input`, `Select`, `SearchBar`, `Chip/Tag`, `Avatar`, `BusinessCard(명함 카드 5종 템플릿)`, `ContactListItem`, `KanaIndexBar`, `PostCard`, `CommentThread`, `BottomSheet`, `Modal`, `Toast`, `Skeleton`, `EmptyState`, `ReportSheet`, `TabBar`, `SegmentedControl`

### 5.5 접근성·품질 기준 (Quality Floor)
- 터치 타겟 최소 44×44pt
- 텍스트 대비 WCAG AA (4.5:1) 충족
- 다이내믹 타입(글자 크기 설정) 대응
- `prefers-reduced-motion` 존중
- 다크 모드 대응 (Phase 1.5)
- 웹: 키보드 포커스 링 가시화, 시맨틱 HTML

---

## 6. 화면 명세 (Screen Spec)

### 모바일 탭 구조
```
[ 名刺 ]  [ コミュニティ ]  [ ＋ ]  [ 通知 ]  [ マイページ ]
```
`＋` 는 중앙 FAB: 명함 스캔 / QR 교환 / 글쓰기 3분기 액션시트.

| # | 화면 | 핵심 요소 |
|---|---|---|
| S-01 | 온보딩 | 3스텝 밸류 소개 → 가입. 가치 소개는 "명함 정리"가 아니라 "커리어 자산화"로 프레이밍 |
| S-02 | 로그인/가입 | 이메일 OTP / LINE / Apple. 전화번호 요구 금지(이탈 요인) |
| S-03 | 회사 인증 | 회사 메일 입력 → 6자리 코드. 대체 수단 안내 명확히 |
| S-04 | 명함 스캔 | 실시간 경계 가이드 프레임, 연속 촬영 카운터, 앞/뒤면 토글 |
| S-05 | OCR 결과 확인 | 좌측 원본 이미지 / 우측 필드. 저신뢰 필드 노란 밑줄 |
| S-06 | 명함첩 | 검색바 상단 고정 + カナ 인덱스 우측 + 필터 칩(회사/태그/기간) |
| S-07 | 명함 상세 | 명함 이미지, 필드, 전화/메일/지도 원탭 액션, 메모, 만난 기록 |
| S-08 | 내 명함 | 템플릿 선택, 실시간 프리뷰, QR 표시(밝기 자동 최대화) |
| S-09 | QR 교환 | 상단 내 QR / 하단 스캐너. 교환 성공 시 하프틱 + 확인 애니메이션 |
| S-10 | 커뮤니티 피드 | 상단 세그먼트(おすすめ/新着/自社), 무한 스크롤, 카드형 |
| S-11 | 게시글 상세 | 본문 → 반응 → 댓글 스레드. 우상단 ⋯ 에 신고/차단 상시 노출 |
| S-12 | 글쓰기 | 보드 선택 → 작성자 표기 선택 → 본문. 게시 전 모더레이션 결과 인라인 안내 |
| S-13 | 알림 | 교환 요청 / 댓글 / 좋아요 / 인증 결과 분류 탭 |
| S-14 | 마이페이지 | 프로필, 인증 배지, 설정, 데이터 내보내기, **탈퇴(완전 삭제)** |
| S-15 | 신고 시트 | 사유 선택 → 상세 → 제출 → "24시간 이내 확인" 안내 |

### 웹 전용 화면
| # | 화면 | 목적 |
|---|---|---|
| W-01 | 랜딩 | 서비스 소개, 앱 다운로드 유도 |
| W-02 | 공개 명함 페이지 `/c/{handle}` | 앱 미설치자도 열람, OG 이미지, vCard 다운로드, SEO |
| W-03 | 커뮤니티 웹 뷰 | 인기글 SEO 인덱싱(회사 라운지는 `noindex`) |
| W-04 | 데스크톱 명함 관리 | 대량 편집, CSV 임포트/익스포트 — 데스크톱이 우위인 작업만 |
| W-05 | 기업/법인 문의 | B2B 리드 수집 |

---

## 7. 일본 법규·컴플라이언스 (구현 전 반드시 반영)

1. **個人情報保護法 (APPI)**
   - 이용목적 명시·동의 취득, 제3자 제공 원칙 금지
   - 명함 데이터는 개인정보 → 수집한 명함의 외부 공개·판매 금지
   - 삭제 요청(削除請求) 대응 기능 필수 → 계정 탈퇴 시 30일 내 완전 삭제
   - 개인정보 보호 담당자·문의창구를 앱 내 명시
2. **電気通信事業法 「外部送信規律」** — 광고·분석 SDK가 유저 단말 정보를 외부 송신할 경우 앱/웹에 **송신 항목·수신처를 공표**해야 한다. 설정 화면에 전용 페이지를 만들 것.
3. **情報流通プラットフォーム対処法 (구 プロバイダ責任制限法)** — 명예훼손 게시물 삭제 요청 창구 설치, 신속 대응 의무. 신고 처리 로그를 보존한다.
4. **特定商取引法** — 유료 플랜 도입 시 사업자 정보·요금·해약 조건 표기 페이지 필수.
5. **App Store / Google Play**
   - UGC 앱: 필터·신고·차단·24시간 대응·EULA (5요소) 전부 필요
   - iOS: Sign in with Apple 필수(타사 소셜 로그인 사용 시)
   - 개인정보 라벨(Privacy Nutrition Label) / Data Safety 정확히 기재
   - 연령 등급: 17+ 검토 (익명 커뮤니티)
6. **문서 산출물**: 利用規約 / プライバシーポリシー / 特定商取引法に基づく表記 / コミュニティガイドライン 초안(일본어)을 함께 작성할 것.

---

## 8. 개발 로드맵

| Phase | 기간 | 범위 |
|---|---|---|
| **P0 설계** | 1~2주 | 아키텍처 확정, 디자인 시스템, DB 스키마, API 계약 |
| **P1 MVP** | 6~8주 | 가입/회사인증, 명함 스캔·명함첩, 내 명함·QR 교환, 커뮤니티(피드/작성/댓글/신고/차단), 관리자 모더레이션, 웹 공개 명함 페이지 |
| **P2** | +6주 | 인맥 그래프, 익명 DM, 알림 고도화, 웹 풀버전, 다크모드, Wallet 패스 |
| **P3** | +8주 | 커리어/스카우트, 기업 계정, 유료 플랜, 데이터 분석 대시보드 |

**MVP 성공 지표**
- D7 리텐션 25% 이상
- 가입자당 평균 명함 등록 8장 이상 (첫 7일)
- 회사 인증 완료율 40% 이상
- 커뮤니티 주간 게시 유저 비율(WAP/WAU) 8% 이상

---

## 9. 작업 지시 (Execution Rules)

너는 다음 순서로 진행한다. **각 단계 완료 시 산출물을 보여주고 다음 단계로 넘어가기 전 확인을 받는다.**

1. **STEP 1 — 아키텍처 확정서**: 위 스택에 대한 검토 의견(교체가 필요한 부분은 근거와 함께 제안), 모노레포 디렉토리 트리 확정, 가정(Assumption) 목록
2. **STEP 2 — 디자인 시스템**: 토큰 파일, 컴포넌트 목록, 주요 화면 3개(명함첩/명함상세/커뮤니티 피드)의 고충실도 UI 시안(웹 HTML 프로토타입으로 먼저 확인)
3. **STEP 3 — 데이터 레이어**: SQL 마이그레이션, RLS 정책, seed 데이터
4. **STEP 4 — API 레이어**: tRPC 라우터 + zod 스키마 + 에러 규약
5. **STEP 5 — 모바일 앱**: 화면 단위 구현 (S-01부터 순차), 각 화면마다 로딩/에러/빈 상태 3종 반드시 구현
6. **STEP 6 — 웹**: W-01~W-05
7. **STEP 7 — 관리자 대시보드**: 신고 큐(SLA 타이머 포함), 인증 심사, 유저 관리
8. **STEP 8 — 출시 준비**: 스토어 메타데이터(일본어), 스크린샷 사양, 개인정보 라벨, 약관 4종, 심사 대응 체크리스트

**코딩 규칙**
- TypeScript strict, `any` 금지
- 모든 사용자 노출 문자열은 i18n 리소스(`ja.json`)로 분리. 하드코딩 금지. 기본 언어 `ja`, 확장 대비 `en`/`ko` 키 구조 유지
- 일본어 카피는 **정중체(です・ます)** 기본, 버튼/라벨은 명령형 회피하고 동작 명사·동사 사용
- 컴포넌트 단위 파일 분리, 300줄 초과 시 분할
- 서버 응답은 항상 `{ data, error }` 형태 판별 유니온
- 개인정보를 로그·에러 리포트에 남기지 않는다 (Sentry 스크러빙 설정 포함)
- 커밋 메시지는 Conventional Commits

**금지사항**
- 명함 데이터의 크로스 유저 노출을 유발하는 어떤 기능도 구현하지 않는다
- `posts.author_id`를 클라이언트에 반환하는 코드를 작성하지 않는다
- 모더레이션·신고·차단 기능을 "나중에"로 미루지 않는다 (심사 직결)
- 커뮤니티를 WebView로 감싸 앱으로 제출하지 않는다

---

## 10. 첫 번째 요청

**STEP 1을 시작하라.**
아키텍처 확정서, 모노레포 디렉토리 트리, 기술 선택에 대한 검토 의견(특히 Supabase vs Firebase, NativeWind vs Tamagui, OCR 엔진 선택), 그리고 이 명세에서 네가 발견한 리스크·모호한 지점 목록을 제시하라.

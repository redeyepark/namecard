---
id: SPEC-CUSTOM-THEME-001
version: "1.0.0"
status: planned
created: "2026-02-27"
updated: "2026-02-27"
author: MoAI
priority: high
---

## HISTORY

| 버전  | 날짜       | 작성자 | 변경 내용           |
| ----- | ---------- | ------ | ------------------- |
| 1.0.0 | 2026-02-27 | MoAI   | 초기 SPEC 문서 작성 |

---

# SPEC-CUSTOM-THEME-001: 관리자 커스텀 테마 생성 및 관리

## 요약

관리자가 개발자 개입 없이 관리자 패널에서 커스텀 테마를 생성, 편집, 삭제할 수 있는 기능을 추가한다. 커스텀 테마는 기존 레이아웃 템플릿(classic, nametag)을 기반으로 색상, 폰트, 테두리 스타일, 커스텀 메타데이터 필드를 커스터마이징하는 방식이다. 완전히 자유로운 디자인이 아니라, 검증된 기본 템플릿 위에 시각적 속성을 변경하는 구조를 취한다. 기존 6개 빌트인 테마는 100% 하위 호환을 보장한다.

## 배경 (Environment)

- **프로젝트**: Namecard Editor - Next.js 16.1.6, React 19, TypeScript 5, Tailwind CSS 4, Zustand 5, Supabase 기반 웹 애플리케이션
- **배포 환경**: Cloudflare Workers
- **현재 테마 시스템**: 6개 하드코딩된 빌트인 테마 (`classic`, `pokemon`, `hearthstone`, `harrypotter`, `tarot`, `nametag`)
  - `CardTheme` = TypeScript 유니온 리터럴 타입
  - 각 테마별 전용 Front/Back 컴포넌트 (예: `PokemonCardFront.tsx`, `TarotCardBack.tsx`)
  - 테마 설정(색상, 라벨)이 4개 이상 파일에 하드코딩된 객체로 중복 존재
  - DB: `card_requests` 테이블에 `theme TEXT DEFAULT 'classic'` + 테마별 JSONB 메타데이터 컬럼
- **관리자 패널 현황**:
  - `/admin/themes` 페이지: ThemeListBox + ThemePreviewPanel + ThemeEditPanel + 일괄 적용 (SPEC-THEME-002에서 구현)
  - `GET /api/admin/themes`: 테마별 의뢰 통계 반환
  - `PATCH /api/admin/themes`: 테마 일괄 적용
- **이미지 내보내기**: `html-to-image` 라이브러리 사용, inline style 필수
- **디자인 시스템**: Deep navy (#020912) + off-white (#fcfcfc), Sharp corners (0px border-radius), 최소 터치 타겟 44px
- **기존 SPEC 참조**: SPEC-THEME-001 (빌트인 테마 시스템), SPEC-THEME-002 (테마 UI 개선)

## 가정 (Assumptions)

- 커스텀 테마는 기존 빌트인 테마를 대체하지 않으며, 빌트인 테마와 병렬로 공존한다
- 커스텀 테마의 레이아웃은 기본 템플릿(`classic` 또는 `nametag` 스타일)을 기반으로 하되, 시각적 속성(색상, 폰트, 테두리)만 커스터마이징 가능하다
- 커스텀 테마 정의는 Supabase `custom_themes` 테이블에 저장되며, 클라이언트에서 API를 통해 조회한다
- `CardTheme` 타입은 기존 리터럴 유니온을 유지하면서 `string` 타입으로 확장하여 커스텀 테마 slug를 지원한다
- 커스텀 테마의 카드 렌더링은 `CustomThemeCardFront.tsx` / `CustomThemeCardBack.tsx` 범용 컴포넌트가 담당하며, 테마 정의 데이터에 따라 동적 스타일링된다
- `html-to-image` 호환성을 위해 모든 커스텀 테마 스타일은 inline style로 적용된다
- 커스텀 테마의 메타데이터 필드는 관리자가 정의하는 선택적 키-값 쌍이며, 빌트인 테마의 복잡한 메타데이터(Pokemon 타입, HP 기숙사 등)와는 다른 구조이다
- 관리자만 커스텀 테마를 생성/편집/삭제할 수 있으며, 일반 사용자는 조회만 가능하다
- 커스텀 테마가 의뢰에 사용 중인 경우 삭제가 차단된다

---

## 요구사항 (Requirements)

### Ubiquitous (보편적 요구사항)

**REQ-U-001**: 시스템은 **항상** 기존 6개 빌트인 테마(`classic`, `pokemon`, `hearthstone`, `harrypotter`, `tarot`, `nametag`)를 변경 없이 지원해야 한다.

**REQ-U-002**: 시스템은 **항상** 빌트인 테마와 커스텀 테마를 함께 ThemeSelector에 표시해야 한다.

**REQ-U-003**: 시스템은 **항상** 커스텀 테마 렌더링 시 inline style을 사용하여 `html-to-image` PNG 내보내기와 호환되어야 한다.

**REQ-U-004**: 시스템은 **항상** 커스텀 테마 데이터를 Supabase `custom_themes` 테이블에서 관리해야 한다.

**REQ-U-005**: 시스템은 **항상** 프로젝트 디자인 시스템(Deep navy #020912, off-white #fcfcfc, Sharp corners 0px, 최소 터치 타겟 44px)을 준수해야 한다.

### Event-Driven (이벤트 기반 요구사항)

#### 관리자 테마 CRUD (REQ-AC)

**REQ-AC-001**: **WHEN** 관리자가 "새 커스텀 테마 만들기" 버튼을 클릭 **THEN** 테마 생성 폼이 표시되어야 하며, 다음 필드를 포함해야 한다:
- 테마 이름 (한국어)
- 테마 slug (영문, URL-safe, 고유)
- 기본 레이아웃 템플릿 선택 (`classic` 스타일 / `nametag` 스타일)
- 앞면 색상: 배경색, 텍스트색, 테두리색
- 뒷면 색상: 배경색, 텍스트색, 테두리색
- 악센트 색상 (테마 대표색)
- 폰트 패밀리 선택 (사용 가능한 웹 폰트 목록에서 선택)
- 테두리 스타일 (none / solid / double) 및 두께 (0-12px)
- 커스텀 메타데이터 필드 (선택적, 키-값 쌍 동적 추가/삭제)

**REQ-AC-002**: **WHEN** 관리자가 테마 생성 폼을 제출 **THEN** 시스템은 입력값을 검증하고 `custom_themes` 테이블에 저장한 후 테마 목록을 갱신해야 한다.

**REQ-AC-003**: **WHEN** 관리자가 기존 커스텀 테마의 "편집" 버튼을 클릭 **THEN** 해당 테마의 현재 설정이 편집 폼에 채워져 표시되어야 한다.

**REQ-AC-004**: **WHEN** 관리자가 커스텀 테마 편집을 완료하고 저장 **THEN** 변경사항이 DB에 반영되고, 해당 테마를 사용하는 기존 카드의 렌더링도 업데이트되어야 한다.

**REQ-AC-005**: **WHEN** 관리자가 커스텀 테마의 "삭제" 버튼을 클릭 **THEN** 시스템은 해당 테마를 사용하는 의뢰가 있는지 확인해야 한다.

**REQ-AC-006**: **WHEN** 삭제 대상 커스텀 테마에 연결된 의뢰가 0건인 경우 **THEN** 삭제 확인 다이얼로그를 표시하고, 확인 시 삭제를 수행해야 한다.

**REQ-AC-007**: **WHEN** 삭제 대상 커스텀 테마에 연결된 의뢰가 1건 이상인 경우 **THEN** "이 테마를 사용하는 의뢰가 N건 있어 삭제할 수 없습니다" 메시지를 표시하고 삭제를 차단해야 한다.

#### 테마 미리보기 (REQ-PV)

**REQ-PV-001**: **WHEN** 관리자가 테마 생성/편집 폼에서 속성을 변경 **THEN** 옆에 있는 카드 미리보기가 변경사항을 실시간으로 반영해야 한다.

**REQ-PV-002**: **WHEN** 카드 미리보기에서 앞면/뒷면 토글을 클릭 **THEN** 카드의 해당 면이 커스텀 스타일이 적용된 상태로 표시되어야 한다.

#### 사용자 테마 선택 (REQ-US)

**REQ-US-001**: **WHEN** 사용자가 명함 에디터의 ThemeSelector를 열 때 **THEN** 빌트인 테마 6개와 활성화된 커스텀 테마가 함께 표시되어야 한다.

**REQ-US-002**: **WHEN** 사용자가 커스텀 테마를 선택 **THEN** 해당 테마의 기본 템플릿 레이아웃에 커스텀 색상/폰트/테두리가 적용된 카드가 미리보기에 표시되어야 한다.

**REQ-US-003**: **WHEN** 사용자가 커스텀 테마로 카드를 생성하여 제출 **THEN** `card_requests` 테이블에 `theme` 컬럼 값으로 커스텀 테마 slug가 저장되어야 한다.

#### API (REQ-API)

**REQ-API-001**: **WHEN** `GET /api/admin/custom-themes` 요청이 들어오면 **THEN** 모든 커스텀 테마 목록을 반환해야 한다 (관리자 인증 필요).

**REQ-API-002**: **WHEN** `POST /api/admin/custom-themes` 요청이 들어오면 **THEN** 새 커스텀 테마를 생성하고 저장해야 한다 (관리자 인증 필요, 입력 검증 포함).

**REQ-API-003**: **WHEN** `PATCH /api/admin/custom-themes/[id]` 요청이 들어오면 **THEN** 해당 커스텀 테마를 업데이트해야 한다 (관리자 인증 필요).

**REQ-API-004**: **WHEN** `DELETE /api/admin/custom-themes/[id]` 요청이 들어오면 **THEN** 해당 커스텀 테마를 삭제해야 한다 (사용 중인 의뢰가 없는 경우에만).

**REQ-API-005**: **WHEN** `GET /api/themes` 요청이 들어오면 **THEN** 빌트인 테마 메타데이터와 활성화된 커스텀 테마 목록을 통합하여 반환해야 한다 (인증 불필요, 공개 API).

### State-Driven (상태 기반 요구사항)

**REQ-S-001**: **IF** 커스텀 테마 목록이 로딩 중인 상태 **THEN** ThemeSelector에서 빌트인 테마만 먼저 표시하고, 커스텀 테마 영역에 로딩 스켈레톤을 표시해야 한다.

**REQ-S-002**: **IF** `card_requests.theme` 값이 삭제된 커스텀 테마의 slug인 상태 **THEN** 해당 카드는 `classic` 테마로 폴백 렌더링해야 한다.

**REQ-S-003**: **IF** 커스텀 테마의 `is_active` 가 `false` 상태 **THEN** 해당 테마는 ThemeSelector에 표시되지 않아야 한다 (관리자 패널에서는 표시).

**REQ-S-004**: **IF** 커스텀 테마 API 호출이 실패한 상태 **THEN** ThemeSelector는 빌트인 테마만으로 정상 동작해야 한다 (graceful degradation).

### Unwanted (금지 요구사항)

**REQ-N-001**: 커스텀 테마 기능 추가로 인해 기존 빌트인 테마의 동작이 변경되**지 않아야 한다**.

**REQ-N-002**: 커스텀 테마 slug는 빌트인 테마 ID(`classic`, `pokemon`, `hearthstone`, `harrypotter`, `tarot`, `nametag`)와 중복되**지 않아야 한다**.

**REQ-N-003**: 커스텀 테마 편집/삭제 권한이 일반 사용자에게 노출되**지 않아야 한다**.

**REQ-N-004**: 커스텀 테마 렌더링이 `html-to-image` PNG 내보내기를 깨뜨리**지 않아야 한다** (Tailwind 클래스 의존 금지, inline style만 사용).

### Optional (선택적 요구사항)

**REQ-O-001**: **가능하면** 커스텀 테마 생성 시 기존 테마를 "복제"하여 시작할 수 있는 기능을 제공한다.

**REQ-O-002**: **가능하면** 커스텀 테마에 관리자가 업로드한 배경 이미지/패턴을 적용할 수 있는 기능을 제공한다.

**REQ-O-003**: **가능하면** 커스텀 테마의 표시 순서를 관리자가 드래그 앤 드롭으로 변경할 수 있는 기능을 제공한다.

---

## 명세 (Specifications)

### 1. 데이터베이스 스키마

#### 1.1 `custom_themes` 테이블 (신규)

```sql
-- supabase/migrations/007_add_custom_themes.sql

CREATE TABLE custom_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,          -- URL-safe English identifier (e.g., 'corporate-blue')
  name TEXT NOT NULL,                  -- Korean display name (e.g., '기업 블루')
  base_template TEXT NOT NULL DEFAULT 'classic'
    CHECK (base_template IN ('classic', 'nametag')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- Front side styling
  front_bg_color TEXT NOT NULL DEFAULT '#FFFFFF',
  front_text_color TEXT NOT NULL DEFAULT '#000000',
  front_border_color TEXT NOT NULL DEFAULT '#020912',

  -- Back side styling
  back_bg_color TEXT NOT NULL DEFAULT '#000000',
  back_text_color TEXT NOT NULL DEFAULT '#FFFFFF',
  back_border_color TEXT NOT NULL DEFAULT '#020912',

  -- Accent (theme representative color for thumbnails, badges)
  accent_color TEXT NOT NULL DEFAULT '#020912',

  -- Typography
  font_family TEXT NOT NULL DEFAULT 'Nanum Myeongjo',

  -- Border style
  border_style TEXT NOT NULL DEFAULT 'none'
    CHECK (border_style IN ('none', 'solid', 'double')),
  border_width INTEGER NOT NULL DEFAULT 0
    CHECK (border_width >= 0 AND border_width <= 12),

  -- Custom metadata field definitions (JSON array)
  -- e.g., [{"key": "department", "label": "부서", "type": "text"}, {"key": "level", "label": "레벨", "type": "number", "min": 1, "max": 10}]
  custom_fields JSONB DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT                      -- Admin email
);

-- Indexes
CREATE INDEX idx_custom_themes_slug ON custom_themes(slug);
CREATE INDEX idx_custom_themes_active ON custom_themes(is_active);
CREATE INDEX idx_custom_themes_sort ON custom_themes(sort_order);

-- RLS
ALTER TABLE custom_themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service role" ON custom_themes FOR ALL USING (true);
```

#### 1.2 `card_requests.custom_theme_meta` 컬럼 추가

```sql
-- card_requests 테이블에 커스텀 테마 메타데이터 컬럼 추가
ALTER TABLE card_requests ADD COLUMN IF NOT EXISTS custom_theme_meta JSONB;
-- custom_theme_meta 예시: {"department": "Engineering", "level": 5}
```

### 2. 타입 시스템 확장

#### 2.1 CardTheme 타입 변경

```typescript
// src/types/card.ts

// Built-in themes (backward compatible literal union)
export type BuiltinTheme = 'classic' | 'pokemon' | 'hearthstone' | 'harrypotter' | 'tarot' | 'nametag';

// CardTheme now accepts both built-in and custom theme slugs
export type CardTheme = BuiltinTheme | (string & {});

// Type guard for built-in themes
export const BUILTIN_THEMES: BuiltinTheme[] = ['classic', 'pokemon', 'hearthstone', 'harrypotter', 'tarot', 'nametag'];
export function isBuiltinTheme(theme: string): theme is BuiltinTheme {
  return BUILTIN_THEMES.includes(theme as BuiltinTheme);
}
```

#### 2.2 CustomTheme 인터페이스 (신규)

```typescript
// src/types/custom-theme.ts

export interface CustomThemeFieldDef {
  key: string;        // Field identifier (e.g., 'department')
  label: string;      // Display label in Korean (e.g., '부서')
  type: 'text' | 'number';
  min?: number;       // For number type
  max?: number;       // For number type
}

export interface CustomTheme {
  id: string;
  slug: string;
  name: string;
  baseTemplate: 'classic' | 'nametag';
  isActive: boolean;
  sortOrder: number;

  // Front styling
  frontBgColor: string;
  frontTextColor: string;
  frontBorderColor: string;

  // Back styling
  backBgColor: string;
  backTextColor: string;
  backBorderColor: string;

  // Accent
  accentColor: string;

  // Typography
  fontFamily: string;

  // Border
  borderStyle: 'none' | 'solid' | 'double';
  borderWidth: number;

  // Custom fields
  customFields: CustomThemeFieldDef[];

  createdAt: string;
  updatedAt: string;
}

// Custom theme metadata stored per card_request
export interface CustomThemeMeta {
  [key: string]: string | number;
}
```

#### 2.3 CardData 확장

```typescript
// src/types/card.ts (CardData 인터페이스에 추가)

export interface CardData {
  front: CardFrontData;
  back: CardBackData;
  theme?: CardTheme;
  pokemonMeta?: PokemonMeta;
  hearthstoneMeta?: HearthstoneMeta;
  harrypotterMeta?: HarrypotterMeta;
  tarotMeta?: TarotMeta;
  customThemeMeta?: Record<string, string | number>;  // NEW: key-value pairs for custom theme fields
}
```

### 3. API 설계

#### 3.1 공개 API: `GET /api/themes`

모든 사용자가 접근 가능. 빌트인 테마 메타데이터 + 활성 커스텀 테마 목록을 반환.

```typescript
// Response
{
  builtin: [
    { id: 'classic', label: 'Classic', description: 'Minimal design', color: '#020912' },
    // ... 5 more
  ],
  custom: [
    {
      slug: 'corporate-blue',
      name: '기업 블루',
      accentColor: '#1E40AF',
      baseTemplate: 'classic',
      fontFamily: 'Nanum Myeongjo',
      // ... full CustomTheme object
    }
  ]
}
```

#### 3.2 관리자 API: `POST /api/admin/custom-themes`

```typescript
// Request body
{
  slug: string;          // unique, URL-safe
  name: string;          // Korean display name
  baseTemplate: 'classic' | 'nametag';
  frontBgColor: string;
  frontTextColor: string;
  frontBorderColor: string;
  backBgColor: string;
  backTextColor: string;
  backBorderColor: string;
  accentColor: string;
  fontFamily: string;
  borderStyle: 'none' | 'solid' | 'double';
  borderWidth: number;
  customFields?: CustomThemeFieldDef[];
}

// Response: 201 Created
{ theme: CustomTheme }
```

#### 3.3 관리자 API: `PATCH /api/admin/custom-themes/[id]`

부분 업데이트 지원. Request body에 변경할 필드만 포함.

#### 3.4 관리자 API: `DELETE /api/admin/custom-themes/[id]`

사용 중인 의뢰가 있으면 409 Conflict 반환.

```typescript
// Success: 200 OK
{ deleted: true }

// Conflict: 409
{ error: 'Theme in use', usageCount: 5 }
```

### 4. 컴포넌트 아키텍처

#### 4.1 파일 구조 (신규 및 수정)

```
src/
├── types/
│   ├── card.ts                                  # [수정] CardTheme 타입 확장, isBuiltinTheme 추가
│   └── custom-theme.ts                          # [신규] CustomTheme, CustomThemeFieldDef 인터페이스
├── hooks/
│   └── useCustomThemes.ts                       # [신규] SWR/fetch 기반 커스텀 테마 목록 조회 훅
├── components/
│   ├── card/
│   │   ├── CardFront.tsx                        # [수정] 커스텀 테마 분기 추가
│   │   ├── CardBack.tsx                         # [수정] 커스텀 테마 분기 추가
│   │   ├── CustomThemeCardFront.tsx             # [신규] 커스텀 테마 범용 앞면 렌더러
│   │   └── CustomThemeCardBack.tsx              # [신규] 커스텀 테마 범용 뒷면 렌더러
│   ├── editor/
│   │   ├── ThemeSelector.tsx                    # [수정] 커스텀 테마 목록 동적 로딩 추가
│   │   └── CustomThemeFieldsEditor.tsx          # [신규] 커스텀 메타데이터 필드 입력 UI
│   ├── admin/
│   │   ├── ThemeListBox.tsx                     # [수정] 커스텀 테마 포함하여 목록 확장
│   │   ├── ThemeEditPanel.tsx                   # [수정] 커스텀 테마 편집 상태 지원
│   │   ├── CustomThemeForm.tsx                  # [신규] 커스텀 테마 생성/편집 폼 컴포넌트
│   │   ├── CustomThemePreview.tsx               # [신규] 커스텀 테마 실시간 미리보기
│   │   └── CustomThemeManager.tsx               # [신규] 커스텀 테마 CRUD 관리 섹션
│   └── gallery/
│       └── GalleryCardThumbnail.tsx             # [수정] 커스텀 테마 themeConfig 동적 확장
├── stores/
│   └── useCardStore.ts                          # [수정] 커스텀 테마 관련 액션 추가
├── app/
│   ├── api/
│   │   ├── themes/
│   │   │   └── route.ts                         # [신규] GET /api/themes (공개)
│   │   └── admin/
│   │       ├── themes/route.ts                  # [수정] VALID_THEMES 동적 확장
│   │       └── custom-themes/
│   │           ├── route.ts                     # [신규] GET, POST /api/admin/custom-themes
│   │           └── [id]/route.ts                # [신규] PATCH, DELETE /api/admin/custom-themes/[id]
│   └── admin/
│       └── themes/page.tsx                      # [수정] CustomThemeManager 섹션 추가
└── supabase/
    └── migrations/
        └── 007_add_custom_themes.sql            # [신규] custom_themes 테이블 + custom_theme_meta 컬럼
```

#### 4.2 커스텀 테마 렌더링 전략

`CardFront.tsx`에서 빌트인 테마가 아닌 경우 `CustomThemeCardFront`로 라우팅:

```typescript
// CardFront.tsx 수정 (개념)
export function CardFront() {
  const theme = useCardStore((state) => state.card.theme ?? 'classic');

  if (theme === 'pokemon') return <PokemonCardFront />;
  if (theme === 'hearthstone') return <HearthstoneCardFront />;
  if (theme === 'harrypotter') return <HarrypotterCardFront />;
  if (theme === 'tarot') return <TarotCardFront />;
  if (theme === 'nametag') return <NametagCardFront />;
  if (isBuiltinTheme(theme)) return <ClassicCardFront />;

  // Custom theme - fetch theme definition and render with base template
  return <CustomThemeCardFront themeSlug={theme} />;
}
```

`CustomThemeCardFront.tsx`는 `useCustomThemes` 훅으로 테마 정의를 가져와 `baseTemplate`에 따라 classic 또는 nametag 레이아웃에 커스텀 스타일을 적용:

```typescript
// CustomThemeCardFront.tsx (개념)
export function CustomThemeCardFront({ themeSlug }: { themeSlug: string }) {
  const { front } = useCardStore((state) => state.card);
  const { themes } = useCustomThemes();
  const themeDef = themes?.find(t => t.slug === themeSlug);

  if (!themeDef) return <ClassicCardFront />; // fallback

  // Render base layout with custom styles applied via inline styles
  if (themeDef.baseTemplate === 'nametag') {
    return <NametagLayout front={front} themeDef={themeDef} />;
  }
  return <ClassicLayout front={front} themeDef={themeDef} />;
}
```

#### 4.3 useCustomThemes 훅

```typescript
// src/hooks/useCustomThemes.ts
// SWR 또는 simple fetch + state 기반
// GET /api/themes 호출 후 custom 테마 목록 캐싱
// stale-while-revalidate 전략으로 빠른 초기 로딩

export function useCustomThemes() {
  // Returns: { themes: CustomTheme[] | null, isLoading: boolean, error: Error | null }
}
```

#### 4.4 CustomThemeForm 컴포넌트

관리자 테마 생성/편집을 위한 폼 컴포넌트. 2컬럼 레이아웃:
- 왼쪽: 속성 입력 폼 (색상 피커, 폰트 선택, 메타데이터 필드 편집기)
- 오른쪽: 실시간 카드 미리보기 (CustomThemePreview)

사용 가능한 웹 폰트 목록 (기본 제공):
- `Nanum Myeongjo` (기본)
- `Nanum Gothic`
- `Pretendard`
- `Figtree`
- `Anonymous Pro`
- `Inter`

#### 4.5 CustomThemeManager 컴포넌트

관리자 테마 관리 페이지(`/admin/themes`)의 새 섹션:
- 커스텀 테마 목록 (카드형)
- 각 카드: 테마 이름, 미리보기 축소판, 의뢰 수, 활성/비활성 토글, 편집/삭제 버튼
- "새 커스텀 테마 만들기" 버튼 -> CustomThemeForm 모달 또는 인라인 확장

### 5. Zustand Store 확장

```typescript
// useCardStore.ts 추가 액션
setCustomThemeMeta: (key: string, value: string | number) => void;
removeCustomThemeMeta: (key: string) => void;
```

`setTheme`에서 커스텀 테마로 전환 시:
- 빌트인 테마 전용 메타데이터(pokemonMeta, hearthstoneMeta 등)는 그대로 유지 (삭제하지 않음)
- `customThemeMeta`가 없으면 빈 객체 `{}` 초기화

### 6. ThemeSelector 동적 확장

기존 하드코딩된 `THEME_OPTIONS` 배열에 커스텀 테마를 동적으로 추가:

```typescript
// ThemeSelector.tsx (개념)
export function ThemeSelector() {
  const { themes: customThemes, isLoading } = useCustomThemes();

  // Built-in options (existing, unchanged)
  const builtinOptions = THEME_OPTIONS; // 6 items

  // Custom theme options (dynamic)
  const customOptions = (customThemes ?? [])
    .filter(t => t.isActive)
    .map(t => ({
      id: t.slug as CardTheme,
      label: t.name,
      description: `${t.baseTemplate} 기반 커스텀 테마`,
      accentColor: t.accentColor,
    }));

  const allOptions = [...builtinOptions, ...customOptions];

  // ... render allOptions
}
```

### 7. 하위 호환성 보장

- **타입 호환**: `CardTheme` 확장이 `string & {}` 기법으로 기존 리터럴 유니온 자동완성을 유지
- **런타임 호환**: `isBuiltinTheme()` 가드로 빌트인 테마와 커스텀 테마를 안전하게 분기
- **DB 호환**: `card_requests.theme` 컬럼은 이미 `TEXT` 타입이므로 커스텀 slug 저장에 별도 마이그레이션 불필요
- **API 호환**: 기존 `GET /api/admin/themes` 및 `PATCH /api/admin/themes`는 변경 없이 유지
- **렌더링 호환**: 기존 빌트인 테마의 전용 컴포넌트는 변경 없이 유지, 커스텀 테마만 새 범용 렌더러 사용
- **GalleryCardThumbnail**: `themeConfig`에 커스텀 테마의 동적 설정 추가 (fallback: classic config)

---

## 영향 분석 (File Impact Analysis)

| 파일 경로 | 변경 유형 | 설명 |
| --- | --- | --- |
| `supabase/migrations/007_add_custom_themes.sql` | 신규 | custom_themes 테이블 생성 + custom_theme_meta 컬럼 추가 |
| `src/types/card.ts` | 수정 | CardTheme 확장, BuiltinTheme 추가, isBuiltinTheme 가드, CardData에 customThemeMeta 추가 |
| `src/types/custom-theme.ts` | 신규 | CustomTheme, CustomThemeFieldDef, CustomThemeMeta 인터페이스 |
| `src/hooks/useCustomThemes.ts` | 신규 | 커스텀 테마 목록 조회 훅 |
| `src/components/card/CardFront.tsx` | 수정 | 커스텀 테마 분기 추가 (isBuiltinTheme 체크) |
| `src/components/card/CardBack.tsx` | 수정 | 커스텀 테마 분기 추가 (isBuiltinTheme 체크) |
| `src/components/card/CustomThemeCardFront.tsx` | 신규 | 커스텀 테마 범용 앞면 렌더러 |
| `src/components/card/CustomThemeCardBack.tsx` | 신규 | 커스텀 테마 범용 뒷면 렌더러 |
| `src/components/editor/ThemeSelector.tsx` | 수정 | 커스텀 테마 동적 로딩 및 표시 추가 |
| `src/components/editor/CustomThemeFieldsEditor.tsx` | 신규 | 커스텀 메타데이터 필드 입력 UI |
| `src/components/admin/ThemeListBox.tsx` | 수정 | THEME_LIST에 커스텀 테마 동적 추가 |
| `src/components/admin/ThemeEditPanel.tsx` | 수정 | 커스텀 테마 편집 상태 지원 |
| `src/components/admin/CustomThemeForm.tsx` | 신규 | 커스텀 테마 생성/편집 폼 |
| `src/components/admin/CustomThemePreview.tsx` | 신규 | 실시간 미리보기 컴포넌트 |
| `src/components/admin/CustomThemeManager.tsx` | 신규 | 커스텀 테마 CRUD 관리 섹션 |
| `src/components/gallery/GalleryCardThumbnail.tsx` | 수정 | themeConfig 동적 확장 (커스텀 테마 fallback) |
| `src/stores/useCardStore.ts` | 수정 | setCustomThemeMeta, removeCustomThemeMeta 액션 추가, setTheme 로직 확장 |
| `src/app/api/themes/route.ts` | 신규 | GET /api/themes 공개 API |
| `src/app/api/admin/themes/route.ts` | 수정 | VALID_THEMES 동적 확장 |
| `src/app/api/admin/custom-themes/route.ts` | 신규 | GET, POST /api/admin/custom-themes |
| `src/app/api/admin/custom-themes/[id]/route.ts` | 신규 | PATCH, DELETE /api/admin/custom-themes/[id] |
| `src/app/admin/themes/page.tsx` | 수정 | CustomThemeManager 섹션 추가 |

---

## 리스크 분석

| 리스크 | 심각도 | 완화 전략 |
| --- | --- | --- |
| `html-to-image`가 커스텀 스타일을 올바르게 캡처하지 못할 수 있음 | 높음 | 모든 시각적 속성을 inline style로 적용, Tailwind 클래스 의존 금지. 구현 후 PNG 내보내기 회귀 테스트 필수 |
| CardTheme 타입 확장이 기존 코드의 타입 체크를 깨뜨릴 수 있음 | 중간 | `BuiltinTheme` 타입 별도 유지, `isBuiltinTheme()` 가드 제공, 점진적 마이그레이션 |
| 커스텀 테마 API 지연으로 ThemeSelector 로딩이 느려질 수 있음 | 중간 | 빌트인 테마 즉시 표시 + 커스텀 테마 비동기 추가 로딩 (progressive enhancement) |
| 삭제된 커스텀 테마를 참조하는 기존 카드가 렌더링 실패할 수 있음 | 높음 | `isBuiltinTheme()` 체크 후 fallback to classic, `custom_themes` 조회 실패 시도 classic fallback |
| 다수의 커스텀 테마 생성 시 ThemeSelector UI가 복잡해질 수 있음 | 낮음 | 빌트인 테마 섹션과 커스텀 테마 섹션 분리 표시, 스크롤 가능 영역 제공 |
| 폰트 로딩 지연으로 커스텀 폰트가 적용되지 않을 수 있음 | 낮음 | 기본 제공 웹 폰트만 선택 가능하도록 제한, 폰트 프리로딩 적용 |

---

## 트레이서빌리티 (Traceability)

| 요구사항 | plan.md 연결 | acceptance.md 연결 |
| --- | --- | --- |
| REQ-U-001 | Phase 1: 타입 시스템 확장 | AC-001 |
| REQ-U-002 | Phase 3: ThemeSelector 동적 확장 | AC-002 |
| REQ-U-003 | Phase 2: 커스텀 렌더러 구현 | AC-003 |
| REQ-U-004 | Phase 1: DB 스키마 생성 | AC-004 |
| REQ-U-005 | 전체: 디자인 시스템 준수 | AC-005 |
| REQ-AC-001 | Phase 3: CustomThemeForm 구현 | AC-006 |
| REQ-AC-002 | Phase 2: POST API 구현 | AC-007 |
| REQ-AC-003 | Phase 3: CustomThemeForm 편집 모드 | AC-008 |
| REQ-AC-004 | Phase 2: PATCH API 구현 | AC-009 |
| REQ-AC-005 | Phase 2: DELETE API 구현 | AC-010 |
| REQ-AC-006 | Phase 2: DELETE API (0건) | AC-011 |
| REQ-AC-007 | Phase 2: DELETE API (N건 차단) | AC-012 |
| REQ-PV-001 | Phase 3: CustomThemePreview 구현 | AC-013 |
| REQ-PV-002 | Phase 3: 앞면/뒷면 토글 | AC-014 |
| REQ-US-001 | Phase 3: ThemeSelector 동적 확장 | AC-015 |
| REQ-US-002 | Phase 2: CustomThemeCardFront/Back | AC-016 |
| REQ-US-003 | Phase 2: theme slug 저장 | AC-017 |
| REQ-API-001 | Phase 2: GET /api/admin/custom-themes | AC-018 |
| REQ-API-002 | Phase 2: POST /api/admin/custom-themes | AC-019 |
| REQ-API-003 | Phase 2: PATCH /api/admin/custom-themes/[id] | AC-020 |
| REQ-API-004 | Phase 2: DELETE /api/admin/custom-themes/[id] | AC-021 |
| REQ-API-005 | Phase 2: GET /api/themes | AC-022 |
| REQ-S-001 | Phase 3: ThemeSelector 로딩 상태 | AC-023 |
| REQ-S-002 | Phase 2: 삭제된 테마 fallback | AC-024 |
| REQ-S-003 | Phase 2: is_active 필터링 | AC-025 |
| REQ-S-004 | Phase 3: API 실패 graceful degradation | AC-026 |
| REQ-N-001 | Phase 1: 타입 호환성 검증 | AC-027 |
| REQ-N-002 | Phase 2: slug 유효성 검증 | AC-028 |
| REQ-N-003 | Phase 2: 관리자 인증 미들웨어 | AC-029 |
| REQ-N-004 | Phase 2: inline style 전용 렌더링 | AC-030 |
| REQ-O-001 | Phase 4: 테마 복제 기능 | AC-031 |
| REQ-O-002 | Phase 4: 배경 이미지 업로드 | AC-032 |
| REQ-O-003 | Phase 4: 순서 변경 | AC-033 |

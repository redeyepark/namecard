# SPEC-GALLERY-001: 구현 계획

| 항목 | 내용 |
|------|------|
| SPEC ID | SPEC-GALLERY-001 |
| 제목 | Admin Gallery View - 구현 계획 |
| 상태 | Draft |

---

## 1. 마일스톤 개요

### Primary Goal: 데이터 모델 확장 + 갤러리 그리드 + 뷰 토글

핵심 기능인 갤러리 그리드 표시와 뷰 전환을 구현한다.

| 태스크 | 설명 | 관련 요구사항 |
|--------|------|--------------|
| T1 | `RequestSummary` 타입에 `theme`, `backgroundColor`, `hashtags` 필드 추가 | R13-DATA |
| T2 | `getAllRequests()` 함수에서 `card_back`, `theme` 조회 및 매핑 | R13-DATA |
| T3 | `AdminGalleryCard` 컴포넌트 생성 (GalleryCardThumbnail 패턴 기반) | R1-GRID, R10-NAV |
| T4 | `AdminGalleryGrid` 컴포넌트 생성 (반응형 그리드) | R1-GRID |
| T5 | `ViewToggle` 컴포넌트 생성 (테이블/갤러리 전환) | R2-TOGGLE |
| T6 | `/admin` 페이지에 뷰 토글 및 갤러리 그리드 통합 | R2-TOGGLE, R11-PERSIST |

### Secondary Goal: 필터 시스템 구현

다양한 분류 기준 필터를 추가한다.

| 태스크 | 설명 | 관련 요구사항 |
|--------|------|--------------|
| T7 | `useAdminFilters` 커스텀 훅 생성 (필터 상태 통합 관리) | R9-SEARCH, R12-SUMMARY |
| T8 | `ThemeChips` 필터 컴포넌트 | R3-THEME |
| T9 | `StatusChips` 필터 컴포넌트 | R4-STATUS |
| T10 | `ImageStatusFilter` 컴포넌트 | R8-IMAGE |
| T11 | `AdminGalleryFilters` 래퍼 컴포넌트 (필터 영역 통합) | 전체 |
| T12 | 기존 `RequestList`에 필터 훅 연결 (테이블 뷰도 동일 필터 적용) | R5-EVENT, R9-SEARCH |

### Final Goal: 고급 필터 및 UX 개선

색상, 해시태그 등 고급 필터와 UX 마무리.

| 태스크 | 설명 | 관련 요구사항 |
|--------|------|--------------|
| T13 | 색상 그룹핑 유틸 함수 (hex-to-HSL 변환, 색상군 분류) | R6-COLOR |
| T14 | `ColorSwatchFilter` 컴포넌트 | R6-COLOR |
| T15 | `HashtagFilter` 컴포넌트 (빈도순 태그 표시, 더보기) | R7-HASHTAG |
| T16 | `FilterResetButton` 전체 필터 초기화 | R12-SUMMARY |
| T17 | localStorage 뷰 모드 저장/복원 | R11-PERSIST |
| T18 | 필터 결과 건수 표시 UI | R12-SUMMARY |

### Optional Goal: 접근성 및 성능 최적화

| 태스크 | 설명 | 관련 요구사항 |
|--------|------|--------------|
| T19 | 키보드 접근성 (갤러리 카드 포커스, 필터 칩 키보드 조작) | R10-NAV |
| T20 | 이미지 lazy loading 최적화 | R1-GRID |
| T21 | 대량 카드(200+) 렌더링 성능 검증 | R1-GRID |

---

## 2. 기술 접근 방식

### 2.1 데이터 레이어 변경

**변경 파일:** `src/types/request.ts`

`RequestSummary` 인터페이스에 3개 optional 필드 추가:
- `theme?: CardTheme` - 카드 테마
- `backgroundColor?: string` - 카드 앞면 배경색 (hex)
- `hashtags?: string[]` - 카드 뒷면 해시태그 배열

**변경 파일:** `src/lib/storage.ts` (`getAllRequests`)

- Supabase `select` 쿼리에 `card_back`, `theme` 추가
- 응답 매핑 시 `card_front.backgroundColor`, `card_back.hashtags`, `theme` 추출
- 기존 필드 호환성 유지 (새 필드는 optional)

### 2.2 컴포넌트 설계

**AdminGalleryCard** (`src/components/admin/AdminGalleryCard.tsx`)
- `GalleryCardThumbnail`의 시각적 패턴을 차용
- Link 대상: `/admin/[id]` (관리자 상세 페이지)
- Props: `RequestSummary` 확장 데이터
- 표시 요소: 일러스트/아바타, displayName, 테마 뱃지, 상태 뱃지
- 기존 `themeConfig` 색상 체계 재사용

**AdminGalleryGrid** (`src/components/admin/AdminGalleryGrid.tsx`)
- CSS Grid: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5`
- gap: `gap-3` 또는 `gap-4`
- `filteredRequests` prop을 받아 `AdminGalleryCard` 렌더링

**ViewToggle** (`src/components/admin/ViewToggle.tsx`)
- 2개 아이콘 버튼: List (테이블), Grid (갤러리)
- 활성 뷰에 시각적 강조 (배경색 또는 border)
- onChange 콜백으로 뷰 모드 전환

**useAdminFilters** (`src/hooks/useAdminFilters.ts`)
- 통합 필터 상태 관리 커스텀 훅
- 입력: `RequestSummary[]` (전체 데이터)
- 출력: `filteredRequests`, 각 필터 state/setter, `resetAllFilters()`, 고유 값 목록 (uniqueThemes, uniqueHashtags, uniqueColors)
- useMemo로 필터링 결과 캐싱

### 2.3 필터 설계

**필터 적용 순서 (AND 로직):**
```
전체 데이터
  |-- eventFilter (single select)
  |-- themeFilter (multi select, AND)
  |-- statusFilter (multi select, AND)
  |-- colorFilter (single select by color group)
  |-- hashtagFilter (multi select, OR within hashtags)
  |-- imageFilter (has/no illustration)
  |-- searchQuery (name/ID text match)
  = filteredRequests
```

**색상 그룹핑:**
- `hexToHsl()` 유틸 함수로 변환
- HSL 기반 그룹 분류: 7개 그룹 (Neutral, Red, Orange, Green, Blue, Purple, Pink)
- 각 그룹에서 가장 빈도 높은 색상을 대표 스와치로 표시

### 2.4 상태 관리

- 뷰 모드: `useState` + `localStorage` (키: `admin-view-mode`, 값: `table` | `gallery`)
- 필터 상태: `useAdminFilters` 훅 내부 `useState`
- 데이터: 기존 `RequestList`의 fetch 패턴 재사용 (부모 컴포넌트로 상태 끌어올리기)

### 2.5 레이아웃 변경

**`/admin` 페이지 구조 변경:**

현재:
```
대시보드 헤더
  통계 카드
  이벤트/테마 브레이크다운
  전체 의뢰 목록 (RequestList 테이블)
```

변경 후:
```
대시보드 헤더
  통계 카드
  이벤트/테마 브레이크다운
  전체 의뢰 목록 헤더 [필터 토글] [뷰 토글: Table | Gallery] [대량 등록]
  [필터 패널 (접이식)]
  [RequestList 테이블] 또는 [AdminGalleryGrid]
```

---

## 3. 리스크 및 대응

| 리스크 | 영향 | 대응 방안 |
|--------|------|----------|
| 대량 카드 렌더링 성능 저하 | 200+ 카드 시 스크롤 지연 | 가상 스크롤 또는 페이지네이션 도입 (Optional Goal) |
| 색상 그룹핑 정확도 | 유사한 색상이 다른 그룹으로 분류 | HSL 임계값 조정, 사용자 피드백 반영 |
| `getAllRequests` API 응답 크기 증가 | `card_back` 전체 추가 시 페이로드 증가 | `hashtags`와 `backgroundColor`만 선별 추출 |
| 기존 RequestList 동작 변경 | 필터 상태 공유 시 기존 동작 깨짐 | 점진적 통합, 기존 EventFilter/search 유지 |

---

## 4. 아키텍처 결정

| 결정 | 선택 | 이유 |
|------|------|------|
| 갤러리 위치 | `/admin` 대시보드 내 뷰 토글 | 별도 라우트 불필요, 기존 데이터/필터 재사용 |
| 필터 방식 | 클라이언트 사이드 | 현재 데이터 규모에서 서버 필터링 불필요, UX 반응성 우수 |
| 컴포넌트 재사용 | GalleryCardThumbnail 패턴 차용 (별도 컴포넌트 생성) | 관리자 전용 동작(admin 링크, 삭제 미지원)이 다르므로 분리 |
| 데이터 확장 | RequestSummary 확장 | 별도 API/타입 대신 기존 구조 확장으로 호환성 유지 |
| 필터 상태 관리 | 커스텀 훅 (useAdminFilters) | 테이블/갤러리 뷰 간 상태 공유, 로직 캡슐화 |

---

## 추적성 태그

- SPEC-GALLERY-001
- R1-GRID, R2-TOGGLE, R3-THEME, R4-STATUS, R5-EVENT
- R6-COLOR, R7-HASHTAG, R8-IMAGE, R9-SEARCH
- R10-NAV, R11-PERSIST, R12-SUMMARY, R13-DATA

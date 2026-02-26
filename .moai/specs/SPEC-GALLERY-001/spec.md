# SPEC-GALLERY-001: 관리자 갤러리 뷰

| 항목 | 내용 |
|------|------|
| SPEC ID | SPEC-GALLERY-001 |
| 제목 | Admin Gallery View - 분류별 명함 갤러리 검토 |
| 상태 | Completed |
| 우선순위 | High |
| 생성일 | 2026-02-26 |
| Lifecycle | spec-anchored |

---

## 1. 개요

관리자가 명함 의뢰를 테이블 형식 대신 갤러리(카드 그리드) 형태로 시각적으로 탐색하고 검토할 수 있는 기능.
테마, 상태, 이벤트, 배경색, 키워드(해시태그), 일러스트 유무 등 다양한 분류 기준으로 필터링하여 빠르게 원하는 명함을 찾을 수 있다.

### 사용자 스토리

- **관리자로서**, 명함 의뢰를 갤러리 형태로 한눈에 보고 싶다. 테이블보다 시각적으로 일러스트 품질과 테마 스타일을 빠르게 파악할 수 있기 때문이다.
- **관리자로서**, 테마별/상태별/이벤트별로 필터링하여 특정 카테고리의 명함만 모아서 검토하고 싶다.
- **관리자로서**, 배경색이나 해시태그(키워드)로도 필터링하여 디자인 일관성이나 특정 주제의 명함을 빠르게 찾고 싶다.
- **관리자로서**, 테이블 뷰와 갤러리 뷰를 자유롭게 전환하며 상황에 맞게 사용하고 싶다.

---

## 2. 환경 (Environment)

### 기존 시스템 컨텍스트

- **관리자 대시보드** (`/admin`): 통계 카드 + `RequestList` 테이블 뷰가 포함된 대시보드 페이지
- **RequestList 컴포넌트**: 테이블 레이아웃, EventFilter 드롭다운 + 텍스트 검색, `/api/requests`에서 `RequestSummary[]` 로드
- **공개 갤러리** (`/cards`): `GalleryCardThumbnail` 컴포넌트 사용, 이벤트별 그룹핑, 반응형 그리드
- **DB 필드**: `card_front` JSONB (`displayName`, `backgroundColor`, `textColor`), `card_back` JSONB (`hashtags[]`), `theme`, `status`, `event_id`, `illustration_url`, `original_avatar_url`, `is_public`
- **디자인 시스템**: Deep navy `#020912`, Off-white `#fcfcfc`, 0px border-radius, Tailwind CSS 4

### 재사용 가능한 기존 컴포넌트

- `GalleryCardThumbnail` - 테마별 스타일링, 상태 뱃지, 테마 뱃지 포함
- `EventFilter` - 이벤트 필터 드롭다운
- `StatusBadge` - 상태 뱃지 컴포넌트
- `EventBadge` - 이벤트 뱃지 컴포넌트
- `convertGoogleDriveUrl` - Google Drive URL 변환 유틸

---

## 3. 가정 (Assumptions)

- A1: 현재 DB에 갤러리 뷰에 필요한 모든 데이터(`backgroundColor`, `hashtags`, `theme`)가 이미 저장되어 있다. DB 마이그레이션 불필요.
- A2: 모든 의뢰 데이터를 한 번에 로드하는 현재 패턴을 유지한다 (클라이언트 사이드 필터링). 데이터 규모가 수천 건 이하로 예상됨.
- A3: 관리자 전용 기능이므로 인증된 관리자만 접근 가능하다 (기존 admin 레이아웃의 인증 미들웨어 활용).
- A4: 기존 `GalleryCardThumbnail` 컴포넌트의 시각적 패턴을 관리자 갤러리에서 재활용하되, Link 대상을 `/admin/[id]`로 변경한다.
- A5: 필터는 AND 로직으로 동작한다 (테마:pokemon AND 상태:submitted 선택 시 두 조건을 모두 만족하는 결과만 표시).

---

## 4. 요구사항 (Requirements) - EARS 형식

### R1: 갤러리 그리드 레이아웃 (Event-Driven)

**WHEN** 관리자가 갤러리 뷰를 선택하면 **THEN** 시스템은 명함 의뢰를 반응형 카드 그리드로 표시해야 한다.

- 그리드 컬럼: 2열(모바일) ~ 4열(데스크톱) ~ 5열(와이드)
- 각 카드 썸네일: 일러스트(또는 아바타 폴백), 이름, 테마 뱃지, 상태 뱃지 표시
- 카드 종횡비: `GalleryCardThumbnail`과 동일한 29:45 비율 유지

### R2: 뷰 토글 (Event-Driven)

**WHEN** 관리자가 뷰 토글 버튼을 클릭하면 **THEN** 시스템은 테이블 뷰와 갤러리 뷰를 전환해야 한다.

- 토글 UI: 아이콘 버튼 2개 (테이블/그리드 아이콘)
- 전환 시 현재 필터 상태를 유지해야 한다
- 토글 위치: 의뢰 목록 섹션의 헤더 영역 (대량 등록 버튼 좌측)

### R3: 테마 필터 (Event-Driven)

**WHEN** 관리자가 테마 칩을 선택/해제하면 **THEN** 시스템은 선택된 테마에 해당하는 명함만 표시해야 한다.

- 멀티 셀렉트 칩/필 UI: Classic, Pokemon, Hearthstone, Harry Potter, Tarot
- 아무 테마도 선택하지 않으면 전체 표시
- 각 칩에 해당 테마의 accent color 적용

### R4: 상태 필터 (Event-Driven)

**WHEN** 관리자가 상태 칩을 선택/해제하면 **THEN** 시스템은 선택된 상태에 해당하는 명함만 표시해야 한다.

- 멀티 셀렉트 칩 UI: 7개 상태 (의뢰됨, 작업중, 수정요청, 확정, 반려, 전달완료, 취소)
- 활성 상태(submitted, processing, revision_requested, confirmed)를 우선 배치
- 각 칩에 `StatusBadge` 컴포넌트와 동일한 색상 적용

### R5: 이벤트 필터 (Event-Driven)

**WHEN** 관리자가 이벤트를 선택하면 **THEN** 시스템은 해당 이벤트에 속한 명함만 표시해야 한다.

- 기존 `EventFilter` 드롭다운 컴포넌트를 재사용
- "전체", "미할당", 개별 이벤트 옵션 제공
- 테이블 뷰와 갤러리 뷰에서 동일한 필터 상태를 공유

### R6: 배경색 필터 (Event-Driven)

**WHEN** 관리자가 색상 스와치를 선택하면 **THEN** 시스템은 해당 배경색과 유사한 명함만 표시해야 한다.

- 전체 명함의 `card_front.backgroundColor` 값에서 고유한 색상 추출
- 색상 스와치(원형 또는 사각형) 형태로 표시
- 색상 유사도 기반 그룹핑: 가까운 색상을 그룹으로 묶어 주요 색상군(dark, light, blue, red, green, etc.) 형성
- 선택 시 해당 색상군에 속하는 명함 필터링

### R7: 키워드/해시태그 필터 (Event-Driven)

**WHEN** 관리자가 해시태그 태그를 선택하면 **THEN** 시스템은 해당 해시태그를 포함한 명함만 표시해야 한다.

- 전체 명함의 `card_back.hashtags[]`에서 고유한 태그 추출
- 빈도순 정렬, 상위 20~30개 태그를 칩/태그 형태로 표시
- 멀티 셀렉트 가능 (OR 로직: 선택한 태그 중 하나라도 포함하면 표시)
- "더보기" 버튼으로 전체 태그 확장 가능

### R8: 이미지 상태 필터 (Event-Driven)

**WHEN** 관리자가 이미지 상태 필터를 선택하면 **THEN** 시스템은 해당 조건에 맞는 명함만 표시해야 한다.

- 3가지 옵션: "전체", "일러스트 있음", "일러스트 없음"
- 세그먼트 컨트롤 또는 라디오 버튼 UI

### R9: 검색 통합 (Ubiquitous)

시스템은 **항상** 이름/ID 텍스트 검색과 모든 필터를 함께 적용해야 한다.

- 기존 검색 입력 필드 유지
- 검색어는 다른 모든 필터와 AND 조합으로 동작
- 테이블 뷰와 갤러리 뷰에서 동일한 검색 상태 공유

### R10: 카드 클릭 네비게이션 (Event-Driven)

**WHEN** 관리자가 갤러리 카드를 클릭하면 **THEN** 시스템은 `/admin/[id]` 상세 페이지로 이동해야 한다.

- 테이블 뷰의 행 클릭과 동일한 동작
- 키보드 접근성: Enter/Space 키로 네비게이션 가능

### R11: 필터 상태 관리 (Ubiquitous)

시스템은 **항상** 뷰 모드 선호도를 localStorage에 저장하여 페이지 재방문 시 유지해야 한다.

- 저장 항목: 뷰 모드 (table/gallery)
- 필터 상태는 페이지 내 세션 동안만 유지 (URL 파라미터 불필요)

### R12: 필터 결과 요약 (Ubiquitous)

시스템은 **항상** 활성 필터가 있을 때 필터된 결과 건수를 표시해야 한다.

- 형식: "N건" 또는 "N / 전체M건"
- 모든 필터 초기화 버튼 제공

### R13: 데이터 로딩 (Unwanted)

시스템은 갤러리 데이터 로드 시 불필요한 추가 API 호출을 **하지 않아야 한다**.

- 기존 `/api/requests` 응답을 확장하여 `backgroundColor`, `hashtags`, `theme` 필드 추가
- 별도의 갤러리 전용 API 엔드포인트를 만들지 않음
- `RequestSummary` 타입을 확장하거나 새 `AdminGalleryCard` 타입 정의

---

## 5. 명세 (Specifications)

### 5.1 데이터 모델 변경

#### RequestSummary 타입 확장

```typescript
// src/types/request.ts - 기존 RequestSummary에 필드 추가
export interface RequestSummary {
  id: string;
  displayName: string;
  status: RequestStatus;
  submittedAt: string;
  hasIllustration: boolean;
  illustrationUrl?: string | null;
  originalAvatarUrl?: string | null;
  eventId?: string | null;
  eventName?: string | null;
  // NEW: Gallery view fields
  theme?: CardTheme;
  backgroundColor?: string;       // from card_front.backgroundColor
  hashtags?: string[];             // from card_back.hashtags
}
```

#### getAllRequests() 함수 수정

- `select` 쿼리에 `card_back`, `theme` 컬럼 추가
- `card_front.backgroundColor` 추출
- `card_back.hashtags` 추출
- `theme` 필드 매핑

### 5.2 컴포넌트 아키텍처

```
/admin (page.tsx)
  +-- ViewToggle (NEW)
  +-- AdminGalleryFilters (NEW)
  |     +-- ThemeChips (NEW)
  |     +-- StatusChips (NEW)
  |     +-- EventFilter (REUSE)
  |     +-- ColorSwatchFilter (NEW)
  |     +-- HashtagFilter (NEW)
  |     +-- ImageStatusFilter (NEW)
  |     +-- FilterResetButton (NEW)
  +-- RequestList (EXISTING - table view)
  +-- AdminGalleryGrid (NEW)
        +-- AdminGalleryCard (NEW, based on GalleryCardThumbnail)
```

### 5.3 필터 로직 아키텍처

- 모든 필터 상태를 `useAdminFilters` 커스텀 훅으로 관리
- 필터 적용 순서: eventFilter AND themeFilter AND statusFilter AND colorFilter AND hashtagFilter AND imageFilter AND searchQuery
- 해시태그 필터만 OR 로직 (선택한 태그 중 하나라도 포함하면 통과)
- 나머지 필터 카테고리 간에는 AND 로직

### 5.4 색상 그룹핑 알고리즘

- hex 색상을 HSL로 변환
- Lightness 기준: Dark (L < 30%), Medium (30-70%), Light (L > 70%)
- Hue 기준: 6개 주요 색상군 (Red, Orange/Yellow, Green, Cyan/Blue, Purple, Pink) + Neutral (S < 10%)
- 각 그룹에서 대표 색상 1개를 스와치로 표시

---

## 6. 의존성 (Dependencies)

### 기존 컴포넌트 재사용

| 컴포넌트 | 경로 | 재사용 방식 |
|----------|------|-------------|
| GalleryCardThumbnail | `src/components/gallery/GalleryCardThumbnail.tsx` | 패턴 참고, 관리자용으로 별도 생성 |
| EventFilter | `src/components/admin/EventFilter.tsx` | 그대로 재사용 |
| StatusBadge | `src/components/admin/StatusBadge.tsx` | 그대로 재사용 |
| EventBadge | `src/components/admin/EventBadge.tsx` | 그대로 재사용 |
| convertGoogleDriveUrl | `src/lib/url-utils.ts` | 그대로 재사용 |

### API 수정 대상

| 파일 | 변경 내용 |
|------|----------|
| `src/lib/storage.ts` (`getAllRequests`) | `select` 쿼리에 `card_back`, `theme` 추가 |
| `src/types/request.ts` (`RequestSummary`) | `theme`, `backgroundColor`, `hashtags` 필드 추가 |

---

## 7. 범위 외 (Out of Scope)

- 갤러리 뷰에서 직접 상태 변경 (상세 페이지에서만 가능)
- 갤러리 뷰에서 직접 삭제 (상세 페이지 또는 테이블 뷰에서만 가능)
- 서버 사이드 필터링/페이지네이션 (현재 데이터 규모에서 불필요)
- 드래그앤드롭 정렬 또는 커스텀 정렬
- 이미지 일괄 다운로드
- 필터 상태의 URL 파라미터 반영 (브라우저 뒤로가기 복원)
- 별도 `/admin/gallery` 라우트 생성 (기존 `/admin` 대시보드에 통합)

---

## 8. 추적성 태그 (Traceability)

| TAG | 설명 |
|-----|------|
| SPEC-GALLERY-001 | 관리자 갤러리 뷰 SPEC |
| R1-GRID | 갤러리 그리드 레이아웃 |
| R2-TOGGLE | 뷰 토글 기능 |
| R3-THEME | 테마 필터 |
| R4-STATUS | 상태 필터 |
| R5-EVENT | 이벤트 필터 |
| R6-COLOR | 배경색 필터 |
| R7-HASHTAG | 해시태그 필터 |
| R8-IMAGE | 이미지 상태 필터 |
| R9-SEARCH | 검색 통합 |
| R10-NAV | 카드 클릭 네비게이션 |
| R11-PERSIST | 뷰 모드 저장 |
| R12-SUMMARY | 필터 결과 요약 |
| R13-DATA | 데이터 로딩 최적화 |

# SPEC-GALLERY-001: 수락 기준

| 항목 | 내용 |
|------|------|
| SPEC ID | SPEC-GALLERY-001 |
| 제목 | Admin Gallery View - 수락 기준 |
| 상태 | Draft |

---

## 1. 갤러리 그리드 레이아웃 (R1-GRID)

### AC-1.1: 갤러리 카드 표시

```gherkin
Given 관리자가 로그인한 상태에서 /admin 페이지에 접근
And 뷰 모드가 "gallery"로 설정됨
When 페이지가 로드되면
Then 명함 의뢰가 카드 그리드 형태로 표시된다
And 각 카드에 일러스트(또는 아바타 폴백) 이미지가 표시된다
And 각 카드에 displayName이 표시된다
And 각 카드에 테마 뱃지가 표시된다
And 각 카드에 상태 뱃지가 표시된다
```

### AC-1.2: 반응형 그리드

```gherkin
Given 갤러리 뷰가 활성화된 상태
When 브라우저 너비가 640px 미만이면
Then 그리드는 2열로 표시된다

When 브라우저 너비가 640px~767px이면
Then 그리드는 3열로 표시된다

When 브라우저 너비가 768px~1279px이면
Then 그리드는 4열로 표시된다

When 브라우저 너비가 1280px 이상이면
Then 그리드는 5열로 표시된다
```

### AC-1.3: 일러스트 없는 카드

```gherkin
Given 일러스트와 아바타 이미지가 모두 없는 명함 의뢰
When 갤러리 뷰에서 해당 카드를 표시하면
Then "No Image" 플레이스홀더가 표시된다
And 테마에 맞는 배경색이 적용된다
```

---

## 2. 뷰 토글 (R2-TOGGLE)

### AC-2.1: 뷰 전환

```gherkin
Given 관리자가 /admin 대시보드의 의뢰 목록 섹션에 있을 때
When 테이블 아이콘을 클릭하면
Then 의뢰 목록이 테이블 형식으로 표시된다
And 테이블 아이콘이 활성화 상태로 표시된다

When 그리드 아이콘을 클릭하면
Then 의뢰 목록이 갤러리 그리드로 표시된다
And 그리드 아이콘이 활성화 상태로 표시된다
```

### AC-2.2: 필터 상태 유지

```gherkin
Given 테이블 뷰에서 이벤트 필터를 "Event A"로 설정
And 검색어에 "홍길동"을 입력한 상태
When 갤러리 뷰로 전환하면
Then 이벤트 필터가 "Event A"로 유지된다
And 검색어가 "홍길동"으로 유지된다
And 필터링된 결과가 갤러리 형태로 표시된다
```

---

## 3. 테마 필터 (R3-THEME)

### AC-3.1: 테마 칩 선택

```gherkin
Given 갤러리 뷰에서 5개 테마 칩이 표시될 때
When "Pokemon" 칩을 클릭하면
Then pokemon 테마 명함만 표시된다
And "Pokemon" 칩이 활성화 상태로 강조된다

When "Pokemon"과 "Tarot" 칩을 모두 클릭하면
Then pokemon 또는 tarot 테마 명함이 표시된다
And 두 칩 모두 활성화 상태로 강조된다
```

### AC-3.2: 테마 칩 해제

```gherkin
Given "Pokemon" 칩이 활성화된 상태에서
When "Pokemon" 칩을 다시 클릭하면
Then 테마 필터가 해제된다
And 전체 테마의 명함이 표시된다
And "Pokemon" 칩이 비활성 상태로 돌아간다
```

---

## 4. 상태 필터 (R4-STATUS)

### AC-4.1: 상태 칩 멀티 셀렉트

```gherkin
Given 상태 칩 필터가 표시될 때
And 활성 상태(의뢰됨, 작업중, 수정요청, 확정)가 우선 배치됨
When "의뢰됨" 칩과 "작업중" 칩을 선택하면
Then status가 submitted 또는 processing인 명함만 표시된다
And 각 칩에 StatusBadge 색상이 적용된다
```

---

## 5. 이벤트 필터 (R5-EVENT)

### AC-5.1: 이벤트 드롭다운 재사용

```gherkin
Given 기존 EventFilter 드롭다운이 표시될 때
When "전체"를 선택하면
Then 모든 이벤트의 명함이 표시된다

When 특정 이벤트를 선택하면
Then 해당 이벤트에 속한 명함만 표시된다

When "미할당"을 선택하면
Then eventId가 없는 명함만 표시된다
```

---

## 6. 배경색 필터 (R6-COLOR)

### AC-6.1: 색상 스와치 표시

```gherkin
Given 갤러리 필터 패널에서
When 색상 필터 영역이 렌더링되면
Then 명함 배경색에서 추출된 색상 그룹 스와치가 표시된다
And 각 스와치에 해당 색상군의 대표 색상이 적용된다
```

### AC-6.2: 색상 필터 적용

```gherkin
Given 색상 스와치가 표시된 상태에서
When "Blue" 계열 스와치를 클릭하면
Then 파란색 계열 배경색의 명함만 표시된다

When 동일 스와치를 다시 클릭하면
Then 색상 필터가 해제되고 전체 명함이 표시된다
```

---

## 7. 키워드/해시태그 필터 (R7-HASHTAG)

### AC-7.1: 해시태그 태그 표시

```gherkin
Given 갤러리 필터 패널에서
When 해시태그 영역이 렌더링되면
Then 전체 명함의 해시태그에서 상위 20개가 빈도순으로 표시된다
And "더보기" 버튼이 표시된다
```

### AC-7.2: 해시태그 멀티 셀렉트 (OR 로직)

```gherkin
Given 해시태그 "developer"와 "designer"가 표시될 때
When "developer"를 선택하면
Then hashtags에 "developer"를 포함한 명함이 표시된다

When "developer"와 "designer"를 모두 선택하면
Then hashtags에 "developer" 또는 "designer"를 포함한 명함이 표시된다
```

### AC-7.3: 더보기 확장

```gherkin
Given 상위 20개 태그만 표시된 상태에서
When "더보기" 버튼을 클릭하면
Then 전체 해시태그가 표시된다
And "접기" 버튼으로 변경된다
```

---

## 8. 이미지 상태 필터 (R8-IMAGE)

### AC-8.1: 이미지 필터 적용

```gherkin
Given 이미지 상태 필터가 "전체"로 설정된 상태에서
When "일러스트 있음"을 선택하면
Then illustrationUrl이 존재하는 명함만 표시된다

When "일러스트 없음"을 선택하면
Then illustrationUrl이 null인 명함만 표시된다
```

---

## 9. 검색 통합 (R9-SEARCH)

### AC-9.1: 검색과 필터 조합

```gherkin
Given 테마 필터에서 "Pokemon"이 선택되고
And 검색어에 "홍길동"이 입력된 상태
When 필터링이 적용되면
Then 테마가 pokemon이고 이름에 "홍길동"이 포함된 명함만 표시된다
```

---

## 10. 카드 클릭 네비게이션 (R10-NAV)

### AC-10.1: 갤러리 카드 클릭

```gherkin
Given 갤러리 뷰에서 명함 카드가 표시될 때
When 카드를 클릭하면
Then /admin/[해당 명함 ID] 상세 페이지로 이동한다
```

### AC-10.2: 키보드 접근성

```gherkin
Given 갤러리 카드에 포커스가 있을 때
When Enter 키를 누르면
Then /admin/[해당 명함 ID] 상세 페이지로 이동한다

When Space 키를 누르면
Then /admin/[해당 명함 ID] 상세 페이지로 이동한다
```

---

## 11. 뷰 모드 저장 (R11-PERSIST)

### AC-11.1: localStorage 저장

```gherkin
Given 관리자가 갤러리 뷰로 전환한 상태에서
When 페이지를 새로고침하면
Then 갤러리 뷰가 유지된다

Given 관리자가 테이블 뷰로 전환한 상태에서
When 페이지를 새로고침하면
Then 테이블 뷰가 유지된다
```

---

## 12. 필터 결과 요약 (R12-SUMMARY)

### AC-12.1: 결과 건수 표시

```gherkin
Given 하나 이상의 필터가 활성화된 상태에서
When 필터링 결과가 갱신되면
Then "N건" 또는 "N / 전체M건" 형태로 결과 건수가 표시된다
```

### AC-12.2: 필터 초기화

```gherkin
Given 여러 필터가 활성화된 상태에서
When "필터 초기화" 버튼을 클릭하면
Then 모든 필터가 기본값으로 돌아간다
And 전체 명함이 표시된다
And 검색어도 초기화된다
```

---

## 13. 데이터 로딩 (R13-DATA)

### AC-13.1: API 응답 확장

```gherkin
Given /api/requests API가 호출될 때
When 응답 데이터를 확인하면
Then 각 RequestSummary에 theme 필드가 포함된다
And 각 RequestSummary에 backgroundColor 필드가 포함된다
And 각 RequestSummary에 hashtags 배열 필드가 포함된다
And 기존 필드(id, displayName, status, submittedAt 등)가 유지된다
```

### AC-13.2: 추가 API 호출 없음

```gherkin
Given 갤러리 뷰가 활성화된 상태에서
When 필터를 변경하거나 뷰를 전환할 때
Then 추가 API 호출이 발생하지 않는다
And 클라이언트 사이드에서 필터링이 처리된다
```

---

## Quality Gates

### Definition of Done

- [ ] 갤러리 그리드가 반응형으로 동작한다 (2~5열)
- [ ] 뷰 토글이 테이블/갤러리 간 정상 전환된다
- [ ] 6개 필터 카테고리 (테마, 상태, 이벤트, 색상, 해시태그, 이미지)가 동작한다
- [ ] 필터 간 AND 로직이 정상 동작한다 (해시태그 내부는 OR)
- [ ] 뷰 전환 시 필터 상태가 유지된다
- [ ] localStorage에 뷰 모드가 저장/복원된다
- [ ] 갤러리 카드 클릭 시 /admin/[id]로 이동한다
- [ ] 키보드(Enter/Space)로 카드 접근 가능하다
- [ ] 필터 초기화 버튼이 모든 필터를 초기화한다
- [ ] 기존 테이블 뷰의 기능(삭제, 검색, 이벤트 필터)이 유지된다
- [ ] `/api/requests` 응답에 theme, backgroundColor, hashtags가 포함된다
- [ ] TypeScript 타입 에러 0건
- [ ] 디자인 시스템 준수 (#020912, #fcfcfc, 0px border-radius)

---

## 추적성 태그

- SPEC-GALLERY-001
- R1-GRID, R2-TOGGLE, R3-THEME, R4-STATUS, R5-EVENT
- R6-COLOR, R7-HASHTAG, R8-IMAGE, R9-SEARCH
- R10-NAV, R11-PERSIST, R12-SUMMARY, R13-DATA

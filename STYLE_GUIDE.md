# 🎨 BookLens 스타일 가이드

이 문서는 BookLens 프로젝트의 디자인 시스템과 스타일링 가이드라인을 정의합니다.

## 📋 목차

1. [색상 시스템](#색상-시스템)
2. [타이포그래피](#타이포그래피)
3. [간격 및 레이아웃](#간격-및-레이아웃)
4. [컴포넌트 스타일](#컴포넌트-스타일)
5. [다크모드](#다크모드)
6. [애니메이션](#애니메이션)
7. [반응형 디자인](#반응형-디자인)

---

## 색상 시스템

### 기본 색상 팔레트

#### 라이트 모드
- **배경색**: `#FAFAFA` (`bg-[#FAFAFA]`)
- **카드 배경**: `white` (`bg-white`)
- **텍스트 기본**: `gray-900` (`text-gray-900`)
- **텍스트 보조**: `gray-600` (`text-gray-600`)
- **텍스트 비활성**: `gray-400` (`text-gray-400`)
- **테두리**: `gray-100` (`border-gray-100`), `gray-200` (`border-gray-200`)

#### 다크 모드
- **배경색**: `gray-900` (`dark:bg-gray-900`)
- **카드 배경**: `gray-800` (`dark:bg-gray-800`)
- **입력 필드 배경**: `gray-700` (`dark:bg-gray-700`)
- **텍스트 기본**: `gray-100` (`dark:text-gray-100`)
- **텍스트 보조**: `gray-400` (`dark:text-gray-400`)
- **텍스트 비활성**: `gray-500` (`dark:text-gray-500`)
- **테두리**: `gray-700` (`dark:border-gray-700`), `gray-600` (`dark:border-gray-600`)

### 액센트 색상
- **주요 버튼**: `gray-900` (`bg-gray-900`)
- **호버 상태**: `gray-800` (`hover:bg-gray-800`)
- **브랜드 색상**: `brand-500` (Tailwind 설정에서 정의)

### 상태 색상
- **에러**: `red-600` (`text-red-600`), `red-400` (다크모드)
- **성공**: `green-600` (`text-green-600`)
- **경고**: `yellow-600` (`text-yellow-600`)
- **정보**: `blue-600` (`text-blue-600`)

---

## 타이포그래피

### 폰트 패밀리
```css
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 
             'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### 폰트 크기
- **대형 제목**: `text-4xl` (36px) - 페이지 메인 제목
- **제목**: `text-3xl` (30px) - 섹션 제목
- **부제목**: `text-2xl` (24px) - 카드 제목
- **본문**: `text-base` (16px) - 기본 텍스트
- **작은 텍스트**: `text-sm` (14px) - 보조 정보
- **아주 작은 텍스트**: `text-xs` (12px) - 메타 정보

### 폰트 굵기
- **가벼운**: `font-light` (300) - Hero 섹션 설명
- **일반**: `font-normal` (400) - 기본 텍스트
- **중간**: `font-medium` (500) - 버튼, 라벨
- **굵은**: `font-semibold` (600) - 제목
- **매우 굵은**: `font-bold` (700) - 강조 텍스트

### 라인 높이
- **기본**: `leading-normal` (1.5)
- **여유로운**: `leading-relaxed` (1.625) - 긴 문단
- **빽빽한**: `leading-tight` (1.25) - 제목

---

## 간격 및 레이아웃

### 컨테이너
- **최대 너비**: `max-w-6xl` (1152px) - 메인 콘텐츠
- **패딩**: `px-6` (24px) - 좌우 여백
- **세로 간격**: `py-12` (48px) - 섹션 간격

### 간격 시스템
- **xs**: `gap-2` (8px) - 작은 요소 간격
- **sm**: `gap-4` (16px) - 기본 간격
- **md**: `gap-6` (24px) - 중간 간격
- **lg**: `gap-8` (32px) - 큰 간격
- **xl**: `gap-12` (48px) - 섹션 간격

### 패딩
- **카드 내부**: `p-6` (24px)
- **버튼**: `px-6 py-3` (24px × 12px)
- **입력 필드**: `px-4 py-2` (16px × 8px) 또는 `px-4 py-3` (16px × 12px)

---

## 컴포넌트 스타일

### 버튼

#### 주요 버튼 (Primary)
```jsx
className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 
           px-6 py-3 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 
           transition-all duration-200 font-medium text-sm"
```

#### 보조 버튼 (Secondary)
```jsx
className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
           px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 
           hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 
           font-medium text-sm"
```

#### 비활성 버튼
```jsx
className="... disabled:opacity-50 disabled:cursor-not-allowed"
```

### 카드
```jsx
className="bg-white dark:bg-gray-800 rounded-2xl p-6 
           border border-gray-100 dark:border-gray-700 
           hover:border-gray-200 dark:hover:border-gray-600 
           transition-all duration-200"
```

### 입력 필드
```jsx
className="w-full px-4 py-3 bg-white dark:bg-gray-700 
           border border-gray-200 dark:border-gray-600 rounded-xl 
           focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 
           focus:border-gray-900 dark:focus:border-gray-100 
           transition-all text-gray-900 dark:text-gray-100 
           placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm"
```

### 네비게이션 바
```jsx
className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 
           backdrop-blur-2xl border-b border-gray-100 dark:border-gray-700"
```

---

## 다크모드

### 구현 방식
- **방식**: Tailwind CSS의 `class` 기반 다크모드
- **토글**: `DarkModeContext`를 통한 전역 상태 관리
- **저장**: `localStorage`에 사용자 설정 저장
- **기본값**: 시스템 설정 감지 (`prefers-color-scheme`)

### 사용 예시
```jsx
// 배경색
className="bg-[#FAFAFA] dark:bg-gray-900"

// 텍스트
className="text-gray-900 dark:text-gray-100"

// 테두리
className="border-gray-100 dark:border-gray-700"
```

### 다크모드 색상 매핑
| 라이트 모드 | 다크 모드 |
|------------|----------|
| `bg-white` | `dark:bg-gray-800` |
| `bg-[#FAFAFA]` | `dark:bg-gray-900` |
| `text-gray-900` | `dark:text-gray-100` |
| `text-gray-600` | `dark:text-gray-400` |
| `text-gray-500` | `dark:text-gray-400` |
| `border-gray-100` | `dark:border-gray-700` |
| `border-gray-200` | `dark:border-gray-600` |

---

## 애니메이션

### 전환 효과
- **기본 전환**: `transition-all duration-200`
- **빠른 전환**: `transition-all duration-150`
- **느린 전환**: `transition-all duration-300`

### 호버 효과
```jsx
className="hover:bg-gray-50 dark:hover:bg-gray-700 
           transition-all duration-200"
```

### 페이드 인 애니메이션
```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### TextPressure 애니메이션
- 마우스 위치에 따라 폰트 가변 속성 조정
- `fontVariationSettings`를 사용한 동적 스타일링
- `wght`, `wdth`, `ital` 속성 활용

---

## 반응형 디자인

### 브레이크포인트
- **모바일**: 기본 (0px ~)
- **태블릿**: `md:` (768px ~)
- **데스크톱**: `lg:` (1024px ~)

### 그리드 레이아웃
```jsx
// 반응형 그리드
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
```

### 반응형 텍스트
```jsx
className="text-2xl md:text-3xl lg:text-4xl"
```

### 반응형 패딩
```jsx
className="px-4 sm:px-6 lg:px-8"
```

---

## 특수 컴포넌트

### TextPressure
- **용도**: 로고 및 주요 제목에 사용
- **특징**: 마우스 근접 시 폰트 가변 속성 조정
- **색상**: 다크모드에 따라 자동 조정

### ReadingPersonaBadge
- **색상**: 페르소나 타입에 따라 다른 색상
- **크기**: `sm`, `md`, `lg` 옵션 제공

### FocusSoundFAB
- **위치**: 고정 위치 (`fixed bottom-6 right-6`)
- **스타일**: 반투명 배경 + 블러 효과

---

## 베스트 프랙티스

### 1. 일관성 유지
- 동일한 컴포넌트는 동일한 스타일 사용
- 색상, 간격, 폰트 크기 일관성 유지

### 2. 다크모드 고려
- 모든 새로운 컴포넌트에 다크모드 스타일 추가
- 색상 대비 확인 (접근성)

### 3. 반응형 디자인
- 모바일 우선 설계
- 주요 브레이크포인트에서 테스트

### 4. 성능 최적화
- 불필요한 애니메이션 제거
- `will-change` 속성 신중하게 사용

### 5. 접근성
- 충분한 색상 대비 (WCAG AA 기준)
- 포커스 상태 명확히 표시
- 키보드 네비게이션 지원

---

## 유틸리티 클래스

### 커스텀 유틸리티 (index.css)
```css
.focusflight-card {
  @apply bg-white rounded-2xl border border-gray-100/80 shadow-sm;
}

.focusflight-button {
  @apply bg-gray-900 text-white rounded-xl px-6 py-3 
         font-medium transition-all duration-200 
         hover:bg-gray-800 active:scale-[0.98];
}
```

---

## 참고 자료

- [Tailwind CSS 공식 문서](https://tailwindcss.com/docs)
- [Tailwind CSS 다크모드](https://tailwindcss.com/docs/dark-mode)
- [WCAG 접근성 가이드라인](https://www.w3.org/WAI/WCAG21/quickref/)

---

**마지막 업데이트**: 2025년 12월


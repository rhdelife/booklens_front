# BookLens2

React + Vite 기반의 독서 관리 애플리케이션입니다.

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# 백엔드 API URL
VITE_API_BASE_URL=http://localhost:3000/api

# Supabase 설정 (선택사항 - Supabase 인증 사용 시)
VITE_SUPABASE_URL=https://ueffydcywfamsxdiggym.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Books API 키
VITE_GOOGLE_BOOKS_API_KEY=your_google_books_api_key

# Kakao Map JavaScript 키
VITE_KAKAO_MAP_KEY=your_kakao_map_key
```

### 3. 개발 서버 실행

```bash
npm run dev
```

서버가 `http://localhost:5173`에서 실행됩니다.

## 📁 프로젝트 구조

```
booklens2/
├── src/
│   ├── components/          # 재사용 가능한 컴포넌트
│   │   ├── Navbar.jsx
│   │   ├── BookCard.jsx
│   │   └── ...
│   ├── contexts/           # React Context
│   │   └── AuthContext.jsx # 인증 상태 관리
│   ├── lib/                # 외부 라이브러리 연동
│   │   ├── supabase.js     # Supabase 클라이언트
│   │   ├── googleBooksApi.js
│   │   └── data4libraryApi.js
│   ├── pages/              # 페이지 컴포넌트
│   │   ├── HomePage.jsx
│   │   ├── LoginPage.jsx
│   │   └── ...
│   ├── services/           # API 서비스 레이어
│   │   ├── api.js          # 백엔드 API 연동
│   │   ├── supabaseAuth.js # Supabase 인증
│   │   ├── mockAuth.js     # 임시 인증 (개발용)
│   │   └── oauth.js        # OAuth 연동
│   ├── utils/              # 유틸리티 함수
│   │   ├── apiConfig.js    # API 설정
│   │   └── validation.js  # 유효성 검사
│   ├── App.jsx             # 메인 앱 컴포넌트
│   └── main.jsx            # 진입점
├── public/                  # 정적 파일
├── .env.local              # 환경 변수 (git에 포함하지 않음)
├── package.json
└── README.md
```

## 🔐 인증 시스템

프로젝트는 3단계 폴백 인증 시스템을 사용합니다:

1. **Supabase 인증** (우선) - Supabase Auth 사용
2. **백엔드 API 인증** - Express 백엔드 서버 사용
3. **임시 인증 (Mock)** - 로컬 스토리지 기반 (개발/테스트용)

### Supabase 인증 설정

1. Supabase 대시보드에서 프로젝트 생성
2. SQL Editor에서 `supabase-setup.sql` 실행
3. `.env.local`에 Supabase URL과 Anon Key 설정

### 백엔드 API 인증 설정

1. 백엔드 서버 실행 (`booklens2-backend`)
2. `.env.local`에 `VITE_API_BASE_URL` 설정

## 🔗 백엔드 연동

### 백엔드 서버 실행

```bash
cd ../booklens2-backend
npm install
npm run dev
```

백엔드 서버는 `http://localhost:3000`에서 실행됩니다.

### API 엔드포인트

- **인증**: `/api/auth/*`
- **책**: `/api/books/*`
- **포스팅**: `/api/postings/*`
- **독서 세션**: `/api/reading-sessions/*`

자세한 내용은 `booklens2-backend/README.md`를 참고하세요.

## 🌐 외부 API 설정

### Google Books API

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 및 Books API 활성화
3. API 키 생성
4. `.env.local`에 `VITE_GOOGLE_BOOKS_API_KEY` 설정

### Kakao Map API

1. [Kakao Developers](https://developers.kakao.com) 접속
2. 애플리케이션 생성
3. JavaScript 키 복사
4. `.env.local`에 `VITE_KAKAO_MAP_KEY` 설정
5. 플랫폼에 도메인 등록 (로컬: `http://localhost:5173`)

## 📦 주요 기능

- ✅ 책 검색 및 관리
- ✅ 독서 진행 상황 추적
- ✅ 완독 책 포스팅
- ✅ 커뮤니티 피드
- ✅ 지도에서 책 재고 확인
- ✅ OAuth 로그인 (구글, 네이버)
- ✅ Supabase 인증 지원

## 🛠️ 기술 스택

- **React 19** - UI 라이브러리
- **Vite** - 빌드 도구
- **React Router** - 라우팅
- **Tailwind CSS** - 스타일링
- **Supabase** - 인증 및 데이터베이스
- **Express** - 백엔드 API (별도 프로젝트)

## 📝 스크립트

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

# 린트 검사
npm run lint
```

## 🚀 배포 (Vercel)

### 1. Vercel에 프로젝트 연결

1. [Vercel](https://vercel.com)에 로그인
2. "Add New Project" 클릭
3. GitHub 저장소 선택

### 2. 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정:

- `VITE_API_BASE_URL` - 백엔드 API URL
- `VITE_SUPABASE_URL` - Supabase URL (선택)
- `VITE_SUPABASE_ANON_KEY` - Supabase Anon Key (선택)
- `VITE_GOOGLE_BOOKS_API_KEY` - Google Books API 키
- `VITE_KAKAO_MAP_KEY` - Kakao Map API 키

### 3. 배포

Git에 push하면 자동으로 배포됩니다.

## 📚 참고 문서

- [백엔드 README](../booklens2-backend/README.md)
- [Supabase 문서](https://supabase.com/docs)
- [Vite 문서](https://vitejs.dev)

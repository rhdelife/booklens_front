# BookLens2 설정 가이드

프론트엔드와 백엔드를 연결하고 실행하는 전체 가이드입니다.

## 📋 사전 요구사항

- Node.js 18+ 설치
- npm 또는 yarn 설치
- PostgreSQL 또는 Supabase 계정 (데이터베이스용)

## 🚀 전체 설정 단계

### 1. 프로젝트 클론 및 의존성 설치

```bash
# 프론트엔드
cd booklens2
npm install

# 백엔드
cd ../booklens2-backend
npm install
```

### 2. 환경 변수 설정

#### 프론트엔드 (`.env.local`)

프로젝트 루트에 `.env.local` 파일 생성:

```env
# 백엔드 API URL
VITE_API_BASE_URL=http://localhost:3000/api

# Supabase 설정 (선택사항)
VITE_SUPABASE_URL=https://ueffydcywfamsxdiggym.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Books API 키
VITE_GOOGLE_BOOKS_API_KEY=your_google_books_api_key

# Kakao Map JavaScript 키
VITE_KAKAO_MAP_KEY=your_kakao_map_key
```

#### 백엔드 (`.env`)

백엔드 프로젝트 루트에 `.env` 파일 생성:

```env
# Supabase 설정 (필수)
SUPABASE_URL=https://ueffydcywfamsxdiggym.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# JWT 설정
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
JWT_EXPIRES_IN=7d

# 서버 설정
PORT=3000
NODE_ENV=development

# CORS 설정 (프론트엔드 URL)
CORS_ORIGIN=http://localhost:5173

# OAuth 설정 (선택사항)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
```

### 3. Supabase 데이터베이스 설정

1. [Supabase 대시보드](https://app.supabase.com) 접속
2. 프로젝트 선택 또는 생성
3. SQL Editor 열기
4. `supabase-setup.sql` 파일의 내용 실행
5. Settings > API에서 URL과 키 복사

### 4. 서버 실행

#### 터미널 1: 백엔드 서버

```bash
cd booklens2-backend
npm run dev
```

백엔드 서버가 `http://localhost:3000`에서 실행됩니다.

#### 터미널 2: 프론트엔드 서버

```bash
cd booklens2
npm run dev
```

프론트엔드 서버가 `http://localhost:5173`에서 실행됩니다.

### 5. 연결 확인

1. 브라우저에서 `http://localhost:5173` 접속
2. 회원가입 또는 로그인 테스트
3. 백엔드 Health Check: `http://localhost:3000/api/health`

## 🔐 인증 시스템

프로젝트는 3단계 폴백 인증을 지원합니다:

1. **Supabase 인증** (우선) - Supabase Auth 사용
2. **백엔드 API 인증** - Express 백엔드 JWT 인증
3. **임시 인증 (Mock)** - 로컬 스토리지 (개발/테스트용)

### Supabase 인증 사용 시

1. Supabase 프로젝트 설정 완료
2. `.env.local`에 Supabase 설정 추가
3. 자동으로 Supabase 인증 우선 사용

### 백엔드 API 인증 사용 시

1. 백엔드 서버 실행
2. `.env.local`에 `VITE_API_BASE_URL` 설정
3. Supabase 실패 시 자동으로 백엔드 API 사용

### 임시 인증 (Mock)

데이터베이스 없이 테스트하려면:
- Supabase와 백엔드 API 모두 실패 시 자동으로 Mock 인증 사용
- 로컬 스토리지에 사용자 데이터 저장

## 🌐 외부 API 설정

### Google Books API

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성
3. Books API 활성화
4. API 키 생성
5. `.env.local`에 `VITE_GOOGLE_BOOKS_API_KEY` 설정

### Kakao Map API

1. [Kakao Developers](https://developers.kakao.com) 접속
2. 애플리케이션 생성
3. JavaScript 키 복사
4. 플랫폼에 도메인 등록 (`http://localhost:5173`)
5. `.env.local`에 `VITE_KAKAO_MAP_KEY` 설정

### OAuth 설정 (선택사항)

#### 구글 OAuth

1. Google Cloud Console에서 OAuth 클라이언트 ID 생성
2. 리디렉션 URI: `http://localhost:3000/api/auth/google/callback`
3. 백엔드 `.env`에 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 설정

#### 네이버 OAuth

1. 네이버 개발자 센터에서 애플리케이션 등록
2. Callback URL: `http://localhost:3000/api/auth/naver/callback`
3. 백엔드 `.env`에 `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` 설정

## 🐛 문제 해결

### 백엔드 연결 실패

- 백엔드 서버가 실행 중인지 확인
- `VITE_API_BASE_URL`이 올바른지 확인
- CORS 설정 확인 (백엔드 `.env`의 `CORS_ORIGIN`)

### Supabase 연결 실패

- Supabase 프로젝트가 활성화되어 있는지 확인
- URL과 키가 올바른지 확인
- SQL 스크립트가 실행되었는지 확인

### OAuth 오류

- OAuth 제공자에 등록된 리디렉션 URI 확인
- 백엔드 서버 URL과 일치하는지 확인
- Client ID와 Secret이 올바른지 확인

### 환경 변수 로드 안 됨

- 파일 이름이 `.env.local`인지 확인
- Vite는 `.env.local` 파일을 자동으로 로드합니다
- 서버 재시작 필요

## 📚 추가 리소스

- [프론트엔드 README](./README.md)
- [백엔드 README](../booklens2-backend/README.md)
- [Supabase 문서](https://supabase.com/docs)

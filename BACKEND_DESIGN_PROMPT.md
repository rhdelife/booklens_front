# BookLens 백엔드 설계 프롬프트

## 📋 프로젝트 개요

**BookLens**는 독서 관리 웹 애플리케이션입니다. React 프론트엔드가 이미 완성되어 있으며, 현재는 localStorage 기반으로 작동합니다. 하루 안에 백엔드를 구축하여 데이터를 서버에 저장하고 동기화할 수 있도록 해야 합니다.

## 🎯 핵심 요구사항

1. **하루 안에 완성 가능한 간단한 구조**
2. **프론트엔드 API 스펙과 100% 호환**
3. **기존 localStorage 데이터 구조와 호환**
4. **빠른 개발을 위한 최소 기능 우선**

## 📡 프론트엔드 API 스펙

### Base URL
- 개발: `http://localhost:3000/api`
- 모든 엔드포인트는 `/api` prefix 사용

### 인증
- **방식**: Bearer Token (JWT)
- **헤더**: `Authorization: Bearer <token>`
- **토큰 저장**: `sessionStorage.getItem('token')`

### 에러 응답 형식
```json
{
  "error": "에러 메시지"
}
```
또는
```json
{
  "message": "에러 메시지"
}
```

### 성공 응답 형식
```json
{
  "user": { ... },
  "token": "jwt_token_string"
}
```

---

## 🔐 1. 인증 API (`/api/auth/*`)

### POST `/api/auth/login`
**요청:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "사용자 이름",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt_token_here"
}
```

### POST `/api/auth/signup`
**요청:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "사용자 이름"
}
```

**응답:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "사용자 이름",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt_token_here"
}
```

### POST `/api/auth/logout`
**인증 필요**: Yes
**응답:**
```json
{
  "message": "로그아웃되었습니다"
}
```

### GET `/api/auth/me`
**인증 필요**: Yes
**응답:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "사용자 이름",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### PUT `/api/auth/profile`
**인증 필요**: Yes
**요청:**
```json
{
  "name": "새 이름",
  "email": "new@example.com"
}
```

**응답:**
```json
{
  "user": {
    "id": 1,
    "email": "new@example.com",
    "name": "새 이름",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST `/api/auth/profile/image`
**인증 필요**: Yes
**요청:**
```json
{
  "image": "base64_encoded_image_string"
}
```

**응답:**
```json
{
  "user": {
    "id": 1,
    "profileImageUrl": "https://..."
  }
}
```

### POST `/api/auth/google/callback`
**요청:**
```json
{
  "code": "oauth_code",
  "state": "state_string"
}
```

**응답:**
```json
{
  "user": { ... },
  "token": "jwt_token_here"
}
```

### POST `/api/auth/naver/callback`
**요청:**
```json
{
  "code": "oauth_code",
  "state": "state_string"
}
```

**응답:**
```json
{
  "user": { ... },
  "token": "jwt_token_here"
}
```

---

## 📚 2. 책 API (`/api/books/*`)

### GET `/api/books`
**인증 필요**: Yes
**설명**: 현재 사용자의 모든 책 목록 반환

**응답:**
```json
[
  {
    "id": 1,
    "title": "책 제목",
    "author": "저자",
    "publisher": "출판사",
    "publishDate": "2024-01-01",
    "totalPage": 300,
    "readPage": 150,
    "progress": 50,
    "status": "reading",
    "startDate": "2024-01-01",
    "completedDate": null,
    "totalReadingTime": 3600,
    "memo": "메모",
    "thumbnail": "https://...",
    "isbn": "9781234567890",
    "userId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST `/api/books`
**인증 필요**: Yes
**요청:**
```json
{
  "title": "책 제목",
  "author": "저자",
  "publisher": "출판사",
  "publishDate": "2024-01-01",
  "totalPage": 300,
  "memo": "메모",
  "thumbnail": "https://...",
  "isbn": "9781234567890"
}
```

**응답:**
```json
{
  "id": 1,
  "title": "책 제목",
  ...
}
```

### GET `/api/books/:id`
**인증 필요**: Yes
**응답:**
```json
{
  "id": 1,
  "title": "책 제목",
  ...
}
```

### PUT `/api/books/:id`
**인증 필요**: Yes
**요청:**
```json
{
  "readPage": 200,
  "progress": 67,
  "status": "reading",
  "totalReadingTime": 7200
}
```

**응답:**
```json
{
  "id": 1,
  ...
}
```

### DELETE `/api/books/:id`
**인증 필요**: Yes
**응답:**
```json
{
  "message": "책이 삭제되었습니다"
}
```

---

## 📖 3. 독서 세션 API (`/api/reading-sessions/*`)

### POST `/api/reading-sessions`
**인증 필요**: Yes
**요청:**
```json
{
  "bookId": 1
}
```

**응답:**
```json
{
  "id": 1,
  "bookId": 1,
  "userId": 1,
  "startTime": "2024-01-01T12:00:00.000Z",
  "endTime": null,
  "pagesRead": null,
  "createdAt": "2024-01-01T12:00:00.000Z"
}
```

### GET `/api/reading-sessions/active`
**인증 필요**: Yes
**설명**: 현재 활성 독서 세션 반환 (24시간 이내)

**응답:**
```json
{
  "id": 1,
  "bookId": 1,
  "startTime": "2024-01-01T12:00:00.000Z",
  ...
}
```
또는 `null` (활성 세션 없음)

### PUT `/api/reading-sessions/:id`
**인증 필요**: Yes
**요청:**
```json
{
  "pagesRead": 50
}
```

**응답:**
```json
{
  "id": 1,
  "endTime": "2024-01-01T13:00:00.000Z",
  "pagesRead": 50,
  ...
}
```

---

## 📝 4. 포스팅 API (`/api/postings/*`)

### GET `/api/postings`
**인증 필요**: No (공개)
**Query Parameters:**
- `userId`: 특정 사용자의 포스팅만
- `bookId`: 특정 책의 포스팅만
- `sort`: `latest` | `rating` | `oldest`

**응답:**
```json
[
  {
    "id": 1,
    "bookId": 1,
    "bookTitle": "책 제목",
    "bookAuthor": "저자",
    "bookThumbnail": "https://...",
    "title": "포스팅 제목",
    "content": "포스팅 내용",
    "rating": 5,
    "tags": ["소설", "감동"],
    "authorId": 1,
    "userId": 1,
    "authorName": "작성자 이름",
    "userName": "사용자 이름",
    "userEmail": "user@example.com",
    "completedDate": "2024-01-01",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST `/api/postings`
**인증 필요**: Yes
**요청:**
```json
{
  "bookId": 1,
  "bookTitle": "책 제목",
  "bookAuthor": "저자",
  "bookThumbnail": "https://...",
  "title": "포스팅 제목",
  "content": "포스팅 내용",
  "rating": 5,
  "tags": ["소설", "감동"],
  "completedDate": "2024-01-01"
}
```

**응답:**
```json
{
  "id": 1,
  ...
}
```

### GET `/api/postings/:id`
**인증 필요**: No
**응답:**
```json
{
  "id": 1,
  ...
}
```

### PUT `/api/postings/:id`
**인증 필요**: Yes (본인만)
**요청:**
```json
{
  "title": "수정된 제목",
  "content": "수정된 내용",
  "rating": 4,
  "tags": ["수정된", "태그"]
}
```

**응답:**
```json
{
  "id": 1,
  ...
}
```

### DELETE `/api/postings/:id`
**인증 필요**: Yes (본인만)
**응답:**
```json
{
  "message": "포스팅이 삭제되었습니다"
}
```

### POST `/api/postings/:id/like`
**인증 필요**: Yes
**설명**: 좋아요 토글 (있으면 제거, 없으면 추가)

**응답:**
```json
{
  "liked": true,
  "likeCount": 10
}
```

### POST `/api/postings/:id/comments`
**인증 필요**: Yes
**요청:**
```json
{
  "content": "댓글 내용"
}
```

**응답:**
```json
{
  "id": 1,
  "postingId": 1,
  "userId": 1,
  "userName": "사용자 이름",
  "content": "댓글 내용",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### DELETE `/api/comments/:id`
**인증 필요**: Yes (본인만)
**응답:**
```json
{
  "message": "댓글이 삭제되었습니다"
}
```

---

## 🗄️ 데이터베이스 스키마

### Users 테이블
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  profile_image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Books 테이블
```sql
CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  publisher VARCHAR(255),
  publish_date VARCHAR(50),
  total_page INTEGER DEFAULT 0,
  read_page INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'not_started',
  start_date DATE,
  completed_date DATE,
  total_reading_time INTEGER DEFAULT 0,
  memo TEXT,
  thumbnail TEXT,
  isbn VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Reading Sessions 테이블
```sql
CREATE TABLE reading_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  pages_read INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Postings 테이블
```sql
CREATE TABLE postings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  book_id INTEGER,
  book_title VARCHAR(255) NOT NULL,
  book_author VARCHAR(255) NOT NULL,
  book_thumbnail TEXT,
  title VARCHAR(255),
  content TEXT NOT NULL,
  rating INTEGER DEFAULT 5,
  tags TEXT[],
  completed_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Likes 테이블
```sql
CREATE TABLE likes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  posting_id INTEGER REFERENCES postings(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, posting_id)
);
```

### Comments 테이블
```sql
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  posting_id INTEGER REFERENCES postings(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🛠️ 기술 스택 권장사항

### 필수
- **Node.js + Express**: 빠른 개발
- **PostgreSQL**: 관계형 데이터베이스 (Supabase 호환)
- **JWT**: 인증 토큰
- **bcrypt**: 비밀번호 해싱

### 선택 (빠른 개발을 위해)
- **Prisma ORM**: 타입 안전성과 빠른 개발
- **express-validator**: 입력 검증
- **cors**: CORS 설정

### OAuth (선택사항 - 나중에 추가 가능)
- **passport-google-oauth20**: Google OAuth
- **passport-naver**: Naver OAuth

---

## 📦 개발 우선순위

### Phase 1: 핵심 기능 (필수)
1. ✅ 인증 (로그인, 회원가입, JWT)
2. ✅ 책 CRUD
3. ✅ 독서 세션 (시작/종료)
4. ✅ 포스팅 CRUD

### Phase 2: 추가 기능 (시간 있으면)
5. ⏳ 좋아요
6. ⏳ 댓글
7. ⏳ 프로필 업데이트

### Phase 3: 고급 기능 (나중에)
8. ⏸️ OAuth (Google, Naver)
9. ⏸️ 프로필 이미지 업로드

---

## 🚀 빠른 시작 가이드

1. **프로젝트 초기화**
   ```bash
   mkdir booklens-backend
   cd booklens-backend
   npm init -y
   npm install express pg jsonwebtoken bcrypt cors dotenv
   npm install -D nodemon
   ```

2. **기본 구조**
   ```
   booklens-backend/
   ├── src/
   │   ├── config/
   │   │   └── database.js
   │   ├── controllers/
   │   │   ├── authController.js
   │   │   ├── bookController.js
   │   │   ├── readingSessionController.js
   │   │   └── postingController.js
   │   ├── middleware/
   │   │   ├── auth.js
   │   │   └── errorHandler.js
   │   ├── routes/
   │   │   ├── authRoutes.js
   │   │   ├── bookRoutes.js
   │   │   ├── readingSessionRoutes.js
   │   │   └── postingRoutes.js
   │   └── server.js
   ├── database/
   │   └── schema.sql
   ├── .env
   └── package.json
   ```

3. **환경 변수 (.env)**
   ```env
   PORT=3000
   DATABASE_URL=postgresql://user:password@localhost:5432/booklens
   JWT_SECRET=your_super_secret_jwt_key_change_this
   NODE_ENV=development
   ```

---

## ⚠️ 중요 사항

1. **프론트엔드 호환성**: 반드시 위의 API 스펙을 정확히 따라야 함
2. **에러 처리**: 모든 에러는 `{ error: "..." }` 형식으로 반환
3. **인증**: Bearer Token 방식 필수
4. **CORS**: 프론트엔드 도메인 허용 필요
5. **데이터 검증**: 입력값 검증 필수 (SQL Injection 방지)

---

## 🎯 최종 목표

하루 안에 **Phase 1 (핵심 기능)** 완성하여 프론트엔드와 연동 가능한 상태로 만들기.

**성공 기준:**
- ✅ 프론트엔드에서 로그인/회원가입 가능
- ✅ 책 추가/수정/삭제 가능
- ✅ 독서 세션 시작/종료 가능
- ✅ 포스팅 작성/수정/삭제 가능


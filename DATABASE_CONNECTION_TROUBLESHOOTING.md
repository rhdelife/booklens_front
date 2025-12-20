# 🔧 데이터베이스 연결 문제 해결 가이드

## 현재 오류

```
PrismaClientInitializationError: 
Can't reach database server at `aws-1-ap-southeast-1.pooler.supabase.com:5432`
```

## 원인 분석

1. **데이터베이스 서버에 연결할 수 없음**
   - Supabase 데이터베이스가 중지되었거나
   - 네트워크 연결 문제 또는
   - 잘못된 연결 문자열

2. **Prisma 연결 설정 문제**
   - `DATABASE_URL` 환경 변수가 잘못되었거나
   - Supabase 연결 문자열 형식이 잘못되었거나
   - Pooler 설정 문제

## 해결 방법

### 1. Supabase 대시보드 확인

1. [Supabase 대시보드](https://app.supabase.com) 접속
2. 프로젝트 상태 확인 (Paused 상태인지 확인)
3. Settings > Database > Connection string 확인

### 2. 백엔드 환경 변수 확인

백엔드 프로젝트의 `.env` 파일에서 `DATABASE_URL` 확인:

```env
# 올바른 형식 (Direct connection)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# 또는 Pooler connection (권장)
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**중요**: 
- Pooler 연결은 포트 `6543`을 사용합니다 (포트 5432가 아님)
- Direct connection은 포트 `5432`를 사용하지만 연결 제한이 있습니다

### 3. Prisma 스키마 확인

백엔드의 `schema.prisma` 파일 확인:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 4. 연결 문자열 형식

#### Direct Connection (개발용)
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

#### Pooler Connection (프로덕션 권장)
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**예시**:
```
postgresql://postgres.ueffydcywfamsxdiggym:your_password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 5. Supabase 프로젝트 정보 확인

1. Supabase 대시보드 > Settings > API
2. 다음 정보 확인:
   - **Project URL**: `https://ueffydcywfamsxdiggym.supabase.co`
   - **Project Reference**: `ueffydcywfamsxdiggym`
   - **Database Password**: 설정한 비밀번호

### 6. 네트워크 및 방화벽 확인

- Render.com에서 Supabase로의 아웃바운드 연결이 허용되는지 확인
- Supabase IP 화이트리스트에 Render.com IP 추가 (필요한 경우)

### 7. Prisma 재연결

백엔드에서 다음 명령어 실행:

```bash
# Prisma 클라이언트 재생성
npx prisma generate

# 데이터베이스 연결 테스트
npx prisma db pull
```

### 8. 대안: Connection Pooling 설정

Prisma에서 connection pooling을 사용하는 경우:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Direct connection for migrations
}
```

`.env` 파일:
```env
DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
```

## 빠른 체크리스트

- [ ] Supabase 프로젝트가 Active 상태인가?
- [ ] `DATABASE_URL` 환경 변수가 올바른가?
- [ ] 비밀번호에 특수문자가 포함되어 URL 인코딩이 필요한가?
- [ ] Pooler 연결을 사용하는 경우 포트가 `6543`인가?
- [ ] Direct connection을 사용하는 경우 포트가 `5432`인가?
- [ ] Render.com 환경 변수에 `DATABASE_URL`이 설정되어 있는가?
- [ ] Prisma 클라이언트가 최신 상태인가?

## 임시 해결책

백엔드가 연결되지 않는 동안 프론트엔드에서:

1. **Supabase 인증 사용** (이미 구현됨)
2. **Mock 인증 사용** (개발/테스트용)

`AuthContext`에서 자동으로 폴백됩니다.

## 추가 리소스

- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Prisma Connection Strings](https://www.prisma.io/docs/guides/database/connection-strings)
- [Render.com Environment Variables](https://render.com/docs/environment-variables)


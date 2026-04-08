# 연타 (연세 타요)

연세대학교 미래캠퍼스 학생을 위한 **택시 합승 매칭** 웹 서비스입니다.

## 기술 스택

| 구분 | 사용 기술 |
|------|-----------|
| Backend | Java 17, Spring Boot 3.4, Spring Data JPA, Spring Security |
| Frontend | React 19, Vite 6, Tailwind CSS 4, React Router 7 |
| Database | PostgreSQL ([Supabase](https://supabase.com) 호스팅 권장) |
| 인증 | JWT, `@yonsei.ac.kr` 이메일 인증 (Gmail SMTP) |

## 저장소 구조

```
yonta/
├── backend/                 # Spring Boot API
│   └── src/main/java/com/yonta/
│       ├── controller/      # REST
│       ├── service/
│       ├── domain/          # JPA 엔티티
│       ├── repository/
│       ├── dto/
│       ├── security/        # JWT
│       └── exception/
├── frontend/                # Vite + React SPA
│   └── src/
│       ├── api/
│       ├── components/
│       ├── pages/
│       └── utils/
└── README.md
```

## 주요 기능

- 연세 메일 인증 후 회원가입 / 로그인
- 합승 파티 생성·목록·참여·나가기
- 방장: 파티 해산(혼자일 때), 방장 위임(다른 멤버 있을 때)
- 지난 파티 평가

## 사전 요구 사항

- JDK 17+
- Node.js 20+ (권장)
- Supabase(또는 PostgreSQL) 프로젝트 — DB URL, 사용자명, 비밀번호
- Gmail 앱 비밀번호 — 인증 메일 발송용

## 백엔드 실행

### 1) 로컬 설정 파일

`backend/src/main/resources/application-local.yml` 은 `${MAIL_USERNAME}` 등 **환경 변수**를 읽습니다.  
또는 같은 파일 안에 Gmail·Supabase 값을 **직접 문자열로** 적어도 됩니다 (커밋되지 않도록 `.gitignore` 처리됨).

템플릿은 `application-local.example.yml` 을 참고하세요.

### 2) 환경 변수 (로컬 프로필용)

| 변수 | 설명 |
|------|------|
| `DB_URL` | `jdbc:postgresql://호스트:6543/postgres` 형식 |
| `DB_USERNAME` | Supabase Pooler 사용자명 (예: `postgres.xxx`) |
| `DB_PASSWORD` | DB 비밀번호 |
| `MAIL_USERNAME` | Gmail 주소 |
| `MAIL_PASSWORD` | Gmail 앱 비밀번호 |
| `JWT_SECRET` | (선택) JWT 서명 키 — 미설정 시 `application.yml` 기본값 |
| `ADMIN_SECRET_KEY` | (선택) 관리자 API용 |

PowerShell 예시:

```powershell
cd backend
$env:DB_URL="jdbc:postgresql://xxxx.pooler.supabase.com:6543/postgres"
$env:DB_USERNAME="postgres.xxxxx"
$env:DB_PASSWORD="비밀번호"
$env:MAIL_USERNAME="you@gmail.com"
$env:MAIL_PASSWORD="앱비밀번호"
./gradlew bootRun '--args=--spring.profiles.active=local'
```

> PowerShell에서는 `--args=...` 를 **작은따옴표**로 감싸면 `>>` 프롬프트 문제를 피할 수 있습니다.

기본 프로필만 쓰는 경우 `application.yml` 의 `DB_*` 를 환경 변수로 넘깁니다.

### 3) Supabase에서 데이터 확인

프로젝트 대시보드 → **Table Editor** 에서 `users`, `taxi_party`, `participant`, `party_review` 등을 조회할 수 있습니다.

## 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

API 주소는 `frontend/.env` 의 `VITE_API_BASE_URL` 로 지정합니다 (예: `http://localhost:8080`).

## API 개요

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/auth/signup`, `/api/auth/login` | 회원가입, 로그인 |
| GET | `/api/parties` | 모집 중 파티 목록 |
| POST | `/api/parties` | 파티 생성 |
| DELETE | `/api/parties/{id}` | 파티 해산 (방장·혼자) |
| POST | `/api/parties/{id}/transfer-host` | 방장 위임 |

자세한 스펙은 `controller` 패키지를 참고하세요.

## 라이선스

프로젝트 내부 규정에 따릅니다.

# 연타 (연세 타요)

연세대학교 미래캠퍼스 학생을 위한 **택시 합승 매칭** 서비스입니다.  
웹·모바일 앱에서 파티를 만들고 참여하며, 실시간 채팅·알림·신뢰(매너) 시스템을 제공합니다.

## 기술 스택

| 구분 | 사용 기술 |
|------|-----------|
| Backend | Node.js, **NestJS 11**, Prisma 5, PostgreSQL |
| Web | **React 19**, Vite 6, Tailwind CSS 4, React Router 7 |
| Mobile | **Expo 54**, React Native, React Navigation |
| 인증 | `@yonsei.ac.kr` 이메일 OTP, JWT, 비밀번호 로그인(선택) |
| 실시간 | Socket.IO (파티 슬롯·채팅), STOMP/SockJS (알림) |

## 저장소 구조

```
yonsei_tayo/
├── backend/          # NestJS API + Prisma
│   ├── prisma/       # 스키마·마이그레이션
│   └── src/
├── web/              # Vite + React SPA
│   └── src/
├── mobile/           # Expo 앱
│   └── src/
└── README.md
```

## 주요 기능

- **인증**: 연세 메일 OTP → (최초 1회) 비밀번호 설정 → 이후 OTP 또는 비밀번호 로그인
- **합승 파티**: 생성·검색·참여·나가기·방장 위임·해산
- **실시간**: 파티 슬롯 갱신, 파티 채팅
- **택시 요금**: 방장이 총 요금 입력 → 인원 수로 1인당 금액 표시
- **마이페이지**: 신뢰 대시보드, 진행 중/이용 내역, 파티·멤버 평가, 노쇼 신고
- **프로필 설정**: 표시 이름, 성별, 조용한 합승 선호, 비밀번호 변경
- **알림**: 실시간 알림 벨 (웹)
- **관리자**: API 키 기반 사용자·통계 조회 (웹 `/admin`)

## 사전 요구 사항

- **Node.js** 20+ (권장)
- **PostgreSQL** 14+ (로컬 또는 [Supabase](https://supabase.com) 등)
- **SMTP** 발송 계정 (네이버/Gmail/Office365 등) — OTP 메일용
- 모바일 실기기 테스트 시: PC와 폰이 **같은 Wi‑Fi**, 방화벽에서 API 포트 허용

## 빠른 시작

### 1. 데이터베이스

PostgreSQL에 DB를 만들고 연결 URL을 준비합니다.

```bash
# 예: 로컬
createdb yonsei_tayo
```

### 2. 백엔드

```bash
cd backend
cp .env.example .env
# .env 에 DATABASE_URL, JWT_SECRET, SMTP_* 등 설정

npm install
npx prisma migrate deploy
npx prisma generate
npm run start:dev
```

기본 API 주소: `http://localhost:3000`  
헬스 체크: `GET /health`

| 변수 (요약) | 설명 |
|-------------|------|
| `DATABASE_URL` | PostgreSQL 연결 문자열 |
| `JWT_SECRET` | JWT 서명 키 (운영 환경에서는 반드시 변경) |
| `SMTP_*` | OTP 메일 발송 |
| `OTP_DEBUG_LOG` | `true`면 SMTP 없이 터미널에 OTP 출력 (개발용) |
| `ADMIN_API_KEY` | 관리자 API·웹 관리자 페이지용 |

자세한 SMTP 설정은 `backend/.env.example` 주석을 참고하세요.

### 3. 웹

```bash
cd web
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:3000

npm install
npm run dev
```

브라우저: `http://localhost:5173`

| 경로 | 설명 |
|------|------|
| `/` | 랜딩 |
| `/auth` | 로그인 (OTP / 비밀번호) |
| `/rides` | 파티 목록·상세 |
| `/create` | 파티 생성 |
| `/mypage` | 마이페이지 (대시보드·설정 등) |
| `/admin` | 관리자 |

### 4. 모바일 (Expo)

```bash
cd mobile
npm install
npm start
```

실기기에서 API에 접속하려면 `mobile/app.json`의 `extra.API_BASE_URL` / `SOCKET_BASE_URL`을 **개발 PC의 LAN IP**로 바꿉니다.

```json
"extra": {
  "API_BASE_URL": "http://192.168.x.x:3000",
  "SOCKET_BASE_URL": "http://192.168.x.x:3000"
}
```

`localhost`는 폰에서 PC를 가리키지 않으므로, USB/에뮬레이터가 아닌 실기기 테스트 시 IP 설정이 필요합니다.

## API 개요

인증이 필요한 API는 `Authorization: Bearer <accessToken>` 헤더를 사용합니다.

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/auth/request-otp` | OTP 요청 |
| POST | `/auth/verify-otp` | OTP 검증·로그인 |
| POST | `/auth/login` | 비밀번호 로그인 |
| POST | `/auth/set-password` | 비밀번호 설정·변경 (JWT) |
| GET | `/users/me` | 내 프로필 |
| PATCH | `/users/me` | 프로필 수정 |
| GET | `/users/me/dashboard` | 신뢰 대시보드 |
| GET | `/parties/search` | 파티 검색 |
| POST | `/parties` | 파티 생성 |
| GET | `/parties/me` | 내 진행 중 파티 |
| GET | `/parties/me/history` | 이용 내역 |
| PATCH | `/parties/:id/taxi-fare` | 택시 요금 (방장) |
| GET | `/notifications` | 알림 목록 |
| GET | `/admin/*` | 관리자 (`x-admin-key` 헤더) |

Swagger는 백엔드에 `@nestjs/swagger`가 포함되어 있으며, 필요 시 `main.ts`에서 문서 경로를 활성화할 수 있습니다.

## 개발 시 참고

- **시간대**: API는 UTC(ISO)로 저장하고, 웹·앱 UI는 **KST** 기준으로 표시합니다.
- **비밀번호**: OTP 최초 로그인 후 설정을 권장합니다. 미설정 시 웹·앱에서 설정 화면으로 유도합니다.
- **민감 정보**: `.env`, `backend/.env`, `web/.env`는 Git에 올리지 마세요. 예시는 각 폴더의 `.env.example`을 사용합니다.
- **빌드 산출물**: `node_modules/`, `dist/`, `.expo/` 등은 루트 `.gitignore`로 제외됩니다.

## 라이선스

프로젝트 내부 규정에 따릅니다.

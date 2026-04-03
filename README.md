# 연타 (연세 타요) - 택시 합승 플랫폼

연세대학교 미래캠퍼스 학생들을 위한 택시 합승 매칭 웹 서비스

## 기술 스택

| 구분 | 기술 |
|------|------|
| **Backend** | Java 17, Spring Boot 3.4, Spring Data JPA, Spring Security |
| **Frontend** | React 19, Tailwind CSS 4, Vite 6, Zustand |
| **Database** | MySQL 8 |
| **Auth** | JWT + @yonsei.ac.kr 메일 인증 |
| **Realtime** | WebSocket (STOMP) |

## 프로젝트 구조

```
yonta/
├── backend/                          # Spring Boot 백엔드
│   ├── build.gradle
│   ├── settings.gradle
│   └── src/
│       ├── main/
│       │   ├── java/com/yonta/
│       │   │   ├── YontaApplication.java      # 메인 진입점
│       │   │   ├── config/                    # 설정 (Security, Web, JWT)
│       │   │   ├── controller/                # REST API 컨트롤러
│       │   │   ├── domain/                    # JPA 엔티티
│       │   │   ├── dto/
│       │   │   │   ├── request/               # 요청 DTO
│       │   │   │   └── response/              # 응답 DTO
│       │   │   ├── repository/                # JPA 리포지토리
│       │   │   ├── service/                   # 비즈니스 로직
│       │   │   ├── security/                  # JWT 필터, UserDetails
│       │   │   └── exception/                 # 전역 예외 처리
│       │   └── resources/
│       │       └── application.yml
│       └── test/
│
├── frontend/                          # React 프런트엔드
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx                   # 앱 진입점
│       ├── App.jsx                    # 루트 컴포넌트
│       ├── index.css                  # Tailwind 임포트
│       ├── api/                       # Axios 인스턴스 & API 함수
│       ├── components/
│       │   ├── common/                # 공통 UI (Header, Footer, Button)
│       │   ├── auth/                  # 인증 관련 (Login, SignUp, 메일인증)
│       │   └── ride/                  # 합승 관련 (카드, 목록, 생성, 상세)
│       ├── pages/                     # 페이지 컴포넌트
│       ├── hooks/                     # 커스텀 훅
│       ├── context/                   # React Context
│       ├── utils/                     # 유틸리티
│       └── routes/                    # 라우터 설정
│
└── README.md
```

## 핵심 도메인

| 도메인 | 설명 |
|--------|------|
| **User** | 회원 (이메일 인증, 프로필) |
| **EmailVerification** | @yonsei.ac.kr 메일 인증 코드 |
| **Ride** | 합승 방 (출발지, 도착지, 시간, 최대인원) |
| **RideParticipant** | 합승 참여자 |
| **ChatMessage** | 합승 방 내 실시간 채팅 |

## 시작하기

### 백엔드

```bash
cd backend
./gradlew bootRun
```

### 프런트엔드

```bash
cd frontend
npm install
npm run dev
```

### 환경 변수

백엔드 실행 시 다음 환경 변수를 설정하세요:

| 변수 | 설명 |
|------|------|
| `DB_USERNAME` | MySQL 사용자명 |
| `DB_PASSWORD` | MySQL 비밀번호 |
| `JWT_SECRET` | JWT 서명 키 |
| `MAIL_USERNAME` | SMTP 메일 계정 |
| `MAIL_PASSWORD` | SMTP 앱 비밀번호 |

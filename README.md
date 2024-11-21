# IAM Server - Unified OAuth Authentication Solution 🌐

A NestJS-based OAuth authentication service that supports Google, Kakao, Naver, and Apple OAuth providers. This service handles user authentication, token management, and user profile management.

## Features
- **OAuth Authentication**: Supports Google, Kakao, Naver, and Apple.
- **JWT Token Management**: Access and refresh token generation and validation.
- **User Management**: Automatically creates or updates users upon authentication.
- **CSRF Protection**: Implements state parameter validation for secure requests.
- **Modular Architecture**: Cleanly organized and easily extensible modules.

---
## Installation
1. **Clone the repository**
```bash
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>
```

2. **Install dependencies**
```bash
yarn install
```

3. **Configure environment variables**
    - Create a `.env` file in the root directory and define the following variables
```bash
NODE_ENV=development
PORT=3000
API_PREFIX=api
CORS_ENABLED=true
CORS_ORIGINS=http://localhost:3000

# Database
DATABASE_URL=postgresql://<username>:<password>@localhost:5432/<database_name>
DATABASE_MAX_CONNECTIONS=100
DATABASE_SSL_ENABLED=false

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# OAuth Providers
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret
KAKAO_REDIRECT_URI=http://localhost:3000/auth/kakao/callback

NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
NAVER_REDIRECT_URI=http://localhost:3000/auth/naver/callback

APPLE_CLIENT_ID=your_apple_client_id
APPLE_TEAM_ID=your_apple_team_id
APPLE_KEY_ID=your_apple_key_id
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----"
APPLE_REDIRECT_URI=http://localhost:3000/auth/apple/callback

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

4. **Run database migrations** (using Prisma)
```bash
npx prisma migrate dev
```

5. **Start the server**
```bash
yarn start
```

The server will be available at `http://localhost:3000`.

---
## API Endpoints

### **Authentication**
1. Get Authorization URL
```http
GET /auth/:provider/url
```
- **Path Parameters**: `provider` (google, kakao, naver, apple)
- **Query Parameters**: `state` (optional)
- **Response**: Authorization URL.

1. Handle OAuth Callback
```http
GET /auth/:provider/callback
```
- **Path Parameters**: `provider` (google, kakao, naver, apple)
- **Query Parameters**: `code`, `state` (optional)
- **Response**: Access and refresh tokens.

1. Get User Info
```http
GET /auth/user
```
- **Headers**: `Authorization: Bearer <access_token>`
- **Response**: Authenticated user information.

1. Refresh Tokens
```http
POST /auth/refresh
```
-  **Headers**: `Authorization: Bearer <refresh_token>`
- **Response**: New access and refresh tokens.

---
## Project Structure
App
```bash
src/
├── auth/                 # Authentication module
│   ├── controllers/      # Controllers for handling requests
│   ├── decorators/       # Custom decorators
│   ├── dto/              # Data Transfer Objects
│   ├── enums/            # Enums for providers and constants
│   ├── guards/           # Authorization guards
│   ├── strategies/       # OAuth provider strategies
│   ├── auth.module.ts    # Auth module definition
│   ├── auth.service.ts   # Auth business logic
├── users/                # User management module
├── common/               # Shared utilities and interceptors
├── prisma/               # Prisma database configuration
├── main.ts               # Application entry point
```

configuration
```bash
/
├── .env.development             # 개발 환경 변수
├── .env.production             # 운영 환경 변수
├── .env.test                   # 테스트 환경 변수
│
├── package.json                # 프로젝트 의존성
├── tsconfig.json              # TypeScript 설정
│
├── Dockerfile                 # Docker 빌드 설정
├── docker-compose.yml         # Docker 컨테이너 구성
└── docker-compose.dev.yml     # 개발용 Docker 구성
```

--- 
## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new feature branch.
3. Commit your changes and push to your fork.
4. Create a pull request to the main branch of this repository.

# LICENSE

Copyright (c) 2024 [Justin Jang, cookyman]

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

1. The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
2. If you modify or redistribute this Software, you must retain this license in your project and acknowledge the original author in any derivative works.
3. This Software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement.

**Additional Terms**:

- The original author retains all moral rights to the code.
- Any modifications to the Software that are publicly distributed must include attribution to the original author.
- The software may not be used for purposes that violate applicable laws or ethical standards, including but not limited to abuse or harm.

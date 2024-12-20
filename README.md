# 칼로메이트 AI (CaloMate-BackEnd)
이 프로젝트는 CaloMate 백엔드입니다. 사용자가 CaloMate을 이용할때 여러기능을 구현하였습니다..

## 📄 프로젝트 설명
- **CaloMate프로젝트의 여러 기능을 구현한 프로젝트입니다..**

## 🚀 프로젝트 데모
- [CaloMate 데모 페이지](https://calomate.highground.kr/)

## 🔧 사용 기술 스택
Node.js, Express.js, MySQL, TypeScript

## 📌 주요 기능
- **회원 가입 및 로그인 기능**
- **이전상담내역 조회 기능**
- **프로필 저장 기능**
- **AI상담 생성 기능**
- **데이터베이스와의 상호작용**

## 설치 및 실행

### 사전 요구 사항
- **Node.js** (v14 이상)
- **npm** 또는 **yarn**

### 설치

1. 저장소를 클론합니다.
```
git clone https://github.com/TKSK2884/CaloMate-BackEnd.git
```

2. 의존성을 설치합니다.
```
npm install
# 또는
yarn install
```

3. .env 파일을 생성하고 다음 정보를 입력하세요
```
DB_SERVER_ADDR="yourAddrs"
DB_USER="yourUser"
DB_PASSWORD="yourPassword"
DB="yourDB"
...
OPENAI_API_KEY:"yourAPIKey"
```
4. 백엔드 서버 실행
```
npm run start
# 또는
yarn start
```
5. API서버는 http://localhost:8566에서 실행됩니다.

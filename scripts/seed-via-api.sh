#!/bin/bash
# ===========================================
# Synology NAS용 API 기반 데이터 시딩
# Synology Docker bridge 네트워크 제약으로 인해
# seed 스크립트 대신 백엔드 API를 통해 데이터를 입력합니다.
#
# 사용법:
#   cd /volume1/docker/resume
#   bash scripts/seed-via-api.sh
# ===========================================

set -e

# .env 파일에서 환경 변수 로드
ENV_FILE=".env"
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | grep -v '^\s*$' | xargs)
  echo "✅ Loaded environment from $ENV_FILE"
else
  echo "❌ .env file not found. Copy from template first:"
  echo "   cp .env.nas.example .env"
  exit 1
fi

BASE_URL="${BASE_URL:-http://localhost:3080}"
DATA_FILE="./resume-web/src/data.json"

# ADMIN_EMAIL, ADMIN_PASSWORD는 반드시 .env에 설정되어 있어야 함
if [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASSWORD" ]; then
  echo "❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env"
  exit 1
fi

EMAIL="$ADMIN_EMAIL"
PASSWORD="$ADMIN_PASSWORD"

echo "🌱 Starting API-based seeding..."
echo "   URL: $BASE_URL"
echo "   Email: $EMAIL"
echo ""

# data.json 파일 확인
if [ ! -f "$DATA_FILE" ]; then
  echo "❌ Data file not found: $DATA_FILE"
  exit 1
fi

# 1. 사용자 등록
echo "👤 Registering user..."
REGISTER_RESULT=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
echo "   $REGISTER_RESULT"

# 2. 로그인 (토큰 획득)
echo ""
echo "🔐 Logging in..."
LOGIN_RESULT=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

# 토큰 추출 (jq 없이 동작)
TOKEN=$(echo "$LOGIN_RESULT" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed: $LOGIN_RESULT"
  exit 1
fi
echo "   ✅ Token received"

# 3. 이력서 생성 (data.json 전체를 POST)
echo ""
echo "📄 Creating resume from data.json..."
RESUME_RESULT=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/resume" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d @"$DATA_FILE")

HTTP_CODE=$(echo "$RESUME_RESULT" | tail -1)
BODY=$(echo "$RESUME_RESULT" | head -1)

if [ "$HTTP_CODE" = "201" ]; then
  echo "   ✅ Resume created successfully"
  echo "   $BODY"
elif [ "$HTTP_CODE" = "409" ]; then
  echo "   ⚠️  Resume already exists (skip)"
else
  echo "   ❌ Failed (HTTP $HTTP_CODE): $BODY"
  exit 1
fi

echo ""
echo "🎉 Seeding completed!"
echo ""
echo "📌 Login credentials:"
echo "   Email: $EMAIL"
echo "   Password: $PASSWORD"
echo ""
echo "🌐 Open: $BASE_URL"

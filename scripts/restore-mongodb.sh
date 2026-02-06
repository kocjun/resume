#!/bin/bash
# MongoDB 백업 복구 스크립트
# 사용법: ./scripts/restore-mongodb.sh [백업파일명]

set -euo pipefail

# 설정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
CONTAINER_NAME="${CONTAINER_NAME:-resume-mongodb}"
DB_NAME="${DB_NAME:-resume-db}"

# 색상 출력
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 백업 파일 목록 출력
list_backups() {
    echo -e "${CYAN}=== 사용 가능한 백업 파일 ===${NC}"
    if ls "$BACKUP_DIR"/mongodb_backup_*.archive 1>/dev/null 2>&1; then
        ls -lht "$BACKUP_DIR"/mongodb_backup_*.archive | head -10
    else
        log_warn "백업 파일이 없습니다."
        exit 1
    fi
    echo ""
}

# 인자 확인
if [ $# -eq 0 ]; then
    echo "사용법: $0 <백업파일명>"
    echo ""
    list_backups
    exit 1
fi

BACKUP_FILE="$1"

# 백업 파일 경로 확인
if [[ "$BACKUP_FILE" != /* ]]; then
    BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"
else
    BACKUP_PATH="$BACKUP_FILE"
fi

if [ ! -f "$BACKUP_PATH" ]; then
    log_error "백업 파일을 찾을 수 없습니다: $BACKUP_PATH"
    echo ""
    list_backups
    exit 1
fi

# MongoDB 컨테이너 상태 확인
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    log_error "MongoDB 컨테이너($CONTAINER_NAME)가 실행 중이 아닙니다."
    log_info "docker-compose up -d mongodb 명령으로 시작하세요."
    exit 1
fi

# 복구 확인
echo ""
echo -e "${RED}경고: 이 작업은 기존 데이터베이스($DB_NAME)를 덮어씁니다!${NC}"
echo "백업 파일: $(basename "$BACKUP_PATH")"
echo "대상 DB: $DB_NAME"
echo ""
read -p "계속하시겠습니까? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    log_info "복구가 취소되었습니다."
    exit 0
fi

log_info "MongoDB 복구 시작..."

# 백업 파일을 컨테이너로 복사
TEMP_BACKUP="/tmp/$(basename "$BACKUP_PATH")"
log_info "백업 파일 복사 중..."
if docker cp "$BACKUP_PATH" "${CONTAINER_NAME}:${TEMP_BACKUP}"; then
    log_info "백업 파일 복사 완료"
else
    log_error "백업 파일 복사 실패"
    exit 1
fi

# 기존 데이터베이스 삭제
log_info "기존 데이터베이스 삭제 중..."
docker exec "$CONTAINER_NAME" mongosh --quiet --eval "db.getSiblingDB('$DB_NAME').dropDatabase()" || true

# mongorestore 실행
log_info "mongorestore 실행 중..."
if docker exec "$CONTAINER_NAME" mongorestore \
    --archive="$TEMP_BACKUP" \
    --gzip \
    --drop \
    --nsInclude="${DB_NAME}.*"; then
    log_info "mongorestore 완료"
else
    log_error "mongorestore 실패"
    # 임시 파일 정리
    docker exec "$CONTAINER_NAME" rm -f "$TEMP_BACKUP"
    exit 1
fi

# 컨테이너 내 임시 파일 삭제
docker exec "$CONTAINER_NAME" rm -f "$TEMP_BACKUP"

# 복구 확인
log_info "데이터베이스 상태 확인 중..."
COLLECTIONS=$(docker exec "$CONTAINER_NAME" mongosh --quiet --eval "db.getSiblingDB('$DB_NAME').getCollectionNames().join(', ')")
log_info "복구된 컬렉션: $COLLECTIONS"

# 복구 로그 기록
BACKUP_LOG="${BACKUP_DIR}/backup.log"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 복구 완료: $(basename "$BACKUP_PATH")" >> "$BACKUP_LOG"

echo ""
log_info "복구 완료!"
echo "복구된 백업: $(basename "$BACKUP_PATH")"
echo "대상 DB: $DB_NAME"

#!/bin/bash
# MongoDB 자동 백업 스크립트
# Synology NAS Task Scheduler에서 매일 실행 권장

set -euo pipefail

# 설정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
CONTAINER_NAME="${CONTAINER_NAME:-resume-mongodb}"
DB_NAME="${DB_NAME:-resume-db}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="mongodb_backup_${DATE}"

# 색상 출력
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 백업 디렉토리 생성
mkdir -p "$BACKUP_DIR"

log_info "MongoDB 백업 시작: $BACKUP_FILE"

# MongoDB 컨테이너 상태 확인
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    log_error "MongoDB 컨테이너($CONTAINER_NAME)가 실행 중이 아닙니다."
    exit 1
fi

# mongodump 실행
log_info "mongodump 실행 중..."
if docker exec "$CONTAINER_NAME" mongodump \
    --db="$DB_NAME" \
    --archive="/tmp/${BACKUP_FILE}.archive" \
    --gzip; then
    log_info "mongodump 완료"
else
    log_error "mongodump 실패"
    exit 1
fi

# 백업 파일을 호스트로 복사
log_info "백업 파일 복사 중..."
if docker cp "${CONTAINER_NAME}:/tmp/${BACKUP_FILE}.archive" "${BACKUP_DIR}/${BACKUP_FILE}.archive"; then
    log_info "백업 파일 복사 완료: ${BACKUP_DIR}/${BACKUP_FILE}.archive"
else
    log_error "백업 파일 복사 실패"
    exit 1
fi

# 컨테이너 내 임시 파일 삭제
docker exec "$CONTAINER_NAME" rm -f "/tmp/${BACKUP_FILE}.archive"

# 백업 파일 크기 확인
BACKUP_SIZE=$(ls -lh "${BACKUP_DIR}/${BACKUP_FILE}.archive" | awk '{print $5}')
log_info "백업 파일 크기: $BACKUP_SIZE"

# 오래된 백업 삭제
log_info "오래된 백업 정리 중 (${RETENTION_DAYS}일 이전)..."
DELETED_COUNT=0
while IFS= read -r old_backup; do
    if [ -n "$old_backup" ]; then
        rm -f "$old_backup"
        log_info "삭제됨: $(basename "$old_backup")"
        ((DELETED_COUNT++))
    fi
done < <(find "$BACKUP_DIR" -name "mongodb_backup_*.archive" -type f -mtime +$RETENTION_DAYS 2>/dev/null)

if [ $DELETED_COUNT -gt 0 ]; then
    log_info "총 ${DELETED_COUNT}개의 오래된 백업 삭제됨"
fi

# 백업 목록 출력
log_info "현재 백업 목록:"
ls -lh "$BACKUP_DIR"/mongodb_backup_*.archive 2>/dev/null || log_warn "백업 파일 없음"

# 백업 결과 로그 파일 작성
BACKUP_LOG="${BACKUP_DIR}/backup.log"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 백업 완료: ${BACKUP_FILE}.archive (${BACKUP_SIZE})" >> "$BACKUP_LOG"

log_info "백업 완료!"
echo ""
echo "백업 파일: ${BACKUP_DIR}/${BACKUP_FILE}.archive"
echo "복구 명령: ./scripts/restore-mongodb.sh ${BACKUP_FILE}.archive"

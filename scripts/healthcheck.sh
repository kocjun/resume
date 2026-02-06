#!/bin/bash
# 서비스 헬스체크 및 알림 스크립트
# 주기적으로 실행하여 서비스 상태 모니터링

set -euo pipefail

# 설정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="${PROJECT_DIR}/docker-compose.yml"

# 알림 설정 (환경변수로 설정)
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"
NOTIFY_EMAIL="${NOTIFY_EMAIL:-}"

# 서비스 설정
SERVICES=("resume-mongodb" "resume-backend" "resume-nginx")
BACKEND_HEALTH_URL="${BACKEND_HEALTH_URL:-http://localhost/api/resume}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost}"

# 로그 파일
LOG_DIR="${PROJECT_DIR}/logs"
LOG_FILE="${LOG_DIR}/healthcheck.log"
mkdir -p "$LOG_DIR"

# 색상 출력
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 타임스탬프
timestamp() { date '+%Y-%m-%d %H:%M:%S'; }

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
    echo "[$(timestamp)] [INFO] $1" >> "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    echo "[$(timestamp)] [WARN] $1" >> "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "[$(timestamp)] [ERROR] $1" >> "$LOG_FILE"
}

# Slack 알림 전송
send_slack_notification() {
    local message="$1"
    local status="$2"  # ok, warning, error

    if [ -z "$SLACK_WEBHOOK_URL" ]; then
        return 0
    fi

    local color="good"
    case "$status" in
        warning) color="warning" ;;
        error)   color="#FF0000" ;;
    esac

    local payload=$(cat <<EOF
{
    "attachments": [{
        "color": "$color",
        "title": "Resume Service Health Check",
        "text": "$message",
        "footer": "Health Monitor",
        "ts": $(date +%s)
    }]
}
EOF
)

    curl -s -X POST -H 'Content-type: application/json' \
        --data "$payload" "$SLACK_WEBHOOK_URL" > /dev/null 2>&1 || true
}

# Discord 알림 전송
send_discord_notification() {
    local message="$1"
    local status="$2"  # ok, warning, error

    if [ -z "$DISCORD_WEBHOOK_URL" ]; then
        return 0
    fi

    local color=3066993  # green
    case "$status" in
        warning) color=16776960 ;;  # yellow
        error)   color=15158332 ;;  # red
    esac

    local payload=$(cat <<EOF
{
    "embeds": [{
        "title": "Resume Service Health Check",
        "description": "$message",
        "color": $color,
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    }]
}
EOF
)

    curl -s -X POST -H 'Content-type: application/json' \
        --data "$payload" "$DISCORD_WEBHOOK_URL" > /dev/null 2>&1 || true
}

# 알림 전송
send_notification() {
    local message="$1"
    local status="${2:-error}"

    send_slack_notification "$message" "$status"
    send_discord_notification "$message" "$status"
}

# Docker 컨테이너 상태 확인
check_container() {
    local container_name="$1"

    if ! docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        return 1
    fi

    # 컨테이너 헬스 상태 확인
    local health_status
    health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "none")

    case "$health_status" in
        healthy) return 0 ;;
        unhealthy) return 1 ;;
        starting) return 0 ;;  # 시작 중은 OK로 처리
        none) return 0 ;;      # 헬스체크 없으면 실행 중이면 OK
        *) return 1 ;;
    esac
}

# HTTP 헬스체크 (2xx, 401, 403 응답도 서버 동작 중으로 판단)
check_http() {
    local url="$1"
    local timeout="${2:-5}"

    local http_code
    http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" "$url" 2>/dev/null)

    # 2xx, 401, 403은 서버가 동작 중임을 의미
    if [[ "$http_code" =~ ^(2[0-9]{2}|401|403)$ ]]; then
        return 0
    else
        return 1
    fi
}

# 디스크 사용량 확인
check_disk_usage() {
    local threshold="${1:-85}"
    local usage
    usage=$(df -h "$PROJECT_DIR" | awk 'NR==2 {print $5}' | tr -d '%')

    if [ "$usage" -gt "$threshold" ]; then
        return 1
    fi
    return 0
}

# 메모리 사용량 확인
check_memory_usage() {
    local threshold="${1:-90}"
    local usage

    if [[ "$(uname)" == "Darwin" ]]; then
        # macOS
        usage=$(vm_stat | awk '/Pages active/ {print $3}' | tr -d '.')
        # 대략적인 퍼센트 계산 (정확하지 않음)
        usage=$((usage * 100 / 1000000))
    else
        # Linux
        usage=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')
    fi

    if [ "$usage" -gt "$threshold" ]; then
        return 1
    fi
    return 0
}

# 전체 헬스체크 실행
run_healthcheck() {
    local has_error=false
    local has_warning=false
    local report=""

    log_info "=== 헬스체크 시작 ==="

    # 1. Docker 컨테이너 상태 확인
    for service in "${SERVICES[@]}"; do
        if check_container "$service"; then
            log_info "✓ 컨테이너 $service: 정상"
            report+="✓ $service: OK\n"
        else
            log_error "✗ 컨테이너 $service: 비정상"
            report+="✗ $service: FAILED\n"
            has_error=true
        fi
    done

    # 2. Backend API 헬스체크
    if check_http "$BACKEND_HEALTH_URL"; then
        log_info "✓ Backend API: 정상"
        report+="✓ Backend API: OK\n"
    else
        log_error "✗ Backend API: 응답 없음"
        report+="✗ Backend API: FAILED\n"
        has_error=true
    fi

    # 3. Frontend 접근 확인
    if check_http "$FRONTEND_URL"; then
        log_info "✓ Frontend: 정상"
        report+="✓ Frontend: OK\n"
    else
        log_error "✗ Frontend: 응답 없음"
        report+="✗ Frontend: FAILED\n"
        has_error=true
    fi

    # 4. 디스크 사용량 확인
    if check_disk_usage 85; then
        log_info "✓ 디스크 사용량: 정상"
        report+="✓ Disk: OK\n"
    else
        log_warn "⚠ 디스크 사용량: 85% 초과"
        report+="⚠ Disk: WARNING (>85%)\n"
        has_warning=true
    fi

    # 5. 메모리 사용량 확인
    if check_memory_usage 90; then
        log_info "✓ 메모리 사용량: 정상"
        report+="✓ Memory: OK\n"
    else
        log_warn "⚠ 메모리 사용량: 90% 초과"
        report+="⚠ Memory: WARNING (>90%)\n"
        has_warning=true
    fi

    log_info "=== 헬스체크 완료 ==="

    # 알림 전송 (문제 발생 시에만)
    if [ "$has_error" = true ]; then
        send_notification "서비스 장애 감지!\n\n$report" "error"
        return 1
    elif [ "$has_warning" = true ]; then
        send_notification "서비스 경고!\n\n$report" "warning"
        return 0
    fi

    return 0
}

# 서비스 자동 복구 시도
auto_recover() {
    local service="$1"
    log_warn "서비스 복구 시도: $service"

    cd "$PROJECT_DIR"

    case "$service" in
        resume-mongodb|resume-backend|resume-nginx)
            docker-compose restart "${service#resume-}" || true
            sleep 10
            if check_container "$service"; then
                log_info "복구 성공: $service"
                send_notification "서비스 자동 복구 성공: $service" "ok"
                return 0
            fi
            ;;
    esac

    log_error "복구 실패: $service"
    return 1
}

# 메인 실행
main() {
    local mode="${1:-check}"

    case "$mode" in
        check)
            run_healthcheck
            ;;
        recover)
            # 헬스체크 후 문제 있으면 복구 시도
            if ! run_healthcheck; then
                for service in "${SERVICES[@]}"; do
                    if ! check_container "$service"; then
                        auto_recover "$service"
                    fi
                done
            fi
            ;;
        status)
            # 간단한 상태 출력
            echo "=== Docker 컨테이너 상태 ==="
            docker-compose -f "$COMPOSE_FILE" ps
            echo ""
            echo "=== 리소스 사용량 ==="
            docker stats --no-stream "${SERVICES[@]}" 2>/dev/null || true
            ;;
        *)
            echo "사용법: $0 [check|recover|status]"
            echo "  check   - 헬스체크만 실행 (기본값)"
            echo "  recover - 헬스체크 후 자동 복구 시도"
            echo "  status  - 현재 상태 출력"
            exit 1
            ;;
    esac
}

main "$@"

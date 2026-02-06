#!/bin/bash
# Resume 프로젝트 통합 배포 스크립트
# Synology NAS에서 실행

set -euo pipefail

# 설정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${PROJECT_DIR}/.env.production"

# 색상 출력
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${CYAN}[STEP]${NC} $1"; }

# 헤더 출력
print_header() {
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║           Resume 프로젝트 배포 스크립트                    ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 사전 요구사항 확인
check_requirements() {
    log_step "1/7 사전 요구사항 확인"

    # Docker 확인
    if ! command -v docker &> /dev/null; then
        log_error "Docker가 설치되어 있지 않습니다."
        exit 1
    fi
    log_info "✓ Docker: $(docker --version | cut -d' ' -f3)"

    # Docker Compose 확인
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose가 설치되어 있지 않습니다."
        exit 1
    fi
    log_info "✓ Docker Compose 설치됨"

    # 환경 변수 파일 확인
    if [ ! -f "$ENV_FILE" ]; then
        log_error "환경 변수 파일이 없습니다: $ENV_FILE"
        log_info ".env.production 파일을 생성하고 JWT_SECRET을 설정하세요."
        exit 1
    fi
    log_info "✓ 환경 변수 파일 존재"

    # JWT_SECRET 확인
    if grep -q "^JWT_SECRET=.*secret.*" "$ENV_FILE" || grep -q "^JWT_SECRET=$" "$ENV_FILE"; then
        log_warn "⚠ JWT_SECRET이 기본값입니다. 보안을 위해 변경하세요."
    fi
}

# Git 최신 코드 가져오기 (선택적)
pull_latest() {
    log_step "2/7 최신 코드 확인"

    cd "$PROJECT_DIR"

    if [ -d ".git" ]; then
        log_info "Git 저장소 감지됨"
        read -p "최신 코드를 가져오시겠습니까? (y/n): " PULL_CONFIRM
        if [ "$PULL_CONFIRM" = "y" ] || [ "$PULL_CONFIRM" = "Y" ]; then
            git pull origin main || git pull origin master || log_warn "Git pull 실패, 현재 코드로 계속합니다."
        fi
    else
        log_info "Git 저장소가 아님, 스킵"
    fi
}

# 프론트엔드 빌드
build_frontend() {
    log_step "3/7 프론트엔드 빌드"

    cd "${PROJECT_DIR}/resume-web"

    # node_modules 확인
    if [ ! -d "node_modules" ]; then
        log_info "의존성 설치 중..."
        npm install
    fi

    # 빌드
    log_info "프론트엔드 빌드 중..."
    npm run build

    if [ -d "dist" ]; then
        local size=$(du -sh dist | cut -f1)
        log_info "✓ 빌드 완료: dist/ ($size)"
    else
        log_error "빌드 실패: dist 디렉토리가 생성되지 않았습니다."
        exit 1
    fi
}

# Docker 이미지 빌드
build_images() {
    log_step "4/7 Docker 이미지 빌드"

    cd "$PROJECT_DIR"

    log_info "백엔드 이미지 빌드 중..."
    docker-compose --env-file "$ENV_FILE" build backend

    log_info "✓ Docker 이미지 빌드 완료"
}

# 기존 서비스 중지
stop_services() {
    log_step "5/7 기존 서비스 중지"

    cd "$PROJECT_DIR"

    if docker-compose ps -q 2>/dev/null | grep -q .; then
        log_info "기존 서비스 중지 중..."
        docker-compose --env-file "$ENV_FILE" down --remove-orphans
        log_info "✓ 서비스 중지 완료"
    else
        log_info "실행 중인 서비스 없음"
    fi
}

# 서비스 시작
start_services() {
    log_step "6/7 서비스 시작"

    cd "$PROJECT_DIR"

    log_info "서비스 시작 중..."
    docker-compose --env-file "$ENV_FILE" up -d

    # 서비스 상태 확인
    log_info "서비스 시작 대기 중..."
    sleep 10

    docker-compose --env-file "$ENV_FILE" ps
}

# 헬스체크
verify_deployment() {
    log_step "7/7 배포 검증"

    local max_retries=30
    local retry_count=0

    # Backend 헬스체크
    log_info "Backend 헬스체크 대기 중..."
    while [ $retry_count -lt $max_retries ]; do
        if curl -sf http://localhost:3001/health > /dev/null 2>&1; then
            log_info "✓ Backend API 정상"
            break
        fi
        retry_count=$((retry_count + 1))
        sleep 2
    done

    if [ $retry_count -eq $max_retries ]; then
        log_warn "⚠ Backend 헬스체크 타임아웃"
    fi

    # Frontend 확인
    if curl -sf http://localhost/ > /dev/null 2>&1; then
        log_info "✓ Frontend 정상"
    else
        log_warn "⚠ Frontend 접근 불가"
    fi

    # MongoDB 확인
    if docker exec resume-mongodb mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        log_info "✓ MongoDB 정상"
    else
        log_warn "⚠ MongoDB 접근 불가"
    fi
}

# 배포 완료 메시지
print_summary() {
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    배포 완료!                              ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "접속 URL:"
    echo "  - HTTP:  http://localhost/"
    echo "  - HTTPS: https://localhost/ (Self-signed 인증서)"
    echo ""
    echo "서비스 관리 명령:"
    echo "  - 상태 확인: docker-compose ps"
    echo "  - 로그 확인: docker-compose logs -f"
    echo "  - 재시작:    docker-compose restart"
    echo "  - 중지:      docker-compose down"
    echo ""
    echo "데이터 관리:"
    echo "  - 백업: ./scripts/backup-mongodb.sh"
    echo "  - 복구: ./scripts/restore-mongodb.sh <백업파일>"
    echo "  - 시드: docker exec resume-backend npm run seed"
    echo ""
}

# 롤백
rollback() {
    log_warn "배포 롤백 중..."
    cd "$PROJECT_DIR"
    docker-compose --env-file "$ENV_FILE" down
    log_info "서비스가 중지되었습니다. 이전 이미지로 복원하려면 수동으로 진행하세요."
}

# 메인 실행
main() {
    local mode="${1:-deploy}"

    print_header

    case "$mode" in
        deploy)
            check_requirements
            pull_latest
            build_frontend
            build_images
            stop_services
            start_services
            verify_deployment
            print_summary
            ;;
        quick)
            # 빌드 없이 빠른 재시작
            log_info "빠른 재배포 (빌드 없이 재시작)"
            stop_services
            start_services
            verify_deployment
            ;;
        build)
            # 빌드만 실행
            check_requirements
            build_frontend
            build_images
            log_info "빌드 완료. 'deploy.sh quick'로 서비스를 시작하세요."
            ;;
        rollback)
            rollback
            ;;
        status)
            cd "$PROJECT_DIR"
            docker-compose --env-file "$ENV_FILE" ps
            echo ""
            docker-compose --env-file "$ENV_FILE" logs --tail=20
            ;;
        *)
            echo "사용법: $0 [deploy|quick|build|rollback|status]"
            echo ""
            echo "  deploy   - 전체 배포 (기본값)"
            echo "  quick    - 빌드 없이 빠른 재시작"
            echo "  build    - 빌드만 실행"
            echo "  rollback - 서비스 중지"
            echo "  status   - 현재 상태 확인"
            exit 1
            ;;
    esac
}

# 에러 핸들링
trap 'log_error "배포 중 오류 발생. 롤백하려면: $0 rollback"' ERR

main "$@"

#!/bin/bash
# 이력서 데이터 초기화 스크립트
# 사용법: ./scripts/init-resume.sh [--clear]
#
# 주의: 이 스크립트는 기존 데이터를 삭제하고 새로 생성합니다.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SEED_DATA_FILE="${SCRIPT_DIR}/seed-data/resume-data.json"
CONTAINER_NAME="${CONTAINER_NAME:-resume-backend}"

# 색상 출력
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

print_header() {
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║           이력서 데이터 초기화 스크립트                     ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 시드 데이터 파일 확인
check_seed_data() {
    if [ ! -f "$SEED_DATA_FILE" ]; then
        log_error "시드 데이터 파일을 찾을 수 없습니다: $SEED_DATA_FILE"
        log_info "scripts/seed-data/resume-data.json 파일을 생성하세요."
        exit 1
    fi
    log_info "시드 데이터 파일 확인됨: $SEED_DATA_FILE"
}

# Docker 컨테이너 확인
check_container() {
    if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_error "Backend 컨테이너($CONTAINER_NAME)가 실행 중이 아닙니다."
        log_info "docker-compose up -d 명령으로 서비스를 시작하세요."
        exit 1
    fi
    log_info "Backend 컨테이너 확인됨"
}

# 데이터 초기화 실행
run_init() {
    local clear_flag="${1:-}"

    print_header

    check_seed_data
    check_container

    # 경고 메시지
    echo ""
    echo -e "${RED}경고: 이 작업은 기존 사용자 및 이력서 데이터를 삭제합니다!${NC}"
    echo ""
    read -p "계속하시겠습니까? (yes/no): " CONFIRM

    if [ "$CONFIRM" != "yes" ]; then
        log_info "초기화가 취소되었습니다."
        exit 0
    fi

    # 시드 데이터를 컨테이너로 복사
    log_info "시드 데이터 복사 중..."
    docker cp "$SEED_DATA_FILE" "${CONTAINER_NAME}:/tmp/resume-data.json"

    # 초기화 스크립트 실행
    log_info "데이터 초기화 실행 중..."

    if [ "$clear_flag" == "--clear" ]; then
        docker exec "$CONTAINER_NAME" node -e "
const mongoose = require('mongoose');
const fs = require('fs');

async function init() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB 연결됨');

    // 스키마 정의
    const userSchema = new mongoose.Schema({
        email: String,
        password: String
    });
    const resumeSchema = new mongoose.Schema({
        userId: mongoose.Types.ObjectId,
        profile: Object,
        skills: Array,
        experience: Array,
        education: Array,
        certifications: Array,
        personalProjects: Array
    });

    const User = mongoose.models.User || mongoose.model('User', userSchema);
    const Resume = mongoose.models.Resume || mongoose.model('Resume', resumeSchema);

    // 기존 데이터 삭제
    await User.deleteMany({});
    await Resume.deleteMany({});
    console.log('기존 데이터 삭제됨');

    // 시드 데이터 로드
    const data = JSON.parse(fs.readFileSync('/tmp/resume-data.json', 'utf8'));

    // bcrypt로 비밀번호 해싱
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(data.user.password, 10);

    // 사용자 생성
    const user = await User.create({
        email: data.user.email,
        password: hashedPassword
    });
    console.log('사용자 생성됨:', user.email);

    // 이력서 생성
    const resume = await Resume.create({
        userId: user._id,
        ...data.resume
    });
    console.log('이력서 생성됨');

    await mongoose.disconnect();
    console.log('완료!');
}

init().catch(err => {
    console.error('오류:', err);
    process.exit(1);
});
"
    else
        docker exec "$CONTAINER_NAME" npm run seed -- --clear
    fi

    # 임시 파일 삭제
    docker exec "$CONTAINER_NAME" rm -f /tmp/resume-data.json

    echo ""
    log_info "초기화 완료!"
    echo ""
    echo "로그인 정보:"
    echo "  - 이메일: scripts/seed-data/resume-data.json 파일의 user.email"
    echo "  - 비밀번호: scripts/seed-data/resume-data.json 파일의 user.password"
}

# 메인
main() {
    local mode="${1:-init}"

    case "$mode" in
        init|--clear)
            run_init "$mode"
            ;;
        --help|-h)
            echo "사용법: $0 [옵션]"
            echo ""
            echo "옵션:"
            echo "  (없음)     - 시드 데이터로 초기화 (npm run seed --clear 사용)"
            echo "  --clear    - 직접 MongoDB 초기화 (npm run seed 없이)"
            echo "  --help     - 도움말 표시"
            echo ""
            echo "시드 데이터 파일: scripts/seed-data/resume-data.json"
            ;;
        *)
            log_error "알 수 없는 옵션: $mode"
            echo "도움말: $0 --help"
            exit 1
            ;;
    esac
}

main "$@"

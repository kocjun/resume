#!/bin/bash

# Let's Encrypt SSL 인증서 초기 발급 스크립트
# 실제 도메인이 있고, DNS가 설정된 후 실행하세요

# 설정 변수 (실제 값으로 변경 필요)
DOMAINS=(example.com www.example.com)
EMAIL="your-email@example.com"
STAGING=1  # 0: 운영 환경, 1: 테스트 환경 (Rate Limit 없음)

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔐 Let's Encrypt SSL 인증서 발급 시작${NC}"
echo ""

# 환경 변수 파일 확인
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ .env.production 파일이 없습니다.${NC}"
    exit 1
fi

# 도메인 확인
echo -e "${YELLOW}⚠️  다음 도메인에 대한 인증서를 발급합니다:${NC}"
for domain in "${DOMAINS[@]}"; do
    echo "   - $domain"
done
echo ""
echo -e "${YELLOW}⚠️  계속하기 전에 확인사항:${NC}"
echo "   1. 도메인의 DNS A 레코드가 이 서버의 공인 IP를 가리키고 있나요?"
echo "   2. 포트 80과 443이 외부에서 접근 가능한가요?"
echo "   3. Synology NAS 포트 포워딩이 설정되어 있나요?"
echo ""
read -p "계속하시겠습니까? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}취소되었습니다.${NC}"
    exit 1
fi

# 기존 인증서 백업 디렉토리 생성
if [ -d "certbot/conf/live" ]; then
    echo -e "${YELLOW}📦 기존 인증서를 백업합니다...${NC}"
    mkdir -p certbot/backup
    cp -r certbot/conf/live certbot/backup/live-$(date +%Y%m%d-%H%M%S)
fi

# Nginx를 임시 HTTP 전용 모드로 시작
echo -e "${GREEN}🔄 Nginx를 HTTP 모드로 재시작...${NC}"
docker-compose restart nginx

# 잠시 대기 (Nginx 시작 대기)
sleep 5

# Certbot으로 인증서 발급
echo -e "${GREEN}📜 Certbot으로 인증서를 발급합니다...${NC}"

if [ $STAGING -eq 1 ]; then
    STAGING_ARG="--staging"
    echo -e "${YELLOW}⚠️  테스트 모드: Let's Encrypt Staging 환경 사용${NC}"
else
    STAGING_ARG=""
    echo -e "${GREEN}✅ 운영 모드: 실제 인증서 발급${NC}"
fi

# 도메인 파라미터 생성
DOMAIN_ARGS=""
for domain in "${DOMAINS[@]}"; do
    DOMAIN_ARGS="$DOMAIN_ARGS -d $domain"
done

# Certbot 실행
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    $STAGING_ARG \
    $DOMAIN_ARGS

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 인증서 발급 성공!${NC}"

    # Nginx 설정 업데이트 (HTTPS 활성화)
    echo -e "${GREEN}🔄 Nginx HTTPS 설정 활성화...${NC}"

    # 실제 도메인으로 설정 파일 업데이트 필요
    echo -e "${YELLOW}⚠️  다음 단계를 수동으로 진행하세요:${NC}"
    echo "   1. nginx/conf.d/default.conf 파일에서 HTTPS 섹션 주석 해제"
    echo "   2. server_name을 실제 도메인으로 변경"
    echo "   3. ssl_certificate 경로를 /etc/letsencrypt/live/${DOMAINS[0]}/fullchain.pem으로 변경"
    echo "   4. docker-compose restart nginx 실행"

else
    echo -e "${RED}❌ 인증서 발급 실패${NC}"
    echo ""
    echo -e "${YELLOW}문제 해결:${NC}"
    echo "   - DNS 설정 확인 (dig ${DOMAINS[0]} +short)"
    echo "   - 포트 80 접근 확인 (curl http://${DOMAINS[0]}/.well-known/acme-challenge/test)"
    echo "   - docker-compose logs certbot 확인"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 SSL 인증서 설정 완료!${NC}"
echo ""
echo -e "${YELLOW}📌 참고사항:${NC}"
echo "   - 인증서는 90일마다 갱신 필요"
echo "   - 자동 갱신: docker-compose.yml의 certbot 서비스가 12시간마다 확인"
echo "   - 수동 갱신: docker-compose run --rm certbot renew"
echo ""

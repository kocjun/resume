/**
 * JWT 인증 미들웨어
 * Authorization 헤더에서 JWT 토큰을 검증하고 request.user에 사용자 정보 주입
 */
export async function authenticate(request, reply) {
  try {
    // JWT 토큰 검증
    await request.jwtVerify();
    // 성공 시 request.user에 { userId, email, iat, exp } 자동 주입됨
  } catch (err) {
    request.log.error('JWT verification failed:', err.message);

    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token',
    });
  }
}

/**
 * 선택적 JWT 인증 미들웨어
 * 토큰이 있으면 검증하고, 없으면 통과 (공개 엔드포인트에 사용)
 */
export async function optionalAuthenticate(request, reply) {
  try {
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      await request.jwtVerify();
    }
    // 토큰이 없어도 에러 발생시키지 않음
  } catch (err) {
    request.log.warn('Optional JWT verification failed:', err.message);
    // 에러를 무시하고 계속 진행
  }
}

import crypto from 'crypto';
import User from '../models/User.js';

/**
 * 회원가입
 * POST /api/auth/register
 */
export async function register(request, reply) {
  try {
    const { email, password } = request.body;

    // 입력 검증
    if (!email || !password) {
      return reply.code(400).send({
        error: 'Email and password are required',
      });
    }

    // 비밀번호 길이 검증
    if (password.length < 8) {
      return reply.code(400).send({
        error: 'Password must be at least 8 characters long',
      });
    }

    // 중복 이메일 체크
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return reply.code(409).send({
        error: 'Email already exists',
      });
    }

    // 사용자 생성
    const user = new User({ email, password });
    await user.save();

    return reply.code(201).send({
      message: 'User created successfully',
      userId: user._id,
    });
  } catch (error) {
    request.log.error(error);

    // Mongoose 검증 에러
    if (error.name === 'ValidationError') {
      return reply.code(400).send({
        error: error.message,
      });
    }

    return reply.code(500).send({
      error: 'Internal server error',
    });
  }
}

/**
 * 로그인
 * POST /api/auth/login
 */
export async function login(request, reply) {
  try {
    const { email, password } = request.body;

    // 입력 검증
    if (!email || !password) {
      return reply.code(400).send({
        error: 'Email and password are required',
      });
    }

    // .env 관리자 로그인 체크
    const envUsername = process.env.ADMIN_EMAIL;
    const envPassword = process.env.ADMIN_PASSWORD;

    const emailMatch = envUsername && email.length === envUsername.length &&
      crypto.timingSafeEqual(Buffer.from(email), Buffer.from(envUsername));
    const passwordMatch = envPassword && password.length === envPassword.length &&
      crypto.timingSafeEqual(Buffer.from(password), Buffer.from(envPassword));

    if (emailMatch && passwordMatch) {
      // DB에서 해당 사용자 정보 조회 (Resume 연결을 위해 _id 필요)
      const user = await User.findOne({ email: email.toLowerCase() });
      const userId = user ? user._id : 'env-admin';

      request.log.info(`Admin login via .env: ${envUsername} (DB User: ${!!user})`);

      const token = request.server.jwt.sign(
        {
          userId,
          email: envUsername,
          isEnvAdmin: true,
        },
        {
          expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        }
      );

      return reply.code(200).send({
        token,
        userId,
        email: envUsername,
      });
    }

    // 사용자 찾기
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return reply.code(401).send({
        error: 'Invalid credentials',
      });
    }

    // 비밀번호 확인
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return reply.code(401).send({
        error: 'Invalid credentials',
      });
    }

    // JWT 토큰 생성
    const token = request.server.jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      }
    );

    return reply.code(200).send({
      token,
      userId: user._id,
      email: user.email,
    });
  } catch (error) {
    request.log.error(error);

    return reply.code(500).send({
      error: 'Internal server error',
    });
  }
}

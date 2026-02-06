/**
 * 글로벌 에러 핸들러
 * Fastify의 모든 에러를 처리
 */

/**
 * Fastify 에러 핸들러 플러그인
 */
export async function errorHandler(app) {
  app.setErrorHandler((error, request, reply) => {
    // 에러 로깅
    request.log.error({
      err: error,
      reqId: request.id,
      url: request.url,
      method: request.method,
    }, 'Request error');

    // Mongoose Validation 에러
    if (error.name === 'ValidationError') {
      return reply.code(400).send({
        error: 'Validation Error',
        message: error.message,
        details: Object.keys(error.errors).map((field) => ({
          field,
          message: error.errors[field].message,
        })),
      });
    }

    // Mongoose CastError (잘못된 ObjectId 등)
    if (error.name === 'CastError') {
      return reply.code(400).send({
        error: 'Invalid ID',
        message: `Invalid ${error.path}: ${error.value}`,
      });
    }

    // Mongoose Duplicate Key 에러
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return reply.code(409).send({
        error: 'Duplicate Entry',
        message: `${field} already exists`,
      });
    }

    // JWT 에러
    if (error.name === 'JsonWebTokenError') {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid authentication token',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication token has expired',
      });
    }

    // Fastify Validation 에러
    if (error.validation) {
      return reply.code(400).send({
        error: 'Validation Error',
        message: 'Request validation failed',
        details: error.validation,
      });
    }

    // 기본 HTTP 에러
    if (error.statusCode) {
      return reply.code(error.statusCode).send({
        error: error.name || 'Error',
        message: error.message,
      });
    }

    // 알 수 없는 에러 (500)
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : error.message,
    });
  });
}

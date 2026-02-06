import { authenticate } from '../middlewares/auth.middleware.js';
import * as resumeController from '../controllers/resume.controller.js';

/**
 * 이력서 관련 라우트
 * Prefix: /api/resume
 * 모든 라우트는 JWT 인증 필요
 */
export default async function resumeRoutes(app, options) {
  // 모든 라우트에 JWT 인증 미들웨어 적용
  app.addHook('onRequest', authenticate);

  // 이력서 조회
  app.get('/', {
    schema: {
      description: 'Get current user resume',
      tags: ['resume'],
      response: {
        404: {
          description: 'Resume not found',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: resumeController.getResume,
  });

  // 이력서 생성
  app.post('/', {
    schema: {
      description: 'Create a new resume',
      tags: ['resume'],
      body: {
        type: 'object',
        required: ['profile'],
        properties: {
          profile: {
            type: 'object',
            required: ['name', 'role', 'email'],
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              email: { type: 'string' },
              phone: { type: 'string' },
              address: { type: 'string' },
              summary: { type: 'string' },
            },
          },
          skills: { type: 'array' },
          experience: { type: 'array' },
          education: { type: 'array' },
          certifications: { type: 'array' },
        },
      },
      response: {
        201: {
          description: 'Resume created',
          type: 'object',
          properties: {
            message: { type: 'string' },
            resumeId: { type: 'string' },
          },
        },
      },
    },
    handler: resumeController.createResume,
  });

  // 프로필 업데이트
  app.put('/profile', {
    schema: {
      description: 'Update profile',
      tags: ['resume'],
    },
    handler: resumeController.updateProfile,
  });

  // 스킬 업데이트
  app.put('/skills', {
    schema: {
      description: 'Update skills',
      tags: ['resume'],
    },
    handler: resumeController.updateSkills,
  });

  // 경력 추가
  app.post('/experience', {
    schema: {
      description: 'Add experience',
      tags: ['resume'],
    },
    handler: resumeController.addExperience,
  });

  // 경력 수정
  app.put('/experience/:id', {
    schema: {
      description: 'Update experience',
      tags: ['resume'],
    },
    handler: resumeController.updateExperience,
  });

  // 경력 삭제
  app.delete('/experience/:id', {
    schema: {
      description: 'Delete experience',
      tags: ['resume'],
    },
    handler: resumeController.deleteExperience,
  });

  // 학력 업데이트
  app.put('/education', {
    schema: {
      description: 'Update education',
      tags: ['resume'],
    },
    handler: resumeController.updateEducation,
  });

  // 자격증 업데이트
  app.put('/certifications', {
    schema: {
      description: 'Update certifications',
      tags: ['resume'],
    },
    handler: resumeController.updateCertifications,
  });
}

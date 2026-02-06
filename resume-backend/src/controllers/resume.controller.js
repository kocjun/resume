import Resume from '../models/Resume.js';
import User from '../models/User.js';

/**
 * env-admin 사용자의 실제 userId를 조회하는 헬퍼 함수
 * @returns {Promise<{userId: any, fallback: boolean}>}
 */
async function resolveUserId(request) {
  let userId = request.user.userId;

  if (userId === 'env-admin' && request.user.email) {
    const user = await User.findOne({ email: request.user.email.toLowerCase() });
    if (user) {
      return { userId: user._id, fallback: false };
    }
    return { userId: null, fallback: true };
  }

  return { userId, fallback: false };
}

/**
 * 현재 사용자의 이력서 조회
 * GET /api/resume
 */
export async function getResume(request, reply) {
  try {
    const { userId, fallback } = await resolveUserId(request);
    let resume;

    // env-admin인데 DB에 사용자가 없으면 첫 번째 이력서 반환
    if (fallback) {
      resume = await Resume.findOne().lean();
    }

    // lean()으로 plain JavaScript 객체 반환
    if (!resume) {
      resume = await Resume.findOne({ userId }).lean();
    }

    if (!resume) {
      return reply.code(404).send({
        error: 'Resume not found',
        message: 'Please create your resume first',
      });
    }

    // _id를 id로 변환
    resume.id = resume._id.toString();
    delete resume._id;
    delete resume.__v;

    return reply.code(200).send(resume);
  } catch (error) {
    request.log.error(error);

    return reply.code(500).send({
      error: 'Internal server error',
    });
  }
}

/**
 * 이력서 생성
 * POST /api/resume
 */
export async function createResume(request, reply) {
  try {
    const { userId } = await resolveUserId(request);
    const { profile, skills, experience, education, certifications } = request.body;

    // 입력 검증
    if (!profile || !profile.name || !profile.role || !profile.email) {
      return reply.code(400).send({
        error: 'Profile information is required (name, role, email)',
      });
    }

    // 이미 이력서가 있는지 확인
    const existingResume = await Resume.findOne({ userId });
    if (existingResume) {
      return reply.code(409).send({
        error: 'Resume already exists',
        message: 'Use PUT to update your existing resume',
      });
    }

    // 이력서 생성
    const resume = new Resume({
      userId,
      profile,
      skills: skills || [],
      experience: experience || [],
      education: education || [],
      certifications: certifications || [],
    });

    await resume.save();

    return reply.code(201).send({
      message: 'Resume created successfully',
      resumeId: resume._id,
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
 * 프로필 업데이트
 * PUT /api/resume/profile
 */
export async function updateProfile(request, reply) {
  try {
    const { userId } = await resolveUserId(request);
    const profile = request.body;

    const resume = await Resume.findOneAndUpdate(
      { userId },
      { $set: { profile } },
      { new: true, runValidators: true }
    );

    if (!resume) {
      return reply.code(404).send({
        error: 'Resume not found',
      });
    }

    return reply.code(200).send(resume);
  } catch (error) {
    request.log.error(error);

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
 * 스킬 업데이트
 * PUT /api/resume/skills
 */
export async function updateSkills(request, reply) {
  try {
    const { userId } = await resolveUserId(request);
    const skills = request.body;

    const resume = await Resume.findOneAndUpdate(
      { userId },
      { $set: { skills } },
      { new: true, runValidators: true }
    );

    if (!resume) {
      return reply.code(404).send({
        error: 'Resume not found',
      });
    }

    return reply.code(200).send(resume);
  } catch (error) {
    request.log.error(error);

    return reply.code(500).send({
      error: 'Internal server error',
    });
  }
}

/**
 * 경력 추가
 * POST /api/resume/experience
 */
export async function addExperience(request, reply) {
  try {
    const { userId } = await resolveUserId(request);
    const experience = request.body;

    const resume = await Resume.findOne({ userId });

    if (!resume) {
      return reply.code(404).send({
        error: 'Resume not found',
      });
    }

    resume.experience.push(experience);
    await resume.save();

    return reply.code(201).send(resume);
  } catch (error) {
    request.log.error(error);

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
 * 경력 수정
 * PUT /api/resume/experience/:id
 */
export async function updateExperience(request, reply) {
  try {
    const { userId } = await resolveUserId(request);
    const experienceId = request.params.id;
    const updates = request.body;

    const resume = await Resume.findOne({ userId });

    if (!resume) {
      return reply.code(404).send({
        error: 'Resume not found',
      });
    }

    const experienceIndex = resume.experience.findIndex(
      (exp) => exp._id.toString() === experienceId
    );

    if (experienceIndex === -1) {
      return reply.code(404).send({
        error: 'Experience not found',
      });
    }

    // 경력 항목 업데이트
    Object.assign(resume.experience[experienceIndex], updates);
    await resume.save();

    return reply.code(200).send(resume);
  } catch (error) {
    request.log.error(error);

    return reply.code(500).send({
      error: 'Internal server error',
    });
  }
}

/**
 * 경력 삭제
 * DELETE /api/resume/experience/:id
 */
export async function deleteExperience(request, reply) {
  try {
    const { userId } = await resolveUserId(request);
    const experienceId = request.params.id;

    const resume = await Resume.findOneAndUpdate(
      { userId },
      { $pull: { experience: { _id: experienceId } } },
      { new: true }
    );

    if (!resume) {
      return reply.code(404).send({
        error: 'Resume not found',
      });
    }

    return reply.code(200).send({
      message: 'Experience deleted successfully',
      resume,
    });
  } catch (error) {
    request.log.error(error);

    return reply.code(500).send({
      error: 'Internal server error',
    });
  }
}

/**
 * 학력 업데이트
 * PUT /api/resume/education
 */
export async function updateEducation(request, reply) {
  try {
    const { userId } = await resolveUserId(request);
    const education = request.body;

    const resume = await Resume.findOneAndUpdate(
      { userId },
      { $set: { education } },
      { new: true, runValidators: true }
    );

    if (!resume) {
      return reply.code(404).send({
        error: 'Resume not found',
      });
    }

    return reply.code(200).send(resume);
  } catch (error) {
    request.log.error(error);

    return reply.code(500).send({
      error: 'Internal server error',
    });
  }
}

/**
 * 자격증 업데이트
 * PUT /api/resume/certifications
 */
export async function updateCertifications(request, reply) {
  try {
    const { userId } = await resolveUserId(request);
    const certifications = request.body;

    const resume = await Resume.findOneAndUpdate(
      { userId },
      { $set: { certifications } },
      { new: true, runValidators: true }
    );

    if (!resume) {
      return reply.code(404).send({
        error: 'Resume not found',
      });
    }

    return reply.code(200).send(resume);
  } catch (error) {
    request.log.error(error);

    return reply.code(500).send({
      error: 'Internal server error',
    });
  }
}

/**
 * API 클라이언트 모듈
 * 백엔드 API와 통신하는 함수들
 */

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

/**
 * 로컬 스토리지에서 JWT 토큰 가져오기
 */
function getToken() {
  return localStorage.getItem('token');
}

/**
 * 로컬 스토리지에 JWT 토큰 저장
 */
function setToken(token) {
  localStorage.setItem('token', token);
}

/**
 * 로컬 스토리지에서 JWT 토큰 제거
 */
function removeToken() {
  localStorage.removeItem('token');
}

/**
 * 공통 fetch 래퍼 함수
 */
async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || 'API request failed');
  }

  return response.json();
}

/**
 * 인증 API
 */
export const authApi = {
  /**
   * 회원가입
   */
  register: async (email, password) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  /**
   * 로그인
   */
  login: async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // 토큰 저장
    if (data.token) {
      setToken(data.token);
    }

    return data;
  },

  /**
   * 로그아웃
   */
  logout: () => {
    removeToken();
  },

  /**
   * 현재 로그인 상태 확인
   */
  isAuthenticated: () => {
    return !!getToken();
  },
};

/**
 * 이력서 API
 */
export const resumeApi = {
  /**
   * 이력서 조회
   */
  get: () => apiRequest('/resume'),

  /**
   * 이력서 생성
   */
  create: (resumeData) =>
    apiRequest('/resume', {
      method: 'POST',
      body: JSON.stringify(resumeData),
    }),

  /**
   * 프로필 업데이트
   */
  updateProfile: (profile) =>
    apiRequest('/resume/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    }),

  /**
   * 스킬 업데이트
   */
  updateSkills: (skills) =>
    apiRequest('/resume/skills', {
      method: 'PUT',
      body: JSON.stringify(skills),
    }),

  /**
   * 경력 추가
   */
  addExperience: (experience) =>
    apiRequest('/resume/experience', {
      method: 'POST',
      body: JSON.stringify(experience),
    }),

  /**
   * 경력 수정
   */
  updateExperience: (id, experience) =>
    apiRequest(`/resume/experience/${id}`, {
      method: 'PUT',
      body: JSON.stringify(experience),
    }),

  /**
   * 경력 삭제
   */
  deleteExperience: (id) =>
    apiRequest(`/resume/experience/${id}`, {
      method: 'DELETE',
    }),

  /**
   * 학력 업데이트
   */
  updateEducation: (education) =>
    apiRequest('/resume/education', {
      method: 'PUT',
      body: JSON.stringify(education),
    }),

  /**
   * 자격증 업데이트
   */
  updateCertifications: (certifications) =>
    apiRequest('/resume/certifications', {
      method: 'PUT',
      body: JSON.stringify(certifications),
    }),
};

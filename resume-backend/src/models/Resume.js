import mongoose from 'mongoose';

/**
 * 다국어(한/영) 문자열 또는 plain String을 모두 수용하는 Mixed 타입 정의
 * 예: "홍길동" 또는 { ko: "홍길동", en: "Hong Gil-dong" }
 */
const LocalizedString = { type: mongoose.Schema.Types.Mixed };
const LocalizedStringRequired = { type: mongoose.Schema.Types.Mixed, required: true };

/**
 * 프로필 스키마
 */
const profileSchema = new mongoose.Schema(
  {
    name: LocalizedStringRequired,
    role: LocalizedStringRequired,
    email: { type: String, required: true },
    phone: String,
    address: LocalizedString,
    summary: LocalizedString,
  },
  { _id: false }
);

/**
 * 스킬 카테고리 스키마
 */
const skillCategorySchema = new mongoose.Schema(
  {
    category: LocalizedStringRequired,
    items: [String],
  },
  { _id: false }
);

/**
 * 경력 스키마
 */
const experienceSchema = new mongoose.Schema({
  company: LocalizedStringRequired,
  period: { type: String, required: true },
  position: LocalizedString,
  project: LocalizedStringRequired,
  description: LocalizedString,
  techStack: [String],
});

/**
 * 학력 스키마
 */
const educationSchema = new mongoose.Schema(
  {
    school: LocalizedStringRequired,
    major: LocalizedString,
    period: String,
  },
  { _id: false }
);

/**
 * 자격증 스키마
 */
const certificationSchema = new mongoose.Schema(
  {
    name: LocalizedStringRequired,
    date: String,
  },
  { _id: false }
);

/**
 * Resume 메인 스키마
 */
const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // 1 User = 1 Resume
    },
    profile: {
      type: profileSchema,
      required: true,
    },
    skills: {
      type: [skillCategorySchema],
      default: [],
    },
    experience: {
      type: [experienceSchema],
      default: [],
    },
    education: {
      type: [educationSchema],
      default: [],
    },
    certifications: {
      type: [certificationSchema],
      default: [],
    },
  },
  {
    timestamps: true, // createdAt, updatedAt 자동 생성
  }
);

/**
 * 인덱스 설정 (성능 최적화)
 */
resumeSchema.index({ userId: 1 });

/**
 * JSON 응답 설정
 */
resumeSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Resume = mongoose.model('Resume', resumeSchema);

export default Resume;

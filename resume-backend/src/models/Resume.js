import mongoose from 'mongoose';

/**
 * 프로필 스키마
 */
const profileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    address: String,
    summary: String,
  },
  { _id: false }
);

/**
 * 스킬 카테고리 스키마
 */
const skillCategorySchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    items: [String],
  },
  { _id: false }
);

/**
 * 경력 스키마
 */
const experienceSchema = new mongoose.Schema({
  company: { type: String, required: true },
  period: { type: String, required: true },
  position: String,
  project: { type: String, required: true },
  description: String,
  techStack: [String],
});

/**
 * 학력 스키마
 */
const educationSchema = new mongoose.Schema(
  {
    school: { type: String, required: true },
    major: String,
    period: String,
  },
  { _id: false }
);

/**
 * 자격증 스키마
 */
const certificationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
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

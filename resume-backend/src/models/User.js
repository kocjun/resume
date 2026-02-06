import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
    },
  },
  {
    timestamps: true, // createdAt, updatedAt 자동 생성
  }
);

/**
 * 비밀번호 해싱 (저장 전 자동 실행)
 * pre('save') 미들웨어: 문서가 저장되기 전에 실행
 */
userSchema.pre('save', async function (next) {
  // 비밀번호가 수정되지 않았으면 해싱하지 않음
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * 비밀번호 검증 메서드
 * @param {string} candidatePassword - 검증할 비밀번호 (평문)
 * @returns {Promise<boolean>} - 일치 여부
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

/**
 * JSON 응답에서 비밀번호 제외
 */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;

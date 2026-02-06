import mongoose from 'mongoose';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

/**
 * MongoDB 연결
 */
export async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/resume-db';

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // 5초 타임아웃
    });

    console.log('✅ MongoDB connected successfully');
    console.log(`📍 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
}

/**
 * MongoDB 연결 해제
 */
export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected successfully');
  } catch (error) {
    console.error('❌ MongoDB disconnect error:', error.message);
    throw error;
  }
}

/**
 * MongoDB 연결 이벤트 리스너 등록
 */
export function setupDatabaseEventListeners() {
  mongoose.connection.on('connected', () => {
    console.log('🔗 Mongoose connected to MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('🔌 Mongoose disconnected from MongoDB');
  });

  // 프로세스 종료 시 연결 해제
  process.on('SIGINT', async () => {
    await disconnectDB();
    process.exit(0);
  });
}

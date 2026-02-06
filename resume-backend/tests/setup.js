import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

// 모든 테스트 전에 실행
export async function setupTestDB() {
  // MongoDB Memory Server 시작
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // 환경 변수 설정
  process.env.MONGODB_URI = mongoUri;
  process.env.NODE_ENV = 'test';
}

// 모든 테스트 후에 실행
export async function teardownTestDB() {
  if (mongoServer) {
    await mongoServer.stop();
  }
}

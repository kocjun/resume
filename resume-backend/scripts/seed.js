import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Resume from '../src/models/Resume.js';

// ES 모듈에서 __dirname 사용하기
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경 변수 로드
dotenv.config();

/**
 * 데이터베이스 시딩
 * data.json을 읽어서 MongoDB에 저장
 */
async function seed() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // MongoDB 연결
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/resume-db';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // 기존 데이터 삭제 (선택사항)
    const clearData = process.argv.includes('--clear');
    if (clearData) {
      console.log('\n🗑️  Clearing existing data...');
      await User.deleteMany({});
      await Resume.deleteMany({});
      console.log('✅ Existing data cleared');
    }

    // 시드 데이터 파일 경로 결정
    // 1순위: /tmp/resume-data.json (init-resume.sh에서 복사)
    // 2순위: 환경변수 SEED_DATA_FILE
    // 3순위: 기본 data.json
    const tmpSeedPath = '/tmp/resume-data.json';
    const envSeedPath = process.env.SEED_DATA_FILE;
    const defaultDataPath = path.join(__dirname, '../../resume-web/src/data.json');

    let seedDataPath;
    let useSeedFile = false;

    try {
      await fs.access(tmpSeedPath);
      seedDataPath = tmpSeedPath;
      useSeedFile = true;
      console.log('\n📖 Using seed data file: /tmp/resume-data.json');
    } catch {
      if (envSeedPath) {
        seedDataPath = envSeedPath;
        useSeedFile = true;
        console.log(`\n📖 Using seed data file: ${envSeedPath}`);
      } else {
        seedDataPath = defaultDataPath;
        console.log(`\n📖 Using default data file: ${defaultDataPath}`);
      }
    }

    const dataJson = await fs.readFile(seedDataPath, 'utf-8');
    const seedData = JSON.parse(dataJson);

    // 시드 파일 형식에 따라 데이터 추출
    let resumeData, testEmail, testPassword;

    if (useSeedFile && seedData.user && seedData.resume) {
      // 새 시드 파일 형식 (user + resume)
      resumeData = seedData.resume;
      testEmail = seedData.user.email;
      testPassword = seedData.user.password;
      console.log('✅ Loaded from seed data file (new format)');
    } else {
      // 기존 data.json 형식
      resumeData = seedData;
      testEmail = process.env.SEED_USER_EMAIL || 'admin@example.com';
      testPassword = process.env.SEED_USER_PASSWORD || 'changeme123';
      console.log('✅ Loaded from data.json (legacy format)');
    }

    console.log(`\n👤 Creating user: ${testEmail}`);

    // 기존 사용자 확인
    let user = await User.findOne({ email: testEmail });

    if (user) {
      console.log('⚠️  User already exists, using existing user');
    } else {
      user = await User.create({
        email: testEmail,
        password: testPassword,
      });
      console.log('✅ User created successfully');
    }

    // Resume 생성 또는 업데이트
    console.log('\n📝 Creating/updating resume...');

    const existingResume = await Resume.findOne({ userId: user._id });

    if (existingResume) {
      console.log('⚠️  Resume already exists, updating...');
      Object.assign(existingResume, resumeData);
      await existingResume.save();
      console.log('✅ Resume updated successfully');
    } else {
      const resume = await Resume.create({
        userId: user._id,
        ...resumeData,
      });
      console.log('✅ Resume created successfully');
      console.log(`   Resume ID: ${resume._id}`);
    }

    // 결과 요약
    console.log('\n📊 Seeding Summary:');
    console.log(`   User ID: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Experience entries: ${resumeData.experience.length}`);
    console.log(`   Skills categories: ${resumeData.skills.length}`);
    console.log(`   Education entries: ${resumeData.education.length}`);
    console.log(`   Certifications: ${resumeData.certifications.length}`);

    console.log('\n🎉 Database seeding completed successfully!\n');

    // 사용자 안내
    console.log('📌 Login credentials:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log('\n💡 You can now login and access your resume data.\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// 스크립트 실행
seed();

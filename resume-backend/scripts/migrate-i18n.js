/**
 * i18n 마이그레이션 스크립트
 * 기존 String 필드를 { ko: value, en: '' } 형태로 변환
 *
 * Usage: node scripts/migrate-i18n.js
 * Env: MONGODB_URI (required)
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const LOCALIZED_FIELDS = {
  profile: ['name', 'role', 'summary', 'address'],
  experience: ['company', 'position', 'project', 'description'],
  education: ['school', 'major'],
  certifications: ['name'],
  skills: ['category'],
};

function migrateField(value) {
  if (!value) return value;
  if (typeof value === 'string') return { ko: value, en: '' };
  return value; // already migrated
}

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is required');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const collection = db.collection('resumes');
  const resumes = await collection.find({}).toArray();
  console.log(`Found ${resumes.length} resumes to migrate`);

  let migratedCount = 0;

  for (const resume of resumes) {
    const update = {};

    // Profile fields
    for (const field of LOCALIZED_FIELDS.profile) {
      if (resume.profile?.[field] && typeof resume.profile[field] === 'string') {
        update[`profile.${field}`] = migrateField(resume.profile[field]);
      }
    }

    // Array fields
    for (const arrayName of ['experience', 'education', 'certifications', 'skills']) {
      const arr = resume[arrayName] || [];
      arr.forEach((item, i) => {
        for (const field of LOCALIZED_FIELDS[arrayName]) {
          if (item[field] && typeof item[field] === 'string') {
            update[`${arrayName}.${i}.${field}`] = migrateField(item[field]);
          }
        }
      });
    }

    if (Object.keys(update).length > 0) {
      await collection.updateOne({ _id: resume._id }, { $set: update });
      console.log(`Migrated resume ${resume._id} (${Object.keys(update).length} fields)`);
      migratedCount++;
    }
  }

  console.log(`Migration complete. ${migratedCount}/${resumes.length} resumes updated.`);
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

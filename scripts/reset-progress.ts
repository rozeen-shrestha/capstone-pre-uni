import mongoose from 'mongoose';
import { Enrollment, Attempt } from '../src/lib/models';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.DATABASE_URL!;

async function main() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI);

  console.log('Resetting all user progress and enrollments...');
  await Attempt.deleteMany({});
  
  await Enrollment.deleteMany({});

  console.log('Progress and enrollments reset successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

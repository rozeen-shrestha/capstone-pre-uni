import mongoose from 'mongoose';
import { User, Course, Module, Lesson, Objective, Attempt } from '../src/lib/models';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.DATABASE_URL!;

async function main() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI);

  console.log('Clearing old data...');
  await Attempt.deleteMany({});
  await Objective.deleteMany({});
  await Lesson.deleteMany({});
  await Module.deleteMany({});
  await Course.deleteMany({});
  await User.deleteMany({});

  console.log('Seeding database...');

  // Create Instructor
  const instructor = await User.create({
    email: 'instructor@example.com',
    role: 'INSTRUCTOR',
  });

  // Create Student
  await User.create({
    email: 'student@example.com',
    role: 'STUDENT',
  });

  // Create Course
  const course = await Course.create({
    title: 'Introduction to Artificial Intelligence',
    description: 'Learn the basics of AI, machine learning, and neural networks.',
    instructorId: instructor._id,
  });

  const courseModule = await Module.create({
    title: 'Module 1: Foundations',
    order: 1,
    courseId: course._id
  });

  const lesson = await Lesson.create({
    title: 'What is AI?',
    type: 'TEXT',
    content: 'Artificial Intelligence is the simulation of human intelligence by software-coded heuristics.',
    order: 1,
    moduleId: courseModule._id
  });

  await Objective.create({
    description: 'Explain the difference between narrow AI and general AI.',
    rubricCriteria: [
      'Identifies narrow AI as specialized for a single task.',
      'Identifies general AI as having human-like cognitive flexibility.',
      'Provides an example of narrow AI (e.g., Siri, chess bot).'
    ],
    maxTurns: 3,
    lessonId: lesson._id
  });

  console.log('Seed completed successfully. Course ID:', course._id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

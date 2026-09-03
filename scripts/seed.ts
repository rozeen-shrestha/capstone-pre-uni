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

  console.log('Seeding HTML Course...');

  // Create Instructor & Student
  const instructor = await User.create({ email: 'instructor@example.com', role: 'INSTRUCTOR' });
  await User.create({ email: 'student@example.com', role: 'STUDENT' });

  // Create Course
  const course = await Course.create({
    title: 'HTML Basics (W3Schools Style)',
    description: 'Learn to build web pages using HTML. Simple, easy, and assessed by AI.',
    instructorId: instructor._id,
  });

  // Module 1
  const mod1 = await Module.create({ title: 'Course Introduction & HTML Basics', order: 1, courseId: course._id });
  
  await Lesson.create({
    title: 'Introduction to the course', type: 'VIDEO',
    content: 'Welcome to the HTML course. You will learn tags, elements, and attributes.',
    duration: '2 min', order: 1, moduleId: mod1._id
  });

  await Lesson.create({
    title: 'HTML Elements', type: 'READING',
    content: 'An HTML element usually consists of a start tag and an end tag, with the content inserted in between: <tagname>Content goes here...</tagname>',
    duration: '5 min', order: 2, moduleId: mod1._id
  });

  const m1Assessment = await Lesson.create({
    title: 'Module 1 Viva: HTML Basics', type: 'ASSESSMENT',
    content: 'You will now talk to the AI agent to prove you understand HTML tags.',
    duration: '10 min', order: 3, moduleId: mod1._id
  });

  await Objective.create({
    description: 'Explain what an HTML element is and give a simple example.',
    rubricCriteria: [
      'Mentions that an HTML element has a start tag and end tag.',
      'Provides a valid example (e.g. <h1>Hello</h1> or <p>text</p>)'
    ],
    maxTurns: 3,
    lessonId: m1Assessment._id
  });

  // Module 2
  const mod2 = await Module.create({ title: 'HTML Formatting', order: 2, courseId: course._id });

  await Lesson.create({
    title: 'Text Formatting', type: 'READING',
    content: 'HTML contains several elements for defining text with a special meaning, such as <b> for bold and <i> for italic.',
    duration: '10 min', order: 1, moduleId: mod2._id
  });

  const m2Assessment = await Lesson.create({
    title: 'Module 2 Viva: Formatting', type: 'ASSESSMENT',
    content: 'Viva exam for HTML formatting.',
    duration: '10 min', order: 2, moduleId: mod2._id
  });

  await Objective.create({
    description: 'Explain how to make text bold or italic in HTML.',
    rubricCriteria: [
      'Mentions the <b> or <strong> tag for bold.',
      'Mentions the <i> or <em> tag for italic.'
    ],
    maxTurns: 3,
    lessonId: m2Assessment._id
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

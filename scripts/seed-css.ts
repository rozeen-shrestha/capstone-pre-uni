import mongoose from 'mongoose';
import { User, Course, Module, Lesson, Objective, Attempt } from '../src/lib/models';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.DATABASE_URL!;

async function main() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI);

  console.log('Seeding CSS Course...');

  // Get or Create Instructor
  let instructor = await User.findOne({ email: 'instructor@example.com' });
  if (!instructor) {
    instructor = await User.create({ email: 'instructor@example.com', role: 'INSTRUCTOR' });
  }

  // Create CSS Course
  const course = await Course.create({
    title: 'CSS Fundamentals',
    description: 'Master the art of web styling. Learn selectors, colors, typography, and responsive layouts.',
    instructorId: instructor._id,
  });

  // Module 1: Introduction to CSS
  const mod1 = await Module.create({ title: 'Introduction to CSS', order: 1, courseId: course._id });
  
  await Lesson.create({
    title: 'What is CSS?', type: 'READING',
    content: 'CSS (Cascading Style Sheets) is the language we use to style an HTML document. It describes how HTML elements should be displayed.',
    duration: '5 min', order: 1, moduleId: mod1._id
  });

  await Lesson.create({
    title: 'CSS Selectors and Colors', type: 'READING',
    content: 'CSS selectors are used to "find" (or select) the HTML elements you want to style. You can use element names (e.g. p), classes (e.g. .my-class), and IDs (e.g. #my-id). You can also apply colors using property names like "color" (for text) and "background-color".',
    duration: '10 min', order: 2, moduleId: mod1._id
  });

  const m1Assessment = await Lesson.create({
    title: 'Module 1 Viva: Selectors', type: 'ASSESSMENT',
    content: 'Prove your understanding of basic CSS selectors and colors.',
    duration: '10 min', order: 3, moduleId: mod1._id
  });

  await Objective.create({
    description: 'Explain the difference between a class selector and an ID selector in CSS.',
    rubricCriteria: [
      'Mentions that a class selector is prefixed with a dot (.) and can be used on multiple elements.',
      'Mentions that an ID selector is prefixed with a hash (#) and should be unique to one element on a page.'
    ],
    maxTurns: 3,
    lessonId: m1Assessment._id
  });

  // Module 2: The Box Model
  const mod2 = await Module.create({ title: 'The Box Model', order: 2, courseId: course._id });

  await Lesson.create({
    title: 'Understanding the Box Model', type: 'READING',
    content: 'All HTML elements can be considered as boxes. In CSS, the term "box model" is used when talking about design and layout. The CSS box model consists of: margins, borders, padding, and the actual content.',
    duration: '15 min', order: 1, moduleId: mod2._id
  });

  const m2Assessment = await Lesson.create({
    title: 'Module 2 Viva: Box Model', type: 'ASSESSMENT',
    content: 'Viva exam for the CSS Box Model.',
    duration: '10 min', order: 2, moduleId: mod2._id
  });

  await Objective.create({
    description: 'List and explain the 4 components of the CSS Box Model (Content, Padding, Border, Margin).',
    rubricCriteria: [
      'Identifies the 4 components: Content, Padding, Border, Margin.',
      'Explains that Padding is inside the border, and Margin is outside the border.'
    ],
    maxTurns: 4,
    lessonId: m2Assessment._id
  });

  console.log('CSS Course Seed completed successfully. Course ID:', course._id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

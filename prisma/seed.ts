import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Instead of nested writes which require MongoDB replica sets,
  // we do flat sequential writes.
  
  // Clean up safely (ignoring transaction requirement)
  try { await prisma.attempt.deleteMany() } catch(e) {}
  try { await prisma.objective.deleteMany() } catch(e) {}
  try { await prisma.lesson.deleteMany() } catch(e) {}
  try { await prisma.module.deleteMany() } catch(e) {}
  try { await prisma.course.deleteMany() } catch(e) {}
  try { await prisma.user.deleteMany() } catch(e) {}

  // Create an Instructor
  const instructor = await prisma.user.create({
    data: {
      email: 'instructor@example.com',
      role: 'INSTRUCTOR',
    },
  })

  // Create a Student
  await prisma.user.create({
    data: {
      email: 'student@example.com',
      role: 'STUDENT',
    },
  })

  // Create a Course
  const course = await prisma.course.create({
    data: {
      title: 'Introduction to Artificial Intelligence',
      description: 'Learn the basics of AI, machine learning, and neural networks.',
      instructorId: instructor.id,
    }
  })

  const courseModule = await prisma.module.create({
    data: {
      title: 'Module 1: Foundations',
      order: 1,
      courseId: course.id
    }
  })

  const lesson = await prisma.lesson.create({
    data: {
      title: 'What is AI?',
      type: 'TEXT',
      content: 'Artificial Intelligence is the simulation of human intelligence by software-coded heuristics.',
      order: 1,
      moduleId: courseModule.id
    }
  })

  await prisma.objective.create({
    data: {
      description: 'Explain the difference between narrow AI and general AI.',
      rubricCriteria: [
        'Identifies narrow AI as specialized for a single task.',
        'Identifies general AI as having human-like cognitive flexibility.',
        'Provides an example of narrow AI (e.g., Siri, chess bot).'
      ],
      maxTurns: 3,
      lessonId: lesson.id
    }
  })

  console.log('Seed completed successfully. Course ID:', course.id)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

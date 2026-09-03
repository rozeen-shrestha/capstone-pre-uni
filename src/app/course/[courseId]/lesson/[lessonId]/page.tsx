import prisma from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function LessonViewer({ params }: { params: { courseId: string, lessonId: string } }) {
  const { courseId, lessonId } = await params

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: true,
      objectives: true,
    }
  })

  if (!lesson || lesson.moduleId !== lesson.module.id) {
    notFound()
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <header className="bg-gray-900 text-white p-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <Link href={`/course/${courseId}`} className="text-gray-300 hover:text-white mr-4">
            &larr; Back to Course
          </Link>
          <span className="font-semibold">{lesson.module.title}</span>
        </div>
        <div className="font-medium text-sm">
          Lesson {lesson.order}: {lesson.title}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-grow max-w-4xl mx-auto w-full p-8">
        <article className="prose lg:prose-xl max-w-none mb-16">
          <h1 className="text-3xl font-bold mb-6">{lesson.title}</h1>
          
          {lesson.type === 'VIDEO' ? (
            <div className="aspect-w-16 aspect-h-9 bg-gray-200 flex items-center justify-center rounded-lg mb-8">
              <span className="text-gray-500">Video Player Placeholder: {lesson.content}</span>
            </div>
          ) : (
            <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {lesson.content}
            </div>
          )}
        </article>

        {/* Assessment Section placeholder */}
        <section className="border-t pt-12 mt-12">
          <h2 className="text-2xl font-bold mb-4">Check Your Understanding</h2>
          {lesson.objectives.length > 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-blue-900 mb-4">
                <strong>Learning Objective:</strong> {lesson.objectives[0].description}
              </p>
              <div className="text-gray-500 italic">
                (AI Conversational Assessment component will go here in Phase 3)
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">No assessment available for this lesson.</p>
          )}
        </section>
      </div>
    </main>
  )
}

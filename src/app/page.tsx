import prisma from '@/lib/prisma'
import Link from 'next/link'

export default async function CourseCatalog() {
  const courses = await prisma.course.findMany({
    include: {
      instructor: true,
      modules: true,
    }
  })

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Course Catalog</h1>
        <p className="text-lg text-gray-600">
          Browse AI-assessed courses and improve your understanding through conversational learning.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Link 
            key={course.id} 
            href={`/course/${course.id}`}
            className="block border rounded-lg p-6 hover:shadow-lg transition-shadow bg-white"
          >
            <h2 className="text-2xl font-semibold mb-2">{course.title}</h2>
            <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>
            <div className="text-sm text-gray-500 flex justify-between items-center">
              <span>Instructor: {course.instructor?.email?.split('@')[0]}</span>
              <span>{course.modules.length} Modules</span>
            </div>
          </Link>
        ))}
        {courses.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No courses available yet.
          </div>
        )}
      </div>
    </main>
  )
}

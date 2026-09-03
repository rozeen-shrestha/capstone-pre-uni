import connectToDatabase from '@/lib/mongoose'
import { Course, Module, Lesson, User } from '@/lib/models'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function CourseDetail({ params }: { params: { courseId: string } }) {
  const { courseId } = await params
  await connectToDatabase()

  const course = await Course.findById(courseId).populate('instructorId').lean() as any
  if (!course) notFound()

  const modules = await Module.find({ courseId: course._id }).sort({ order: 1 }).lean() as any[]
  
  for (const mod of modules) {
    mod.lessons = await Lesson.find({ moduleId: mod._id }).sort({ order: 1 }).lean()
  }

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Back to Catalog</Link>
        <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
        <p className="text-lg text-gray-700 mb-6">{course.description}</p>
        <div className="bg-gray-100 p-4 rounded-md">
          <strong>Instructor:</strong> {course.instructorId?.email?.split('@')[0]}
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-6">Course Content</h2>
      
      <div className="space-y-6">
        {modules.map((mod) => (
          <div key={mod._id.toString()} className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h3 className="text-lg font-medium">{mod.title}</h3>
            </div>
            <ul className="divide-y">
              {mod.lessons?.map((lesson: any) => (
                <li key={lesson._id.toString()} className="hover:bg-gray-50 transition-colors">
                  <Link 
                    href={`/course/${course._id.toString()}/lesson/${lesson._id.toString()}`}
                    className="flex justify-between items-center px-6 py-4 block"
                  >
                    <span>
                      {lesson.order}. {lesson.title}
                    </span>
                    <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {lesson.type}
                    </span>
                  </Link>
                </li>
              ))}
              {(!mod.lessons || mod.lessons.length === 0) && (
                <li className="px-6 py-4 text-gray-500 italic">No lessons in this module.</li>
              )}
            </ul>
          </div>
        ))}
        {modules.length === 0 && (
          <p className="text-gray-500 italic">No modules published yet.</p>
        )}
      </div>
    </main>
  )
}

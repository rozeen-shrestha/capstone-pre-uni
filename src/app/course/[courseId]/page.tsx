import connectToDatabase from '@/lib/mongoose'
import { Course, Module, Lesson, Attempt, User } from '@/lib/models'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PlaySquare, BookOpen, MessageCircleQuestion, CheckCircle2 } from 'lucide-react'

export default async function CourseDetail({ params }: { params: { courseId: string } }) {
  const { courseId } = await params
  await connectToDatabase()

  const course = await Course.findById(courseId).populate('instructorId').lean() as any
  if (!course) notFound()

  const modules = await Module.find({ courseId: course._id }).sort({ order: 1 }).lean() as any[]
  
  for (const mod of modules) {
  // Get student's attempts to show checkmarks
  const student = await User.findOne({ role: 'STUDENT' }).lean() as any
  let attempts = []
  let objectives = []
  if (student) {
    attempts = await Attempt.find({ userId: student._id }).lean() as any[]
    objectives = await Objective.find({}).lean() as any[]
  }
  
  // Helper to check if a lesson (assessment) is mastered
  const isMastered = (lessonId: string) => {
    const obj = objectives.find(o => o.lessonId.toString() === lessonId)
    if (!obj) return false
    return attempts.some(a => a.objectiveId.toString() === obj._id.toString() && a.status === 'MASTERED')
  }

  // Helper for icon based on type
  const getIcon = (type: string, isCompleted: boolean) => {
    if (isCompleted) return <CheckCircle2 className="w-5 h-5 text-green-600" />
    switch (type) {
      case 'VIDEO': return <PlaySquare className="w-5 h-5 text-gray-500" />
      case 'READING': return <BookOpen className="w-5 h-5 text-gray-500" />
      case 'ASSESSMENT': return <MessageCircleQuestion className="w-5 h-5 text-blue-500" />
      default: return <BookOpen className="w-5 h-5 text-gray-500" />
    }
  }

  // Get first lesson id for the 'Get started' button
  const firstLessonId = modules[0]?.lessons[0]?._id.toString()

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Back to Catalog</Link>
          <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
          <p className="text-gray-600 max-w-2xl">{course.description}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-8 px-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Course Content</h2>
          <Link href="/instructor" className="text-sm text-gray-500 hover:underline">Instructor View</Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          {modules.map((mod, modIdx) => (
            <div key={mod._id.toString()} className="border-b last:border-0">
              {/* Module Header */}
              <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-lg">{mod.title}</h3>
              </div>
              
              {/* Module Lessons */}
              <div className="px-2 py-2">
                {mod.lessons?.map((lesson: any, idx: number) => {
                  const completed = lesson.type === 'ASSESSMENT' && isMastered(lesson._id.toString())
                  return (
                  <Link 
                    href={`/course/${course._id.toString()}/lesson/${lesson._id.toString()}`}
                    key={lesson._id.toString()}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-md transition-colors group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {getIcon(lesson.type, completed)}
                      </div>
                      <div>
                        <h4 className="text-base font-medium text-gray-900 group-hover:text-blue-600">
                          {lesson.title}
                        </h4>
                        <div className="text-sm text-gray-500 mt-1">
                          {lesson.type === 'VIDEO' ? 'Video' : lesson.type === 'ASSESSMENT' ? 'Viva Assessment' : 'Reading'} • {lesson.duration || '5 min'}
                        </div>
                      </div>
                    </div>
                    {/* Get Started Button for first lesson, or empty for rest */}
                    {(modIdx === 0 && idx === 0) && (
                      <button className="bg-blue-600 text-white px-4 py-2 text-sm font-medium rounded-md hover:bg-blue-700">
                        Get started
                      </button>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

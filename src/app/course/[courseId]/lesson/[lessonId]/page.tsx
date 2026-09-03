import connectToDatabase from '@/lib/mongoose'
import { Lesson, Module, Objective, User } from '@/lib/models'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AssessmentChat from './AssessmentChat'
import { BookOpen, PlaySquare, MessageCircleQuestion } from 'lucide-react'

export default async function LessonViewer({ params }: { params: { courseId: string, lessonId: string } }) {
  const { courseId, lessonId } = await params
  await connectToDatabase()

  const lesson = await Lesson.findById(lessonId).lean() as any
  if (!lesson) notFound()

  const mod = await Module.findById(lesson.moduleId).lean() as any
  const objectives = await Objective.find({ lessonId: lesson._id }).lean() as any[]
  const student = await User.findOne({ role: 'STUDENT' }).lean() as any

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      {/* Top Navbar */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href={`/course/${courseId}`} className="text-gray-500 hover:text-blue-600 font-medium text-sm">
            &larr; Back to Course
          </Link>
          <div className="h-4 w-px bg-gray-300"></div>
          <span className="font-semibold text-gray-800">{mod?.title}</span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-grow w-full max-w-4xl mx-auto p-8">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-12">
          
          <div className="flex items-center gap-3 text-gray-500 mb-4 text-sm font-medium uppercase tracking-wider">
             {lesson.type === 'VIDEO' ? <PlaySquare className="w-5 h-5"/> : 
              lesson.type === 'ASSESSMENT' ? <MessageCircleQuestion className="w-5 h-5"/> : 
              <BookOpen className="w-5 h-5"/>}
             {lesson.type}
          </div>

          <h1 className="text-3xl font-bold mb-8 text-gray-900">{lesson.title}</h1>
          
          {lesson.type === 'ASSESSMENT' ? (
            <div className="mt-4">
              <p className="text-lg text-gray-700 mb-8">{lesson.content}</p>
              {objectives.length > 0 && student ? (
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6">
                  <div className="mb-6 border-b border-blue-100 pb-4">
                     <h2 className="text-xl font-bold text-blue-900 mb-2">Viva Assessment</h2>
                     <p className="text-blue-800/80"><strong>Task:</strong> {objectives[0].description}</p>
                  </div>
                  <AssessmentChat objectiveId={objectives[0]._id.toString()} userId={student._id.toString()} />
                </div>
              ) : (
                <p className="text-gray-500 italic">No assessment data available.</p>
              )}
            </div>
          ) : (
            <article className="prose lg:prose-xl max-w-none">
              {lesson.type === 'VIDEO' ? (
                <div className="aspect-w-16 aspect-h-9 bg-gray-900 flex items-center justify-center rounded-xl mb-8">
                  <div className="text-center p-8">
                    <PlaySquare className="w-16 h-16 text-white/50 mx-auto mb-4" />
                    <span className="text-white/80 font-medium">Video Player: {lesson.content}</span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {lesson.content}
                </div>
              )}
            </article>
          )}

          {/* Navigation to next */}
          {lesson.type !== 'ASSESSMENT' && (
             <div className="mt-12 pt-8 border-t flex justify-end">
                <Link href={`/course/${courseId}`} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium">
                  Mark Complete & Continue
                </Link>
             </div>
          )}
        </div>
      </div>
    </main>
  )
}

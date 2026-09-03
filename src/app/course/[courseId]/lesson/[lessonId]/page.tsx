import connectToDatabase from '@/lib/mongoose'
import { Course, Module, Lesson, Attempt, User, Objective } from '@/lib/models'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AssessmentChat from './AssessmentChat'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { markLessonCompleteAndRedirect } from '@/app/actions'
import { Separator } from '@/components/ui/separator'

export default async function LessonViewer({ params }: { params: { courseId: string, lessonId: string } }) {
  const { courseId, lessonId } = await params
  await connectToDatabase()

  const course = await Course.findById(courseId).lean() as any
  const lesson = await Lesson.findById(lessonId).lean() as any
  if (!course || !lesson) notFound()

  const mod = await Module.findById(lesson.moduleId).lean() as any
  const student = await User.findOne({ role: 'STUDENT' }).lean() as any

  // Find next lesson
  const allModules = await Module.find({ courseId: courseId }).sort({ order: 1 }).lean() as any[]
  let nextLessonId = null
  
  for (let i = 0; i < allModules.length; i++) {
    const modLessons = await Lesson.find({ moduleId: allModules[i]._id }).sort({ order: 1 }).lean() as any[]
    const currentIdx = modLessons.findIndex(l => l._id.toString() === lessonId)
    
    if (currentIdx !== -1) {
      if (currentIdx + 1 < modLessons.length) {
        nextLessonId = modLessons[currentIdx + 1]._id.toString()
      } else if (i + 1 < allModules.length) {
        const nextModLessons = await Lesson.find({ moduleId: allModules[i + 1]._id }).sort({ order: 1 }).lean() as any[]
        if (nextModLessons.length > 0) nextLessonId = nextModLessons[0]._id.toString()
      }
      break
    }
  }

  // Handle server action binding
  const handleComplete = markLessonCompleteAndRedirect.bind(null, student._id.toString(), lessonId, courseId, nextLessonId)

  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Navbar */}
      <header className="bg-card border-b h-16 flex items-center px-6 shrink-0">
        <Link href={`/course/${courseId}`} className="text-sm font-medium text-muted-foreground hover:text-foreground mr-4">
          &larr; Back
        </Link>
        <div className="h-6 w-px bg-border mx-2" />
        <span className="font-semibold ml-4">{course.title}</span>
        <span className="text-muted-foreground mx-2">/</span>
        <span className="text-muted-foreground">{mod.title}</span>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-background">
        <div className="max-w-4xl mx-auto py-12 px-6">
          <h1 className="text-3xl font-extrabold mb-8">{lesson.title}</h1>
          
          {lesson.type === 'ASSESSMENT' ? (
            <div className="mt-8">
              <AssessmentChat objectiveId={lesson._id.toString()} userId={student._id.toString()} />
            </div>
          ) : (
            <Card className="bg-card shadow-sm border-border">
              <CardContent className="pt-6 prose dark:prose-invert max-w-none text-card-foreground">
                <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
              </CardContent>
            </Card>
          )}

          {/* Navigation to next */}
          {lesson.type !== 'ASSESSMENT' && (
             <div className="mt-12">
               <Separator className="mb-8" />
               <form action={handleComplete} className="flex justify-end">
                  <Button type="submit" size="lg">
                    {nextLessonId ? 'Mark Complete & Continue' : 'Finish Course'}
                  </Button>
               </form>
             </div>
          )}
        </div>
      </div>
    </main>
  )
}

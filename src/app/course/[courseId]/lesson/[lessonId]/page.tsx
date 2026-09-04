import connectToDatabase from '@/lib/mongoose'
import { Course, Module, Lesson, Attempt, User, Objective, Enrollment } from '@/lib/models'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AssessmentChat from './AssessmentChat'
import CourseSidebar from '@/components/CourseSidebar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { markLessonCompleteAndRedirect } from '@/app/actions'
import { Separator } from '@/components/ui/separator'

export default async function LessonViewer({ params }: { params: Promise<{ courseId: string, lessonId: string }> }) {
  const { courseId, lessonId } = await params
  await connectToDatabase()

  const course = await Course.findById(courseId).lean() as any
  const lesson = await Lesson.findById(lessonId).lean() as any
  if (!course || !lesson) notFound()

  const mod = await Module.findById(lesson.moduleId).lean() as any
  const student = await User.findOne({ role: 'STUDENT' }).lean() as any
  const objective = lesson.type === 'ASSESSMENT' ? await Objective.findOne({ lessonId: lesson._id }).lean() as any : null
  const enrollment = await Enrollment.findOne({ userId: student._id, courseId: course._id }).lean() as any

  let attempt = null
  if (objective) {
    attempt = await Attempt.findOne({ userId: student._id, objectiveId: objective._id }).sort({ createdAt: -1 }).lean() as any
  }
  const isMastered = attempt?.status === 'MASTERED'

  const allLessons = await Lesson.find({ moduleId: lesson.moduleId }).sort({ order: 1 }).lean() as any[]
  const currentIdx = allLessons.findIndex(l => l._id.toString() === lessonId)
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null
  const handleComplete = markLessonCompleteAndRedirect.bind(null, student._id.toString(), lessonId, courseId, nextLesson ? nextLesson._id.toString() : null)

  // Fetch data for Sidebar
  const modules = await Module.find({ courseId: course._id }).sort({ order: 1 }).lean() as any[]
  for (const m of modules) {
    m.lessons = await Lesson.find({ moduleId: m._id }).sort({ order: 1 }).lean()
  }
  const allAttempts = await Attempt.find({ userId: student._id, status: 'MASTERED' }).lean() as any[]
  const masteredObjectiveIds = allAttempts.map(a => a.objectiveId.toString())
  const masteredObjectives = await Objective.find({ _id: { $in: masteredObjectiveIds } }).lean() as any[]
  const masteredLessonIds = masteredObjectives.map(o => o.lessonId.toString())

  if (!enrollment) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Enrollment Required</h1>
          <p className="text-muted-foreground mb-6">You must enroll in this course to access the lessons.</p>
          <Link href={`/course/${courseId}`}>
            <Button>Return to Course Page</Button>
          </Link>
        </div>
      </main>
    )
  }

  return (
    <div className="flex h-full w-full">
      <div className="flex-1 flex flex-col h-full overflow-y-auto bg-background relative">
        <div className="max-w-4xl w-full mx-auto p-12 lg:p-16">
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-8 font-mono text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border pb-4">
              <span className="text-primary font-bold">[{lesson.type === 'VIDEO' ? 'VID' : lesson.type === 'ASSESSMENT' ? 'VIVA' : 'TXT'}]</span>
              <span>EST_DURATION: {lesson.duration || '05:00'}</span>
              <div className="flex-1"></div>
              {isMastered ? (
                <span className="text-green-500 bg-green-500/10 px-2 py-1">MASTERED</span>
              ) : (
                <span className="text-primary bg-primary/10 px-2 py-1">IN_PROGRESS</span>
              )}
            </div>
            <h1 className="text-5xl lg:text-6xl font-serif font-bold tracking-tight mb-8 leading-tight">{lesson.title}</h1>
            
            {lesson.type === 'VIDEO' && (
              <div className="aspect-video w-full bg-black border border-border flex items-center justify-center mb-12 relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/10 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="font-mono text-xs uppercase tracking-widest text-primary mb-2">[ SYSTEM_PLAY ]</span>
                </div>
                <div className="w-24 h-24 rounded-full border border-primary flex items-center justify-center text-primary z-10 transition-transform group-hover:scale-110">
                  <svg className="w-8 h-8 ml-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>
              </div>
            )}

            {lesson.content && (
              <div className="prose prose-invert prose-lg max-w-none mb-16 font-sans text-muted-foreground leading-relaxed selection:bg-primary selection:text-primary-foreground
                prose-headings:font-serif prose-headings:text-foreground prose-headings:font-bold
                prose-a:text-primary prose-a:underline prose-a:underline-offset-4
                prose-code:font-mono prose-code:bg-muted/30 prose-code:px-1 prose-code:py-0.5
                prose-blockquote:border-l-primary prose-blockquote:bg-muted/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:font-serif prose-blockquote:italic
                prose-strong:text-foreground
              ">
                {lesson.content.split('\n').map((para: string, i: number) => (
                  <p key={i} className="mb-6">{para}</p>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center border-t border-border pt-8 pb-24">
            {prevLesson ? (
              <Link href={`/course/${courseId}/lesson/${prevLesson._id.toString()}`}>
                <Button variant="outline" className="font-mono text-xs uppercase tracking-widest border-border hover:bg-foreground hover:text-background rounded-none">
                  &larr; Previous
                </Button>
              </Link>
            ) : <div />}
            
            {lesson.type !== 'ASSESSMENT' && (
              <form action={handleComplete}>
                <Button type="submit" className="font-mono text-xs uppercase tracking-widest rounded-none bg-primary text-primary-foreground hover:bg-foreground hover:text-background h-12 px-8">
                  {nextLesson ? "Mark Mastered & Continue \u2192" : "Complete Course"}
                </Button>
              </form>
            )}

            {(lesson.type === 'ASSESSMENT' && nextLesson) ? (
              <Link href={`/course/${courseId}/lesson/${nextLesson._id.toString()}`}>
                <Button variant="outline" className="font-mono text-xs uppercase tracking-widest border-border hover:bg-foreground hover:text-background rounded-none">
                  Next &rarr;
                </Button>
              </Link>
            ) : !nextLesson && lesson.type === 'ASSESSMENT' ? (
               <Link href={`/course/${courseId}`}>
                <Button variant="outline" className="font-mono text-xs uppercase tracking-widest border-border hover:bg-foreground hover:text-background rounded-none">
                  Back to Syllabus
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
      
      {/* Assessment Right Panel if type is ASSESSMENT */}
      {lesson.type === 'ASSESSMENT' && (
        <AssessmentChat 
          objectiveId={objective?._id.toString()} 
          userId={student._id.toString()} 
          isMastered={isMastered}
          handleComplete={handleComplete}
          hasNextLesson={!!nextLesson}
        />
      )}
    </div>
  )
}

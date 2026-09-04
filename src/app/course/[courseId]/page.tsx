import connectToDatabase from '@/lib/mongoose'
import { Course, Module, Lesson, Attempt, User, Objective, Enrollment } from '@/lib/models'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PlaySquare, BookOpen, MessageCircleQuestion, CheckCircle2, Lock } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { enrollInCourse } from '@/app/actions'

export default async function CourseDetail({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  await connectToDatabase()

  const course = await Course.findById(courseId).populate('instructorId').lean() as any
  if (!course) notFound()

  const modules = await Module.find({ courseId: course._id }).sort({ order: 1 }).lean() as any[]
  
  for (const mod of modules) {
    mod.lessons = await Lesson.find({ moduleId: mod._id }).sort({ order: 1 }).lean()
  }

  const student = await User.findOne({ role: 'STUDENT' }).lean() as any
  
  let attempts = []
  let objectives = []
  let enrollment = null
  
  if (student) {
    attempts = await Attempt.find({ userId: student._id }).lean() as any[]
    objectives = await Objective.find({}).lean() as any[]
    enrollment = await Enrollment.findOne({ userId: student._id, courseId: course._id }).lean() as any
  }
  
  const isMastered = (lessonId: string) => {
    if (enrollment?.completedLessons?.some((id: any) => id.toString() === lessonId)) return true
    
    const obj = objectives.find(o => o.lessonId.toString() === lessonId)
    if (!obj) return false
    return attempts.some(a => a.objectiveId.toString() === obj._id.toString() && a.status === 'MASTERED')
  }

  const getIcon = (type: string, isCompleted: boolean, isLocked: boolean) => {
    if (isLocked) return <Lock className="w-5 h-5 text-muted-foreground opacity-50" />
    if (isCompleted) return <CheckCircle2 className="w-5 h-5 text-green-500" />
    switch (type) {
      case 'VIDEO': return <PlaySquare className="w-5 h-5 text-muted-foreground" />
      case 'READING': return <BookOpen className="w-5 h-5 text-muted-foreground" />
      case 'ASSESSMENT': return <MessageCircleQuestion className="w-5 h-5 text-primary" />
      default: return <BookOpen className="w-5 h-5 text-muted-foreground" />
    }
  }

  const handleEnroll = enrollInCourse.bind(null, student._id.toString(), course._id.toString())

  return (
    <main className="min-h-screen bg-background pb-24 font-sans text-foreground">
      {/* Header Banner */}
      <div className="bg-muted/10 py-16 px-6 border-b border-border">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row justify-between gap-12">
          <div className="lg:w-2/3">
            <Link href="/" className="text-muted-foreground hover:text-foreground hover:underline mb-6 inline-block text-sm font-semibold">&larr; Back to Catalog</Link>
            <h1 className="text-4xl lg:text-5xl font-serif font-bold tracking-tight mb-4 leading-tight">{course.title}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">{course.description}</p>
            <div className="mt-8 flex items-center gap-4 text-sm font-medium">
              <span className="opacity-80 text-muted-foreground">Taught by:</span>
              <span className="font-bold underline underline-offset-4">{course.instructorId?.email || 'Acme University'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-12 px-6 flex flex-col lg:flex-row gap-12">
        {/* Left Column: Syllabus */}
        <div className="lg:w-2/3">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-serif font-bold text-foreground">Syllabus - What you will learn from this course</h2>
          </div>

          <div className="w-full bg-card border border-border rounded-sm shadow-sm">
            <Accordion className="w-full" defaultValue={modules.map((m: any) => m._id.toString())}>
              {modules.map((mod, modIdx) => (
                <AccordionItem value={mod._id.toString()} key={mod._id.toString()} className="border-b border-border last:border-b-0 px-6">
                  <AccordionTrigger className="py-6 hover:no-underline hover:bg-muted/30 transition-colors text-xl font-serif font-bold text-foreground group -mx-6 px-6">
                    <div className="flex items-center gap-4 text-left">
                      <span className="text-primary text-sm uppercase tracking-wide opacity-80 font-sans font-bold block mb-1">Module {modIdx + 1}</span>
                      <span className="block">{mod.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <div className="flex flex-col space-y-2 mt-4 pl-4 border-l-2 border-border/50">
                      {mod.lessons?.map((lesson: any, idx: number) => {
                        const completed = isMastered(lesson._id.toString())
                        const isLocked = !enrollment
                        
                        const LessonContent = (
                          <div className={`flex items-start gap-4 ${isLocked ? 'opacity-60' : ''}`}>
                            <div className="mt-1 text-muted-foreground">
                              {getIcon(lesson.type, completed, isLocked)}
                            </div>
                            <div>
                              <h4 className={`text-base font-semibold transition-colors font-sans ${isLocked ? 'text-muted-foreground' : 'text-foreground group-hover:text-primary'}`}>
                                {lesson.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-bold text-muted-foreground font-sans uppercase tracking-wider">
                                  {lesson.type === 'VIDEO' ? 'Video' : lesson.type === 'ASSESSMENT' ? 'Viva' : 'Reading'}
                                </span>
                                <span className="text-xs text-muted-foreground/80 font-sans">• {lesson.duration || '5 min'}</span>
                              </div>
                            </div>
                          </div>
                        )

                        if (isLocked) {
                          return (
                            <div key={lesson._id.toString()} className="flex items-center justify-between p-3 rounded-md bg-background/50 border border-border/50">
                              {LessonContent}
                            </div>
                          )
                        }

                        return (
                          <Link 
                            href={`/course/${course._id.toString()}/lesson/${lesson._id.toString()}`}
                            key={lesson._id.toString()}
                            className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-md transition-colors group border border-transparent hover:border-border/50"
                          >
                            {LessonContent}
                            {(modIdx === 0 && idx === 0 && !completed) && (
                              <Button size="sm" className="rounded-sm font-bold shadow-none font-sans">Go to lesson</Button>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* Right Column: Sticky Enroll Card */}
        <div className="lg:w-1/3">
          <div className="sticky top-8 bg-card border border-border p-8 shadow-xl rounded-sm">
            <h3 className="text-xl font-serif font-bold mb-4 text-foreground">Start learning today</h3>
            <p className="text-muted-foreground mb-6 text-sm leading-relaxed font-sans">
              Unlock access to all modules, assignments, and AI viva assessments by enrolling.
            </p>
            
            {!enrollment ? (
              <form action={handleEnroll} className="w-full">
                <Button size="lg" type="submit" className="w-full rounded-sm font-bold shadow-none h-12 text-base font-sans">Enroll for Free</Button>
              </form>
            ) : (
              <div className="w-full">
                <Badge variant="secondary" className="mb-4 bg-green-500/20 text-green-500 font-bold hover:bg-green-500/30 rounded-sm font-sans">Enrolled</Badge>
                <Link href={`/course/${course._id.toString()}/lesson/${modules[0]?.lessons[0]?._id.toString()}`}>
                  <Button size="lg" className="w-full rounded-sm font-bold shadow-none h-12 text-base font-sans" variant="default">Go to Course</Button>
                </Link>
              </div>
            )}
            
            <div className="mt-6 pt-6 border-t border-border space-y-3 text-sm text-muted-foreground font-sans">
              <div className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-primary" /> Shareable Certificate</div>
              <div className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-primary" /> 100% online courses</div>
              <div className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-primary" /> Flexible Schedule</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

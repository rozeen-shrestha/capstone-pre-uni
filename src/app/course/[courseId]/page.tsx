import connectToDatabase from '@/lib/mongoose'
import { Course, Module, Lesson, Attempt, User, Objective } from '@/lib/models'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PlaySquare, BookOpen, MessageCircleQuestion, CheckCircle2 } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default async function CourseDetail({ params }: { params: { courseId: string } }) {
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
  if (student) {
    attempts = await Attempt.find({ userId: student._id }).lean() as any[]
    objectives = await Objective.find({}).lean() as any[]
  }
  
  const isMastered = (lessonId: string) => {
    if (student?.completedLessons?.some((id: any) => id.toString() === lessonId)) return true
    
    const obj = objectives.find(o => o.lessonId.toString() === lessonId)
    if (!obj) return false
    return attempts.some(a => a.objectiveId.toString() === obj._id.toString() && a.status === 'MASTERED')
  }

  const getIcon = (type: string, isCompleted: boolean) => {
    if (isCompleted) return <CheckCircle2 className="w-5 h-5 text-green-500" />
    switch (type) {
      case 'VIDEO': return <PlaySquare className="w-5 h-5 text-muted-foreground" />
      case 'READING': return <BookOpen className="w-5 h-5 text-muted-foreground" />
      case 'ASSESSMENT': return <MessageCircleQuestion className="w-5 h-5 text-primary" />
      default: return <BookOpen className="w-5 h-5 text-muted-foreground" />
    }
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card border-b py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-primary hover:underline mb-4 inline-block text-sm font-medium">&larr; Back to Catalog</Link>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">{course.title}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">{course.description}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-12 px-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold">Course Modules</h2>
          <Link href="/instructor">
            <Button variant="outline" size="sm">Instructor View</Button>
          </Link>
        </div>

        <Accordion type="multiple" className="w-full space-y-4" defaultValue={modules.map(m => m._id.toString())}>
          {modules.map((mod, modIdx) => (
            <AccordionItem value={mod._id.toString()} key={mod._id.toString()} className="border rounded-lg bg-card px-2">
              <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/50 rounded-t-lg transition-colors text-lg font-semibold">
                {mod.title}
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-2">
                <div className="flex flex-col space-y-2 px-2">
                  {mod.lessons?.map((lesson: any, idx: number) => {
                    const completed = lesson.type === 'ASSESSMENT' && isMastered(lesson._id.toString())
                    return (
                      <Link 
                        href={`/course/${course._id.toString()}/lesson/${lesson._id.toString()}`}
                        key={lesson._id.toString()}
                        className="flex items-center justify-between p-3 hover:bg-muted rounded-md transition-colors group border border-transparent hover:border-border"
                      >
                        <div className="flex items-start gap-4">
                          <div className="mt-1">
                            {getIcon(lesson.type, completed)}
                          </div>
                          <div>
                            <h4 className="text-base font-medium text-card-foreground group-hover:text-primary transition-colors">
                              {lesson.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={lesson.type === 'ASSESSMENT' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                                {lesson.type === 'VIDEO' ? 'Video' : lesson.type === 'ASSESSMENT' ? 'Viva' : 'Reading'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{lesson.duration || '5 min'}</span>
                            </div>
                          </div>
                        </div>
                        {(modIdx === 0 && idx === 0) && (
                          <Button size="sm">Get started</Button>
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
    </main>
  )
}

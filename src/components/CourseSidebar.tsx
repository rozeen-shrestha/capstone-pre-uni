'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { CheckCircle2, PlaySquare, BookOpen, MessageCircleQuestion, Lock, ChevronLeft } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

type Lesson = {
  _id: string
  title: string
  type: string
  duration: string
}

type Module = {
  _id: string
  title: string
  lessons: Lesson[]
}

type CourseSidebarProps = {
  courseId: string
  courseTitle: string
  modules: Module[]
  masteredLessonIds: string[]
  isEnrolled: boolean
}

export default function CourseSidebar({ courseId, courseTitle, modules, masteredLessonIds, isEnrolled }: CourseSidebarProps) {
  const params = useParams()
  const activeLessonId = params?.lessonId as string | undefined

  const getIcon = (type: string, isCompleted: boolean, isLocked: boolean, isActive: boolean) => {
    if (isLocked) return <Lock className="w-4 h-4 text-muted-foreground opacity-50" />
    if (isCompleted) return <CheckCircle2 className="w-4 h-4 text-green-500" />
    
    const colorClass = isActive ? 'text-primary' : 'text-muted-foreground'
    switch (type) {
      case 'VIDEO': return <PlaySquare className={`w-4 h-4 ${colorClass}`} />
      case 'READING': return <BookOpen className={`w-4 h-4 ${colorClass}`} />
      case 'ASSESSMENT': return <MessageCircleQuestion className={`w-4 h-4 ${colorClass}`} />
      default: return <BookOpen className={`w-4 h-4 ${colorClass}`} />
    }
  }

  // Find which module contains the active lesson so we can expand it by default
  const activeModuleId = modules.find(m => m.lessons.some(l => l._id.toString() === activeLessonId))?._id.toString()

  return (
    <div className="w-80 border-r border-border bg-card flex flex-col h-screen shrink-0 sticky top-0 font-sans text-foreground shadow-sm">
      <div className="p-6 border-b border-border bg-card">
        <Link href={`/course/${courseId}`} className="text-sm font-semibold text-primary hover:underline flex items-center mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Course
        </Link>
        <h2 className="font-serif font-bold text-xl leading-tight text-foreground">{courseTitle}</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <Accordion className="w-full" defaultValue={activeModuleId ? [activeModuleId] : [modules[0]?._id.toString()]}>
          {modules.map((mod, modIdx) => (
            <AccordionItem value={mod._id.toString()} key={mod._id.toString()} className="border-b border-border px-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors text-sm font-bold text-foreground">
                <div className="flex flex-col items-start text-left">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">Module {modIdx + 1}</span>
                  <span className="font-serif text-lg">{mod.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-0 pt-0 bg-background/50">
                <div className="flex flex-col border-t border-border">
                  {mod.lessons?.map((lesson: Lesson) => {
                    const completed = masteredLessonIds.includes(lesson._id.toString())
                    const isLocked = !isEnrolled
                    const isActive = lesson._id.toString() === activeLessonId

                    const LessonContent = (
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">
                          {getIcon(lesson.type, completed, isLocked, isActive)}
                        </div>
                        <div className="flex-1">
                          <h4 className={`text-sm leading-tight transition-colors ${isLocked ? 'text-muted-foreground' : isActive ? 'text-foreground font-bold' : 'text-foreground/80 font-medium group-hover:text-primary'}`}>
                            {lesson.title}
                          </h4>
                          <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/80 mt-2 flex gap-2">
                            <span>{lesson.type === 'VIDEO' ? 'Video' : lesson.type === 'ASSESSMENT' ? 'Viva' : 'Reading'}</span>
                            <span>•</span>
                            <span>{lesson.duration || '5 min'}</span>
                          </div>
                        </div>
                      </div>
                    )

                    if (isLocked) {
                      return (
                        <div key={lesson._id.toString()} className="p-4 border-b border-border/50 last:border-b-0 opacity-80">
                          {LessonContent}
                        </div>
                      )
                    }

                    return (
                      <Link 
                        href={`/course/${courseId}/lesson/${lesson._id.toString()}`}
                        key={lesson._id.toString()}
                        className={`p-4 border-b border-border/50 last:border-b-0 transition-colors block group hover:bg-muted/30 ${isActive ? 'bg-muted/20 border-l-4 border-l-primary pl-[12px]' : 'border-l-4 border-l-transparent pl-[12px]'}`}
                      >
                        {LessonContent}
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
  )
}

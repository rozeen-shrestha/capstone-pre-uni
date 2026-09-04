import connectToDatabase from '@/lib/mongoose'
import { Course, Module, Lesson, Attempt, User, Objective, Enrollment } from '@/lib/models'
import { notFound } from 'next/navigation'
import CourseSidebar from '@/components/CourseSidebar'

export default async function LessonLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  await connectToDatabase()

  const course = await Course.findById(courseId).lean() as any
  if (!course) notFound()

  const modules = await Module.find({ courseId: course._id }).sort({ order: 1 }).lean() as any[]
  for (const mod of modules) {
    mod.lessons = await Lesson.find({ moduleId: mod._id }).sort({ order: 1 }).lean() as any[]
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

  // Pre-calculate mastered lessons for the sidebar
  const masteredLessonIds: string[] = []
  
  if (enrollment) {
    // Standard lessons marked complete
    enrollment.completedLessons?.forEach((id: any) => {
      masteredLessonIds.push(id.toString())
    })
    
    // Assessment lessons marked MASTERED
    for (const attempt of attempts) {
      if (attempt.status === 'MASTERED') {
        const obj = objectives.find(o => o._id.toString() === attempt.objectiveId.toString())
        if (obj) {
          masteredLessonIds.push(obj.lessonId.toString())
        }
      }
    }
  }

  // Ensure plain objects for passing to client component
  const serializedModules = modules.map(m => ({
    _id: m._id.toString(),
    title: m.title,
    lessons: (m.lessons || []).map((l: any) => ({
      _id: l._id.toString(),
      title: l.title,
      type: l.type,
      duration: l.duration
    }))
  }))

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <CourseSidebar 
        courseId={courseId}
        courseTitle={course.title}
        modules={serializedModules}
        masteredLessonIds={masteredLessonIds}
        isEnrolled={!!enrollment}
      />
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>
    </div>
  )
}

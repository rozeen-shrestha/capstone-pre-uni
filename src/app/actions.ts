'use server'

import connectToDatabase from '@/lib/mongoose'
import { User, Enrollment } from '@/lib/models'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function enrollInCourse(userId: string, courseId: string) {
  await connectToDatabase()
  
  await Enrollment.findOneAndUpdate(
    { userId, courseId },
    { userId, courseId },
    { upsert: true, new: true }
  )
  
  revalidatePath(`/course/${courseId}`)
}

export async function markLessonCompleteAndRedirect(userId: string, lessonId: string, courseId: string, nextLessonId: string | null) {
  await connectToDatabase()
  
  await Enrollment.findOneAndUpdate(
    { userId, courseId },
    { $addToSet: { completedLessons: lessonId } }
  )
  
  revalidatePath(`/course/${courseId}`)
  revalidatePath(`/course/${courseId}/lesson/${lessonId}`)
  
  if (nextLessonId) {
    redirect(`/course/${courseId}/lesson/${nextLessonId}`)
  } else {
    redirect(`/course/${courseId}`)
  }
}

'use server'

import connectToDatabase from '@/lib/mongoose'
import { User } from '@/lib/models'
import { redirect } from 'next/navigation'

export async function markLessonCompleteAndRedirect(userId: string, lessonId: string, courseId: string, nextLessonId: string | null) {
  await connectToDatabase()
  
  await User.findByIdAndUpdate(userId, {
    $addToSet: { completedLessons: lessonId }
  })
  
  if (nextLessonId) {
    redirect(`/course/${courseId}/lesson/${nextLessonId}`)
  } else {
    redirect(`/course/${courseId}`)
  }
}

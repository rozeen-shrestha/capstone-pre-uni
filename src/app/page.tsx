import connectToDatabase from '@/lib/mongoose'
import { Course } from '@/lib/models'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function CourseCatalog() {
  await connectToDatabase()
  
  // Lean query + populate instructor
  const courses = await Course.find({}).populate('instructorId').lean() as any[]
  
  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">Course Catalog</h1>
          <p className="text-lg text-muted-foreground">
            Browse AI-assessed courses and improve your understanding through conversational learning.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course._id.toString()} className="hover:shadow-md transition-all">
              <CardHeader>
                <CardTitle>{course.title}</CardTitle>
                <CardDescription className="line-clamp-2">{course.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Instructor: {course.instructorId?.email?.split('@')[0]}
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/course/${course._id.toString()}`} className="w-full">
                  <Button className="w-full">View Course</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
          {courses.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No courses available yet.
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

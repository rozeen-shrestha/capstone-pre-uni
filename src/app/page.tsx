import connectToDatabase from '@/lib/mongoose'
import { Course, User, Enrollment } from '@/lib/models'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Sparkles, ArrowRight, User as UserIcon } from 'lucide-react'

// Helper to generate a consistent gradient based on a string (like course title)
function getGradient(title: string) {
  const gradients = [
    'from-blue-500/20 to-purple-500/20',
    'from-emerald-500/20 to-teal-500/20',
    'from-orange-500/20 to-red-500/20',
    'from-pink-500/20 to-rose-500/20',
    'from-indigo-500/20 to-cyan-500/20',
  ]
  const charCode = title.charCodeAt(0) || 0
  return gradients[charCode % gradients.length]
}

export default async function CatalogPage() {
  await connectToDatabase()
  
  const courses = await Course.find({}).populate('instructorId').lean() as any[]
  const student = await User.findOne({ role: 'STUDENT' }).lean() as any
  
  let enrollments: any[] = []
  if (student) {
    enrollments = await Enrollment.find({ userId: student._id }).lean() as any[]
  }

  return (
    <main className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 selection:text-primary pt-12">
      {/* Catalog Grid */}
      <section id="courses" className="max-w-7xl mx-auto py-12 px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">Available Courses</h2>
            <p className="text-muted-foreground text-lg">Expand your knowledge with our curated curriculum.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map((course) => {
            const isEnrolled = enrollments.some(e => e.courseId.toString() === course._id.toString())
            const gradientClass = getGradient(course.title)
            
            return (
              <Card key={course._id.toString()} className="flex flex-col bg-card/50 backdrop-blur-sm border-border/50 rounded-xl overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 group">
                <div className={`h-40 bg-gradient-to-br ${gradientClass} border-b border-border/50 p-6 flex flex-col justify-between relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-background/20 group-hover:bg-transparent transition-colors duration-300" />
                  <div className="relative z-10 flex justify-between items-start">
                    <div className="w-10 h-10 rounded-lg bg-background/80 backdrop-blur-md flex items-center justify-center border border-border/50 shadow-sm">
                      <BookOpen className="w-5 h-5 text-foreground" />
                    </div>
                    {isEnrolled && (
                      <Badge className="bg-green-500/20 text-green-500 border-green-500/20 hover:bg-green-500/30">
                        Enrolled
                      </Badge>
                    )}
                  </div>
                </div>
                
                <CardHeader className="p-6 pb-4">
                  <CardTitle className="text-xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                    {course.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1 p-6 pt-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium bg-muted/30 px-3 py-2 rounded-md">
                    <UserIcon className="w-3.5 h-3.5" />
                    <span className="truncate">{course.instructorId?.email || 'Acme University'}</span>
                  </div>
                </CardContent>
                
                <CardFooter className="p-6 pt-0">
                  <Link href={`/course/${course._id.toString()}`} className="w-full">
                    <Button 
                      className="w-full rounded-lg font-semibold shadow-none" 
                      variant={isEnrolled ? "secondary" : "default"}
                    >
                      {isEnrolled ? "Continue Learning" : "View Course Details"}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            )
          })}
          
          {courses.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-24 text-center border border-dashed border-border/50 rounded-xl bg-muted/10">
              <BookOpen className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No courses available</h3>
              <p className="text-muted-foreground">Check back later for new content.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

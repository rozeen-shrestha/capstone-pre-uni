import connectToDatabase from '@/lib/mongoose'
import { Course, Attempt, User, Objective, Lesson } from '@/lib/models'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export default async function InstructorDashboard() {
  await connectToDatabase()

  const attempts = await Attempt.find({}).sort({ updatedAt: -1 }).populate('userId objectiveId').lean() as any[]
  
  const enrichedAttempts = await Promise.all(attempts.map(async (attempt) => {
    let lessonTitle = 'Unknown Lesson'
    if (attempt.objectiveId?.lessonId) {
       const lesson = await Lesson.findById(attempt.objectiveId.lessonId).lean() as any
       if (lesson) lessonTitle = lesson.title
    }
    return { ...attempt, lessonTitle }
  }))

  return (
    <main className="min-h-screen bg-background text-foreground pb-24 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <Link href="/" className="text-sm font-medium text-primary hover:underline mb-4 inline-block">&larr; Back to Catalog</Link>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Instructor Dashboard</h1>
          <p className="text-muted-foreground text-lg">Monitor student progress and AI assessment results.</p>
        </header>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle>Recent Assessments</CardTitle>
            <CardDescription>A live feed of all student Viva assessments and their current standing.</CardDescription>
          </CardHeader>
          <CardContent>
            {enrichedAttempts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No assessments have been taken yet.</div>
            ) : (
              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Lesson (Assessment)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Turns</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrichedAttempts.map((attempt) => (
                      <TableRow key={attempt._id.toString()}>
                        <TableCell className="font-medium">{attempt.userId?.email || 'Unknown User'}</TableCell>
                        <TableCell>{attempt.lessonTitle}</TableCell>
                        <TableCell>
                          <Badge variant={
                            attempt.status === 'MASTERED' ? 'default' :
                            attempt.status === 'OFF_TRACK' ? 'destructive' :
                            attempt.status === 'PARTIAL' ? 'secondary' : 'outline'
                          } className={attempt.status === 'MASTERED' ? 'bg-green-600 hover:bg-green-700' : ''}>
                            {attempt.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{attempt.turnCount}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(attempt.updatedAt || attempt.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

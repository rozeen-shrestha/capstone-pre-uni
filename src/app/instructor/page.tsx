import connectToDatabase from '@/lib/mongoose'
import { Attempt, User, Objective, Lesson } from '@/lib/models'
import Link from 'next/link'

export default async function InstructorDashboard() {
  await connectToDatabase()

  // Fetch all students
  const students = await User.find({ role: 'STUDENT' }).lean() as any[]
  
  // Fetch all attempts and populate
  const allAttempts = await Attempt.find({}).populate('objectiveId').lean() as any[]

  const analytics = students.map(student => {
    const studentAttempts = allAttempts.filter(a => a.userId.toString() === student._id.toString())
    
    const mastered = studentAttempts.filter(a => a.status === 'MASTERED')
    const needsReview = studentAttempts.filter(a => a.status === 'PARTIAL' || a.status === 'OFF_TRACK')
    
    // Calculate average turns for mastered attempts
    const totalTurns = mastered.reduce((sum, a) => sum + a.turnCount, 0)
    const avgTurns = mastered.length > 0 ? (totalTurns / mastered.length).toFixed(1) : 'N/A'

    return {
      id: student._id.toString(),
      email: student.email,
      totalAttempts: studentAttempts.length,
      masteredCount: mastered.length,
      reviewCount: needsReview.length,
      avgTurns
    }
  })

  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto bg-gray-50">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
        <Link href="/" className="text-blue-600 hover:underline">View Catalog</Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Student Progress Overview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-white text-sm text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Student Email</th>
                <th className="px-6 py-4 font-medium">Objectives Mastered</th>
                <th className="px-6 py-4 font-medium">Needs Review (Failed)</th>
                <th className="px-6 py-4 font-medium">Avg Turns to Master</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {analytics.map(student => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{student.email}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {student.masteredCount}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {student.reviewCount > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {student.reviewCount} Flagged
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">Clear</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{student.avgTurns}</td>
                </tr>
              ))}
              {analytics.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No students enrolled yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}

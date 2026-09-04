import { User, Objective } from './src/lib/models'
import connectToDatabase from './src/lib/mongoose'
import dotenv from 'dotenv'
dotenv.config()

async function test() {
  await connectToDatabase()
  const student = await User.findOne({ role: 'STUDENT' })
  const objective = await Objective.findOne()

  if (!student || !objective) {
    console.log('Missing data')
    return
  }

  const res = await fetch('http://localhost:3000/api/assessment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: student._id.toString(),
      objectiveId: objective._id.toString(),
      message: null
    })
  })

  const data = await res.json()
  console.log('STATUS:', res.status)
  console.log('RESPONSE:', JSON.stringify(data, null, 2))
  process.exit(0)
}

test()

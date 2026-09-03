import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'
import connectToDatabase from '@/lib/mongoose'
import { Objective, Attempt } from '@/lib/models'

export async function POST(req: Request) {
  try {
    await connectToDatabase()
    const { objectiveId, userId, message } = await req.json()

    // 1. Fetch objective
    const objective = await Objective.findById(objectiveId).lean() as any
    
    if (!objective) return NextResponse.json({ error: 'Objective not found' }, { status: 404 })

    // 2. Fetch or create Attempt
    let attempt = await Attempt.findOne({
      userId, 
      objectiveId, 
      status: 'IN_PROGRESS'
    })

    if (!attempt) {
      // First turn: we need to generate an opening question
      attempt = await Attempt.create({
        userId,
        objectiveId,
        conversation: [],
      })
    }

    const conversation = attempt.conversation as any[]
    
    // Add user message if provided
    if (message) {
      conversation.push({ role: 'user', content: message })
      attempt.turnCount += 1
    }

    // 3. System Prompt & State Machine constraints
    const systemPrompt = `
      You are an AI assessment agent evaluating a learner's understanding of a specific learning objective.
      Objective: ${objective.description}
      Rubric Criteria to satisfy:
      ${objective.rubricCriteria.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}

      Current Turn: ${attempt.turnCount}
      Max Turns Allowed: ${objective.maxTurns}

      Instructions:
      1. If the conversation is empty (Turn 0), generate an opening question that requires the learner to explain or apply the concept.
      2. If the learner has responded, evaluate their answer against EVERY rubric criterion independently.
      3. If all criteria are 'MET', mark the verdict as 'MASTERED', set should_continue to false, and provide brief positive feedback.
      4. If some criteria are missing/partial AND turns remain, ask EXACTLY ONE targeted follow-up question to nudge them toward the missing reasoning. DO NOT give them the answer.
      5. If the turn limit is reached (${objective.maxTurns}) and they haven't mastered it, set should_continue to false, mark verdict as 'PARTIAL' or 'OFF_TRACK', and summarize what they missed.
      6. Do NOT accept verbatim copying of the objective description as mastery. They must show understanding.
    `

    // 4. Call LLM to evaluate and generate next turn
    const { object } = await generateObject({
      model: google('gemini-1.5-pro'),
      system: systemPrompt,
      messages: conversation.map(msg => ({ role: msg.role as any, content: msg.content })),
      schema: z.object({
        coverage: z.array(z.object({
          criterionIndex: z.number().describe('The index (1-based) of the rubric criterion.'),
          status: z.enum(['MET', 'PARTIAL', 'MISSING']),
          reasoning: z.string().describe('Internal reasoning for why this status was given based on the learner\'s text.')
        })),
        verdict: z.enum(['IN_PROGRESS', 'MASTERED', 'PARTIAL', 'OFF_TRACK']),
        next_message: z.string().describe('The exact text to show to the learner (the question, feedback, or closing statement).'),
        should_continue: z.boolean().describe('True if the conversation should continue, False if the attempt is over (mastered or turn limit reached).')
      }),
    })

    // 5. Update Attempt State in DB
    conversation.push({ role: 'agent', content: object.next_message })

    let finalStatus = object.verdict
    
    // Hard enforce turn cap
    if (attempt.turnCount >= objective.maxTurns && finalStatus === 'IN_PROGRESS') {
       finalStatus = 'PARTIAL'
       object.should_continue = false
    }

    attempt.conversation = conversation
    attempt.status = finalStatus
    attempt.coverage = object.coverage
    await attempt.save()

    // 6. Return structured response to client
    return NextResponse.json({
      attemptId: attempt._id.toString(),
      verdict: finalStatus,
      coverage: object.coverage,
      next_message: object.next_message,
      should_continue: object.should_continue,
      turnCount: attempt.turnCount,
      maxTurns: objective.maxTurns
    })

  } catch (error: any) {
    console.error('Assessment API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

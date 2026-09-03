'use client'

import { useState } from 'react'

type AssessmentResponse = {
  attemptId: string
  verdict: 'IN_PROGRESS' | 'MASTERED' | 'PARTIAL' | 'OFF_TRACK'
  coverage: any
  next_message: string
  should_continue: boolean
  turnCount: number
  maxTurns: number
}

export default function AssessmentChat({ objectiveId, userId }: { objectiveId: string, userId: string }) {
  const [messages, setMessages] = useState<{role: 'user'|'agent', content: string}[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [verdict, setVerdict] = useState<string | null>(null)
  
  const startAssessment = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectiveId, userId, message: null })
      })
      const data: AssessmentResponse = await res.json()
      
      setMessages([{ role: 'agent', content: data.next_message }])
      setVerdict(data.verdict)
      setIsFinished(!data.should_continue)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading || isFinished) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectiveId, userId, message: userMsg })
      })
      const data: AssessmentResponse = await res.json()
      
      setMessages(prev => [...prev, { role: 'agent', content: data.next_message }])
      setVerdict(data.verdict)
      setIsFinished(!data.should_continue)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-blue-200 rounded-lg p-6 bg-white shadow-sm mt-4">
      {messages.length === 0 ? (
        <div className="text-center">
          <p className="mb-4 text-gray-700">Ready to check your understanding?</p>
          <button 
            onClick={startAssessment}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Starting...' : 'Start Assessment'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col h-full max-h-[500px]">
          <div className="flex-grow overflow-y-auto mb-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-4 py-3 rounded-lg max-w-[85%] ${
                  msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-lg bg-gray-100 text-gray-500 animate-pulse">
                  Agent is typing...
                </div>
              </div>
            )}
          </div>

          {!isFinished ? (
            <form onSubmit={sendMessage} className="flex gap-2 border-t pt-4">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Explain in your own words..."
                className="flex-grow border rounded-md px-4 py-2 focus:outline-blue-500"
                disabled={loading}
              />
              <button 
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Send
              </button>
            </form>
          ) : (
            <div className={`p-4 rounded-md text-center font-semibold ${
              verdict === 'MASTERED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              Assessment Complete: {verdict}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

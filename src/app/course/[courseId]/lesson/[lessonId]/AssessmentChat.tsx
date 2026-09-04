'use client'

import { useState, useRef, useEffect, FormEvent } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, CheckCircle2, AlertCircle } from 'lucide-react'

type AssessmentResponse = {
  attemptId: string
  verdict: 'IN_PROGRESS' | 'MASTERED' | 'PARTIAL' | 'OFF_TRACK'
  coverage: any
  next_message: string
  should_continue: boolean
  turnCount: number
  maxTurns: number
  error?: string
  history?: { role: string, content: string }[]
}

export default function AssessmentChat({ 
  objectiveId, 
  userId,
  isMastered,
  handleComplete,
  hasNextLesson
}: { 
  objectiveId: string, 
  userId: string,
  isMastered: boolean,
  handleComplete: () => void,
  hasNextLesson: boolean
}) {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([])
  const [input, setInput] = useState('')
  const [isFinished, setIsFinished] = useState(isMastered)
  const [verdict, setVerdict] = useState<string | null>(isMastered ? 'MASTERED' : null)
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const startAssessment = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectiveId, userId, message: null })
      })
      const data: AssessmentResponse = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start')
      
      if (data.history && data.history.length > 0) {
        setMessages(data.history)
      } else {
        setMessages([{ role: 'agent', content: data.next_message }])
      }
      setVerdict(data.verdict)
      setIsFinished(!data.should_continue)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isFinished || isLoading) return

    const userMsg = input
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setIsLoading(true)

    try {
      const res = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectiveId, userId, message: userMsg })
      })
      const data: AssessmentResponse = await res.json()
      if (!res.ok) throw new Error(data.error || 'API Error')
      
      setMessages(prev => [...prev, { role: 'agent', content: data.next_message }])
      setVerdict(data.verdict)
      setIsFinished(!data.should_continue)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  if (messages.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-12 border border-border bg-card text-center py-16 shadow-sm rounded-sm">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        {isMastered ? (
          <>
            <h2 className="text-3xl font-serif font-bold text-foreground mb-4">Assessment Mastered</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg font-sans">
              You have successfully passed this viva assessment.
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={startAssessment} disabled={isLoading} variant="outline" size="lg" className="rounded-sm font-bold shadow-none h-12 font-sans">
                {isLoading ? 'Loading...' : 'Review Feedback'}
              </Button>
              <form action={handleComplete}>
                <Button type="submit" size="lg" className="rounded-sm font-bold shadow-none h-12 font-sans">
                  {hasNextLesson ? 'Continue to Next Lesson' : 'Finish Course'}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-serif font-bold text-foreground mb-4">Final Viva Assessment</h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-lg leading-relaxed font-sans">
              Demonstrate your understanding of this module's core concepts. You must answer the examiner's questions to pass.
            </p>
            <Button onClick={startAssessment} disabled={isLoading} size="lg" className="px-10 rounded-sm font-bold shadow-none h-12 text-base font-sans">
              {isLoading ? 'Starting Assessment...' : 'Start Assessment'}
            </Button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="w-full lg:w-[500px] shrink-0 h-screen flex flex-col bg-card border-l border-border font-sans shadow-sm">
      <div className="border-b border-border py-6 px-8 bg-muted/30 flex justify-between items-center">
        <div>
          <h2 className="font-serif font-bold text-foreground text-xl">Viva Assessment</h2>
          <p className="text-sm text-muted-foreground mt-1">Respond to the examiner's prompts below.</p>
        </div>
        {verdict && (
          <span className={`text-xs px-4 py-1.5 rounded-sm font-bold tracking-wider uppercase ${
            verdict === 'MASTERED' ? 'bg-green-500/20 text-green-700 dark:text-green-400' :
            'bg-muted text-muted-foreground'
          }`}>
            {verdict.replace('_', ' ')}
          </span>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-6" ref={scrollRef}>
        <div className="space-y-8 pb-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1`}>
                {msg.role === 'user' ? 'Your Answer' : 'Examiner'}
              </div>
              <div className={`max-w-[85%] px-6 py-5 rounded-sm text-base leading-relaxed font-sans ${
                msg.role === 'user' 
                  ? 'bg-muted text-foreground border border-border' 
                  : 'bg-primary/10 text-foreground border border-primary/20 shadow-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex flex-col items-start">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">Examiner</div>
              <div className="bg-primary/10 text-muted-foreground border border-primary/20 shadow-sm rounded-sm px-6 py-5 text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-6 bg-muted/20 border-t border-border">
        {isFinished ? (
          <div className="text-center py-6 bg-green-500/10 rounded-sm border border-green-500/20">
            <h3 className="font-serif font-bold text-lg mb-2 text-green-700 dark:text-green-400">Assessment Complete</h3>
            <p className="text-green-700/80 dark:text-green-400/80 text-sm mb-6">Your answers have met the passing criteria.</p>
            <form action={handleComplete}>
              <Button type="submit" size="lg" className="rounded-sm font-bold shadow-none w-full font-sans">
                {hasNextLesson ? 'Continue to Next Lesson' : 'Finish Course'}
              </Button>
            </form>
          </div>
        ) : (
          <form onSubmit={sendMessage} className="flex gap-4">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your response..."
              disabled={isLoading}
              className="flex-1 bg-background border-input rounded-sm h-12 shadow-sm text-base focus-visible:ring-primary focus-visible:border-primary font-sans"
            />
            <Button type="submit" disabled={isLoading || !input.trim()} className="rounded-sm font-bold shadow-none h-12 px-6 font-sans">
              Submit Answer
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

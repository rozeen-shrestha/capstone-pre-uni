'use client'

import { useState, useRef, useEffect } from 'react'
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
}

export default function AssessmentChat({ objectiveId, userId }: { objectiveId: string, userId: string }) {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([])
  const [input, setInput] = useState('')
  const [isFinished, setIsFinished] = useState(false)
  const [verdict, setVerdict] = useState<string | null>(null)
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
      
      setMessages([{ role: 'agent', content: data.next_message }])
      setVerdict(data.verdict)
      setIsFinished(!data.should_continue)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
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
      <Card className="w-full max-w-2xl mx-auto mt-12 bg-card border-muted text-center py-12">
        <CardContent>
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Ready for the Viva?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Our AI Agent will assess your understanding of this topic through a short conversation. Don't worry, just answer naturally!
          </p>
          <Button onClick={startAssessment} disabled={isLoading} size="lg" className="px-8">
            {isLoading ? 'Starting...' : 'Start Assessment'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-3xl mx-auto h-[600px] flex flex-col bg-card border-border shadow-md">
      <CardHeader className="border-b border-border py-4 bg-muted/30">
        <CardTitle className="flex justify-between items-center text-lg">
          <span className="font-semibold text-foreground">Viva Assessment</span>
          {verdict && (
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
              verdict === 'MASTERED' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
              verdict === 'PARTIAL' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
              verdict === 'OFF_TRACK' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
              'bg-blue-500/20 text-blue-600 dark:text-blue-400'
            }`}>
              {verdict.replace('_', ' ')}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 pb-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                  : 'bg-muted text-foreground border border-border rounded-tl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted text-muted-foreground border border-border rounded-2xl rounded-tl-sm px-5 py-3 text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="p-4 bg-muted/20 border-t border-border">
        {isFinished ? (
          <div className="text-center py-4 bg-muted/50 rounded-lg border border-border">
            <h3 className="font-bold text-lg mb-2 text-foreground">Assessment Complete</h3>
            <p className="text-muted-foreground">You can close this chat and continue to the next lesson.</p>
          </div>
        ) : (
          <form onSubmit={sendMessage} className="flex gap-2">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your answer here..."
              disabled={isLoading}
              className="flex-1 bg-background"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="w-4 h-4 mr-2" /> Send
            </Button>
          </form>
        )}
      </div>
    </Card>
  )
}

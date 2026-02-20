import { useState, useEffect, useRef, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Send, Bot, RefreshCw, Users, Power, PowerOff } from 'lucide-react'

export const Route = createFileRoute('/agent')({
  component: AgentConsole,
})

interface WebSocketMessage {
  id: string
  type: 'req' | 'res' | 'error'
  method?: string
  params?: Record<string, unknown>
  ok?: boolean
  payload?: unknown
  error?: string
  timestamp: string
}

interface AgentSession {
  id: string
  name: string
  status: 'active' | 'idle' | 'error'
  lastActivity: string
}

const mockSessions: AgentSession[] = [
  { id: 'sess-001', name: 'Research Agent', status: 'active', lastActivity: '2 min ago' },
  { id: 'sess-002', name: 'Code Assistant', status: 'idle', lastActivity: '15 min ago' },
  { id: 'sess-003', name: 'Data Analyst', status: 'active', lastActivity: '1 min ago' },
]

const mockMessages: WebSocketMessage[] = [
  { id: '1', type: 'res', ok: true, payload: { response: 'Hello! How can I help you today?' }, timestamp: new Date(Date.now() - 60000).toISOString() },
  { id: '2', type: 'req', method: 'agent.think', params: { prompt: 'Analyzing the request...' }, timestamp: new Date(Date.now() - 45000).toISOString() },
  { id: '3', type: 'res', ok: true, payload: { response: 'I found 3 relevant results for your query.' }, timestamp: new Date(Date.now() - 30000).toISOString() },
]

function AgentConsole() {
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<WebSocketMessage[]>(mockMessages)
  const [input, setInput] = useState('')
  const [sessions] = useState<AgentSession[]>(mockSessions)
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const connect = useCallback(() => {
    const wsUrl = import.meta.env.VITE_OPENCLAW_WS_URL || 'ws://localhost:18789'
    try {
      const ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {
        setConnected(true)
      }
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage
          setMessages(prev => [...prev, { ...data, timestamp: new Date().toISOString() }])
        } catch (e) {
          console.error('Failed to parse message:', e)
        }
      }
      
      ws.onerror = (event) => {
        console.error('WebSocket connection error:', event)
        setConnected(false)
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          type: 'error',
          error: 'Connection error occurred',
          timestamp: new Date().toISOString()
        }])
      }
      
      ws.onclose = () => {
        setConnected(false)
      }
      
      wsRef.current = ws
    } catch (error) {
      console.error('Failed to connect:', error)
      setConnected(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
      setConnected(false)
    }
  }, [])

  const sendMessage = () => {
    if (!input.trim() || !wsRef.current) return
    
    // Check if WebSocket is open before sending
    if (wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not open for sending messages')
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        type: 'error',
        error: 'Connection is not established',
        timestamp: new Date().toISOString()
      }])
      return
    }
    
    const message: WebSocketMessage = {
      id: crypto.randomUUID(),
      type: 'req',
      method: 'agent.chat',
      params: { message: input, sessionId: activeSession },
      timestamp: new Date().toISOString(),
    }
    
    wsRef.current.send(JSON.stringify(message))
    setMessages(prev => [...prev, message])
    setInput('')
  }

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="p-6 h-[calc(100vh-8rem)]">
      <div className="grid grid-cols-12 gap-6 h-full">
        <Card className="col-span-3 flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Sessions</CardTitle>
              <Button variant="ghost" size="sm">
                <Users className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>Active agent sessions</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="space-y-2">
              {sessions.map(session => (
                <button
                  type="button"
                  key={session.id}
                  className={`w-full text-left p-3 rounded-lg cursor-pointer transition-colors ${
                    activeSession === session.id 
                      ? 'bg-primary/10 border border-primary' 
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setActiveSession(session.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{session.name}</span>
                    <Badge variant={session.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {session.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Last: {session.lastActivity}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-6 flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <CardTitle className="text-lg">Agent Console</CardTitle>
                <Badge variant={connected ? 'default' : 'destructive'} className="ml-2">
                  {connected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
              <div className="flex gap-2">
                {connected ? (
                  <Button variant="outline" size="sm" onClick={disconnect}>
                    <PowerOff className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={connect}>
                    <Power className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardDescription>Interact with AI agents via WebSocket</CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-auto">
            <div className="space-y-4 h-64 overflow-y-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === 'req' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.type === 'req'
                        ? 'bg-primary text-primary-foreground'
                        : msg.type === 'error'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.type === 'req' ? (
                      <div className="text-sm">
                        <div className="font-medium mb-1">{msg.method}</div>
                        <div className="opacity-80">{JSON.stringify(msg.params)}</div>
                      </div>
                    ) : (
                      <div className="text-sm">
                        {msg.ok ? (
                          <div>{JSON.stringify(msg.payload)}</div>
                        ) : (
                          <div className="text-destructive">{msg.error}</div>
                        )}
                      </div>
                    )}
                    <div className="text-xs opacity-50 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="flex gap-2 mt-4">
              <Input
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                disabled={!connected}
              />
              <Button onClick={sendMessage} disabled={!connected || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">Agent Info</CardTitle>
            <CardDescription>Session details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium mb-1">Active Model</div>
              <div className="text-sm text-muted-foreground">llama3.2:3b</div>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Context Length</div>
              <div className="text-sm text-muted-foreground">4096 tokens</div>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Temperature</div>
              <div className="text-sm text-muted-foreground">0.7</div>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Total Requests</div>
              <div className="text-sm text-muted-foreground">142</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

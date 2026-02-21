import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, Plus, Play, Pause, Trash2, 
  Clock, Cpu, MessageSquare, Settings, ArrowLeft 
} from 'lucide-react'

export const Route = createFileRoute('/agent/sessions')({
  component: AgentSessionsPage,
})

interface Session {
  id: string
  name: string
  status: 'active' | 'paused' | 'stopped'
  model: string
  createdAt: string
  lastActivity: string
  messages: number
  cpu: number
}

const mockSessions: Session[] = [
  {
    id: 'sess-001',
    name: 'Research Agent',
    status: 'active',
    model: 'llama3.2:3b',
    createdAt: '2026-02-18T10:30:00Z',
    lastActivity: '2 min ago',
    messages: 142,
    cpu: 15,
  },
  {
    id: 'sess-002',
    name: 'Code Assistant',
    status: 'paused',
    model: 'qwen2.5:3b',
    createdAt: '2026-02-17T14:20:00Z',
    lastActivity: '15 min ago',
    messages: 89,
    cpu: 0,
  },
  {
    id: 'sess-003',
    name: 'Data Analyst',
    status: 'active',
    model: 'llama3.2:3b',
    createdAt: '2026-02-19T08:00:00Z',
    lastActivity: '1 min ago',
    messages: 256,
    cpu: 22,
  },
  {
    id: 'sess-004',
    name: 'Writer Assistant',
    status: 'stopped',
    model: 'qwen2.5:3b',
    createdAt: '2026-02-16T16:45:00Z',
    lastActivity: '2 days ago',
    messages: 67,
    cpu: 0,
  },
]

function AgentSessionsPage() {
  const [sessions] = useState<Session[]>(mockSessions)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSession, setSelectedSession] = useState<string | null>(null)

  const filteredSessions = sessions.filter(session =>
    session.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.model.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selected = sessions.find(s => s.id === selectedSession)

  return (
    <div className="p-6 h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Agent Sessions</h1>
          <p className="text-muted-foreground">Manage your AI agent sessions</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Session
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100%-5rem)]">
        <Card className="col-span-4 flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8"
              />
            </div>
            <CardDescription>
              {filteredSessions.length} sessions total
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="space-y-2">
              {filteredSessions.map(session => (
                <button
                  key={session.id}
                  type="button"
                  className={`w-full text-left p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedSession === session.id 
                      ? 'bg-primary/10 border border-primary' 
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedSession(session.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{session.name}</span>
                    <Badge 
                      variant={session.status === 'active' ? 'default' : session.status === 'paused' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {session.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {session.model} • {session.messages} msgs
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-8 flex flex-col">
          {selected ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedSession(null)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                      <CardTitle>{selected.name}</CardTitle>
                      <CardDescription>ID: {selected.id}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {selected.status === 'active' ? (
                      <Button variant="outline" size="sm">
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    ) : selected.status === 'paused' ? (
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                    ) : null}
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                <Tabs defaultValue="overview">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="messages">Messages</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 rounded-lg bg-muted">
                        <div className="flex items-center gap-2 mb-1">
                          <Cpu className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">CPU</span>
                        </div>
                        <div className="text-2xl font-bold">{selected.cpu}%</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Messages</span>
                        </div>
                        <div className="text-2xl font-bold">{selected.messages}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Created</span>
                        </div>
                        <div className="text-sm font-medium">
                          {new Date(selected.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted">
                        <div className="flex items-center gap-2 mb-1">
                          <Settings className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Model</span>
                        </div>
                        <div className="text-sm font-medium">{selected.model}</div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="messages" className="mt-4">
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No messages yet</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="settings" className="mt-4">
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <label htmlFor="sessionName" className="text-sm font-medium">Session Name</label>
                        <Input id="sessionName" defaultValue={selected?.name} onChange={(e) => setSelectedSession(selected.id)} />
                      </div>
                      <div className="grid gap-2">
                        <label htmlFor="model" className="text-sm font-medium">Model</label>
                        <Input id="model" value={selected.model} disabled />
                      </div>
                      <div className="grid gap-2">
                        <label htmlFor="temperature" className="text-sm font-medium">Temperature</label>
                        <Input id="temperature" type="number" step="0.1" min="0" max="2" defaultValue="0.7" />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a session to view details</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

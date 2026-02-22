import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, Container, Cpu, MemoryStick,
  RefreshCw, ExternalLink,
  AlertCircle, CheckCircle2
} from 'lucide-react'

export const Route = createFileRoute('/monitor')({
  component: MonitorPage,
})

interface ContainerStats {
  id: string
  name: string
  image: string
  status: 'running' | 'stopped' | 'paused' | 'restarting'
  cpu: number
  memory: number
  memoryLimit: number
  networkRx: number
  networkTx: number
  created: string
}

const mockContainers: ContainerStats[] = [
  {
    id: 'abc123',
    name: 'openclaw_gateway',
    image: 'openclaw/gateway:latest',
    status: 'running',
    cpu: 2.5,
    memory: 256,
    memoryLimit: 512,
    networkRx: 1024,
    networkTx: 2048,
    created: '2026-02-15T10:00:00Z'
  },
  {
    id: 'def456',
    name: 'openclaw_ollama',
    image: 'ollama/ollama:latest',
    status: 'running',
    cpu: 45.2,
    memory: 8192,
    memoryLimit: 16384,
    networkRx: 51200,
    networkTx: 102400,
    created: '2026-02-15T10:00:00Z'
  },
  {
    id: 'ghi789',
    name: 'openclaw_searxng',
    image: 'searxng/searxng:latest',
    status: 'running',
    cpu: 1.2,
    memory: 128,
    memoryLimit: 256,
    networkRx: 4096,
    networkTx: 8192,
    created: '2026-02-15T10:00:00Z'
  },
  {
    id: 'jkl012',
    name: 'openclaw_redis',
    image: 'redis:7-alpine',
    status: 'running',
    cpu: 0.8,
    memory: 64,
    memoryLimit: 128,
    networkRx: 256,
    networkTx: 128,
    created: '2026-02-15T10:00:00Z'
  },
  {
    id: 'mno345',
    name: 'openclaw_portainer',
    image: 'portainer/portainer-ce:latest',
    status: 'stopped',
    cpu: 0,
    memory: 0,
    memoryLimit: 256,
    networkRx: 0,
    networkTx: 0,
    created: '2026-02-15T10:00:00Z'
  },
]

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatUptime = (dateStr: string): string => {
  const created = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - created.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  return `${diffDays}d ${diffHours}h`
}

function MonitorPage() {
  const [containers] = useState<ContainerStats[]>(mockContainers)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedContainer, setSelectedContainer] = useState<string | null>(null)

  const runningContainers = containers.filter(c => c.status === 'running')
  const totalCpu = runningContainers.reduce((acc, c) => acc + c.cpu, 0)
  const totalMemory = runningContainers.reduce((acc, c) => acc + c.memory, 0)
  const totalMemoryLimit = runningContainers.reduce((acc, c) => acc + c.memoryLimit, 0)

  // Calculate system health based on container status
  const allRunning = runningContainers.length === containers.length
  const isHealthy = allRunning && containers.length > 0
  const stoppedContainers = containers.filter(c => c.status !== 'running')

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1000)
  }

  return (
    <div className="p-6 h-[calc(100vh-8rem)] overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Monitoring Center</h1>
          <p className="text-muted-foreground">Container status and resource monitoring via Portainer</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" asChild>
            <a href="http://localhost:9000" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Portainer
            </a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Containers</CardTitle>
            <Container className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{containers.length}</div>
            <p className="text-xs text-muted-foreground">
              {runningContainers.length} running, {containers.length - runningContainers.length} stopped
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCpu.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Across {runningContainers.length} containers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(totalMemory * 1024 * 1024)}</div>
            <p className="text-xs text-muted-foreground">
              of {formatBytes(totalMemoryLimit * 1024 * 1024)} limit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isHealthy ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-lg font-bold">Healthy</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <span className="text-lg font-bold">Degraded</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isHealthy 
                ? 'All services operational' 
                : `${stoppedContainers.length} service(s) stopped: ${stoppedContainers.map(c => c.name).join(', ')}`
              }
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="containers" className="space-y-4">
        <TabsList className="mb-4">
          <TabsTrigger value="containers">Containers</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
        </TabsList>

        <TabsContent value="containers">
          <Card>
            <CardHeader>
              <CardTitle>Container List</CardTitle>
              <CardDescription>All containers in the Docker environment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {containers.map(container => (
                  <button
                    type="button"
                    key={container.id}
                    className={`w-full flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors text-left ${
                      selectedContainer === container.id ? 'border-primary bg-accent' : 'hover:bg-accent/50'
                    }`}
                    onClick={() => setSelectedContainer(selectedContainer === container.id ? null : container.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        container.status === 'running' ? 'bg-green-500' :
                        container.status === 'paused' ? 'bg-yellow-500' :
                        container.status === 'restarting' ? 'bg-blue-500' :
                        'bg-red-500'
                      }`} />
                      <div>
                        <div className="font-medium">{container.name}</div>
                        <div className="text-sm text-muted-foreground">{container.image}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={
                        container.status === 'running' ? 'default' :
                        container.status === 'paused' ? 'secondary' :
                        'destructive'
                      }>
                        {container.status}
                      </Badge>
                      {container.status === 'running' ? (
                        <div className="text-sm text-muted-foreground text-right">
                          <div>CPU: {container.cpu.toFixed(1)}%</div>
                          <div>MEM: {formatBytes(container.memory * 1024 * 1024)}</div>
                        </div>
                      ) : null}
                      <div className="text-sm text-muted-foreground">
                        {formatUptime(container.created)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Resource Usage</CardTitle>
              <CardDescription>CPU and memory consumption by container</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {runningContainers.map(container => (
                  <div key={container.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{container.name}</span>
                      <span className="text-sm text-muted-foreground">
                        CPU: {container.cpu.toFixed(1)}% | MEM: {formatBytes(container.memory * 1024 * 1024)} / {formatBytes(container.memoryLimit * 1024 * 1024)}
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${Math.min(100, Math.max(0, container.cpu))}%` }}
                      />
                    </div>
                    <div className="h-1 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${(container.memory / container.memoryLimit) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health">
          <Card>
            <CardHeader>
              <CardTitle>Health Status</CardTitle>
              <CardDescription>Service health check overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {containers.map(container => (
                  <div key={container.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    {container.status === 'running' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium">{container.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {container.status === 'running' ? 'Healthy' : 'Unhealthy'}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium">Docker Daemon</div>
                    <div className="text-sm text-muted-foreground">Healthy</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium">Portainer API</div>
                    <div className="text-sm text-muted-foreground">Healthy</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium">Network</div>
                    <div className="text-sm text-muted-foreground">Healthy</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

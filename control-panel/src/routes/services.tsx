import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { DataTable } from '@/components/data-table'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, RefreshCw, Play, Square } from 'lucide-react'

type ServiceStatus = 'running' | 'stopped' | 'error' | 'warning'

interface Service {
  id: string
  name: string
  status: ServiceStatus
  port: number
  image: string
  cpu: string
  memory: string
  uptime: string
}

export const Route = createFileRoute('/services')({
  component: Services,
})

export function Services() {
  const services = [
    {
      id: 'openclaw',
      name: 'OpenClaw Gateway',
      status: 'running',
      port: 3000,
      image: 'openclaw/gateway:latest',
      cpu: '15%',
      memory: '512 MB',
      uptime: '2d 4h 32m',
    },
    {
      id: 'searxng',
      name: 'SearxNG',
      status: 'running',
      port: 8080,
      image: 'searxng/searxng:latest',
      cpu: '8%',
      memory: '256 MB',
      uptime: '2d 4h 30m',
    },
    {
      id: 'ollama',
      name: 'Ollama',
      status: 'running',
      port: 11434,
      image: 'ollama/ollama:latest',
      cpu: '45%',
      memory: '1.2 GB',
      uptime: '2d 4h 28m',
    },
    {
      id: 'qdrant',
      name: 'Qdrant',
      status: 'running',
      port: 6333,
      image: 'qdrant/qdrant:latest',
      cpu: '12%',
      memory: '384 MB',
      uptime: '2d 4h 25m',
    },
    {
      id: 'redis',
      name: 'Redis',
      status: 'running',
      port: 6379,
      image: 'redis:7-alpine',
      cpu: '3%',
      memory: '128 MB',
      uptime: '2d 4h 20m',
    },
    {
      id: 'portainer',
      name: 'Portainer',
      status: 'stopped',
      port: 9000,
      image: 'portainer/portainer-ce:latest',
      cpu: '0%',
      memory: '0 MB',
      uptime: '-',
    },
  ]

  const columns = [
    {
      key: 'name' as const,
      header: 'Service Name',
      render: (value: string, row: Service) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground">{row.image}</div>
        </div>
      ),
    },
    {
      key: 'status' as const,
      header: 'Status',
      render: (value: string) => <StatusBadge status={value as ServiceStatus} />,
    },
    {
      key: 'port' as const,
      header: 'Port',
      render: (value: number) => <span className="font-mono">{value}</span>,
    },
    {
      key: 'cpu' as const,
      header: 'CPU',
      render: (value: string) => <span>{value}</span>,
    },
    {
      key: 'memory' as const,
      header: 'Memory',
      render: (value: string) => <span>{value}</span>,
    },
    {
      key: 'uptime' as const,
      header: 'Uptime',
      render: (value: string) => <span>{value}</span>,
    },
  ] as const

  const actions = [
    { label: 'Start', value: 'start' },
    { label: 'Stop', value: 'stop' },
    { label: 'Restart', value: 'restart' },
    { label: 'Logs', value: 'logs' },
    { label: 'Settings', value: 'settings' },
  ]

  const handleRowAction = (action: string, row: any) => {
    console.log(`Action: ${action} on service: ${row.id}`)
  }

  const handleRefresh = () => {
    console.log('Refreshing services...')
  }

  const handleStartAll = () => {
    console.log('Starting all services...')
  }

  const handleStopAll = () => {
    console.log('Stopping all services...')
  }

  const [searchTerm, setSearchTerm] = useState('')

  const filteredServices = useMemo(() => {
    if (!searchTerm) return services

    const lowerSearchTerm = searchTerm.toLowerCase()
    return services.filter(
      (service) =>
        service.name.toLowerCase().includes(lowerSearchTerm) ||
        service.image.toLowerCase().includes(lowerSearchTerm)
    )
  }, [services, searchTerm])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Service Management</h1>
        <p className="text-muted-foreground">
          Monitor and manage all OpenClaw services
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Services</CardTitle>
              <CardDescription>
                {services.filter((s) => s.status === 'running').length} of {services.length} services running
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleStartAll}
              >
                <Play className="h-4 w-4 mr-2" />
                Start All
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleStopAll}
              >
                <Square className="h-4 w-4 mr-2" />
                Stop All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              className="max-w-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DataTable
            data={filteredServices}
            columns={columns}
            actions={actions}
            onRowAction={handleRowAction}
          />
        </CardContent>
      </Card>
    </div>
  )
}

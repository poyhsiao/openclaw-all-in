import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Activity, Database, Cpu, Server, RefreshCw } from 'lucide-react'
import { useServiceMutation } from '@/services/api'
import { toast } from 'sonner'

interface QuickActionsProps {
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function QuickActions({ onRefresh, isRefreshing }: QuickActionsProps) {
  const { mutate: mutateService, isPending } = useServiceMutation()

  const handleRestartAll = () => {
    const services = ['openclaw', 'searxng', 'ollama', 'qdrant', 'redis', 'portainer']
    services.forEach((serviceId) => {
      mutateService(
        { serviceId, action: 'restart' },
        {
          onSuccess: () => {
            toast.success(`${serviceId} restarted successfully`)
          },
          onError: (error) => {
            toast.error(`Failed to restart ${serviceId}: ${error.message}`)
          },
        }
      )
    })
  }

  const handleViewLogs = () => {
    console.log('View logs')
    toast.info('Logs feature coming soon')
  }

  const handleDiagnostics = () => {
    console.log('Run diagnostics')
    toast.info('Diagnostics feature coming soon')
  }

  const handleSystemUpdate = () => {
    console.log('System update')
    toast.info('System update feature coming soon')
  }

  const actions = [
    {
      icon: Activity,
      label: 'Restart All',
      description: 'Restart all services',
      onClick: handleRestartAll,
      variant: 'default' as const,
    },
    {
      icon: Database,
      label: 'View Logs',
      description: 'View service logs',
      onClick: handleViewLogs,
      variant: 'outline' as const,
    },
    {
      icon: Cpu,
      label: 'Diagnostics',
      description: 'Run system diagnostics',
      onClick: handleDiagnostics,
      variant: 'outline' as const,
    },
    {
      icon: Server,
      label: 'System Update',
      description: 'Check for updates',
      onClick: handleSystemUpdate,
      variant: 'outline' as const,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common management tasks</CardDescription>
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing || isPending}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant}
              className="flex items-center gap-2 h-auto py-4"
              onClick={action.onClick}
              disabled={isRefreshing}
            >
              <action.icon className="h-5 w-5" />
              <span className="font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

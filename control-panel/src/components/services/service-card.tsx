import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { Play, Square, RotateCw, Settings, Terminal, Activity } from "lucide-react"
import { Service } from "@/services/api"

export interface ServiceCardProps {
  service: Service
  onRestart?: () => void
  onStop?: () => void
  onStart?: () => void
  onSettings?: () => void
  onViewLogs?: () => void
  onViewStats?: () => void
}

export function ServiceCard({
  service,
  onRestart,
  onStop,
  onStart,
  onSettings,
  onViewLogs,
  onViewStats,
}: ServiceCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{service.name}</CardTitle>
            <CardDescription className="mt-1">{service.description}</CardDescription>
          </div>
          <StatusBadge status={service.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {service.port && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Port</span>
              <span className="font-mono">{service.port}</span>
            </div>
          )}
          {service.image && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Image</span>
              <span className="font-mono text-xs">{service.image}</span>
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {service.status === 'running' ? (
              <>
                <Button variant="outline" size="sm" onClick={onRestart}>
                  <RotateCw className="mr-2 h-4 w-4" />
                  Restart
                </Button>
                <Button variant="destructive" size="sm" onClick={onStop}>
                  <Square className="mr-2 h-4 w-4" />
                  Stop
                </Button>
                <Button variant="outline" size="sm" onClick={onViewLogs}>
                  <Terminal className="mr-2 h-4 w-4" />
                  Logs
                </Button>
                <Button variant="outline" size="sm" onClick={onViewStats}>
                  <Activity className="mr-2 h-4 w-4" />
                  Stats
                </Button>
              </>
            ) : (
              <>
                <Button variant="default" size="sm" onClick={onStart}>
                  <Play className="mr-2 h-4 w-4" />
                  Start
                </Button>
                <Button variant="outline" size="sm" onClick={onViewLogs}>
                  <Terminal className="mr-2 h-4 w-4" />
                  Logs
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={onSettings} aria-label="Open settings">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

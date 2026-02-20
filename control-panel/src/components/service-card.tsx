import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { Play, Square, RotateCw, Settings } from "lucide-react"

export interface ServiceCardProps {
  name: string
  description: string
  status: 'running' | 'stopped' | 'error' | 'warning'
  port?: number
  onRestart?: () => void
  onStop?: () => void
  onStart?: () => void
  onSettings?: () => void
}

export function ServiceCard({
  name,
  description,
  status,
  port,
  onRestart,
  onStop,
  onStart,
  onSettings,
}: ServiceCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{name}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {port && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Port</span>
              <span className="font-mono">{port}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            {status === 'running' ? (
              <>
                <Button variant="outline" size="sm" onClick={onRestart}>
                  <RotateCw className="mr-2 h-4 w-4" />
                  Restart
                </Button>
                <Button variant="destructive" size="sm" onClick={onStop}>
                  <Square className="mr-2 h-4 w-4" />
                  Stop
                </Button>
              </>
            ) : (
              <Button variant="default" size="sm" onClick={onStart}>
                <Play className="mr-2 h-4 w-4" />
                Start
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onSettings}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

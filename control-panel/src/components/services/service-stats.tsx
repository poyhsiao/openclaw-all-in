import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Cpu, HardDrive, Network, Clock, RefreshCw } from "lucide-react"
import type { ServiceStats as ServiceStatsType } from "@/services/service-hooks"

export interface ServiceStatsProps {
  stats: ServiceStatsType | undefined
  isLoading: boolean
  onRefresh?: () => void
}

export function ServiceStats({ stats, isLoading, onRefresh }: ServiceStatsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resource Usage</CardTitle>
          <CardDescription>Loading statistics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-2 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resource Usage</CardTitle>
          <CardDescription>No statistics available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Service is not running or statistics are unavailable.
          </p>
        </CardContent>
      </Card>
    )
  }

  const cpuPercentage = Math.round(stats.cpu * 100)
  const memoryPercentage = stats.memoryTotal > 0
    ? Math.round((stats.memory / stats.memoryTotal) * 100)
    : 0
  const memoryMB = Math.round(stats.memory)
  const memoryTotalMB = Math.round(stats.memoryTotal)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Resource Usage</CardTitle>
            <CardDescription>Real-time service metrics</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* CPU Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">CPU Usage</span>
              </div>
              <span className="font-mono">{cpuPercentage}%</span>
            </div>
            <Progress value={cpuPercentage} className="h-2" />
          </div>

          {/* Memory Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Memory Usage</span>
              </div>
              <span className="font-mono">
                {memoryMB} MB / {memoryTotalMB} MB
              </span>
            </div>
            <Progress value={memoryPercentage} className="h-2" />
          </div>

          {/* Network I/O */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Network className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Network I/O</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">In:</span>
                <span className="font-mono">{formatBytes(stats.network.in)}/s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Out:</span>
                <span className="font-mono">{formatBytes(stats.network.out)}/s</span>
              </div>
            </div>
          </div>

          {/* Uptime and Restarts */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-muted-foreground">Uptime</div>
                <div className="font-mono">{stats.uptime}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-muted-foreground">Restarts</div>
                <div className="font-mono">{stats.restarts}</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'

  const isNegative = bytes < 0
  const absBytes = Math.abs(bytes)

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(
    Math.max(0, Math.floor(Math.log(absBytes) / Math.log(k))),
    sizes.length - 1
  )

  const result = (absBytes / Math.pow(k, i)).toFixed(2)
  const unit = sizes[i]

  return `${isNegative ? '-' : ''}${result} ${unit}`
}

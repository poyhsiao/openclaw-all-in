import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Activity, Cpu, Database, HardDrive, Server, Users } from 'lucide-react'
import type { DashboardStats } from '@/services/api'

interface OverviewCardsProps {
  stats?: DashboardStats
  isLoading?: boolean
}

export function OverviewCards({ stats, isLoading }: OverviewCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={`skeleton-${i}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const cards = [
    {
      title: 'Total Services',
      value: stats.totalServices.toString(),
      description: `${stats.runningServices} running, ${stats.stoppedServices} stopped`,
      icon: Server,
    },
    {
      title: 'CPU Usage',
      value: `${stats.cpuUsage}%`,
      description: stats.cpuUsageChange,
      icon: Cpu,
    },
    {
      title: 'Memory Usage',
      value: stats.memoryUsage,
      description: `of ${stats.memoryTotal} total`,
      icon: HardDrive,
    },
    {
      title: 'Active Users',
      value: stats.activeUsers.toString(),
      description: `+${stats.newUsersToday} new today`,
      icon: Users,
    },
    {
      title: 'API Requests',
      value: stats.apiRequests,
      description: 'last 24 hours',
      icon: Activity,
    },
    {
      title: 'Vector DB Size',
      value: stats.vectorDbSize,
      description: `${stats.vectorCount.toLocaleString()} vectors`,
      icon: Database,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

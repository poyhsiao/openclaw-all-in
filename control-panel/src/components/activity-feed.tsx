import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Activity, AlertCircle, Server, User } from 'lucide-react'
import type { Activity as ActivityType } from '@/services/api'
import { formatDistanceToNow } from 'date-fns'

interface ActivityFeedProps {
  activities?: ActivityType[]
  isLoading?: boolean
}

function getActivityIcon(type: ActivityType['type']) {
  switch (type) {
    case 'service':
      return <Server className="h-4 w-4" />
    case 'user':
      return <User className="h-4 w-4" />
    case 'system':
      return <Activity className="h-4 w-4" />
    case 'error':
      return <AlertCircle className="h-4 w-4" />
    default:
      return <Activity className="h-4 w-4" />
  }
}

function getActivityColor(type: ActivityType['type']) {
  switch (type) {
    case 'service':
      return 'text-blue-500'
    case 'user':
      return 'text-green-500'
    case 'system':
      return 'text-purple-500'
    case 'error':
      return 'text-red-500'
    default:
      return 'text-gray-500'
  }
}

export function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={`activity-skeleton-${i}`} className="flex items-start gap-3">
                <Skeleton className="h-4 w-4 mt-1" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No recent activity</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest system events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`mt-1 ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {activity.message}
                </p>
                {activity.details && (
                  <p className="text-xs text-muted-foreground">
                    {activity.details}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.timestamp), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

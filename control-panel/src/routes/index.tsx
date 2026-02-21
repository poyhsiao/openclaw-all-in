import { createFileRoute } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { OverviewCards } from '@/components/overview-cards'
import { ServicesGrid } from '@/components/services-grid'
import { QuickActions } from '@/components/quick-actions'
import { ActivityFeed } from '@/components/activity-feed'
import {
  useDashboardQuery,
  useServicesQuery,
  useActivityQuery,
  prefetchDashboardData,
} from '@/services/api'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

export function Dashboard() {
  const queryClient = useQueryClient()

  const {
    data: dashboardStats,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useDashboardQuery()

  const {
    data: services,
    isLoading: isServicesLoading,
    error: servicesError,
    refetch: refetchServices,
  } = useServicesQuery()

  const {
    data: activities,
    isLoading: isActivitiesLoading,
    error: activitiesError,
  } = useActivityQuery()

  const isLoading = isDashboardLoading || isServicesLoading || isActivitiesLoading
  const hasError = dashboardError || servicesError || activitiesError

  const handleRefresh = () => {
    refetchDashboard()
    refetchServices()
    refetchActivities()
  }

  useEffect(() => {
    prefetchDashboardData(queryClient)
  }, [queryClient])

  if (hasError) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">Error Loading Dashboard</h2>
          <p className="text-muted-foreground mb-4">
            {dashboardError?.message || servicesError?.message || activitiesError?.message}
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the OpenClaw Control Panel
        </p>
      </div>

      <OverviewCards stats={dashboardStats} isLoading={isDashboardLoading} />

      <div>
        <h2 className="text-2xl font-semibold mb-4">Services</h2>
        <ServicesGrid services={services} isLoading={isServicesLoading} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <QuickActions onRefresh={handleRefresh} isRefreshing={isLoading} />
        <ActivityFeed activities={activities} isLoading={isActivitiesLoading} />
      </div>
    </div>
  )
}

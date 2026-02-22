import { ServiceCard } from '@/components/service-card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Service } from '@/services/api'
import { useServiceMutation } from '@/services/api'
import { toast } from 'sonner'

interface ServicesGridProps {
  services?: Service[]
  isLoading?: boolean
}

export function ServicesGrid({ services, isLoading }: ServicesGridProps) {
  const { mutate: mutateService } = useServiceMutation()

  const pastTenseMap: Record<string, string> = {
    start: 'started',
    stop: 'stopped',
    restart: 'restarted',
  }

  const handleServiceAction = (serviceId: string, action: 'start' | 'stop' | 'restart') => {
    mutateService(
      { serviceId, action },
      {
        onSuccess: () => {
          toast.success(`Service ${pastTenseMap[action]} successfully`)
        },
        onError: (error) => {
          toast.error(`Failed to ${action} service: ${error.message}`)
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`service-skeleton-${i}`} className="border rounded-lg p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-9" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!services || services.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No services found</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          name={service.name}
          description={service.description}
          status={service.status}
          port={service.port}
          onStart={() => handleServiceAction(service.id, 'start')}
          onStop={() => handleServiceAction(service.id, 'stop')}
          onRestart={() => handleServiceAction(service.id, 'restart')}
          onSettings={() => console.log(`Settings ${service.id}`)}
        />
      ))}
    </div>
  )
}

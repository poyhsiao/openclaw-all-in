import { cn } from "@/lib/utils"

export interface StatusBadgeProps {
  status: 'running' | 'stopped' | 'error' | 'warning'
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig = {
    running: {
      label: 'Running',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    },
    stopped: {
      label: 'Stopped',
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
    },
    error: {
      label: 'Error',
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    },
    warning: {
      label: 'Warning',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    },
  }

  const config = statusConfig[status]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  )
}

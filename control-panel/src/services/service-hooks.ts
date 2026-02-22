import React from 'react'
import {
  useQuery,
  useMutation,
  useQueryClient,
  queryOptions,
} from '@tanstack/react-query'
import { Service } from './api'

// Types
export interface ServiceLogs {
  serviceId: string
  logs: LogEntry[]
  hasMore: boolean
}

export interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  source?: string
}

export interface ServiceStats {
  serviceId: string
  cpu: number
  memory: number
  memoryTotal: number
  network: {
    in: number
    out: number
  }
  uptime: string
  restarts: number
}

// API base URL
const API_BASE = '/api'

// Helper function for fetch requests
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  const finalHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  }
  const response = await fetch(url, {
    headers: finalHeaders,
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: response.statusText,
    }))
    throw new Error(error.message || 'API request failed')
  }

  return response.json()
}

// Query Options Factories
export const servicesQueryOptions = queryOptions({
  queryKey: ['services'],
  queryFn: async () => {
    return fetchAPI<Service[]>('/services')
  },
  staleTime: 1000 * 30, // 30 seconds
  gcTime: 1000 * 60 * 5, // 5 minutes
})

export const serviceQueryOptions = (name: string) =>
  queryOptions({
    queryKey: ['services', name],
    queryFn: async () => {
      return fetchAPI<Service>(`/services/${name}`)
    },
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
  })

export const serviceLogsQueryOptions = (name: string, limit = 100) =>
  queryOptions({
    queryKey: ['services', name, 'logs', limit],
    queryFn: async () => {
      return fetchAPI<ServiceLogs>(`/services/${name}/logs?limit=${limit}`)
    },
    staleTime: 1000 * 5, // 5 seconds for logs
    gcTime: 1000 * 60,
  })

export const serviceStatsQueryOptions = (name: string) =>
  queryOptions({
    queryKey: ['services', name, 'stats'],
    queryFn: async () => {
      return fetchAPI<ServiceStats>(`/services/${name}/stats`)
    },
    staleTime: 1000 * 10, // 10 seconds for stats
    gcTime: 1000 * 60,
  })

// Query Hooks
export function useServices() {
  return useQuery(servicesQueryOptions)
}

export function useService(name: string) {
  return useQuery(serviceQueryOptions(name))
}

export function useServiceLogs(name: string, limit = 100) {
  return useQuery(serviceLogsQueryOptions(name, limit))
}

export function useServiceStats(name: string) {
  return useQuery(serviceStatsQueryOptions(name))
}

// Mutation Hooks
export function useServiceAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      name,
      action,
    }: {
      name: string
      action: 'start' | 'stop' | 'restart'
    }) => {
      return fetchAPI<{ success: boolean; message?: string }>(
        `/services/${name}/${action}`,
        {
          method: 'POST',
        }
      )
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['services', variables.name] })
      queryClient.invalidateQueries({ queryKey: ['services', variables.name, 'stats'] })
    },
  })
}

// Real-time log streaming hook (using EventSource)
export function useServiceLogsStream(name: string, enabled = true) {
  const [logs, setLogs] = React.useState<LogEntry[]>([])
  const [isConnected, setIsConnected] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const MAX_LOGS = 500 // Limit log entries to prevent memory growth

  React.useEffect(() => {
    if (!enabled) return

    // Clear logs when connecting to a new service
    setLogs([])

    const eventSource = new EventSource(`${API_BASE}/services/${name}/logs/stream`)

    eventSource.onopen = () => {
      setIsConnected(true)
      setError(null)
    }

    eventSource.onmessage = (event) => {
      try {
        const logEntry: LogEntry = JSON.parse(event.data)
        setLogs((prev) => {
          const updated = [...prev, logEntry]
          // Keep only the most recent MAX_LOGS entries
          return updated.slice(-MAX_LOGS)
        })
      } catch (e) {
        console.error('Failed to parse log message:', e)
        // Silently ignore malformed messages to prevent crashes
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
      setError('Connection lost')
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [name, enabled])

  return {
    logs,
    isConnected,
    error,
    clearLogs: () => setLogs([]),
  }
}

// Prefetch helper
export function prefetchServiceData(
  queryClient: ReturnType<typeof useQueryClient>,
  name: string
) {
  queryClient.prefetchQuery(serviceQueryOptions(name))
  queryClient.prefetchQuery(serviceLogsQueryOptions(name))
  queryClient.prefetchQuery(serviceStatsQueryOptions(name))
}

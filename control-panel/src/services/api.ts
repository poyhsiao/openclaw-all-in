import {
  useQuery,
  useMutation,
  useQueryClient,
  queryOptions,
} from '@tanstack/react-query'

// Types
export interface Service {
  id: string
  name: string
  status: 'running' | 'stopped' | 'error' | 'warning'
  port?: number
  description: string
  image?: string
  cpu?: number
  memory?: number
}

export interface DashboardStats {
  totalServices: number
  runningServices: number
  stoppedServices: number
  cpuUsage: number
  cpuUsageChange: string
  memoryUsage: string
  memoryTotal: string
  activeUsers: number
  newUsersToday: number
  apiRequests: string
  vectorDbSize: string
  vectorCount: number
}

export interface Activity {
  id: string
  type: 'service' | 'user' | 'system' | 'error'
  message: string
  timestamp: string
  details?: string
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    email: string
    name: string
  }
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
}

// API base URL
const API_BASE = '/api'

export const api = {
  get: <T>(endpoint: string) => fetchAPI<T>(endpoint),
  post: <T>(endpoint: string, data?: any) =>
    fetchAPI<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  put: <T>(endpoint: string, data?: any) =>
    fetchAPI<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: <T>(endpoint: string) =>
    fetchAPI<T>(endpoint, {
      method: 'DELETE',
    }),
}

// Helper function for fetch requests
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T | null> {
  const url = `${API_BASE}${endpoint}`

  // Use Headers API instead of index assignment on HeadersInit
  const headers = new Headers(options?.headers)
  headers.set('Content-Type', 'application/json')

  const token = localStorage.getItem('auth_token')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: response.statusText,
    }))
    throw new Error(error.message || 'API request failed')
  }

  // Handle empty responses (e.g., 204 No Content)
  if (response.status === 204 || response.headers.get('Content-Length') === '0') {
    return null
  }

  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch (error) {
    console.error('Failed to parse JSON response:', error)
    throw new Error('Invalid JSON response from server')
  }
}

// Query Options Factories (v5 pattern)
export const servicesQueryOptions = queryOptions({
  queryKey: ['services'],
  queryFn: async () => {
    return fetchAPI<Service[]>('/services')
  },
  staleTime: 1000 * 30, // 30 seconds
  gcTime: 1000 * 60 * 5, // 5 minutes
})

export const dashboardQueryOptions = queryOptions({
  queryKey: ['dashboard', 'overview'],
  queryFn: async () => {
    return fetchAPI<DashboardStats>('/dashboard/overview')
  },
  staleTime: 1000 * 30, // 30 seconds
  gcTime: 1000 * 60 * 5, // 5 minutes
})

export const activityQueryOptions = queryOptions({
  queryKey: ['activity'],
  queryFn: async () => {
    return fetchAPI<Activity[]>('/activity')
  },
  staleTime: 1000 * 60, // 1 minute
  gcTime: 1000 * 60 * 5, // 5 minutes
})

// Query Hooks
export function useServicesQuery() {
  return useQuery(servicesQueryOptions)
}

export function useDashboardQuery() {
  return useQuery(dashboardQueryOptions)
}

export function useActivityQuery() {
  return useQuery(activityQueryOptions)
}

// Mutation Hooks
export function useServiceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      serviceId,
      action,
    }: {
      serviceId: string
      action: 'start' | 'stop' | 'restart'
    }) => {
      return fetchAPI<{ success: boolean }>(`/services/${serviceId}/${action}`, {
        method: 'POST',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] })
    },
  })
}

export function useAuthMutation() {
  const queryClient = useQueryClient()

  const login = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      return fetchAPI<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })
    },
    onSuccess: (data) => {
      if (!data) return
      localStorage.setItem('auth_token', data.token)
      queryClient.setQueryData(['auth', 'user'], data.user)
    },
  })

  const register = useMutation({
    mutationFn: async (data: RegisterData) => {
      return fetchAPI<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    onSuccess: (data) => {
      if (!data) return
      localStorage.setItem('auth_token', data.token)
      queryClient.setQueryData(['auth', 'user'], data.user)
    },
  })

  const logout = useMutation({
    mutationFn: async () => {
      return fetchAPI<{ success: boolean }>('/auth/logout', {
        method: 'POST',
      })
    },
    onSuccess: () => {
      localStorage.removeItem('auth_token')
      queryClient.removeQueries()
      queryClient.clear()
      queryClient.setQueryData(['auth', 'user'], null)
    },
  })

  return {
    login,
    register,
    logout,
  }
}

// Prefetch helper
export function prefetchDashboardData(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.prefetchQuery(servicesQueryOptions)
  queryClient.prefetchQuery(dashboardQueryOptions)
  queryClient.prefetchQuery(activityQueryOptions)
}

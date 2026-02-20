import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query'

export interface Model {
  id: string
  name: string
  provider: 'ollama' | 'openai' | 'anthropic' | 'google'
  modelId: string
  temperature?: number
  maxTokens?: number
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface ApiKey {
  id: string
  name: string
  provider: 'openai' | 'anthropic' | 'google' | 'custom'
  key: string
  maskedKey: string
  isActive: boolean
  createdAt: string
  lastUsed?: string
}

export interface EnvVar {
  id: string
  key: string
  value: string
  maskedValue: string
  isSensitive: boolean
  description?: string
  updatedAt: string
}

export interface ModelFormData {
  name: string
  provider: 'ollama' | 'openai' | 'anthropic' | 'google'
  modelId: string
  temperature?: number
  maxTokens?: number
  isDefault?: boolean
}

export interface ApiKeyFormData {
  name: string
  provider: 'openai' | 'anthropic' | 'google' | 'custom'
  key: string
}

export interface EnvVarFormData {
  key: string
  value: string
  isSensitive: boolean
  description?: string
}

const API_BASE = '/api/config'

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
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

export const modelsQueryOptions = queryOptions({
  queryKey: ['config', 'models'],
  queryFn: async () => {
    return fetchAPI<Model[]>('/models')
  },
  staleTime: 1000 * 30,
  gcTime: 1000 * 60 * 5,
})

export const apiKeysQueryOptions = queryOptions({
  queryKey: ['config', 'api-keys'],
  queryFn: async () => {
    return fetchAPI<ApiKey[]>('/api-keys')
  },
  staleTime: 1000 * 30,
  gcTime: 1000 * 60 * 5,
})

export const envVarsQueryOptions = queryOptions({
  queryKey: ['config', 'env-vars'],
  queryFn: async () => {
    return fetchAPI<EnvVar[]>('/env-vars')
  },
  staleTime: 1000 * 30,
  gcTime: 1000 * 60 * 5,
})

export function useModels() {
  return useQuery(modelsQueryOptions)
}

export function useApiKeys() {
  return useQuery(apiKeysQueryOptions)
}

export function useEnvVars() {
  return useQuery(envVarsQueryOptions)
}

export function useConfigMutations() {
  const queryClient = useQueryClient()

  const createModel = useMutation({
    mutationFn: async (data: ModelFormData) => {
      return fetchAPI<Model>('/models', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'models'] })
    },
  })

  const updateModel = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ModelFormData> }) => {
      return fetchAPI<Model>(`/models/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'models'] })
    },
  })

  const deleteModel = useMutation({
    mutationFn: async (id: string) => {
      return fetchAPI<{ success: boolean }>(`/models/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'models'] })
    },
  })

  const setDefaultModel = useMutation({
    mutationFn: async (id: string) => {
      return fetchAPI<{ success: boolean }>(`/models/${id}/set-default`, {
        method: 'POST',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'models'] })
    },
  })

  const createApiKey = useMutation({
    mutationFn: async (data: ApiKeyFormData) => {
      return fetchAPI<ApiKey>('/api-keys', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'api-keys'] })
    },
  })

  const updateApiKey = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ApiKeyFormData> }) => {
      return fetchAPI<ApiKey>(`/api-keys/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'api-keys'] })
    },
  })

  const deleteApiKey = useMutation({
    mutationFn: async (id: string) => {
      return fetchAPI<{ success: boolean }>(`/api-keys/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'api-keys'] })
    },
  })

  const toggleApiKey = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return fetchAPI<ApiKey>(`/api-keys/${id}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ isActive }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'api-keys'] })
    },
  })

  const createEnvVar = useMutation({
    mutationFn: async (data: EnvVarFormData) => {
      return fetchAPI<EnvVar>('/env-vars', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'env-vars'] })
    },
  })

  const updateEnvVar = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EnvVarFormData> }) => {
      return fetchAPI<EnvVar>(`/env-vars/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'env-vars'] })
    },
  })

  const deleteEnvVar = useMutation({
    mutationFn: async (id: string) => {
      return fetchAPI<{ success: boolean }>(`/env-vars/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'env-vars'] })
    },
  })

  return {
    createModel,
    updateModel,
    deleteModel,
    setDefaultModel,
    createApiKey,
    updateApiKey,
    deleteApiKey,
    toggleApiKey,
    createEnvVar,
    updateEnvVar,
    deleteEnvVar,
  }
}

export function prefetchConfigData(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.prefetchQuery(modelsQueryOptions)
  queryClient.prefetchQuery(apiKeysQueryOptions)
  queryClient.prefetchQuery(envVarsQueryOptions)
}

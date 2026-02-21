import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
}

interface ServiceStatus {
  id: string
  status: 'running' | 'stopped' | 'error' | 'warning'
  lastUpdated: string
}

interface ServicesState {
  services: Record<string, ServiceStatus>
  updateServiceStatus: (id: string, status: ServiceStatus['status']) => void
  getServiceStatus: (id: string) => ServiceStatus['status'] | null
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),
      clearAuth: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) =>
        // Only persist user metadata, not the actual token or auth state
        ({
          user: state.user,
          isAuthenticated: undefined,
          token: undefined // Never persist the token
        }),
      onRehydrateStorage: () => (state) => {
        // Reset authenticated state on rehydrate since we don't persist token
        if (state) {
          state isAuthenticated = false
          state.token = null
          state.user = null
        }
      },
    }
  )
)

export const useServicesStore = create<ServicesState>((set, get) => ({
  services: {},
  updateServiceStatus: (id, status) =>
    set((state) => ({
      services: {
        ...state.services,
        [id]: {
          id,
          status,
          lastUpdated: new Date().toISOString(),
        },
      },
    })),
  getServiceStatus: (id) => {
    const service = get().services[id]
    return service ? service.status : null
  },
}))

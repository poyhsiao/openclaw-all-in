import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UserFormData {
  email: string;
  name: string;
  password?: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
}

export interface ProfileFormData {
  name: string;
  email: string;
}

export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const API_BASE = '/api'

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

export function useUsers(page: number = 1, pageSize: number = 10, search?: string) {
  return useQuery({
    queryKey: ['users', page, pageSize, search],
    queryFn: async (): Promise<UsersResponse> => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (search) params.append('search', search);

      const response = await fetchAPI<UsersResponse>(`/users?${params}`);
      return response;
    },
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: async (): Promise<User> => {
      const response = await fetchAPI<User>(`/users/${id}`);
      return response;
    },
    enabled: !!id,
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async (): Promise<User> => {
      const response = await fetchAPI<User>('/users/me');
      return response;
    },
  });
}

export function useAuditLogs(userId?: string, page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: ['audit-logs', userId, page, pageSize],
    queryFn: async (): Promise<{ logs: AuditLog[]; total: number }> => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (userId) params.append('userId', userId);

      const response = await fetchAPI<{ logs: AuditLog[]; total: number }>(`/audit-logs?${params}`);
      return response;
    },
  });
}

export function useUserMutations() {
  const queryClient = useQueryClient();

  const createUser = useMutation({
    mutationFn: async (data: UserFormData) => {
      const response = await fetchAPI<User>('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UserFormData> }) => {
      const response = await fetchAPI<User>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      await fetchAPI<{ success: boolean }>(`/users/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await fetchAPI<User>('/users/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const changePassword = useMutation({
    mutationFn: async (data: ChangePasswordFormData) => {
      const response = await fetchAPI<{ success: boolean }>('/users/me/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    },
  });

  return {
    createUser,
    updateUser,
    deleteUser,
    updateProfile,
    changePassword,
  };
}

import { api } from '@/services/api';
import type { User, UserStats } from '@/services/api/schemas/user.schema';

export async function getMe(): Promise<User> {
  const res = await api.get<User>('/users/me');
  return res.data;
}

export async function getMyStats(): Promise<UserStats> {
  const res = await api.get<UserStats>('/users/me/stats');
  return res.data;
}

export async function updateMe(data: {
  displayName?: string;
  username?: string;
  avatarUrl?: string | null;
  bio?: string;
}): Promise<User> {
  const res = await api.patch<User>('/users/me', data);
  return res.data;
}

export async function searchUsers(query: string): Promise<User[]> {
  const res = await api.get<User[]>('/users/search', {
    params: { q: query },
  });
  return res.data;
}

export async function getUserById(id: string): Promise<User> {
  const res = await api.get<User>(`/users/${id}`);
  return res.data;
}

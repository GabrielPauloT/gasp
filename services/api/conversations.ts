import { api } from '@/services/api';
import type { PaginatedResponse } from '@/services/api';
import type { Conversation } from '@/types/chat';

export async function listConversations(params?: {
  cursor?: string;
  limit?: number;
}): Promise<PaginatedResponse<Conversation>> {
  const res = await api.get<PaginatedResponse<Conversation>>('/conversations', {
    params,
  });
  return res.data;
}

export async function getOrCreateConversation(
  participantId: string,
): Promise<Conversation> {
  const res = await api.post<Conversation>('/conversations', { participantId });
  return res.data;
}

export async function getConversation(id: string): Promise<Conversation> {
  const res = await api.get<Conversation>(`/conversations/${id}`);
  return res.data;
}

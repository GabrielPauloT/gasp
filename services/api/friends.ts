import { api } from '@/services/api';
import type { Friend } from '@/types/user';

interface FriendRequestRequester {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

interface FriendRequest {
  friendshipId: string;
  requester: FriendRequestRequester;
  createdAt: string;
}

export async function listFriends(): Promise<Friend[]> {
  const res = await api.get<Friend[]>('/friends');
  return res.data;
}

export async function getPendingRequests(): Promise<FriendRequest[]> {
  const res = await api.get<FriendRequest[]>('/friends/requests');
  return res.data;
}

export async function sendRequest(addresseeId: string): Promise<void> {
  await api.post('/friends/request', { addresseeId });
}

export async function acceptRequest(friendshipId: string): Promise<void> {
  await api.post('/friends/accept', { friendshipId });
}

export async function rejectRequest(friendshipId: string): Promise<void> {
  await api.post('/friends/reject', { friendshipId });
}

export async function removeFriend(friendshipId: string): Promise<void> {
  await api.delete(`/friends/${friendshipId}`);
}

export type { FriendRequest };

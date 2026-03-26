import { api } from '@/services/api';
import type { Gasp, ApiPendingGasp, ApiGasp } from '@/types/gasp';

interface SendGaspInput {
  recipientId: string;
  imageUrl: string;
  mediaType?: 'image' | 'video';
  blurhash?: string;
  textOverlay?: string;
}

interface BatchGaspInput {
  recipientIds: string[];
  imageUrl: string;
  mediaType?: 'image' | 'video';
  blurhash?: string;
  textOverlay?: string;
}

/** Normalize backend pending gasp ({gasp, sender}) → frontend Gasp */
function normalizePendingGasp(item: ApiPendingGasp): Gasp {
  return {
    id: item.gasp.id,
    senderId: item.gasp.senderId,
    senderName: item.sender.displayName,
    senderAvatarUrl: item.sender.avatarUrl,
    imageUri: item.gasp.imageUrl,
    mediaType: item.gasp.mediaType ?? 'image',
    blurhash: item.gasp.blurhash ?? '',
    textOverlay: item.gasp.textOverlay ?? undefined,
    status: item.gasp.status,
    createdAt: item.gasp.createdAt,
    expiresAt: item.gasp.expiresAt,
    viewedAt: item.gasp.viewedAt ?? undefined,
  };
}

/** Normalize backend raw gasp → frontend Gasp (no sender info) */
function normalizeGasp(raw: ApiGasp): Gasp {
  return {
    id: raw.id,
    senderId: raw.senderId,
    senderName: '',
    senderAvatarUrl: null,
    imageUri: raw.imageUrl,
    mediaType: raw.mediaType ?? 'image',
    blurhash: raw.blurhash ?? '',
    textOverlay: raw.textOverlay ?? undefined,
    status: raw.status,
    createdAt: raw.createdAt,
    expiresAt: raw.expiresAt,
    viewedAt: raw.viewedAt ?? undefined,
  };
}

export async function sendGasp(data: SendGaspInput): Promise<Gasp> {
  const res = await api.post<ApiGasp>('/gasps', data);
  return normalizeGasp(res.data);
}

export async function sendBatchGasp(data: BatchGaspInput): Promise<Gasp[]> {
  const res = await api.post<ApiGasp[]>('/gasps/batch', data);
  return res.data.map(normalizeGasp);
}

export async function getPendingGasps(): Promise<Gasp[]> {
  const res = await api.get<ApiPendingGasp[]>('/gasps/pending');
  return res.data.map(normalizePendingGasp);
}

export async function getSentGasps(): Promise<Gasp[]> {
  const res = await api.get<ApiGasp[]>('/gasps/sent');
  return res.data.map(normalizeGasp);
}

export async function markViewed(gaspId: string): Promise<void> {
  await api.patch(`/gasps/${gaspId}/view`);
}

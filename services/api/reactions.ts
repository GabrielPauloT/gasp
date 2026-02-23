import { api } from '@/services/api';
import type { Reaction, ApiReaction } from '@/types/gasp';

/** Normalize backend reaction → frontend Reaction */
function normalizeReaction(raw: ApiReaction): Reaction {
  return {
    id: raw.id,
    gaspId: raw.gaspId,
    reactorId: raw.reactorId,
    reactorName: '',
    reactionVideoUri: raw.videoUrl,
    originalImageUri: '',
    capturedAt: raw.createdAt,
  };
}

export async function createReaction(data: {
  gaspId: string;
  videoUrl: string;
}): Promise<Reaction> {
  const res = await api.post<ApiReaction>('/reactions', data);
  return normalizeReaction(res.data);
}

export async function getReactions(gaspId: string): Promise<Reaction[]> {
  const res = await api.get<ApiReaction[]>(`/reactions/gasps/${gaspId}`);
  return res.data.map(normalizeReaction);
}

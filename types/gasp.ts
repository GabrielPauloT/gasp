export type GaspStatus = 'pending' | 'viewed' | 'expired';

export interface Gasp {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl: string | null;
  imageUri: string;
  blurhash: string;
  status: GaspStatus;
  createdAt: string;
  expiresAt: string;
  viewedAt?: string;
}

export interface Reaction {
  id: string;
  gaspId: string;
  reactorId: string;
  reactorName: string;
  reactionImageUri: string;
  originalImageUri: string;
  capturedAt: string;
}

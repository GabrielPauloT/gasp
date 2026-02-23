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

/** Raw gasp as returned by the backend */
export interface ApiGasp {
  id: string;
  senderId: string;
  recipientId: string;
  imageUrl: string;
  blurhash: string | null;
  status: GaspStatus;
  createdAt: string;
  expiresAt: string;
  viewedAt?: string | null;
}

/** Pending gasp response includes sender info */
export interface ApiPendingGasp {
  gasp: ApiGasp;
  sender: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
}

export interface Reaction {
  id: string;
  gaspId: string;
  reactorId: string;
  reactorName: string;
  reactionVideoUri: string;
  originalImageUri: string;
  capturedAt: string;
}

/** Raw reaction as returned by the backend */
export interface ApiReaction {
  id: string;
  gaspId: string;
  reactorId: string;
  videoUrl: string;
  createdAt: string;
}

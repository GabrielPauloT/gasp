import { z } from 'zod';

export const GaspStatusSchema = z.enum(['pending', 'viewed', 'expired']);
export type GaspStatus = z.infer<typeof GaspStatusSchema>;

export const GaspMediaTypeSchema = z.enum(['image', 'video']);
export type GaspMediaType = z.infer<typeof GaspMediaTypeSchema>;

export const ApiGaspSchema = z.object({
  id: z.string(),
  senderId: z.string(),
  recipientId: z.string(),
  imageUrl: z.string(),
  mediaType: GaspMediaTypeSchema.nullable().optional(),
  blurhash: z.string().nullable(),
  textOverlay: z.string().nullable().optional(),
  status: GaspStatusSchema,
  createdAt: z.string(),
  expiresAt: z.string(),
  viewedAt: z.string().nullable().optional(),
});

export const GaspSchema = z.object({
  id: z.string(),
  senderId: z.string(),
  senderName: z.string(),
  senderAvatarUrl: z.string().nullable(),
  imageUri: z.string(),
  mediaType: GaspMediaTypeSchema,
  blurhash: z.string(),
  textOverlay: z.string().optional(),
  status: GaspStatusSchema,
  createdAt: z.string(),
  expiresAt: z.string(),
  viewedAt: z.string().optional(),
});

export type Gasp = z.infer<typeof GaspSchema>;

export const ApiPendingGaspSchema = z.object({
  gasp: ApiGaspSchema,
  sender: z.object({
    id: z.string(),
    displayName: z.string(),
    username: z.string(),
    avatarUrl: z.string().nullable(),
  }),
});

export type ApiGasp = z.infer<typeof ApiGaspSchema>;
export type ApiPendingGasp = z.infer<typeof ApiPendingGaspSchema>;

export function normalizePendingGasp(item: ApiPendingGasp): Gasp {
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

export function normalizeGasp(raw: z.infer<typeof ApiGaspSchema>): Gasp {
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

export const ApiReactionSchema = z.object({
  id: z.string(),
  gaspId: z.string(),
  reactorId: z.string(),
  videoUrl: z.string(),
  createdAt: z.string(),
});

export type ApiReaction = z.infer<typeof ApiReactionSchema>;

export const ReactionSchema = z.object({
  id: z.string(),
  gaspId: z.string(),
  reactorId: z.string(),
  reactorName: z.string(),
  reactionVideoUri: z.string(),
  originalImageUri: z.string(),
  capturedAt: z.string(),
});

export type Reaction = z.infer<typeof ReactionSchema>;

export function normalizeReaction(raw: z.infer<typeof ApiReactionSchema>): Reaction {
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

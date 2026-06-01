import { router } from 'expo-router';
import { cacheMedia } from './mediaCache';

// ── Camera Preview ───────────────────────────────────────────────────
interface CameraPreviewParams {
  imageUri: string;
  isVideo?: boolean;
  fromGallery?: boolean;
}

export function openCameraPreview({ imageUri, isVideo, fromGallery }: CameraPreviewParams) {
  router.push({
    pathname: '/(modals)/camera-preview',
    params: {
      imageUri,
      ...(isVideo && { isVideo: 'true' }),
      ...(fromGallery && { fromGallery: 'true' }),
    },
  });
}

// ── Send Gasp ────────────────────────────────────────────────────────
interface SendGaspParams {
  imageUri: string;
  isVideo?: boolean;
  textOverlay?: string;
}

export function openSendGasp({ imageUri, isVideo, textOverlay }: SendGaspParams) {
  router.push({
    pathname: '/(modals)/send-gasp',
    params: {
      imageUri,
      ...(isVideo && { isVideo: 'true' }),
      ...(textOverlay && { textOverlay }),
    },
  });
}

// ── View Gasp ────────────────────────────────────────────────────────
interface GaspViewerParams {
  imageUri: string;
  senderName: string;
  mediaType?: 'image' | 'video';
  blurhash?: string;
  gaspId?: string;
  conversationId?: string;
  messageId?: string;
  textOverlay?: string;
}

export async function openGaspViewer(params: GaspViewerParams): Promise<void> {
  const { imageUri, senderName, mediaType, blurhash, gaspId, conversationId, messageId, textOverlay } = params;

  let localUri = imageUri;
  try {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);
    localUri = await cacheMedia(imageUri, expiry.toISOString());
  } catch {
    // Fallback to remote URL
  }

  router.push({
    pathname: '/(modals)/view-gasp',
    params: {
      ...(gaspId && { gaspId }),
      chatImageUri: localUri,
      chatSenderName: senderName,
      chatMediaType: mediaType ?? 'image',
      chatBlurhash: blurhash ?? '',
      chatConversationId: conversationId ?? '',
      chatMessageId: messageId ?? '',
      chatTextOverlay: textOverlay ?? '',
    },
  });
}

// ── Chat ─────────────────────────────────────────────────────────────
interface ChatParams {
  conversationId: string;
  name?: string;
  avatarUrl?: string;
}

export function openChat({ conversationId, name, avatarUrl }: ChatParams) {
  router.push({
    pathname: '/chat/[id]',
    params: {
      id: conversationId,
      ...(name && { name }),
      ...(avatarUrl && { avatarUrl }),
    },
  });
}

// ── Friend Profile ────────────────────────────────────────────────────
interface FriendProfileParams {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
}

export function openFriendProfile({ userId, displayName, avatarUrl }: FriendProfileParams) {
  router.push({
    pathname: '/(modals)/friend-profile',
    params: { userId, displayName, avatarUrl: avatarUrl ?? '' },
  });
}

// ── Reaction Result ──────────────────────────────────────────────────
interface ReactionResultParams {
  reactionVideoUri: string;
  originalImageUri: string;
  senderName: string;
  gaspId: string;
}

export function openReactionResult({ reactionVideoUri, originalImageUri, senderName, gaspId }: ReactionResultParams) {
  router.push({
    pathname: '/(modals)/reaction-result',
    params: { reactionVideoUri, originalImageUri, senderName, gaspId },
  });
}

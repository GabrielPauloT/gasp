import { router } from 'expo-router';
import { cacheMedia } from './mediaCache';

interface OpenGaspParams {
  imageUri: string;
  senderName: string;
  mediaType?: 'image' | 'video';
  blurhash?: string;
  conversationId?: string;
  messageId?: string;
  textOverlay?: string;
}

/**
 * Centralized gasp viewer — downloads media to local cache, then opens view-gasp modal.
 * Since the file is local when the modal opens, there's zero loading delay.
 */
export async function openGaspViewer(params: OpenGaspParams): Promise<void> {
  const { imageUri, senderName, mediaType, blurhash, conversationId, messageId, textOverlay } = params;

  // Download to local cache — returns local file:// URI
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

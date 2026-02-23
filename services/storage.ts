import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

type MediaType = 'gasps' | 'reactions' | 'avatars';

// ── MIME type mapping ─────────────────────────────────────────────────
const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  heic: 'image/heic',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
};


function getMimeType(extension: string): string {
  return MIME_MAP[extension] ?? 'application/octet-stream';
}

/**
 * Convert a local file URI to a Blob for upload.
 */
async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return response.blob();
}

/**
 * Generate a unique storage path for a media file.
 */
function buildStoragePath(
  type: MediaType,
  userId: string,
  extension: string = 'jpg'
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${type}/${userId}/${timestamp}_${random}.${extension}`;
}

/**
 * Detect file extension from URI.
 */
function getExtension(uri: string): string {
  const match = uri.match(/\.(\w+)(?:\?.*)?$/);
  if (match) return match[1].toLowerCase();
  return 'jpg';
}


export interface UploadResult {
  downloadUrl: string;
  storagePath: string;
}

export interface UploadProgress {
  /** 0 to 1 */
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
}

/**
 * Upload a local image/video URI to Firebase Storage.
 *
 * @param uri         - Local file URI (file://) or remote URL
 * @param type        - Bucket folder: 'gasps' | 'reactions' | 'avatars'
 * @param userId      - Current user ID (for folder isolation)
 * @param onProgress  - Optional progress callback (0-1)
 * @returns           - { downloadUrl, storagePath }
 *
 * @throws Error if userId is missing
 */
export async function uploadMedia(
  uri: string,
  type: MediaType,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  if (!userId) {
    throw new Error('Cannot upload without a user ID.');
  }

  const extension = getExtension(uri);
  const storagePath = buildStoragePath(type, userId, extension);
  const storageRef = ref(storage, storagePath);
  const contentType = getMimeType(extension);

  const blob = await uriToBlob(uri);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, blob, {
      contentType,
      customMetadata: {
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
        mediaType: type,
      },
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = snapshot.bytesTransferred / snapshot.totalBytes;
        onProgress?.({
          progress,
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
        });
      },
      (error) => {
        if (typeof (blob as any).close === 'function') {
          (blob as any).close();
        }
        reject(error);
      },
      async () => {
        if (typeof (blob as any).close === 'function') {
          (blob as any).close();
        }
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ downloadUrl, storagePath });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

/**
 * Upload a gasp image/video. Convenience wrapper.
 */
export async function uploadGasp(
  uri: string,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  return uploadMedia(uri, 'gasps', userId, onProgress);
}

/**
 * Upload a reaction video. Convenience wrapper.
 */
export async function uploadReaction(
  uri: string,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  return uploadMedia(uri, 'reactions', userId, onProgress);
}

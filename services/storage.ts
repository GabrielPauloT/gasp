import {
  getStorage,
  ref,
  putFile,
  getDownloadURL,
} from '@react-native-firebase/storage';
import { getAuth } from '@react-native-firebase/auth';

export type MediaType = 'gasps' | 'reactions' | 'avatars';

/**
 * Generate a unique storage path for a media file.
 */
function buildStoragePath(
  type: MediaType,
  userId: string,
  extension: string = 'jpg',
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
  if (match) return match[1]!.toLowerCase();
  return 'jpg';
}

/**
 * Strip file:// prefix for native putFile (expects a raw path).
 */
function toLocalPath(uri: string): string {
  return uri.startsWith('file://') ? uri.slice(7) : uri;
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
 * Upload a local image/video to Firebase Storage using the native SDK.
 * Auth is shared with @react-native-firebase/auth — no permission issues.
 */
export async function uploadMedia(
  uri: string,
  type: MediaType,
  userId: string,
  onProgress?: (progress: UploadProgress) => void,
): Promise<UploadResult> {
  const firebaseUid = getAuth().currentUser?.uid;
  if (!firebaseUid) {
    throw new Error('Cannot upload without Firebase authentication.');
  }

  const extension = getExtension(uri);
  const storagePath = buildStoragePath(type, firebaseUid, extension);
  const storageRef = ref(getStorage(), storagePath);

  return new Promise((resolve, reject) => {
    const task = putFile(storageRef, toLocalPath(uri), {
      customMetadata: {
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
        mediaType: type,
      },
    });

    task.on(
      'state_changed',
      (snapshot) => {
        onProgress?.({
          progress: snapshot.bytesTransferred / snapshot.totalBytes,
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
        });
      },
      (error) => reject(error),
      async () => {
        try {
          const downloadUrl = await getDownloadURL(storageRef);
          resolve({ downloadUrl, storagePath });
        } catch (error) {
          reject(error);
        }
      },
    );
  });
}

/**
 * Upload a gasp image/video. Convenience wrapper.
 */
export async function uploadGasp(
  uri: string,
  userId: string,
  onProgress?: (progress: UploadProgress) => void,
): Promise<UploadResult> {
  return uploadMedia(uri, 'gasps', userId, onProgress);
}

/**
 * Upload a reaction video. Convenience wrapper.
 */
export async function uploadReaction(
  uri: string,
  userId: string,
  onProgress?: (progress: UploadProgress) => void,
): Promise<UploadResult> {
  return uploadMedia(uri, 'reactions', userId, onProgress);
}

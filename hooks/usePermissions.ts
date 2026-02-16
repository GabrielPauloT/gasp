import { useEffect } from 'react';
import { useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useAppStore } from '@/stores/appStore';

export function usePermissions() {
  const { permissions, setPermissions } = useAppStore();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();

  useEffect(() => {
    if (cameraPermission) {
      setPermissions({ camera: cameraPermission.granted });
    }
  }, [cameraPermission, setPermissions]);

  useEffect(() => {
    if (mediaPermission) {
      setPermissions({ photos: mediaPermission.granted });
    }
  }, [mediaPermission, setPermissions]);

  const requestAll = async () => {
    const camera = await requestCameraPermission();
    const media = await requestMediaPermission();

    setPermissions({
      camera: camera.granted,
      photos: media.granted,
    });

    return {
      camera: camera.granted,
      photos: media.granted,
    };
  };

  return {
    permissions,
    cameraGranted: cameraPermission?.granted ?? false,
    photosGranted: mediaPermission?.granted ?? false,
    requestCameraPermission,
    requestMediaPermission,
    requestAll,
  };
}

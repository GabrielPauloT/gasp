import { useRef, useCallback } from 'react';
import { CameraView } from 'expo-camera';
import { useCameraStore } from '@/stores/cameraStore';

export function useCamera() {
  const cameraRef = useRef<CameraView>(null);
  const { facing, flashMode, toggleFacing, cycleFlash, setCapturedUri, setRecording } =
    useCameraStore();

  const takePicture = useCallback(async () => {
    if (!cameraRef.current) return null;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (photo?.uri) {
        setCapturedUri(photo.uri);
        return photo.uri;
      }
      return null;
    } catch (error) {
      console.error('Failed to take picture:', error);
      return null;
    }
  }, [setCapturedUri]);

  const startRecording = useCallback(async () => {
    if (!cameraRef.current) return;

    try {
      setRecording(true);
      const video = await cameraRef.current.recordAsync({
        maxDuration: 10,
      });

      if (video?.uri) {
        setCapturedUri(video.uri);
      }
    } catch (error) {
      console.error('Failed to record:', error);
    } finally {
      setRecording(false);
    }
  }, [setCapturedUri, setRecording]);

  const stopRecording = useCallback(() => {
    if (!cameraRef.current) return;
    cameraRef.current.stopRecording();
    setRecording(false);
  }, [setRecording]);

  return {
    cameraRef,
    facing,
    flashMode,
    toggleFacing,
    cycleFlash,
    takePicture,
    startRecording,
    stopRecording,
  };
}

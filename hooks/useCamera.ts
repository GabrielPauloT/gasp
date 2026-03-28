import { useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { CameraView, useMicrophonePermissions } from 'expo-camera';
import { useCameraStore } from '@/stores/cameraStore';

export function useCamera() {
  const cameraRef = useRef<CameraView>(null);
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
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

  const startRecording = useCallback(async (): Promise<string | null> => {
    if (!cameraRef.current) {
      return null;
    }

    // Ensure microphone permission before recording
    if (!micPermission?.granted) {
      const { granted } = await requestMicPermission();
      if (!granted) {
        Alert.alert(
          'Microphone required',
          'GASP needs microphone access to record videos. Please enable it in Settings.',
        );
        return null;
      }
    }

    try {
      setRecording(true);
      const video = await cameraRef.current.recordAsync({
        maxDuration: 10,
      });

      if (video?.uri) {
        setCapturedUri(video.uri);
        return video.uri;
      }
      return null;
    } catch (error) {
      Alert.alert(
        'Recording failed',
        'Video recording is not supported on this device. Try on a physical device.',
      );
      return null;
    } finally {
      setRecording(false);
    }
  }, [micPermission, requestMicPermission, setCapturedUri, setRecording]);

  const stopRecording = useCallback(() => {
    if (!cameraRef.current) return;
    cameraRef.current.stopRecording();
  }, []);

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

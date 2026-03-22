import { useState, useEffect } from 'react';
import { StyleSheet, View, Image, Pressable, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useVideoPlayer, VideoView } from 'expo-video';
import { X, Send, RotateCcw, Type } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { colors } from '@/constants/colors';

export default function CameraPreviewScreen() {
  const { imageUri, isVideo } = useLocalSearchParams<{ imageUri: string; isVideo?: string }>();
  const insets = useSafeAreaInsets();
  const isVideoMode = isVideo === 'true';
  const [videoReady, setVideoReady] = useState(false);

  const videoPlayer = useVideoPlayer(isVideoMode ? imageUri : null, (p) => {
    p.loop = true;
    p.play();
  });

  useEffect(() => {
    if (!isVideoMode) return;
    if (videoPlayer.status === 'readyToPlay') {
      setVideoReady(true);
      return;
    }
    const sub = videoPlayer.addListener('statusChange', ({ status }: { status: string }) => {
      if (status === 'readyToPlay') setVideoReady(true);
    });
    return () => sub.remove();
  }, [isVideoMode, videoPlayer]);

  const handleClose = () => {
    router.back();
  };

  const handleRetake = () => {
    router.back();
  };

  const handleSend = () => {
    router.push({
      pathname: '/(modals)/send-gasp',
      params: { imageUri, ...(isVideoMode && { isVideo: 'true' }) },
    });
  };

  return (
    <View style={styles.container}>
      {/* Media preview */}
      {imageUri ? (
        isVideoMode ? (
          <View style={styles.preview}>
            <VideoView
              player={videoPlayer}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              nativeControls={false}
            />
            {!videoReady && (
              <ActivityIndicator size="large" color="#FFFFFF" />
            )}
          </View>
        ) : (
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
        )
      ) : (
        <View style={styles.preview}>
          <Text variant="body" color={colors.textSecondary}>
            {'No image captured'}
          </Text>
        </View>
      )}

      {/* Top bar */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.topBar, { paddingTop: insets.top + 8 }]}
      >
        <Pressable onPress={handleClose} style={styles.iconButton}>
          <X size={28} color="#FFFFFF" />
        </Pressable>
      </Animated.View>

      {/* Bottom controls */}
      <Animated.View
        entering={FadeInUp.duration(400).delay(200)}
        style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}
      >
        <Pressable onPress={handleRetake} style={styles.bottomAction}>
          <View style={styles.actionCircle}>
            <RotateCcw size={22} color="#FFFFFF" />
          </View>
          <Text variant="caption" style={styles.actionLabel}>
            {'Retake'}
          </Text>
        </Pressable>

        <Pressable onPress={handleSend} style={styles.sendButton}>
          <Send size={24} color="#FFFFFF" />
          <Text variant="body" style={styles.sendText}>
            {'Send'}
          </Text>
        </Pressable>

        <Pressable style={styles.bottomAction}>
          <View style={styles.actionCircle}>
            <Type size={22} color="#FFFFFF" />
          </View>
          <Text variant="caption" style={styles.actionLabel}>
            {'Text'}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  preview: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    zIndex: 10,
  },
  bottomAction: {
    alignItems: 'center',
    gap: 6,
  },
  actionCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 11,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 32,
    borderCurve: 'continuous',
  },
  sendText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 17,
  },
});

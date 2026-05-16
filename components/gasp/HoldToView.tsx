import { useCallback, useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Text } from '@/components/ui/Text';
import { parseTextOverlay, TextOverlayRenderer } from './TextOverlayRenderer';
import { GaspTimer } from './GaspTimer';
import Animated, {
  useAnimatedStyle,
  useAnimatedReaction,
  runOnJS,
  interpolate,
  type SharedValue,
} from 'react-native-reanimated';
import { colors } from '@/constants/colors';
import { getCachedUri } from '@/services/mediaCache';
import type { GaspMediaType } from '@/services/api/schemas/gasp.schema';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HoldToViewProps {
  imageUri: string;
  mediaType?: GaspMediaType;
  blurhash?: string;
  senderName: string;
  /** JSON text overlay data from message content */
  textOverlayJson?: string;
  /** Shared value controlado pelo pai (0 = não segurando, 1 = segurando) */
  isHolding: SharedValue<number>;
  /** Shared value controlado pelo pai (0 a 1, progresso do hold) */
  holdProgress: SharedValue<number>;
  /** Callback com duração do vídeo em ms (chamado quando o player carrega) */
  onVideoLoad?: (durationMs: number) => void;
}

export function HoldToView({
  imageUri,
  mediaType = 'image',
  blurhash,
  senderName,
  textOverlayJson,
  isHolding,
  holdProgress,
  onVideoLoad,
}: HoldToViewProps) {
  const isVideo = mediaType === 'video';
  const textOverlay = textOverlayJson ? parseTextOverlay(textOverlayJson) : null;
  // Use cached local path if available, otherwise use the URI as-is
  // (openGaspViewer already downloads to local cache before navigating)
  const resolvedUri = imageUri.startsWith('file://') ? imageUri : (getCachedUri(imageUri) ?? imageUri);
  // Pass a dummy silent URI for non-video to avoid "shared object released" crash
  const videoPlayer = useVideoPlayer(isVideo ? resolvedUri : 'about:blank', (p) => {
    p.loop = false;
    p.playbackRate = 1.0;
    // Don't auto-play — controlled by hold gesture
  });

  // Report video duration to parent when player is ready
  useEffect(() => {
    if (!isVideo || !onVideoLoad) return;
    const handleReady = () => {
      if (videoPlayer.duration > 0) {
        onVideoLoad(Math.ceil(videoPlayer.duration * 1000));
      }
    };
    const sub = videoPlayer.addListener('statusChange', ({ status }: { status: string }) => {
      if (status === 'readyToPlay') handleReady();
    });
    if (videoPlayer.status === 'readyToPlay') handleReady();
    return () => sub.remove();
  }, [isVideo, videoPlayer, onVideoLoad]);

  const startVideo = useCallback(() => {
    if (!isVideo) return;
    try {
      videoPlayer.currentTime = 0;
      videoPlayer.play();
    } catch {}
  }, [videoPlayer, isVideo]);

  const pauseVideo = useCallback(() => {
    if (!isVideo) return;
    try {
      videoPlayer.pause();
    } catch {}
  }, [videoPlayer, isVideo]);

  useAnimatedReaction(
    () => isHolding.get(),
    (current, previous) => {
      if (current === 1 && previous !== 1) {
        runOnJS(startVideo)();
      } else if (current === 0 && previous !== 0) {
        runOnJS(pauseVideo)();
      }
    },
  );

  const imageStyle = useAnimatedStyle(() => ({
    opacity: interpolate(isHolding.get(), [0, 1], [0, 1]),
  }));

  const instructionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(isHolding.get(), [0, 1], [1, 0]),
    transform: [
      { scale: interpolate(isHolding.get(), [0, 1], [1, 0.9]) },
    ],
  }));

  const timerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(isHolding.get(), [0, 1], [0, 1]),
  }));

  return (
    <View style={styles.container}>
      {/* Blurred preview (always visible) */}
      {isVideo ? (
        <Image
          placeholder={blurhash ? { blurhash } : undefined}
          style={styles.blurredImage}
          contentFit="cover"
        />
      ) : (
        <Image
          source={{ uri: resolvedUri }}
          placeholder={blurhash ? { blurhash } : undefined}
          style={styles.blurredImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          blurRadius={30}
        />
      )}

      {/* Revealed media (visible on hold) */}
      <Animated.View style={[styles.revealedContainer, imageStyle]}>
        {isVideo && videoPlayer ? (
          <VideoView
            player={videoPlayer}
            style={styles.revealedImage}
            contentFit="cover"
            nativeControls={false}
          />
        ) : (
          <Image
            source={{ uri: resolvedUri }}
            style={styles.revealedImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />
        )}
        {textOverlay && <TextOverlayRenderer data={textOverlay} />}
      </Animated.View>

      {/* Hold instruction overlay */}
      <Animated.View style={[styles.instructionOverlay, instructionStyle]}>
        <GaspTimer progress={holdProgress} size={100} strokeWidth={3} />
        <Text variant="subtitle" style={styles.senderName}>
          {senderName}
        </Text>
        <Text variant="caption" style={styles.instruction}>
          {'HOLD TO VIEW'}
        </Text>
      </Animated.View>

      {/* Timer during hold */}
      <Animated.View style={[styles.timerContainer, timerStyle]}>
        <GaspTimer progress={holdProgress} size={60} strokeWidth={3} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  blurredImage: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  revealedContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  revealedImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  instructionOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    gap: 16,
  },
  senderName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  instruction: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 3,
  },
  timerContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
});

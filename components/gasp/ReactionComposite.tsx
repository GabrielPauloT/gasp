import { useRef } from 'react';
import { StyleSheet, View, Dimensions, Image } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { InlineVideo } from '@/components/ui/InlineVideo';
import type { RefObject } from 'react';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PIP_WIDTH = SCREEN_WIDTH * 0.32;
const PIP_HEIGHT = PIP_WIDTH * 1.2;
const WATERMARK_SIZE = SCREEN_WIDTH * 0.12;

interface ReactionCompositeProps {
  originalUri: string;
  originalMediaType?: 'image' | 'video';
  reactionVideoUri: string;
  /** If provided, component renders off-screen at 1080×1920 for capture */
  captureRef?: RefObject<View>;
  /** Render at full capture resolution (1080×1920) instead of screen size */
  forCapture?: boolean;
}

function OriginalMedia({ uri, mediaType, style }: { uri: string; mediaType: 'image' | 'video'; style: object }) {
  const player = useVideoPlayer(mediaType === 'video' ? uri : 'about:blank', (p) => {
    p.loop = true;
    p.muted = true;
    if (mediaType === 'video') p.play();
  });

  if (mediaType === 'video') {
    return <VideoView player={player} style={style} contentFit="contain" nativeControls={false} />;
  }
  return <ExpoImage source={{ uri }} style={style} contentFit="contain" />;
}

export function ReactionComposite({
  originalUri,
  originalMediaType = 'image',
  reactionVideoUri,
  captureRef,
  forCapture = false,
}: ReactionCompositeProps) {
  const containerRef = useRef<View>(null);
  const ref = captureRef ?? containerRef;

  const W = forCapture ? 1080 : '100%' as any;
  const H = forCapture ? 1920 : SCREEN_HEIGHT * 0.55;
  const pipW = forCapture ? 1080 * 0.32 : PIP_WIDTH;
  const pipH = pipW * 1.2;
  const wmSize = forCapture ? 1080 * 0.12 : WATERMARK_SIZE;

  return (
    <View
      ref={ref}
      collapsable={false}
      style={forCapture ? { width: 1080, height: 1920, backgroundColor: '#000', overflow: 'hidden' } : [styles.container, { flex: 1 }]}
    >
      {/* Original gasp — full background */}
      <OriginalMedia
        uri={originalUri}
        mediaType={originalMediaType}
        style={forCapture ? { width: 1080, height: 1920 } : StyleSheet.absoluteFill}
      />

      {/* Reaction video — PiP top-right */}
      <View style={[styles.pip, { width: pipW, height: pipH, top: 24, right: 12 }]}>
        <InlineVideo
          uri={reactionVideoUri}
          style={{ width: pipW, height: pipH }}
          paused={false}
          muted={false}
        />
      </View>

      {/* GASP watermark — bottom-right */}
      <Image
        source={require('@/assets/images/icon.png')}
        style={[styles.watermark, { width: wmSize, height: wmSize, bottom: 16, right: 16 }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  pip: {
    position: 'absolute',
    borderRadius: 12,
    borderCurve: 'continuous',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  watermark: {
    position: 'absolute',
    opacity: 0.7,
  },
});

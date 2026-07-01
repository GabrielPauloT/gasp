import { useState } from 'react';
import { StyleSheet, View, Image, type LayoutChangeEvent } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import { InlineVideo } from '@/components/ui/InlineVideo';

interface ReactionCompositeProps {
  originalUri: string;
  originalMediaType?: 'image' | 'video';
  reactionVideoUri: string;
  // captureRef and forCapture intentionally removed — composition is server-side
}

function OriginalMedia({
  uri,
  mediaType,
  style,
}: {
  uri: string;
  mediaType: 'image' | 'video';
  style: object;
}) {
  const player = useVideoPlayer(mediaType === 'video' ? uri : 'about:blank', (p) => {
    p.loop = true;
    p.muted = true;
    if (mediaType === 'video') p.play();
  });

  if (mediaType === 'video') {
    return (
      <VideoView
        player={player}
        style={style}
        contentFit="cover"
        nativeControls={false}
      />
    );
  }
  return <ExpoImage source={{ uri }} style={style} contentFit="cover" />;
}

export function ReactionComposite({
  originalUri,
  originalMediaType = 'image',
  reactionVideoUri,
}: ReactionCompositeProps) {
  const [containerWidth, setContainerWidth] = useState(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const watermarkSize = containerWidth > 0 ? containerWidth * 0.12 : 0;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Reaction video — left 1/3 */}
      <View style={styles.reactionPanel}>
        <InlineVideo
          uri={reactionVideoUri}
          style={StyleSheet.absoluteFill}
          paused={false}
          muted={false}
        />
      </View>

      {/* Original gasp — right 2/3 */}
      <View style={styles.gaspPanel}>
        <OriginalMedia
          uri={originalUri}
          mediaType={originalMediaType}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* GASP watermark — bottom-right of container */}
      {watermarkSize > 0 && (
        <Image
          source={require('@/assets/images/icon.png')}
          style={[
            styles.watermark,
            {
              width: watermarkSize,
              height: watermarkSize,
              bottom: 16,
              right: 16,
            },
          ]}
          resizeMode="contain"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  reactionPanel: {
    flex: 1,
    overflow: 'hidden',
  },
  gaspPanel: {
    flex: 2,
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    opacity: 0.7,
  },
});

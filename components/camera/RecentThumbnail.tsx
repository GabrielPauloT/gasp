import { StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '@/constants/colors';

interface RecentThumbnailProps {
  uri: string | null;
  onPress?: () => void;
}

export function RecentThumbnail({ uri, onPress }: RecentThumbnailProps) {
  if (!uri) return null;

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <Image
        source={{ uri }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderCurve: 'continuous',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

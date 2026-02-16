import { StyleSheet, View } from 'react-native';
import { Zap, ZapOff, RefreshCw } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Pressable } from 'react-native';

interface CameraControlsProps {
  flashMode: 'off' | 'on' | 'auto';
  onToggleFlash: () => void;
  onFlipCamera: () => void;
}

export function CameraControls({
  flashMode,
  onToggleFlash,
  onFlipCamera,
}: CameraControlsProps) {
  const FlashIcon = flashMode === 'off' ? ZapOff : Zap;
  const flashColor = flashMode === 'on' ? '#FBBF24' : '#FFFFFF';

  return (
    <View style={styles.container}>
      <Pressable onPress={onToggleFlash} style={styles.iconButton}>
        <FlashIcon size={24} color={flashColor} />
      </Pressable>

      <View style={styles.gradientBar} />

      <Pressable onPress={onFlipCamera} style={styles.iconButton}>
        <RefreshCw size={24} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderCurve: 'continuous',
  },
  gradientBar: {
    width: 60,
    height: 4,
    borderRadius: 2,
    // @ts-ignore - experimental_backgroundImage
    experimental_backgroundImage:
      'linear-gradient(90deg, #7C3AED, #EC4899, #06B6D4)',
  },
});

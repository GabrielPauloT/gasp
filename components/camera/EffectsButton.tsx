import { StyleSheet, Pressable } from 'react-native';
import { Sparkles } from 'lucide-react-native';

interface EffectsButtonProps {
  onPress?: () => void;
}

export function EffectsButton({ onPress }: EffectsButtonProps) {
  return (
    <Pressable onPress={onPress} style={styles.container}>
      <Sparkles size={24} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderCurve: 'continuous',
  },
});

import { StyleSheet, Pressable } from 'react-native';
import { Sparkles } from 'lucide-react-native';

interface EffectsButtonProps {
  onPress?: () => void;
}

export function EffectsButton({ onPress }: EffectsButtonProps) {
  return (
    <Pressable onPress={onPress} style={styles.container}>
      <Sparkles size={22} color="rgba(255, 255, 255, 0.9)" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderCurve: 'continuous',
  },
});

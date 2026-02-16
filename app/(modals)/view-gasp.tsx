import { StyleSheet, View, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { HoldToView } from '@/components/gasp/HoldToView';
import { Text } from '@/components/ui/Text';
import { colors } from '@/constants/colors';

export default function ViewGaspScreen() {
  const insets = useSafeAreaInsets();
  const { gaspId } = useLocalSearchParams<{ gaspId: string }>();

  const handleHoldComplete = () => {
    // The user viewed the full gasp
    // In production, capture reaction photo and navigate to result
  };

  const handleRelease = () => {
    // User released before completing
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <HoldToView
        imageUri="https://picsum.photos/400/800?random=1"
        senderName="Sarah"
        onHoldComplete={handleHoldComplete}
        onRelease={handleRelease}
      />

      {/* Close button */}
      <Pressable
        onPress={handleClose}
        style={[styles.closeButton, { top: insets.top + 12 }]}
      >
        <X size={24} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

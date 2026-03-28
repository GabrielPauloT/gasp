import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReactionPreview } from '@/components/gasp/ReactionPreview';
import { useGaspStore } from '@/stores/gaspStore';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';
import type { Reaction } from '@/services/api/schemas/gasp.schema';

export default function ReactionResultScreen() {
  const insets = useSafeAreaInsets();
  const { reactionVideoUri, originalImageUri, senderName, gaspId } =
    useLocalSearchParams<{
      reactionVideoUri: string;
      originalImageUri: string;
      senderName: string;
      gaspId: string;
    }>();

  const user = useAuthStore((s) => s.user);
  const { addReaction, markGaspViewed } = useGaspStore();

  const handleRetake = () => {
    // Volta ao view-gasp para segurar de novo e recapturar
    router.back();
  };

  const handleSend = () => {
    // 1. Cria o objeto de reação
    const reaction: Reaction = {
      id: `reaction-${Date.now()}`,
      gaspId: gaspId ?? '',
      reactorId: user?.id ?? 'guest',
      reactorName: user?.displayName ?? 'You',
      reactionVideoUri: reactionVideoUri ?? '',
      originalImageUri: originalImageUri ?? '',
      capturedAt: new Date().toISOString(),
    };

    // 2. Salva a reação na store
    addReaction(reaction);

    // 3. Marca o gasp como visualizado
    markGaspViewed(gaspId ?? '');

    // 4. Fecha todos os modais e volta ao inbox
    router.dismissAll();
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <ReactionPreview
        originalImageUri={originalImageUri ?? ''}
        reactionVideoUri={reactionVideoUri ?? ''}
        senderName={senderName ?? ''}
        onSend={handleSend}
        onRetake={handleRetake}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

import React, { useRef, useCallback } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sentry from '@sentry/react-native';
import { ReactionPreview } from '@/components/gasp/ReactionPreview';
import { WatermarkedComposite } from '@/components/gasp/WatermarkedComposite';
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
  const captureViewRef = useRef<View>(null);

  const handleRetake = useCallback(() => {
    router.back();
  }, []);

  const handleSend = useCallback(() => {
    const reaction: Reaction = {
      id: `reaction-${Date.now()}`,
      gaspId: gaspId ?? '',
      reactorId: user?.id ?? 'guest',
      reactorName: user?.displayName ?? 'You',
      reactionVideoUri: reactionVideoUri ?? '',
      originalImageUri: originalImageUri ?? '',
      capturedAt: new Date().toISOString(),
    };

    addReaction(reaction);
    markGaspViewed(gaspId ?? '');
    router.dismissAll();
  }, [gaspId, user, reactionVideoUri, originalImageUri, addReaction, markGaspViewed]);

  const handleSave = useCallback(async () => {
    try {
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permission needed',
          'Allow access to your photo library to save this media.',
          [{ text: 'OK' }],
        );
        return;
      }

      let uriToSave = originalImageUri ?? '';

      // Capture the watermarked composite view
      try {
        const captured = await captureRef(captureViewRef, {
          format: 'jpg',
          quality: 0.95,
          result: 'tmpfile',
        });
        uriToSave = captured;
      } catch (captureError) {
        // Fall back to saving without watermark
        Sentry.captureException(captureError);
      }

      await MediaLibrary.saveToLibraryAsync(uriToSave);
      Alert.alert('Saved', 'Saved to your camera roll.', [{ text: 'OK' }]);
    } catch (e) {
      Sentry.captureException(e);
      Alert.alert('Save failed', 'Could not save this media.', [{ text: 'OK' }]);
    }
  }, [originalImageUri]);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* Off-screen watermarked composite rendered at full resolution for capture */}
      <View style={styles.captureContainer}>
        <WatermarkedComposite
          mediaUri={originalImageUri ?? ''}
          mediaType="image"
          captureRef={captureViewRef}
        />
      </View>

      <ReactionPreview
        originalImageUri={originalImageUri ?? ''}
        reactionVideoUri={reactionVideoUri ?? ''}
        senderName={senderName ?? ''}
        onSend={handleSend}
        onRetake={handleRetake}
        onSave={handleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  captureContainer: {
    position: 'absolute',
    width: 1080,
    height: 1920,
    left: -2000,
    top: 0,
    opacity: 1,
  },
});

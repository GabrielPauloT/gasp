import { useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { GaspGrid } from '@/components/profile/GaspGrid';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';
import { colors } from '@/constants/colors';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { gaspsSent, gaspsReceived, friendsCount, sentGasps, isLoading, loadProfile } =
    useProfileStore();

  useEffect(() => {
    loadProfile();
  }, []);

  const onRefresh = useCallback(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSettingsPress = () => {
    router.push('/(modals)/settings');
  };

  const gridItems = sentGasps.map((g) => ({
    id: g.id,
    imageUri: g.imageUri,
    blurhash: g.blurhash || undefined,
  }));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 100,
        gap: 24,
      }}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <ProfileHeader
        displayName={user?.displayName ?? 'Guest'}
        username={user?.username ?? 'guest'}
        avatarUri={user?.avatarUrl ?? null}
        gaspsSent={gaspsSent}
        gaspsReceived={gaspsReceived}
        friendsCount={friendsCount}
        onSettingsPress={handleSettingsPress}
      />
      <GaspGrid items={gridItems} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

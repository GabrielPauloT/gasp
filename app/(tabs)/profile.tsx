import { useCallback } from 'react';
import { StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { StatsCard } from '@/components/profile/StatsCard';
import { ActivityCard } from '@/components/profile/ActivityCard';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';
import { colors } from '@/constants/colors';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const {
    gaspsSent, gaspsReceived, friendsCount,
    streak, reactionsReceived, gaspScore, memberSince,
    isLoading, loadProfile,
  } = useProfileStore();

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const onRefresh = useCallback(() => {
    loadProfile();
  }, [loadProfile]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 100,
        gap: 20,
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
        gaspScore={gaspScore}
        onSettingsPress={() => router.push('/(modals)/settings')}
      />
      <StatsCard
        gaspsSent={gaspsSent}
        gaspsReceived={gaspsReceived}
        friendsCount={friendsCount}
      />
      <ActivityCard
        streak={streak}
        reactionsReceived={reactionsReceived}
        memberSince={memberSince}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

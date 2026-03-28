import { useCallback } from 'react';
import { StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { StatsCard } from '@/components/profile/StatsCard';
import { ActivityCard } from '@/components/profile/ActivityCard';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStats, calculateGaspScore } from '@/hooks/queries/useProfile';
import { colors } from '@/constants/colors';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const isGuest = useAuthStore((s) => s.isGuest);
  const { data: stats, isLoading, refetch } = useProfileStats(!isGuest);

  const gaspsSent = stats?.gaspsSent ?? 0;
  const gaspsReceived = stats?.gaspsReceived ?? 0;
  const friendsCount = stats?.friendsCount ?? 0;
  const streak = stats?.streak ?? 0;
  const reactionsReceived = stats?.reactionsReceived ?? 0;
  const gaspScore = calculateGaspScore(gaspsSent, gaspsReceived, streak, reactionsReceived);
  const memberSince = user?.createdAt ?? '';

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

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

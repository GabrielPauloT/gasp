import { StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { GaspGrid } from '@/components/profile/GaspGrid';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const handleSettingsPress = () => {
    router.push('/(modals)/settings');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 100,
        gap: 24,
      }}
      contentInsetAdjustmentBehavior="automatic"
    >
      <ProfileHeader
        displayName={user?.displayName ?? 'Guest'}
        username={user?.username ?? 'guest'}
        avatarUri={user?.avatarUrl ?? null}
        gaspsSent={42}
        gaspsReceived={128}
        friendsCount={127}
        onSettingsPress={handleSettingsPress}
      />
      <GaspGrid items={[]} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

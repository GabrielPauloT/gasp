import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/components/ui/Text';
import { colors } from '@/constants/colors';
import { Settings } from 'lucide-react-native';
import { Pressable } from 'react-native';

interface ProfileHeaderProps {
  displayName: string;
  username: string;
  avatarUri: string | null;
  gaspsSent: number;
  gaspsReceived: number;
  friendsCount: number;
  onSettingsPress?: () => void;
}

export function ProfileHeader({
  displayName,
  username,
  avatarUri,
  gaspsSent,
  gaspsReceived,
  friendsCount,
  onSettingsPress,
}: ProfileHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.placeholder} />
        <Text variant="title" style={styles.screenTitle}>
          {'PROFILE'}
        </Text>
        <Pressable onPress={onSettingsPress} style={styles.settingsButton}>
          <Settings size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.avatarSection}>
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text variant="title" style={styles.avatarInitial}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text variant="title" style={styles.name}>
          {displayName}
        </Text>
        <Text variant="caption" style={styles.username}>
          {`@${username}`}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text variant="title" style={styles.statValue}>
            {gaspsSent.toString()}
          </Text>
          <Text variant="caption" style={styles.statLabel}>
            {'SENT'}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text variant="title" style={styles.statValue}>
            {gaspsReceived.toString()}
          </Text>
          <Text variant="caption" style={styles.statLabel}>
            {'RECEIVED'}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text variant="title" style={styles.statValue}>
            {friendsCount.toString()}
          </Text>
          <Text variant="caption" style={styles.statLabel}>
            {'FRIENDS'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeholder: {
    width: 36,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  username: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderCurve: 'continuous',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
});

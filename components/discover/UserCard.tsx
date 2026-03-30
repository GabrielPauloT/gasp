import { useState, memo, useMemo } from 'react';
import { StyleSheet, View, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/components/ui/Text';
import { GradientCircle } from '@/components/ui/GradientCircle';
import { UserPlus, Check } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { openFriendProfile } from '@/services/navigation';
import type { RecommendedUser, UserBadge } from '@/services/api/schemas/user.schema';

const BADGE_CONFIG: Record<Exclude<UserBadge, null>, { label: string; color: string; bg: string }> = {
  top10: { label: 'Top 10%', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  rising: { label: 'Rising', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)' },
  new: { label: 'New', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.12)' },
  active: { label: 'Active', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.12)' },
};

interface UserCardProps {
  user: RecommendedUser;
  showGradientRing?: boolean;
  onAdd: (id: string) => Promise<void>;
  isFriend?: boolean;
}

function UserCardInner({ user, showGradientRing, onAdd, isFriend }: UserCardProps) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>(
    isFriend ? 'sent' : 'idle',
  );

  const handleAdd = async () => {
    if (status !== 'idle') return;
    setStatus('sending');
    try {
      await onAdd(user.id);
      setStatus('sent');
    } catch {
      setStatus('idle');
    }
  };

  const initials = useMemo(() =>
    user.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
    [user.displayName]
  );

  const avatarContent = user.avatarUrl ? (
    <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} contentFit="cover" />
  ) : (
    <View style={styles.avatarPlaceholder}>
      <Text variant="body" style={styles.avatarInitial}>{initials}</Text>
    </View>
  );

  // Build subtitle: streak and/or mutual friends
  const subtitleParts: string[] = [];
  if (user.streak > 0) subtitleParts.push(`🔥 ${user.streak}d`);
  if (user.mutualFriendsCount > 0) subtitleParts.push(`${user.mutualFriendsCount} mutual`);

  const handleOpenProfile = () => {
    openFriendProfile({
      userId: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    });
  };

  return (
    <Pressable
      style={styles.card}
      onPress={handleOpenProfile}
      accessibilityLabel={`View ${user.displayName}'s profile`}
    >
      {/* Badge as top accent strip */}
      {user.badge && (
        <View style={[styles.badgeStrip, { backgroundColor: BADGE_CONFIG[user.badge].bg }]}>
          <Text variant="caption" style={[styles.badgeText, { color: BADGE_CONFIG[user.badge].color }]}>
            {BADGE_CONFIG[user.badge].label}
          </Text>
        </View>
      )}

      {/* Avatar — hero element */}
      <View style={styles.avatarSection}>
        {showGradientRing ? (
          <GradientCircle size={64}>{avatarContent}</GradientCircle>
        ) : (
          <View style={styles.avatarRing}>{avatarContent}</View>
        )}
      </View>

      {/* Identity */}
      <Text variant="body" style={styles.name} numberOfLines={1}>{user.displayName}</Text>
      <Text variant="caption" style={styles.username} numberOfLines={1}>@{user.username}</Text>

      {/* Gasp Score — single highlighted metric */}
      <View style={styles.scoreRow}>
        <Text variant="caption" style={styles.scoreValue}>{user.gaspScore}</Text>
        <Text variant="caption" style={styles.scoreLabel}> score</Text>
      </View>

      {/* Subtitle — streak + mutual as subtle text */}
      {subtitleParts.length > 0 && (
        <Text variant="caption" style={styles.subtitle} numberOfLines={1}>
          {subtitleParts.join('  ·  ')}
        </Text>
      )}

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Add button — full width */}
      {status === 'idle' && (
        <Pressable
          style={styles.addButton}
          onPress={handleAdd}
          accessibilityRole="button"
          accessibilityLabel={`Add ${user.displayName}`}
        >
          <UserPlus size={14} color="#FFFFFF" />
          <Text variant="caption" style={styles.addText}>Add</Text>
        </Pressable>
      )}
      {status === 'sending' && (
        <View style={styles.addButton}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      )}
      {status === 'sent' && (
        <View style={styles.sentButton}>
          <Check size={14} color={colors.success} />
          <Text variant="caption" style={styles.sentText}>
            {isFriend ? 'Friends' : 'Sent'}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export const UserCard = memo(UserCardInner, (prev, next) =>
  prev.user.id === next.user.id
  && prev.isFriend === next.isFriend
  && prev.showGradientRing === next.showGradientRing
);

const CARD_WIDTH = 160;
const AVATAR_INNER = 54;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    minHeight: 230,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderCurve: 'continuous',
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    overflow: 'hidden',
  },
  badgeStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  avatarSection: {
    marginTop: 12,
    marginBottom: 10,
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: AVATAR_INNER,
    height: AVATAR_INNER,
    borderRadius: AVATAR_INNER / 2,
  },
  avatarPlaceholder: {
    width: AVATAR_INNER,
    height: AVATAR_INNER,
    borderRadius: AVATAR_INNER / 2,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  username: {
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: 6,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.accentCyan,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textTertiary,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  spacer: {
    flex: 1,
    minHeight: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    width: '100%',
    paddingVertical: 9,
    borderRadius: 12,
    borderCurve: 'continuous',
  },
  addText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surfaceElevated,
    width: '100%',
    paddingVertical: 9,
    borderRadius: 12,
    borderCurve: 'continuous',
  },
  sentText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

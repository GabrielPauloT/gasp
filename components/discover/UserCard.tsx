import { useState } from 'react';
import { StyleSheet, View, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/components/ui/Text';
import { GradientCircle } from '@/components/ui/GradientCircle';
import { UserPlus, Check, Flame, Users, Zap } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import type { RecommendedUser, UserBadge } from '@/types/discover';

const BADGE_CONFIG: Record<Exclude<UserBadge, null>, { label: string; color: string; bg: string }> = {
  top10: { label: 'Top 10%', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
  rising: { label: 'Rising Star', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.15)' },
  new: { label: 'New', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.15)' },
  active: { label: 'Active', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.15)' },
};

interface UserCardProps {
  user: RecommendedUser;
  showGradientRing?: boolean;
  onAdd: (id: string) => Promise<void>;
  isFriend?: boolean;
}

export function UserCard({ user, showGradientRing, onAdd, isFriend }: UserCardProps) {
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

  const initials = user.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const avatarContent = user.avatarUrl ? (
    <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} contentFit="cover" />
  ) : (
    <View style={styles.avatarPlaceholder}>
      <Text variant="body" style={styles.avatarInitial}>{initials}</Text>
    </View>
  );

  return (
    <View style={styles.card}>
      <View style={styles.avatarContainer}>
        {showGradientRing ? (
          <GradientCircle size={56}>{avatarContent}</GradientCircle>
        ) : (
          <View style={styles.avatarRing}>{avatarContent}</View>
        )}
      </View>

      <Text variant="body" style={styles.name} numberOfLines={1}>{user.displayName}</Text>
      <Text variant="caption" style={styles.username} numberOfLines={1}>@{user.username}</Text>

      {/* Content area — fills available space */}
      <View style={styles.contentArea}>
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <Zap size={12} color={colors.accentCyan} />
            <Text variant="caption" style={styles.scoreText}>{user.gaspScore}</Text>
          </View>
          {user.streak > 0 && (
            <View style={styles.statRow}>
              <Flame size={12} color="#F97316" />
              <Text variant="caption" style={styles.streakText}>{user.streak}d</Text>
            </View>
          )}
          {user.mutualFriendsCount > 0 && (
            <View style={styles.statRow}>
              <Users size={12} color={colors.primaryLight} />
              <Text variant="caption" style={styles.mutualText}>{user.mutualFriendsCount}</Text>
            </View>
          )}
        </View>

        {user.badge && (
          <View style={[styles.badge, { backgroundColor: BADGE_CONFIG[user.badge].bg }]}>
            <Text variant="caption" style={[styles.badgeText, { color: BADGE_CONFIG[user.badge].color }]}>
              {BADGE_CONFIG[user.badge].label}
            </Text>
          </View>
        )}
      </View>

      {/* Button — always at bottom */}
      {status === 'idle' && (
        <Pressable style={styles.addButton} onPress={handleAdd} accessibilityRole="button" accessibilityLabel={`Add ${user.displayName}`}>
          <UserPlus size={14} color="#FFFFFF" />
          <Text variant="caption" style={styles.addText}>Add</Text>
        </Pressable>
      )}
      {status === 'sending' && (
        <View style={styles.addButton}><ActivityIndicator size="small" color="#FFFFFF" /></View>
      )}
      {status === 'sent' && (
        <View style={styles.sentButton}>
          <Check size={14} color={colors.success} />
          <Text variant="caption" style={styles.sentText}>{isFriend ? 'Friends' : 'Sent'}</Text>
        </View>
      )}
    </View>
  );
}

const CARD_WIDTH = 155;
const AVATAR_INNER = 48;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH, backgroundColor: colors.surface, borderRadius: 16, borderCurve: 'continuous',
    paddingVertical: 16, paddingHorizontal: 12, alignItems: 'center', gap: 6, minHeight: 240,
  },
  avatarContainer: { marginBottom: 4 },
  avatarRing: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarImage: { width: AVATAR_INNER, height: AVATAR_INNER, borderRadius: AVATAR_INNER / 2 },
  avatarPlaceholder: {
    width: AVATAR_INNER, height: AVATAR_INNER, borderRadius: AVATAR_INNER / 2,
    backgroundColor: colors.surfaceElevated, justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontSize: 18, fontWeight: '700', color: colors.textSecondary },
  name: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },
  username: { fontSize: 11, color: colors.textTertiary, textAlign: 'center' },
  statsContainer: { flexDirection: 'row', gap: 8, marginTop: 4 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  scoreText: { fontSize: 11, fontWeight: '700', color: colors.accentCyan },
  streakText: { fontSize: 11, fontWeight: '600', color: '#F97316' },
  mutualText: { fontSize: 11, fontWeight: '600', color: colors.primaryLight },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 2 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  contentArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  addButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 10, borderCurve: 'continuous', marginTop: 6, minWidth: 70, minHeight: 32,
  },
  addText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  sentButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: colors.surfaceElevated, paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 10, borderCurve: 'continuous', marginTop: 6, minWidth: 70, minHeight: 32,
  },
  sentText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
});

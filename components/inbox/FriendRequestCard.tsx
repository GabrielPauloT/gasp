import { StyleSheet, View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Check, X } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { colors } from '@/constants/colors';
import { openFriendProfile } from '@/services/navigation';
import type { FriendRequest } from '@/services/api/schemas/friendRequest.schema';

interface FriendRequestCardProps {
  request: FriendRequest;
  onAccept: (friendshipId: string) => void;
  onReject: (friendshipId: string) => void;
}

export function FriendRequestCard({ request, onAccept, onReject }: FriendRequestCardProps) {
  const { requester, friendshipId } = request;

  const handleCardPress = () => {
    openFriendProfile({
      userId: requester.id,
      displayName: requester.displayName,
      avatarUrl: requester.avatarUrl,
    });
  };

  return (
    <Pressable
      onPress={handleCardPress}
      style={styles.card}
      accessibilityLabel={`${requester.displayName} wants to be your friend`}
    >
      {/* Avatar */}
      {requester.avatarUrl ? (
        <Image source={{ uri: requester.avatarUrl }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text variant="body" style={styles.avatarInitial}>
            {requester.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Name */}
      <Text variant="body" style={styles.name} numberOfLines={1}>
        {requester.displayName}
      </Text>
      <Text variant="caption" style={styles.username} numberOfLines={1}>
        @{requester.username}
      </Text>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Pressable
          onPress={() => onAccept(friendshipId)}
          style={styles.acceptButton}
          accessibilityLabel="Accept friend request"
          accessibilityRole="button"
        >
          <Check size={14} color="#FFFFFF" strokeWidth={3} />
          <Text variant="caption" style={styles.acceptText}>Accept</Text>
        </Pressable>
        <Pressable
          onPress={() => onReject(friendshipId)}
          style={styles.rejectButton}
          accessibilityLabel="Reject friend request"
          accessibilityRole="button"
        >
          <X size={14} color={colors.textSecondary} strokeWidth={3} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 130,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  username: {
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    width: '100%',
  },
  acceptButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#22C55E',
    paddingVertical: 7,
    borderRadius: 10,
    borderCurve: 'continuous',
  },
  acceptText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rejectButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    paddingVertical: 7,
    borderRadius: 10,
    borderCurve: 'continuous',
  },
});

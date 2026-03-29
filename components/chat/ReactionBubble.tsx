import { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { InlineVideo } from '@/components/ui/InlineVideo';
import { Play, CornerDownRight } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { getCachedUri } from '@/services/mediaCache';
import { colors } from '@/constants/colors';
import type { Message } from '@/services/api/schemas/chat.schema';
import { MediaBadge } from './MediaBadge';
import { chatMediaStyles } from './chatMediaStyles';

interface ReactionBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  replyToMessage?: Message | null;
  otherParticipantName?: string;
}

export function ReactionBubble({
  message,
  isOwnMessage,
  replyToMessage,
  otherParticipantName,
}: ReactionBubbleProps) {
  const rawMediaUri = message.mediaUrl || message.content;
  const resolvedMediaUri = rawMediaUri ? (getCachedUri(rawMediaUri) ?? rawMediaUri) : rawMediaUri;

  const [hasActivated, setHasActivated] = useState(false);
  const [isPaused, setIsPaused] = useState(true);

  const handleReactionPress = useCallback(() => {
    if (!hasActivated) setHasActivated(true);
    setIsPaused((prev) => !prev);
  }, [hasActivated]);

  return (
    <>
      {/* ── Reply reference strip (rendered above the bubble) ──── */}
      {replyToMessage && (
        <View style={[styles.replyStrip, isOwnMessage ? styles.replyStripOwn : styles.replyStripOther]}>
          <CornerDownRight size={11} color={colors.textTertiary} />
          <Image
            source={replyToMessage.mediaUrl || replyToMessage.content}
            style={styles.replyThumb}
            contentFit="cover"
            blurRadius={12}
          />
          <Text variant="caption" style={styles.replyText} numberOfLines={1}>
            {isOwnMessage ? `${otherParticipantName}'s` : 'Your'} gasp
          </Text>
        </View>
      )}

      <Pressable
        onPress={handleReactionPress}
        accessibilityLabel="Reaction video, tap to play"
        style={[
          chatMediaStyles.bubble,
          isOwnMessage ? chatMediaStyles.ownBubble : chatMediaStyles.otherBubble,
          chatMediaStyles.mediaBubble,
        ]}
      >
        <View style={chatMediaStyles.mediaContainer}>
          {hasActivated && (
            <View style={[StyleSheet.absoluteFill, { zIndex: 1 }]}>
              <InlineVideo uri={resolvedMediaUri} style={chatMediaStyles.media} paused={isPaused} />
            </View>
          )}
          {!hasActivated && (
            <View style={[chatMediaStyles.media, styles.reactionPlaceholder]}>
              <LinearGradient
                colors={['#1A1A2E', '#2A1A3E', '#1A1A2E']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.playCircle}>
                <Play size={24} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
              </View>
            </View>
          )}
          <MediaBadge label="REACTION" variant="reaction" />
        </View>
      </Pressable>
    </>
  );
}

// ── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // ── Reaction placeholder ────────────────────────────────────────
  reactionPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(124, 58, 237, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(124, 58, 237, 0.8)',
  },

  // ── Reply reference strip ───────────────────────────────────────
  replyStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  replyStripOwn: {
    justifyContent: 'flex-end',
  },
  replyStripOther: {
    justifyContent: 'flex-start',
  },
  replyThumb: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
  },
  replyText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
});

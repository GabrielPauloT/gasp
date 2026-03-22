import { memo, useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Eye, Play, EyeOff, CornerDownRight } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { useGaspStore } from '@/stores/gaspStore';
import { getCachedUri } from '@/services/mediaCache';
import { colors } from '@/constants/colors';
import type { Message } from '@/types/chat';

/** Inline looping video with loading spinner — controls play/pause without remounting */
function InlineVideo({ uri, style, paused }: { uri: string; style: object; paused: boolean }) {
  const [ready, setReady] = useState(false);
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (player.currentTime > 0) {
        setReady(true);
        clearInterval(interval);
      }
    }, 150);
    return () => clearInterval(interval);
  }, [player]);

  useEffect(() => {
    if (paused) {
      player.pause();
    } else {
      player.play();
    }
  }, [paused, player]);

  return (
    <View style={style}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
      {!ready && (
        <View style={styles.videoLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

// ── Badge component ─────────────────────────────────────────────────
function MediaBadge({ label, variant }: { label: string; variant: 'gasp' | 'reaction' }) {
  const badgeColors = variant === 'gasp'
    ? ['#EC4899', '#7C3AED'] as const
    : ['#7C3AED', '#4F46E5'] as const;

  return (
    <LinearGradient colors={badgeColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.badge}>
      <Text variant="caption" style={styles.badgeText}>{label}</Text>
    </LinearGradient>
  );
}

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  isSequential: boolean;
  replyToMessage?: Message | null;
  otherParticipantName?: string;
}

function MessageBubbleInner({
  message,
  isOwnMessage,
  isSequential,
  replyToMessage,
  otherParticipantName,
}: MessageBubbleProps) {
  const isGasp = message.type === 'gasp';
  const isReaction = message.type === 'reaction';
  const isImageOrGasp = isGasp || message.type === 'image';
  const isMedia = isImageOrGasp || isReaction;
  const rawMediaUri = message.mediaUrl || message.content;
  const resolvedMediaUri = (isMedia && rawMediaUri) ? (getCachedUri(rawMediaUri) ?? rawMediaUri) : rawMediaUri;
  const [hasActivated, setHasActivated] = useState(false);
  const [isPaused, setIsPaused] = useState(true);

  const isGaspViewed = useGaspStore((s) => isGasp && s.viewedChatGaspIds.has(message.id));
  const markChatGaspViewed = useGaspStore((s) => s.markChatGaspViewed);

  // ── Gasp tap → open view-gasp modal (only received gasps) ─────
  const handleGaspPress = useCallback(() => {
    if (isOwnMessage || isGaspViewed) return;
    markChatGaspViewed(message.id);
    router.push({
      pathname: '/(modals)/view-gasp',
      params: {
        chatImageUri: message.mediaUrl || message.content,
        chatSenderName: otherParticipantName ?? '',
        chatConversationId: message.conversationId,
        chatMessageId: message.id,
      },
    });
  }, [message, otherParticipantName, isOwnMessage, isGaspViewed, markChatGaspViewed]);

  // ── Reaction tap → play/pause (unlimited) ─────────────────────
  const handleReactionPress = useCallback(() => {
    if (!isReaction) return;
    if (!hasActivated) setHasActivated(true);
    setIsPaused((prev) => !prev);
  }, [isReaction, hasActivated]);

  const handlePress = isGasp ? handleGaspPress : handleReactionPress;

  // ── Render ────────────────────────────────────────────────────────
  return (
    <View
      style={[
        styles.container,
        isOwnMessage ? styles.ownContainer : styles.otherContainer,
        { marginTop: isSequential ? 4 : 16 },
      ]}
    >
      {/* ── Reply reference (integrated header for reactions) ──── */}
      {isReaction && replyToMessage && (
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
        onPress={handlePress}
        style={[
          styles.bubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble,
          isMedia && styles.mediaBubble,
        ]}
      >
        {/* ── REACTION ───────────────────────────────────────── */}
        {isReaction ? (
          <View style={styles.mediaContainer}>
            {hasActivated && (
              <View style={[StyleSheet.absoluteFill, { zIndex: 1 }]}>
                <InlineVideo uri={resolvedMediaUri} style={styles.media} paused={isPaused} />
              </View>
            )}
            {!hasActivated && (
              <View style={[styles.media, styles.reactionPlaceholder]}>
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
        ) : isImageOrGasp ? (
          /* ── GASP ──────────────────────────────────────────── */
          <View style={styles.mediaContainer}>
            <Image
              source={resolvedMediaUri}
              style={styles.media}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
              blurRadius={isOwnMessage ? 0 : (isGaspViewed ? 40 : 25)}
            />

            {/* Own gasp: image visible + subtle gradient footer */}
            {isOwnMessage && (
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.4)']}
                style={styles.gradientFooter}
              />
            )}

            {/* Received gasp: overlay states */}
            {!isOwnMessage && (
              isGaspViewed ? (
                /* Viewed state — compact, dimmed */
                <View style={styles.viewedOverlay}>
                  <EyeOff size={20} color="rgba(255,255,255,0.5)" />
                  <Text variant="caption" style={styles.viewedLabel}>Opened</Text>
                </View>
              ) : (
                /* Unviewed state — inviting gradient overlay */
                <LinearGradient
                  colors={['rgba(124,58,237,0.15)', 'rgba(0,0,0,0.55)', 'rgba(236,72,153,0.15)']}
                  locations={[0, 0.5, 1]}
                  style={styles.gaspOverlay}
                >
                  <View style={styles.eyeCircle}>
                    <Eye size={26} color="#FFFFFF" />
                  </View>
                  <Text variant="body" style={styles.tapText}>Tap to view</Text>
                  <Text variant="caption" style={styles.tapHint}>
                    from {otherParticipantName}
                  </Text>
                </LinearGradient>
              )
            )}

            <MediaBadge label="GASP" variant="gasp" />
          </View>
        ) : (
          /* ── TEXT ──────────────────────────────────────────── */
          <Text
            variant="body"
            style={[styles.text, isOwnMessage ? styles.ownText : styles.otherText]}
          >
            {message.content}
          </Text>
        )}
      </Pressable>

      <Text variant="caption" style={[styles.time, isOwnMessage ? styles.ownTime : styles.otherTime]}>
        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
}

export const MessageBubble = memo(MessageBubbleInner, (prev, next) =>
  prev.message.id === next.message.id
  && prev.isOwnMessage === next.isOwnMessage
  && prev.isSequential === next.isSequential
  && prev.replyToMessage?.id === next.replyToMessage?.id
);

// ── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    maxWidth: '80%',
    paddingHorizontal: 16,
  },
  ownContainer: {
    alignSelf: 'flex-end',
  },
  otherContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  mediaBubble: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  ownBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  // ── Media card ──────────────────────────────────────────────────
  mediaContainer: {
    position: 'relative',
    width: 220,
    height: 300,
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  media: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
  },

  // ── Badge (GASP / REACTION) ─────────────────────────────────────
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderCurve: 'continuous',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },

  // ── Gasp overlay: unviewed ──────────────────────────────────────
  gaspOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  eyeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  tapText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  tapHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },

  // ── Gasp overlay: viewed ────────────────────────────────────────
  viewedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  viewedLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // ── Gasp: own — gradient footer ─────────────────────────────────
  gradientFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },

  // ── Video loading ────────────────────────────────────────────────
  videoLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },

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

  // ── Text message ────────────────────────────────────────────────
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  ownText: {
    color: '#FFFFFF',
  },
  otherText: {
    color: colors.textPrimary,
  },
  time: {
    marginTop: 4,
    fontSize: 11,
    color: colors.textSecondary,
  },
  ownTime: {
    alignSelf: 'flex-end',
    marginRight: 4,
  },
  otherTime: {
    alignSelf: 'flex-start',
    marginLeft: 4,
  },
});

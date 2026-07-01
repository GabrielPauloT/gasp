import { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, Modal } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, CornerDownRight, X } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { getCachedUri } from '@/services/mediaCache';
import { colors } from '@/constants/colors';
import type { Message } from '@/services/api/schemas/chat.schema';
import { MediaBadge } from './MediaBadge';
import { chatMediaStyles } from './chatMediaStyles';
import { ReactionComposite } from '@/components/gasp/ReactionComposite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

  // Original gasp URI comes from the replied-to message
  const originalUri = replyToMessage?.mediaUrl ?? replyToMessage?.content ?? '';
  const resolvedOriginalUri = originalUri ? (getCachedUri(originalUri) ?? originalUri) : '';

  const [showComposite, setShowComposite] = useState(false);
  const insets = useSafeAreaInsets();

  const handleReactionPress = useCallback(() => {
    setShowComposite(true);
  }, []);

  const handleClose = useCallback(() => {
    setShowComposite(false);
  }, []);

  return (
    <>
      {/* ── Reply reference strip ──── */}
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
        accessibilityRole="button"
        accessibilityLabel="Reaction video, tap to view composite"
        style={[
          chatMediaStyles.bubble,
          isOwnMessage ? chatMediaStyles.ownBubble : chatMediaStyles.otherBubble,
          chatMediaStyles.mediaBubble,
        ]}
      >
        <View style={chatMediaStyles.mediaContainer}>
          <View style={[chatMediaStyles.media, styles.reactionPlaceholder]}>
            <LinearGradient
              colors={['#1A1A2E', '#2A1A3E', '#1A1A2E']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.playCircle}>
              <Play size={24} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
            </View>
          </View>
          <MediaBadge label="REACTION" variant="reaction" />
        </View>
      </Pressable>

      {/* Full-screen composite modal */}
      <Modal
        visible={showComposite}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={handleClose}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <ReactionComposite
            originalUri={resolvedOriginalUri}
            reactionVideoUri={resolvedMediaUri ?? ''}
          />
          <Pressable
            onPress={handleClose}
            style={[styles.closeButton, { top: insets.top + 12 }]}
            accessibilityRole="button"
            accessibilityLabel="Close reaction view"
          >
            <X size={24} color="#FFFFFF" />
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

// ── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
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
  replyStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  replyStripOwn: { justifyContent: 'flex-end' },
  replyStripOther: { justifyContent: 'flex-start' },
  replyThumb: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
  },
  replyText: { fontSize: 11, color: colors.textTertiary },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});

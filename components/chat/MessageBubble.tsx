import { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { Eye } from 'lucide-react-native';
import { clsx } from 'clsx';
import { Text } from '@/components/ui/Text';
import { colors } from '@/constants/colors';
import type { Message } from '@/types/chat';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  isSequential: boolean; // True if the previous message is from the same sender
}

export function MessageBubble({ message, isOwnMessage, isSequential }: MessageBubbleProps) {
  const isGasp = message.type === 'gasp';
  const isReaction = message.type === 'reaction';
  const isImageOrGasp = isGasp || message.type === 'image';
  const isMedia = isImageOrGasp || isReaction;
  const [isHolding, setIsHolding] = useState(false);

  const isHidden = isGasp && !isHolding;

  return (
    <View
      style={[
        styles.container,
        isOwnMessage ? styles.ownContainer : styles.otherContainer,
        { marginTop: isSequential ? 4 : 16 },
      ]}
    >
      <Pressable
        onPressIn={() => isGasp && setIsHolding(true)}
        onPressOut={() => isGasp && setIsHolding(false)}
        delayLongPress={100}
        style={[
          styles.bubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble,
          isMedia && styles.mediaBubble,
        ]}
      >
        {isReaction ? (
          <View style={styles.mediaContainer}>
            <Video
              source={{ uri: message.mediaUrl || message.content }}
              style={styles.media}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              isMuted
            />
            <View style={styles.reactionLabel}>
              <Text variant="caption" style={styles.reactionLabelText}>
                Reaction
              </Text>
            </View>
          </View>
        ) : isImageOrGasp ? (
          <View style={styles.mediaContainer}>
            <Image
              source={message.mediaUrl || message.content}
              style={styles.media}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
              blurRadius={isHidden ? 25 : 0}
            />
            {isHidden && (
              <View style={styles.hiddenOverlay}>
                <Eye size={32} color="#FFFFFF" />
                <Text variant="body" style={styles.hiddenText}>
                  Hold to view
                </Text>
              </View>
            )}
          </View>
        ) : (
          <Text
            variant="body"
            style={[
              styles.text,
              isOwnMessage ? styles.ownText : styles.otherText,
            ]}
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
  mediaContainer: {
    position: 'relative',
    width: 220,
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
  },
  media: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
  },
  hiddenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  hiddenText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  reactionLabel: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reactionLabelText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
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

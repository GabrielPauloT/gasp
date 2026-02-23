import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
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
  const isImageOrGasp = message.type === 'gasp' || message.type === 'image';

  return (
    <View
      style={[
        styles.container,
        isOwnMessage ? styles.ownContainer : styles.otherContainer,
        { marginTop: isSequential ? 4 : 16 },
      ]}
    >
      <View
        style={[
          styles.bubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble,
          isImageOrGasp && styles.mediaBubble,
        ]}
      >
        {isImageOrGasp ? (
          <Image
            source={message.mediaUrl || message.content}
            style={styles.media}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />
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
      </View>
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
  media: {
    width: 220,
    height: 300,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
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

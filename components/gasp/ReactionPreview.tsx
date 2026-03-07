import { StyleSheet, View, Dimensions, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { Text } from '@/components/ui/Text';
import { colors } from '@/constants/colors';
import { Send, RotateCcw } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = (SCREEN_WIDTH - 48 - 8) / 2;

interface ReactionPreviewProps {
  originalImageUri: string;
  reactionVideoUri: string;
  senderName: string;
  onSend?: () => void;
  onRetake?: () => void;
}

export function ReactionPreview({
  originalImageUri,
  reactionVideoUri,
  senderName,
  onSend,
  onRetake,
}: ReactionPreviewProps) {
  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(300)} style={styles.content}>
        <Text variant="title" style={styles.title}>
          {'Your Reaction'}
        </Text>
        <Text variant="caption" style={styles.subtitle}>
          {`to ${senderName}'s gasp`}
        </Text>

        <View style={styles.imagesRow}>
          <View style={styles.imageCard}>
            <Image
              source={{ uri: originalImageUri }}
              style={styles.image}
              contentFit="cover"
            />
            <Text variant="caption" style={styles.imageLabel}>
              {'Original'}
            </Text>
          </View>
          <View style={styles.imageCard}>
            <Video
              source={{ uri: reactionVideoUri }}
              style={styles.image}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              isMuted
            />
            <Text variant="caption" style={styles.imageLabel}>
              {'Reaction'}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={onRetake} style={styles.retakeButton}>
            <RotateCcw size={20} color={colors.textPrimary} />
            <Text variant="body" style={styles.retakeText}>
              {'Retake'}
            </Text>
          </Pressable>
          <Pressable onPress={onSend} style={styles.sendButton}>
            <Send size={20} color="#FFFFFF" />
            <Text variant="body" style={styles.sendText}>
              {'Send Reaction'}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    gap: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  imagesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  imageCard: {
    gap: 8,
    alignItems: 'center',
  },
  image: {
    width: IMAGE_WIDTH,
    height: IMAGE_WIDTH * 1.4,
    borderRadius: 16,
    borderCurve: 'continuous',
  },
  imageLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  retakeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 26,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.border,
  },
  retakeText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  sendButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 26,
    borderCurve: 'continuous',
    backgroundColor: colors.primary,
  },
  sendText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

import { StyleSheet, View, Dimensions, Pressable } from 'react-native';
import { Text } from '@/components/ui/Text';
import { colors } from '@/constants/colors';
import { Send, RotateCcw, Download } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn, Easing } from 'react-native-reanimated';
import { ReactionComposite } from '@/components/gasp/ReactionComposite';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COMPOSITE_HEIGHT = SCREEN_WIDTH * 1.4;

interface ReactionPreviewProps {
  originalImageUri: string;
  originalMediaType?: 'image' | 'video';
  reactionVideoUri: string;
  senderName: string;
  onSend?: () => void;
  onReRecord?: () => void;
  onDiscard?: () => void;
  onRetake?: () => void;
  onSave?: () => void;
}

export function ReactionPreview({
  originalImageUri,
  originalMediaType = 'image',
  reactionVideoUri,
  senderName,
  onSend,
  onReRecord,
  onDiscard,
  onRetake,
  onSave,
}: ReactionPreviewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View entering={FadeIn.delay(50).duration(300)}>
          <Text variant="title" style={styles.title}>{'Your Reaction'}</Text>
          <Text variant="caption" style={styles.subtitle}>{`to ${senderName}'s gasp`}</Text>
        </Animated.View>

        {/* Composite zooms in with back-easing for a "ta-da" feel */}
        <Animated.View
          entering={ZoomIn.delay(100).duration(400).easing(Easing.out(Easing.back(1.3)))}
          style={[styles.compositeWrapper, { height: COMPOSITE_HEIGHT }]}
        >
          <ReactionComposite
            originalUri={originalImageUri}
            originalMediaType={originalMediaType}
            reactionVideoUri={reactionVideoUri}
          />
        </Animated.View>

        {/* Buttons slide up after composite */}
        <Animated.View entering={FadeInDown.delay(300).duration(250)} style={styles.actions}>
          <Pressable
            onPress={onReRecord ?? onRetake}
            style={styles.retakeButton}
            accessibilityRole="button"
            accessibilityLabel="Re-record reaction"
          >
            <RotateCcw size={20} color={colors.textPrimary} />
            <Text variant="body" style={styles.retakeText}>{'Re-record'}</Text>
          </Pressable>
          <Pressable
            onPress={onSend}
            style={styles.sendButton}
            accessibilityRole="button"
            accessibilityLabel="Send reaction"
          >
            <Send size={20} color="#FFFFFF" />
            <Text variant="body" style={styles.sendText}>{'Send Reaction'}</Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(250)} style={styles.secondaryActions}>
          {onSave && (
            <Pressable onPress={onSave} style={styles.saveButton} accessibilityRole="button" accessibilityLabel="Save to camera roll">
              <Download size={18} color={colors.textSecondary} />
              <Text variant="body" style={styles.saveText}>{'Save to Camera Roll'}</Text>
            </Pressable>
          )}
          <Pressable onPress={onDiscard} style={styles.discardButton} accessibilityRole="button" accessibilityLabel="Discard reaction">
            <Text variant="body" style={styles.discardText}>{'Discard'}</Text>
          </Pressable>
        </Animated.View>
      </View>
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
  compositeWrapper: {
    width: SCREEN_WIDTH - 48,
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
  retakeText: { color: colors.textPrimary, fontWeight: '600' },
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
  sendText: { color: '#FFFFFF', fontWeight: '600' },
  discardButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  discardText: { color: colors.textSecondary, fontWeight: '500' },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  saveText: { color: colors.textSecondary, fontWeight: '500' },
  secondaryActions: {
    alignItems: 'center',
    gap: 4,
    width: '100%',
  },
});

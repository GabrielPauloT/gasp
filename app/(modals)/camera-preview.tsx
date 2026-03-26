import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Pressable,
  ActivityIndicator,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useVideoPlayer, VideoView } from 'expo-video';
import { X, Send, RotateCcw, Type, Trash2 } from 'lucide-react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { DraggableText } from '@/components/camera/DraggableText';
import { TextStylePicker } from '@/components/camera/TextStylePicker';
import { colors } from '@/constants/colors';
import type { TextConfig, TextPosition, FontFamily, BgMode, TextAlign } from '@/components/camera/DraggableText';

/** Blinking cursor for live text preview */
function BlinkingCursor({ color }: { color: string }) {
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 400 }),
        withTiming(1, { duration: 400 }),
      ),
      -1,
    );
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Reanimated.View style={[{ width: 2, height: 30, backgroundColor: color, borderRadius: 1 }, style]} />
  );
}

const BG_CYCLE: BgMode[] = ['none', 'dark', 'light'];
const ALIGN_CYCLE: TextAlign[] = ['center', 'left', 'right'];

const DEFAULT_CONFIG: TextConfig = {
  font: 'modern',
  color: '#FFFFFF',
  bgMode: 'none',
  align: 'center',
  fontSize: 28,
};

export default function CameraPreviewScreen() {
  const { imageUri, isVideo } = useLocalSearchParams<{ imageUri: string; isVideo?: string }>();
  const insets = useSafeAreaInsets();
  const isVideoMode = isVideo === 'true';
  const [videoReady, setVideoReady] = useState(false);

  // ── Text overlay state ──────────────────────────────────────────
  const [isTextEditing, setIsTextEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const [inputText, setInputText] = useState('');
  const [committedText, setCommittedText] = useState('');
  const [textConfig, setTextConfig] = useState<TextConfig>(DEFAULT_CONFIG);
  const [isSending, setIsSending] = useState(false);
  const [textPosition, setTextPosition] = useState<TextPosition>({ x: 0, y: 0, scale: 1, rotation: 0 });
  const inputRef = useRef<TextInput>(null);
  const captureViewRef = useRef<View>(null);

  const videoPlayer = useVideoPlayer(isVideoMode ? imageUri : null, (p) => {
    p.loop = true;
    p.play();
  });

  useEffect(() => {
    if (!isVideoMode) return;
    if (videoPlayer.status === 'readyToPlay') {
      setVideoReady(true);
      return;
    }
    const sub = videoPlayer.addListener('statusChange', ({ status }: { status: string }) => {
      if (status === 'readyToPlay') setVideoReady(true);
    });
    return () => sub.remove();
  }, [isVideoMode, videoPlayer]);

  // ── Handlers ────────────────────────────────────────────────────
  const handleClose = () => router.back();
  const handleRetake = () => router.back();

  const handleSend = useCallback(async () => {
    if (isSending) return;
    setIsSending(true);

    let finalUri = imageUri;

    // For photos with text: burn text into image via captureRef
    if (committedText && !isVideoMode && captureViewRef.current) {
      try {
        finalUri = await captureRef(captureViewRef, {
          format: 'jpg',
          quality: 0.9,
        });
      } catch {
        // Fallback to original image
      }
    }

    // For videos with text: pass text config + position as metadata
    const textOverlay = committedText && isVideoMode
      ? JSON.stringify({ text: committedText, ...textConfig, pos: textPosition })
      : undefined;

    router.push({
      pathname: '/(modals)/send-gasp',
      params: {
        imageUri: finalUri,
        ...(isVideoMode && { isVideo: 'true' }),
        ...(textOverlay && { textOverlay }),
      },
    });
    setTimeout(() => setIsSending(false), 600);
  }, [imageUri, isVideoMode, committedText, textConfig, textPosition, isSending]);

  const handleOpenTextEditor = useCallback(() => {
    setInputText(committedText);
    setIsTextEditing(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [committedText]);

  const handleTextDone = useCallback(() => {
    setCommittedText(inputText.trim());
    setIsTextEditing(false);
    Keyboard.dismiss();
  }, [inputText]);

  const handleClearText = useCallback(() => {
    setCommittedText('');
    setInputText('');
  }, []);

  const handleTapText = useCallback(() => {
    handleOpenTextEditor();
  }, [handleOpenTextEditor]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    setIsOverTrash(false);
  }, []);

  const handleDragEnd = useCallback((droppedInTrash: boolean) => {
    setIsDragging(false);
    setIsOverTrash(false);
    if (droppedInTrash) handleClearText();
  }, [handleClearText]);

  const handleDragOverTrash = useCallback((isOver: boolean) => {
    setIsOverTrash(isOver);
  }, []);

  const handlePositionChange = useCallback((pos: TextPosition) => {
    setTextPosition(pos);
  }, []);

  const handleChangeFont = useCallback((font: FontFamily) => {
    setTextConfig((c) => ({ ...c, font }));
  }, []);

  const handleChangeColor = useCallback((color: string) => {
    setTextConfig((c) => ({ ...c, color }));
  }, []);

  const handleToggleBg = useCallback(() => {
    setTextConfig((c) => {
      const idx = BG_CYCLE.indexOf(c.bgMode);
      return { ...c, bgMode: BG_CYCLE[(idx + 1) % BG_CYCLE.length]! };
    });
  }, []);

  const handleToggleAlign = useCallback(() => {
    setTextConfig((c) => {
      const idx = ALIGN_CYCLE.indexOf(c.align);
      return { ...c, align: ALIGN_CYCLE[(idx + 1) % ALIGN_CYCLE.length]! };
    });
  }, []);

  const handleChangeFontSize = useCallback((fontSize: number) => {
    setTextConfig((c) => ({ ...c, fontSize }));
  }, []);

  // Preview text for live editing
  const liveText = inputText.trim();

  const FONT_MAP: Record<FontFamily, { fontFamily?: string; fontWeight: '400' | '700' | '900' }> = {
    modern: { fontWeight: '700' },
    classic: { fontFamily: 'serif', fontWeight: '400' },
    bold: { fontWeight: '900' },
    mono: { fontFamily: 'monospace', fontWeight: '400' },
  };
  const liveFont = FONT_MAP[textConfig.font];

  // ── Render ──────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Capturable area: media + text overlay */}
      <View ref={captureViewRef} style={styles.captureArea} collapsable={false}>
        {/* Media preview */}
        {imageUri ? (
          isVideoMode ? (
            <View style={styles.preview}>
              <VideoView
                player={videoPlayer}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                nativeControls={false}
              />
              {!videoReady && <ActivityIndicator size="large" color="#FFFFFF" />}
            </View>
          ) : (
            <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
          )
        ) : (
          <View style={styles.preview}>
            <Text variant="body" color={colors.textSecondary}>No image captured</Text>
          </View>
        )}

        {/* Draggable text overlay — inside capture area */}
        {committedText !== '' && !isTextEditing && (
          <View pointerEvents="auto" style={[StyleSheet.absoluteFill, { zIndex: 8 }]}>
            <DraggableText
            text={committedText}
            config={textConfig}
            onTap={handleTapText}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOverTrash={handleDragOverTrash}
            onPositionChange={handlePositionChange}
          />
        </View>
      )}
      </View>

      {/* Text editing overlay */}
      {isTextEditing && (
        <KeyboardAvoidingView
          style={styles.textEditOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.textEditBg} onPress={handleTextDone}>
            {/* Live preview with blinking cursor */}
            <View style={styles.livePreview} pointerEvents="none">
              <View
                style={[
                  styles.liveTextRow,
                  textConfig.bgMode === 'dark' && styles.liveBgDark,
                  textConfig.bgMode === 'light' && [styles.liveBgLight, { backgroundColor: textConfig.color }],
                ]}
              >
                {liveText !== '' && (
                  <Text
                    variant="body"
                    style={[
                      styles.liveText,
                      {
                        fontSize: textConfig.fontSize,
                        lineHeight: textConfig.fontSize * 1.3,
                        color: textConfig.bgMode === 'light' ? '#FFFFFF' : textConfig.color,
                        textAlign: textConfig.align,
                        fontWeight: liveFont.fontWeight,
                        fontFamily: liveFont.fontFamily,
                      },
                      textConfig.bgMode === 'none' && styles.liveTextShadow,
                    ]}
                  >
                    {liveText}
                  </Text>
                )}
                <BlinkingCursor color={textConfig.bgMode === 'light' ? '#FFFFFF' : textConfig.color} />
              </View>
            </View>
          </Pressable>

          {/* Hidden TextInput — captures keyboard, live preview shows the text */}
          <TextInput
            ref={inputRef}
            value={inputText}
            onChangeText={setInputText}
            style={styles.hiddenInput}
            maxLength={150}
            autoFocus
            caretHidden
          />

          {/* Style picker */}
          <TextStylePicker
            font={textConfig.font}
            color={textConfig.color}
            bgMode={textConfig.bgMode}
            align={textConfig.align}
            fontSize={textConfig.fontSize}
            onChangeFont={handleChangeFont}
            onChangeColor={handleChangeColor}
            onToggleBg={handleToggleBg}
            onToggleAlign={handleToggleAlign}
            onChangeFontSize={handleChangeFontSize}
            onDone={handleTextDone}
          />
        </KeyboardAvoidingView>
      )}

      {/* Trash zone — visible only when dragging */}
      {isDragging && (
        <View style={[styles.trashZone, { paddingBottom: insets.bottom + 20 }]}>
          <View style={[styles.trashCircle, isOverTrash && styles.trashCircleActive]}>
            <Trash2 size={isOverTrash ? 28 : 22} color="#FFFFFF" />
          </View>
        </View>
      )}

      {/* Top bar — hidden during editing and dragging */}
      {!isTextEditing && !isDragging && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[styles.topBar, { paddingTop: insets.top + 8 }]}
        >
          <Pressable onPress={handleClose} style={styles.iconButton}>
            <X size={28} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
      )}

      {/* Bottom controls — hidden during editing and dragging */}
      {!isTextEditing && !isDragging && (
        <Animated.View
          entering={FadeInUp.duration(400).delay(200)}
          style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}
        >
          <Pressable onPress={handleRetake} style={styles.bottomAction}>
            <View style={styles.actionCircle}>
              <RotateCcw size={22} color="#FFFFFF" />
            </View>
            <Text variant="caption" style={styles.actionLabel}>Retake</Text>
          </Pressable>

          <Pressable onPress={handleSend} disabled={isSending} style={[styles.sendButton, isSending && { opacity: 0.6 }]}>
            {isSending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={24} color="#FFFFFF" />
            )}
            <Text variant="body" style={styles.sendText}>{isSending ? 'Preparing...' : 'Send'}</Text>
          </Pressable>

          <Pressable onPress={handleOpenTextEditor} style={styles.bottomAction}>
            <View style={styles.actionCircle}>
              <Type size={22} color="#FFFFFF" />
            </View>
            <Text variant="caption" style={styles.actionLabel}>Text</Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  captureArea: {
    ...StyleSheet.absoluteFillObject,
  },
  preview: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    zIndex: 10,
  },
  bottomAction: {
    alignItems: 'center',
    gap: 6,
  },
  actionCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 11,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 32,
    borderCurve: 'continuous',
  },
  sendText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 17,
  },

  hidden: {
    opacity: 0,
  },

  // ── Trash zone ────────────────────────────────────────────────
  trashZone: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 12,
  },
  trashCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  trashCircleActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
    width: 64,
    height: 64,
    borderRadius: 32,
  },

  // ── Text editing ──────────────────────────────────────────────
  textEditOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 15,
  },
  textEditBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  livePreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  liveTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  liveText: {
    fontWeight: '700',
  },
  liveTextShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  liveBgDark: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  liveBgLight: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
  },
});

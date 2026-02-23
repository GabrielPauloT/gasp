import { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Pressable, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { X, Send, Check } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { SearchBar } from '@/components/ui/SearchBar';
import { useInboxStore } from '@/stores/inboxStore';
import { useGaspStore } from '@/stores/gaspStore';
import { useAuthStore } from '@/stores/authStore';
import type { InboxFriend } from '@/stores/inboxStore';
import { uploadGasp } from '@/services/storage';
import { getApiErrorMessage } from '@/services/api';
import { colors } from '@/constants/colors';

export default function SendGaspScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const insets = useSafeAreaInsets();
  const friends = useInboxStore((s) => s.friends);
  const user = useAuthStore((s) => s.user);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const filteredFriends = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return friends;
    return friends.filter(
      (f) =>
        f.name.toLowerCase().includes(query) ||
        f.username.toLowerCase().includes(query)
    );
  }, [friends, searchQuery]);

  const toggleFriend = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.size === friends.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(friends.map((f) => f.id)));
    }
  }, [friends, selectedIds.size]);

  const handleSend = async () => {
    if (!imageUri || isUploading) return;

    const userId = user?.id ?? 'guest';
    const sendBatchGasp = useGaspStore.getState().sendBatchGasp;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Upload image to Firebase Storage
      const result = await uploadGasp(imageUri, userId, ({ progress }) => {
        setUploadProgress(progress * 0.8); // 80% for upload
      });

      // 2. Save gasp metadata to backend
      setUploadProgress(0.9);
      await sendBatchGasp({
        recipientIds: Array.from(selectedIds),
        imageUrl: result.downloadUrl,
      });

      setUploadProgress(1);
      router.dismissAll();
      router.replace('/(tabs)/camera');
    } catch (error) {
      Alert.alert(
        'Send failed',
        getApiErrorMessage(error),
        [{ text: 'OK' }]
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    router.back();
  };

  const renderFriend = useCallback(
    ({ item }: { item: InboxFriend }) => {
      const isSelected = selectedIds.has(item.id);
      return (
        <Pressable
          onPress={() => toggleFriend(item.id)}
          style={styles.friendRow}
        >
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {item.avatarUrl ? (
              <Image
                source={{ uri: item.avatarUrl }}
                style={styles.avatar}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text variant="body" style={styles.avatarInitial}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {item.onlineStatus === 'online' && (
              <View style={styles.onlineDot} />
            )}
          </View>

          {/* Name & username */}
          <View style={styles.friendInfo}>
            <Text variant="body" style={styles.friendName}>
              {item.name}
            </Text>
            <Text variant="caption" style={styles.friendUsername}>
              {'@'}{item.username}
            </Text>
          </View>

          {/* Selection indicator */}
          <View
            style={[
              styles.checkbox,
              isSelected && styles.checkboxSelected,
            ]}
          >
            {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
          </View>
        </Pressable>
      );
    },
    [selectedIds, toggleFriend]
  );

  const keyExtractor = useCallback((item: InboxFriend) => item.id, []);

  const allSelected = selectedIds.size === friends.length && friends.length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <X size={24} color="#FFFFFF" />
        </Pressable>

        <Text variant="subtitle" style={styles.headerTitle}>
          {'Send to'}
        </Text>

        {/* Image preview thumbnail */}
        {imageUri ? (
          <View style={styles.previewThumb}>
            <Image
              source={{ uri: imageUri }}
              style={styles.previewImage}
              contentFit="cover"
            />
          </View>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </Animated.View>

      {/* Search */}
      <Animated.View
        entering={FadeInDown.duration(300).delay(100)}
        style={styles.searchContainer}
      >
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search friends..."
        />
      </Animated.View>

      {/* Select all row */}
      <Animated.View entering={FadeInDown.duration(300).delay(150)}>
        <Pressable onPress={selectAll} style={styles.selectAllRow}>
          <Text variant="label" style={styles.selectAllText}>
            {allSelected ? 'Deselect all' : 'Select all'}
          </Text>
          {selectedIds.size > 0 && (
            <Text variant="caption" style={styles.selectedCount}>
              {selectedIds.size.toString()}{' selected'}
            </Text>
          )}
        </Pressable>
      </Animated.View>

      {/* Friend list */}
      <FlatList
        data={filteredFriends}
        renderItem={renderFriend}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Send button */}
      {selectedIds.size > 0 && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[styles.sendContainer, { paddingBottom: insets.bottom + 16 }]}
        >
          <Pressable
            onPress={handleSend}
            disabled={isUploading}
            style={[styles.sendButton, isUploading && styles.sendButtonDisabled]}
          >
            {isUploading ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text variant="body" style={styles.sendText}>
                  {'Uploading... '}{Math.round(uploadProgress * 100)}{'%'}
                </Text>
              </>
            ) : (
              <>
                <Send size={20} color="#FFFFFF" />
                <Text variant="body" style={styles.sendText}>
                  {'Send to '}{selectedIds.size.toString()}{selectedIds.size === 1 ? ' friend' : ' friends'}
                </Text>
              </>
            )}
          </Pressable>

          {/* Upload progress bar */}
          {isUploading && (
            <View style={styles.progressBarContainer}>
              <View
                style={[styles.progressBar, { width: `${uploadProgress * 100}%` }]}
              />
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  previewThumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderCurve: 'continuous',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  selectAllRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectAllText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  selectedCount: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 14,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.background,
  },
  friendInfo: {
    flex: 1,
    gap: 2,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  friendUsername: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sendContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: 'rgba(10, 10, 15, 0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 28,
    borderCurve: 'continuous',
  },
  sendText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
});

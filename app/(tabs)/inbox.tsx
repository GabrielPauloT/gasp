import { useEffect, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FeedHeader } from '@/components/inbox/FeedHeader';
import { FeedCard } from '@/components/inbox/FeedCard';
import { Text } from '@/components/ui/Text';
import { useGaspStore } from '@/stores/gaspStore';
import { useAuthStore } from '@/stores/authStore';
import { openGaspViewer } from '@/services/openGasp';
import { colors } from '@/constants/colors';
import type { Gasp } from '@/types/gasp';

export default function InboxScreen() {
  const insets = useSafeAreaInsets();
  const isGuest = useAuthStore((s) => s.isGuest);
  const pendingGasps = useGaspStore((s) => s.pendingGasps);
  const isLoading = useGaspStore((s) => s.isLoadingPending);
  const fetchPendingGasps = useGaspStore((s) => s.fetchPendingGasps);

  const newCount = useMemo(() =>
    pendingGasps.filter((g) => g.status === 'pending').length,
    [pendingGasps]
  );

  useEffect(() => {
    if (!isGuest) {
      fetchPendingGasps();
    }
  }, [isGuest, fetchPendingGasps]);

  const handleRefresh = useCallback(() => {
    if (!isGuest) fetchPendingGasps();
  }, [isGuest, fetchPendingGasps]);

  const [preloadingId, setPreloadingId] = useState<string | null>(null);

  const handleCardPress = useCallback(async (gasp: Gasp) => {
    if (preloadingId) return;
    setPreloadingId(gasp.id);
    await openGaspViewer({
      imageUri: gasp.imageUri,
      senderName: gasp.senderName,
      mediaType: gasp.mediaType,
      blurhash: gasp.blurhash,
      textOverlay: gasp.textOverlay,
      gaspId: gasp.id,
    });
    setPreloadingId(null);
  }, [preloadingId]);

  const renderItem = useCallback(
    ({ item }: { item: Gasp }) => (
      <Pressable onPress={() => handleCardPress(item)}>
        {preloadingId === item.id && (
          <View style={styles.preloadOverlay}>
            <ActivityIndicator size="small" color="#FFFFFF" />
          </View>
        )}
        <FeedCard
          senderName={item.senderName}
          imageUri={item.imageUri}
          blurhash={item.blurhash}
          createdAt={item.createdAt}
        />
      </Pressable>
    ),
    [handleCardPress, preloadingId]
  );

  const keyExtractor = useCallback((item: Gasp) => item.id, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FeedHeader newCount={newCount} />

      {isLoading && pendingGasps.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : pendingGasps.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="body" style={styles.emptyText}>
            {'No gasps yet. Send one to a friend!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={pendingGasps}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 15,
  },
  preloadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: 16,
  },
});

import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { FeedHeader } from '@/components/inbox/FeedHeader';
import { FeedCard } from '@/components/inbox/FeedCard';
import { FeedCardSkeleton } from '@/components/inbox/FeedCardSkeleton';
import { QueryState } from '@/components/ui/QueryState';
import { useAuthStore } from '@/stores/authStore';
import { usePendingGasps } from '@/hooks/queries/useGasps';
import { openGaspViewer } from '@/services/navigation';
import { colors } from '@/constants/colors';
import type { Gasp } from '@/services/api/schemas/gasp.schema';

export default function InboxScreen() {
  const insets = useSafeAreaInsets();
  const isGuest = useAuthStore((s) => s.isGuest);
  const { data: pendingGasps, isLoading, isError, refetch } = usePendingGasps(!isGuest);

  const newCount = useMemo(() =>
    (pendingGasps ?? []).filter((g) => g.status === 'pending').length,
    [pendingGasps]
  );

  const handleRefresh = useCallback(() => {
    if (!isGuest) refetch();
  }, [isGuest, refetch]);

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

      <QueryState
        data={pendingGasps}
        isLoading={isLoading}
        isError={isError}
        refetch={refetch}
        skeleton={<FeedCardSkeleton />}
        emptyTitle="No gasps yet"
        emptySubtitle="Send one to a friend!"
        emptyIcon={<Camera size={40} color={colors.textTertiary} />}
        emptyCta={{ label: 'Open Camera', onPress: () => router.push('/(tabs)/camera') }}
      >
        {(gasps) => (
          <FlatList
            data={gasps}
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
      </QueryState>
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
  preloadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: 16,
  },
});

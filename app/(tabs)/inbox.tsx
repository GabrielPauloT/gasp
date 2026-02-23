import { useEffect, useCallback } from 'react';
import { StyleSheet, View, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FeedHeader } from '@/components/inbox/FeedHeader';
import { FeedCard } from '@/components/inbox/FeedCard';
import { Text } from '@/components/ui/Text';
import { useGaspStore } from '@/stores/gaspStore';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';
import type { Gasp } from '@/types/gasp';

export default function InboxScreen() {
  const insets = useSafeAreaInsets();
  const isGuest = useAuthStore((s) => s.isGuest);
  const pendingGasps = useGaspStore((s) => s.pendingGasps);
  const isLoading = useGaspStore((s) => s.isLoadingPending);
  const fetchPendingGasps = useGaspStore((s) => s.fetchPendingGasps);

  useEffect(() => {
    if (!isGuest) {
      fetchPendingGasps();
    }
  }, [isGuest, fetchPendingGasps]);

  const handleRefresh = useCallback(() => {
    if (!isGuest) fetchPendingGasps();
  }, [isGuest, fetchPendingGasps]);

  const handleCardPress = useCallback((gaspId: string) => {
    router.push({ pathname: '/(modals)/view-gasp', params: { gaspId } });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Gasp }) => (
      <Pressable onPress={() => handleCardPress(item.id)}>
        <FeedCard
          senderName={item.senderName}
          imageUri={item.imageUri}
          blurhash={item.blurhash}
          createdAt={item.createdAt}
        />
      </Pressable>
    ),
    [handleCardPress]
  );

  const keyExtractor = useCallback((item: Gasp) => item.id, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FeedHeader newCount={pendingGasps.filter((g) => g.status === 'pending').length} />

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
});

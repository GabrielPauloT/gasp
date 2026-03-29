import { useCallback, useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Camera, Flame } from 'lucide-react-native';
import { FeedHeader } from '@/components/inbox/FeedHeader';
import { FeedCard } from '@/components/inbox/FeedCard';
import { FeedCardSkeleton } from '@/components/inbox/FeedCardSkeleton';
import { SectionHeader } from '@/components/inbox/SectionHeader';
import { FriendRequestSection } from '@/components/inbox/FriendRequestSection';
import { ReactionSection } from '@/components/inbox/ReactionSection';
import { QueryState } from '@/components/ui/QueryState';
import { useAuthStore } from '@/stores/authStore';
import { useGaspStore } from '@/stores/gaspStore';
import { usePendingGasps } from '@/hooks/queries/useGasps';
import { usePendingFriendRequests, useAcceptFriendRequest, useRejectFriendRequest } from '@/hooks/queries/useFriends';
import { openGaspViewer } from '@/services/navigation';
import { colors } from '@/constants/colors';
import type { Gasp } from '@/services/api/schemas/gasp.schema';

export default function InboxScreen() {
  const insets = useSafeAreaInsets();
  const isGuest = useAuthStore((s) => s.isGuest);

  // Friend requests
  const { data: friendRequests = [], isLoading: isLoadingRequests, refetch: refetchRequests } = usePendingFriendRequests(!isGuest);
  const acceptMutation = useAcceptFriendRequest();
  const rejectMutation = useRejectFriendRequest();

  const handleAccept = useCallback((friendshipId: string) => {
    acceptMutation.mutate(friendshipId);
  }, [acceptMutation]);

  const handleReject = useCallback((friendshipId: string) => {
    rejectMutation.mutate(friendshipId);
  }, [rejectMutation]);

  // Gasps
  const { data: pendingGasps = [], isLoading: isLoadingGasps, isError: isErrorGasps, refetch: refetchGasps } = usePendingGasps(!isGuest);

  // Reactions (from Zustand store)
  const reactions = useGaspStore((s) => s.reactions);

  // Refresh all
  const handleRefresh = useCallback(() => {
    refetchGasps();
    refetchRequests();
  }, [refetchGasps, refetchRequests]);

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

  const newCount = (pendingGasps.filter((g) => g.status === 'pending').length) + friendRequests.length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FeedHeader newCount={newCount} />

      {isLoadingGasps && pendingGasps.length === 0 ? (
        <FeedCardSkeleton />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          refreshControl={
            <RefreshControl
              refreshing={isLoadingGasps || isLoadingRequests}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* Section 1: Friend Requests — only if requests exist */}
          {friendRequests.length > 0 && (
            <FriendRequestSection
              requests={friendRequests}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          )}

          {/* Section 2: Gasps — SectionHeader + FeedCards mapped directly */}
          {pendingGasps.length > 0 && (
            <>
              <SectionHeader icon={<Flame size={16} color="#EC4899" />} title="NEW GASPS" count={pendingGasps.length} badgeColor="#EC4899" />
              {pendingGasps.map((gasp) => (
                <Pressable
                  key={gasp.id}
                  onPress={() => handleCardPress(gasp)}
                  accessibilityRole="button"
                  accessibilityLabel={`View gasp from ${gasp.senderName}`}
                >
                  {preloadingId === gasp.id && (
                    <View style={styles.preloadOverlay}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    </View>
                  )}
                  <FeedCard
                    senderName={gasp.senderName}
                    imageUri={gasp.imageUri}
                    blurhash={gasp.blurhash}
                    createdAt={gasp.createdAt}
                  />
                </Pressable>
              ))}
            </>
          )}

          {/* Section 3: Reactions — only if reactions exist */}
          {reactions.length > 0 && (
            <ReactionSection reactions={reactions} />
          )}

          {/* Global empty state — only when ALL sections are empty */}
          {friendRequests.length === 0 && pendingGasps.length === 0 && reactions.length === 0 && !isLoadingGasps && !isLoadingRequests && (
            <QueryState
              data={[]}
              isLoading={false}
              isError={false}
              refetch={() => {}}
              skeleton={null}
              emptyTitle="No activity yet"
              emptySubtitle="Send a gasp to a friend!"
              emptyIcon={<Camera size={40} color={colors.textTertiary} />}
              emptyCta={{ label: 'Open Camera', onPress: () => router.push('/(tabs)/camera') }}
            >
              {() => null}
            </QueryState>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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

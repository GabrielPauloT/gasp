import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { LegendList } from '@legendapp/list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { openChat } from '@/services/navigation';
import { InboxHeader } from '@/components/inbox/InboxHeader';
import { StatsRow } from '@/components/inbox/StatsRow';
import { FriendListItem } from '@/components/inbox/FriendListItem';
import { SendGaspToAllButton } from '@/components/inbox/SendGaspToAllButton';
import { ConversationListSkeleton } from '@/components/chat/ConversationListSkeleton';
import { SearchBar } from '@/components/ui/SearchBar';
import { useInboxStore, useFilteredFriends } from '@/stores/inboxStore';
import { useAuthStore } from '@/stores/authStore';
import { useFriends } from '@/hooks/queries/useFriends';
import { useGetOrCreateConversation } from '@/hooks/queries/useChat';
import type { InboxFriend } from '@/stores/inboxStore';
import { colors } from '@/constants/colors';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const isGuest = useAuthStore((s) => s.isGuest);
  const searchQuery = useInboxStore((s) => s.searchQuery);
  const setSearchQuery = useInboxStore((s) => s.setSearchQuery);
  const friendCount = useInboxStore((s) => s.friendCount);
  const newGaspCount = useInboxStore((s) => s.newGaspCount);
  const onlineCount = useInboxStore((s) => s.onlineCount);
  const filteredFriends = useFilteredFriends();
  const { isLoading: isFriendsLoading } = useFriends(!isGuest);

  const getOrCreateConversation = useGetOrCreateConversation();

  const handleFriendPress = useCallback(async (friend: InboxFriend) => {
    try {
      const conv = await getOrCreateConversation.mutateAsync(friend.id);
      openChat({
        conversationId: conv.id,
        name: friend.name,
        avatarUrl: friend.avatarUrl || undefined,
      });
    } catch (error) {
      console.error('Failed to open chat:', error);
    }
  }, [getOrCreateConversation]);

  const handleSendGaspToAll = () => {
    router.push('/(tabs)/camera');
  };

  const handleCameraPress = () => {
    router.push('/(tabs)/camera');
  };

  const renderItem = useCallback(
    ({ item }: { item: InboxFriend }) => (
      <FriendListItem
        id={item.id}
        name={item.name}
        avatarUrl={item.avatarUrl}
        onlineStatus={item.onlineStatus}
        statusText={item.statusText}
        statusEmoji={item.statusEmoji}
        timestamp={item.timestamp}
        actionType={item.actionType}
        badgeCount={item.badgeCount}
        thumbnailUrl={item.thumbnailUrl}
        onPress={() => handleFriendPress(item)}
      />
    ),
    [handleFriendPress]
  );

  const keyExtractor = useCallback((item: InboxFriend) => item.id, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {isFriendsLoading && filteredFriends.length === 0 && <ConversationListSkeleton />}
      <LegendList
        data={filteredFriends}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={
          <View>
            <InboxHeader onCameraPress={handleCameraPress} />
            <View style={styles.searchContainer}>
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search friends..."
              />
            </View>
            <StatsRow
              friendCount={friendCount}
              newGaspCount={newGaspCount}
              onlineCount={onlineCount}
            />
          </View>
        }
        estimatedItemSize={80}
        contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
        recycleItems
      />
      <SendGaspToAllButton onPress={handleSendGaspToAll} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
});

import { useEffect, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { LegendList } from '@legendapp/list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { InboxHeader } from '@/components/inbox/InboxHeader';
import { StatsRow } from '@/components/inbox/StatsRow';
import { FriendListItem } from '@/components/inbox/FriendListItem';
import { SendGaspToAllButton } from '@/components/inbox/SendGaspToAllButton';
import { SearchBar } from '@/components/ui/SearchBar';
import { useInboxStore, useFilteredFriends } from '@/stores/inboxStore';
import type { InboxFriend } from '@/stores/inboxStore';
import { colors } from '@/constants/colors';

// Mock data matching the Figma prototype
const MOCK_FRIENDS: InboxFriend[] = [
  {
    id: '1',
    name: 'Sarah',
    username: 'sarah_g',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
    onlineStatus: 'online',
    statusText: 'REACTION RECEIVED',
    statusEmoji: '',
    timestamp: 'JUST NOW',
    actionType: 'thumbnail',
    badgeCount: 0,
    thumbnailUrl: 'https://picsum.photos/100/100?random=1',
  },
  {
    id: '2',
    name: 'Emily',
    username: 'emily_m',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
    onlineStatus: 'online',
    statusText: 'omg did you see that??',
    statusEmoji: '\uD83D\uDE31',
    timestamp: '2M',
    actionType: 'badge',
    badgeCount: 3,
    thumbnailUrl: null,
  },
  {
    id: '3',
    name: 'Jake',
    username: 'jake_r',
    avatarUrl: 'https://i.pravatar.cc/150?img=3',
    onlineStatus: 'offline',
    statusText: 'Sent you a gasp \uD83D\uDD25',
    statusEmoji: '',
    timestamp: '15M',
    actionType: 'eye',
    badgeCount: 0,
    thumbnailUrl: null,
  },
  {
    id: '4',
    name: 'Emma',
    username: 'emma_w',
    avatarUrl: 'https://i.pravatar.cc/150?img=9',
    onlineStatus: 'offline',
    statusText: 'HAHAHA your reaction was priceless',
    statusEmoji: '',
    timestamp: '1H',
    actionType: 'none',
    badgeCount: 0,
    thumbnailUrl: null,
  },
  {
    id: '5',
    name: 'Marcus',
    username: 'marcus_j',
    avatarUrl: 'https://i.pravatar.cc/150?img=7',
    onlineStatus: 'online',
    statusText: 'Bro you gotta gasp this',
    statusEmoji: '',
    timestamp: '3H',
    actionType: 'badge',
    badgeCount: 1,
    thumbnailUrl: null,
  },
  {
    id: '6',
    name: 'Olivia',
    username: 'olivia_p',
    avatarUrl: 'https://i.pravatar.cc/150?img=10',
    onlineStatus: 'offline',
    statusText: 'Your gasp yesterday made my day \uD83D\uDC9C',
    statusEmoji: '',
    timestamp: '5H',
    actionType: 'none',
    badgeCount: 0,
    thumbnailUrl: null,
  },
  {
    id: '7',
    name: 'Alex',
    username: 'alex_k',
    avatarUrl: 'https://i.pravatar.cc/150?img=11',
    onlineStatus: 'online',
    statusText: 'That gasp was epic',
    statusEmoji: '\uD83D\uDE0E',
    timestamp: '6H',
    actionType: 'badge',
    badgeCount: 2,
    thumbnailUrl: null,
  },
  {
    id: '8',
    name: 'Sophia',
    username: 'sophia_l',
    avatarUrl: 'https://i.pravatar.cc/150?img=20',
    onlineStatus: 'offline',
    statusText: 'That was hilarious \uD83D\uDE02',
    statusEmoji: '',
    timestamp: '1D',
    actionType: 'none',
    badgeCount: 0,
    thumbnailUrl: null,
  },
];

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const searchQuery = useInboxStore((s) => s.searchQuery);
  const { setSearchQuery } = useInboxStore();
  const friendCount = useInboxStore((s) => s.friendCount);
  const newGaspCount = useInboxStore((s) => s.newGaspCount);
  const onlineCount = useInboxStore((s) => s.onlineCount);
  const { setFriends } = useInboxStore();
  const filteredFriends = useFilteredFriends();

  useEffect(() => {
    setFriends(MOCK_FRIENDS);
  }, [setFriends]);

  const handleFriendPress = useCallback((id: string) => {
    router.push({
      pathname: '/(modals)/view-gasp',
      params: { gaspId: id },
    });
  }, []);

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
        onPress={handleFriendPress}
      />
    ),
    [handleFriendPress]
  );

  const keyExtractor = useCallback((item: InboxFriend) => item.id, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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

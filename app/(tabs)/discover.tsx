import { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { SearchBar } from '@/components/ui/SearchBar';
import { DiscoverHeader } from '@/components/discover/DiscoverHeader';
import { PendingRequests } from '@/components/discover/PendingRequests';
import {
  UserSearchResult,
  type RequestStatus,
} from '@/components/discover/UserSearchResult';
import { useInboxStore } from '@/stores/inboxStore';
import { useAuthStore } from '@/stores/authStore';
import * as usersApi from '@/services/api/users';
import * as friendsApi from '@/services/api/friends';
import type { FriendRequest } from '@/services/api/friends';
import type { User } from '@/types/user';
import { colors } from '@/constants/colors';
import { Search, UserX } from 'lucide-react-native';

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const isGuest = useAuthStore((s) => s.isGuest);
  const currentUser = useAuthStore((s) => s.user);
  const friends = useInboxStore((s) => s.friends);
  const sendFriendRequest = useInboxStore((s) => s.sendFriendRequest);
  const acceptFriendRequest = useInboxStore((s) => s.acceptFriendRequest);
  const rejectFriendRequest = useInboxStore((s) => s.rejectFriendRequest);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequestIds, setSentRequestIds] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Fetch pending requests when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (!isGuest) {
        friendsApi.getPendingRequests().then(setPendingRequests).catch(() => {});
      }
    }, [isGuest]),
  );

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await usersApi.searchUsers(searchQuery.trim());
        setSearchResults(results);
        setHasSearched(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  const getRequestStatus = useCallback(
    (userId: string): RequestStatus => {
      if (friends.some((f) => f.id === userId)) return 'already_friends';
      if (sentRequestIds.has(userId)) return 'sent';
      return 'none';
    },
    [friends, sentRequestIds],
  );

  const handleAdd = async (addresseeId: string) => {
    await sendFriendRequest(addresseeId);
    setSentRequestIds((prev) => new Set(prev).add(addresseeId));
  };

  const handleAccept = async (friendshipId: string) => {
    await acceptFriendRequest(friendshipId);
    setPendingRequests((prev) => prev.filter((r) => r.friendshipId !== friendshipId));
  };

  const handleReject = async (friendshipId: string) => {
    await rejectFriendRequest(friendshipId);
    setPendingRequests((prev) => prev.filter((r) => r.friendshipId !== friendshipId));
  };

  const renderSearchResult = ({ item }: { item: User }) => (
    <UserSearchResult
      id={item.id}
      displayName={item.displayName}
      username={item.username}
      avatarUrl={item.avatarUrl}
      status={getRequestStatus(item.id)}
      onAdd={handleAdd}
    />
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={hasSearched ? searchResults : []}
        renderItem={renderSearchResult}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
        contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
        ListHeaderComponent={
          <View>
            <DiscoverHeader />

            <View style={styles.searchContainer}>
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by username or name..."
              />
            </View>

            {/* Pending friend requests */}
            {!searchQuery && pendingRequests.length > 0 && (
              <View style={styles.section}>
                <PendingRequests
                  requests={pendingRequests}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              </View>
            )}

            {/* Search states */}
            {isSearching && (
              <View style={styles.centerState}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}

            {!isSearching && hasSearched && searchResults.length === 0 && (
              <View style={styles.centerState}>
                <UserX size={48} color={colors.textTertiary} />
                <Text variant="body" style={styles.emptyTitle}>
                  {'No users found'}
                </Text>
                <Text variant="caption" style={styles.emptySubtitle}>
                  {`No results for "${searchQuery}"`}
                </Text>
              </View>
            )}

            {!searchQuery && !hasSearched && pendingRequests.length === 0 && (
              <View style={styles.centerState}>
                <Search size={48} color={colors.textTertiary} />
                <Text variant="body" style={styles.emptyTitle}>
                  {'Find your friends'}
                </Text>
                <Text variant="caption" style={styles.emptySubtitle}>
                  {'Search by username or name to add friends'}
                </Text>
              </View>
            )}
          </View>
        }
      />
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
    paddingBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

import { ScrollView, StyleSheet } from 'react-native';
import { UserPlus } from 'lucide-react-native';
import { SectionHeader } from './SectionHeader';
import { FriendRequestCard } from './FriendRequestCard';
import type { FriendRequest } from '@/services/api/schemas/friendRequest.schema';

interface FriendRequestSectionProps {
  requests: FriendRequest[];
  onAccept: (friendshipId: string) => void;
  onReject: (friendshipId: string) => void;
}

export function FriendRequestSection({ requests, onAccept, onReject }: FriendRequestSectionProps) {
  return (
    <>
      <SectionHeader
        icon={<UserPlus size={16} color="#F59E0B" />}
        title="FRIEND REQUESTS"
        count={requests.length}
        badgeColor="#F59E0B"
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {requests.map((request) => (
          <FriendRequestCard
            key={request.friendshipId}
            request={request}
            onAccept={onAccept}
            onReject={onReject}
          />
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
});

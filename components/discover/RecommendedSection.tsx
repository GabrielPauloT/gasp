import { StyleSheet, View, FlatList } from 'react-native';
import { Text } from '@/components/ui/Text';
import { colors } from '@/constants/colors';
import { UserCard } from './UserCard';
import type { RecommendedUser } from '@/types/discover';

interface RecommendedSectionProps {
  title: string;
  icon: React.ReactNode;
  users: RecommendedUser[];
  showGradientRing?: boolean;
  onAddUser: (id: string) => Promise<void>;
  friendIds: Set<string>;
}

export function RecommendedSection({
  title, icon, users, showGradientRing, onAddUser, friendIds,
}: RecommendedSectionProps) {
  if (users.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {icon}
        <Text variant="body" style={styles.title}>{title}</Text>
      </View>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <UserCard
            user={item}
            showGradientRing={showGradientRing}
            onAdd={onAddUser}
            isFriend={friendIds.has(item.id)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20 },
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  listContent: { paddingHorizontal: 20 },
  separator: { width: 10 },
});

import { StyleSheet, View, Pressable } from 'react-native';
import { Text } from '@/components/ui/Text';
import { UserPlus } from 'lucide-react-native';
import { colors } from '@/constants/colors';

export function SuggestedFriends() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <UserPlus size={20} color={colors.accentPink} />
        <Text variant="body" style={styles.headerText}>
          {'Suggested Friends'}
        </Text>
      </View>
      <View style={styles.placeholder}>
        <Text variant="caption" style={styles.placeholderText}>
          {'Friend suggestions will appear here'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  placeholder: {
    height: 150,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.textTertiary,
  },
});

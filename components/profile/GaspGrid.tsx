import { StyleSheet, View, Dimensions, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/components/ui/Text';
import { colors } from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GAP = 4;
const COLUMNS = 3;
const ITEM_SIZE = (SCREEN_WIDTH - 40 - GAP * (COLUMNS - 1)) / COLUMNS;

interface GaspGridItem {
  id: string;
  imageUri: string;
  blurhash?: string;
}

interface GaspGridProps {
  items: GaspGridItem[];
  onItemPress?: (id: string) => void;
}

export function GaspGrid({ items, onItemPress }: GaspGridProps) {
  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text variant="body" style={styles.emptyText}>
          {'No gasps yet'}
        </Text>
        <Text variant="caption" style={styles.emptySubtext}>
          {'Send your first gasp to get started!'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => onItemPress?.(item.id)}
          style={styles.gridItem}
        >
          <Image
            source={{ uri: item.imageUri }}
            placeholder={item.blurhash ? { blurhash: item.blurhash } : undefined}
            style={styles.gridImage}
            contentFit="cover"
            transition={200}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    paddingHorizontal: 20,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE * 1.3,
    borderRadius: 8,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textTertiary,
  },
});

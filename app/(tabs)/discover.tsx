import { StyleSheet, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DiscoverHeader } from '@/components/discover/DiscoverHeader';
import { TrendingGasps } from '@/components/discover/TrendingGasps';
import { SuggestedFriends } from '@/components/discover/SuggestedFriends';
import { colors } from '@/constants/colors';

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 100,
        gap: 24,
      }}
      contentInsetAdjustmentBehavior="automatic"
    >
      <DiscoverHeader />
      <TrendingGasps />
      <SuggestedFriends />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

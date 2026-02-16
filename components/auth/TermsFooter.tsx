import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { colors } from '@/constants/colors';

export function TermsFooter() {
  return (
    <View style={styles.container}>
      <Text variant="caption" style={styles.text}>
        {'By continuing, you agree to our '}
        <Text variant="caption" style={styles.link}>
          {'Terms'}
        </Text>
        {' & '}
        <Text variant="caption" style={styles.link}>
          {'Privacy Policy'}
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 32,
    paddingBottom: 16,
  },
  text: {
    textAlign: 'center',
    color: colors.textTertiary,
    fontSize: 12,
  },
  link: {
    color: colors.primaryLight,
    fontSize: 12,
  },
});

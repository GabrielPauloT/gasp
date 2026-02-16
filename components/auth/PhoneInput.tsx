import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { colors } from '@/constants/colors';
import { Phone } from 'lucide-react-native';

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  countryCode?: string;
}

export function PhoneInput({
  value,
  onChangeText,
  countryCode = '+1',
}: PhoneInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        isFocused ? styles.containerFocused : null,
      ]}
    >
      <View style={styles.countryCode}>
        <Phone size={18} color={colors.textSecondary} />
        <Text variant="body" style={styles.codeText}>
          {countryCode}
        </Text>
      </View>
      <View style={styles.divider} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="Phone number"
        placeholderTextColor={colors.textMuted}
        keyboardType="phone-pad"
        autoFocus
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.border,
    height: 56,
    paddingHorizontal: 16,
  },
  containerFocused: {
    borderColor: colors.primary,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeText: {
    color: colors.textPrimary,
    fontSize: 16,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
});

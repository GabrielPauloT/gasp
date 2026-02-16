import { useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { colors } from '@/constants/colors';

export default function PhoneLoginScreen() {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');

  const handleContinue = () => {
    if (phone.length >= 10) {
      router.push({
        pathname: '/(auth)/verify-code',
        params: { phoneNumber: phone },
      });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <ArrowLeft size={24} color={colors.textPrimary} />
      </Pressable>

      <View style={styles.content}>
        <Text variant="title" style={styles.title}>
          {"What's your number?"}
        </Text>
        <Text variant="body" style={styles.subtitle}>
          {"We'll send you a verification code"}
        </Text>

        <View style={styles.inputContainer}>
          <PhoneInput value={phone} onChangeText={setPhone} />
        </View>

        <Pressable
          onPress={handleContinue}
          style={[
            styles.continueButton,
            phone.length < 10 ? styles.continueButtonDisabled : null,
          ]}
          disabled={phone.length < 10}
        >
          <Text variant="body" style={styles.continueText}>
            {'Continue'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  inputContainer: {
    marginVertical: 8,
  },
  continueButton: {
    height: 56,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

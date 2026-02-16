import { StyleSheet, View, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { OtpInput } from '@/components/auth/OtpInput';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';

export default function VerifyCodeScreen() {
  const insets = useSafeAreaInsets();
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();
  const { continueAsGuest } = useAuthStore();

  const handleComplete = (code: string) => {
    // TODO: Verify code with backend
    // For now, just continue as guest
    continueAsGuest();
    router.replace('/(tabs)/camera');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <ArrowLeft size={24} color={colors.textPrimary} />
      </Pressable>

      <View style={styles.content}>
        <Text variant="title" style={styles.title}>
          {'Enter the code'}
        </Text>
        <Text variant="body" style={styles.subtitle}>
          {`We sent a 6-digit code to ${phoneNumber ?? 'your phone'}`}
        </Text>

        <View style={styles.otpContainer}>
          <OtpInput onComplete={handleComplete} />
        </View>

        <Pressable style={styles.resendButton}>
          <Text variant="body" style={styles.resendText}>
            {"Didn't receive a code? "}
            <Text variant="body" style={styles.resendLink}>
              {'Resend'}
            </Text>
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
    marginBottom: 16,
  },
  otpContainer: {
    marginVertical: 16,
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  resendLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});

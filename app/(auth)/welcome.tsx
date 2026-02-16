import { StyleSheet, View, ScrollView, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { Divider } from '@/components/ui/Divider';
import { AuthButton } from '@/components/auth/AuthButton';
import { TermsFooter } from '@/components/auth/TermsFooter';
import { GradientCircle } from '@/components/ui/GradientCircle';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { continueAsGuest } = useAuthStore();

  // Escala o logo baseado na altura da tela
  const logoSize = Math.min(140, Math.max(100, height * 0.16));

  const handlePhoneLogin = () => {
    router.push('/(auth)/phone-login');
  };

  const handleAppleLogin = () => {
    // TODO: Implement Apple Sign-In
    handleGuestLogin();
  };

  const handleGuestLogin = () => {
    continueAsGuest();
    router.replace('/(tabs)/camera');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Background glow effect */}
      <View style={styles.glowContainer}>
        <View style={styles.glow} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { minHeight: height - insets.top, paddingBottom: insets.bottom + 16 },
        ]}
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Spacer top — empurra o conteúdo para o centro */}
        <View style={styles.spacer} />

        {/* Logo */}
        <Animated.View
          entering={FadeIn.duration(800).delay(200)}
          style={styles.logoWrapper}
        >
          <GradientCircle size={logoSize}>
            <View style={styles.smileyFace}>
              <View style={styles.eyesRow}>
                <View style={styles.eye} />
                <View style={styles.eye} />
              </View>
              <View style={styles.smile} />
            </View>
          </GradientCircle>
        </Animated.View>

        {/* App Name */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(400)}
          style={styles.textWrapper}
        >
          <Text variant="title" style={styles.appName}>
            {'GASP'}
          </Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(600)}
          style={styles.textWrapper}
        >
          <Text variant="subtitle" style={styles.tagline}>
            {'Real reactions. No filters.'}
          </Text>
        </Animated.View>

        {/* Spacer middle — empurra os botões para baixo */}
        <View style={styles.spacer} />

        {/* Auth Buttons */}
        <View style={styles.authSection}>
          <Animated.View
            entering={FadeInDown.duration(500).delay(800)}
            style={styles.buttonWrapper}
          >
            <AuthButton variant="phone" onPress={handlePhoneLogin} />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(500).delay(900)}
            style={styles.buttonWrapper}
          >
            <AuthButton variant="apple" onPress={handleAppleLogin} />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(500).delay(1000)}>
            <Divider text="OR" />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(500).delay(1100)}
            style={styles.buttonWrapper}
          >
            <AuthButton variant="guest" onPress={handleGuestLogin} />
          </Animated.View>
        </View>

        {/* Terms Footer */}
        <Animated.View
          entering={FadeIn.duration(500).delay(1200)}
          style={styles.footer}
        >
          <TermsFooter />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 80,
  },
  glow: {
    width: 300,
    height: 300,
    borderRadius: 150,
    // @ts-ignore
    experimental_backgroundImage:
      'radial-gradient(circle, rgba(124, 58, 237, 0.2), rgba(236, 72, 153, 0.1), transparent 70%)',
  },
  scrollContent: {
    flexGrow: 1,
  },
  spacer: {
    flexGrow: 1,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  textWrapper: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 4,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 17,
    color: colors.textSecondary,
    fontWeight: '400',
    marginBottom: 8,
  },
  smileyFace: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  eyesRow: {
    flexDirection: 'row',
    gap: 24,
  },
  eye: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accentPink,
  },
  smile: {
    width: 30,
    height: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    borderWidth: 2.5,
    borderTopWidth: 0,
    borderColor: colors.accentCyan,
  },
  authSection: {
    paddingHorizontal: 24,
    gap: 12,
    marginTop: 16,
  },
  buttonWrapper: {
    width: '100%',
  },
  footer: {
    paddingTop: 20,
  },
});

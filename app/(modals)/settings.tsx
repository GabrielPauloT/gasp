import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { ArrowLeft, LogOut, ChevronRight, User, Bell, Lock, CircleHelp, Shield } from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
      if (router.canDismiss()) {
        router.dismissAll();
      }
      setTimeout(() => {
        router.replace('/(auth)/welcome'); 
      }, 100);
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const menuItems = [
    { id: 'account', icon: User, label: 'Account Settings', color: colors.primary },
    { id: 'notifications', icon: Bell, label: 'Notifications', color: colors.accentPink },
    { id: 'privacy', icon: Lock, label: 'Privacy & Security', color: colors.accentCyan },
    { id: 'help', icon: CircleHelp, label: 'Help & Support', color: colors.warning },
    { id: 'about', icon: Shield, label: 'About', color: colors.success },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon={<ArrowLeft size={24} color={colors.textPrimary} />}
          onPress={() => router.back()}
        />
        <Text variant="title" weight="bold">Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        {user && (
          <View style={styles.profileCard}>
            <Avatar uri={user.avatarUrl} size={64} initials={user.displayName} />
            <View style={styles.profileInfo}>
              <Text variant="subtitle" weight="bold">{user.displayName || 'Guest'}</Text>
              <Text variant="body" color={colors.textSecondary}>@{user.username || 'guest'}</Text>
            </View>
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isLast = index === menuItems.length - 1;
            return (
              <TouchableOpacity key={item.id} style={[styles.menuItem, isLast && { borderBottomWidth: 0 }]} activeOpacity={0.7}>
                <View style={styles.menuItemLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
                    <Icon size={20} color={item.color} />
                  </View>
                  <Text variant="body" weight="500">{item.label}</Text>
                </View>
                <ChevronRight size={20} color={colors.borderLight} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Actions */}
        <View style={styles.actionSection}>
          <Button
            variant="secondary"
            size="lg"
            onPress={handleLogout}
            leftIcon={<LogOut size={20} color={colors.error} />}
            className="w-full"
          >
            <Text color={colors.error} weight="bold">Log Out</Text>
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 20 : 32, // Accommodate modal pull bar
    paddingBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  menuSection: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 32,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionSection: {
    marginTop: 8,
  },
});

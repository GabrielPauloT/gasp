import { View, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Compass,
  Camera,
  Inbox,
  MessageCircle,
  User,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import { TabBarIcon } from './TabBarIcon';
import { ContentTypeIndicator } from '@/components/ui/ContentTypeIndicator';
import { useConversations } from '@/hooks/queries/useChat';
import { usePendingGasps } from '@/hooks/queries/useGasps';

const TAB_ICONS: Record<string, LucideIcon> = {
  discover: Compass,
  camera: Camera,
  inbox: Inbox,
  chat: MessageCircle,
  profile: User,
};

const TAB_LABELS: Record<string, string> = {
  discover: 'Discover',
  camera: 'Camera',
  inbox: 'Gasps',
  chat: 'Chat',
  profile: 'Profile',
};

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const { data: conversations } = useConversations();
  const { data: pendingGasps } = usePendingGasps();

  const hasUnreadChats = conversations?.some((c) => c.unreadCount > 0) ?? false;
  const hasUnreadGasps = (pendingGasps?.length ?? 0) > 0;

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 8) },
      ]}
    >
      <BlurView
        intensity={80}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.overlay} />

      <View style={styles.tabsRow}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const Icon = TAB_ICONS[route.name] ?? Compass;
          const label = TAB_LABELS[route.name] ?? options.title ?? route.name;

          const showUnreadChat = route.name === 'chat' && hasUnreadChats;
          const showUnreadGasps = route.name === 'inbox' && hasUnreadGasps;

          return (
            <View key={route.key} style={styles.tabWrapper}>
              {showUnreadChat ? (
                <View style={styles.unreadDotContainer}>
                  <ContentTypeIndicator type="chat" size="sm" />
                </View>
              ) : null}
              {showUnreadGasps ? (
                <View style={styles.unreadDotContainer}>
                  <ContentTypeIndicator type="gasp" pulsing size="sm" />
                </View>
              ) : null}
              <TabBarIcon
                icon={Icon}
                label={label}
                focused={isFocused}
                onPress={onPress}
                onLongPress={onLongPress}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    borderCurve: 'continuous',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 15, 0.95)',
  },
  tabsRow: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
  },
  tabWrapper: {
    flex: 1,
    position: 'relative',
  },
  unreadDotContainer: {
    position: 'absolute',
    top: 6,
    right: '50%',
    marginRight: -18,
    zIndex: 10,
  },
});
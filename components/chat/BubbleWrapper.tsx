import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/Text';
import { colors } from '@/constants/colors';
import type { ReactNode } from 'react';

interface BubbleWrapperProps {
  isOwnMessage: boolean;
  isSequential: boolean;
  createdAt: string;
  children: ReactNode;
}

export function BubbleWrapper({ isOwnMessage, isSequential, createdAt, children }: BubbleWrapperProps) {
  return (
    <View
      style={[
        styles.container,
        isOwnMessage ? styles.ownContainer : styles.otherContainer,
        { marginTop: isSequential ? 4 : 16 },
      ]}
    >
      {children}
      <Text variant="caption" style={[styles.time, isOwnMessage ? styles.ownTime : styles.otherTime]}>
        {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: '80%',
    paddingHorizontal: 16,
  },
  ownContainer: {
    alignSelf: 'flex-end',
  },
  otherContainer: {
    alignSelf: 'flex-start',
  },
  time: {
    marginTop: 4,
    fontSize: 11,
    color: colors.textSecondary,
  },
  ownTime: {
    alignSelf: 'flex-end',
    marginRight: 4,
  },
  otherTime: {
    alignSelf: 'flex-start',
    marginLeft: 4,
  },
});

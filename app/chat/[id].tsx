import { useEffect, useCallback, useState, useRef } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { IconButton } from '@/components/ui/IconButton';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';
import type { Message, Conversation } from '@/types/chat';

export default function ChatScreen() {
  const { id, name, avatarUrl } = useLocalSearchParams<{ id: string, name?: string, avatarUrl?: string }>();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  
  const user = useAuthStore((s) => s.user);
  const { openConversation, closeConversation, sendMessage, markAsRead, fetchMessages } = useChatStore();
  
  const conversations = useChatStore((s) => s.conversations);
  const isLoadingMessages = useChatStore((s) => s.isLoadingMessages);
  
  const messagesStore = useChatStore((s) => s.messages);
  const messages = messagesStore[id] ?? [];

  const conversation = conversations.find(c => c.id === id);

  // Participant resolution
  const otherParticipantName = conversation?.participantNames?.find(n => n !== user?.username && n !== user?.displayName) || name || 'Unknown';
  const otherParticipantAvatar = conversation?.participantAvatars?.find((a, idx) => conversation.participantIds[idx] !== user?.id) || avatarUrl;

  useEffect(() => {
    if (id) {
      openConversation(id);
      markAsRead(id);
      return () => closeConversation(id);
    }
  }, [id, openConversation, closeConversation, markAsRead]);

  const handleSend = useCallback((text: string) => {
    if (id) {
      sendMessage(id, text, 'text');
    }
  }, [id, sendMessage]);

  const renderItem = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.senderId === user?.id;
    // Check if the previous message rendered was from the same sender (for grouping visual)
    const nextMessage = index > 0 ? messages[index - 1] : null;
    const isSequential = nextMessage?.senderId === item.senderId;

    return (
      <MessageBubble
        message={item}
        isOwnMessage={isOwnMessage}
        isSequential={isSequential}
      />
    );
  }, [user?.id, messages]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon={<ArrowLeft size={24} color={colors.textPrimary} />}
            variant="ghost"
            onPress={() => router.back()}
          />
          <View style={styles.headerInfo}>
            <Avatar uri={otherParticipantAvatar || null} size={40} initials={otherParticipantName} />
            <Text variant="subtitle" style={styles.title}>{otherParticipantName}</Text>
          </View>
          <View style={styles.headerTrailing} />
        </View>

        {/* Message List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          inverted
          contentContainerStyle={[styles.listContent, { paddingBottom: 16 }]}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          ListEmptyComponent={
            isLoadingMessages ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 24 }} />
            ) : (
              <View style={styles.emptyContainer}>
                <Text variant="body" style={styles.emptyText}>Start the conversation by sending a gasp!</Text>
              </View>
            )
          }
        />

        {/* Input Area */}
        <ChatInput onSend={handleSend} isLoading={isLoadingMessages && messages.length === 0} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
    zIndex: 10,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerTrailing: {
    width: 44, // balance back button
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

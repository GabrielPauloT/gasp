export type MessageType = 'text' | 'gasp' | 'reaction' | 'image';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  createdAt: string;
  readAt?: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participantNames: string[];
  participantAvatars: (string | null)[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

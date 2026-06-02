import { z } from 'zod';

export const MessageTypeSchema = z.enum(['text', 'gasp', 'reaction', 'image']);
export type MessageType = z.infer<typeof MessageTypeSchema>;

export const MessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderId: z.string(),
  content: z.string(),
  type: MessageTypeSchema,
  createdAt: z.string(),
  readAt: z.string().optional(),
  mediaUrl: z.string().optional(),
  replyToId: z.string().nullable().optional(),
});

export type Message = z.infer<typeof MessageSchema>;

export const ConversationSchema = z.object({
  id: z.string(),
  participantIds: z.array(z.string()),
  participantNames: z.array(z.string()),
  participantAvatars: z.array(z.string().nullable()),
  lastMessage: MessageSchema.optional(),
  unreadCount: z.number(),
  updatedAt: z.string(),
  lastMessageAt: z.string().optional(),
});

export type Conversation = z.infer<typeof ConversationSchema>;

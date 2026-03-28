import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string(),
  avatarUrl: z.string().nullable(),
  phoneNumber: z.string().optional(),
  createdAt: z.string(),
});

export type User = z.infer<typeof UserSchema>;

export const FriendSchema = UserSchema.extend({
  onlineStatus: z.enum(['online', 'offline', 'away']),
  lastSeenAt: z.string(),
  friendshipId: z.string(),
});

export type Friend = z.infer<typeof FriendSchema>;

export type OnlineStatus = 'online' | 'offline' | 'away';

export const UserStatsSchema = z.object({
  gaspsSent: z.number(),
  gaspsReceived: z.number(),
  friendsCount: z.number(),
  streak: z.number().optional(),
  reactionsReceived: z.number().optional(),
});

export type UserStats = z.infer<typeof UserStatsSchema>;

export type UserBadge = 'top10' | 'rising' | 'new' | 'active' | null;

export const RecommendedUserSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string(),
  avatarUrl: z.string().nullable(),
  gaspScore: z.number(),
  streak: z.number(),
  mutualFriendsCount: z.number(),
  mutualFriendAvatars: z.array(z.string()),
  badge: z.enum(['top10', 'rising', 'new', 'active']).nullable(),
});

export type RecommendedUser = z.infer<typeof RecommendedUserSchema>;

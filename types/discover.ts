export type UserBadge = 'top10' | 'rising' | 'new' | 'active' | null;

export interface RecommendedUser {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  gaspScore: number;
  streak: number;
  mutualFriendsCount: number;
  mutualFriendAvatars: string[];
  badge: UserBadge;
}

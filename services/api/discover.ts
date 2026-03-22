import { api } from '@/services/api';
import type { RecommendedUser } from '@/types/discover';

const MOCK_PEOPLE_YOU_MAY_KNOW: RecommendedUser[] = [
  {
    id: 'mock-1', displayName: 'Sofia Martinez', username: 'sofia_m', avatarUrl: null,
    gaspScore: 342, streak: 7, mutualFriendsCount: 5, mutualFriendAvatars: [], badge: 'active',
  },
  {
    id: 'mock-2', displayName: 'Lucas Chen', username: 'lucas.chen', avatarUrl: null,
    gaspScore: 189, streak: 3, mutualFriendsCount: 3, mutualFriendAvatars: [], badge: null,
  },
  {
    id: 'mock-3', displayName: 'Emma Wilson', username: 'emma_w', avatarUrl: null,
    gaspScore: 95, streak: 0, mutualFriendsCount: 8, mutualFriendAvatars: [], badge: 'new',
  },
  {
    id: 'mock-4', displayName: 'Noah Kim', username: 'noah.kim', avatarUrl: null,
    gaspScore: 267, streak: 14, mutualFriendsCount: 2, mutualFriendAvatars: [], badge: 'rising',
  },
];

const MOCK_TOP_GASPERS: RecommendedUser[] = [
  {
    id: 'mock-5', displayName: 'Alex Rivera', username: 'alex_r', avatarUrl: null,
    gaspScore: 1247, streak: 42, mutualFriendsCount: 1, mutualFriendAvatars: [], badge: 'top10',
  },
  {
    id: 'mock-6', displayName: 'Mia Johnson', username: 'mia.j', avatarUrl: null,
    gaspScore: 983, streak: 28, mutualFriendsCount: 0, mutualFriendAvatars: [], badge: 'top10',
  },
  {
    id: 'mock-7', displayName: 'James Park', username: 'jpark', avatarUrl: null,
    gaspScore: 756, streak: 15, mutualFriendsCount: 4, mutualFriendAvatars: [], badge: 'rising',
  },
  {
    id: 'mock-8', displayName: 'Zara Ahmed', username: 'zara_a', avatarUrl: null,
    gaspScore: 621, streak: 21, mutualFriendsCount: 0, mutualFriendAvatars: [], badge: 'active',
  },
];

export async function getRecommendedUsers(): Promise<RecommendedUser[]> {
  try {
    const res = await api.get<RecommendedUser[]>('/users/recommended');
    return res.data;
  } catch {
    return MOCK_PEOPLE_YOU_MAY_KNOW;
  }
}

export async function getTopGaspers(): Promise<RecommendedUser[]> {
  try {
    const res = await api.get<RecommendedUser[]>('/users/top-gaspers');
    return res.data;
  } catch {
    return MOCK_TOP_GASPERS;
  }
}

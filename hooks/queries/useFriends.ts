import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/queryKeys';
import * as friendsApi from '@/services/api/friends';
import { z } from 'zod';
import { FriendSchema } from '@/services/api/schemas/user.schema';
import { validateResponse } from '@/services/api/schemas/common.schema';

export function useFriends(enabled = true) {
  return useQuery({
    queryKey: queryKeys.friends.all,
    queryFn: async () => {
      const data = await friendsApi.listFriends();
      return validateResponse(z.array(FriendSchema), data, 'listFriends');
    },
    enabled,
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (addresseeId: string) => friendsApi.sendRequest(addresseeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
    },
  });
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) => friendsApi.acceptRequest(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
    },
  });
}

export function useRejectFriendRequest() {
  return useMutation({
    mutationFn: (friendshipId: string) => friendsApi.rejectRequest(friendshipId),
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) => friendsApi.removeFriend(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
    },
  });
}

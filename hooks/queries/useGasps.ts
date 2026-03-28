import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { queryKeys } from '@/services/queryKeys';
import * as gaspsApi from '@/services/api/gasps';
import * as reactionsApi from '@/services/api/reactions';
import type { Gasp } from '@/services/api/schemas/gasp.schema';
import { GaspSchema } from '@/services/api/schemas/gasp.schema';
import { validateResponse } from '@/services/api/schemas/common.schema';

export function usePendingGasps(enabled = true) {
  return useQuery({
    queryKey: queryKeys.gasps.pending,
    queryFn: async () => {
      const data = await gaspsApi.getPendingGasps();
      return validateResponse(z.array(GaspSchema), data, 'getPendingGasps');
    },
    enabled,
  });
}

export function useSentGasps(enabled = true) {
  return useQuery({
    queryKey: queryKeys.gasps.sent,
    queryFn: async () => {
      const data = await gaspsApi.getSentGasps();
      return validateResponse(z.array(GaspSchema), data, 'getSentGasps');
    },
    enabled,
  });
}

export function useSendBatchGasp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      recipientIds: string[];
      imageUrl: string;
      mediaType?: 'image' | 'video';
      blurhash?: string;
      textOverlay?: string;
    }) => gaspsApi.sendBatchGasp(data),
    onSuccess: (newGasps) => {
      queryClient.setQueryData<Gasp[]>(queryKeys.gasps.sent, (old) =>
        [...newGasps, ...(old ?? [])],
      );
    },
  });
}

export function useViewGasp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (gaspId: string) => gaspsApi.markViewed(gaspId),
    onMutate: async (gaspId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.gasps.pending });
      const previous = queryClient.getQueryData<Gasp[]>(queryKeys.gasps.pending);
      queryClient.setQueryData<Gasp[]>(queryKeys.gasps.pending, (old) =>
        old?.filter((g) => g.id !== gaspId) ?? [],
      );
      return { previous };
    },
    onError: (_err, _gaspId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.gasps.pending, context.previous);
      }
    },
  });
}

export function useCreateReaction() {
  return useMutation({
    mutationFn: (data: { gaspId: string; videoUrl: string }) =>
      reactionsApi.createReaction(data),
  });
}

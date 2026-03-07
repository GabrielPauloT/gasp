import type { Gasp } from '@/types/gasp';

const NOW = new Date().toISOString();
const EXPIRES = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

/**
 * Mock gasps keyed by friend ID (matches inbox mock data).
 * Replace with API calls when backend is ready.
 */
export const MOCK_GASPS: Record<string, Gasp> = {
  '1': {
    id: '1',
    senderId: 'user-sarah',
    senderName: 'Sarah',
    senderAvatarUrl: 'https://i.pravatar.cc/150?img=1',
    imageUri: 'https://picsum.photos/seed/gasp1/400/800',
    blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
    status: 'pending',
    createdAt: NOW,
    expiresAt: EXPIRES,
  },
  '2': {
    id: '2',
    senderId: 'user-emily',
    senderName: 'Emily',
    senderAvatarUrl: 'https://i.pravatar.cc/150?img=5',
    imageUri: 'https://picsum.photos/seed/gasp2/400/800',
    blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.',
    status: 'pending',
    createdAt: NOW,
    expiresAt: EXPIRES,
  },
  '3': {
    id: '3',
    senderId: 'user-jake',
    senderName: 'Jake',
    senderAvatarUrl: 'https://i.pravatar.cc/150?img=3',
    imageUri: 'https://picsum.photos/seed/gasp3/400/800',
    blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
    status: 'pending',
    createdAt: NOW,
    expiresAt: EXPIRES,
  },
  '4': {
    id: '4',
    senderId: 'user-emma',
    senderName: 'Emma',
    senderAvatarUrl: 'https://i.pravatar.cc/150?img=9',
    imageUri: 'https://picsum.photos/seed/gasp4/400/800',
    blurhash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH',
    status: 'pending',
    createdAt: NOW,
    expiresAt: EXPIRES,
  },
  '5': {
    id: '5',
    senderId: 'user-marcus',
    senderName: 'Marcus',
    senderAvatarUrl: 'https://i.pravatar.cc/150?img=7',
    imageUri: 'https://picsum.photos/seed/gasp5/400/800',
    blurhash: 'L5H2EC=PM+yV0g-mq.wG9c010J}I',
    status: 'pending',
    createdAt: NOW,
    expiresAt: EXPIRES,
  },
  '6': {
    id: '6',
    senderId: 'user-olivia',
    senderName: 'Olivia',
    senderAvatarUrl: 'https://i.pravatar.cc/150?img=10',
    imageUri: 'https://picsum.photos/seed/gasp6/400/800',
    blurhash: 'LNAdAqj[00aymkj[TKay00ay~qj[',
    status: 'pending',
    createdAt: NOW,
    expiresAt: EXPIRES,
  },
  '7': {
    id: '7',
    senderId: 'user-alex',
    senderName: 'Alex',
    senderAvatarUrl: 'https://i.pravatar.cc/150?img=11',
    imageUri: 'https://picsum.photos/seed/gasp7/400/800',
    blurhash: 'LFJH2i-;9FNH~q-;M{M{00D%IUxu',
    status: 'pending',
    createdAt: NOW,
    expiresAt: EXPIRES,
  },
  '8': {
    id: '8',
    senderId: 'user-sophia',
    senderName: 'Sophia',
    senderAvatarUrl: 'https://i.pravatar.cc/150?img=20',
    imageUri: 'https://picsum.photos/seed/gasp8/400/800',
    blurhash: 'LHB{.OxuD%M{~qRjM{of9FIUayj[',
    status: 'pending',
    createdAt: NOW,
    expiresAt: EXPIRES,
  },
};

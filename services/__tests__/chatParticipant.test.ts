import { resolveChatParticipant } from '@/services/chatParticipant';

const cachedConversation = {
  id: 'conv-1',
  participantIds: ['me', 'alex'],
  participantNames: ['Me', 'Alex'],
  participantAvatars: [null, 'https://example.com/alex.jpg'],
  unreadCount: 0,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('resolveChatParticipant', () => {
  it('uses cached conversation identity before notification route metadata', () => {
    expect(resolveChatParticipant({
      conversation: cachedConversation,
      currentUserId: 'me',
      routeName: 'Route Alex',
    })).toEqual({ name: 'Alex', avatarUrl: 'https://example.com/alex.jpg' });
  });

  it('uses notification route metadata while the conversation cache is cold', () => {
    expect(resolveChatParticipant({
      currentUserId: 'me',
      routeName: 'Alex',
      routeAvatarUrl: 'https://example.com/alex.jpg',
    })).toEqual({ name: 'Alex', avatarUrl: 'https://example.com/alex.jpg' });
  });

  it('uses fetched conversation identity before the final safe fallback', () => {
    expect(resolveChatParticipant({
      currentUserId: 'me',
      fetchedConversation: cachedConversation,
    })).toEqual({ name: 'Alex', avatarUrl: 'https://example.com/alex.jpg' });
    expect(resolveChatParticipant({ currentUserId: 'me' })).toEqual({ name: 'Chat', avatarUrl: undefined });
  });
});

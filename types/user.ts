export interface User {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  phoneNumber?: string;
  createdAt: string;
}

export interface Friend extends User {
  onlineStatus: 'online' | 'offline' | 'away';
  lastSeenAt: string;
  friendshipId: string;
}

export type OnlineStatus = 'online' | 'offline' | 'away';

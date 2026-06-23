import { create } from 'zustand';

export interface ToastItem {
  id: string;
  gaspId: string;
  senderName: string;
  imageUri: string;
  blurhash: string;
}

interface NotificationState {
  // Toast queue
  toastQueue: ToastItem[];
  activeToast: ToastItem | null;

  // Tab pulse trigger (counts arrivals; component resets after animating)
  tabPulseTrigger: number;

  // Per-tab unread type for Content_Type_Indicator
  inboxUnreadType: 'gasp' | 'reaction' | null;
  chatHasUnread: boolean;

  // Actions
  enqueueToast: (item: ToastItem) => void;
  dequeueToast: () => void;
  triggerTabPulse: () => void;
  resetTabPulse: () => void;
  setInboxUnreadType: (type: 'gasp' | 'reaction' | null) => void;
  setChatHasUnread: (has: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  toastQueue: [],
  activeToast: null,
  tabPulseTrigger: 0,
  inboxUnreadType: null,
  chatHasUnread: false,

  enqueueToast: (item) => {
    const { activeToast } = get();
    if (activeToast === null) {
      set({ activeToast: item });
    } else {
      set((state) => ({ toastQueue: [...state.toastQueue, item] }));
    }
  },

  dequeueToast: () => {
    set({ activeToast: null });
    setTimeout(() => {
      const { toastQueue } = get();
      if (toastQueue.length > 0) {
        const [next, ...rest] = toastQueue;
        set({ activeToast: next, toastQueue: rest });
      }
    }, 500);
  },

  triggerTabPulse: () =>
    set((state) => ({ tabPulseTrigger: state.tabPulseTrigger + 1 })),

  resetTabPulse: () => set({ tabPulseTrigger: 0 }),

  setInboxUnreadType: (type) => set({ inboxUnreadType: type }),

  setChatHasUnread: (has) => set({ chatHasUnread: has }),
}));

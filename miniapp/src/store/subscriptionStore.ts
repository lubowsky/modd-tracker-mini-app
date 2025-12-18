import { create } from "zustand";

interface SubscriptionData {
  active: boolean;
  expiresAt: string | null;
}

interface SubscriptionStore {
  subscription: SubscriptionData | null;
  loadSubscription: () => Promise<void>;
  pay: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionStore>((set) => ({
  subscription: null,

  loadSubscription: async () => {
    await new Promise((r) => setTimeout(r, 300));

    set({
      subscription: {
        active: false,
        expiresAt: null,
      },
    });
  },

  pay: async () => {
    alert("Оплата будет добавлена позже");
  },
}));

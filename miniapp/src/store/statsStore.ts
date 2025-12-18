import { create } from "zustand";

interface OverviewData {
  placeholder: boolean;
}

interface StatsStore {
  overview: OverviewData | null;
  loading: boolean;
  loadOverview: () => Promise<void>;
}

export const useStatsStore = create<StatsStore>((set) => ({
  overview: null,
  loading: false,

  loadOverview: async () => {
    set({ loading: true });

    await new Promise((r) => setTimeout(r, 300));

    set({
      overview: { placeholder: true },
      loading: false,
    });
  },
}));

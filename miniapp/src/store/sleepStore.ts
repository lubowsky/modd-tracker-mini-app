// miniapp\src\store\sleepStore.ts
import { create } from "zustand";
import { sleepApi } from "../api/sleepApi";
import { SleepDataPoint } from "../types";

interface SleepState {
  data: SleepDataPoint[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
}

export const useSleepStore = create<SleepState>((set) => ({
  data: [],
  loading: false,
  error: null,

  load: async () => {
    try {
      set({ loading: true, error: null });
      const stats = await sleepApi.getSleepStats();
      set({ data: stats, loading: false });
    } catch (e) {
      set({ error: "Ошибка загрузки", loading: false });
    }
  },
}));

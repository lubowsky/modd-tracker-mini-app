import { create } from "zustand";
import { MoodEntry } from "../types/MoodEntry";
import { fetchEntries } from "../api/entriesApi";

interface EntriesState {
  entries: MoodEntry[];
  loading: boolean;
  error: string | null;
  load: (telegramId: number) => Promise<void>;
}

export const useEntriesStore = create<EntriesState>((set) => ({
  entries: [],
  loading: false,
  error: null,

  load: async (telegramId) => {
    try {
      set({ loading: true, error: null });
      const entries = await fetchEntries(telegramId);
      set({ entries, loading: false });
    } catch (e) {
      set({ error: "Ошибка загрузки данных", loading: false });
    }
  },
}));

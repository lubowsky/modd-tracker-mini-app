import { create } from "zustand";

export type Page =
  | "home"
  | "sleep"
  | "emotions"
  | "physical"
  | "stress"
  | "subscription";

interface PageStore {
  page: Page;
  history: Page[];
  goTo: (p: Page) => void;
  goBack: () => void;
}

export const usePageStore = create<PageStore>((set) => ({
  page: "home",
  history: [],
  goTo: (p) =>
    set((state) => ({
      history: [...state.history, state.page],
      page: p,
    })),
  goBack: () =>
    set((state) => {
      if (state.history.length === 0) return state;
      const prev = state.history[state.history.length - 1];
      return {
        page: prev,
        history: state.history.slice(0, -1),
      };
    }),
}));

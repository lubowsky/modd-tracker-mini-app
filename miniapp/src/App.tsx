// miniapp\src\App.tsx
import React from "react";
import { useEffect } from "react";
import { useEntriesStore } from "./store/entriesStore";
import { usePageStore } from "./store/pageStore";
import { HomePage } from "./pages/Home";
import SleepPage from "./pages/stats/Sleep";
import EmotionsPage from "./pages/stats/Emotions";
import PhysicalPage from "./pages/stats/Physical";
import StressPage from "./pages/stats/Stress";
import SubscriptionPage from "./pages/subscription/Subscription";

export default function App() {

  const page = usePageStore((s) => s.page);
  const loadEntries = useEntriesStore((s) => s.load);

  const urlParams = new URLSearchParams(window.location.search);
  const telegramId = urlParams.get('telegramId' ) || 151366380;

  // const telegramId = 151366380; // временно, потом из Telegram SDK

  useEffect(() => {
    loadEntries(Number(telegramId));
  }, [telegramId]);

  console.log('=== DEBUG Mini App ===');
  console.log('URL params:', window.location.search);
  console.log('Telegram ID from URL:', telegramId);

  return (
    <>
      {page === "home" && <HomePage />}
      {page === "sleep" && <SleepPage />}
      {page === "emotions" && <EmotionsPage />}
      {page === "physical" && <PhysicalPage />}
      {page === "stress" && <StressPage />}
      {page === "subscription" && <SubscriptionPage telegramId={telegramId} />}
    </>
  );
}

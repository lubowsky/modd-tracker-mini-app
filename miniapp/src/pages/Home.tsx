import React from "react";
import { usePageStore } from "../store/pageStore";
import { Button } from "../components/Button";

export const HomePage: React.FC = () => {
  const goTo = usePageStore((s) => s.goTo);

  return (
    <div style={{ padding: 20 }}>
      <h2>Статистика</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
        <Button onClick={() => goTo("sleep")}>Сон</Button>
        <Button onClick={() => goTo("emotions")}>Эмоции</Button>
        <Button onClick={() => goTo("physical")}>Физическое состояние</Button>
        <Button onClick={() => goTo("stress")}>Стресс</Button>
        <Button onClick={() => goTo("subscription")}>Подписка</Button>
      </div>
    </div>
  );
};

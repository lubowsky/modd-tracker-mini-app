// components/PeriodSelector.tsx
import React from "react";
import { Button } from "./Button";

type Period = 7 | 14 | 30 | "all";

interface PeriodSelectorProps {
  period: Period;
  onPeriodChange: (period: Period) => void;
  className?: string;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  period,
  onPeriodChange,
  className = "",
}) => {
  return (
    <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
      {[7, 14, 30].map((p) => (
        <Button
            key={p}
            type={period === p ? "primary" : "secondary"}
            onClick={() => onPeriodChange(p as Period)}
        >
            {p} дней
        </Button>
      ))}
      <Button
        type={period === "all" ? "primary" : "secondary"}
        onClick={() => onPeriodChange("all")}
      >
        Всё
      </Button>
    </div>
  );
};

export { PeriodSelector };
export type { Period };

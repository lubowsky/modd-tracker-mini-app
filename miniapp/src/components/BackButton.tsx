// components/BackButton.tsx
import React from "react";
import { Button } from "./Button";
import { usePageStore } from "../store/pageStore";
import type { Page } from "../store/pageStore";

interface BackButtonProps {
  to?: string; // Страница для перехода (по умолчанию "home")
  label?: string; // Текст кнопки (по умолчанию "← Назад")
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({
  to = "home" as Page,
  label = "← Назад",
  className = "",
}) => {
  const goTo = usePageStore((s) => s.goTo);

  return (
    <Button 
      type="secondary" 
      onClick={() => goTo(to as Page)}
      className={className}
    >
      {label}
    </Button>
  );
};

export default BackButton;
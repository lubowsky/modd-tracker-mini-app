// components/TabSelector.tsx
import React from "react";
import { Button } from "./Button";

interface TabSelectorProps<T extends string> {
  tabs: { value: T; label: string }[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  className?: string;
}

const TabSelector = <T extends string>({
  tabs,
  activeTab,
  onTabChange,
  className = "",
}: TabSelectorProps<T>) => {
  return (
    <div 
      className={className}
      style={{ 
        marginTop: 16, 
        display: "flex", 
        gap: 8 
      }}
    >
      {tabs.map((tab) => (
        <Button
          key={tab.value}
          type={activeTab === tab.value ? "primary" : "secondary"}
          onClick={() => onTabChange(tab.value)}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
};

export default TabSelector;
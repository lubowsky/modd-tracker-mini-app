import React from "react";

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({ title, children }) => {
  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 16 }}>{title}</h2>
      <div
        style={{
          padding: 12,
          borderRadius: 12,
          background: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        {children}
      </div>
    </div>
  );
};

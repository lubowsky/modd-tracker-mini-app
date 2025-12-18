import React from "react";

interface Props {
  title: string;
  showBack?: boolean;
}

export const Header: React.FC<Props> = ({ title }) => {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 16px",
      borderBottom: "1px solid #eee",
      fontSize: 18,
      fontWeight: 600
    }}>
      {title}
    </div>
  );
};

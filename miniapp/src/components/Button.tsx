import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "primary" | "secondary";
  className?: string | undefined;
  style?: React.CSSProperties;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = "primary",
  className,
  style,
}) => {
  const baseStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px",
    borderRadius: "10px",
    border: "none",
    fontSize: "16px",
    background: type === "secondary" ? "#ddd" : "#4a90e2",
    color: type === "secondary" ? "#333" : "white",
    cursor: "pointer",
  };

  return (
    <button
      onClick={onClick}
      className={className}
      style={{
        ...baseStyle,
        ...style, // 👈 пользовательские стили перекрывают базовые
      }}
    >
      {children}
    </button>
  );
};

import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "primary" | "secondary";
}

export const Button: React.FC<ButtonProps> = ({ children, onClick, type = "primary" }) => {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "14px",
        borderRadius: "10px",
        border: "none",
        fontSize: "16px",
        background: type === "secondary" ? "#ddd" : "#4a90e2",
        color: type === "secondary" ? "#333" : "white",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
};

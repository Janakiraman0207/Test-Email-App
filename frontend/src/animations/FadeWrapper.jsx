import React from "react";

export const FadeWrapper = ({ isVisible, children }) => {
  return (
    <div
      className={`transition-opacity duration-1000 ease-in-out
        ${isVisible ? "opacity-100" : "opacity-0"}`}
    >
      {children}
    </div>
  );
};
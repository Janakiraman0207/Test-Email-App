import React from "react";

export const SmoothPageWrapper = ({ isVisible, children }) => {
  return (
    <div
      className={`
        w-full min-h-screen
        transition-all duration-1000 ease-in-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"}
      `}
    >
      {children}
    </div>
  );
};

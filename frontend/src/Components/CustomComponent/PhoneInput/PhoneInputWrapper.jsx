import React from "react";

export const PhoneInputWrapper = ({ error, children }) => {
  return (
    <div
      className={`
        w-[362px] h-[72px] rounded-[16px] px-[12px]
        bg-[#F4F4F4] flex items-center
        border
        ${error ? "border-[#E53935]" : "border-[#F7F7F9]"}
      `}
    >
      {children}
    </div>
  );
};

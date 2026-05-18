import React from "react";

export const ClearColorOption = ({ onClear, label }) => {
  return (
    <div
      onClick={onClear}
      className="cursor-pointer text-[#6231A5] hover:underline text-[11px] whitespace-nowrap"
    >
      <span>{label}</span>
    </div>
  );
};

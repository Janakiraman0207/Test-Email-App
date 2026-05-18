import React from "react";

export const StepCircle = ({ state, number }) => {
  const baseClasses =
    "w-[24px] h-[24px] rounded-full flex items-center justify-center text-[14px] font-semibold";

  if (state === "completed") {
    return (
      <div className={`${baseClasses} bg-[#008981] text-white`}>
        ✓
      </div>
    );
  }
  if (state === "active") {
    return (
      <div className={`${baseClasses} bg-[#6231A5] text-white`}>
        {number}
      </div>
    );
  }
  return (
    <div
      className={`${baseClasses} border-2 border-[#6231A5] text-[#6231A5] bg-transparent`}
    >
      {number}
    </div>
  );
};

import React from "react";
import { ErrorIconCommon } from "../../../../assets/icons/IconRegistry";

export const Gender = ({
  className = "",
  value,
  onChange,
  error,
  errorMessage,
}) => {
  const genderOptions = [
    { label: "Male", value: "M" },
    { label: "Female", value: "F" },
    { label: "Other", value: "O" },
  ];
  return (
    <div className={`flex flex-col items-start justify-center ${className}`}>
      <div className="w-[362px] h-[99px] flex flex-col items-start justify-start">
        <label className="text-sm inter-bold text-[#000000]">Gender</label>
        <div className="mt-[12px]">
          <select
            className={`w-[362px] h-[72px] bg-[#F4F4F4] rounded-[16px] border-[1px] text-black focus:outline-none inter-regular ${error ? "border-[#E53935]" : "border-[#F7F7F9]"}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">Select Gender</option>
            {genderOptions.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
        <p
          className={`flex items-center gap-2 text-[#F70027] text-[12px] mt-[6px] transition-all duration-300 ${
            errorMessage
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 -translate-y-2 scale-95"
          }`}
        >
          <ErrorIconCommon />
          {errorMessage}
        </p>
      </div>
    </div>
  );
};

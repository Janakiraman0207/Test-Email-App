import React from "react";
import { ErrorIconCommon } from "../../../assets/icons/IconRegistry";

export const InputField = ({
  label,
  placeholder,
  leftIcon,
  rightIcon,
  rightText,
  type = "text",
  errorMessage = "",
  className = "",
  value = "",
  onChange = () => {},
  onKeyDown = () => {},
}) => {
  const hasError = Boolean(errorMessage);
  return (
    <div className="flex flex-col items-start w-[362px]">
      <label className="text-[14px] text-[#000000] mb-[10px] inter-semibold">
        {label}
      </label>
      <div
        className={`
          flex items-center 
          w-[362px] 
          rounded-[16px]
          border border-[1px]
          border ${hasError ? "border-[#E53935]" : "border-[#F7F7F9]"}
          transition-colors duration-300
          h-[72px]
          px-[26px]
          gap-[10px]
         focus-within:border-[#6231A5]
         bg-[#F4F4F4]
        `}
      >
        {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          // onKeyDown={(e) => {
          //   if (e.key === "Enter") {
          //     e.preventDefault();
          //   }
          // }}
           onKeyDown={onKeyDown}
          className={`flex-1 bg-transparent text-[14px] text-black outline-none inter-regular ${className}`}
        />
        {rightText && (
          <span className="text-[#7A7A7A] text-[14px] inter-regular flex-shrink-0">
            {rightText}
          </span>
        )}
        {rightIcon && (
          <span className="cursor-pointer flex-shrink-0">{rightIcon}</span>
        )}
      </div>
      <p
        className={`flex items-center gap-2 text-[#F70027] text-[12px] mt-[6px] transition-all duration-300 ease-in-out
          ${
            hasError
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 -translate-y-1 pointer-events-none scale-95"
          }
        `}
      >
        {/* <WarningLine className="w-4 h-4" /> */}
        <ErrorIconCommon stroke="currentColor" />
        <span className="inter-regular">{errorMessage}</span>
      </p>
    </div>
  );
};

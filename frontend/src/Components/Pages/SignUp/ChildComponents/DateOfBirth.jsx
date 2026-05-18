import React from "react";
import { useDOB } from "../../../../hooks/useDOB";
import { ErrorIconCommon } from "../../../../assets/icons/IconRegistry";

export const DateOfBirth = ({
  className = "",
  dob,
  onDobChange,
  dobError,
  error,
}) => {
  const { months, years, dates } = useDOB(dob.year, dob.month);

  return (
    <div
      className={`flex flex-col items-start justify-center w-[362px] h-[99px] mb-[20px] ${className} `}
    >
      <label className="text-sm self-start text-[#000000] inter-bold">
        DOB
      </label>

      <div className="flex gap-[20px] mt-1">
        <select
          className={`w-[93px] h-[72px] bg-[#F4F4F4] rounded-[16px] border-[1px] px-3 text-[#7F7F7F] focus:outline-none shadow-[0px_1px_4px_0px_#FFFFFF]  ${
            error ? "border-[#E53935]" : "border-[#F7F7F9]"
          }
  `}
          value={dob.date}
          onChange={(e) => onDobChange({ ...dob, date: e.target.value })}
        >
          <option value="">DD</option>
          {dates.length > 0 &&
            dates.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
        </select>

        <select
          className={`w-[93px] h-[72px] bg-[#F4F4F4] rounded-[16px] border-[1px] text-[#7F7F7F] focus:outline-none  ${
            error ? "border-[#E53935]" : "border-[#F7F7F9]"
          }
  `}
          value={dob.month}
          onChange={(e) => onDobChange({ ...dob, month: e.target.value })}
        >
          <option value="">MM</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          className={`w-[91px] h-[72px] bg-[#F4F4F4] rounded-[16px] border-[1px]  px-3 text-[#7F7F7F] focus:outline-none  ${
            error ? "border-[#E53935]" : "border-[#F7F7F9]"
          }
  `}
          value={dob.year}
          onChange={(e) => onDobChange({ ...dob, year: e.target.value })}
        >
          <option value="">YYYY</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <p
        className={`flex items-center gap-2 text-[#F70027] text-[12px] mt-[6px] transition-all duration-300 ease-in-out ${
          dobError
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 -translate-y-2 pointer-events-none scale-95"
        }`}
      >
        <ErrorIconCommon />
        {dobError}
      </p>
    </div>
  );
};

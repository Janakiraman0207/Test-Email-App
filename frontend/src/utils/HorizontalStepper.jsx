import React from "react";
import { StepCircle } from "./StepCircle";

export const HorizontalStepper = ({ step }) => {
  const step1 = step > 1 ? "completed" : step === 1 ? "active" : "inactive";

  const step2 = step > 2 ? "completed" : step === 2 ? "active" : "inactive";

  const step3 = step === 3 ? "active" : "inactive";

  const line1Color = step > 1 ? "bg-[#008981]" : "bg-[#E0E0E0]";
  const line2Color = step > 2 ? "bg-[#008981]" : "bg-[#E0E0E0]";

  return (
    <div className="flex items-center gap-[24px]">
      <StepCircle state={step1} number={1} />
      <div className={`w-[101px] h-[4px] rounded-[10px] ${line1Color}`} />
      <StepCircle state={step2} number={2} />
      <div className={`w-[101px] h-[4px] rounded-[10px] ${line2Color}`} />
      <StepCircle state={step3} number={3} />
    </div>
  );
};

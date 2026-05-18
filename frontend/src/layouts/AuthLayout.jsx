import React from "react";
import { HorizontalStepper } from "../utils/HorizontalStepper";
import loginStripes from "../assets/images/login-stripes.png";

export const AuthLayout = ({ left, step, showStepper = false, children }) => {
  return (
    <div className="relative w-full min-h-screen flex items-center bg-[#FFFFFF] overflow-hidden">
      <img
        src={loginStripes}
        alt="Stripes Background"
        className="absolute right-0 top-0 h-full opacity-70 pointer-events-none"
      />
      <div className="relative z-10 flex items-center min-h-screen">
        <div className="flex gap-[139px] w-full max-w-[1280px] mx-auto">
          <div className="pt-[42px] pl-[42px] pb-[42px] flex flex-col">
            {left}
            <p className="w-[197px] h-[15px] text-[#000000] text-[12px] mt-[12px] inter-regular self-start">
              © 2025 Stackly. All rights received
            </p>
          </div>
          <div className="flex-1 flex justify-center pt-[80px]">
            <div className="w-[362px] h-[670px]">
              {showStepper && step !== 4 && (
                <div className="w-[354px] h-[24px] mb-[40px] flex justify-center">
                  <HorizontalStepper step={step} />
                </div>
              )}
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
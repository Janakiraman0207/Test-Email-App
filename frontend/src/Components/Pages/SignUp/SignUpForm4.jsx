import React from "react";
import tickgif from "../../../assets/images/tick.gif";
import { useSmoothNavigation } from "../../../hooks/useSmoothNavigation";

export const SignUpForm4 = () => {
  const {smoothNavigate}=useSmoothNavigation(1000);

  const backToLoginPageHandler=()=>{
    smoothNavigate('/');
  };
  return (
    <div className="flex flex-col items-center text-center mt-[100px] text-[#000000]">
      <h2 className="text-[28px] font-semibold mb-7">All Done ✌️</h2>
      <img src={tickgif} alt="tick-gif" className="w-[68px] h-[68px] mb-[22px]" />
      <div className="w-[403px] h-[161px] mb-[26px] rounded-[24px] pl-[22px] pt-[25px] pr-[21px] pb-[25px] text-sm">
        <p className="font-semibold">Account has been Created Successfully</p>
        <p className="opacity-70 mt-[26px]">
          {/* Login to your account using the credentials you just created. */}
          Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard
        </p>
      </div>

      <p className="mt-[35px] text-[#6231A5] cursor-pointer" onClick={backToLoginPageHandler}>Back to login</p>
    </div>
  );
};

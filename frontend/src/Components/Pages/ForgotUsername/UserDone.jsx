import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../ForgotPassword/Card";
import { AuthLayout } from "../../../layouts/AuthLayout";
import { AuthCardLayout } from "../../../layouts/AuthCardLayout";

function UserDone() {
  const navigate = useNavigate();

  return (
    // <div className="flex flex-row items-center justify-center w-full max-w-[1440px] h-[832px] gap-[180px] min-h-screen bg-[#FFFFFF] overflow-hidden">
    //   <div className="relative w-[598px] h-[748px]">
    //     <Card />
    //   </div>
    <AuthLayout
      left={<AuthCardLayout variant="forgotPassword" isVisible={true} />}
    >
      <div className="flex flex-col items-center justify-center w-[500px] h-[500px] gap-[50px] ">
        <span className="w-[149px] h-[34px] inter-bold text-[28px] whitespace-nowrap">
          All Done ✌️
        </span>
        <div className="flex flex-col items-center justify-center w-[403px] h-[161px] gap-[30px] rounded-[24px] bg-[#F4F4F4]">
          <p className="w-[321px] h-[19px] inter-semibold text-[16px] ">
            Username has been sent to register email
          </p>
          <p className="w-[360px] h-[66px] inter-regular text-[12px] leading-[22px] text-center">
            Lorem Ipsum is simply dummy text of the printing and typesetting
            industry. Lorem Ipsum has been the industry's standard
          </p>
        </div>

        <button
          className="w-[98px] h-[35px] py-[10px] gap-[10px] inter-semibold text-[14px] text-[#6231A5] bg-transparent border-0 whitespace-nowrap cursor-pointer"
          onClick={() => navigate("/")}
        >
          Back to Login
        </button>
      </div>
      {/* <div
        className="absolute inter-regular text-[12px] leading-[100%] tracking-[0] text-[#000] flex items-center"
        style={{
          width: "197px",
          height: "15px",
          top: "802px",
          left: "42px",
          opacity: 1,
        }}
      >
        © 2025 Stackly. All rights received
      </div> */}
      {/* </div> */}
    </AuthLayout>
  );
}

export default UserDone;

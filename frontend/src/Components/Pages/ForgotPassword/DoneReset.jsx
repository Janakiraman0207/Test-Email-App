import React from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout } from "../../../layouts/AuthLayout";
import { AuthCardLayout } from "../../../layouts/AuthCardLayout";

function DoneReset() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <AuthLayout
      left={<AuthCardLayout variant="forgotPassword" isVisible={true} />}
    >
      <div className="flex flex-col items-center justify-center w-[500px] h-[500px] gap-[50px] ">
        <span className="w-[149px] h-[34px] inter-bold text-[28px] whitespace-nowrap">
          All Done ✌️
        </span>

        <div className="flex flex-col items-center justify-center w-[403px] h-[161px] gap-[30px] rounded-[24px] bg-[#F4F4F4]">
          <p className="w-[321px] h-[19px] inter-semibold text-[16px]">
            Password has been sent to register email
          </p>
          <p className="w-[360px] h-[66px] inter-regular text-[12px] leading-[22px] text-center">
            Lorem Ipsum is simply dummy text of the printing and typesetting
            industry.
          </p>
        </div>

        <button
          type="submit"
          className="w-[98px] h-[35px] py-[10px] gap-[10px] inter-semibold text-[14px] text-[#6231A5] bg-transparent border-0 whitespace-nowrap cursor-pointer"
          onClick={handleSubmit}
        >
          Back to Login
        </button>
      </div>
    </AuthLayout>
  );
}

export default DoneReset;
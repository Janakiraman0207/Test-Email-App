import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../../layouts/AuthLayout";
import { AuthCardLayout } from "../../../layouts/AuthCardLayout";
import { ErrorIcon } from "../../../assets/icons/IconRegistry";
import { EditIcon } from "../../../assets/icons/IconRegistry";

export default function EnterPassword() {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [error, setError] = useState(""); // <-- Add error state
  const navigate = useNavigate();
  const location = useLocation();

  const maskPhoneNumber = (value, dialCodeValue) => {
    const raw = String(value || "");
    const digits = raw.replace(/\D/g, "");
    if (!digits) return "";

    const dialDigits = String(dialCodeValue || "").replace(/\D/g, "");
    const hasDialPrefix = dialDigits && digits.startsWith(dialDigits);

    const local = hasDialPrefix ? digits.slice(dialDigits.length) : digits;
    const prefix = dialCodeValue ? `${dialCodeValue} ` : "";

    const first = local.slice(0, Math.min(2, local.length));
    const last = local.slice(Math.max(local.length - 3, 0));
    const starCount = Math.max(local.length - (first.length + last.length), 0);
    const stars = "*".repeat(starCount);

    return `${prefix}${first}${stars}${last}`;
  };

  // Only use the values passed from ForgotPassword page
  const mobile = location.state?.mobile || "";
  const dialCode = location.state?.dialCode || "";

  const maskedMobile = maskPhoneNumber(mobile, dialCode);

  React.useEffect(() => {
    if (!maskedMobile) {
      // console.log(
      //   "DEBUG: maskedMobile is empty. mobile:",
      //   mobile,
      //   "dialCode:",
      //   dialCode,
      //   "location.state:",
      //   location.state
      // );
    } else {
      // console.log(
      //   "DEBUG: maskedMobile:",
      //   maskedMobile,
      //   "mobile:",
      //   mobile,
      //   "dialCode:",
      //   dialCode
      // );
    }
  }, [maskedMobile, mobile, dialCode, location.state]);

  const handleNext = (e) => {
    e.preventDefault();
    setError(""); // Clear previous error
    if (otp.join("").length !== 4 || otp.some((d) => d === "")) {
      setError("Enter your OTP");
      return;
    }
    navigate("/forgot-new-password", {
      state: {
        mobile,
        dialCode,
      },
    });
  };

  const handleOtpChange = (e, idx) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[idx] = value;
    setOtp(newOtp);
    setError(""); // Clear error on change
    // Move to next input if value entered
    if (value && idx < 3) {
      const next = document.getElementById(`otp-input-${idx + 1}`);
      if (next) next.focus();
    }
  };

  

  return (
    <AuthLayout
      left={<AuthCardLayout variant="forgotPassword" isVisible={true} />}
    >
      <div className="flex flex-col w-[700px] h-[700px] gap-[20px] mr-[-150px]">
        <div className="flex flex-col w-[450px] gap-[20px] h-[150px]">
          <h1 className="w-[299px] h-[34px] inter-bold  text-[28px] whitespace-nowrap">
            Enter OTP
          </h1>
          <p className="w-[394px] h-[48px] inter-regular font-[400] text-[12px] leading-[24px]">
            Please enter the OTP sent to your registered mobile number
          </p>
          <div className="flex flex-row justify-between w-[300px] h-[24px]">
            <span
              className="w-[160px] h-[24px] inter-bold text-[14px]"
              style={{ lineHeight: "24px", letterSpacing: "3px" }}
            >
              {maskedMobile}
            </span>
            <button
              type="button"
              className="flex flex-row w-[54px] h-[17px] gap-[5px] cursor-pointer items-center"
              onClick={() => {
                try {
                  sessionStorage.setItem("forgotUsernameMobile", mobile || "");
                  sessionStorage.setItem(
                    "forgotUsernameDialCode",
                    dialCode || ""
                  );
                } catch {
                  // ignore storage failures
                }

                navigate("/forgot-password", {
                  state: {
                    mobile,
                    dialCode,
                  },
                });
              }}
            >
              <EditIcon/>
              <span className="w-[27px] h-[17px] inter-regular font-[600] text-[14px] text-[#4C2482]">
                Edit
              </span>
            </button>
          </div>
          <span className="w-[362px] h-[15px] inter-regular font-[600] text-[12px] mt-[30px]">
            OTP
          </span>
          <div className=" flex flex-row w-[318px] mt-[10px] h-[72px] gap-[10px]">
            {[0, 1, 2, 3].map((i) => (
              <input
                key={i}
                id={`otp-input-${i}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                className={`w-[72px] h-[72px] rounded-[16px] bg-[#F4F4F4] text-center text-[32px] font-bold outline-none border ${
                  error ? "border-[#F70027] border-[1px]" : "border-[#F7F7F9]"
                }`}
                style={{
                  opacity: 1,
                }}
                value={otp[i]}
                onChange={(e) => handleOtpChange(e, i)}
              />
            ))}
          </div>
          {error && (
            <div className="text-[#F70027] text-[13px] mt-[-10px] inter-regular flex items-center">
              <ErrorIcon className="mr-2 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
        <button
          className="w-[362px] h-[72px] rounded-[16px] bg-[#6231A5] gap-[10px] border-0 text-[white] inter-regular font-[600] text-[14px] mt-[190px] leading-[24px] cursor-pointer"
          onClick={handleNext}
        >
          Submit
        </button>
      </div>
    </AuthLayout>
  );
}

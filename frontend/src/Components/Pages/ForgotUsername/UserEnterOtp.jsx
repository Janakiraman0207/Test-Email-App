import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../ForgotPassword/Card";
import { AuthLayout } from "../../../layouts/AuthLayout";
import { AuthCardLayout } from "../../../layouts/AuthCardLayout";
import { EditIcon, ErrorIcon } from "../../../assets/icons/IconRegistry";

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

  let mobile = location.state?.mobile || "";
  if (!mobile) {
    try {
      mobile = sessionStorage.getItem("forgotUsernameMobile") || "";
    } catch {
      mobile = "";
    }
  }

  let dialCode = location.state?.dialCode || "";
  if (!dialCode) {
    try {
      dialCode = sessionStorage.getItem("forgotUsernameDialCode") || "";
    } catch {
      dialCode = "";
    }
  }

  const maskedMobile = maskPhoneNumber(mobile, dialCode);

  const handleNext = (e) => {
    e.preventDefault();
    if (otp.join("").length !== 4 || otp.some(d => d === "")) {
      setError("Enter your OTP");
      return;
    }
    setError("");
    navigate("/user-done");
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
        <div className="flex flex-col w-[450px] gap-[0px] h-[150px]">
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
                  sessionStorage.setItem("forgotUsernameDialCode", dialCode || "");
                } catch {
                  // ignore storage failures
                }

                navigate("/forgot-username", {
                  state: {
                    mobile,
                    dialCode,
                  },
                });
              }}
            >
              {/* <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_117_1938)">
                  <path d="M17.4165 18.3334H4.58317C4.34006 18.3334 4.1069 18.43 3.93499 18.6019C3.76308 18.7738 3.6665 19.0069 3.6665 19.25C3.6665 19.4932 3.76308 19.7263 3.93499 19.8982C4.1069 20.0701 4.34006 20.1667 4.58317 20.1667H17.4165C17.6596 20.1667 17.8928 20.0701 18.0647 19.8982C18.2366 19.7263 18.3332 19.4932 18.3332 19.25C18.3332 19.0069 18.2366 18.7738 18.0647 18.6019C17.8928 18.43 17.6596 18.3334 17.4165 18.3334Z" fill="#4C2482"/>
                  <path d="M4.58312 16.5H4.66562L8.48812 16.1516C8.90685 16.1099 9.29848 15.9254 9.59728 15.6291L17.8473 7.37912C18.1675 7.04084 18.3405 6.58942 18.3285 6.12378C18.3165 5.65813 18.1204 5.21625 17.7831 4.89495L15.2715 2.38328C14.9436 2.07537 14.5141 1.8987 14.0645 1.88687C13.6149 1.87503 13.1767 2.02887 12.8331 2.31912L4.58312 10.5691C4.28682 10.8679 4.10233 11.2596 4.06062 11.6783L3.66645 15.5008C3.6541 15.635 3.67152 15.7704 3.71747 15.8971C3.76342 16.0239 3.83677 16.139 3.93228 16.2341C4.01794 16.3191 4.11952 16.3863 4.2312 16.4319C4.34289 16.4775 4.46248 16.5006 4.58312 16.5ZM13.9973 3.66662L16.4998 6.16912L14.6664 7.95662L12.2098 5.49995L13.9973 3.66662ZM5.83895 11.8341L10.9998 6.70995L13.4748 9.18495L8.34145 14.3183L5.59145 14.575L5.83895 11.8341Z" fill="#4C2482"/>
                </g>
                <defs>
                  <clipPath id="clip0_117_1938">
                    <rect width="22" height="22" fill="white"/>
                  </clipPath>
                </defs>
              </svg> */}
              <EditIcon />
              <span className="w-[27px] h-[17px] inter-regular font-[600] text-[14px] text-[#4C2482]">Edit</span>
            </button>
          </div>
          <span className="w-[362px] h-[15px] inter-regular font-[600] text-[12px] mt-[30px]">OTP</span>
          <div className=" flex flex-row w-[318px] mt-[10px] h-[72px] gap-[10px]">
            {[0, 1, 2, 3].map((i) => (
              <input
                key={i}
                id={`otp-input-${i}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                className="w-[72px] h-[72px] rounded-[16px] bg-[#F4F4F4] text-center text-[32px] font-bold outline-none"
                style={{
                  opacity: 1,
                  border: error ? "1px solid #F70027" : "1px solid #F7F7F9"
                }}
                value={otp[i]}
                onChange={e => handleOtpChange(e, i)}
              />
            ))}
          </div>
          {error && (
            <p className="flex items-center text-red-500 text-[13px] mt-[10px]">
              {/* <svg
                width="17"
                height="17"
                viewBox="0 0 17 17"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mr-2"
                style={{ minWidth: 17, minHeight: 17, display: "inline-block", verticalAlign: "middle" }}
              >
                <g clipPath="url(#clip0_822_987)">
                  <path
                    d="M8.50033 15.5833C12.4123 15.5833 15.5837 12.412 15.5837 8.49999C15.5837 4.58797 12.4123 1.41666 8.50033 1.41666C4.58831 1.41666 1.41699 4.58797 1.41699 8.49999C1.41699 12.412 4.58831 15.5833 8.50033 15.5833Z"
                    stroke="#F70027"
                    strokeWidth="1.0625"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.5 5.66666V8.85416"
                    stroke="#F70027"
                    strokeWidth="1.0625"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.5 11.3249V11.332"
                    stroke="#F70027"
                    strokeWidth="1.275"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_822_987">
                    <rect width="17" height="17" fill="white" />
                  </clipPath>
                </defs>
              </svg> */}
              <ErrorIcon className='mr-2' />
              <span>{error}</span>
            </p>
          )}
        </div>
        <button
          className="w-[362px] h-[72px] rounded-[16px] bg-[#6231A5] gap-[10px] border-0 text-[white] inter-regular font-[600] text-[14px] mt-[150px] leading-[24px] cursor-pointer"
          onClick={handleNext}
        >
          Submit
        </button>
      </div>
    </AuthLayout>
  );
}
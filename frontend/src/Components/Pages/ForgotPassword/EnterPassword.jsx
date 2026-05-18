import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout } from "../../../layouts/AuthLayout";
import { AuthCardLayout } from "../../../layouts/AuthCardLayout";
import { PasswordIcon, PasswordWarningCircleIcon } from "../../../assets/icons/IconRegistry";

export default function EnterPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);

  const validatePassword = (pwd) => {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(pwd);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setPasswordTouched(true);
  };

  const handleConfirmChange = (e) => {
    setConfirm(e.target.value);
  };

  const handleNext = (e) => {
    e.preventDefault();
    setPasswordTouched(true);

    // Show error if password is invalid
    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters, include uppercase, lowercase, number, and special character.");
      return;
    }
    // Show error if passwords do not match
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    navigate("/done-reset");
  };

  return (
    <AuthLayout
          left={<AuthCardLayout variant="forgotPassword" isVisible={true} />}
        >
      <div className="flex flex-col w-[700px] h-[700px] gap-[20px] mr-[-150px]">
        <div className="flex flex-col w-[450px] gap-[0px] h-[150px]">
          <h1 className="w-[299px] h-[34px] inter-bold  text-[28px] whitespace-nowrap">
            Enter password
          </h1>
          <p className="w-[394px] h-[48px] inter-regular font-[400] text-[12px] leading-[24px]">
            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard
          </p>
        </div>

        <div className="flex flex-col w-[365px] h-[150px] gap-[60px]">
          <div className="flex flex-col w-[362px] h-[99px] gap-[12px]">
            <span className="w-[362px] h-[12px] inter-regular font-[600] text-[12px] leading-[100%] tracking-[0]">
              Password
            </span>
            <div className="relative w-[362px] h-[72px] mt-[10px]">
              <span className="absolute left-[26px] top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                <PasswordIcon />
              </span>
              <input
                type="password"
                className="w-[362px] h-[72px] rounded-[16px] border border-[#F7F7F9] bg-[#F4F4F4] pl-[60px] pr-[26px] opacity-100"
                placeholder="Enter your password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setPasswordTouched(true);
                }}
                onBlur={() => setPasswordTouched(true)}
              />
            </div>
          </div>
          <div className="flex flex-col w-[362px] h-[99px] gap-[12px]">
            <span className="w-[362px] h-[12px] inter-regular font-[600] text-[12px] leading-[100%] tracking-[0]">
              Confirm password
            </span>
            <div className="relative w-[362px] h-[72px] mt-[10px]">
              <span className="absolute left-[26px] top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                <PasswordIcon /> 
              </span>
              <input
                type="password"
                className="w-[362px] h-[72px] rounded-[16px] border border-[#F7F7F9] bg-[#F4F4F4] pl-[60px] pr-[26px] opacity-100"
                placeholder="Re-enter your password"
                value={confirm}
                onChange={handleConfirmChange}
              />
            </div>
          </div>
        </div>
        <button
          className="w-[362px] h-[72px] rounded-[16px] bg-[#6231A5] gap-[10px] border-0 text-[white] inter-regular font-[600] text-[14px] mt-[150px] leading-[24px] cursor-pointer"
          onClick={handleNext}
        >
          Submit
        </button>
        {/* Show error if any after the confirm password input */}
        {error && (
          <span className="flex items-center text-[red] inter-regular text-[12px] mt-[0px]">
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
            <PasswordWarningCircleIcon className="mr-2"/>
            <span>{error}</span>
          </span>
        )}
      </div>
    </AuthLayout>
  );
}
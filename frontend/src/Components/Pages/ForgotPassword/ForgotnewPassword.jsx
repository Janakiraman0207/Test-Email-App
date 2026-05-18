import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout } from "../../../layouts/AuthLayout";
import { AuthCardLayout } from "../../../layouts/AuthCardLayout";
import {
  BlackCrossIcon,
  EyeOffIcon,
  EyeOnIcon,
  GreenTickIcon,
  PasswordIcon,
} from "../../../assets/icons/IconRegistry";

function ForgotnewPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (pwd) => {
    // At least 11 chars, max 20, 1 uppercase, 1 number, 1 special char
    if (pwd.length < 11) return false;
    if (pwd.length > 20) return false;
    if (!/[A-Z]/.test(pwd)) return false;
    if (!/[0-9]/.test(pwd)) return false;
    if (!/[^A-Za-z0-9]/.test(pwd)) return false;
    return true;
  };

  const getPasswordError = (pwd) => {
    if (!pwd) return "Enter your password";
    if (pwd.length < 6 || pwd.length > 18)
      return "Password must be 6–18 characters and include one uppercase letter, one lowercase letter, one number, and one special character.";
    if (!/[A-Z]/.test(pwd))
      return "Password must contain at least 1 uppercase letter.";
    if (!/[a-z]/.test(pwd))
      return "Password must contain at least 1 lowercase letter";
    if (!/[0-9]/.test(pwd)) return "Password must contain at least 1 number.";
    if (!/[^A-Za-z0-9]/.test(pwd))
      return "Password must contain at least 1 special character.";
    return "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const pwdError = getPasswordError(password);
    if (!password) {
      setError("Please enter the password.");
      return;
    }
    if (pwdError) {
      setError(pwdError);
      return;
    }
    if (password !== confirmPassword) {
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
      <div className="flex flex-col w-[500px] h-[700px] gap-[30px] ">
        <div className="flex flex-col w-[394px] h-[120px] gap-[20px]">
          <h1 className="text-[28px] inter-bold">Enter password</h1>
          <p className="text-[12px] leading-[24px] inter-regular">
            Lorem Ipsum is simply dummy text of the printing and typesetting
            industry. Lorem Ipsum has been the industry's standard
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col w-[362px] gap-[10px]">
            <p className="text-[12px] inter-semibold">Password</p>
            <div className="relative w-[362px] h-[72px] mt-[0px]">
              <span className="absolute left-[18px] top-1/2 transform -translate-y-1/2 flex items-center cursor-pointer z-10">
                <PasswordIcon />
              </span>
              <input
                type="password"
                className="w-full h-full rounded-[16px] border border-[#F7F7F9] bg-[#F4F4F4] opacity-100 px-[48px] text-[16px] pr-[26px]"
                style={{ gap: "10px" }}
                placeholder="Enter new password"
                value={password}
                maxLength={20}
                onChange={(e) => {
                  setPassword(e.target.value.slice(0, 20));
                  if (error && error.toLowerCase().includes("password"))
                    setError("");
                }}
              />
            </div>
            {/* Password validation hints */}
            {(password || error === "Please enter the password.") && (
              <div className="text-[10px] mt-[0px] inter-regular text-[#8E8E8E] space-y-1">
                {/* At least 1 uppercase */}
                {(!/[A-Z]/.test(password) ||
                  error === "Please enter the password.") && (
                  <div className="flex items-center gap-1">
                    <GreenTickIcon />
                    At least 1 uppercase
                  </div>
                )}
                {/* At least 1 number */}
                {(!/[0-9]/.test(password) ||
                  error === "Please enter the password.") && (
                  <div className="flex items-center gap-1">
                    <BlackCrossIcon />
                    At least 1 number
                  </div>
                )}
                {/* At least 6-18 characters */}
                {(password.length < 6 ||
                  password.length > 18 ||
                  error === "Please enter the password.") && (
                  <div className="flex items-center gap-1">
                    <BlackCrossIcon />
                    At least 6-18 characters
                  </div>
                )}
                {/* At least 1 special character */}
                {(!/[^A-Za-z0-9]/.test(password) ||
                  error === "Please enter the password.") && (
                  <div className="flex items-center gap-1">
                    <BlackCrossIcon />
                    At least 1 special character
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Confirm Password Field */}
          <div className="flex flex-col w-[362px] h-[150px] gap-[10px] mt-[10px]">
            <p className="text-[12px] inter-semibold">Confirm Password</p>
            <div className="relative w-[362px] h-[72px] mt-[0px]">
              <span className="absolute left-[18px] top-1/2 transform -translate-y-1/2 flex items-center cursor-pointer z-10">
                <PasswordIcon />
              </span>
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="w-full h-full rounded-[16px] border border-[#F7F7F9] bg-[#F4F4F4] opacity-100 px-[48px] text-[16px] pr-[26px]"
                style={{ gap: "10px" }}
                placeholder="Confirm new password"
                value={confirmPassword}
                maxLength={20}
                onChange={(e) =>
                  setConfirmPassword(e.target.value.slice(0, 20))
                }
              />
              <span
                className="absolute right-[18px] top-1/2 transform -translate-y-1/2 flex items-center cursor-pointer z-10"
                onClick={() => setShowConfirmPassword((v) => !v)}
              >
                {showConfirmPassword ? <EyeOnIcon /> : <EyeOffIcon />}
              </span>
            </div>
            {error && error.toLowerCase().includes("match") && (
              <p className="text-red-500 text-[10px] mt-[0px]">{error}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-[179px] h-[72px] rounded-[16px] bg-[#6231A5] text-white inter-regular font-[600] text-[14px] mt-[30px] leading-[24px] border-0 cursor-pointer"
          >
            Submit
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}

export default ForgotnewPassword;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../../../api/api";
import { PhoneField } from "../../CustomComponent/PhoneInput/PhoneField";
import { useSmoothNavigation } from "../../../hooks/useSmoothNavigation";
import { AuthLayout } from "../../../layouts/AuthLayout";
import { AuthCardLayout } from "../../../layouts/AuthCardLayout";
import { ErrorIcon, ForgotPasswordErrorIcon } from "../../../assets/icons/IconRegistry";

export default function ForgotPassword() {
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const [country, setCountry] = useState("");
  const [dialCode, setDialCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { visible, smoothNavigate } = useSmoothNavigation(1000);

  const navigate = useNavigate();

  const handleNext = async (e) => {
    e.preventDefault();
    setError("");

    // VALIDATION — BLOCK NAVIGATION
    if (!mobile || !mobile.trim()) {
      setError("Enter your mobile number.");
      return;
    }

    if (!country || !country.trim()) {
      setError("Please select your country code.");
      return;
    }

    // Ensure mobile is longer than just the dial code
    const dialDigits = String(dialCode || "").replace(/\D/g, "");
    const mobileDigits = String(mobile || "").replace(/\D/g, "");

    // Check for empty mobile number first
    if (!mobile || !mobile.trim() || mobileDigits.length === 0) {
      setError("Enter your mobile number.");
      return;
    }

    // Minimum mobile number length validation (example: 10 digits, adjust as needed)
    const minMobileLength = 10;
    if (mobileDigits.length < minMobileLength) {
      setError("Please enter a valid mobile number.");
      return;
    }

    if (
      dialDigits &&
      mobileDigits.startsWith(dialDigits) &&
      mobileDigits.length <= dialDigits.length
    ) {
      setError("Please enter a valid phone number after the country code.");
      return;
    }

    setLoading(true);

    try {
      await forgotPassword({ countryCode: country, mobile });

      navigate("/enter-otp", {
        state: {
          mobile,
          dialCode,
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Network error. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`w-full min-h-screen flex flex-col items-center justify-center transition-all duration-1000 ease-in-out
        ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <AuthLayout
        left={<AuthCardLayout variant="forgotPassword" isVisible={visible} />}
      >
        <div className="flex flex-col w-[700px] h-[700px] gap-[0px] mr-[-150px]">
          <div className="flex flex-col w-[450px] gap-[20px] h-[150px]">
            <h1 className="w-[299px] h-[34px] inter-bold text-[28px] whitespace-nowrap">
              Forgot your password
            </h1>
            <p className="w-[394px] h-[48px] inter-regular font-[400] text-[12px] leading-[24px]">
              Enter your registered mobile number and we’ll help you reset your
              password.
            </p>
          </div>

          <div className="flex flex-col w-[365px] h-[100px] gap-[10px]">
            <label className="text-[14px] inter-semibold block mb-2">
              Mobile number
            </label>

            <div className="phone-input">
              <PhoneField
                hideFlag={false}
                onChange={(data) => {
                  setCountry(data?.countryCode || "");
                  setDialCode(data?.dialCode || "");
                  setMobile(data?.fullPhone || "");
                  setError("");
                }}
                inputClassName={`react-international-phone-input ${
                  error ? "!border-[#F70027] !border-[1px]" : ""
                }`}
              />
            </div>

            <p
              className={`flex items-center text-red-500 text-[13px] mt-[0px] transition-all duration-300 ${
                error ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
              }`}
            >
              {error && (
                <>
                  {/* <svg
                    width="17"
                    height="17"
                    viewBox="0 0 17 17"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-2"
                    style={{
                      minWidth: 17,
                      minHeight: 17,
                      display: "inline-block",
                      verticalAlign: "middle",
                    }}
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
                  {/* <ForgotPasswordErrorIcon /> */}
                  <ErrorIcon />
                  <span>{error}</span>
                </>
              )}
            </p>
          </div>

          <button
            className="w-[362px] h-[72px] rounded-[16px] bg-[#6231A5] gap-[10px] border-0 text-[white] inter-regular font-[600] text-[14px] mt-[50px] leading-[24px] cursor-pointer"
            onClick={handleNext}
            disabled={loading}
          >
            {loading ? "Loading..." : "Next"}
          </button>
        </div>
      </AuthLayout>
    </div>
  );
}

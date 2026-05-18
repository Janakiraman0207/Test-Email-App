import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../ForgotPassword/Card";
import { forgotUsername } from "../../../api/api";
import { PhoneField } from "../../CustomComponent/PhoneInput/PhoneField";
import { useSmoothNavigation } from "../../../hooks/useSmoothNavigation";
import { AuthLayout } from "../../../layouts/AuthLayout";
import { AuthCardLayout } from "../../../layouts/AuthCardLayout";
import { ForgotUsernameErrorIcon } from "../../../assets/icons/IconRegistry";

const ForgotUsername = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [mobile, setMobile] = useState(() => {
    const fromState = location.state?.mobile;
    if (fromState) return fromState;
    try {
      return sessionStorage.getItem("forgotUsernameMobile") || "";
    } catch {
      return "";
    }
  });

  const [dialCode, setDialCode] = useState(() => {
    const fromState = location.state?.dialCode;
    if (fromState) return fromState;
    try {
      return sessionStorage.getItem("forgotUsernameDialCode") || "";
    } catch {
      return "";
    }
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { visible, smoothNavigate } = useSmoothNavigation(1000);

  // ✅ FIX: read username_hints from backend
  const extractEmails = (res) => {
    const d = res?.data;

    const candidates = [
      d?.emails,
      d?.username_hints, // ✅ REQUIRED FIX
      d?.data?.emails,
      d?.data?.username_hints,
      d?.result?.emails,
      d?.result?.username_hints,
      d?.payload?.emails,
    ];

    const arr = candidates.find((x) => Array.isArray(x));
    if (Array.isArray(arr)) return arr.filter(Boolean);

    const str = candidates.find((x) => typeof x === "string" && x.trim());
    if (typeof str === "string") {
      return str
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);
    }

    return [];
  };

  const normalizeE164 = (value) =>
    String(value || "")
      .trim()
      .replace(/\s+/g, "");

  const handleNext = async (e) => {
    e.preventDefault();
    setError("");

    const e164 = normalizeE164(mobile);
    const cleanedMobile = String(mobile || "").replace(/\D/g, "");
    const dialDigits = String(dialCode || "").replace(/\D/g, "");

    const nationalNumber =
      dialDigits && cleanedMobile.startsWith(dialDigits)
        ? cleanedMobile.slice(dialDigits.length)
        : cleanedMobile;

    if (!cleanedMobile) {
      setError("Enter your mobile number");
      return;
    }

    const candidates = Array.from(
      new Set([e164, cleanedMobile, nationalNumber].filter(Boolean))
    );

    setLoading(true);

    try {
      let emails = [];
      let lastResponse = null;

      for (const candidate of candidates) {
        const res = await forgotUsername({ mobile: candidate });
        lastResponse = res;

        emails = extractEmails(res);
        if (emails.length > 0) break;
      }

      if (!emails.length) {
        const backendMsg =
          lastResponse?.data?.message ||
          lastResponse?.data?.detail ||
          lastResponse?.data?.error ||
          "No account found with this mobile number";

        setError(backendMsg);
        return;
      }

      try {
        sessionStorage.setItem("forgotUsernameMobile", mobile || e164 || "");
        sessionStorage.setItem("forgotUsernameDialCode", dialCode || "");
        sessionStorage.setItem("forgotUsernameEmails", JSON.stringify(emails));
      } catch {}

      navigate("/select-email", {
        state: {
          emails, // ✅ ARRAY PASSED
          email: emails[0],
          mobile,
          dialCode,
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          err.message ||
          "Network error. Please try again."
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
        left={<AuthCardLayout variant="forgotUsername" isVisible={visible} />}
      >
        <div className="flex flex-col w-[700px] h-[700px] gap-[0px] mr-[-150px]">
          <div className="flex flex-col w-[450px] gap-[20px] h-[150px]">
            <h1 className="inter-bold text-[28px] whitespace-nowrap">
              Forgot your Username
            </h1>
            <p className="inter-regular text-[12px] leading-[24px]">
             Enter your registered mobile number and we’ll help you reset your username.
            </p>
          </div>

          <div className="flex flex-col w-[365px] h-[100px] gap-[10px]">
            <div className="">
              <label className="text-[14px] inter-semibold block mb-2">
                Mobile number
              </label>

              <PhoneField
                hideFlag={false}
                value={mobile}
                onChange={(data) => {
                  const nextMobile = data?.fullPhone || "";
                  const nextDialCode = data?.dialCode || "";
                  setMobile(nextMobile);
                  setDialCode(nextDialCode);

                  try {
                    sessionStorage.setItem("forgotUsernameMobile", nextMobile);
                    sessionStorage.setItem(
                      "forgotUsernameDialCode",
                      nextDialCode
                    );
                  } catch {}

                  setError("");
                }}
                inputClassName={error ? "error-border" : ""}
              />

              <p
                className={`flex items-center text-red-500 text-[13px]  mt-[6px] transition-all ${
                  error ? "opacity-100" : "opacity-0"
                }`}
              >
                {error && (
                  <div className="flex items-start whitespace-nowrap">
                    {/* <svg
                      width="17"
                      height="17"
                      viewBox="0 0 17 17"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="mr-[10px]"
                      style={{ minWidth: 17, minHeight: 17 }}
                    >
                      <g clipPath="url(#clip0_822_1085)">
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
                        <clipPath id="clip0_822_1085">
                          <rect width="17" height="17" fill="white" />
                        </clipPath>
                      </defs>
                    </svg> */}
                    <ForgotUsernameErrorIcon className='mr-2.5'/>
                    <span>{error}</span>
                  </div>
                )}
              </p>
            </div>
          </div>

          <button
            className="w-[362px] h-[72px] rounded-[16px] bg-[#6231A5] text-white inter-regular font-[600] text-[14px] mt-[30px] leading-[24px] border-0 cursor-pointer"
            onClick={handleNext}
            disabled={loading}
          >
            {loading ? "Loading..." : "Next"}
          </button>
        </div>
      </AuthLayout>
    </div>
  );
};
export default ForgotUsername;

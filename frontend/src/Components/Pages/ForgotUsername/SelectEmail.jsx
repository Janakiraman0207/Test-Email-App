import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../ForgotPassword/Card";
import { AuthLayout } from "../../../layouts/AuthLayout";
import { AuthCardLayout } from "../../../layouts/AuthCardLayout";
import { BackArrowIcon, MailOutlineIcon, RadioIcon } from "../../../assets/icons/IconRegistry";

export default function SelectEmail() {
  const location = useLocation();
  const navigate = useNavigate();

  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  const initialEmails = useMemo(() => {
    if (Array.isArray(location.state?.emails) && location.state.emails.length) {
      return location.state.emails;
    }
    if (Array.isArray(location.state?.email) && location.state.email.length) {
      return location.state.email;
    }
    if (typeof location.state?.email === "string" && location.state.email) {
      return location.state.email
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);
    }
    try {
      const stored = sessionStorage.getItem("forgotUsernameEmails");
      const parsed = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === "string" && parsed) {
        return parsed
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean);
      }
      return [];
    } catch {
      return [];
    }
  }, [location.state]);

  const [emails, setEmails] = useState(initialEmails);

  useEffect(() => {
    setEmails(initialEmails);
  }, [initialEmails]);

  const handleNext = () => {
    if (selected === null) {
      setError("Please select an email to continue");
      return;
    }

    const chosen = emails[selected];

    navigate("/user-enter-otp", {
      state: {
        email: chosen,
        mobile: location.state?.mobile,
        dialCode: location.state?.dialCode,
      },
    });
  };

  return (
    // <div className="flex flex-row items-center justify-center w-full max-w-[1440px] h-[832px] gap-[180px] min-h-screen bg-[#FFFFFF] overflow-hidden">
    //   <div className="relative w-[598px] h-[748px]">
    //     <Card />
    //   </div>
    <AuthLayout
      left={<AuthCardLayout variant="forgotPassword" isVisible={true} />}
    >
      <div className="flex flex-col w-[700px] h-[700px] gap-[20px] mr-[-150px]">
        <h1 className="inter-bold text-[28px]">Select your email</h1>
        <p className="w-[394px] h-[48px] inter-regular font-[400] text-[12px] leading-[24px]">
          Choose the email address where you’d like to receive account updates and recovery details.
        </p>

        {emails.length === 0 && (
          <p className="text-red-500 text-[14px]">
            No email accounts found for this mobile number.
          </p>
        )}

        <div className="flex flex-col w-[365px] gap-[20px]">
          {emails.map((email, idx) => (
            <div
              key={idx}
              className={`flex flex-row items-center justify-between w-[365px] h-[70px] rounded-[16px] px-[20px] bg-[#F4F4F4] cursor-pointer ${
                selected === idx ? "border border-[#6231A5]" : ""
              }`}
              onClick={() => {
                setSelected(idx);
                setError("");
              }}
            >
              <div className="flex flex-row w-[200px] gap-[20px]">
                {/* <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.6665 5L7.42734 8.26417C9.5515 9.4675 10.4482 9.4675 12.5723 8.26417L18.3332 5"
                    stroke="black"
                    strokeWidth="1.25"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M1.68001 11.23C1.73417 13.7842 1.76167 15.0617 2.70417 16.0075C3.64667 16.9542 4.95834 16.9867 7.58251 17.0525C9.19917 17.0942 10.8008 17.0942 12.4175 17.0525C15.0417 16.9867 16.3533 16.9542 17.2958 16.0075C18.2383 15.0617 18.2658 13.7842 18.3208 11.23C18.3375 10.4083 18.3375 9.59166 18.3208 8.76999C18.2658 6.21582 18.2383 4.93832 17.2958 3.99249C16.3533 3.04582 15.0417 3.01332 12.4175 2.94749C10.8061 2.90683 9.19392 2.90683 7.58251 2.94749C4.95834 3.01332 3.64667 3.04582 2.70417 3.99249C1.76167 4.93832 1.73417 6.21582 1.67917 8.76999C1.66163 9.5899 1.66246 10.4101 1.68001 11.23Z"
                    stroke="black"
                    strokeWidth="1.25"
                    strokeLinejoin="round"
                  />
                </svg> */}
                <MailOutlineIcon />
                <span className="inter-regular text-[14px]">{email}</span>
              </div>

              {/* {selected === idx ? (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path
                    d="M6.5 12.5C9.81371 12.5 12.5 9.81371 12.5 6.5C12.5 3.18629 9.81371 0.5 6.5 0.5C3.18629 0.5 0.5 3.18629 0.5 6.5C0.5 9.81371 3.18629 12.5 6.5 12.5Z"
                    stroke="#6231A5"
                  />
                  <path
                    d="M6.5 9.16683C7.97276 9.16683 9.16667 7.97292 9.16667 6.5C9.16667 5.02708 7.97276 3.83317 6.5 3.83317C5.02724 3.83317 3.83333 5.02708 3.83333 6.5C3.83333 7.97292 5.02724 9.16683 6.5 9.16683Z"
                    fill="#6231A5"
                  />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path
                    d="M6.5 12.5C9.81371 12.5 12.5 9.81371 12.5 6.5C12.5 3.18629 9.81371 0.5 6.5 0.5C3.18629 0.5 0.5 3.18629 0.5 6.5C0.5 9.81371 3.18629 12.5 6.5 12.5Z"
                    stroke="#C5C5C5"
                  />
                </svg>
              )} */}
              <RadioIcon checked={selected === idx} />
            </div>
          ))}
        </div>

        {error && <p className="text-red-500 text-[13px] mt-[8px]">{error}</p>}

        <div className="w-[363px] h-[72px] px-[10px] mt-[200px] flex justify-between items-center">
          <button className="flex flex-row w-[74px] h-[35px] py-[10px] gap-[10px]">
            <span
              className="flex flex-row items-center gap-2 w-full justify-center cursor-pointer"
              onClick={() => navigate("/forgot-username")}
            >
              {/* <svg
                width="13"
                height="12"
                viewBox="0 0 13 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1.04167 5.625H12.2917M5.625 10.625C5.625 10.625 0.625 6.9425 0.625 5.625C0.625 4.3075 5.625 0.625 5.625 0.625"
                  stroke="#6231A5"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg> */}
              <BackArrowIcon />
              <span className="inter-semibold text-[14px] text-[#6231A5]">
                Back
              </span>
            </span>
          </button>
          <button
            className="w-[179px] h-[72px] rounded-[16px] bg-[#6231A5] text-white inter-regular font-[600] text-[14px] mt-[0px] leading-[24px] border-0 cursor-pointer"
            onClick={handleNext}
            disabled={!emails.length}
          >
            Next
          </button>
        </div>
      </div>

      {/* // <div
      //   className="absolute inter-regular text-[12px]"
      //   style={{ top: "802px", left: "42px" }}
      // >
      //   © 2025 Stackly. All rights received
      // </div> */}
      {/* // </div> */}
    </AuthLayout>
  );
}

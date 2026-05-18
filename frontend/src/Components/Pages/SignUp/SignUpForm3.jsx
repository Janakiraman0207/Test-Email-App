import React, { useState, useMemo,useEffect } from "react";
import { useNavigate } from "react-router-dom"; // <-- Add this import
import { InputField } from "../../CustomComponent/InputField/InputField";
import { StacklyUsernameGenerator } from "../../../utils/StacklyUsernameGenerator";
import { EyeOffIcon, EyeOnIcon, LockIcon } from "../../../assets/icons/IconRegistry";

export const SignUpForm3 = ({ setStep, currentStep, signUpFormData }) => {
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Password validation function
  const getPasswordError = (pwd) => {
    if (!pwd) return "Enter your password";
   if (pwd.length < 6 || pwd.length > 18)
      return "Password must be 6–18 characters and include one uppercase letter, one lowercase letter, one number, and one special character.";
    if (!/[a-z]/.test(pwd))
      return "Password must contain at least 1 lowercase letter";
    if (!/[a-z]/.test(pwd))
      return "Password must contain at least 1 lowercase letter";
    if (!/[A-Z]/.test(pwd))
      return "Password must contain at least 1 uppercase letter";
    if (!/[0-9]/.test(pwd)) return "Password must contain at least 1 number";
    if (!/[^A-Za-z0-9]/.test(pwd))
      return "Password must contain at least 1 special character";
    return "";
  };

  const validate = () => {
    const e = {};
    const d = signUpFormData.signUpFormData;

    if (!d.username) {
      e.username = "Enter your username";
    } else {
      const username = d.username;
      const u = username.toLowerCase();
      const f = d.first_name.toLowerCase();
      const l = d.last_name.toLowerCase();
      if (username.length < 3 || username.length > 20) {
        e.username = "Username must be 3-20 characters";
      } else if (!/^[a-zA-Z0-9._@]+$/.test(username)) {
        e.username =
          "Spaces not allowed.Only letters, numbers,dot,underscore and @ allowed";
      } else if (!/[a-zA-Z0-9]/.test(username)) {
        e.username = "Username cannot contain only special characters";
      } else if (
        !u.includes(f) &&
        !u.includes(l) &&
        u !== `${f}${l}` &&
        u !== `${f}.${l}` &&
        u !== `${l}.${f}`
      ) {
        e.username = "Username must contain your first or last name";
      } else {
        // Count special characters
        const specialMatches = username.match(/[._@]/g) || [];
        const atCount = (username.match(/@/g) || []).length;

        if (specialMatches.length > 2) {
          e.username = "Maximum 2 special characters allowed";
        } else if (atCount > 1) {
          e.username = "@ can be used only once";
        }
      }
    }

    // Password validation
    const pwdError = getPasswordError(d.password);
    if (pwdError) e.password = pwdError;

    // Confirm password validation
    if (!d.confirmPassword) {
      e.confirmPassword = "Confirm your password";
    } else if (d.password !== d.confirmPassword) {
      e.confirmPassword = "Passwords do not match";
    } else {
      const confirmPwdError = getPasswordError(d.confirmPassword);
      if (confirmPwdError) e.confirmPassword = confirmPwdError;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  useEffect(() => {
    signUpFormData.updateField("password", "");
    signUpFormData.updateField("confirmPassword", "");
  }, []);

  const { first_name, last_name, username } = signUpFormData.signUpFormData;
  const fullName = `${first_name} ${last_name}`.trim();

  const hasSelectedUsername = Boolean(username);

  const suggestedUsernames = useMemo(() => {
    if (hasSelectedUsername) return [];
    return StacklyUsernameGenerator(fullName);
  }, [first_name, last_name, hasSelectedUsername]);

  const handleSubmit = async () => {
    try {
      if (!validate()) return;
      await signUpFormData.submitSignUp();
      setStep(4);
    } catch (e) {
      console.error("Signup failed:", e);
    }
  };

  const usernameHandleChange = (e) => {
    const value = e.target.value;
    signUpFormData.updateField("username", value);

    const u = value.toLowerCase();
    const f = signUpFormData.signUpFormData.first_name.toLowerCase();
    const l = signUpFormData.signUpFormData.last_name.toLowerCase();

    let err = "";

    if (!value) {
      err = "Enter your username";
    } else if (value.length < 3 || value.length > 20) {
      err = "Username must be 3-20 characters";
    } else if (!/^[a-zA-Z0-9._@]+$/.test(value)) {
      err =
        "Spaces not allowed. Only letters, numbers, dot, underscore and @ allowed";
    } else if (!/[a-zA-Z0-9]/.test(value)) {
      err = "Username cannot contain only special characters";
    } else if (
      !u.includes(f) &&
      !u.includes(l) &&
      u !== `${f}${l}` &&
      u !== `${f}.${l}` &&
      u !== `${l}.${f}`
    ) {
      err = "Username must contain your first or last name";
    }

    setErrors((prev) => ({ ...prev, username: err }));
  };

  return (
    <div>
      <h2 className="flex text-[34px] inter-bold mb-[40px] text-[#000000] self-start">
        User Setup
      </h2>
      <InputField
        label="Set your username"
        placeholder="username123"
        value={signUpFormData.signUpFormData.username}
        onChange={usernameHandleChange}
        errorMessage={errors.username}
      />
      {suggestedUsernames.length > 0 && (
        <div className="flex items-start justify-center flex-col mt-[12px]">
          <p className="text-[12px] text-[#7A7A7A] mb-[8px] inter-medium">
            Suggested username
          </p>
          <div className="flex gap-[10px] flex-wrap">
            {suggestedUsernames.map((name) => {
              const isActive = username === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    signUpFormData.updateField("username", name);
                    setErrors((prev) => ({ ...prev, username: "" }));
                  }}
                  className={`
                    px-[14px] py-[6px] rounded-[10px] text-[13px] inter-medium
                    transition-all
                    ${
                      isActive
                        ? "bg-[#6231A5] text-white"
                        : "bg-[#EEE6FA] text-[#6231A5] hover:bg-[#E0D2F5]"
                    }
                  `}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-[20px] inter-semibold mt-[26px]">
        <InputField
          label="Password"
          placeholder="Enter password"
          minLength={6}
          maxLength={18}
          leftIcon={<LockIcon />}
          rightIcon={
            <span
              className="cursor-pointer"
              onClick={() => setShowPwd((prev) => !prev)}
            >
              {showPwd ? <EyeOnIcon /> : <EyeOffIcon />}
            </span>
          }
          type={showPwd ? "text" : "password"}
          className="flex-1 text-black outline-none focus:outline focus:outline-1 focus:outline-[#6231A5] text-[14px] align-middle tracking-[2px] inter-semibold"
          value={signUpFormData.signUpFormData.password}
          onKeyDown={(e) => {
            if (e.key === "Enter"|| e.key === " ") {
              e.preventDefault();
              setErrors((prev) => ({
                ...prev,
                password: "Spaces are not allowed in password",
              }));
            }
          }}
          onChange={(e) => {
            signUpFormData.updateField(
              "password",
              e.target.value.replace(/\s/g, ""),
            );
            setErrors((prev) => ({
              ...prev,
              password: getPasswordError(e.target.value),
            }));
            // Clear backend error if password is now valid
            if (
              signUpFormData.error &&
              !getPasswordError(e.target.value) &&
              signUpFormData.error.toLowerCase().includes("password")
            ) {
              signUpFormData.setError(""); // Make sure setError is available in signUpFormData
            }
          }}
          errorMessage={errors.password}
        />

        <InputField
          label="Confirm password"
          placeholder="Re-enter password"
          minLength={6}
          maxLength={18}
          type={showConfirmPwd ? "text" : "password"}
          leftIcon={<LockIcon />}
          rightIcon={
            <span
              className="cursor-pointer"
              onClick={() => setShowConfirmPwd((prev) => !prev)}
            >
              {showConfirmPwd ? <EyeOnIcon /> : <EyeOffIcon />}
            </span>
          }
          className="flex-1 text-black outline-none focus:outline focus:outline-1 focus:outline-[#6231A5] text-[14px] align-middle tracking-[2px] inter-semibold"
          value={signUpFormData.signUpFormData.confirmPassword}
          onKeyDown={(e) => {
            if (e.key === "Enter"||e.key === " ") {
              e.preventDefault();
              setErrors((prev) => ({
                ...prev,
                confirmPassword: "Spaces are not allowed in password",
              }));
            }
          }}
          onChange={(e) => {
            signUpFormData.updateField(
              "confirmPassword",
              e.target.value.replace(/\s/g, ""),
            );
            setErrors((prev) => ({
              ...prev,
              confirmPassword: !e.target.value
                ? "Confirm your password"
                : e.target.value !== signUpFormData.signUpFormData.password
                  ? "Passwords do not match"
                  : getPasswordError(e.target.value),
            }));
          }}
          errorMessage={errors.confirmPassword}
        />
        {signUpFormData.error && (
          <p className="text-red-500 text-sm">{signUpFormData.error}</p>
        )}
      </div>

      <div className="w-[363px] mt-[50px]">
        <div className="flex justify-between items-center mb-[28px]">
          <button
            // onClick={() => setStep(2)}
            type="button"
            onClick={() => setStep(currentStep - 1)}
            className="flex items-center gap-2 text-[#6231A5] text-[14px] inter-medium cursor-pointer"
          >
            <span className="text-[18px]">←</span> Back
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={signUpFormData.loading}
            className="w-[179px] h-[72px] bg-[#6231A5] text-white rounded-xl text-[17px] cursor-pointer"
          >
            {signUpFormData.loading ? "Creating..." : "Create now"}
          </button>
        </div>
        <p className="text-center text-[14px] text-[#000000] inter-regular">
          Having account
          <span
            className="text-[#6231A5] cursor-pointer inter-semibold "
            onClick={() => navigate("/")}
          >
            {" "}
            back to Login
          </span>
        </p>
      </div>
    </div>
  );
};

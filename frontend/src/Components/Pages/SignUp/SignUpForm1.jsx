import React, { useState } from "react";
import { InputField } from "../../CustomComponent/InputField/InputField";
import { PhoneField } from "../../CustomComponent/PhoneInput/PhoneField";
import { useSmoothNavigation } from "../../../hooks/useSmoothNavigation";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { ErrorIconCommon } from "../../../assets/icons/IconRegistry";

export const SignUpForm1 = ({ setStep, signUpFormData }) => {
  const [phoneCountry, setPhoneCountry] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const { smoothNavigate } = useSmoothNavigation(1000);
  const [dialCode, setDialCode] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);

  const handleLoginPage = () => {
    smoothNavigate("/");
  };

   const getPhoneError = (phone, countryCode, dialCode) => {
    if (!phone)
      return "Mobile number will be used for recovering your username.";

    const digits = phone.replace(/\D/g, "");
    const dialDigits = (dialCode || "").replace(/\D/g, "");
    const nationalDigits = digits.slice(dialDigits.length);

    if (!nationalDigits) return "Enter your Mobile Number";

    const parsed = parsePhoneNumberFromString(phone, countryCode || undefined);
    if (!parsed) return "Enter a valid phone number";

    if (/^(\d)\1+$/.test(nationalDigits)) {
      return "Phone number cannot contain all same digits";
    }

    if (!parsed.isPossible()) {
      return "Phone number has invalid length for selected country";
    }

    if (!parsed.isValid()) return "Enter a valid phone number";

    return "";
  };

  const isValidName = (value, maxDigits) => {
    const v = value.trim();
    if (!v) return false;
    const regex = new RegExp(`^[A-Za-z]+\\d{0,${maxDigits}}$`);
    return regex.test(v);
  };

  const NAME_MAX_LENGTH = 50;

  const validate = () => {
    setSubmitted(true);

    const e = {};

    const firstName = signUpFormData.signUpFormData.first_name
      .trim()
      .replace(/\s+/g, "");
    signUpFormData.updateField("first_name", firstName);

    if (!firstName) {
      e.first_name = "Enter your first name";
    } else if (firstName.length > NAME_MAX_LENGTH) {
      e.first_name = "Entered Maximum Allowed Characters (50 is maximum )";
    } else if (!isValidName(firstName, 4)) {
      e.first_name = "Only letters are allowed with up to 4 digits at the end";
    }

    const lastName = signUpFormData.signUpFormData.last_name
      .trim()
      .replace(/\s+/g, "");
    signUpFormData.updateField("last_name", lastName);

    if (!lastName) {
      e.last_name = "Enter your last name";
    } else if (lastName.length > NAME_MAX_LENGTH) {
      e.last_name = "Entered Maximum Allowed Characters (50 is maximum)";
    } else if (!isValidName(lastName, 2)) {
      e.last_name = "Only letters are allowed with up to 2 digits at the end";
    }

    const phoneError = getPhoneError(
       signUpFormData.signUpFormData.mobile_number,
      phoneCountry,
      dialCode,
    );
    if (phoneError) {
      e.mobile_number = phoneError;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onChangePhoneNumberHandler = (data) => {
    const phone = data?.fullPhone || "";
    const country = data?.countryCode?.toUpperCase() || "";
    const dial = data?.dialCode || "";

    const digits = phone.replace(/\D/g, "");
    const dialDigits = dial.replace(/\D/g, "");
    const nationalDigits = digits.slice(dialDigits.length);

    // // Debug
    // console.log({
    //   phone,
    //   country,
    //   dial,
    //   digits,
    //   nationalDigits,
    // });

    signUpFormData.updateField("mobile_number", phone);
    setPhoneCountry(country);
    setDialCode(dial);

    if (nationalDigits.length > 0) {
      setPhoneTouched(true);
      const error = getPhoneError(phone, country, dial);
      setErrors((p) => ({ ...p, mobile_number: error }));
    } else {
      setErrors((p) => ({ ...p, mobile_number: "" }));
    }
  };

  return (
    <div>
      <h2 className="flex text-[24px] inter-bold mb-[30px] text-[#000000] self-start">
        Personal Details
      </h2>
      <InputField
        label="First name"
        placeholder="Enter your first name"
        value={signUpFormData.signUpFormData.first_name}
        onChange={(e) => {
          const value = e.target.value;
          signUpFormData.updateField("first_name", value);
          if (!value.trim()) {
            setErrors((p) => ({ ...p, first_name: "Enter your first name" }));
          } else if (!isValidName(value, 4)) {
            setErrors((p) => ({
              ...p,
               first_name:
                "Only letters are allowed with up to 4 digits at the end",
            }));
          } else {
            setErrors((p) => ({ ...p, first_name: "" }));
          }
        }}
        errorMessage={errors.first_name}
        onKeyDown={(e) => {
          if (e.key === "Enter"|| e.key === " ") {
            e.preventDefault();
            setErrors((prev) => ({
              ...prev,
              first_name: "Spaces are not allowed in First Name",
            }));
          }
        }}
      />
      <div className="mt-[20px]">
        <InputField
          label="Last name"
          placeholder="Enter your last name"
          value={signUpFormData.signUpFormData.last_name}
          onChange={(e) => {
            const value = e.target.value;
            signUpFormData.updateField("last_name", value);
            if (!value.trim()) {
              setErrors((p) => ({ ...p, last_name: "Enter your last name" }));
            } else if (!isValidName(value, 2)) {
              setErrors((p) => ({
                ...p,
                last_name:
                  "Only letters are allowed with up to 2 digits at the end",
              }));
            } else {
              setErrors((p) => ({ ...p, last_name: "" }));
            }
          }}
          errorMessage={errors.last_name}
          onKeyDown={(e) => {
            if (e.key === "Enter"||e.key === " ") {
              e.preventDefault();
              setErrors((prev) => ({
                ...prev,
                last_name: "Spaces are not allowed in Last Name",
              }));
            }
          }}
        />
      </div>
      <div className="mt-[20px]">
        <label className="text-[14px] text-[#000000] text-left block inter-semibold">
          Mobile number
        </label>
        <div className="phone-input">
          <PhoneField
            value={signUpFormData.signUpFormData.mobile_number}
            onChange={onChangePhoneNumberHandler}
            hideFlag={false}
            errorMessage={errors.mobile_number}
          />
        </div>
        <p
          className={`flex items-center gap-[12px] text-[12px] mt-2 ${
            (phoneTouched || submitted) && errors.mobile_number
              ? "text-[#E53935]"
              : "text-gray-500"
          }`}
        >
          <ErrorIconCommon />
          {(phoneTouched || submitted) && errors.mobile_number
            ? errors.mobile_number
            : "Mobile number will be used for recovering your username"}
        </p>
      </div>
      <button
        type="button"
        className="h-[72px] w-[362px] mt-[50px] mb-[86px] bg-[#6231A5] rounded-[16px] text-white text-[16px] cursor-pointer"
        onClick={() => {
          if (validate()) setStep(2);
        }}
      >
        Next
      </button>
      <p className="text-[14px] text-[#000000] text-center inter-regular">
        Having account
        <span
          className="text-[#6231A5] cursor-pointer inter-semibold "
          onClick={handleLoginPage}
        >
          {" "}
          back to Login
        </span>
      </p>
    </div>
  );
};

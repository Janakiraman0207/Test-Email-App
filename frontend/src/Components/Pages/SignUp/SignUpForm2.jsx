import React, { useState } from "react";
import { InputField } from "../../CustomComponent/InputField/InputField";
import { DateOfBirth } from "../SignUp/ChildComponents/DateOfBirth";
import { Gender } from "../SignUp/ChildComponents/Gender";
import { useSmoothNavigation } from "../../../hooks/useSmoothNavigation";
import { isValidStacklyEmail } from "../../../utils/EmailValidator";

export const SignUpForm2 = ({ setStep, currentStep, signUpFormData }) => {
  const [errors, setErrors] = useState({});
  const { visible, smoothNavigate } = useSmoothNavigation(1000);

  const validate = () => {
    const e = {};
    const { email, dob, gender, first_name, last_name } =
      signUpFormData.signUpFormData;

    if (!isValidStacklyEmail(email, first_name, last_name)) {
      const firstnameLowerCase = first_name.toLowerCase();
      const lastnameLowerCase = last_name.toLowerCase();

      e.email = `Email must include your first or last name, like ${firstnameLowerCase}${lastnameLowerCase}@thestackly.com`;
    }

    const dobError = handleDobChange(dob);
    if (dobError) e.dob = dobError;

    if (!gender) e.gender = "Enter your gender";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) setStep(3);
  };

  const handleLoginPage = () => {
    smoothNavigate("/");
  };

  const handleEmailChange = (e) => {
   const username = e.target.value.toLowerCase().replace(/@.*/, "");
    const fullEmail = `${username}@thestackly.com`;
    signUpFormData.updateField("email", fullEmail);

    const { first_name, last_name } = signUpFormData.signUpFormData;
    const firstNameLowerCase = first_name.toLowerCase();
    const lastNameLowerCase = last_name.toLowerCase();

    if (!isValidStacklyEmail(fullEmail, first_name, last_name)) {
      setErrors((p) => ({
        ...p,
        email: `Email must include your first or last name, like ${firstNameLowerCase}${lastNameLowerCase}@thestackly.com`,
      }));
    } else {
      setErrors((p) => ({ ...p, email: "" }));
    }
  };

    const handleDobChange = (dob) => {
    if (!dob?.date || !dob?.month || !dob?.year) {
      return "Enter your date of birth";
    }

    const selectedDate = new Date(`${dob.month} ${dob.date}, ${dob.year}`);
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 10);

    if (selectedDate > minDate) {
      return "DOB must be at least 10 years old";
    }

    return "";
  };

  return (
    <div>
      <h2 className="flex text-[24px] font-semibold mb-[40px] text-[#000000] self-start">
        Other Info’s
      </h2>

      <div className="mb-[20px]">
        <InputField
          label="Enter Email"
          placeholder="Enter email"
          value={signUpFormData.signUpFormData.email.replace(
            "@thestackly.com",
            "",
          )}
          onChange={handleEmailChange}
          rightText="@thestackly.com"
          errorMessage={errors.email}
        />
      </div>

      {signUpFormData.error && (
        <p className="text-red-500 text-sm">{signUpFormData.error}</p>
      )}

      <div className="mt-[20px] flex gap-3">
        <DateOfBirth
          dob={signUpFormData.signUpFormData.dob}
          onDobChange={(dob) => {
            signUpFormData.updateDob(dob);
            const dobError = handleDobChange(dob);
            setErrors((p) => ({ ...p, dob: dobError }));
          }}
          error={Boolean(errors.dob)}
          dobError={errors.dob}
        />
      </div>
      <Gender
        value={signUpFormData.signUpFormData.gender}
        onChange={(value) => {
          signUpFormData.updateField("gender", value);
          setErrors((p) => ({ ...p, gender: false }));
        }}
        error={Boolean(errors.gender)}
        errorMessage={errors.gender}
      />
      <div className="w-[363px] mt-[50px]">
        <div className="flex justify-between items-center mb-[110px]">
          <button
            // onClick={() => setStep(1)}
            type="button"
            onClick={() => setStep(currentStep - 1)}
            className="flex items-center gap-2 text-[#6231A5] text-[14px] inter-medium cursor-pointer"
          >
            <span className="text-[18px]">←</span> Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="w-[179px] h-[72px] bg-[#6231A5] text-white rounded-xl text-[16px] cursor-pointer"
          >
            Next
          </button>
        </div>
        <p className="text-center text-[14px] text-[#000000] inter-regular">
          Having account
          <span
            className="text-[#6231A5] cursor-pointer inter-semibold"
            onClick={handleLoginPage}
          >
            {" "}
            back to Login
          </span>
        </p>
      </div>
    </div>
  );
};

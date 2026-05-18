import { useEffect, useState } from "react";
// import { signUpUser } from "../api/auth.api";
import { signUpUser } from "../api/api";

export const useCreateAnAccount = () => {
  // const [signUpFormData, setSignUpFormData] = useState({
  //   email: "",
  //   // recovery_email: "",
  //   first_name: "",
  //   // surname: "",
  //   last_name: "",
  //   // nationality: "Indian",
  //   dob: {
  //     date: "",
  //     month: "",
  //     year: "",
  //   },
  //   mobile_number: "",
  //   gender: "",
  //   password: "",
  //   confirmPassword: "",
  //   // username: "",
  // });

  const defaultState = {
    email: "",
    first_name: "",
    last_name: "",
    dob: { date: "", month: "", year: "" },
    mobile_number: "",
    gender: "",
    password: "",
    confirmPassword: "",
    // username: "",
  };

  const getInitialData = () => {
    try {
      const saved = localStorage.getItem("signup_form_data");
      return saved ? JSON.parse(saved) : defaultState;
    } catch (e) {
      return defaultState;
    }
  };

  const [signUpFormData, setSignUpFormData] = useState(getInitialData);

  const monthMap = {
    January: "01",
    February: "02",
    March: "03",
    April: "04",
    May: "05",
    June: "06",
    July: "07",
    August: "08",
    September: "09",
    October: "10",
    November: "11",
    December: "12",
  };

  const genderMap = {
  MALE: "M",
  FEMALE: "F",
  OTHER: "O",
};
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

 const updateField = (key, value) => {
 if (key === "email") {
    value = value.replace(/[A-Z]/g, "");
  }
  setSignUpFormData((prev) => ({ ...prev, [key]: value }));
};

useEffect(() => {
  localStorage.setItem(
    "signup_form_data",
    JSON.stringify(signUpFormData)
  );
}, [signUpFormData]);

  const submitSignUp = async () => {
    try {
      setLoading(true);
      setError(null);

      if (signUpFormData.password !== signUpFormData.confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }
      const {
        dob,
        confirmPassword,
        //surname, // frontend name
        // recovery_email,
        ...rest
      } = signUpFormData;

      if (!rest.gender) {
        setError("Gender is required");
        setLoading(false);
        return;
      }

      if (rest.mobile_number && !rest.mobile_number.startsWith("+")) {
        setError("Mobile number must include country code (e.g. +91)");
        return;
      }

      // const payload = {
      //   ...rest,
      //   dob:
      //     dob.year && dob.month && dob.date
      //       ? `${dob.year}-${dob.month}-${dob.date}`
      //       : null,
      // };
      // const payload = {
      //   ...rest,
      //   email: rest.email.includes("@")
      //     ? rest.email
      //     : `${rest.email}@thestackly.com`,
      //   // surname: surname,
      //   confirm_password: confirmPassword,
      //   // recovery_email: recovery_email || null,
      //   //Password should be 12 characters Ex:-Abc@12Secure
      //   dob:
      //     dob.year && dob.month && dob.date
      //       ? `${dob.year}-${monthMap[dob.month]}-${String(dob.date).padStart(
      //           2,
      //           "0"
      //         )}`
      //       : null,
      // };
      const payload = {
        email: (rest.email.includes("@")
          ? rest.email
          : `${rest.email}@thestackly.com`).trim().toLowerCase(),
        first_name: rest.first_name,
        last_name: rest.last_name,
        // gender: genderMap[rest.gender],
        gender: rest.gender,
        mobile_number: rest.mobile_number || null,
        password: rest.password,
        confirm_password: confirmPassword,
        dob:
          dob.year && dob.month && dob.date
            ? `${dob.year}-${monthMap[dob.month]}-${String(dob.date).padStart(2, "0")}`
            : null,
      };
      // console.log("FINAL PAYLOAD SENT TO API", payload);

      const res = await signUpUser(payload);
      // clear storage after success
      localStorage.removeItem("signup_form_data");
      return res.data;
      // } catch (error) {
      //   setError(error?.response?.data?.detail || "Signup failed");
      //   throw error;
      // }
    } catch (error) {
      // const apiError = error?.response?.data;

      // let message = "Signup failed";

      // if (Array.isArray(apiError?.detail)) {
      //   message = apiError.detail
      //     .map((err) => `${err.loc.at(-1)}: ${err.msg}`)
      //     .join(", ");
      // } else if (typeof apiError?.detail === "string") {
      //   message = apiError.detail;
      // }

      // setError(message);
      // throw error;
      const detail = error?.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((e) => e.msg).join(", "));
      } else {
        setError(detail || "Signup failed");
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateDob = (dob) => {
    setSignUpFormData((prev) => ({ ...prev, dob }));
  };

  return {
    signUpFormData,
    updateField,
    updateDob,
    submitSignUp,
    loading,
    error,
  };
};

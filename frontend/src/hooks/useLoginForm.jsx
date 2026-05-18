import { useState } from "react";
import { loginUser } from "../api/api";

export const useLoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    password: "",
  });

  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errors = {};
    if (!email) errors.email = "Enter your email";
    if (!password) errors.password = "Enter your password";

    setFieldErrors({
      email: errors.email || "",
      password: errors.password || "",
    });
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    setApiError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await loginUser({ email, password });
      localStorage.setItem("access_token", res.data.access_token);
      return true;
    } catch (err) {
      setApiError(
        err.response?.data?.detail || "Entered email or password is incorrect"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (value) => {
     if (/[A-Z]/.test(value)) {
    return;
  }
    setEmail(value);
    if (fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: "" }));
    }
    if (apiError) setApiError("");
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: "" }));
    }
    if (apiError) setApiError("");
  };

  return {
    email,
    password,
    fieldErrors,
    apiError,
    loading,
    handleLogin,
    handleEmailChange,
    handlePasswordChange,
  };
};

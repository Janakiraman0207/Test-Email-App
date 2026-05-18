import { createContext, useContext } from "react";
import { useCreateAnAccount } from "../hooks/useCreateAnAccountNew";

const SignUpContext = createContext();

export const SignUpProvider = ({ children }) => {
  const signUpFormData = useCreateAnAccount();

  return (
    <SignUpContext.Provider value={signUpFormData}>
      {children}
    </SignUpContext.Provider>
  );
};

export const useSignUpContext = () => useContext(SignUpContext);
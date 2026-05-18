import React, { useState, useEffect } from "react";
import { AuthLayout } from "../../../layouts/AuthLayout";
import { SignUpForm1 } from "./SignUpForm1";
import { SignUpForm2 } from "./SignUpForm2";
import { SignUpForm3 } from "./SignUpForm3";
import { SignUpForm4 } from "./SignUpForm4";
import { AuthCardLayout } from "../../../layouts/AuthCardLayout";
import { SlideUpWrapper } from "../../../animations/SlideUpWrapper";
import { useParams,useNavigate } from "react-router-dom";
import { useSignUpContext } from "../../../context/SignUpContext";

const SignUpPage = () => {
  const [visible, setVisible] = useState(false);
  const signUpFormData = useSignUpContext();
  const navigate=useNavigate();

  useEffect(() => {
    setVisible(true);
  }, []);


const params = useParams();

const currentStep = React.useMemo(() => {
  const rawStep = params.step;

  if (!rawStep?.startsWith("step-")) {
    return 1;
  }

  const parsed = Number(rawStep.replace("step-", ""));

  return Number.isNaN(parsed) ? 1 : parsed;
}, [params.step]);

  const goToStep = (stepNumber) => {
    navigate(`/signup/step-${stepNumber}`);
  };

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  },[currentStep]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <SignUpForm1 setStep={goToStep} signUpFormData={signUpFormData} />
        );
      case 2:
        return (
          <SignUpForm2 setStep={goToStep} currentStep={currentStep} signUpFormData={signUpFormData} />
        );
      case 3:
        return (
          <SignUpForm3 setStep={goToStep} currentStep={currentStep} signUpFormData={signUpFormData} />
        );
      case 4:
        return <SignUpForm4 />;
      default:
        return null;
    }
  };



  return (
    <AuthLayout
      step={currentStep}
      showStepper={true}
      left={
        <AuthCardLayout
        variant='signup'
          isVisible={visible}
          //title="Let's get started 👍"
          //description="Lorem Ipsum is simply dummy text of the printing and typesetting industry.Lorem Ipsum has been the industry's standard"
        />
      }
    >
      <SlideUpWrapper isVisible={visible}>{renderStep()}</SlideUpWrapper>
    </AuthLayout>
  );
};

export default SignUpPage;
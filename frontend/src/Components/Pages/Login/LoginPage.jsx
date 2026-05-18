import React, { useState, useEffect } from "react";
import { AuthLayout } from "../../../layouts/AuthLayout";
import { NewLogin } from "./NewLogin";
import { AuthCardLayout } from "../../../layouts/AuthCardLayout";
import { SlideUpWrapper } from "../../../animations/SlideUpWrapper";

const LoginPage = () => {
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <AuthLayout
      showStepper={false}
      left={
        <AuthCardLayout variant='login'
          isVisible={visible}
          //title="Lorem Ipsum is dummy text"
          //description="Lorem Ipsum is simply dummy text of the printing and typesetting industry.\nLorem Ipsum has been the industry's standard"
        />
      }
    >
      <SlideUpWrapper isVisible={visible}>
        <NewLogin error={error} setError={setError} />
      </SlideUpWrapper>
    </AuthLayout>
  );
};

export default LoginPage;
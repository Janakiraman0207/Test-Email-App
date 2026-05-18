import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SmoothPageWrapper } from "./SmoothPageWrapper";

export const GlobalSmoothWrapper = ({ children }) => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);

    const timeout = setTimeout(() => {
      setVisible(true);
    }, 30);

    return () => clearTimeout(timeout);
  }, [location.pathname]);

  return (
    <SmoothPageWrapper isVisible={visible}>
      {children}
    </SmoothPageWrapper>
  );
};

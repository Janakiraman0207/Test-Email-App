import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const useSmoothNavigation = (duration = 300) => {
  const [visible, setVisible] = useState(true);
  const navigate = useNavigate();

  const smoothNavigate = (path,options={}) => {
    setVisible(false);
    setTimeout(() => {
      navigate(path,options);
      setVisible(false);
    }, duration);
  };

  return { visible, smoothNavigate };
};

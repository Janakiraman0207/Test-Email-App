import { useEffect, useState } from "react";
import Loader from "./Loader";

const LoaderWithMinTime = ({ minTime = 400 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), minTime);
    return () => clearTimeout(timer);
  }, [minTime]);

  return visible ? <Loader /> : null;
};

export default LoaderWithMinTime;

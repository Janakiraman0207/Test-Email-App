const StarIcon = ({
  size = 15,
  isActive = false,
  className = "",
  activeColor = "#FFB800",
  inactiveColor = "white",
  strokeWidth = 1.45,
  ...props
}) => {
  const color = isActive ? activeColor : inactiveColor;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M8.5469 1.69004L9.72024 4.05604C9.88024 4.38537 10.3069 4.70137 10.6669 4.76137L12.7929 5.11804C14.1529 5.34671 14.4729 6.34137 13.4929 7.32271L11.8396 8.98937C11.5596 9.27137 11.4062 9.81604 11.4929 10.206L11.9662 12.2694C12.3396 13.9027 11.4796 14.534 10.0462 13.6807L8.0529 12.4907C7.6929 12.276 7.09957 12.276 6.7329 12.4907L4.7409 13.6807C3.31424 14.534 2.44757 13.8954 2.8209 12.2694L3.29424 10.206C3.3809 9.81604 3.22757 9.27137 2.94757 8.98937L1.29424 7.32271C0.321571 6.34071 0.634904 5.34671 1.99424 5.11804L4.1209 4.76137C4.47424 4.70137 4.9009 4.38537 5.0609 4.05604L6.23424 1.69004C6.87424 0.406706 7.91424 0.406706 8.54757 1.69004"
        stroke={color}
        fill={isActive ? color : "none"}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default StarIcon;

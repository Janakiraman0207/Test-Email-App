const SnoozeIcon = ({
  size = 15,
  className = "",
  color = "white",
  strokeWidth = 1.25,
  ...props
}) => {
  return (
    <svg
      width={size}
      viewBox="0 0 15 13"
      fill="none"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      {...props}
    >
      <path
        d="M3.08667 10.9687L1.5 12.502M11.26 10.9453L12.8333 12.4987M2.5 0.5L0.5 2.5M13.8333 2.5L11.8333 0.5M12.8333 6.83333C12.8333 8.33623 12.2363 9.77757 11.1736 10.8403C10.1109 11.903 8.66956 12.5 7.16667 12.5C5.66377 12.5 4.22243 11.903 3.15973 10.8403C2.09702 9.77757 1.5 8.33623 1.5 6.83333C1.5 5.33044 2.09702 3.8891 3.15973 2.8264C4.22243 1.76369 5.66377 1.16667 7.16667 1.16667C8.66956 1.16667 10.1109 1.76369 11.1736 2.8264C12.2363 3.8891 12.8333 5.33044 12.8333 6.83333Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.16699 3.83301V6.83301L8.50033 8.16634"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default SnoozeIcon;
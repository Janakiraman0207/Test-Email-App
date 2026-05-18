const DriveIcon = ({
  size = 16,
  className = "",
  color = "currentColor",
  strokeWidth = 1,
  ...props
}) => {
  return (
    <svg
      width={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      {...props}
    >
      <path
        d="M13.8063 5.80067L14.6123 8.486C14.6383 8.57267 14.651 8.616 14.6583 8.66067L14.6603 8.674C14.6663 8.71933 14.6663 8.76467 14.6663 8.85533C14.6663 11.1867 14.6663 12.352 13.987 13.1113C13.9208 13.1847 13.851 13.2544 13.7777 13.3207C13.0183 14 11.853 14 9.52167 14H6.47767C4.14634 14 2.98101 14 2.22167 13.3207C2.14807 13.2548 2.07819 13.1849 2.01234 13.1113C1.33301 12.352 1.33301 11.1867 1.33301 8.85533C1.33301 8.76467 1.33301 8.71933 1.33967 8.67467L1.34101 8.66133C1.34767 8.616 1.36101 8.57267 1.38767 8.486L2.19301 5.8C2.74234 3.96933 3.01701 3.05333 3.72501 2.52667C4.43301 2 5.38967 2 7.30101 2H8.69834C10.6097 2 11.565 2 12.2743 2.52667C12.983 3.05467 13.2577 3.97 13.8063 5.80067Z"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <path
        d="M1.33301 8.66602H14.6663"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path
        d="M11.993 11.334H12.0003M8.66699 11.334H8.67433"
        stroke={color}
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default DriveIcon;
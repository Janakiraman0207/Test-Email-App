const ChevronRightIcon = ({
  size = 7,
  className = "",
  color = "currentColor",
  strokeWidth = 0.75,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 4 7"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    preserveAspectRatio="xMidYMid meet"
    {...props}
  >
    <path
      d="M0.375 0.375C0.375 0.375 3.375 2.5845 3.375 3.375C3.375 4.1655 0.375 6.375 0.375 6.375"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default ChevronRightIcon;

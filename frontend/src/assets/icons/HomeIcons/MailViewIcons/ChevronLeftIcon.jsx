const ChevronLeftIcon = ({
  size = 7,
  className = "",
  color = "currentColor",
  strokeWidth = 0.75,
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 4 7"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M3.375 0.375C3.375 0.375 0.375 2.5845 0.375 3.375C0.375 4.1655 3.375 6.375 3.375 6.375" />
    </svg>
  );
};

export default ChevronLeftIcon;
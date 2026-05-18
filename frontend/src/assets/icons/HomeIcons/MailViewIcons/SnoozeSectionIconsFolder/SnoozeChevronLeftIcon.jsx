const SnoozeChevronLeftIcon = ({
  className = "",
  size = 16,
  color = "currentColor",
  strokeWidth = "2",
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M15 18L9 12L15 6" />
  </svg>
);

export default SnoozeChevronLeftIcon;

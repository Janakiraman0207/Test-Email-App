const StrikeThroughIcon = ({
  size = 16,
  className = "",
  color = "currentColor",
  strokeWidth = 1,
  ...props
}) => (
  <svg
    width={size}
    viewBox="0 0 16 16"
    fill="none"
    className={className}
    preserveAspectRatio="xMidYMid meet"
    {...props}
  >
    <path
      d="M2.66602 8H13.3327"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11.6657 5.11133C11.6657 3.39267 10.0244 2 7.99902 2C5.97369 2 4.33236 3.39333 4.33236 5.11133C4.33236 5.43533 4.36769 5.73133 4.44369 6M3.99902 10.8887C3.99902 12.6073 5.78969 14 7.99902 14C10.2084 14 11.999 13.1113 11.999 10.8887C11.999 9.29333 11.3124 8.38533 9.93769 8"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </svg>
);

export default StrikeThroughIcon;
const BoldIcon = ({
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
    {...props}
  >
    <path
      d="M3.33691 8H8.38958C10.0169 8 11.3369 6.65667 11.3369 5C11.3369 3.34333 10.0169 2 8.38958 2H5.33691C4.39358 2 3.92225 2 3.63025 2.29333C3.33691 2.586 3.33691 3.05733 3.33691 4V8ZM3.33691 8V12C3.33691 12.9433 3.33691 13.4147 3.63025 13.7067C3.92291 14 4.39425 14 5.33691 14H9.11491C10.7102 14 12.0036 12.6567 12.0036 11C12.0036 9.34333 10.7102 8 9.11491 8H8.28958"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default BoldIcon;

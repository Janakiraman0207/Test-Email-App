const EyeOnIcon = ({
  size = 14,
  className = "",
  color = "currentColor",
  strokeWidth = 1,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    className={className}
    {...props}
  >
    <path
      d="M13.5 10.5C14.2 9.8 14.8 9 15.2 8.4C15.4 8.1 15.5 7.9 15.5 8C15.5 7.7 15.4 7.5 15.2 7.2C14.1 5.7 11.6 3 8 3C4.4 3 1.9 5.7 0.8 7.2C0.6 7.5 0.5 7.7 0.5 8C0.5 8.3 0.6 8.5 0.8 8.8C1.9 10.3 4.4 13 8 13C11.6 13 14.1 10.3 15.2 8.8"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="8" cy="8" r="2.2" stroke={color} strokeWidth={strokeWidth} />
  </svg>
);
export default EyeOnIcon;
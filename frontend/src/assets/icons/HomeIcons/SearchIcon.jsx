const SearchIcon = ({
  size = 14,
  className = "",
  color = "white",
  strokeWidth = 0.875,
  ...props
}) => (
  <svg
    width={size}
    viewBox="0 0 14 14"
    fill="none"
    className={className}
    {...props}
  >
    <path
      d="M9.91667 9.91667L12.25 12.25M11.0833 6.41667C11.0833 5.17899..."
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default SearchIcon;
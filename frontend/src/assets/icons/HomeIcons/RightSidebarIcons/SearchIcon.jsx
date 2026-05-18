const SearchIcon = ({
  size = 13,
  color = "currentColor",
  strokeWidth = "",
  className = "",
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 13 13"
      fill="none"
      className={className}
      {...props}
    >
      <path
        d="M9.83333 9.83333L12.5 12.5M11.1667 5.83333C11.1667 4.41885 10.6048 3.06229 9.60457 2.0621C8.60438 1.0619 7.24782 0.5 5.83333 0.5C4.41885 0.5 3.06229 1.0619 2.0621 2.0621C1.0619 3.06229 0.5 4.41885 0.5 5.83333C0.5 7.24782 1.0619 8.60438 2.0621 9.60457C3.06229 10.6048 4.41885 11.1667 5.83333 11.1667C7.24782 11.1667 8.60438 10.6048 9.60457 9.60457C10.6048 8.60438 11.1667 7.24782 11.1667 5.83333Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default SearchIcon;
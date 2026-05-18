const CheckBoxIcon = ({
  size = 14,
  checked = false,
  color = "#6A37F5",
  className = "",
  strokeWidth = 0.875,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      className={className}
    >
      {checked ? (
        <>
          <circle
            cx="7"
            cy="7"
            r="6.125"
            fill={color}
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <path
            d="M4 7L6 9L10 5"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <circle
          cx="7"
          cy="7"
          r="5.25"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
};

export default CheckBoxIcon;

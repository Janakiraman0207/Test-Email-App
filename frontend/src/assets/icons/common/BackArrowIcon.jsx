const BackArrowIcon = ({
  size = 13,
  className = "",
  color = "#6231A5",
  ...props
}) => {
  return (
    <svg
      width={size}
      viewBox="0 0 13 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      {...props}
    >
      <path
        d="M1.04167 5.625H12.2917M5.625 10.625C5.625 10.625 0.625 6.9425 0.625 5.625C0.625 4.3075 5.625 0.625 5.625 0.625"
        stroke={color}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default BackArrowIcon;
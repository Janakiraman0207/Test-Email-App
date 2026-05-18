const CloseIcon = ({
  size = 16,
  width,
  height,
  className = "",
  color = "currentColor",
  stroke,
  strokeWidth = 1.25,
  strokeLinecap="round",
  ...props
}) => {
  return (
    <svg
      width={width || size}
      height={height || size}
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      {...props}
    >
      <path
        d="M15 5L5 15M15 15L5 5"
        stroke={stroke || color}
        strokeWidth={strokeWidth}
        strokeLinecap={strokeLinecap}
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default CloseIcon;

const ArrowIcon = ({
  size = 8,
  className = "",
  color = "currentColor",
  strokeWidth = 0.75,
  open = false,
  direction = "down", 
  ...props
}) => {
  const rotationMap = {
    down: "rotate-0",
    up: "rotate-180",
    right: "rotate-90",
    left: "-rotate-90",
  };

  return (
    <svg
      width={size}
      viewBox="0 0 7 4"
      fill="none"
      className={`transition-transform duration-200 ease-in-out origin-center ${
        rotationMap[direction]
      } ${className}`}
      preserveAspectRatio="xMidYMid meet"
      {...props}
    >
      <path
        d="M6.375 0.375C6.375 0.375 4.1655 3.375 3.375 3.375C2.5845 3.375 0.375 0.375 0.375 0.375"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default ArrowIcon;
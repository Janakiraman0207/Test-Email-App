const TriangleArrowIcon = ({
  size = 10,
  color = "#040B23",
  className = "",
  direction = "", 
}) => {
  const rotationMap = {
    right: "rotate-0",
    down: "rotate-90",
    left: "rotate-180",
    up: "-rotate-90",
  };

  return (
    <svg
      width={size / 2}
      height={size}
      viewBox="0 0 5 10"
      fill="none"
      className={`origin-center ${rotationMap[direction]} ${className}`}
    >
      <path
        d="M0 0L5 5L0 10Z"
        fill={color}
      />
    </svg>
  );
};

export default TriangleArrowIcon;
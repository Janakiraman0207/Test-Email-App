const ComposeModalExpandIcon = ({
  size = 20,
  className = "",
  color = "currentColor",
  strokeWidth = 1.25,
  ...props
}) => {
  return (
    <svg
      width={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      {...props}
    >
      <path
        d="M13.7502 2.72187C14.4535 2.71187 16.7835 2.2277 17.2785 2.72187C17.7735 3.21604 17.2885 5.54687 17.2785 6.2502M17.0885 2.90937L11.2519 8.74687M2.72187 13.7502C2.71187 14.4544 2.2277 16.7844 2.72187 17.2785C3.21604 17.7727 5.54687 17.2885 6.2502 17.2785M8.75187 11.2485L2.9152 17.086"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default ComposeModalExpandIcon;
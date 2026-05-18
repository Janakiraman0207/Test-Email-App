const TrashIcon = ({
  size = 15,
  className = "",
  color = "white",
  isRestore = false,
  strokeWidth = 1.25,
  ...props
}) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 13 15" preserveAspectRatio="xMidYMid meet" className={className} {...props}>
    <path
      d="M11.5 2.83333L11.0867 9.51667C10.9813 11.224 10.9287 12.078 10.5 12.692C10.2884 12.9954 10.0159 13.2515 9.7 13.444C9.062 13.8333 8.20667 13.8333 6.496 13.8333C4.78267 13.8333 3.926 13.8333 3.28667 13.4433C2.97059 13.2505 2.69814 12.9939 2.48667 12.69C2.05867 12.0753 2.00667 11.22 1.904 9.51L1.5 2.83333M0.5 2.83333H12.5M9.204 2.83333L8.74867 1.89467..."
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />

    {isRestore && (
      <line
        x1="1"
        y1="14"
        x2="12"
        y2="1"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    )}
  </svg>
);

export default TrashIcon;
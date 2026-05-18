const HighlighterIcon = ({
  size = 16,
  className = "",
  iconColor = "currentColor",
  highlightColor = "#ffff00",
  strokeWidth = 0.75,
  ...props
}) => (
  <svg
    width={size}
    viewBox="0 0 16 16"
    fill="none"
    className={className}
    {...props}
  >
    <rect y="14" width="16" height="2" rx="1" fill={highlightColor} />

    <path
      d="M5.089 9.3535L6.1465 10.411M5.089 9.3535L3 11.5H5L6.1465 10.411M5.089 9.3535C4.894 9.1585 4.8975 8.8435 5.0675 8.626C5.4635 8.119 5.6075 7.661 5.6495 7.319C5.696 6.943 5.787 6.5365 6.0545 6.269L6.5005 5.824C6.40676 5.73024 6.35411 5.60308 6.35411 5.4705C6.35411 5.33792 6.40676 5.21076 6.5005 5.117L8.6175 3M6.1465 10.411C6.3415 10.606 6.6565 10.6025 6.874 10.4325C7.381 10.0365 7.839 9.8925 8.181 9.8505C8.557 9.804 8.9635 9.713 9.231 9.4455L9.676 8.9995M9.676 8.9995L6.501 5.8245M9.676 8.9995C9.76976 9.09324 9.89692 9.14589 10.0295 9.14589C10.1621 9.14589 10.2892 9.09324 10.383 8.9995L12.5 6.8825"
      stroke={iconColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default HighlighterIcon;
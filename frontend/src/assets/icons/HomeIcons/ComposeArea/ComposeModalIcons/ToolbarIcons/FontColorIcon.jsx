const FontColorIcon = ({
  size = 16,
  className = "",
  iconColor = "currentColor",
  selectedColor = "#000000",
  ...props
}) => (
  <svg
    width={size}
    viewBox="0 0 16 16"
    fill="none"
    className={className}
    {...props}
  >
    <path
      d="M10.248 9.384H5.16L4.184 12.04H3L7.08 1H8.344L12.408 12.04H11.224L10.248 9.384ZM9.912 8.456L7.704 2.408L5.496 8.456H9.912Z"
      fill={iconColor}
    />
    <rect y="14" width="16" height="2" rx="1" fill={selectedColor} />
  </svg>
);

export default FontColorIcon;
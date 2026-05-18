const TextDropdownArrowIcon = ({
  size = 8,
  className = "",
  color = "currentColor",
  ...props
}) => (
  <svg
    width={size}
    viewBox="0 0 8 8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    preserveAspectRatio="xMidYMid meet"
    {...props}
  >
    <path
      d="M4.12262 5.27866L6.26596 3.06866C6.39962 2.93033 6.31862 2.66699 6.14262 2.66699H1.85596C1.67996 2.66699 1.59896 2.93033 1.73262 3.06866L3.87596 5.27866C3.94696 5.35199 4.05162 5.35199 4.12262 5.27866Z"
      fill={color}
    />
  </svg>
);
export default TextDropdownArrowIcon;

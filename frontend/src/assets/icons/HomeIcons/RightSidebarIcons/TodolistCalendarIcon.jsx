const TodolistCalendarIcon = ({
  size = 16,
  color = "currentColor",
  strokeWidth = "",
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    className={className}
  >
    <path
      d="M10.6667 1.33398V4.00065M5.33333 1.33398V4.00065M2 6.66732H14M8.66667 2.66732H7.33333C4.81933 2.66732 3.562 2.66732 2.78133 3.44865C2.00067 4.22998 2 5.48665 2 8.00065V9.33398C2 11.848 2 13.1053 2.78133 13.886C3.56267 14.6667 4.81933 14.6673 7.33333 14.6673H8.66667C11.1807 14.6673 12.438 14.6673 13.2187 13.886C13.9993 13.1047 14 11.848 14 9.33398V8.00065C14 5.48665 14 4.22932 13.2187 3.44865C12.4373 2.66798 11.1807 2.66732 8.66667 2.66732Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default TodolistCalendarIcon;

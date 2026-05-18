const CalendarIcon = ({
  size = 16,
  className = "",
  color = "currentColor",
  strokeWidth = 1,
  ...props
}) => (
  <svg width={size} viewBox="0 0 16 16" fill="none" className={className} {...props}>
    <path
      d="M10.6667 1.33301V3.99967M5.33333 1.33301V3.99967M2 6.66634H14M8.66667 2.66634H7.33333C4.81933 2.66634 3.562 2.66634 2.78133 3.44767C2.00067 4.22901 2 5.48567 2 7.99967V9.33301C2 11.847 2 13.1043 2.78133 13.885C3.56267 14.6657 4.81933 14.6663 7.33333 14.6663H8.66667C11.1807 14.6663 12.438 14.6663 13.2187 13.885C13.9993 13.1037 14 11.847 14 9.33301V7.99967C14 5.48567 14 4.22834 13.2187 3.44767C12.4373 2.66701 11.1807 2.66634 8.66667 2.66634Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <path
      d="M7.99701 9.33301H8.00234M7.99701 11.9997H8.00234M10.6603 9.33301H10.6663M5.33301 9.33301H5.33901M5.33301 11.9997H5.33901"
      stroke={color}
      strokeWidth="1.33333"
      strokeLinecap="round"
    />
  </svg>
);

export default CalendarIcon;
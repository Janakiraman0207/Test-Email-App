const ItalicIcon = ({
  size = 16,
  className = "",
  color = "currentColor",
  ...props
}) => (
  <svg width={size} viewBox="0 0 16 16" fill="none" className={className} {...props}>
    <path
      d="M8.00163 2.66797H12.6683M5.33496 13.3346L10.6683 2.66797M3.33496 13.3346H8.00163"
      stroke={color}
      strokeWidth="0.875"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default ItalicIcon;
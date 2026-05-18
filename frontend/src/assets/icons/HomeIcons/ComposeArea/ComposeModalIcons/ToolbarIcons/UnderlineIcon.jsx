const UnderlineIcon = ({
  size = 16,
  className = "",
  color = "currentColor",
  ...props
}) => (
  <svg width={size} viewBox="0 0 16 16" fill="none" className={className} {...props}>
    <path
      d="M3.66667 2V7.66667C3.66667 8.81594 4.12321 9.91814 4.93587 10.7308C5.74853 11.5435 6.85073 12 8 12C9.14927 12 10.2515 11.5435 11.0641 10.7308C11.8768 9.91814 12.3333 8.81594 12.3333 7.66667V2M2 14H14"
      stroke={color}
      strokeWidth="1.125"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default UnderlineIcon;
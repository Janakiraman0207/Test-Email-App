const RefreshIcon = ({
  size = 16,
  color = "currentColor",
  strokeWidth = "",
  className = "",
}) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <path
      d="M10.926 2L11.5947 2.65067C11.8933 2.94133 12.0427 3.08667 11.99 3.21C11.938 3.33333 11.7273 3.33333 11.304 3.33333H6.13065C3.48065 3.33333 1.33398 5.42267 1.33398 8C1.33398 8.99133 1.65198 9.91067 2.19398 10.6667M5.07532 14L4.40665 13.3493C4.10798 13.0587 3.95865 12.9133 4.01132 12.79C4.06332 12.6667 4.27398 12.6667 4.69732 12.6667H9.87065C12.5207 12.6667 14.6673 10.5773 14.6673 8C14.6676 7.04288 14.3667 6.10994 13.8073 5.33333"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default RefreshIcon;
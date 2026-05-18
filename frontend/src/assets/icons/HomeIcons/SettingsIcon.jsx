const SettingsIcon = ({
  size = 24,
  className = "",
  color = "currentColor",
  strokeWidth = 1.5,
  ...props
}) => (
  <svg
    width={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <path
      d="M21.3187 7.14084L20.8247 6.28484C20.4517 5.63684 20.2647 5.31284 19.9467 5.18384C19.6297 5.05384 19.2707 5.15684 18.5517 5.35984..."
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <path
      d="M15.5205 12C15.5205 12.9283 15.1518 13.8185 14.4954 14.4749..."
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </svg>
);

export default SettingsIcon;
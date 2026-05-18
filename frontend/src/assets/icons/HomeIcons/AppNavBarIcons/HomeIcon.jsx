const HomeIcon = ({
  size = 16,
  className = "",
  color = "currentColor",
  strokeWidth = 1,
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
      d="M2 7.99366V9.66699C2 11.867 2 12.967 2.68333 13.6503C3.36667 14.3337 4.46667 14.3337 6.66667 14.3337H9.33333C11.5333 14.3337 12.6333 14.3337 13.3167 13.6503C14 12.967 14 11.867 14 9.66699V7.99366C14 6.87233 14 6.31233 13.7627 5.82699C13.5253 5.34166 13.0827 4.99766 12.1987 4.30966L10.8653 3.27299C9.48867 2.20233 8.8 1.66699 8 1.66699C7.2 1.66699 6.51133 2.20233 5.13467 3.27299L3.80133 4.30966C2.91667 4.99766 2.47467 5.34166 2.23733 5.82699C2 6.31233 2 6.87233 2 7.99366Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 11.333C9.46667 11.7477 8.76667 11.9997 8 11.9997C7.23333 11.9997 6.53333 11.7477 6 11.333"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </svg>
);

export default HomeIcon;
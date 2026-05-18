const EyeOffIcon = ({
  size = 14,
  className = "",
  color = "currentColor",
  strokeWidth = 0.875,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 14 14"
    fill="none"
    className={className}
    {...props}
  >
    <path
      d="M11.3394 9.00609C11.7884 8.55816 12.1991 8.07348 12.5673 7.55709C12.7447 7.30859 12.8333 7.18376 12.8333 7.00001C12.8333 6.81567 12.7447 6.69142 12.5673 6.44292C11.7705 5.32526 9.73524 2.91667 6.99999 2.91667C6.47032 2.91667 5.96749 3.00709 5.49382 3.16051M3.93632 3.93634C2.75974 4.72967 1.89116 5.80009 1.43266 6.44292C1.25532 6.69142 1.16666 6.81626 1.16666 7.00001C1.16666 7.18434 1.25532 7.30859 1.43266 7.55709C2.22949 8.67476 4.26474 11.0833 6.99999 11.0833C8.16082 11.0833 9.19624 10.6493 10.0642 10.0643"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.75049 5.83333C5.58908 5.99136 5.4606 6.17983 5.37251 6.38784C5.28441 6.59585 5.23843 6.81926 5.23724 7.04515C5.23604 7.27104 5.27965 7.49493 5.36555 7.70386C5.45144 7.91278 5.57791 8.1026 5.73765 8.26234"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <path
      d="M1.75 1.75L12.25 12.25"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </svg>
);
export default EyeOffIcon;

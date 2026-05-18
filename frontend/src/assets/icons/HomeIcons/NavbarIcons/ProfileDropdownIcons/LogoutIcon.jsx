const LogoutIcon = ({
  size = 14,
  className = "",
  color = "#FC3737",
  strokeWidth = 1.25,
  ...props
}) => {
  return (
    <svg
      width={size}
      viewBox="0 0 14 13"
      fill="none"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      {...props}
    >
      <path
        d="M9.16667 3.85992C9.13933 3.08659 9.048 2.60326 8.74267 2.22459C8.30733 1.68326 7.56267 1.51392 6.07333 1.17392L5.40667 1.02192C3.14333 0.505924 2.012 0.247924 1.256 0.841924C0.5 1.43659 0.5 2.58392 0.5 4.87859V8.12126C0.5 10.4159 0.5 11.5639 1.256 12.1579C2.012 12.7519 3.14267 12.4939 5.406 11.9779L6.074 11.8259C7.56267 11.4859 8.30733 11.3166 8.74267 10.7753C9.048 10.3973 9.13933 9.91326 9.16667 9.13992M11.1667 4.50792C11.1667 4.50792 13.1667 5.98126 13.1667 6.50792C13.1667 7.03459 11.1667 8.50792 11.1667 8.50792M12.8333 6.50792H4.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default LogoutIcon;
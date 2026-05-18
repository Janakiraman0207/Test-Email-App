const StatusDotIcon = ({
  size = 4,
  className = "",
  color = "#1EAF53", 
  ...props
}) => {
  return (
    <svg
      width={size}
      viewBox="0 0 4 4"
      fill="none"
      className={className}
      {...props}
    >
      <circle cx="2" cy="2" r="2" fill={color} />
    </svg>
  );
};

export default StatusDotIcon;
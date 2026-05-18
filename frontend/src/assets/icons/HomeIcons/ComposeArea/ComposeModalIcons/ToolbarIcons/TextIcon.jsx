const TextIcon = ({
  size = 16,
  className = "",
  color = "currentColor",
  strokeWidth = 1,
  ...props
}) => {
  return (
    <svg
      width={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      {...props}
    >
      <path
        d="M10.001 14.001H6.00098"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M8.00065 2V14M8.00065 2C8.92532 2 10.114 2.02 11.0593 2.11733C11.4593 2.15867 11.6593 2.17933 11.8367 2.252C12.0218 2.33032 12.1875 2.44855 12.3217 2.59824C12.456 2.74793 12.5555 2.92541 12.6133 3.118C12.6673 3.30267 12.6673 3.51333 12.6673 3.93467M8.00065 2C7.07598 2 5.88732 2.02 4.94198 2.11733C4.54198 2.15867 4.34198 2.17933 4.16465 2.252C3.97933 2.33024 3.81358 2.44843 3.67921 2.59813C3.54484 2.74783 3.44517 2.92534 3.38732 3.118C3.33398 3.30267 3.33398 3.51333 3.33398 3.93467"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
};

export default TextIcon;
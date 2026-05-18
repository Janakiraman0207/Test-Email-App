const RadioIcon = ({
  size = 13,
  checked = false,
  className = "",
  activeColor = "#6231A5",
  inactiveColor = "#C5C5C5",
  ...props
}) => {
  const color = checked ? activeColor : inactiveColor;

  return (
    <svg
      width={size}
      viewBox="0 0 13 13"
      fill="none"
      className={className}
      {...props}
    >
      <path
        d="M6.5 12.5C9.81371 12.5 12.5 9.81371 12.5 6.5C12.5 3.18629 9.81371 0.5 6.5 0.5C3.18629 0.5 0.5 3.18629 0.5 6.5C0.5 9.81371 3.18629 12.5 6.5 12.5Z"
        stroke={color}
      />

      {checked && (
        <path
          d="M6.5 9.16683C7.97276 9.16683 9.16667 7.97292 9.16667 6.5C9.16667 5.02708 7.97276 3.83317 6.5 3.83317C5.02724 3.83317 3.83333 5.02708 3.83333 6.5C3.83333 7.97292 5.02724 9.16683 6.5 9.16683Z"
          fill={color}
        />
      )}
    </svg>
  );
};

export default RadioIcon;

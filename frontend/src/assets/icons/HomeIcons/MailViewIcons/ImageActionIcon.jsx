const ImageActionIcon = ({
    size=14,
  className = "",
  color = "currentColor",
  strokeWidth = 0.875,
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      className={className}
      {...props}
    >
      <path
        d="M4.37488 5.25C4.85813 5.25 5.24988 4.85825 5.24988 4.375C5.24988 3.89175 4.85813 3.5 4.37488 3.5C3.89163 3.5 3.49988 3.89175 3.49988 4.375C3.49988 4.85825 3.89163 5.25 4.37488 5.25Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1.45825 6.99967C1.45825 4.38751 1.45825 3.08084 2.26967 2.26942C3.08109 1.45801 4.38717 1.45801 6.99992 1.45801C9.61209 1.45801 10.9188 1.45801 11.7302 2.26942C12.5416 3.08084 12.5416 4.38692 12.5416 6.99967C12.5416 9.61184 12.5416 10.9185 11.7302 11.7299C10.9188 12.5413 9.61267 12.5413 6.99992 12.5413C4.38775 12.5413 3.08109 12.5413 2.26967 11.7299C1.45825 10.9185 1.45825 9.61243 1.45825 6.99967Z"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <path
        d="M2.91675 12.2501C5.46708 9.20217 8.32658 5.18242 12.5406 7.89959"
        stroke={color}
        strokeWidth={strokeWidth}
      />
    </svg>
  );
};

export default ImageActionIcon;
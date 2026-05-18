const DocumentActionIcon = ({
  size = 14,
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
        d="M11.9584 6.12533V5.83366C11.9584 3.63391 11.9584 2.53374 11.2747 1.85066C10.5911 1.16758 9.4915 1.16699 7.29175 1.16699H6.70842C4.50866 1.16699 3.4085 1.16699 2.72541 1.85066C2.04233 2.53433 2.04175 3.63391 2.04175 5.83366V8.45866C2.04175 10.3761 2.04175 11.3351 2.57141 11.9808C2.66864 12.099 2.77636 12.2068 2.89458 12.304C3.54091 12.8337 4.49875 12.8337 6.41675 12.8337M4.37508 4.08366H9.62508M4.37508 7.00033H7.87508"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.9583 11.667V9.91699C11.9583 9.08283 11.1748 8.16699 10.2083 8.16699C9.24167 8.16699 8.45825 9.08283 8.45825 9.91699V11.9587C8.45825 12.1907 8.55044 12.4133 8.71453 12.5774C8.87863 12.7415 9.10119 12.8337 9.33325 12.8337C9.56532 12.8337 9.78788 12.7415 9.95197 12.5774C10.1161 12.4133 10.2083 12.1907 10.2083 11.9587V9.91699"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default DocumentActionIcon;

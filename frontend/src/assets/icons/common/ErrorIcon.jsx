const ErrorIcon = ({
  size = 17,
  className = "",
  strokeWidth = 1.0625,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 17 17"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <g clipPath="url(#clip0_822_1195)">
      <path
        d="M8.50033 15.5834C12.4123 15.5834 15.5837 12.4121 15.5837 8.50008C15.5837 4.58806 12.4123 1.41675 8.50033 1.41675C4.58831 1.41675 1.41699 4.58806 1.41699 8.50008C1.41699 12.4121 4.58831 15.5834 8.50033 15.5834Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 5.66675V8.85425"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 11.325V11.332"
        stroke="currentColor"
        strokeWidth="1.275"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_822_1195">
        <rect width="17" height="17" fill="white" />
      </clipPath>
    </defs>
  </svg>
);
export default ErrorIcon;

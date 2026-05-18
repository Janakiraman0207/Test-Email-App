const AttachmentDownloadIcon = ({
  size = 9,
  className = "",
  bgColor = "#6A37F5",
  iconColor = "white",
  ...props
}) => (
  <svg
    width={size}
    viewBox="0 0 9 9"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    preserveAspectRatio="xMidYMid meet"
    {...props}
  >
    <path
      d="M8.33333 4.16667C8.33333 6.46792 6.46792 8.33333 4.16667 8.33333C1.86542 8.33333 0 6.46792 0 4.16667C0 1.86542 1.86542 0 4.16667 0C6.46792 0 8.33333 1.86542 8.33333 4.16667Z"
      fill={bgColor}
    />

    <path
      d="M5.83333 4.37533C5.83333 4.37533 4.60583 6.04199 4.16667 6.04199C3.7275 6.04199 2.5 4.37533 2.5 4.37533M4.16667 5.83366V2.29199"
      stroke={iconColor}
      strokeWidth="0.625"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default AttachmentDownloadIcon;

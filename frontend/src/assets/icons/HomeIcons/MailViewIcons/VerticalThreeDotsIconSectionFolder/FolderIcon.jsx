const FolderIcon = ({
  size = 18,
  className = "",
  color = "currentColor",
  strokeWidth = "",
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 15 13"
      fill="none"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      {...props}
    >
      <path
        d="M3.83333 3.16667H10.3333C11.738 3.16667 12.44 3.16667 12.9447 3.504C13.1628 3.64983 13.3502 3.83717 13.496 4.05533C13.8333 4.56 13.8333 5.262 13.8333 6.66667V7.16667M7.16667 3.16667L6.74467 2.322C6.39467 1.622 6.07467 0.918 5.29933 0.627333C4.96 0.5 4.572 0.5 3.796 0.5C2.58533 0.5 1.98 0.5 1.52533 0.753333C1.20138 0.93409 0.93409 1.20138 0.753333 1.52533C0.5 1.98 0.5 2.58533 0.5 3.796V5.83333C0.5 8.976 0.5 10.5473 1.476 11.5233C2.38133 12.4293 3.796 12.4953 6.5 12.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M12.1667 9.1665C12.504 9.49384 13.8333 10.3665 13.8333 10.8332M13.8333 10.8332C13.8333 11.2998 12.504 12.1725 12.1667 12.4998M13.8333 10.8332H8.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default FolderIcon;

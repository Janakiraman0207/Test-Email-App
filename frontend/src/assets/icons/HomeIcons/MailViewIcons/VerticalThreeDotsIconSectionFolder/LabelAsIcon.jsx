const LabelAsIcon = ({
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
      viewBox="0 0 15 12"
      fill="none"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      {...props}
    >
      <path
        d="M7.83334 0.5H3.32334C1.69667 0.5 0.883338 0.5 0.596671 1.01067L0.571338 1.05867C0.312671 1.584 0.773338 2.254 1.69534 3.59467C2.43067 4.664 2.79867 5.19867 2.80734 5.804V5.86267C2.79867 6.468 2.43067 7.00267 1.69534 8.072C0.773338 9.412 0.312671 10.0827 0.571338 10.6087L0.596005 10.6553C0.882671 11.1667 1.696 11.1667 3.32267 11.1667H7.83334C9.142 11.1667 9.796 11.1667 10.3593 10.8853C10.922 10.6033 11.3147 10.08 12.1 9.03333C13.2553 7.49267 13.8333 6.722 13.8333 5.83333C13.8333 4.94467 13.2553 4.174 12.1 2.63333C11.3147 1.58667 10.922 1.06333 10.3593 0.781333C9.796 0.5 9.142 0.5 7.83334 0.5Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default LabelAsIcon;
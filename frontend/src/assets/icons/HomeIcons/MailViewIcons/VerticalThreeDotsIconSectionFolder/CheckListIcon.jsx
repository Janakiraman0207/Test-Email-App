const CheckListIcon = ({
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
      viewBox="0 0 12 15"
      fill="none"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      {...props}
    >
      <path
        d="M7.5013 0.5H4.16797C3.90275 0.5 3.6484 0.605357 3.46086 0.792893C3.27333 0.98043 3.16797 1.23478 3.16797 1.5C3.16797 1.76522 3.27333 2.01957 3.46086 2.20711C3.6484 2.39464 3.90275 2.5 4.16797 2.5H7.5013C7.76652 2.5 8.02087 2.39464 8.20841 2.20711C8.39595 2.01957 8.5013 1.76522 8.5013 1.5C8.5013 1.23478 8.39595 0.98043 8.20841 0.792893C8.02087 0.605357 7.76652 0.5 7.5013 0.5Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 1.5C9.536 1.53133 10.1533 1.64667 10.5807 2.07467C11.1673 2.66 11.1673 3.60267 11.1673 5.488V9.83333C11.1673 11.7187 11.1673 12.6613 10.5807 13.2473C9.99533 13.8333 9.052 13.8333 7.16733 13.8333H4.50067C2.614 13.8333 1.67133 13.8333 1.086 13.2473C0.500667 12.6613 0.5 11.7187 0.5 9.83333V5.48867C0.5 3.60333 0.5 2.66 1.086 2.07467C1.51333 1.64667 2.13133 1.53133 3.16667 1.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.83203 6.5L3.4987 7.16667L4.83203 5.5M6.4987 10.5H8.4987M6.4987 6.5H8.4987"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.49219 10.4121H3.49885"
        stroke={color}
        strokeWidth={strokeWidth}   
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default CheckListIcon;
const CategoryIcons = ({ color, size = 14, strokeWidth = 2 }) => {
  const radius = (size - strokeWidth) / 2;

  return (
    <svg width={size} height={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill={color}
      />
    </svg>
  );
};

export default CategoryIcons;

// <svg width="14" height="14"><circle cx="7" cy="7" r="7" fill={category.color === 'blue' ? '#2A84D2' : category.color === 'red' ? '#D22A84' : category.color === 'green' ? '#2AD284' : '#D2842A'} /></svg>

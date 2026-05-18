export const PeopleTag = ({ label }) => {
  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-600">
      <span className="w-3 h-3 bg-gray-400 rounded-sm"></span>
      {label}
    </div>
  );
};
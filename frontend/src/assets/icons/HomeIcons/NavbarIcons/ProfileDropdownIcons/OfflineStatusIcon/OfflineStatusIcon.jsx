import CircleIcon from "./CircleIcon";
import CloseIconSmall from "./CloseIconSmall";

const OfflineStatusIcon = ({
  size = 20,
  bgColor = "#8A8A8A",
  iconColor = "#8A8A8A",
}) => {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <CircleIcon color={bgColor} />

      <div className="absolute inset-0 flex items-center justify-center">
        <CloseIconSmall color={iconColor} />
      </div>
    </div>
  );
};

export default OfflineStatusIcon;
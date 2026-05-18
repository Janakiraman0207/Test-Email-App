const StatusIcon = ({ status, size = 8, iconSize = 4 }) => {
  switch (status) {
    case "available":
      return (
        <div
          className="rounded-full bg-[#1EAF53] flex items-center justify-center leading-none"
          style={{
            width: `${size}px`,
            height: `${size}px`,
          }}
        >
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M4 8L6.5 10.5L12 5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );

    case "busy":
      return (
        <div
          className="rounded-full bg-[#FC3737] leading-none"
          style={{
            width: `${size}px`,
            height: `${size}px`,
          }}
        />
      );

    case "dnd":
      return (
        <div
          className="rounded-full bg-[#FC3737] flex items-center justify-center leading-none"
          style={{
            width: `${size}px`,
            height: `${size}px`,
          }}
        >
          <div
            className="bg-white rounded-full"
            style={{
              width: `${iconSize}px`,
              height: `1.5px`,
            }}
          />
        </div>
      );

    case "away":
      return (
        <div
          className="rounded-full bg-[#F89F00] flex items-center justify-center leading-none"
          style={{
            width: `${size}px`,
            height: `${size}px`,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
          >
            <path
              fill="#F89F00"
              d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10s10-4.49 10-10S17.51 2 12 2"
            />

            <path fill="#FFFFFF" d="M18 13h-6c-.55 0-1-.45-1-1V6h2v5h5z" />
          </svg>
        </div>
      );

    case "offline":
      return (
        <div
          className="rounded-full bg-white border border-gray-400 flex items-center justify-center leading-none"
          style={{
            width: `${size}px`,
            height: `${size}px`,
          }}
        >
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M4 4L12 12"
              stroke="#6B7280"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M12 4L4 12"
              stroke="#6B7280"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      );
    case "out_of_office":
      return (
        <div
          className="rounded-full bg-white border border-[#FC3737] flex items-center justify-center leading-none"
          style={{
            width: `${size}px`,
            height: `${size}px`,
          }}
        >
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 16 16"
            fill="none"
            className="shrink-0"
          >
            <rect
              x="5"
              y="6"
              width="6"
              height="5"
              stroke="#FC3737"
              strokeWidth="1.5"
            />

            <path
              d="M6.5 6V4.5H9.5V6"
              stroke="#FC3737"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      );

    default:
      return null;
  }
};

export default StatusIcon;

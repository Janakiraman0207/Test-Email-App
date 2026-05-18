export const STATUS_LIST = [
  {
    label: "Available",
    value: "available",
    icon: (
      <span className="w-2 h-2 rounded-full flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <path
            fill="#1EAF53"
            d="m10.6 13.8l-2.15-2.15q-.275-.275-.7-.275t-.7.275t-.275.7t.275.7L9.9 15.9q.3.3.7.3t.7-.3l5.65-5.65q.275-.275.275-.7t-.275-.7t-.7-.275t-.7.275zM12 22q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22"
          />
        </svg>
      </span>
    ),
    navbarIcon: (
  <div className="w-[8px] h-[8px] rounded-full bg-[#1EAF53] flex items-center justify-center shrink-0">
    <svg
      width="4"
      height="4"
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
),
  },

  {
    label: "Busy",
    value: "busy",
    icon: <div className="w-2 h-2 rounded-full bg-red-500" />,
    navbarIcon: <span className="w-[8px] h-[8px] rounded-full bg-red-500" />,
  },

  {
    label: "Do not Disturb",
    value: "dnd",
    icon: (
      <span className="w-2 h-2 rounded-full bg-red-500 flex items-center justify-center">
        <span className="w-[4px] h-[1.5px] bg-white rounded-full" />
      </span>
    ),

    navbarIcon: (
      <span className="w-[8px] h-[8px] rounded-full bg-red-500 flex items-center justify-center">
        <span className="w-[4px] h-[2px] bg-white rounded-full" />
      </span>
    ),
  },

  {
    label: "Appear away",
    value: "away",
    icon: (
      <span className="w-2 h-2 rounded-full bg-amber-500 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <path
            fill="#F89F00"
            d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10s10-4.49 10-10S17.51 2 12 2"
          />

          <path fill="#FFFFFF" d="M18 13h-6c-.55 0-1-.45-1-1V6h2v5h5z" />
        </svg>
      </span>
    ),
    navbarIcon: (
      <div className="w-[8px] h-[8px] rounded-full bg-[#F89F00] flex items-center justify-center">
        <svg width="4" height="4" viewBox="0 0 16 16" fill="white">
          <path d="M8 3a5 5 0 1 0 5 5A5 5 0 0 0 8 3Zm-.5 2v3l2 1 .5-.8-1.5-.7V5Z" />
        </svg>
      </div>
    ),
  },

  {
    label: "Offline",
    value: "offline",
    icon: (
      <span className="w-2 h-2 rounded-full bg-white flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle cx="12" cy="12" r="9" stroke="#6B7280" strokeWidth="2.5" />

          <path
            d="M9 9L15 15"
            stroke="#6B7280"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          <path
            d="M15 9L9 15"
            stroke="#6B7280"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
    ),
    navbarIcon: (
      <span className="w-[8px] h-[8px] rounded-full bg-white border border-gray-400 flex items-center justify-center">
        <svg width="8" height="8" viewBox="0 0 16 16" fill="none">
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
      </span>
    ),
  },

  {
    label: "Out of office",
    value: "out_of_office",
    icon: (
      <span className="w-2 h-2 rounded-full bg-white border-[0.3px] border-[#FC3737] flex items-center justify-center">
        <svg
          width="4"
          height="4"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14.825 6.95L12.0417 1.38334C11.8338 0.966966 11.5139 0.61688 11.1178 0.372485C10.7218 0.128091 10.2654 -0.000909752 9.80001 4.82952e-06H5.20001C4.73464 -0.000909752 4.27825 0.128091 3.88221 0.372485C3.48617 0.61688 3.16621 0.966966 2.95835 1.38334L0.175013 6.95C0.0589264 7.18291 -0.00100693 7.43977 1.27975e-05 7.7V12.5C1.27975e-05 13.163 0.263405 13.7989 0.732246 14.2678C1.20109 14.7366 1.83697 15 2.50001 15H12.5C13.1631 15 13.7989 14.7366 14.2678 14.2678C14.7366 13.7989 15 13.163 15 12.5V7.7C15.001 7.43977 14.9411 7.18291 14.825 6.95ZM4.45001 2.125C4.5199 1.98631 4.62715 1.8699 4.75967 1.78892C4.89219 1.70793 5.04471 1.66559 5.20001 1.66667H9.80001C9.95532 1.66559 10.1078 1.70793 10.2404 1.78892C10.3729 1.8699 10.4801 1.98631 10.55 2.125L12.8167 6.66667H10.8333C10.6123 6.66667 10.4004 6.75447 10.2441 6.91075C10.0878 7.06703 10 7.27899 10 7.5V10H5.00001V7.5C5.00001 7.27899 4.91222 7.06703 4.75594 6.91075C4.59965 6.75447 4.38769 6.66667 4.16668 6.66667H2.18335L4.45001 2.125ZM12.5 13.3333H2.50001C2.279 13.3333 2.06704 13.2455 1.91076 13.0893C1.75448 12.933 1.66668 12.721 1.66668 12.5V8.33334H3.33335V10.8333C3.33335 11.0544 3.42114 11.2663 3.57742 11.4226C3.7337 11.5789 3.94567 11.6667 4.16668 11.6667H10.8333C11.0544 11.6667 11.2663 11.5789 11.4226 11.4226C11.5789 11.2663 11.6667 11.0544 11.6667 10.8333V8.33334H13.3333V12.5C13.3333 12.721 13.2456 12.933 13.0893 13.0893C12.933 13.2455 12.721 13.3333 12.5 13.3333Z"
            fill="#FC3737"
          />
        </svg>
      </span>
    ),
    navbarIcon: (
      <div className="w-[8px] h-[8px] rounded-full bg-white border border-red-500 flex items-center justify-center">
        <svg width="4" height="4" viewBox="0 0 16 16" fill="none">
          <rect
            x="5"
            y="6"
            width="6"
            height="5"
            stroke="#EF4444"
            strokeWidth="1.5"
          />
          <path
            d="M6.5 6V4.5H9.5V6"
            stroke="#EF4444"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
  },
];

export const statusTextColor = {
  available: "#1EAF53",
  busy: "#FC3737",
  dnd: "#FC3737",
  away: "#F89F00",
  offline: "#6B7280",
  out_of_office: "#FC3737",
};

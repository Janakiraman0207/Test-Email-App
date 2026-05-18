// import React, { useState } from "react";
// import { useNavigate,useLocation } from "react-router-dom";
// import {
//   HomeIcon,
//   MessageIcon,
//   CalendarIcon,
//   ChatsIcon,
//   DriveIcon
// } from "../../../../assets/icons/Icons";

// const NAV_ITEMS = [
//   { id: "home", label: "Home", icon: HomeIcon, /*path: "/home",*/ w: "60px", h: "16px" },
//   { id: "message", label: "Message", icon: MessageIcon,path: "/home",w: "81px", h: "16px" },
//   { id: "calendar", label: "Calendar", icon: CalendarIcon, path: "/calendar", w: "85px",
//     h: "16px", },
//   { id: "chats", label: "Chats", icon: ChatsIcon, path: "/chat",w: "61px", h: "16px" },
//   { id: "drive", label: "Drive", icon: DriveIcon, path: "/drive", w: "57px", h: "16px" },
// ];

// export const AppNavBar = () => {
//   const [active, setActive] = useState("message");
//   const navigate = useNavigate();
//   const location = useLocation();

//   const handleNav = (item) => {
//     setActive(item.id);
//     navigate(item.path);
//   };

//   return (
//     <div className="w-full h-[66px] bg-[#6A37F5] px-[42px] flex items-center">
//       <div className="flex flex-row justify-between item-center w-full h-[41px] ">
//         <div className="flex flex-row items-center gap-[42px]">
//           {NAV_ITEMS.map((item) => {
//             const Icon = item.icon;
//             const isActive = location.pathname === item.path;
//             return (
//               <button
//                 key={item.id}
//                 onClick={() => handleNav(item)}
//                 className={`relative flex items-center justify-center gap-2 w-[108px] h-[41px] rounded-[20px] inter-regular cursor-pointer leading-[100%] tracking-[0.07em] transition-all
//                   ${ isActive ? "bg-[#040B23]/35 text-white" : "bg-transparent text-white hover:bg-white/10"}`}
//               >
//                 <Icon
//                   className={`w-4 h-4 ${
//                     isActive ? "text-white" : "text-white/80"
//                   }`}
//                 />
//                 <p className="text-[12px] leading-none tracking-[0.07em]">
//                   {item.label}
//                 </p>
//                 {isActive && (
//                   <span
//                     className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#040B23]/35"/>
//                 )}
//               </button>
//             );
//           })}
//         </div>

//         {/* Only show compose button when not on calendar, chat, or drive routes */}
//         {!['/calendar', '/chat', '/drive'].includes(location.pathname) && (
//           <div className='flex flex-col items-center justify-center w-[141px] h-[36px] rounded-lg bg-black'>
//             <button
//               className="inter-regular text-[11px] text-[#FFFFFF]"
//             >
//               Compose New Email
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  HomeIcon,
  MessageIcon,
  CalendarIcon,
  ChatsIcon,
  DriveIcon,
} from "../../../../assets/icons/IconRegistry";

const NAV_ITEMS = [
  {
    id: "home",
    label: "Home",
    icon: HomeIcon,
    /*path: "/home",*/ w: "60px",
    h: "16px",
  },
  {
    id: "message",
    label: "Message",
    icon: MessageIcon,
    path: "/home",
    w: "81px",
    h: "16px",
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: CalendarIcon,
    path: "/calendar",
    w: "85px",
    h: "16px",
  },
  {
    id: "chats",
    label: "Chats",
    icon: ChatsIcon,
    path: "/chat",
    w: "61px",
    h: "16px",
  },
  {
    id: "drive",
    label: "Drive",
    icon: DriveIcon,
    path: "/drive",
    w: "57px",
    h: "16px",
  },
];

export const AppNavBar = ({ setIsComposeOpen }) => {
  const [active, setActive] = useState("message");
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (item) => {
    setActive(item.id);
    navigate(item.path);
  };

  return (
    <div className="w-full h-[66px] bg-[#6A37F5] px-[42px] flex items-center">
      <div className="flex flex-row justify-between item-center w-full h-[41px] ">
        <div className="flex flex-row items-center gap-[42px]">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item)}
                className={`relative flex items-center justify-center gap-2 w-[108px] h-[41px] rounded-[20px] inter-regular cursor-pointer leading-[100%] tracking-[0.07em] transition-all
                  ${isActive ? "bg-[#040B23]/35 text-white" : "bg-transparent text-white hover:bg-white/10"}`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-white" : "text-white/80"
                  }`}
                />
                <p className="text-[12px] leading-none tracking-[0.07em]">
                  {item.label}
                </p>
                {isActive && (
                  <span className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#040B23]/35" />
                )}
              </button>
            );
          })}
        </div>

        {/* Only show compose button when not on calendar, chat, or drive routes */}
        {!["/calendar", "/chat", "/drive"].includes(location.pathname) && (
          <button
            className="flex flex-col items-center justify-center w-[141px] h-[36px] rounded-lg bg-black cursor-pointer inter-regular text-[11px] text-[#FFFFFF]"
            onClick={() => setIsComposeOpen?.(true)}
          >
            Compose New Email
          </button>
        )}
      </div>
    </div>
  );
};

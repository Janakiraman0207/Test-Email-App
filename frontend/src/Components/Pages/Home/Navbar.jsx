import React from "react";
import {
  BellIcon,
  SearchIcon,
  SettingsIcon,
} from "../../../assets/icons/Icons";
import profileimg from "../../../assets/images/profileimg.png";

export const Navbar = () => {
  return (
    <header className="w-full h-[67px] px-[42px] bg-[#040B23] flex items-center justify-between text-white">
      <div className="h-full flex items-center w-full">
        <div className="w-[100px]">
          <span className="krona-one-regular text-[#FFFFFF] text-[12px]">
            STACKLY
          </span>
        </div>
        <div className="flex items-center">
          <div
            className="flex items-center h-[28px] w-[302px] rounded-[6px] ml-[20px] bg-white/10 border
    border-white/20 group"
          >
            <div className="flex items-center justify-center px-[10px] gap-[8px]">
              <SearchIcon />
              <select
                className="bg-transparent text-white/70 text-[13px] outline-none"
                id="select"
                name="select"
              >
                <option>Mail</option>
              </select>
            </div>
            {/* <div className="flex items-center justify-center px-[10px] gap-[6px]">
              <SearchIcon />
              <div className="relative flex items-center h-[28px]">
                <select
                  className="
        appearance-none
        bg-transparent
        text-white/70
        text-[13px]
        leading-none
        pr-[14px]
        outline-none
        cursor-pointer
      "
                  id="select"
                  name="select"
                >
                  <option>Mail</option>
                </select>
                <span
                  className="
        pointer-events-none
        absolute
        right-0
        top-1/2
        -translate-y-1/2
        w-[10px]
        h-[10px]
       bg-white
        transition-transform
    duration-300 ease-in-out opacity-80
    group-hover:rotate-180
    [mask-image:url('/src/assets/images/chevron-black-down.svg')]
    [mask-repeat:no-repeat]
    [mask-position:center]
    [mask-size:contain]"
                />
              </div>
            </div> */}

            <div className="w-px h-4 bg-white/20 border-[#8D8D8D]" />
            <input
              type="text"
              placeholder="Search here"
              className="bg-transparent outline-none text-white/70 text-[13px] w-full placeholder:text-white/50 pl-[12px]"
            />
          </div>
        </div>
        <div className="w-[466px]" />
        <div className="flex items-center ml-[350px] gap-6">
          <BellIcon />
          <SettingsIcon />
           <div className="flex items-center justify-center w-[179px] h-[44px] rounded-[22px] bg-[#1C1D3B]">
             <div className="flex flex-row items-center justify-between w-[159px] h-[28px] gap-[10px]">
              <div className="flex flex-row w-[120px] h-[28px] gap-[5px]">
                 <img src={profileimg} alt="Profile" className="w-[28px] h-[28px] "/>
                 <div className="flex flex-col w-[84px] h-[28px] ">
                   <span className="w-[84px] h-[15px] inter-bold text-[12px]" style={{ letterSpacing: "2%" }}>Jessica A. Utt</span>
                   <div className="flex flex-row items-center justify-center  w-[33px] h-[10px] gap-[5px] ">
                     <svg width="4" height="4" viewBox="0 0 4 4" fill="none"  xmlns="http://www.w3.org/2000/svg" className="mt-[1px]">
                       <circle cx="2" cy="2" r="2" fill="#1EAF53"/>
                     </svg>
                      <span className="w-[25px] h-[10px] text-[8px] inter-medium text-[#1EAF53]"style={{ letterSpacing: "2%" }}>Active</span>
                   </div>
                 </div>
                  
              </div>
              <div className="w-[12px] h-[12px] flex items-center justify-center">
                    <svg width="7" height="4" viewBox="0 0 7 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6.375 0.375C6.375 0.375 4.1655 3.375 3.375 3.375C2.5845 3.375 0.375 0.375 0.375 0.375" stroke="white" strokeWidth="0.75" stroke-Linejoin="round" strokeLinejoin="round"/>
                   </svg>

                  </div>
             </div>
           </div>
        </div>
      </div>
    </header>
  );
};

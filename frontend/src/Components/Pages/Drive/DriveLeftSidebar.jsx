import React from "react";

const driveItems = [
  "All files",
  "My files",
  "Shared with me",
  "Favourite",
  "Trash",
];

const othersItems = [
  "People",
  "Meetings",
  "Media",
];

export const LeftSidebar = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex flex-col w-[158px] h-[715px] bg-[#040B23]">
      {/* Drivebox section */}
      <div className="w-full h-[230px] border-b-[2px] border-[#FFFFFF24] flex flex-col">
        <h2 className="inter-bold text-[12px] text-[#FFFFFF] px-[20px] pt-[30px] tracking-[0.07em]">
          Drivebox
        </h2>
        <div className="flex flex-col h-[220px] gap-[10px] py-[10px]">
          {driveItems.map((item, index) => (
            <div
              key={index}
              onClick={() => onTabChange(item)}
              className={`flex items-center w-[158px] ${
                activeTab === item ? "h-[44px]" : ""
              } py-[1px] pr-[16px] pl-[28px] cursor-pointer ${
                activeTab === item ? "bg-[#6A37F5]" : ""
              }`}
            >
              <span
                className={`${
                  activeTab === item
                    ? "inter-bold text-[12px] tracking-[0.07em] leading-[100%] text-[#FFFFFF]"
                    : "inter-regular text-[11px] text-[#B6B6B6] hover:text-[#FFFFFF]"
                }`}
              >
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Others section */}
      <div className="w-full h-[500px] flex flex-col">
        <h2 className="inter-bold text-[12px] text-[#FFFFFF] px-[20px] pt-[30px] tracking-[0.07em]">
          Browse files by
        </h2>
        <div className="flex flex-col h-[full] gap-[10px] py-[10px]">
          {othersItems.map((item, index) => (
            <div
              key={index}
              onClick={() => onTabChange(item)}
              className={`flex items-center w-[158px] ${
                activeTab === item ? "h-[44px]" : ""
              } py-[1px] pr-[16px] pl-[28px] cursor-pointer ${
                activeTab === item ? "bg-[#6A37F5]" : ""
              }`}
            >
              <span
                className={`${
                  activeTab === item
                    ? "inter-bold text-[12px] tracking-[0.07em] leading-[100%] text-[#FFFFFF]"
                    : "inter-regular text-[11px] text-[#B6B6B6] hover:text-[#FFFFFF]"
                }`}
              >
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
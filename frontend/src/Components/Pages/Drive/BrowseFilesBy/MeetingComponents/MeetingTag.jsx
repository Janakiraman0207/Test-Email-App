import React from "react";
import { StandUpMeetingGroupIcon } from "../../../../../assets/icons/IconRegistry";

export const MeetingTag = () => {
  return (
    <>
      <div className="w-[185px] h-[40px] flex items-center justify-center gap-[6px] px-[6px] py-[2px] bg-black/10 rounded-[4px]">
        <StandUpMeetingGroupIcon className="w-[12px] h-[12px]" />
        <span className="text-[12px] text-black/50 leading-none inter-regular">
          Daily Stand up Meeting
        </span>
      </div>
    </>
  );
};
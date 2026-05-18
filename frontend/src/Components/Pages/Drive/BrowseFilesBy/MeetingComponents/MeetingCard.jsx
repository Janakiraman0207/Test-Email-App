import boyavatar from "../../../../../assets/images/avatar.png";
import { MeetingTag } from "./MeetingTag";

const MeetingCard = () => {
  return (
    <div className="h-[136px] flex bg-[#EAEAEA] rounded-[12px] border border-[#B6B6B6] overflow-hidden shadow-sm">
      <div className="flex-shrink-0 flex items-center justify-center w-[140px] bg-[#D9D9D9]">
        <div className="flex flex-col gap-[6px] text-center">
          <p className="text-[#000000] text-[12px] whitespace-nowrap">
            Nov 28, 2025
          </p>
          <p className="text-[#8D8D8D] text-[12px] whitespace-nowrap">
            10:30 Am
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center px-5 gap-5 overflow-hidden">
        <div className="flex-shrink-0 flex flex-col gap-[9px] w-[220px]">
          <h3 className="text-[20px] text-[#2A1E17] whitespace-nowrap">
            Daily Stand up meeting
          </h3>

          <div className="flex items-center bg-white px-[6px] py-[3px] rounded-[6px] w-fit">
            <div className="flex -space-x-[8px]">
              {[1, 2, 3, 4].map((i) => (
                <img
                  key={i}
                  src={boyavatar}
                  className="w-[20px] h-[20px] rounded-[4px] border-[2px] border-white"
                />
              ))}
            </div>

            <span className="ml-[6px] text-[12px]">+26</span>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto scrollbar-hide">
          <div className="flex gap-[20px] min-w-max">
            {Array(10)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex-shrink-0">
                  <MeetingTag />
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingCard;

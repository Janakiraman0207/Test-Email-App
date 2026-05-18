import MeetingCard from "./MeetingComponents/MeetingCard";

const Meetings = () => {
  return (
    <>
      <div className="h-full max-h-[40px] flex justify-between items-end mt-[10px] mb-[46px] ml-[24px] mr-[13px]">
        <h2 className="text-[14px] inter-medium text-[#000000] text-[18px]">
          ALL MEETINGS
        </h2>
        <input
          placeholder="Filter By Meeting Name"
          className="w-[226px] h-[40px] rounded-[6px] border border-[#B6B6B6] bg-[#EAEAEA] text-[14px] text-[#767676] inter-medium text-center outline-none placeholder:text-[#767676]"
        />
      </div>

      <div className="space-y-4 ml-[20px] mr-[13px]">
        <MeetingCard />
      </div>
    </>
  );
};
export default Meetings;
import { useState } from "react";
import { PeopleTag } from "../PeopleComponents/PeopleTag";
import boyavatar from "../../../../../assets/images/avatar.png";
import girlavatar from "../../../../../assets/images/avatar2.png";

export const PeoplePersonRow = ({ name, tags, gender }) => {
  const [isSelected, setIsSelected] = useState(false);
  return (
    <div
      onClick={() => setIsSelected((prev) => !prev)}
      className={`flex items-center justify-between px-4 py-3 border-b border-[#B6B6B6] last:border-none cursor-pointer
      ${isSelected ? "bg-gray-100" : "bg-white"}
      hover:bg-gray-100`}
    >
      <div className="flex items-center h-[45px]">
        <div className="flex items-center gap-[6px] h-[22px]">
          <img
            src={gender === "male" ? boyavatar : girlavatar}
            className="w-[45px] h-[45px] rounded-[8px] border border-[#D9D9D9]"
          />

          <span className="text-[20px] text-[#626161] leading-[22px]">
            {name}
          </span>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap max-w-[60%] justify-end">
        {tags.map((tag, index) => (
          <PeopleTag key={index} label={tag} />
        ))}
      </div>
    </div>
  );
};
import React, { useState } from "react";
import notes from "../../../assets/images/3d-notes.png";
import Organisation from "../../../assets/images/discussion.png";
import Todo from "../../../assets/images/shipment.png";
// import image1 from "../../../assets/images/image1.png";
// import image2 from "../../../assets/images/image2.png";
// import image3 from "../../../assets/images/image3.png";
import { PlusIcon, RightChevronIcon } from "../../../assets/icons/Icons2";
import { RightSidebar1 } from "./RightSidebar1";
import { useEffect } from "react";
import { getPeople } from "../../../api/api";

export const RightSidebar = () => {
const [isRightSidebar1Open, setIsRightSidebar1Open] = useState(false);
const [defaultSection, setDefaultSection] = useState("discussion");
const [favoritePeople, setFavoritePeople] = useState([]);

  useEffect(() => {
  fetchPeople();
}, []);

const fetchPeople = async () => {
  try {
    const res = await getPeople();

    const favourites =
      (res.data.all_contacts || []).filter(
        (person) => person.is_favourite
      );

    setFavoritePeople(favourites);
  } catch (err) {
    console.error("Failed to fetch favourite people", err);
  }
};

  return (
    <>
      {!isRightSidebar1Open && (
        <div 
          className="flex flex-col w-[48px] h-[700px]  gap-[0px] py-[16px] bg-[#FFFFFF] cursor-pointer"
          onClick={() => setIsRightSidebar1Open(true)}
        >
          <div className="w-[48px] h-[610px] border-b-[1px] border-[#D9D9D9]">
            <div className="flex flex-col items-center w-[48px] h-[279px]">
               <div className="flex justify-center w-[48px] h-[139px] border-b border-[#D9D9D9]">
                 <div className="flex flex-col w-[20px] h-[108px] gap-[24px]">
                    <img
                      src={Organisation}
                      alt="Organisation"
                      className="w-[20px] h-[20px] cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDefaultSection("organisation");
                        setIsRightSidebar1Open(true);
                      }}
                    />                  
                     <img
                      src={notes}
                      alt="notes"
                      className="w-[20px] h-[20px] cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDefaultSection("notes");
                        setIsRightSidebar1Open(true);
                      }}
                    />
                      <img
                        src={Todo}
                        alt="Todo"
                        className="w-[20px] h-[20px] cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDefaultSection("todos");
                          setIsRightSidebar1Open(true);
                       }}
                      />
                 </div>
                </div> 
                 <div className="flex justify-center items-end w-[48px] h-[139px]">
                   <div className="flex flex-col w-[20px] items-center gap-[14px]">
                     {favoritePeople.slice(0, 3).map((person) => (
                   <div
                     key={person.id}
                     className="w-[20px] h-[20px] rounded-full overflow-hidden bg-[#D9D9D9] flex items-center justify-center text-[10px] text-white cursor-pointer"
                     onClick={(e) => {
                       e.stopPropagation();
                       setDefaultSection("organisation");
                       setIsRightSidebar1Open(true);
                     }}
                   >
                         {person.profile_image ? (
                           <img
                             src={person.profile_image}
                             alt={person.name}
                             className="w-full h-full object-cover"
                           />
                         ) : (
                           <span>
                             {person.name?.charAt(0)?.toUpperCase()}
                           </span>
                         )}
                       </div>
                     ))}

                     <div className="flex items-center justify-center w-[20px] h-[20px] rounded-[50%] border-[0.5px] border-[#6A37F5]">
                       <PlusIcon />
                     </div>

                   </div>
                 </div>
            </div>
          </div>
          <div className="flex items-center justify-center w-[48px] h-[90px]">
            <div className="flex items-center justify-center w-[36.67px] h-[36.67px] ">
              <div className="flex items-center justify-center w-[16.67px] h-[16.67px] bg-[#EDEDED]">
                <RightChevronIcon />
              </div>
            </div>
          </div>
        </div>
      )}

        {isRightSidebar1Open && (
        <RightSidebar1
          onClose={() => setIsRightSidebar1Open(false)}
          defaultSection={defaultSection}
        />
      )}
    </>
  );
};
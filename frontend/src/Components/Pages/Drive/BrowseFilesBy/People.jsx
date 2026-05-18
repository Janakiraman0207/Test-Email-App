import React, { useEffect, useState } from "react";
import { PeopleGroupCard } from "./PeopleComponents/PeopleGroupCard";
import { browsePeople } from "../../../../api/api";

const People = () => {
  const [peopleData, setPeopleData] = useState([]);
  const [loading, setLoading] = useState(true);
  // const group1 = [
  //   {
  //     name: "Jennifer williams",
  //     gender: "female",
  //     tags: ["design Sample", "Mar 16", "Login Screens", "Mar 16", "+2"],
  //   },
  //   {
  //     name: "Williams",
  //     gender: "female",
  //     tags: ["Project Review screens", "Mar 02", "design", "Feb 06"],
  //   },
  //   {
  //     name: "Robert",
  //     gender: "male",
  //     tags: ["Screenshot 22354586", "Mar 10"],
  //     highlight: true,
  //   },
  //   {
  //     name: "Jennifer williams",
  //     gender: "female",
  //     tags: ["Backend data of the team", "Edit Screens", "Mon", "+20"],
  //   },
  //   {
  //     name: "Robert",
  //     gender: "male",
  //     tags: ["UI team excel and frontend team and backend", "Feb 21"],
  //   },
  // ];

  // const group2 = [
  //   {
  //     name: "Jennifer williams",
  //     gender: "female",
  //     tags: ["design Sample", "Mar 16", "Login Screens", "Mar 16", "+2"],
  //   },
  //   {
  //     name: "Williams",
  //     gender: "female",
  //     tags: ["Project Review screens", "Mar 02", "design", "Feb 06"],
  //   },
  // ];

  const fetchPeople = async () => {
    try {
      const res = await browsePeople();
      const data = Array.isArray(res.data) ? res.data : [res.data];
      const transformed = data.map((user) => ({
        name: `${user.first_name} ${user.last_name}`,
        gender: "male",
        tags: [
          ...(user.recent_files?.map((file) => {
            let type = "File";

            if (file.content_type?.includes("pdf")) type = "PDF";
            else if (file.content_type?.includes("image")) type = "Image";
            else if (file.content_type?.includes("video")) type = "Video";

            return `${file.original_name} (${type})`;
          }) || []),

          user.additional_files_count
            ? `+${user.additional_files_count}`
            : null,
        ].filter(Boolean),
      }));
      setPeopleData(transformed);
    } catch (err) {
      console.error("Failed to fetch people", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  return (
    <div className="p-4">
      <div className="h-full max-h-[40px] flex justify-between items-end mt-[10px] mb-[46px] ml-[24px] mr-[13px]">
        <h2 className="text-[14px] inter-medium text-[#000000] text-[18px]">
          PEOPLES
        </h2>
        <input
          placeholder="Filter By Person.."
          className="w-[226px] h-[40px] rounded-[6px] border border-[#B6B6B6] bg-[#EAEAEA] text-[14px] text-[#767676] inter-medium text-center outline-none placeholder:text-[#767676]"
        />
      </div>

      {/* <div className="space-y-4">
        <PeopleGroupCard data={group1} />
        <PeopleGroupCard data={group2} />
      </div> */}
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : (
        <PeopleGroupCard data={peopleData} />
      )}
    </div>
  );
};

export default People;
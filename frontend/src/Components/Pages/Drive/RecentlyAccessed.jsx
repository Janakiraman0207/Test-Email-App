import React from "react";
import { DriveFileIcon } from "../../../assets/icons/IconRegistry";
import norecentfiles from "../../../assets/images/norecentfiles.png";

const RecentlyAccessed = ({ files, onPreview }) => {
  const recentFiles = [...files]
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-[15px] mb-[24px] w-full">
      {recentFiles.length === 0 ? (
        <div className="w-full flex justify-center">
          <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
            <img
              src={norecentfiles}
              alt="empty"
              className="w-[164px] h-[139px]"
            />
            <span className="inter-semibold text-[14px] text-[#333] mt-2">
              No Recent Files
            </span>

            <span className="inter-regular text-[12px] text-[#8A8A8A]">
              Access your recently edited or opened files
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-row w-full gap-[16px] overflow-x-auto pb-2 scrollbar-hide">
          {recentFiles.map((file) => (
            <div
              key={file.id}
              className="flex-shrink-0 flex flex-col px-[4px] py-[4px] w-[237px] h-[184px] border border-[#E6E6E6] rounded-[14px] cursor-pointer"
              onClick={() => onPreview(file)}
            >
              <div className="w-[229px] h-[111px] rounded-[10px] bg-[#F5F5F5] flex items-center justify-center">
                <DriveFileIcon />
              </div>

              <div className="flex flex-col px-[10px] mt-2 gap-[6px]">
                <span className="inter-semibold text-[12px] truncate">
                  {file.title || file.original_name}
                </span>

                <div className="flex items-center gap-[5px] text-[10px]">
                  <div className="w-[19px] h-[19px] rounded-full bg-[#D9D9D9]" />
                  <span>{file.created_by || "You"}</span>

                  <div className="w-[3px] h-[3px] bg-[#949494] rounded-full" />

                  <span className="text-[#949494]">
                    {file.action?.time || "recently"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentlyAccessed;

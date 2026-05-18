import React, { useState, useEffect } from "react";
import driveimg from "../../../assets/images/driveimg.png";
import driveimg1 from "../../../assets/images/driveimg1.png";
import driveimg2 from "../../../assets/images/driveimg2.png";
import driveimg3 from "../../../assets/images/driveimg3.png";
import { UploadFileModal } from "./Modals/UploadFileModal";
import {
  DriveFileIcon,
  DriveUploadDropdownIcon,
} from "../../../assets/icons/IconRegistry";
import { getAllDriveFiles, api } from "../../../api/api";
import norecentfiles from "../../../assets/images/norecentfiles.png";
import RecentlyAccessed from "./RecentlyAccessed";

const DrivePage = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [files, setFiles] = useState([]);

  const fetchFiles = async () => {
    try {
      const response = await getAllDriveFiles();
      setFiles(response.data);
    } catch (error) {
      console.error("Failed to fetch drive files:", error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleCloseModal = () => {
    setShowUploadModal(false);
    // Added 500ms delay to allow backend database to save before fetching
    setTimeout(() => {
      fetchFiles();
    }, 500);
  };

  // --- Preview File in New Tab ---
  const handlePreview = async (file) => {
    try {
      const response = await api.get(file.url, { responseType: "blob" });

      const contentType =
        response.headers["content-type"] ||
        response.data.type ||
        "application/pdf";
      const fileBlob = new Blob([response.data], { type: contentType });
      const fileURL = window.URL.createObjectURL(fileBlob);

      window.open(fileURL, "_blank");

      setTimeout(() => window.URL.revokeObjectURL(fileURL), 10000);
    } catch (error) {
      console.error("Unable to preview file:", error);
      alert("Unable to open this file.");
    }
  };

  return (
    <>
      <div
        className="flex-1 flex flex-col gap-[10px] p-5 w-full max-w-full overflow-hidden"
        style={{ marginLeft: "10px" }}
      >
        {/* Recently Accessed Section - Kept Static for now */}
        <div className="flex flex-col gap-[15px] mb-[24px] w-full">
          <span className="inter-bold text-[14px] tracking-[0.07em] text-black">
            Recently Accessed
          </span>

          <div
            className="flex flex-row w-full gap-[16px] overflow-x-auto pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {/* Card 1 */}
            {/* <div className="flex-shrink-0 flex flex-col px-[4px] py-[4px] w-[237px] h-[184px] border-[1px] border-[#E6E6E6] rounded-[14px]">
              <img src={driveimg} alt="" className="w-[229px] h-[111px] rounded-[10px]" />
              <div className="flex flex-col w-full h-[40px] px-[10px] gap-[10px]">
                <span className="inter-semibold text-[12px] tracking-[0.07em]">Project Status - Email</span>
                <div className="flex flex-row items-center w-[124px] h-[19px] gap-[5px]">
                  <div className="w-[19px] h-[19px] rounded-[50%] bg-[#D9D9D9]"></div>
                  <span className="inter-medium text-[10px] tracking-[0.07em]">You</span>
                  <div className="w-[3px] h-[3px] rounded-[50%] bg-[#949494]"></div>
                  <span className="inter-medium text-[10px] text-[#949494]">3 hours ago</span>
                </div>
              </div>
            </div> */}

            {/* Card 2 */}
            {/* <div className="flex-shrink-0 flex flex-col px-[4px] py-[4px] w-[237px] h-[184px] border-[1px] border-[#E6E6E6] rounded-[14px]">
              <img src={driveimg1} alt="" className="w-[229px] h-[111px] rounded-[10px]" />
              <div className="flex flex-col w-full h-[40px] px-[10px] gap-[10px]">
                <span className="inter-semibold text-[12px] tracking-[0.07em]">Marketing Report - Email</span>
                <div className="flex flex-row items-center w-[124px] h-[19px] gap-[5px]">
                  <div className="w-[19px] h-[19px] rounded-[50%] bg-[#D9D9D9]"></div>
                  <span className="inter-medium text-[10px] tracking-[0.07em]">You</span>
                  <div className="w-[3px] h-[3px] rounded-[50%] bg-[#949494]"></div>
                  <span className="inter-medium text-[10px] text-[#949494]">3 hours ago</span>
                </div>
              </div>
            </div> */}

            {/* Card 3 */}
            {/* <div className="flex-shrink-0 flex flex-col px-[4px] py-[4px] w-[237px] h-[184px] border-[1px] border-[#E6E6E6] rounded-[14px]">
              <img src={driveimg2} alt="" className="w-[229px] h-[111px] rounded-[10px]" />
              <div className="flex flex-col w-full h-[40px] px-[10px] gap-[10px]">
                <span className="inter-semibold text-[12px] tracking-[0.07em]">Team Update - Email</span>
                <div className="flex flex-row items-center w-[124px] h-[19px] gap-[5px]">
                  <div className="w-[19px] h-[19px] rounded-[50%] bg-[#D9D9D9]"></div>
                  <span className="inter-medium text-[10px] tracking-[0.07em]">You</span>
                  <div className="w-[3px] h-[3px] rounded-[50%] bg-[#949494]"></div>
                  <span className="inter-medium text-[10px] text-[#949494]">3 hours ago</span>
                </div>
              </div>
            </div> */}

            {/* Card 4 */}
            {/* <div className="flex-shrink-0 flex flex-col px-[4px] py-[4px] w-[237px] h-[184px] border-[1px] border-[#E6E6E6] rounded-[14px]">
              <img src={driveimg3} alt="" className="w-[229px] h-[111px] rounded-[10px]" />
              <div className="flex flex-col w-full h-[40px] px-[10px] gap-[10px]">
                <span className="inter-semibold text-[12px] tracking-[0.07em]">Client Feedback - Email</span>
                <div className="flex flex-row items-center w-[124px] h-[19px] gap-[5px]">
                  <div className="w-[19px] h-[19px] rounded-[50%] bg-[#D9D9D9]"></div>
                  <span className="inter-medium text-[10px] tracking-[0.07em]">You</span>
                  <div className="w-[3px] h-[3px] rounded-[50%] bg-[#949494]"></div>
                  <span className="inter-medium text-[10px] text-[#949494]">3 hours ago</span>
                </div>
              </div>
            </div> */}
            <RecentlyAccessed files={files} onPreview={handlePreview} />
          </div>
        </div>

        {/* Table contents */}
        <div className="flex flex-col gap-[20px] w-full">
          <div className="flex flex-row w-full h-[13px] gap-[33px]">
            <span className="inter-bold text-[11px] ">Recent files</span>
          </div>

          <div className="flex flex-col w-full h-[356px] rounded-[8px] border-[1px] border-[#EAEAEA] bg-white">
            <div className="w-full h-[36px] bg-[#F9F9F9] rounded-tl-[8px] rounded-tr-[8px] flex items-center px-6">
              <div className="flex-[3] inter-bold text-[10px] text-[#040B23]">
                Title
              </div>
              <div className="flex-[2] inter-bold text-[10px] text-[#040B23]">
                Created by
              </div>
              <div className="flex-[2] inter-bold text-[10px] text-[#040B23]">
                Action
              </div>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto">
              {files.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <span className="inter-medium text-[12px] text-[#9A9A9B]">
                    No files found.
                  </span>
                </div>
              ) : (
                files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center px-6 border-b border-[#EAEAEA] h-[70px] hover:bg-[#FDFDFD] cursor-pointer"
                    onClick={() => handlePreview(file)}
                  >
                    {/* Dynamic Title Column */}
                    <div className="flex-[3] flex flex-row items-center gap-[12px]">
                      <div className="flex items-center justify-center w-[34px] h-[34px] rounded-[7px] bg-[#EEE8FF]">
                        <DriveFileIcon />
                      </div>
                      <div className="flex flex-col gap-[2px] justify-center">
                        <span className="inter-medium text-[13px] text-[#222]">
                          {/* Supports both old 'original_name' and new 'title' from API */}
                          {file.title || file.original_name}
                        </span>
                        {/* Changed this line to use the new backend formatted string instead of raw Math */}
                        <span className="inter-regular text-[11px] text-[#939393]">
                          {file.size ? file.size : "Size N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Dynamic Created By Column */}
                    <div className="flex-[2] inter-regular text-[13px] text-[#444]">
                      {file.created_by || "You"}
                    </div>

                    {/* Dynamic Action Column */}
                    <div className="flex-[2] flex flex-col justify-center">
                      <span className="inter-regular text-[12px] tracking-[0.05em] text-[#333]">
                        {file.action?.users || "Only you"}
                      </span>
                      <div className="flex flex-row items-center mt-[2px] gap-[5px]">
                        <span className="inter-regular text-[10px] tracking-[0.05em] text-[#6A37F5]">
                          Edited this
                        </span>
                        <div className="w-[3px] h-[3px] bg-[#C0C0C0] rounded-full" />
                        <span className="inter-regular text-[10px] tracking-[0.07em] text-[#C0C0C0]">
                          {/* Pulls the exact "2 hours ago" text formatted by Django backend */}
                          {file.action?.time || "recently"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <button
        className="absolute flex flex-row items-center gap-[10px] justify-center cursor-pointer"
        style={{
          width: "132px",
          height: "36px",
          top: "777px",
          left: "700px",
          borderRadius: "18px",
          background: "#040B23",
          boxShadow: "0px 4px 4px 0px #49494959",
          opacity: 1,
          zIndex: 50,
        }}
        onClick={() => setShowUploadModal(true)}
      >
        <span
          className="text-white inter-regular text-[11px] cursor-pointer"
          style={{ borderRadius: "18px", background: "transparent" }}
        >
          Upload file
        </span>
        <div className="flex items-center justify-center w-[30px] h-[30px] rounded-[50%] mr-[-30px] bg-[#FFFFFF1F]">
          <DriveUploadDropdownIcon />
        </div>
      </button>

      <UploadFileModal open={showUploadModal} onClose={handleCloseModal} />
    </>
  );
};

export default DrivePage;

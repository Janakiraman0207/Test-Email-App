import React, { useState, useEffect } from "react";
import { getSharedWithMe, getSharedByMe, api } from "../../../api/api"; 
import { DriveFileIcon, DriveUploadDropdownIcon } from "../../../assets/icons/IconRegistry";
import { UploadFileModal } from "./Modals/UploadFileModal"; 
import { ActionMenu } from "./Modals/ActionMenu"; 
import Sharedwithmepopup from "./Sharedwithmepopup"; // Kept your original popup
import { ManageAccessPopup } from "./Modals/ManageAccessPopup"; // Added the new popup
import { Rename } from "./Modals/Rename";
import LinkCreatedModal from "./Modals/LinkCreatedModal";
import { copyFileLink } from "../../../api/api";

// --- Inline SVGs for Main Action Icons ---
const SearchIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9A9A9B" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>);
const ShareIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>);
const DownloadIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>);
const KebabIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>);

// --- Inline SVGs for Dropdown Menu Icons ---
const MenuCopyIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>);
const MenuUserIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>);
const MenuStarIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>);
const MenuEditIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>);
const MenuRemoveIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);

// Date formatter
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

const SharedWithMe = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [activeToggle, setActiveToggle] = useState("With you"); // "With you" or "By you"
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  
  // Modal States
  const [sharePopupOpen, setSharePopupOpen] = useState(false); // Old popup for Share icon
  const [manageAccessOpen, setManageAccessOpen] = useState(false); // New popup for Manage Access dropdown
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState(null);

  const fetchFiles = async () => {
    try {
      let response;
      if (activeToggle === "With you") {
        response = await getSharedWithMe();
      } else {
        response = await getSharedByMe();
      }
      setFiles(response.data);
    } catch (error) {
      // Handled silently per request
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [activeToggle]);

  const handleCloseModal = () => {
    setShowUploadModal(false);
    fetchFiles(); 
  };

  const handlePreview = async (file) => {
    try {
      const response = await api.get(file.url, { responseType: 'blob' });
      const contentType = response.headers['content-type'] || response.data.type || 'application/pdf';
      const fileBlob = new Blob([response.data], { type: contentType });
      const fileURL = window.URL.createObjectURL(fileBlob);
      window.open(fileURL, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(fileURL), 10000);
    } catch (error) {
      alert("Unable to open this file.");
    }
  };

  const handleDownload = async (file) => {
    try {
      const response = await api.get(file.url, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.original_name || file.title || "download");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Failed to download file.");
    }
  };

  
  const filteredFiles = files.filter(file => {
    const lowerQuery = searchQuery.toLowerCase();
    const fileName = (file.title || file.original_name || "").toLowerCase();
    const sharedBy = (file.shared_by || "").toLowerCase();
    return fileName.includes(lowerQuery) || sharedBy.includes(lowerQuery);
  });

  // const handleCopyLink = (file) => {
  //   const fullUrl = window.location.origin + file.url;
  //   setGeneratedLink(fullUrl);
  //   setSelectedFile(file);
  //   setLinkModalOpen(true);
  // };

 const handleCopyLink = async (file) => {
   try {
     const res = await copyFileLink(file.id);

     console.log("API RESPONSE:", res.data); // debug

     const link = res.data?.share_link; // ✅ FIXED

     setGeneratedLink(link);
     setLinkModalOpen(true);

     navigator.clipboard.writeText(link);
   } catch (err) {
     console.error("Copy link failed", err);
   }
 };

  const getDropdownOptions = (file) => [
    {
      label: (<div className="flex items-center gap-[12px]"><MenuCopyIcon /><span className="cursor-pointer">Copy link</span></div>),
      onClick: () => handleCopyLink(file),
      
    },
    {
      label: (<div className="flex items-center gap-[12px]"><MenuUserIcon /><span className="cursor-pointer">Manage access</span></div>),
      onClick: () => {
        setSelectedFile(file);
        setManageAccessOpen(true); // <-- Triggers new Manage Access popup
      },
    },
    {
      label: (<div className="flex items-center gap-[12px]"><MenuStarIcon /><span className="cursor-pointer">Favorite</span></div>),
      onClick: () => {
         // Placeholder for favorite toggle logic
      },
    },
    {
      label: (<div className="flex items-center gap-[12px]"><MenuEditIcon /><span className="cursor-pointer">Rename</span></div>),
      onClick: () => {
        setFileToRename(file);
        setRenameModalOpen(true);
      },
    },
    {
      label: (<div className="flex items-center gap-[12px]"><MenuRemoveIcon /><span className="cursor-pointer">Remove file</span></div>),
      onClick: () => {
         // Placeholder for remove logic
      },
    }
  ];

  return (
    <>
      <div className="flex-1 flex flex-col gap-[20px] p-5 w-full" style={{ marginLeft: "10px" }}>
        
        {/* Header Area */}
        <div className="flex flex-row items-center justify-between w-full">
          
          <div className="flex flex-row items-center gap-[24px]">
            <span className="inter-bold text-[20px] text-[#040B23]">Files shared</span>
            <div className="flex flex-row items-center gap-[10px]">
              <button 
                onClick={() => setActiveToggle("With you")}
                className={`flex items-center justify-center px-[16px] py-[6px] rounded-[16px] border-[1px] cursor-pointer transition-colors ${
                  activeToggle === "With you" ? "border-[#6A37F5] text-[#6A37F5]" : "border-[#EAEAEA] text-[#717171] hover:bg-[#F9F9F9]"
                }`}
              >
                <span className="inter-medium text-[12px]">With you</span>
              </button>
              <button 
                onClick={() => setActiveToggle("By you")}
                className={`flex items-center justify-center px-[16px] py-[6px] rounded-[16px] border-[1px] cursor-pointer transition-colors ${
                  activeToggle === "By you" ? "border-[#6A37F5] text-[#6A37F5]" : "border-[#EAEAEA] text-[#717171] hover:bg-[#F9F9F9]"
                }`}
              >
                <span className="inter-medium text-[12px]">By you</span>
              </button>
            </div>
          </div>
          
          <div className="flex flex-row items-center w-[250px] h-[36px] rounded-[18px] border-[1px] border-[#EAEAEA] bg-white px-[14px] gap-[8px]">
            <SearchIcon />
            <input 
              type="text" 
              placeholder="Search by file name or person" 
              className="flex-1 outline-none border-none inter-regular text-[11px] bg-transparent text-[#222]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table Area */}
        <div className="flex flex-col w-full h-[550px] rounded-[8px] border-[1px] border-[#EAEAEA] bg-white mt-[10px]">
          
          <div className="w-full h-[46px] bg-[#F9F9F9] rounded-tl-[8px] rounded-tr-[8px] flex items-center px-6 border-b border-[#EAEAEA]">
            <div className="flex-[3] inter-bold text-[11px] text-[#040B23]">Title</div>
            <div className="flex-[2] inter-bold text-[11px] text-[#040B23]">Shared by</div>
            <div className="flex-[2] inter-bold text-[11px] text-[#040B23]">Shared on</div>
            <div className="flex-[2] inter-bold text-[11px] text-[#040B23]">Activity</div>
            <div className="flex-[1.5] inter-bold text-[11px] text-[#040B23]">Action</div>
          </div>

          <div className="flex-1 flex flex-col overflow-y-auto">
            {filteredFiles.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <span className="inter-medium text-[13px] text-[#9A9A9B]">No shared files found.</span>
              </div>
            ) : (
              filteredFiles.map((file) => (
                <div 
                  key={file.id} 
                  className="flex items-center px-6 border-b border-[#EAEAEA] h-[70px] hover:bg-[#FDFDFD] cursor-pointer"
                  onClick={() => handlePreview(file)} 
                >
                  
                  <div className="flex-[3] flex flex-row items-center gap-[12px]">
                    <div className="flex items-center justify-center w-[34px] h-[34px] rounded-[7px] bg-[#EEE8FF]">
                      <DriveFileIcon />
                    </div>
                    <div className="flex flex-col gap-[2px] justify-center">
                      <span className="inter-medium text-[13px] text-[#222]">
                        {file.title || file.original_name}
                      </span>
                      <span className="inter-regular text-[11px] text-[#939393]">
                        {file.size ? file.size : "Size N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="flex-[2] inter-regular text-[13px] text-[#444]">
                    {file.shared_by || "Unknown"}
                  </div>

                  <div className="flex-[2] inter-regular text-[13px] text-[#444]">
                    {file.shared_on ? formatDate(file.shared_on) : "N/A"}
                  </div>

                  <div className="flex-[2] flex flex-col justify-center">
                    <span className="inter-regular text-[12px] tracking-[0.05em] text-[#333]">
                      {file.activity || "Only you"}
                    </span>
                  </div>

                  <div className="flex-[1.5] flex flex-row items-center gap-[16px] relative">
                    <button
                      className="cursor-pointer hover:opacity-70"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(file);
                        setSharePopupOpen(true); // <-- Keeps your original behavior for the Share Icon
                      }}
                    >
                      <ShareIcon />
                    </button>
                    
                    <button 
                      className="cursor-pointer hover:opacity-70"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(file);
                      }} 
                    >
                      <DownloadIcon />
                    </button>
                    
                    <button 
                      className={`cursor-pointer hover:opacity-70 flex items-center justify-center w-[24px] h-[24px] rounded-[4px] ${activeMenuId === file.id ? 'bg-[#EEE8FF]' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation(); 
                        setActiveMenuId(activeMenuId === file.id ? null : file.id);
                      }}
                    >
                      <KebabIcon />
                    </button>

                    <ActionMenu 
                      isOpen={activeMenuId === file.id} 
                      onClose={() => setActiveMenuId(null)}
                      options={getDropdownOptions(file)} 
                    />
                  </div>

                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <button
        className="absolute flex flex-row items-center gap-[10px] justify-center cursor-pointer"
        style={{ width: "132px", height: "36px", top: "777px", left: "700px", borderRadius: "18px", background: "#040B23", boxShadow: "0px 4px 4px 0px #49494959", opacity: 1, zIndex: 50 }}
        onClick={() => setShowUploadModal(true)}
      >
        <span className="text-white inter-regular text-[11px] cursor-pointer" style={{ borderRadius: "18px", background: "transparent" }}>
          Upload file
        </span>
        <div className="flex items-center justify-center w-[30px] h-[30px] rounded-[50%] mr-[-30px] bg-[#FFFFFF1F]">
          <DriveUploadDropdownIcon />
        </div>
      </button>

      <UploadFileModal open={showUploadModal} onClose={handleCloseModal} />

      {/* --- RENDER BOTH POPUPS --- */}
      <Sharedwithmepopup
        isOpen={sharePopupOpen}
        onClose={() => setSharePopupOpen(false)}
        selectedFile={selectedFile}
      />

      <LinkCreatedModal
        isOpen={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        linkUrl={generatedLink}
        onSettingsClick={() => {
          setLinkModalOpen(false);
          setSharePopupOpen(true);
        }}
      />

      <ManageAccessPopup
        isOpen={manageAccessOpen}
        onClose={() => setManageAccessOpen(false)}
        file={selectedFile}
      />

      <Rename 
        isOpen={renameModalOpen} 
        onClose={() => setRenameModalOpen(false)} 
        file={fileToRename}
        onUpdate={(id, newName) => {
          fetchFiles();
        }}
      />
    </>
  );
};

export default SharedWithMe;
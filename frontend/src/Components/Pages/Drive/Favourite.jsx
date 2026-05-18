import React, { useState, useEffect } from "react";
import { DriveFileIcon, DriveUploadDropdownIcon } from "../../../assets/icons/IconRegistry";
import { UploadFileModal } from "./Modals/UploadFileModal"; 
import { ActionMenu } from "./Modals/ActionMenu"; 
import { getFavoriteFiles, toggleFavorite, moveToTrash, api } from "../../../api/api";
import LinkCreatedModal from "./Modals/LinkCreatedModal";
import { Rename } from "./Modals/Rename"; // Added Rename modal import
import { ManageAccessPopup } from "./Modals/ManageAccessPopup"; // <-- Added ManageAccessPopup import
import { copyFileLink } from "../../../api/api";

// --- Inline SVGs for Main Icons ---
const SearchIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9A9A9B" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>);
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

const Favourite = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [files, setFiles] = useState([]);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");

  // Modal States
  const [manageAccessOpen, setManageAccessOpen] = useState(false); // <-- Added Manage Access Modal State
  const [selectedFile, setSelectedFile] = useState(null);          // <-- Added Selected File State
  
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState(null);

  const fetchFiles = async () => {
    try {
      const response = await getFavoriteFiles();
      setFiles(response.data);
    } catch (error) {
      // Handled silently per request
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleCloseModal = () => {
    setShowUploadModal(false);
    fetchFiles(); 
  };

  // --- Preview File in New Tab ---
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

  const handleToggleFavorite = async (file) => {
    try {
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      await toggleFavorite(file.id);
    } catch (error) {
      fetchFiles(); 
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      await moveToTrash(fileId);
    } catch (error) {
      fetchFiles(); 
    }
  };

  // const handleCopyLink = (file) => {
  //   const fullUrl = window.location.origin + file.url;
  //   setGeneratedLink(fullUrl);
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

   // Upgraded search to filter by file name, modified by, and owned by
  const filteredFiles = files.filter(file => {
    const lowerQuery = searchQuery.toLowerCase();
    const fileName = (file.title || file.original_name || "").toLowerCase();
    const modifiedBy = (file.modified_by || "").toLowerCase();
    const ownedBy = (file.owned_by || "").toLowerCase();
    
    return fileName.includes(lowerQuery) || modifiedBy.includes(lowerQuery) || ownedBy.includes(lowerQuery);
  });

  const getDropdownOptions = (file) => [
    {
      label: (<div className="flex items-center gap-[12px]"><MenuCopyIcon /><span>Copy link</span></div>),
      onClick: () => handleCopyLink(file),
    },
    {
      label: (<div className="flex items-center gap-[12px]"><MenuUserIcon /><span>Manage access</span></div>),
      onClick: () => {
        setSelectedFile(file); // <-- Updated to open Manage Access Popup
        setManageAccessOpen(true);
      },
    },
    {
      label: (<div className="flex items-center gap-[12px]"><MenuStarIcon /><span>Remove from favourites</span></div>),
      onClick: () => handleToggleFavorite(file),
    },
    {
      label: (<div className="flex items-center gap-[12px]"><MenuEditIcon /><span>Rename</span></div>),
      onClick: () => {
        setFileToRename(file);
        setRenameModalOpen(true);
      },
    },
    {
      label: (<div className="flex items-center gap-[12px]"><MenuRemoveIcon /><span>Remove file</span></div>),
      onClick: () => handleDeleteFile(file.id),
    }
  ];

  return (
    <>
      <div className="flex-1 flex flex-col gap-[20px] p-5 w-full" style={{ marginLeft: "10px" }}>
        
        {/* Header Area */}
        <div className="flex flex-row items-center justify-between w-full">
          <span className="inter-bold text-[20px] text-[#040B23]">Your favourites</span>
          
          {/* Search Bar */}
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
          
          {/* Table Header */}
          <div className="w-full h-[46px] bg-[#F9F9F9] rounded-tl-[8px] rounded-tr-[8px] flex items-center px-6 border-b border-[#EAEAEA]">
            <div className="flex-[3] inter-bold text-[11px] text-[#040B23]">Title</div>
            <div className="flex-[2] inter-bold text-[11px] text-[#040B23]">Favourited on</div>
            <div className="flex-[2] inter-bold text-[11px] text-[#040B23]">Modified by</div>
            <div className="flex-[2] inter-bold text-[11px] text-[#040B23]">Owned by</div>
            <div className="flex-[2] inter-bold text-[11px] text-[#040B23]">Activity</div>
            <div className="flex-[1] inter-bold text-[11px] text-[#040B23] pl-2">Action</div>
          </div>

          {/* Table Body */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            {filteredFiles.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <span className="inter-medium text-[13px] text-[#9A9A9B]">No favourite files found.</span>
              </div>
            ) : (
              filteredFiles.map((file) => (
                <div 
                  key={file.id} 
                  className="flex items-center px-6 border-b border-[#EAEAEA] h-[70px] hover:bg-[#FDFDFD] cursor-pointer"
                  onClick={() => handlePreview(file)} 
                >
                  
                  {/* Title (Dynamic) */}
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

                  {/* Favourited On (Dynamic) */}
                  <div className="flex-[2] inter-regular text-[13px] text-[#444]">
                    {file.favorited_on ? formatDate(file.favorited_on) : "N/A"}
                  </div>

                  {/* Modified By (Dynamic) */}
                  <div className="flex-[2] inter-regular text-[13px] text-[#444]">
                    {file.modified_by || "You"}
                  </div>

                  {/* Owned By (Dynamic) */}
                  <div className="flex-[2] inter-regular text-[13px] text-[#444]">
                    {file.owned_by || "You"}
                  </div>

                  {/* Activity (Dynamic) */}
                  <div className="flex-[2] flex flex-col justify-center">
                    <span className="inter-regular text-[12px] tracking-[0.05em] text-[#333]">
                      {file.activity || "Only you"}
                    </span>
                  </div>

                  {/* Action Columns */}
                  <div className="flex-[1] flex flex-row items-center pl-2 relative">
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
        <span className="text-white inter-regular text-[11px] cursor-pointer" style={{ borderRadius: "18px", background: "transparent" }}>Upload file</span>
        <div className="flex items-center justify-center w-[30px] h-[30px] rounded-[50%] mr-[-30px] bg-[#FFFFFF1F]">
          <DriveUploadDropdownIcon />
        </div>
      </button>

      <UploadFileModal open={showUploadModal} onClose={handleCloseModal} />

      <LinkCreatedModal
        isOpen={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        linkUrl={generatedLink}
      />

      {/* --- ADDED MANAGE ACCESS POPUP --- */}
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
          fetchFiles(); // Refresh list to show the new name
        }}
      />
    </>
  );
};

export default Favourite;
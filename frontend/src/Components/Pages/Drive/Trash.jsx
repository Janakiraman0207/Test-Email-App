import React, { useState, useEffect } from "react";
// Added deleteTrashFiles and emptyTrash to imports
import { getTrashFiles, restoreFile, deleteTrashFiles, emptyTrash } from "../../../api/api"; 
import { DriveFileIcon, DriveUploadDropdownIcon } from "../../../assets/icons/IconRegistry";
import { UploadFileModal } from "./Modals/UploadFileModal";
import { ActionMenu } from "./Modals/ActionMenu"; 

// --- Inline SVGs ---
const SearchIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9A9A9B" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>);
const TrashBinIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);
const InfoIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A996FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>);
const KebabIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>);
const RefreshIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>);
const DeleteIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>);

// Date formatter
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

const Trash = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const fetchFiles = async () => {
    try {
      const response = await getTrashFiles();
      setFiles(response.data);
    } catch (error) {
      // Error handled silently
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleSelectOne = (id) => {
    setSelectedFileIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // --- Actions ---
  const handleRestore = async (id) => {
    try {
      setFiles(prev => prev.filter(f => f.id !== id));
      await restoreFile(id);
      setSelectedFileIds(prev => prev.filter(itemId => itemId !== id));
    } catch (error) {
      fetchFiles();
    }
  };

  // Permanently delete a single file
  const handleDelete = async (id) => {
    try {
      setFiles(prev => prev.filter(f => f.id !== id));
      await deleteTrashFiles([id]);
      setSelectedFileIds(prev => prev.filter(itemId => itemId !== id));
    } catch (error) {
      fetchFiles();
    }
  };

  // Restore multiple files
  const handleBulkRestore = async () => {
    for (const id of selectedFileIds) {
      try {
        await restoreFile(id);
        setFiles(prev => prev.filter(f => f.id !== id));
      } catch (error) {
        // Error handled silently
      }
    }
    setSelectedFileIds([]);
  };

  // Permanently delete multiple files
  const handleBulkDelete = async () => {
    try {
      // Optimistic Update
      setFiles(prev => prev.filter(f => !selectedFileIds.includes(f.id)));
      
      // Call the new Bulk Delete API
      await deleteTrashFiles(selectedFileIds);
      
      setSelectedFileIds([]);
    } catch (error) {
      fetchFiles();
    }
  };

  // Empty the entire trash
  const handleEmptyTrash = async () => {
    if (files.length === 0) return;
    try {
      setFiles([]); // Clear UI immediately
      await emptyTrash(); // Call API
    } catch (error) {
      fetchFiles();
    }
  };

  // Expanded search to check file name, deleted by, and created by
  const filteredFiles = files.filter(file => {
    const lowerQuery = searchQuery.toLowerCase();
    const fileName = (file.title || file.original_name || "").toLowerCase();
    const deletedBy = (file.deleted_by || "You").toLowerCase();
    const createdBy = (file.created_by || "You").toLowerCase();
    
    return fileName.includes(lowerQuery) || deletedBy.includes(lowerQuery) || createdBy.includes(lowerQuery);
  });

  const getDropdownOptions = (file) => [
    {
      label: (<div className="flex items-center gap-[12px]"><RefreshIcon /><span>Restore</span></div>),
      onClick: () => handleRestore(file.id),
    },
    {
      label: (<div className="flex items-center gap-[12px]"><DeleteIcon /><span>Delete</span></div>),
      onClick: () => handleDelete(file.id),
    }
  ];

  return (
    <>
      <div className="flex-1 flex flex-col gap-[20px] p-5 w-full" style={{ marginLeft: "10px" }}>
        
        {/* Header Area */}
        <div className="flex flex-row justify-between items-start w-full">
          {/* Left Side: Title & Info */}
          <div className="flex flex-col gap-[6px]">
            <span className="inter-bold text-[22px] text-[#040B23]">Trash file</span>
            <div className="flex items-center gap-[6px]">
              <InfoIcon />
              <span className="inter-regular text-[11px] text-[#A996FF]">Trash file will be automatically deleted in 30 days</span>
            </div>
          </div>
          
          {/* Right Side: Action Buttons & Search */}
          <div className="flex flex-row items-center gap-[24px] mt-[4px]">
            
            {/* Conditional Buttons based on Selection */}
            {selectedFileIds.length > 0 ? (
              <>
                <button 
                  onClick={handleBulkRestore}
                  className="flex items-center justify-center px-[16px] py-[8px] gap-[8px] bg-[#EEE8FF] rounded-[8px] text-[#6A37F5] hover:opacity-80 transition-opacity"
                >
                  <RefreshIcon />
                  <span className="inter-medium text-[12px]">Restore Selected</span>
                </button>
                <button 
                  onClick={handleBulkDelete}
                  className="flex items-center justify-center px-[16px] py-[8px] gap-[8px] bg-[#FFEAEA] rounded-[8px] text-[#FF4D4F] hover:opacity-80 transition-opacity"
                >
                  <DeleteIcon />
                  <span className="inter-medium text-[12px]">Delete Selected</span>
                </button>
              </>
            ) : (
              <button 
                onClick={handleEmptyTrash} 
                className="flex items-center gap-[8px] text-[#FF4D4F] hover:opacity-70 cursor-pointer px-[16px] py-[8px] bg-[#FFEAEA] rounded-[8px]"
              >
                <TrashBinIcon />
                <span className="inter-medium text-[12px]">Empty trash</span>
              </button>
            )}

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
        </div>

        {/* Table Area */}
        <div className="flex flex-col w-full h-[550px] rounded-[8px] border-[1px] border-[#EAEAEA] bg-white mt-[10px]">
          
          {/* Table Header */}
          <div className="w-full h-[46px] bg-[#F9F9F9] rounded-tl-[8px] rounded-tr-[8px] flex items-center px-6 border-b border-[#EAEAEA]">
            {/* Checkbox Column (Empty for alignment) */}
            <div className="w-[40px] flex items-center justify-center"></div>
            
            <div className="flex-[3] inter-bold text-[11px] text-[#040B23]">Title</div>
            <div className="flex-[2] inter-bold text-[11px] text-[#040B23]">Deleted on</div>
            <div className="flex-[2] inter-bold text-[11px] text-[#040B23]">Deleted by</div>
            <div className="flex-[2] inter-bold text-[11px] text-[#040B23]">Created by</div>
            <div className="w-[50px] inter-bold text-[11px] text-[#040B23] text-center">Action</div>
          </div>

          {/* Table Body */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            {filteredFiles.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <span className="inter-medium text-[13px] text-[#9A9A9B]">Trash is empty.</span>
              </div>
            ) : (
              filteredFiles.map((file) => (
                <div key={file.id} className={`flex items-center px-6 border-b border-[#EAEAEA] h-[70px] hover:bg-[#FDFDFD] ${selectedFileIds.includes(file.id) ? 'bg-[#F4F0FF]' : ''}`}>
                  
                  {/* Checkbox */}
                  <div className="w-[40px] flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      className="w-[14px] h-[14px] rounded-[4px] border-[#C0C0C0] cursor-pointer accent-[#6A37F5]"
                      checked={selectedFileIds.includes(file.id)}
                      onChange={() => handleSelectOne(file.id)}
                    />
                  </div>

                  {/* Title */}
                  <div className="flex-[3] flex flex-row items-center gap-[12px]">
                    <div className="flex items-center justify-center w-[34px] h-[34px] rounded-[7px] bg-[#EEE8FF]">
                      <DriveFileIcon />
                    </div>
                    <div className="flex flex-col gap-[2px] justify-center">
                      <span className="inter-medium text-[13px] text-[#222]">
                        {file.title || file.original_name}
                      </span>
                      {/* Using the string provided directly from backend to fix NaN MB */}
                      <span className="inter-regular text-[11px] text-[#939393]">
                        {file.size ? file.size : "Size N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Deleted On (Dynamic) */}
                  <div className="flex-[2] inter-regular text-[13px] text-[#444]">
                    {file.deleted_on ? formatDate(file.deleted_on) : "N/A"}
                  </div>

                  {/* Deleted By (Dynamic) */}
                  <div className="flex-[2] inter-regular text-[13px] text-[#444] truncate pr-4">
                    {file.deleted_by || "You"}
                  </div>

                  {/* Created By (Dynamic) */}
                  <div className="flex-[2] inter-regular text-[13px] text-[#444] truncate pr-4">
                    {file.created_by || "You"}
                  </div>

                  {/* Action Column (Kebab Menu) */}
                  <div className="w-[50px] flex justify-center relative">
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

      <UploadFileModal open={showUploadModal} onClose={() => setShowUploadModal(false)} />
    </>
  );
};

export default Trash;
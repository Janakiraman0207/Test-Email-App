import React, { useRef, useState } from "react";
import { UploadFileIcon, UploadFileRemoveIcon } from "../../../../assets/icons/Icons1";
import { uploadDriveFile } from "../../../../api/api"; // Adjust this path if api.js is located elsewhere

// --- Dynamic Icon SVGs (Sized exactly to your original 19.33x24 specs) ---
const PdfIcon = () => (
  <svg width="20" height="28" viewBox="0 0 24 24" fill="none">
    
       <path
      d="M6 2H14L20 8V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V4C4 2.9 4.9 2 6 2Z"
      fill="#EF5350"
    />

       <path d="M14 2V8H20" fill="#FF8A80" />

       <path
      d="M7 15C10 8 10 8 12 5C13 9 14 12 17 15M6 13C10 15 14 15 18 13"
      stroke="white"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

  </svg>
);
const WordIcon = () => (
  <svg width="20" height="24" viewBox="0 0 16 16" fill="none">
    <path
      d="M9.268 1.16406V2.43656C10.968 2.44606 12.828 2.41906 14.5285 2.44606C14.9845 2.87656 15.0005 12.4551 14.974 13.2136C14.9345 13.4681 14.821 13.5171 14.5655 13.5516C14.4225 13.5711 14.1835 13.5686 14.043 13.5751H9.2685V14.8436L1 13.5691V2.43906L9.268 1.16406Z"
      fill="#283C82"
    />
    <path
      d="M4.28728 5.72456C4.58728 5.70706 4.89178 5.69456 5.19378 5.67856C5.40528 6.75206 5.62178 7.82406 5.85078 8.89306C6.03028 7.78906 6.22928 6.68856 6.42178 5.58656C6.73954 5.57521 7.05708 5.55854 7.37428 5.53656C7.01478 7.07756 6.69978 8.63156 6.30728 10.1636C6.04178 10.3021 5.64428 10.1571 5.32928 10.1796C5.11778 9.12656 4.87128 8.07956 4.68178 7.02256C4.49578 8.05306 4.25378 9.06956 4.04078 10.0906C3.73545 10.0746 3.42895 10.0561 3.12128 10.0351C2.85728 8.63506 2.54728 7.24556 2.30078 5.84256C2.57345 5.8299 2.84595 5.81873 3.11828 5.80906C3.28228 6.82206 3.46828 7.83056 3.61128 8.84506C3.83528 7.80506 4.06478 6.76456 4.28728 5.72456Z"
      fill="white"
    />
  </svg>
);
const ExcelIcon = () => (
  <svg width="20" height="24" viewBox="0 0 16 16" fill="none">
    <path d="M9.79036 7.67813L4.25586 6.70312V13.9076H14.4024V11.2531L9.79036 7.67813Z" fill="#185C37"/>
    <path d="M9.79036 1.5H4.25586V4.75L9.79036 8L14.9999 8V4.75L9.79036 1.5Z" fill="#21A366"/>
    <path d="M4.25586 4.75H9.79036V8H4.25586V4.75Z" fill="#107C41"/>
    <path d="M1.597 4.42188H7.566C7.72412 4.42175 7.87581 4.48439 7.98776 4.59606C8.0997 4.70772 8.16274 4.85926 8.163 5.01738V10.9764C8.16274 11.1345 8.0997 11.286 7.98776 11.3977C7.87581 11.5094 7.72412 11.572 7.566 11.5719H1.597V4.42188Z" fill="#107C41"/>
    <path d="M2.84961 9.9355L4.10511 7.9935L2.95511 6.0625H3.87861L4.50611 7.299L5.43461 6.0645H6.28461L5.10511 7.9845L6.31461 9.937H5.41011L4.68511 8.5815L3.75711 9.9355H2.84961Z" fill="white"/>
  </svg>
);
const ImageIcon = () => (<svg width="20" height="24" viewBox="0 0 24 24" fill="none" stroke="#8E24AA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>);
const VideoIcon = () => (<svg width="20" height="24" viewBox="0 0 24 24" fill="none" stroke="#F4511E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>);
const GenericIcon = () => (<svg width="20" height="24" viewBox="0 0 24 24" fill="none" stroke="#757575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>);

// --- Icon Mapper Logic ---
const getFileIcon = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  switch (extension) {
    case 'pdf': return <PdfIcon />;
    case 'doc': case 'docx': return <WordIcon />;
    case 'xls': case 'xlsx': case 'csv': return <ExcelIcon />;
    case 'jpg': case 'jpeg': case 'png': case 'gif': case 'svg': return <ImageIcon />;
    case 'mp4': case 'mov': case 'avi': case 'mkv': return <VideoIcon />;
    default: return <GenericIcon />;
  }
};

const modalStyle = {
  position: "absolute",
  width: 318,
  height: 360,
  top: 236,
  left: 540,
  background: "#fff",
  borderRadius: 16,
  boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
  opacity: 1,
  zIndex: 1000,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: 24
};

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.3)",
  zIndex: 999
};

export const UploadFileModal = ({ open, onClose }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef();

  if (!open) return null;

  const handleFileChange = (e) => {
    setError("");
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setError("");
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();

      selectedFiles.forEach((file) => {
        formData.append("files", file); 
      });
      
      await uploadDriveFile(formData);

      setSelectedFiles([]);
      onClose();
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload files. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div className="flex flex-col w-[278px] h-[330px] gap-[20px]">
          <div className="flex flex-col w-full h-[282px] gap-[10px]">
            <div className="w-[278px] h-[39px] p-[10px]">
              <span className="inter-bold text-[16px] ">Upload files</span>
            </div>
            <div className="flex flex-col w-[full] h-[233px] gap-[11px]">
              <div
                className="w-full h-[130px] rounded-[12px] border-[1px] border-[#EAEAEA] px-[70px] py-[33px]"
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                style={{ cursor: "pointer" }}
              >
                <div className="flex flex-col items-center justify-center w-full h-[64px] gap-[5px]">
                  <UploadFileIcon />
                  <span className="inter-medium text-[12px] whitespace-nowrap">Drop file here or browse</span>
                  <span className="inter-medium text-[12px] text-[#B5B5B5]">Upload upto 1GB </span>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                </div>
              </div>
              
              <div className="flex flex-col w-full h-[92px] gap-[8px] overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex flex-row items-center justify-between w-[278px] h-[42px] rounded-[10px] px-[10px] py-[10px] gap-[10px]">
                    <div className="flex flex-row flex-1 overflow-hidden items-center gap-[10px]">
                      {/* Dynamic Icon */}
                      <div className="flex-shrink-0 flex items-center justify-center w-[19.33px] h-[24px]">
                        {getFileIcon(file.name)}
                      </div>
                      <div className="flex flex-col flex-1 overflow-hidden gap-[0px]">
                        {/* Truncated Name with Title attribute */}
                        <span 
                          className="inter-medium text-[11px] text-[#222] truncate cursor-default" 
                          title={file.name}
                        >
                          {file.name}
                        </span>
                        <span className="inter-regular text-[9px] text-[#939393]">
                          {(file.size/1024/1024).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                    <UploadFileRemoveIcon className="flex-shrink-0" style={{ cursor: "pointer" }} onClick={() => handleRemoveFile(idx)} />
                  </div>
                ))}
              </div>
              
              {error && <span className="text-red-500 text-xs text-center mt-1">{error}</span>}
            </div>
          </div>
          <button
            className="flex items-center justify-center w-[278px] h-[28px] rounded-[10px] bg-[#141414]"
            onClick={handleUpload}
            disabled={uploading}
          >
            <span className="inter-medium text-[10px] text-[white]">{uploading ? "Uploading..." : "Upload now"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
import React, { useState, useEffect } from "react";
import { renameFile } from "../../../../api/api";

// --- Inline SVG for Close Icon ---
const CloseIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

// Matching the exact background overlay from UploadFileModal.jsx
const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.3)", // Exactly matches UploadFileModal
  zIndex: 999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export const Rename = ({ isOpen, onClose, file, onUpdate }) => {
  const [fileName, setFileName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [loading, setLoading] = useState(false);

  // Populate the input and save original name when modal opens
  useEffect(() => {
    if (file) {
      const name = file.title || file.original_name || "";
      setFileName(name);
      setOriginalName(name);
    }
  }, [file, isOpen]);

  if (!isOpen) return null;

  // Check if the input is identical to the original name or is completely empty
  const isUnchanged = fileName === originalName || fileName.trim() === "";

  const handleUpdate = async () => {
    // If name hasn't changed, do nothing (acts as a disabled button without visual dimming)
    if (isUnchanged) return;
    try {
      setLoading(true);
      await renameFile(file.id, fileName);
      if (onUpdate) {
        onUpdate(file.id, fileName);
      }
      onClose();
    } catch (err) {
      console.error("Rename failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      {/* Modal Container */}
      <div
        className="bg-white flex flex-col relative rounded-[8px] shadow-lg border-[1px] border-[#EAEAEA]"
        style={{ width: "636px", height: "300px" }}
        onClick={(e) => e.stopPropagation()} // Prevent clicking inside the modal from closing it
      >
        {/* Close Button (Top Right) */}
        <button
          onClick={onClose}
          className="absolute top-[20px] right-[20px] text-[#333] hover:opacity-70 cursor-pointer"
        >
          <CloseIcon />
        </button>

        {/* Modal Content */}
        <div className="flex flex-col px-[30px] pt-[25px] w-full h-full">
          {/* Main Title */}
          <span className="text-[18px] inter-semibold text-black mb-[25px]">
            Rename
          </span>

          {/* Input Label */}
          <span className="text-[14px] inter-medium text-black mb-[10px]">
            Name
          </span>

          {/* Input Field */}
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="Attachments"
            className="w-full h-[40px] border-[1px] border-[#CCCCCC] px-[12px] text-[14px] text-[#333] outline-none focus:border-[#007BFF] transition-colors rounded-[4px]"
          />

          {/* Bottom Action Buttons */}
          <div className="flex-1 flex items-end justify-end pb-[25px] gap-[12px]">
            <button
              onClick={handleUpdate}
              disabled={isUnchanged || loading}
              style={{
                backgroundColor: "#007BFF",
                color: "white",
                opacity: 1, // Forces it to remain fully visible
                cursor: isUnchanged ? "not-allowed" : "pointer",
              }}
              className="px-[20px] h-[36px] rounded-[4px] text-[14px] inter-medium transition-colors hover:bg-[#0069d9]"
            >
              {loading ? "Updating" : "Update"}
            </button>
            <button
              onClick={onClose}
              className="px-[20px] h-[36px] rounded-[4px] bg-white border-[1px] border-[#CCCCCC] text-black text-[14px] inter-medium hover:bg-[#f5f5f5] transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

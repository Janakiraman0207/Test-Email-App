import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export const AttachmentSection = ({
  attachments = [],
  formatFileSize,
  onRemove,
  handleRemoveAttachment,
  activeMenu,
  setActiveMenu,
}) => {
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length === 3 ? "." : prev + "."));
    }, 400);

    return () => clearInterval(interval);
  }, []);
  if (!attachments || attachments.length === 0) return null;

  const handlePreview = (attachment) => {
    let url = null;
    if (attachment.url) {
      url = attachment.url;
    } else if (attachment.file) {
      if (attachment.file.type.startsWith("image/")) {
        const url = URL.createObjectURL(attachment.file);

        const newWindow = window.open("");
        newWindow.document.write(`
    <html>
      <head><title>Image Preview</title></head>
      <body style="margin:0; background:black; display:flex; justify-content:center; align-items:center; height:100vh;">
        <img src="${url}" style="max-width:100%; max-height:100%;" />
      </body>
    </html>
   `);

        return;
      }
      if (attachment.file.type === "application/pdf") {
        const url = URL.createObjectURL(attachment.file);

        const newWindow = window.open("");
        newWindow.document.write(`
    <iframe src="${url}" width="100%" height="100%" style="border:none;"></iframe>
   `);

        return;
      }

      if (attachment.file.type === "application/pdf") {
        const url = URL.createObjectURL(attachment.file);
        window.open(url, "_blank");
        return;
      }

      alert("Preview not available before upload for this file type.");
      return;
    }

    if (!url) return;

    const ext = attachment.name.split(".").pop().toLowerCase();
    if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) {
      window.open(url, "_blank");
    } else if (ext === "pdf") {
      window.open(url, "_blank");
    } else if (["txt", "json"].includes(ext)) {
      window.open(url, "_blank");
    } else if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext)) {
      if (attachment.url) {
        const viewerUrl = `https://docs.google.com/gview?url=${attachment.url}&embedded=true`;
        window.open(viewerUrl, "_blank");
      } else {
        alert("Preview not available for this file. Please upload first.");
      }
    } else {
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.name;
      link.click();
    }
  };
  return (
    <>
      <div className="px-3 pb-2 pt-2 flex flex-nowrap gap-[12px] overflow-x-auto scrollbar-hide bg-white z-10">
        {attachments.map((attachment) => {
          const ext = attachment.name.split(".").pop().toLowerCase();
          const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(ext);

          return (
            <div
              key={attachment.id}
              className="relative flex items-center gap-2 bg-[#F0F1F8] rounded-[6px] px-2 py-2 w-[169px] min-w-[169px] h-[63px] border border-[#040B23]/3"
            >
              <div className="w-[43px] h-[43px] bg-white rounded overflow-hidden flex items-center justify-center">
                {isImage ? (
                  <img
                    // src={URL.createObjectURL(attachment.file)}
                    src={attachment.previewUrl}
                    alt={attachment.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[14px]">📄</span>
                )}
              </div>

              <div className="flex flex-col overflow-hidden cursor-pointer">
                <span className="text-[11px] font-medium truncate">
                  {attachment.name}
                </span>
                <span
                  className={`text-[10px] ${
                    attachment.uploading ? "text-[#6A37F5]" : "text-[#A0A0A0]"
                  }`}
                >
                  {attachment.uploading
                    ? `Uploading${dots}`
                    : formatFileSize(attachment.size)}
                </span>
              </div>

              <button
                className={`ml-auto text-gray-400 cursor-pointer ${
                  activeMenu === attachment.id ? "attachment-active-btn" : ""
                }`}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();

                  const left = Math.min(
                    rect.right - 130,
                    window.innerWidth - 140,
                  );

                  setMenuPosition({
                    top: rect.bottom + 5,
                    left,
                  });

                  setActiveMenu(attachment.id);
                }}
              >
                ⋮
              </button>

              {activeMenu === attachment.id &&
                createPortal(
                  <div
                    className="attachment-menu bg-white shadow-lg rounded-[10px] text-[12px] w-[130px] border border-[#EAEAEA]"
                    style={{
                      position: "fixed",
                      top: menuPosition.top,
                      left: menuPosition.left,
                      zIndex: 9999,
                    }}
                  >
                    <button
                      className="block w-full text-left px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handlePreview(attachment)}
                    >
                      Preview
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveAttachment(attachment.id);
                      }}
                      className="block w-full text-left px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      Remove
                    </button>

                    <button className="block w-full text-left px-3 py-2 hover:bg-gray-100 cursor-pointer">
                      Upload to Drive
                    </button>
                  </div>,
                  document.body,
                )}
            </div>
          );
        })}
      </div>
    </>
  );
};

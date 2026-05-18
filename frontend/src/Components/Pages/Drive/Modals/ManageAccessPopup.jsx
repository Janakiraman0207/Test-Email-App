import React, { useState, useEffect, useRef } from "react";

// --- Shared Inline SVGs ---
const TextEditIcon = () => (<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20.385 0.537494L20.975 1.12749C21.788 1.94149 21.665 3.38449 20.698 4.35049L8.531 16.5175L4.589 17.9595C4.094 18.1415 3.612 17.9055 3.514 17.4345C3.48099 17.2636 3.49658 17.0869 3.559 16.9245L5.029 12.9485L17.162 0.814494C18.129 -0.151506 19.572 -0.276506 20.385 0.537494ZM8 1.74749C8.13132 1.74749 8.26136 1.77336 8.38268 1.82361C8.50401 1.87387 8.61425 1.94753 8.70711 2.04039C8.79996 2.13325 8.87362 2.24348 8.92388 2.36481C8.97413 2.48614 9 2.61617 9 2.74749C9 2.87882 8.97413 3.00885 8.92388 3.13018C8.87362 3.2515 8.79996 3.36174 8.70711 3.4546C8.61425 3.54746 8.50401 3.62112 8.38268 3.67137C8.26136 3.72163 8.13132 3.74749 8 3.74749H4C3.46957 3.74749 2.96086 3.95821 2.58579 4.33328C2.21071 4.70835 2 5.21706 2 5.74749V17.7475C2 18.2779 2.21071 18.7866 2.58579 19.1617C2.96086 19.5368 3.46957 19.7475 4 19.7475H16C16.5304 19.7475 17.0391 19.5368 17.4142 19.1617C17.7893 18.7866 18 18.2779 18 17.7475V13.7475C18 13.4823 18.1054 13.2279 18.2929 13.0404C18.4804 12.8529 18.7348 12.7475 19 12.7475C19.2652 12.7475 19.5196 12.8529 19.7071 13.0404C19.8946 13.2279 20 13.4823 20 13.7475V17.7475C20 18.8084 19.5786 19.8258 18.8284 20.5759C18.0783 21.3261 17.0609 21.7475 16 21.7475H4C2.93913 21.7475 1.92172 21.3261 1.17157 20.5759C0.421427 19.8258 0 18.8084 0 17.7475V5.74749C0 4.68663 0.421427 3.66921 1.17157 2.91907C1.92172 2.16892 2.93913 1.74749 4 1.74749H8Z" fill="#767676"/>
</svg>)
const CloseIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const FolderIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="#FFC107"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"></path></svg>);
const ShareLinkIcon = () => (<svg width="16" height="15" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6.5 1.00031C6.63261 1.00031 6.75979 1.05299 6.85355 1.14676C6.94732 1.24053 7 1.36771 7 1.50031C7 1.63292 6.94732 1.7601 6.85355 1.85387C6.75979 1.94764 6.63261 2.00031 6.5 2.00031H3C2.46957 2.00031 1.96086 2.21103 1.58579 2.5861C1.21071 2.96117 1 3.46988 1 4.00031V12.0003C1 12.5307 1.21071 13.0395 1.58579 13.4145C1.96086 13.7896 2.46957 14.0003 3 14.0003H11C11.5304 14.0003 12.0391 13.7896 12.4142 13.4145C12.7893 13.0395 13 12.5307 13 12.0003V10.5003C13 10.3677 13.0527 10.2405 13.1464 10.1468C13.2402 10.053 13.3674 10.0003 13.5 10.0003C13.6326 10.0003 13.7598 10.053 13.8536 10.1468C13.9473 10.2405 14 10.3677 14 10.5003V12.0003C14 12.796 13.6839 13.559 13.1213 14.1216C12.5587 14.6842 11.7956 15.0003 11 15.0003H3C2.20435 15.0003 1.44129 14.6842 0.87868 14.1216C0.316071 13.559 0 12.796 0 12.0003V4.00031C0 3.20466 0.316071 2.4416 0.87868 1.87899C1.44129 1.31638 2.20435 1.00031 3 1.00031H6.5ZM10.297 0.0433136C10.3853 0.00395741 10.4831 -0.0089596 10.5786 0.00612627C10.6741 0.0212121 10.7631 0.063654 10.835 0.128314L15.835 4.62831C15.8872 4.6752 15.929 4.73256 15.9576 4.79665C15.9861 4.86074 16.0009 4.93014 16.0009 5.00031C16.0009 5.07049 15.9861 5.13988 15.9576 5.20397C15.929 5.26807 15.8872 5.32542 15.835 5.37231L10.835 9.87231C10.7632 9.93716 10.674 9.97976 10.5784 9.99494C10.4829 10.0101 10.3849 9.99724 10.2965 9.95786C10.2081 9.91847 10.133 9.85428 10.0804 9.77306C10.0278 9.69184 9.99984 9.5971 10 9.50031V7.34031C8.6 7.46831 7.335 8.12031 6.3 8.94831C5.285 9.76131 4.525 10.7163 4.105 11.4323L3.947 11.7233C3.89659 11.8239 3.81373 11.9045 3.71182 11.9522C3.60991 11.9999 3.4949 12.0118 3.38539 11.986C3.27588 11.9602 3.17827 11.8982 3.10834 11.8101C3.0384 11.722 3.00023 11.6128 3 11.5003C3 9.45131 3.382 7.21631 4.518 5.47631C5.61 3.80831 7.368 2.64331 10 2.51331V0.500314L10.005 0.427314C10.0173 0.343873 10.0506 0.264909 10.1016 0.197769C10.1527 0.130629 10.2199 0.0774954 10.297 0.0433136ZM11 3.00031C11 3.13292 10.9473 3.2601 10.8536 3.35387C10.7598 3.44763 10.6326 3.50031 10.5 3.50031C7.912 3.50031 6.323 4.54531 5.356 6.02331C4.671 7.07231 4.283 8.36331 4.11 9.70731C4.543 9.18731 5.07 8.65331 5.675 8.16731C6.943 7.15331 8.6 6.31631 10.5 6.31631C10.6326 6.31631 10.7598 6.36899 10.8536 6.46276C10.9473 6.55653 11 6.68371 11 6.81631V8.37631L14.75 5.00031L11 1.62331V3.00031Z" fill="#2294DF"/>
</svg>);
const AddPeopleIcon = () => (<svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M12 14c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 3c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z" fill="#A881E6"/><path d="M22 14c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-.52 0-1.06.07-1.58.19C21.84 17.38 23 18.99 23 21v1h7v-1c0-2.66-5.33-4-8-4z" fill="#A881E6"/><circle cx="24" cy="22" r="6" fill="#00C853"/><path d="M23 19v2h-2v2h2v2h2v-2h2v-2h-2v-2h-2z" fill="#fff"/></svg>);
const UserGroupIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>);
const EditIcon = () => (<svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15.685 7.11643L16.4575 6.34393C17.072 5.72941 17.4173 4.89593 17.4173 4.02685C17.4173 3.15778 17.072 2.3243 16.4575 1.70977C15.843 1.09524 15.0095 0.75 14.1404 0.75C13.2713 0.75 12.4379 1.09524 11.8233 1.70977L11.0508 2.48227L3.94916 9.58227C3.46833 10.0639 3.2275 10.3048 3.02083 10.5698C2.77699 10.8827 2.56772 11.221 2.39666 11.5789C2.2525 11.8823 2.145 12.2056 1.93 12.8506L1.01833 15.5848M15.685 7.11643C15.685 7.11643 14.0442 7.01977 12.5958 5.57143C11.1475 4.12393 11.0517 2.48227 11.0517 2.48227M15.685 7.11643L8.58416 14.2164C8.10333 14.6973 7.8625 14.9381 7.5975 15.1448C7.2846 15.3886 6.94624 15.5979 6.58833 15.7689C6.285 15.9131 5.9625 16.0206 5.31666 16.2356L2.5825 17.1473M2.5825 17.1473L1.91416 17.3706C1.75837 17.4228 1.5911 17.4306 1.43115 17.393C1.2712 17.3554 1.12491 17.2739 1.00872 17.1577C0.892535 17.0415 0.811058 16.8952 0.773449 16.7353C0.735841 16.5753 0.743591 16.4081 0.79583 16.2523L1.01916 15.5839L2.5825 17.1473Z" stroke="black" stroke-width="1.5"/></svg>);
const CaretDownIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>);
const AvatarPlaceholder = () => (<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="20" fill="#E0E0E0"/><path d="M20 20c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 3c-4.42 0-12 2.21-12 6.63V33h24v-3.38C32 25.21 24.42 23 20 23z" fill="#999"/></svg>);
const SendIcon = () => (<svg width="18" height="16" viewBox="0 0 18 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1.4 14.9315C1.06667 15.0648 0.75 15.0355 0.45 14.8435C0.15 14.6515 0 14.3725 0 14.0065V9.50648L8 7.50648L0 5.50648V1.00648C0 0.639817 0.15 0.360817 0.45 0.169484C0.75 -0.0218496 1.06667 -0.0511832 1.4 0.0814834L16.8 6.58148C17.2167 6.76482 17.425 7.07315 17.425 7.50648C17.425 7.93982 17.2167 8.24815 16.8 8.43148L1.4 14.9315Z" fill="white"/></svg>);

// --- Permissions Dropdown Icons (Blue) ---
const PermEditIcon = () => (<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M18.672 8.38972L19.599 7.46272C20.3364 6.72529 20.7507 5.72511 20.7507 4.68222C20.7507 3.63933 20.3364 2.63916 19.599 1.90172C18.8616 1.16429 17.8614 0.75 16.8185 0.75C15.7756 0.75 14.7754 1.16429 14.038 1.90172L13.111 2.82872L4.589 11.3487C4.012 11.9267 3.723 12.2157 3.475 12.5337C3.18239 12.9092 2.93126 13.3152 2.726 13.7447C2.553 14.1087 2.424 14.4967 2.166 15.2707L1.072 18.5517M18.672 8.38972C18.672 8.38972 16.703 8.27372 14.965 6.53572C13.227 4.79872 13.112 2.82872 13.112 2.82872M18.672 8.38972L10.151 16.9097C9.574 17.4867 9.285 17.7757 8.967 18.0237C8.59152 18.3163 8.18549 18.5675 7.756 18.7727C7.392 18.9457 7.005 19.0747 6.23 19.3327L2.949 20.4267M2.949 20.4267L2.147 20.6947C1.96005 20.7574 1.75932 20.7667 1.56738 20.7216C1.37544 20.6764 1.19989 20.5787 1.06047 20.4393C0.921042 20.2998 0.82327 20.1243 0.778139 19.9323C0.733009 19.7404 0.742309 19.5397 0.804996 19.3527L1.073 18.5507L2.949 20.4267Z" stroke="#0078D4" stroke-width="1.5"/></svg>);
const PermViewIcon = () => (<svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0.75 5.75C0.75 5.75 5.227 0.75 10.75 0.75C16.273 0.75 20.75 5.75 20.75 5.75" stroke="#0078D3" stroke-width="1.5" stroke-linecap="round"/>
<path d="M20.294 10.795C20.598 11.221 20.75 11.435 20.75 11.75C20.75 12.066 20.598 12.279 20.294 12.705C18.928 14.621 15.439 18.75 10.75 18.75C6.06 18.75 2.572 14.62 1.206 12.705C0.902 12.279 0.75 12.065 0.75 11.75C0.75 11.434 0.902 11.221 1.206 10.795C2.572 8.879 6.061 4.75 10.75 4.75C15.44 4.75 18.928 8.88 20.294 10.795Z" stroke="#0078D3" stroke-width="1.5"/>
<path d="M13.75 11.75C13.75 10.9544 13.4339 10.1913 12.8713 9.62868C12.3087 9.06607 11.5456 8.75 10.75 8.75C9.95435 8.75 9.19129 9.06607 8.62868 9.62868C8.06607 10.1913 7.75 10.9544 7.75 11.75C7.75 12.5456 8.06607 13.3087 8.62868 13.8713C9.19129 14.4339 9.95435 14.75 10.75 14.75C11.5456 14.75 12.3087 14.4339 12.8713 13.8713C13.4339 13.3087 13.75 12.5456 13.75 11.75Z" stroke="#0078D3" stroke-width="1.5"/>
</svg>);
const PermNoDownloadIcon = () => (<svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M21 19.73L1.28 0L0 1.27L6 7.27H3.89L10.89 14.27L11.95 13.22L15 16.27H3.89V18.27H17L19.73 21L21 19.73ZM9.89 3.27H11.89V8.07L14.49 10.67L17.89 7.27H13.89V1.27H7.89V4.07L9.89 6.07V3.27Z" fill="#0078D3"/>
</svg>);

const overlayStyle = {
  position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
  background: "rgba(0,0,0,0.4)", zIndex: 999, display: "flex",
  alignItems: "center", justifyContent: "center"
};

/**
 * ManageAccessPopup
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Closes the modal
 * @param {object} file - The file data being managed
 * @param {string} initialView - "manage", "grant", or "attachments". Determines which view opens first.
 */
export const ManageAccessPopup = ({ isOpen, onClose, file, initialView = "manage" }) => {
  const [view, setView] = useState(initialView); 
  const [activeTab, setActiveTab] = useState("People");
  const [notifyPeople, setNotifyPeople] = useState(true);
  
  // Permissions Dropdown State
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [permission, setPermission] = useState("edit");
  const dropdownRef = useRef(null);

  // Reset view when modal opens
  useEffect(() => {
    if (isOpen) setView(initialView);
  }, [isOpen, initialView]);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  if (!isOpen) return null;

  const renderActivePermissionIcon = () => {
    if (permission === "view") return <PermViewIcon />;
    if (permission === "no_download") return <PermNoDownloadIcon />;
    return <PermEditIcon />; // default "edit"
  };

  // Reusable Permissions Dropdown Menu Component
  const PermissionsDropdown = () => (
    <div 
      ref={dropdownRef}
      className="absolute top-[40px] right-0 w-[260px] bg-white border-[1px] border-[#EAEAEA] shadow-[0px_4px_12px_rgba(0,0,0,0.1)] rounded-[4px] z-50 flex flex-col py-[8px]"
    >
      <button onClick={() => { setPermission("edit"); setDropdownOpen(false); }} className={`flex flex-row items-start px-[16px] py-[10px] hover:bg-[#EBEBEB] text-left transition-colors ${permission === "edit" ? "bg-[#F5F5F5]" : ""}`}>
        <div className="mt-[2px]"><PermEditIcon/></div>
        <div className="flex flex-col ml-[12px]">
          <span className="inter-medium text-[14px] text-black">Can Edit</span>
          <span className="inter-regular text-[12px] text-[#777]">Make any Changes</span>
        </div>
      </button>
      <button onClick={() => { setPermission("view"); setDropdownOpen(false); }} className={`flex flex-row items-start px-[16px] py-[10px] hover:bg-[#EBEBEB] text-left transition-colors ${permission === "view" ? "bg-[#F5F5F5]" : ""}`}>
        <div className="mt-[2px]"><PermViewIcon/></div>
        <div className="flex flex-col ml-[12px]">
          <span className="inter-medium text-[14px] text-black">Can View</span>
          <span className="inter-regular text-[12px] text-[#777]">Can't make changes</span>
        </div>
      </button>
      <button onClick={() => { setPermission("no_download"); setDropdownOpen(false); }} className={`flex flex-row items-start px-[16px] py-[10px] hover:bg-[#EBEBEB] text-left transition-colors ${permission === "no_download" ? "bg-[#F5F5F5]" : ""}`}>
        <div className="mt-[2px]"><PermNoDownloadIcon/></div>
        <div className="flex flex-col ml-[12px]">
          <span className="inter-medium text-[14px] text-black">Can't download</span>
          <span className="inter-regular text-[12px] text-[#777]">Can view but not able to download</span>
        </div>
      </button>
    </div>
  );

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div 
        className="bg-white flex flex-col relative rounded-[8px] shadow-lg border-[1px] border-[#EAEAEA]"
        style={{ width: "520px", minHeight: "360px" }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* --- VIEW 1: MANAGE ACCESS (Main List) --- */}
        {view === "manage" && (
          <div className="flex flex-col px-[30px] pt-[30px] pb-[20px] w-full h-full relative">
            <button onClick={onClose} className="absolute top-[20px] right-[20px] text-[#333] hover:opacity-70 cursor-pointer z-10"><CloseIcon /></button>
            <div className="flex flex-row items-center gap-[15px] mb-[25px]">
              <span className="text-[22px] inter-semibold text-black">Manage Access</span>
              <div className="flex flex-col items-center justify-center cursor-pointer hover:opacity-80" onClick={() => setView("grant")}>
                <AddPeopleIcon />
                <span className="text-[12px] inter-regular text-[#BDBDBD] mt-[2px]">Grand Access</span>
              </div>
            </div>

            <div className="flex flex-row items-center justify-between mb-[30px]">
              <div className="flex flex-row items-center gap-[10px]">
                <FolderIcon />
                <span className="text-[13px] inter-medium text-[#333]">{file?.title || file?.original_name || "Daily Task Sheet- Email"}</span>
              </div>
              {/* Note: In the future, this "Share" button could also trigger the "attachments" view if you want */}
              <button className="flex flex-row items-center gap-[6px] text-[#007BFF] hover:opacity-80 cursor-pointer" onClick={() => setView("attachments")}>
                <ShareLinkIcon />
                <span className="text-[13px] inter-medium">Share</span>
              </button>
            </div>

            <div className="flex flex-row items-center gap-[30px] border-b-[1px] border-[#EAEAEA] mb-[20px]">
              <button onClick={() => setActiveTab("People")} className={`pb-[8px] text-[14px] inter-medium transition-colors border-b-[2px] ${activeTab === "People" ? "border-black text-black" : "border-transparent text-[#777]"}`}>People</button>
              <button onClick={() => setActiveTab("Groups")} className={`pb-[8px] text-[14px] inter-medium transition-colors border-b-[2px] ${activeTab === "Groups" ? "border-black text-black" : "border-transparent text-[#777]"}`}>Groups</button>
            </div>

            <div className="flex flex-col gap-[15px] overflow-y-auto max-h-[150px]">
              <div className="flex flex-row items-center justify-between">
                <div className="flex flex-row items-center gap-[12px]"><AvatarPlaceholder /><span className="text-[14px] inter-medium text-[#444]">Niranjan S P A</span></div>
                <span className="text-[14px] inter-regular text-[#777]">Owner</span>
              </div>
              {/* Future users map here */}
            </div>
          </div>
        )}

        {/* --- VIEW 2: GRAND ACCESS --- */}
        {view === "grant" && (
          <div className="flex flex-col px-[35px] pt-[30px] pb-[25px] w-full h-full relative">
            <button onClick={onClose} className="absolute top-[20px] right-[20px] text-[#333] hover:opacity-70 cursor-pointer z-10"><CloseIcon /></button>
            <span className="text-[20px] inter-semibold text-black mb-[25px]">Grand Access</span>
            
            <div className="flex flex-row items-center w-full border-b-[2px] border-[#00A0FF] pb-[8px] mb-[20px] relative">
              <UserGroupIcon />
              <input type="text" placeholder="Add a Name,group, or email..." className="flex-1 ml-[10px] outline-none border-none text-[14px] inter-regular text-[#333]" />
              
              <div className="flex flex-row items-center gap-[5px] cursor-pointer hover:opacity-70 px-[8px] ml-auto" onClick={() => setDropdownOpen(!dropdownOpen)}>
                {permission === "edit" ? <EditIcon /> : renderActivePermissionIcon()}
                <CaretDownIcon />
              </div>
              {dropdownOpen && <PermissionsDropdown />}
            </div>

            <div className="flex flex-row items-start w-full border-[1px] border-[#CCCCCC] rounded-[4px] p-[10px] min-h-[100px] mb-[15px]">
              <TextEditIcon />
              <textarea placeholder="Add a message" className="flex-1 ml-[10px] outline-none border-none resize-none text-[13px] inter-regular text-[#333] h-[80px]"></textarea>
            </div>

            <div className="flex flex-row items-center gap-[8px] mb-[20px]">
              <input type="checkbox" checked={notifyPeople} onChange={() => setNotifyPeople(!notifyPeople)} className="w-[16px] h-[16px] cursor-pointer accent-[#00A0FF]" />
              <span className="text-[13px] inter-medium text-black">Notify People</span>
            </div>

            <div className="flex-1 flex items-end justify-end mt-[10px]">
              {/* Back to manage view instead of closing */}
              <button onClick={() => setView("manage")} className="px-[24px] h-[36px] bg-[#007BFF] hover:bg-[#0069d9] text-white text-[14px] inter-medium rounded-[4px] transition-colors cursor-pointer">Grand Access</button>
            </div>
          </div>
        )}

        {/* --- VIEW 3: SHARE ATTACHMENTS (New Layout) --- */}
        {view === "attachments" && (
          <div className="flex flex-col pt-[35px] px-[35px] pb-[35px] w-full h-full relative">
            <span className="text-[20px] inter-semibold text-black mb-[25px]">Share Attachments</span>
            
            {/* Boxed Input Row with vertical divider */}
            <div className="flex flex-row items-center w-full border-[1px] border-[#00A0FF] rounded-[4px] h-[45px] mb-[20px] relative">
              <div className="flex-1 flex items-center px-[12px] h-full">
                <UserGroupIcon />
                <input type="text" placeholder="Add a Name,group, or email..." className="flex-1 ml-[10px] outline-none border-none text-[14px] inter-regular text-[#333]"/>
              </div>
              <div className="w-[1px] h-full bg-[#CCCCCC]"></div>
              <div className="flex items-center justify-center gap-[6px] px-[12px] h-full cursor-pointer hover:bg-[#F5F5F5] transition-colors" onClick={() => setDropdownOpen(!dropdownOpen)}>
                {permission === "edit" ? <EditIcon /> : renderActivePermissionIcon()}
                <CaretDownIcon />
              </div>
              {dropdownOpen && <PermissionsDropdown />}
            </div>

            <div className="flex flex-row items-start w-full border-[1px] border-[#CCCCCC] rounded-[4px] p-[12px] h-[120px] mb-[20px]">
              <TextEditIcon />
              <textarea placeholder="Add a message" className="flex-1 ml-[10px] outline-none border-none resize-none text-[14px] inter-regular text-[#333] h-full"></textarea>
            </div>

            <div className="flex-1 flex items-end justify-end">
              <button onClick={onClose} className="flex items-center justify-center gap-[8px] px-[24px] h-[40px] bg-[#007BFF] hover:bg-[#0069d9] text-white text-[15px] inter-medium rounded-[4px] transition-colors cursor-pointer">
                <SendIcon /> Send
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
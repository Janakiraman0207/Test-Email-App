import { useState, useEffect, useRef } from "react";
import profileimage from "../../../assets/images/profileimg.png";
import { StripHtml } from "../../../utils/StripHtml";
import nomessagestoread from "../../../assets/images/nomessagestoread.png"; 
import { togglePinMail } from "../../../api/api";
import LabelAs from "./LabelAs";
import { formatUser } from "../../../utils/FormatUser";
import { ArchiveIcon, AttachmentDownloadIcon, BellOffIcon, CheckListIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, CreateEventCalendarIcon, DocumentActionIcon, FolderIcon, ImageActionIcon, LabelAsIcon, MoreOptionsIcon, PinIcon, PrinterIcon, ReportIcon, SnoozeChevronLeftIcon, SnoozeChevronRightIcon, SnoozeIcon, StarIcon, VerticalThreeDotsIcon } from "../../../assets/icons/IconRegistry";
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
import { createTaskFromEmail } from "../../../api/api";

export const MailView = ({
  mail,
  mails,
  onArchive,
  onDelete,
  onToggleStar,
  onToggleRead,
  onUnarchive,
  selectedMailbox,
  setSelectedMail,
  onRestore,
  onTogglePin,
  defaultLabelsVisibility,
  setDefaultLabelsVisibility,
  taskRefreshTrigger,
  setTaskRefreshTrigger,
  customLabels,
  setCustomLabels,
}) => {
  //Label As
  const [showLabelPopup, setShowLabelPopup] = useState(false);

  const [isActive, setIsActive] = useState(false);
  const [message, setMessage] = useState("");
  const [downloadingAll, setDownloadingAll] = useState(false);

  // Dropdown state and ref
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Snooze state and ref
  const [isSnoozeOpen, setIsSnoozeOpen] = useState(false);
  const snoozeRef = useRef(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [currentMonth, setCurrentMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [dateError, setDateError] = useState("");

  useEffect(() => {
    if (showDatePicker) {
      const now = new Date();
      const nextHour = new Date(now);
      nextHour.setHours(nextHour.getHours() + 1);
      nextHour.setMinutes(0);
      const yyyy = nextHour.getFullYear();
      const mm = String(nextHour.getMonth() + 1).padStart(2, "0");
      const dd = String(nextHour.getDate()).padStart(2, "0");
      const HH = String(nextHour.getHours()).padStart(2, "0");
      const min = String(nextHour.getMinutes()).padStart(2, "0");

      setCustomDate(`${yyyy}-${mm}-${dd}`);
      setCustomTime(`${HH}:${min}`);
      setCurrentMonth(new Date(yyyy, nextHour.getMonth(), 1));
      setDateError("");
    }
  }, [showDatePicker]);

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  ).getDate();
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  ).getDay();

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (snoozeRef.current && !snoozeRef.current.contains(event.target)) {
        setIsSnoozeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Keyboard navigation for dropdowns
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsSnoozeOpen(false);
        setIsDropdownOpen(false);
      }
    };
    if (isSnoozeOpen || isDropdownOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSnoozeOpen, isDropdownOpen]);

  const handleSnoozeOption = (optionId) => {
    let scheduledTime = new Date();
    if (optionId === "later_today") {
      scheduledTime.setHours(scheduledTime.getHours() + 3);
    } else if (optionId === "tomorrow") {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
      scheduledTime.setHours(9, 0, 0, 0);
    } else if (optionId === "end_of_week") {
      const daysUntilSaturday = (6 - scheduledTime.getDay() + 7) % 7 || 7;
      scheduledTime.setDate(scheduledTime.getDate() + daysUntilSaturday);
      scheduledTime.setHours(10, 0, 0, 0);
    } else if (optionId === "next_week") {
      const daysUntilMonday = (1 - scheduledTime.getDay() + 7) % 7 || 7;
      scheduledTime.setDate(scheduledTime.getDate() + daysUntilMonday);
      scheduledTime.setHours(9, 0, 0, 0);
    } else if (optionId === "choose_date") {
      setShowDatePicker(true);
      setIsSnoozeOpen(false);
      return;
    }

    if (onSnooze) {
      onSnooze(mail.id, scheduledTime);
    }
    setIsSnoozeOpen(false);
  };

  const submitCustomDate = () => {
    if (!customDate || !customTime) return;
    const dt = new Date(`${customDate}T${customTime}`);
    if (dt <= new Date()) {
      setDateError("Please select a future date and time.");
      return;
    }
    setDateError("");
    if (onSnooze) {
      onSnooze(mail.id, dt);
    }
    setShowDatePicker(false);
  };

  if (!mails || mails.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center bg-white">
        <img
          src={nomessagestoread}
          alt="No messages to read"
          className="w-[320px] opacity-80"
        />
      </div>
    );
  }

  const currentIndex = mails.findIndex((m) => m.id === mail?.id);
  const totalCount = mails.length;

  const goPrev = () => {
    if (currentIndex > 0) {
      setSelectedMail(mails[currentIndex - 1]);
    }
  };

  const goNext = () => {
    if (currentIndex < mails.length - 1) {
      setSelectedMail(mails[currentIndex + 1]);
    }
  };

  if (!mail || currentIndex === -1) {
    return (
      <div className="flex flex-1 items-center justify-center bg-white">
        Select a Mail to Preview
      </div>
    );
  }

  const downloadAllAttachments = async () => {
    if (!mail.attachments || mail.attachments.length === 0) return;
    setDownloadingAll(true);
    for (const att of mail.attachments) {
      try {
        const fileUrl = att.url;
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = att.filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`Failed to download ${att.filename}`, err);
      } finally {
        setDownloadingAll(false);
      }
    }
  };

  const previewFile = (att) => {
    const link = document.createElement("a");
    link.href = att.url;
    link.download = att.filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadFile = async (att) => {
    try {
      const fileUrl = att.url;
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = att.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  // Handle Pin Email
  const handlePin = async () => {
    setIsDropdownOpen(false);
    try {
      const newPinStatus = !mail.is_important;
      if (onTogglePin) {
        onTogglePin(mail.id, newPinStatus);
      } else {
        await togglePinMail(mail.id, newPinStatus);
        mail.is_important = newPinStatus; // Optimistic local UI update
        setSelectedMail({ ...mail, is_important: newPinStatus });
      }
    } catch (err) {
      console.error("Error toggling pin", err);
    }
  };

  // Handle Print Functionality
  const handlePrint = () => {
    setIsDropdownOpen(false);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      // Look for user_email directly as a key, or nested inside the 'user' object
      const directUserEmail = localStorage.getItem("user_email");
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const myEmail =
        directUserEmail ||
        currentUser?.user_email ||
        currentUser?.email ||
        "Me";

      // const fromEmail = selectedMailbox === "sent"
      //   ? (mail.from || mail.email || myEmail)
      //   : (mail.from || mail.email || "Unknown Sender");

      // const toEmail = selectedMailbox === "sent"
      //   ? (mail.to || "Unknown Recipient")
      //   : (mail.to || mail.email || myEmail);

      const fromEmail = formatUser(mail.from) || myEmail;
      const toEmail = formatUser(mail.to) || "Unknown Recipient";

      const formattedDate = new Date(mail.date).toLocaleString("default", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Generate attachments HTML if any exist
      let attachmentsHtml = "";
      if (mail.attachments && mail.attachments.length > 0) {
        attachmentsHtml = `
          <div class="attachments-section">
            <div class="attachments-title">Attachments (${mail.attachments.length})</div>
            <ul class="attachments-list">
              ${mail.attachments
                .map((att) => {
                  const fileName =
                    att?.filename?.split("/")?.pop() || att?.name || "file";
                  const sizeKb = att?.size
                    ? (att.size / 1024).toFixed(0) + " KB"
                    : "Unknown size";
                  return `<li>📄 <strong>${fileName}</strong> <span class="attachment-size">(${sizeKb})</span></li>`;
                })
                .join("")}
            </ul>
          </div>
        `;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Print Email - ${mail.subject}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.6; max-width: 800px; margin: 0 auto; }
              .header { border-bottom: 2px solid #eaeaea; padding-bottom: 20px; margin-bottom: 30px; }
              h1 { font-size: 24px; color: #000; margin-bottom: 10px; }
              .meta-info { font-size: 14px; color: #555; margin-bottom: 5px; }
              .meta-label { font-weight: bold; color: #777; width: 60px; display: inline-block; }
              .body-content { font-size: 15px; margin-top: 30px; }
              .attachments-section { margin-top: 40px; border-top: 1px dashed #eaeaea; padding-top: 20px; }
              .attachments-title { font-size: 16px; font-weight: bold; margin-bottom: 12px; color: #000; }
              .attachments-list { list-style-type: none; padding: 0; margin: 0; }
              .attachments-list li { background-color: #f9f9f9; padding: 10px 15px; border-radius: 6px; border: 1px solid #eee; margin-bottom: 8px; font-size: 14px; }
              .attachment-size { color: #888; font-size: 12px; margin-left: 6px; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${mail.subject}</h1>
              <div class="meta-info"><span class="meta-label">From:</span> ${fromEmail}</div>
              <div class="meta-info"><span class="meta-label">To:</span> ${toEmail}</div>
              <div class="meta-info"><span class="meta-label">Date:</span> ${formattedDate}</div>
            </div>
            <div class="body-content">${mail.body || ""}</div>
            ${attachmentsHtml}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  // console.log("MAIL DATA:", mail);
  // console.log("FROM:", mail.from);
  // console.log("TO:", mail.to);

  const handleAddToTask = async () => {
    try {
      await createTaskFromEmail(mail.id);

      setTaskRefreshTrigger((prev) => prev + 1);

      setMessage("Task created successfully");

      setTimeout(() => {
        setMessage("");
      }, 2000);

      setIsDropdownOpen(false);
    } catch (err) {
      console.error("Failed to create task", err);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 w-[672px] mr-[25px] mt-[9px] overflow-hidden ">
      {showLabelPopup && (
        <LabelAs
          onClose={() => setShowLabelPopup(false)}
          defaultLabelsVisibility={defaultLabelsVisibility}
          setDefaultLabelsVisibility={setDefaultLabelsVisibility}
          customLabels={customLabels}
          setCustomLabels={setCustomLabels}
        />
      )}

      {/*Top toolbar */}
      <div className="w-[672px] h-[45px] shrink-0 bg-[#040B23] px-[16px] flex items-center gap-[128px] rounded-[4px] relative z-20">
        <div className="flex flex-row w-[164px] h-[16px] gap-[21px] ">
          <ArchiveIcon
            className="cursor-pointer transition-transform hover:scale-110"
            isArchived={selectedMailbox === "archived"}
            onClick={() =>
              selectedMailbox === "archived"
                ? onUnarchive(mail.id)
                : onArchive(mail.id)
            }
          />
          {/* Snooze Wrapper with existing clock */}
          <div
            className="relative flex items-center justify-center -mt-[1px]"
            ref={snoozeRef}
          >
            <SnoozeIcon
              className="cursor-pointer transition-transform hover:scale-110"
              onClick={() => setIsSnoozeOpen(!isSnoozeOpen)}
            />
            {/* Snooze Dropdown Panel */}
            {isSnoozeOpen && (
              <div className="absolute top-[24px] left-0 z-50 w-[180px] bg-white rounded-[12px] shadow-[0px_4px_24px_rgba(0,0,0,0.15)] border border-[#EAEAEA] py-[6px] flex flex-col transform origin-top transition-all animate-[slideDown_0.2s_ease-out]">
                <div className="px-[12px] py-[4px] text-[10px] text-[#767676] inter-medium uppercase tracking-wider">
                  Snooze until
                </div>
                <div className="border-t border-[#EAEAEA] my-[2px]"></div>
                {[
                  { id: "later_today", label: "Later today", timeStr: "18:00" },
                  { id: "tomorrow", label: "Tomorrow", timeStr: "Tue 08:00" },
                  {
                    id: "end_of_week",
                    label: "End of week",
                    timeStr: "Fri 18:00",
                  },
                  { id: "next_week", label: "Next week", timeStr: "Mon 08:00" },
                ].map((option) => (
                  <div
                    key={option.id}
                    onClick={() => handleSnoozeOption(option.id)}
                    className="px-[12px] py-[8px] hover:bg-[#F5F5F5] cursor-pointer flex justify-between items-center group transition-colors"
                  >
                    <span className="inter-regular text-[13px] text-[#040B23]">
                      {option.label}
                    </span>
                    <span className="inter-regular text-[11px] text-[#767676] opacity-0 group-hover:opacity-100 transition-opacity">
                      {option.timeStr}
                    </span>
                  </div>
                ))}
                <div className="border-t border-[#EAEAEA] my-[2px]"></div>
                <div
                  onClick={() => handleSnoozeOption("choose_date")}
                  className="px-[12px] py-[8px] hover:bg-[#F5F5F5] cursor-pointer flex justify-between items-center transition-colors"
                >
                  <span className="inter-regular text-[13px] text-[#040B23]">
                    Choose a date
                  </span>
                </div>
              </div>
            )}
          </div>
          {/* <BellOffIcon className="cursor-pointer transition-transform hover:scale-110" /> */}
          {/* <TrashIcon
            className="cursor-pointer transition-transform hover:scale-110"
            isRestore={selectedMailbox === "trash"}
            onClick={() => {
              if (selectedMailbox === "trash") {
                onRestore(mail.id);
              } else {
                onDelete(mail.id);
              }
            }}
          /> */}
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="cursor-pointer transition-transform hover:scale-110"
          >
            <path
              d="M9.5 11.1667C9.5 11.4731 9.43965 11.7765 9.32239 12.0596C9.20513 12.3427 9.03325 12.5999 8.81658 12.8166C8.59991 13.0333 8.34269 13.2051 8.05959 13.3224C7.7765 13.4396 7.47308 13.5 7.16667 13.5C6.86025 13.5 6.55683 13.4396 6.27374 13.3224C5.99065 13.2051 5.73342 13.0333 5.51675 12.8166C5.30008 12.5999 5.12821 12.3427 5.01095 12.0596C4.89369 11.7765 4.83333 11.4731 4.83333 11.1667M0.5 0.5L13.8333 13.8333"
              stroke="white"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13.1668 9.98748C13.1668 9.67481 13.0428 9.37481 12.8215 9.15414L12.4195 8.75148C12.0444 8.37649 11.8336 7.86787 11.8335 7.33748V5.50014C11.8336 4.63747 11.5945 3.79165 11.1429 3.05663C10.6913 2.32162 10.0448 1.72617 9.27515 1.33642C8.50553 0.946677 7.64295 0.777889 6.78319 0.848804C5.92343 0.919719 5.10016 1.22756 4.40481 1.73814M2.34681 11.1668C2.11359 11.1667 1.88564 11.0975 1.69177 10.9678C1.4979 10.8382 1.34682 10.654 1.25762 10.4385C1.16843 10.223 1.14513 9.98592 1.19067 9.75719C1.23621 9.52846 1.34855 9.31837 1.51347 9.15348L1.91481 8.75148C2.28966 8.37638 2.5002 7.86777 2.50014 7.33748V5.50014C2.50014 4.63881 2.73347 3.83214 3.14014 3.14014L11.1668 11.1668H2.34681Z"
              stroke="white"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <svg
            width="13"
            height="15"
            viewBox="0 0 13 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            onClick={() => {
              if (selectedMailbox === "trash") {
                onRestore(mail.id);
              } else {
                onDelete(mail.id);
              }
            }}
            className="cursor-pointer transition-transform hover:scale-110"
          >
            <path
              d="M11.5 2.83333L11.0867 9.51667C10.9813 11.224 10.9287 12.078 10.5 12.692C10.2884 12.9954 10.0159 13.2515 9.7 13.444C9.062 13.8333 8.20667 13.8333 6.496 13.8333C4.78267 13.8333 3.926 13.8333 3.28667 13.4433C2.97059 13.2505 2.69814 12.9939 2.48667 12.69C2.05867 12.0753 2.00667 11.22 1.904 9.51L1.5 2.83333M0.5 2.83333H12.5M9.204 2.83333L8.74867 1.89467C8.44667 1.27067 8.29533 0.959333 8.03467 0.764667C7.97676 0.721544 7.91545 0.683195 7.85133 0.65C7.56267 0.5 7.216 0.5 6.52333 0.5C5.81267 0.5 5.45733 0.5 5.16333 0.656C5.09834 0.690807 5.03635 0.730945 4.978 0.776C4.71467 0.978 4.56733 1.30133 4.27267 1.94733L3.86867 2.83333"
              stroke="white"
              strokeLinecap="round"
            />
            {selectedMailbox === "trash" && (
              <line
                x1="1"
                y1="14"
                x2="12"
                y2="1"
                stroke="white"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            )}
          </svg>
          {/* Dropdown Menu Wrapper */}
          <div
            className="relative flex items-center justify-center"
            ref={dropdownRef}
          >
            <VerticalThreeDotsIcon
              className="cursor-pointer text-white transition-transform hover:scale-110"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            />
            {/* The Dropdown Panel */}
            {isDropdownOpen && (
              <div className="absolute top-[20px] left-0 z-50 w-[240px] bg-white rounded-[12px] shadow-[0px_4px_24px_rgba(0,0,0,0.15)] border border-[#EAEAEA] py-[8px] flex flex-col gap-[2px]">
                {/* Pin this message */}
                <div
                  onClick={handlePin}
                  className="px-[16px] py-[10px] flex flex-row items-center gap-[12px] hover:bg-[#F5F5F5] cursor-pointer transition-colors"
                >
                  <PinIcon className="cursor-pointer" />
                  <span className="inter-regular text-[14px] text-[#040B23]">
                    {mail.is_important
                      ? "Unpin this message"
                      : "Pin this message"}
                  </span>
                </div>

                {/* Move to folder */}
                <div className="px-[16px] py-[10px] flex flex-row items-center gap-[12px] hover:bg-[#F5F5F5] cursor-pointer transition-colors">
                  <FolderIcon className="cursor-pointer" />
                  <span className="inter-regular text-[14px] text-[#040B23]">
                    Move to folder
                  </span>
                </div>

                {/* Add to tasks */}
                <div className="px-[16px] py-[10px] flex flex-row items-center gap-[12px] hover:bg-[#F5F5F5] cursor-pointer transition-colors">
                  <CheckListIcon className="cursor-pointer" />
                  <span className="inter-regular text-[14px] text-[#040B23]">
                    Add to tasks
                  </span>
                </div>

                {/* Create event */}
                <div className="px-[16px] py-[10px] flex flex-row items-center gap-[12px] hover:bg-[#F5F5F5] cursor-pointer transition-colors">
                  <CreateEventCalendarIcon className="cursor-pointer" />
                  <span className="inter-regular text-[14px] text-[#040B23]">
                    Create event
                  </span>
                </div>

                <div className="h-[1px] w-full bg-[#EAEAEA] my-[4px]"></div>

                {/* Category as */}
                <div
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setShowLabelPopup(true);
                  }}
                  className="px-[16px] py-[10px] flex flex-row items-center gap-[12px] hover:bg-[#F5F5F5] cursor-pointer transition-colors"
                >
                  <LabelAsIcon className="cursor-pointer" />
                  <span className="inter-regular text-[14px] text-[#040B23]">
                    Label as
                  </span>
                </div>

                {/* Report */}
                <div className="px-[16px] py-[10px] flex flex-row items-center gap-[12px] hover:bg-[#F5F5F5] cursor-pointer transition-colors">
                  <ReportIcon className="cursor-pointer" />
                  <span className="inter-regular text-[14px] text-[#040B23]">
                    Report Junk
                  </span>
                </div>

                {/* Print */}
                <div
                  onClick={handlePrint}
                  className="px-[16px] py-[10px] flex flex-row items-center gap-[12px] hover:bg-[#F5F5F5] cursor-pointer transition-colors"
                >
                  <PrinterIcon />
                  <span className="inter-regular text-[14px] text-[#040B23]">
                    Print
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-row items-center justify-between w-[89px] h-[12px] gap-[12px] ">
          <ChevronLeftIcon
            onClick={goPrev}
            className={`cursor-pointer text-white transition-transform hover:scale-110 ${
              currentIndex === 0 ? "opacity-40 pointer-events-none" : ""
            }`}
          />
          <span className="inter-regular text-[10px] text-[#FFFFFF]">
            {currentIndex + 1} / {totalCount}
          </span>
          <ChevronRightIcon
            onClick={goNext}
            className={`cursor-pointer text-white transition-transform hover:scale-110 ${
              currentIndex === mails.length - 1
                ? "opacity-40 pointer-events-none"
                : ""
            }`}
          />
        </div>

        <div className="flex flex-row items-center justify-center w-[132px] h-[29px] gap-[18px] ">
          {selectedMailbox === "inbox" && (
            <button
              className="flex items-center justify-center w-[98px] h-[29px] rounded-[4px] border border-[#FFFFFF] inter-regular text-[10px] text-[#FFFFFF]"
              onClick={() => onToggleRead(mail.id)}
            >
              {(mail.isRead !== undefined ? mail.isRead : mail.is_read)
                ? "Mark as unread"
                : "Mark as read"}
            </button>
          )}
          <StarIcon
            isActive={mail.is_favorite}
            onClick={() => onToggleStar(mail.id)}
            className="cursor-pointer transition-transform hover:scale-110 transition-transform active:scale-125"
          />
        </div>
      </div>

      <div className="relative w-[672px] flex-1 min-h-0 overflow-hidden mt-[10px] rounded-[6px] bg-white border border-[#EAEAEA]">
        <div className="h-full overflow-y-auto px-[30px] pt-[30px] pb-[200px] scrollbar-hide">
          <div className=" flex flex-col max-w-[612px]">
            <div className="flex items-center gap-[8px] max-w-[562px] h-[36px]">
              <img
                src={profileimage}
                alt="Profile"
                className="w-[36px] h-[36px] rounded-full"
              />
              <div className="flex flex-col">
                <span className="inter-bold text-[10px]">
                  {" "}
                  {selectedMailbox === "sent"
                    ? formatUser(mail.to, "name")
                    : formatUser(mail.from, "name")}
                </span>
                <span className="inter-regular text-[10px]">
                  {selectedMailbox === "sent"
                    ? formatUser(mail.to, "email") ||
                      formatUser(mail.to, "name")
                    : formatUser(mail.from, "email") ||
                      formatUser(mail.from, "name")}{" "}
                </span>
              </div>
            </div>
            <div className="mt-[10px] max-w-[612px]">
              <h1 className="inter-semibold text-[22px] leading-[30px] break-words">
                {mail.subject}
              </h1>
            </div>

            <div className="mt-[16px] w-[612px] inter-regular text-[11px] text-[#5E5E5E] leading-[22px] whitespace-pre-line">
              {StripHtml(mail.body)}
            </div>
          </div>

          {mail?.attachments && mail?.attachments?.length > 0 && (
            <div className="flex flex-row justify-between w-full max-w-[612px] h-[23px] mt-[13px]">
              <span className="inter-bold text-[14px] leading-[23px]">
                Attachments ({mail.attachments.length})
              </span>
              {mail?.attachments?.length > 1 && (
                <button
                  onClick={downloadAllAttachments}
                  disabled={downloadingAll}
                  className="inter-regular text-[12px] leading-[23px] text-[#6231A5] cursor-pointer"
                >
                  {downloadingAll ? "Downloading..." : "Download all"}
                </button>
              )}
            </div>
          )}

          {mail?.attachments && mail.attachments.length > 0 && (
            <div className="flex flex-wrap gap-[12px] mt-[10px]">
              <div className="flex flex-wrap gap-[12px] mt-[10px]">
                {mail.attachments?.map((att) => {
                  const fileName = att?.filename?.split("/")?.pop() || "file";
                  const fileUrl = att?.url;
                  const ext = fileName.split(".").pop()?.toLowerCase() || "";
                  const isImage = [
                    "png",
                    "jpg",
                    "jpeg",
                    "gif",
                    "webp",
                  ].includes(ext);

                  return (
                    <div
                      key={fileName}
                      className="flex gap-[10px] w-[164px] h-[63px] rounded-[6px] border border-[#040B2308] bg-[#F0F1F8] p-[8px]"
                    >
                      {/* Preview */}
                      <div className="w-[43px] h-[43px] rounded-[6px] overflow-hidden bg-white flex items-center justify-center shrink-0">
                        {isImage ? (
                          <img
                            src={att.url}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[20px]">📄</span>
                        )}
                      </div>

                      {/* Right side content */}
                      <div className="flex flex-col gap-[3px] w-[68px]">
                        {/* File name */}
                        <span className="text-[10px] inter-semibold leading-[12px] line-clamp-2 break-all truncate">
                          {fileName}
                        </span>

                        {/* File size */}
                        <span className="text-[9px] leading-[11px] text-[#7E7E7E] inter-regular">
                          {att?.size
                            ? (att.size / 1024).toFixed(0) + " kb"
                            : "—"}
                        </span>

                        {/* Download icon */}
                        <button
                          onClick={() => downloadFile(att)}
                          className="flex items-start justify-start cursor-pointer"
                        >
                          <AttachmentDownloadIcon />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div
          className="sticky top-[15px] bottom-[-5px] left-[28px] right-[30px] flex flex-col w-[614px] h-[152px] rounded-[6px] border border-[#EAEAEA] bg-[#FFFFFF] px-[20px] py-[12px] gap-[10px]"
          style={{ boxShadow: "0px -4px 22px 0px rgba(233, 231, 231, 0.48)" }}
        >
          <div className="mx-auto w-full max-w-[614px] flex flex-col gap-[10px]">
            <div className="text-[11px] text-[#7E7E7E] w-[558px] flex flex-col items-start justify-center gap-[12px]">
              <MoreOptionsIcon className="cursor-pointer transition-transform hover:scale-110"/>
              <div className="w-[558px] border radius-[6px] border-[#D9D9D9] px-[24px] py-[15px]">
                Click here to
                <span className="text-[#6231A5] cursor-pointer ml-1">
                  Reply
                </span>
                ,
                <span className="text-[#6231A5] cursor-pointer ml-1">
                  Reply all
                </span>{" "}
                or
                <span className="text-[#6231A5] cursor-pointer ml-1">
                  Forward
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex gap-[10px]">
                <DocumentActionIcon className="cursor-pointer transition-transform hover:scale-110"/>
                <ImageActionIcon className="cursor-pointer transition-transform hover:scale-110"/>
              </div>

              <button className="w-[70px] h-[28px] rounded-[14px] bg-[#6231A5] text-white text-[11px] cursor-pointer">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Date Picker Modal */}
      {showDatePicker && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(0,0,0,0.4)] backdrop-blur-[2px]"
          onClick={() => setShowDatePicker(false)}
        >
          <div
            className="bg-white rounded-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex flex-col animate-[slideUp_0.2s_ease-out] w-[500px]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-[24px] py-[16px] border-b border-[#EAEAEA]">
              <h3 className="inter-semibold text-[16px] text-[#040B23]">
                Set custom date and time
              </h3>
              <button
                onClick={() => setShowDatePicker(false)}
                className="text-[#767676] hover:text-[#040B23] transition-colors cursor-pointer"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-row p-[24px] gap-[24px] flex-wrap md:flex-nowrap">
              {/* Left Section (Calendar) */}
              <div className="flex-1 flex flex-col min-w-[210px]">
                <div className="flex justify-between items-center mb-[12px]">
                  <span className="inter-medium text-[14px] text-[#040B23] capitalize">
                    {currentMonth.toLocaleString("default", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <div className="flex gap-[8px]">
                    <button
                      onClick={() =>
                        setCurrentMonth(
                          new Date(
                            currentMonth.getFullYear(),
                            currentMonth.getMonth() - 1,
                            1,
                          ),
                        )
                      }
                      className="p-[4px] rounded-[4px] hover:bg-[#F5F5F5] text-[#767676] transition-colors cursor-pointer"
                    >
                      <SnoozeChevronLeftIcon/>
                    </button>
                    <button
                      onClick={() =>
                        setCurrentMonth(
                          new Date(
                            currentMonth.getFullYear(),
                            currentMonth.getMonth() + 1,
                            1,
                          ),
                        )
                      }
                      className="p-[4px] rounded-[4px] hover:bg-[#F5F5F5] text-[#767676] transition-colors cursor-pointer"
                    >
                      <SnoozeChevronRightIcon />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-[2px] mb-[8px]">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                    <div
                      key={day}
                      className="text-center inter-medium text-[12px] text-[#767676] py-[4px]"
                    >
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                    <div key={`empty-${idx}`}></div>
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const dateNum = idx + 1;
                    const dateObj = new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth(),
                      dateNum,
                    );
                    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
                    const isSelected = customDate === dateStr;
                    const isPast =
                      dateObj < new Date(new Date().setHours(0, 0, 0, 0));

                    return (
                      <button
                        key={dateNum}
                        onClick={() => {
                          if (!isPast) {
                            setCustomDate(dateStr);
                            setDateError("");
                          }
                        }}
                        disabled={isPast}
                        className={`h-[28px] w-full rounded-[4px] inter-regular text-[13px] flex items-center justify-center transition-colors cursor-pointer ${
                          isPast
                            ? "text-[#D9D9D9] cursor-not-allowed"
                            : isSelected
                              ? "bg-[#6A37F5] text-white hover:bg-[#5b2cd0]"
                              : "text-[#040B23] hover:bg-[#EAEAEA]"
                        }`}
                      >
                        {dateNum}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div className="w-[1px] bg-[#EAEAEA]"></div>

              {/* Right Section (Date & Time) */}
              <div className="flex-1 flex flex-col gap-[16px]">
                <div className="flex flex-col gap-[6px]">
                  <label className="inter-medium text-[12px] text-[#767676]">
                    Selected date
                  </label>
                  <div className="w-full border border-[#EAEAEA] rounded-[6px] px-[12px] py-[8px] inter-regular text-[13px] text-[#040B23] bg-[#F9F9F9]">
                    {customDate
                      ? new Date(customDate + "T00:00:00").toLocaleDateString(
                          "default",
                          {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )
                      : "None"}
                  </div>
                </div>

                <div className="flex flex-col gap-[6px]">
                  <label className="inter-medium text-[12px] text-[#767676]">
                    Time
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={customTime}
                      onChange={(e) => {
                        setCustomTime(e.target.value);
                        setDateError("");
                      }}
                      className="w-full border border-[#EAEAEA] rounded-[6px] px-[12px] py-[8px] inter-regular text-[13px] text-[#040B23] focus:outline-none focus:border-[#6A37F5] bg-white"
                    />
                  </div>
                </div>

                {dateError && (
                  <div className="text-[#FF4D4D] inter-medium text-[11px] mt-[4px]">
                    {dateError}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end items-center gap-[12px] px-[24px] py-[16px] border-t border-[#EAEAEA]">
              <button
                onClick={submitCustomDate}
                className="px-[16px] py-[8px] rounded-[16px] bg-[#6A37F5] inter-medium text-[13px] text-white shadow-[0_2px_8px_rgba(106,55,245,0.3)] hover:bg-[#5b2cd0] transition-colors cursor-pointer"
              >
                Save
              </button>

              <button
                onClick={() => setShowDatePicker(false)}
                className="px-[16px] py-[8px] rounded-[6px] inter-medium text-[13px] text-[#624ad8] bg-transparent hover:bg-[#F5F5F5] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

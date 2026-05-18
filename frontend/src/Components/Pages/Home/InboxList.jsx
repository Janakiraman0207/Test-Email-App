import React, { useEffect, useState, useRef } from "react";
import profileimage from "../../../assets/images/profileimg.png";
import profileimage1 from "../../../assets/images/profileimg1.png";
import profileimage2 from "../../../assets/images/profileimg2.png";
import profileimage3 from "../../../assets/images/profileimg3.png";
import profileimage4 from "../../../assets/images/profileimg4.png";
import { ComposeModal } from "./ComposeSection/ComposeModal";
import { StripHtml } from "../../../utils/StripHtml";
import { getInboxMails, getUnreadMails } from "../../../api/api";
import { formatUser } from "../../../utils/FormatUser";
import { ArrowIcon } from "../../../assets/icons/IconRegistry";
import { useSelector } from "react-redux";
import { STATUS_LIST } from "../../../constants/StatusList";

export const InboxList = ({ mails, selectedMail, setSelectedMail, selectedMailbox, setIsComposeOpen, setDraftData, onToggleStar, isComposeOpen }) => {

  const [activeTab, setActiveTab] = useState("primary");
  const [localMails, setLocalMails] = useState(mails || []);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortCriteria, setSortCriteria] = useState("Date");
  const [sortOrder, setSortOrder] = useState("desc");
  const sortRef = useRef(null);
  const [, forceUpdate] = useState(0);
    const showProfilePhotos = JSON.parse(
    localStorage.getItem('show_profile_photos') ?? 'true'
  );

  useEffect(() => {
    const handleStorageChange = () => forceUpdate(n => n + 1);
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  useEffect(() => {
    setLocalMails(mails || []);
  }, [mails]);

  useEffect(() => {
    if (selectedMail) {
      setLocalMails((prevMails) =>
        prevMails.map((m) => (m.id === selectedMail.id ? { ...m, ...selectedMail } : m))
      );
    }
  }, [selectedMail]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAllMailClick = async () => {
    try {
      const response = await getInboxMails();
      setLocalMails(response.data);
      setSelectedMail(null); // Clear selected mail to show default view
    } catch (error) {
      console.error("Error fetching all mails:", error);
    } finally {
      setIsFilterOpen(false);
    }
  };

  const handleUnreadClick = () => {
    const unreadMails = (mails || []).filter(mail => mail.is_read === false);
    setLocalMails(unreadMails);
    setSelectedMail(null); // Clear selected mail to show default view
    setIsFilterOpen(false);
  };

  const handleHasAttachmentsClick = () => {
    const withAttachments = (mails || []).filter(mail => mail.attachments && mail.attachments.length > 0);
    setLocalMails(withAttachments);
    setSelectedMail(null); // Clear selected mail to show default view
    setIsFilterOpen(false);
  };

  const handleHasInvitesClick = () => {
    const withInvites = (mails || []).filter(mail => mail.has_invites);
    setLocalMails(withInvites);
    setSelectedMail(null); // Clear selected mail to show default view
    setIsFilterOpen(false);
  };

  // UPDATED SORTING: Pinned emails first, then by criteria
  const sortedMails = [...localMails].sort((a, b) => {
    if (a.is_important && !b.is_important) return -1;
    if (!a.is_important && b.is_important) return 1;

    let valA, valB;
    if (sortCriteria === "Date") {
      valA = new Date(a.date || a.created_at || 0).getTime();
      valB = new Date(b.date || b.created_at || 0).getTime();
    } else if (sortCriteria === "Subject") {
      valA = (a.subject || "").toLowerCase();
      valB = (b.subject || "").toLowerCase();
    }

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const filteredMails = sortedMails.filter((mail) => {
    if (activeTab === "primary") {
      return !mail.category || mail.category === "primary";
    } else {
      return mail.category === "others";
    }
  });

  const formatGroupDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();

    const isToday = date.toDateString() === today.toDateString();

    if (isToday) {
      return `Today, ${date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      })}`;
    }

    return date.toLocaleDateString("default", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

 const getDisplayEmail = (mail) => {
  if (selectedMailbox === "sent") return formatUser(mail.to);
  if (selectedMailbox === "drafts") return mail.receiver_email || "Draft";
  return formatUser(mail.from);
 };

 const getStatusObject = (statusValue) => {
  return STATUS_LIST.find(
    (item) => item.value === statusValue
  );
};

const currentStatus = useSelector((state)=>state.status.currentStatus);
  const statusObj = getStatusObject(currentStatus.value);

  return (
    <div className="relative flex flex-col w-[298px] h-full min-h-0 flex-shrink-0 mx-[26px] pt-[9px] gap-[10px]">
      <div className="w-full h-[44px] px-[26px] border-b-[2px] border-[#6A37F5] flex items-center">
        <div className="flex flex-row justify-between items-center w-[222px] h-[27px] ">
          <button
            onClick={() => {
              setActiveTab("primary");
              setSelectedMail(null);
            }}
            className={`flex items-center justify-center w-[104px] h-[27px] rounded-[4px] text-[12px] tracking-[0.07em] cursor-pointer transition-colors ${
              activeTab === "primary"
                ? "bg-[#6231A514] inter-bold text-[#6A37F5]"
                : "inter-regular text-[#636775] hover:text-[#6A37F5] bg-transparent"
            }`}
          >
            Primary
          </button>
          <button
            onClick={() => {
              setActiveTab("others");
              setSelectedMail(null);
            }}
            className={`flex items-center justify-center w-[104px] h-[27px] rounded-[4px] text-[12px] tracking-[0.07em] cursor-pointer transition-colors ${
              activeTab === "others"
                ? "bg-[#6231A514] inter-bold text-[#6A37F5]"
                : "inter-regular text-[#636775] hover:text-[#6A37F5] bg-transparent"
            }`}
          >
            Others
          </button>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex items-center justify-between w-full h-[15px] pl-[15px] mb-[2px]">
        {/* Filter Dropdown Container */}
        <div className="relative flex items-center" ref={filterRef}>
          <div
            className="flex justify-between items-center w-[50px] h-[15px] gap-[5px] cursor-pointer"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3.85412 5.98267C2.40337 4.89767 1.36854 3.70417 0.803287 3.03333C0.628287 2.82567 0.57112 2.67342 0.536703 2.40567C0.41887 1.48867 0.359953 1.03017 0.62887 0.733833C0.897787 0.4375 1.3732 0.4375 2.32404 0.4375H9.05104C10.0019 0.4375 10.4773 0.4375 10.7462 0.73325C11.0151 1.02958 10.9562 1.48808 10.8384 2.40508C10.8034 2.67283 10.7462 2.82508 10.5718 3.03275C10.006 3.70475 8.96937 4.90058 7.51512 5.98733C7.44787 6.03966 7.39228 6.10544 7.35191 6.18047C7.31153 6.2555 7.28725 6.33814 7.28062 6.42308C7.13654 8.01617 7.00354 8.88883 6.9207 9.32983C6.78712 10.0427 5.77737 10.4714 5.23604 10.8535C4.91404 11.081 4.5232 10.8103 4.48179 10.458C4.32689 9.11546 4.19582 7.77027 4.08862 6.42308C4.08263 6.33733 4.05865 6.25379 4.01825 6.17791C3.97785 6.10204 3.92193 6.03551 3.85412 5.98267Z"
                stroke="#040B23"
                strokeWidth="0.875"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="inter-regular text-[12px] text-[#040B23]">
              Filter
            </span>
          </div>

          {/* The Filter Dropdown Menu */}
          {isFilterOpen && (
            <div className="absolute top-[24px] left-0 z-50 w-[220px] bg-white rounded-[16px] shadow-[0px_4px_24px_rgba(0,0,0,0.12)] border border-[#EAEAEA] py-[12px] flex flex-col gap-[4px]">
              {/* All Mail */}
              <div
                onClick={handleAllMailClick}
                className="px-[16px] py-[10px] flex flex-row items-center gap-[14px] hover:bg-[#F5F5F5] cursor-pointer transition-colors"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 15 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.49866 3.83301L1.68666 4.37501C1.10399 4.76301 0.81266 4.95701 0.65466 5.25301C0.49666 5.54967 0.497993 5.89767 0.50066 6.59301C0.503327 7.43167 0.511327 8.28501 0.53266 9.14901C0.583993 11.199 0.609327 12.2237 1.36333 12.977C2.11666 13.7303 3.15533 13.757 5.23266 13.809C6.52113 13.8412 7.81019 13.8412 9.09866 13.809C11.176 13.757 12.2147 13.731 12.968 12.977C13.7213 12.2237 13.7473 11.199 13.7987 9.14901C13.82 8.28501 13.828 7.43167 13.8307 6.59367C13.8327 5.89767 13.834 5.54967 13.676 5.25367C13.5187 4.95701 13.2273 4.76301 12.6447 4.37501L11.832 3.83301"
                    stroke="black"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M0.499054 5.83301L5.10772 8.59834C6.11039 9.19967 6.61172 9.49967 7.16572 9.49967C7.71972 9.49967 8.22105 9.19967 9.22372 8.59767L13.8324 5.83301"
                    stroke="black"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2.49905 7.16667V3.16667C2.49905 1.90933 2.49905 1.28133 2.88972 0.890667C3.28039 0.5 3.90839 0.5 5.16572 0.5H9.16572C10.4231 0.5 11.0511 0.5 11.4417 0.890667C11.8324 1.28133 11.8324 1.90933 11.8324 3.16667V7.16667"
                    stroke="black"
                  />
                  <path
                    d="M5.83206 5.83268H8.49873M5.83206 3.16602H8.49873"
                    stroke="black"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="inter-regular text-[15px] text-[#000000]">
                  All Mail
                </span>
              </div>

              {/* Unread */}
              <div
                onClick={handleUnreadClick}
                className="px-[16px] py-[10px] flex flex-row items-center gap-[14px] hover:bg-[#F5F5F5] cursor-pointer transition-colors"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#000000"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="6" width="18" height="12" rx="2" ry="2"></rect>
                  <path d="M3 6l9 6 9-6"></path>
                </svg>
                <span className="inter-regular text-[15px] text-[#000000]">
                  Unread
                </span>
              </div>

              {/* Has attachments */}
              <div
                onClick={handleHasAttachmentsClick}
                className="px-[16px] py-[10px] flex flex-row items-center gap-[14px] hover:bg-[#F5F5F5] cursor-pointer transition-colors"
              >
                <svg
                  width="18"
                  height="20"
                  viewBox="0 0 11 13"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10.5 6.5V7.5C10.5 8.82608 9.97322 10.0979 9.03553 11.0355C8.09785 11.9732 6.82608 12.5 5.5 12.5C4.17392 12.5 2.90215 11.9732 1.96447 11.0355C1.02678 10.0979 0.5 8.82608 0.5 7.5V3.83333C0.5 2.94928 0.851189 2.10143 1.47631 1.47631C2.10143 0.851189 2.94928 0.5 3.83333 0.5C4.71739 0.5 5.56523 0.851189 6.19036 1.47631C6.81548 2.10143 7.16667 2.94928 7.16667 3.83333V7.5C7.16667 7.94203 6.99107 8.36595 6.67851 8.67851C6.36595 8.99107 5.94203 9.16667 5.5 9.16667C5.05797 9.16667 4.63405 8.99107 4.32149 8.67851C4.00893 8.36595 3.83333 7.94203 3.83333 7.5V4.83333"
                    stroke="black"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <span className="inter-regular text-[15px] text-[#000000]">
                  Has attachments
                </span>
              </div>

              {/* Has invites */}
              <div
                onClick={handleHasInvitesClick}
                className="px-[16px] py-[10px] flex flex-row items-center gap-[14px] hover:bg-[#F5F5F5] cursor-pointer transition-colors"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 13 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9.16667 0.5V3.16667M3.83333 0.5V3.16667M0.5 5.83333H12.5M7.16667 1.83333H5.83333C3.31933 1.83333 2.062 1.83333 1.28133 2.61467C0.500667 3.396 0.5 4.65267 0.5 7.16667V8.5C0.5 11.014 0.5 12.2713 1.28133 13.052C2.06267 13.8327 3.31933 13.8333 5.83333 13.8333H7.16667C9.68067 13.8333 10.938 13.8333 11.7187 13.052C12.4993 12.2707 12.5 11.014 12.5 8.5V7.16667C12.5 4.65267 12.5 3.39533 11.7187 2.61467C10.9373 1.834 9.68067 1.83333 7.16667 1.83333Z"
                    stroke="black"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6.49701 8.5H6.50234M6.49701 11.1667H6.50234M9.16034 8.5H9.16634M3.83301 8.5H3.83901M3.83301 11.1667H3.83901"
                    stroke="black"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <span className="inter-regular text-[15px] text-[#000000]">
                  Has invites
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Sort Dropdown Container */}
        <div className="relative flex items-center pr-[15px]" ref={sortRef}>
          <div 
            className={`flex justify-center items-center w-[24px] h-[24px] cursor-pointer rounded-full transition-colors ${isSortOpen ? "bg-[#F5F5F5]" : "hover:bg-[#F5F5F5]"}`}
            onClick={() => setIsSortOpen(!isSortOpen)}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.41667 4.66667H11.0833M6.41667 7H9.33333M6.41667 9.33333H8.16667M6.41667 2.33333H12.25M3.20833 12.25V1.75M3.20833 12.25C2.8 12.25 2.037 11.0868 1.75 10.7917M3.20833 12.25C3.61667 12.25 4.37967 11.0868 4.66667 10.7917"
                stroke={isSortOpen ? "#6A37F5" : "#040B23"}
                strokeWidth="0.875"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {isSortOpen && (
             <div className="absolute top-[24px] right-[10px] z-50 w-[180px] bg-white rounded-[10px] shadow-[0px_4px_24px_rgba(0,0,0,0.12)] border border-[#EAEAEA] py-[8px] flex flex-col">
               <div className="px-[12px] py-[6px] text-[10px] text-[#767676] inter-medium uppercase tracking-wider">Sort By</div>
               {["Date", "Subject"].map((criteria) => (
                 <div
                   key={criteria}
                   onClick={() => {
                     if (sortCriteria === criteria) {
                       setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                     } else {
                       setSortCriteria(criteria);
                       setSortOrder(criteria === "Date" ? "desc" : "asc");
                     }
                     setIsSortOpen(false);
                   }}
                   className="px-[12px] py-[8px] flex justify-between items-center hover:bg-[#F5F5F5] cursor-pointer"
                 >
                   <span className={`inter-regular text-[13px] ${sortCriteria === criteria ? "text-[#6A37F5] inter-medium" : "text-[#000000]"}`}>
                     {criteria}
                   </span>
                   {sortCriteria === criteria && (
                     <span className="text-[10px] text-[#6A37F5]">
                       {sortOrder === "asc" ? "▲" : "▼"}
                     </span>
                   )}
                 </div>
               ))}
               <div className="border-t border-[#EAEAEA] my-[4px]"></div>
               <div className="px-[12px] py-[6px] text-[10px] text-[#767676] inter-medium uppercase tracking-wider">Order</div>
               <div 
                 onClick={() => { setSortOrder("asc"); setIsSortOpen(false); }}
                 className="px-[12px] py-[8px] flex justify-between items-center hover:bg-[#F5F5F5] cursor-pointer"
               >
                 <span className={`inter-regular text-[13px] ${sortOrder === "asc" ? "text-[#6A37F5] inter-medium" : "text-[#000000]"}`}>Oldest on Top</span>
               </div>
               <div 
                 onClick={() => { setSortOrder("desc"); setIsSortOpen(false); }}
                 className="px-[12px] py-[8px] flex justify-between items-center hover:bg-[#F5F5F5] cursor-pointer"
               >
                 <span className={`inter-regular text-[13px] ${sortOrder === "desc" ? "text-[#6A37F5] inter-medium" : "text-[#000000]"}`}>Newest on Top</span>
               </div>
             </div>
          )}
        </div>
      </div>

      <div className="relative flex flex-col min-h-0 flex-1 gap-[6px] pt-[12px] pb-[140px] overflow-y-auto scrollbar-hide">
        {filteredMails.length > 0 ? (
          filteredMails.map((mail, index) => {
            const currentDate = new Date(mail.date).toDateString();
            const previousDate =
              index > 0
                ? new Date(filteredMails[index - 1].date).toDateString()
                : null;

            const showDateHeader = currentDate !== previousDate;
            const isUnread = !(mail.isRead !== undefined ? mail.isRead : mail.is_read);

            return (
              <React.Fragment key={`${mail.id}-${mail.is_favorite ?? false}`}>
                <div className="relative">
                  {showDateHeader && (
                    <div className="absolute top-[-8px] left-1/2 transform -translate-x-1/2 w-[108px] h-[16px] px-[10px] py-[4px] gap-[10px] rounded-[8px] bg-[#FFFFFF] shadow-[0px_1px_3.8px_0px_#00000040] flex items-center justify-center z-10">
                      <span className="inter-medium text-[7px] text-[#6A37F5]">
                        {formatGroupDate(mail.date)}
                      </span>
                    </div>
                  )}
                  <div
                    onClick={() => {
                      if (selectedMailbox === "drafts") {
                        setDraftData(mail);
                        setIsComposeOpen(true);
                      } else {
                        setSelectedMail(mail);
                      }
                    }}
                    className={`relative cursor-pointer flex justify-between w-full min-h-[98px] px-[12px] py-[15px] rounded-[6px] border border-[#EAEAEA] transition-all duration-300 ease-in-out hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-[1px] hover:translate-x-[2px]
                ${
                  selectedMail?.id === mail.id
                    ? "bg-[#E6E8F0]"
                    : isUnread
                      ? "bg-[#F4F8FF] hover:bg-[#EBF1FF]"
                      : "bg-[#FFFFFF] hover:bg-[#F8F9FA]"
                }`}
                  >
                    {isUnread && (
                      <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#6A37F5] rounded-l-[5px]"></div>
                    )}
                    {showProfilePhotos && (
                    <div className="relative w-[26px] h-[26px]">
                      <img
                        src={
                          index === 1
                            ? profileimage
                            : index === 2
                              ? profileimage2
                              : index === 3
                                ? profileimage3
                                : index === 4
                                  ? profileimage4
                                  : profileimage1
                        }
                        alt="Profile"
                        className="w-[26px] h-[26px]"
                      />
                      {/* <svg
                        width="8"
                        height="8"
                        viewBox="0 0 8 8"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="absolute bottom-0 right-0"
                      >
                        <circle cx="4" cy="4" r="4" fill="#50C878" />
                      </svg> */}
                      <div className="absolute bottom-[-1px] right-[-1px] z-10">
                        {statusObj?.icon}
                      </div>
                    </div> )}

                    <div className="flex flex-col flex-1  min-w-0 gap-[5px] mx-[10px]">
                      <div className="flex flex-row justify-between items-center w-[218px] h-[18px]">
                        <span className="inter-regular text-[10px] text-[#767676]">
                          {getDisplayEmail(mail)}
                        </span>
                      </div>
                      <span
                        className={`block w-full overflow-hidden whitespace-nowrap text-ellipsis text-[12px] mt-[0px] transition-colors duration-300 ${
                          isUnread
                            ? "inter-bold text-[#040B23]"
                            : "inter-medium text-[#575757]"
                        }`}
                        title={mail.subject}
                      >
                        {mail.subject}
                      </span>
                      {mail.body && (
                        <span className="inter-regular text-[10px] text-[#B6B6B6] mt-[0px] leading-[15px] line-clamp-2">
                          {StripHtml(mail.body)}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col justify-between items-end w-[32px] h-[70px]">
                      <span className="inter-regular text-[8px] text-[#767676] ml-[-20px] whitespace-nowrap">
                        {new Date(mail.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      {mail.is_important && (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M6.52918 10.5297L3.27918 13.7797C3.21051 13.8534 3.12771 13.9125 3.03572 13.9535C2.94372 13.9945 2.8444 14.0165 2.7437 14.0183C2.643 14.0201 2.54297 14.0016 2.44958 13.9638C2.35619 13.9261 2.27136 13.87 2.20014 13.7988C2.12892 13.7275 2.07278 13.6427 2.03505 13.5493C1.99733 13.4559 1.97881 13.3559 1.98059 13.2552C1.98236 13.1545 2.0044 13.0552 2.0454 12.9632C2.08639 12.8712 2.14549 12.7884 2.21918 12.7197L5.46918 9.46973L6.52918 10.5297Z"
                            fill="url(#paint0_linear_4761_3272)"
                          />
                          <path
                            d="M10.0574 2.44505C9.89185 2.27891 9.68962 2.15391 9.46698 2.0801C9.24433 2.0063 9.00748 1.98573 8.77544 2.02006C8.54341 2.05439 8.32266 2.14265 8.13092 2.27777C7.93919 2.41288 7.78181 2.59108 7.67143 2.79805L5.65143 6.58805L2.84043 7.52605C2.75951 7.55293 2.68681 7.60005 2.62924 7.66294C2.57167 7.72584 2.53113 7.80241 2.51149 7.88538C2.49185 7.96835 2.49376 8.05497 2.51702 8.137C2.54029 8.21903 2.58415 8.29375 2.64443 8.35405L7.64443 13.354C7.70473 13.4143 7.77945 13.4582 7.86148 13.4815C7.94351 13.5047 8.03013 13.5066 8.1131 13.487C8.19607 13.4673 8.27264 13.4268 8.33554 13.3692C8.39843 13.3117 8.44555 13.239 8.47243 13.158L9.40943 10.347L13.1884 8.32405C13.3944 8.21355 13.5717 8.05644 13.7062 7.86526C13.8407 7.67409 13.9286 7.45412 13.963 7.22293C13.9974 6.99173 13.9773 6.7557 13.9042 6.53366C13.8312 6.31161 13.7073 6.10971 13.5424 5.94405L10.0574 2.44505Z"
                            fill="url(#paint1_linear_4761_3272)"
                          />
                          <path
                            d="M10.0574 2.44505C9.89185 2.27891 9.68962 2.15391 9.46698 2.0801C9.24433 2.0063 9.00748 1.98573 8.77544 2.02006C8.54341 2.05439 8.32266 2.14265 8.13092 2.27777C7.93919 2.41288 7.78181 2.59108 7.67143 2.79805L5.65143 6.58805L2.84043 7.52605C2.75951 7.55293 2.68681 7.60005 2.62924 7.66294C2.57167 7.72584 2.53113 7.80241 2.51149 7.88538C2.49185 7.96835 2.49376 8.05497 2.51702 8.137C2.54029 8.21903 2.58415 8.29375 2.64443 8.35405L7.64443 13.354C7.70473 13.4143 7.77945 13.4582 7.86148 13.4815C7.94351 13.5047 8.03013 13.5066 8.1131 13.487C8.19607 13.4673 8.27264 13.4268 8.33554 13.3692C8.39843 13.3117 8.44555 13.239 8.47243 13.158L9.40943 10.347L13.1884 8.32405C13.3944 8.21355 13.5717 8.05644 13.7062 7.86526C13.8407 7.67409 13.9286 7.45412 13.963 7.22293C13.9974 6.99173 13.9773 6.7557 13.9042 6.53366C13.8312 6.31161 13.7073 6.10971 13.5424 5.94405L10.0574 2.44505Z"
                            fill="url(#paint2_radial_4761_3272)"
                            fillOpacity="0.8"
                          />
                          <defs>
                            <linearGradient
                              id="paint0_linear_4761_3272"
                              x1="3.13218"
                              y1="12.8667"
                              x2="8.98518"
                              y2="8.20073"
                              gradientUnits="userSpaceOnUse"
                            >
                              <stop offset="0.114" stopColor="#7B7BFF" />
                              <stop offset="0.559" stopColor="#102784" />
                            </linearGradient>
                            <linearGradient
                              id="paint1_linear_4761_3272"
                              x1="2.90843"
                              y1="4.15905"
                              x2="10.8424"
                              y2="12.392"
                              gradientUnits="userSpaceOnUse"
                            >
                              <stop stopColor="#43E5CA" />
                              <stop offset="1" stopColor="#1384B1" />
                            </linearGradient>
                            <radialGradient
                              id="paint2_radial_4761_3272"
                              cx="0"
                              cy="0"
                              r="1"
                              gradientUnits="userSpaceOnUse"
                              gradientTransform="translate(11.3649 11.2299) rotate(47.615) scale(5.10742 12.8119)"
                            >
                              <stop stopColor="#E362F8" />
                              <stop
                                offset="1"
                                stopColor="#9966FF"
                                stopOpacity="0"
                              />
                            </radialGradient>
                          </defs>
                        </svg>
                      )}

                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStar(mail.id);
                        }}
                        className="cursor-pointer"
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 10 10"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g clipPath="url(#clip0_1209_1358)">
                            <path
                              d="M5.72048 1.43457L6.45381 2.91332C6.55381 3.11915 6.82048 3.31665 7.04548 3.35415L8.37423 3.57707C9.22423 3.71999 9.42423 4.34165 8.81173 4.95499L7.77839 5.99665C7.60339 6.1729 7.50756 6.51332 7.56173 6.75707L7.85756 8.04665C8.09089 9.06749 7.55339 9.46207 6.65756 8.92874L5.41173 8.18499C5.18673 8.05082 4.81589 8.05082 4.58673 8.18499L3.34173 8.92874C2.45006 9.46207 1.90839 9.0629 2.14173 8.04665L2.43756 6.75707C2.49173 6.51332 2.39589 6.1729 2.22089 5.99665L1.18756 4.95499C0.579644 4.34124 0.775477 3.71999 1.62506 3.57707L2.95423 3.35415C3.17506 3.31665 3.44173 3.11915 3.54173 2.91332L4.27506 1.43457C4.67506 0.632487 5.32506 0.632487 5.72089 1.43457"
                              stroke={mail.is_favorite ? "#FFB800" : "#727272"}
                              fill={mail.is_favorite ? "#FFB800" : "none"}
                              strokeWidth="0.909091"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_1209_1358">
                              <rect width="10" height="10" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full mt-[40px]">
            <span className="inter-regular text-[13px] text-[#767676]">
              We didn't find anything to show here.
            </span>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 w-full h-[87px] bg-gradient-to-b from-[rgba(255,255,255,0.19)] to-[#575757]" />
      <button
        className="absolute z-10 bottom-[20px] left-1/2 transform -translate-x-1/2 w-[132px] h-[36px] rounded-[18px] bg-[#040B23] shadow-[0px_4px_4px_0px_#49494959,0.35] flex flex-row items-center justify-center gap-[8px] cursor-pointer hover:bg-[#1a2340] transition-colors"
        onClick={() => {
          setDraftData(null);
          setIsComposeOpen(true);
        }}
      >
        <span className="inter-regular mr-[25px] text-[11px] text-[#FFFFFF]">
          Compose New
        </span>
        <div
          className="absolute left-[98px] w-[30px] h-[30px] rounded-[18px] bg-[#FFFFFF1F] flex items-center justify-center transition-transform duration-300">
          <ArrowIcon color="white" direction={isComposeOpen?"up":"down"}/>
        </div>
      </button>
   </div>
  );
};
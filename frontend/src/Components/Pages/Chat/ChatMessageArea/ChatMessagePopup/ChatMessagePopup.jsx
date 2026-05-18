import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from "react-dom";
import { useCallback } from "react";

const PopupMenuPositioner = ({ isSender, children, buttonRef, onClose }) => {
  const [style, setStyle] = useState({});
  const [ready, setReady] = useState(false);
  const scrollContainerRef = useRef(null);

  const calculatePosition = useCallback(() => {
    const chatContainer = document.querySelector('.chat-scroll-area');
    if (!chatContainer) return null;

    const containerRect = chatContainer.getBoundingClientRect();
    if (!buttonRef?.current) return null;

    const rect = buttonRef.current.getBoundingClientRect();

    if (rect.top < 0 || rect.bottom > window.innerHeight) {
      return null;
    }

    const popupWidth = 159;
    const popupHeight = 290;
    const margin = 8;

    const spaceBelow = containerRect.bottom - rect.bottom;
    const spaceAbove = rect.top - containerRect.top;

    let top;
    if (spaceBelow >= popupHeight + margin) {
      top = rect.bottom + margin;
    } else if (spaceAbove >= popupHeight + margin) {
      top = rect.top - popupHeight - margin;
    } else {
      top = Math.max(
        containerRect.top + margin,
        Math.min(rect.bottom + margin, containerRect.bottom - popupHeight - margin)
      );
    }

    let left;
    if (isSender) {
      left = rect.right - popupWidth;
    } else {
      left = rect.left;
    }

    left = Math.max(
      containerRect.left + margin,
      Math.min(left, containerRect.right - popupWidth - margin)
    );

    return { position: 'fixed', top, left, zIndex: 9999 };
  }, [buttonRef, isSender]);

  useEffect(() => {
    const newStyle = calculatePosition();
    if (newStyle) {
      setStyle(newStyle);
      setReady(true);
    }
  }, [calculatePosition]);

  useEffect(() => {
    const findScrollParent = (el) => {
      if (!el) return window;
      const style = getComputedStyle(el);
      const overflow = style.overflow + style.overflowY;
      if (overflow.includes('auto') || overflow.includes('scroll')) return el;
      return findScrollParent(el.parentElement);
    };

    const scrollParent = findScrollParent(buttonRef?.current?.parentElement);
    scrollContainerRef.current = scrollParent;

    const handleScroll = () => {
      if (onClose) onClose();
    };

    scrollParent.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    
    return () => {
      scrollParent.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [buttonRef, onClose]);

  if (!ready) return null;

  return ReactDOM.createPortal(
    <div style={style} className="w-[159px]">
      {children}
    </div>,
    document.body
  );
};

// Three-dot menu popup
const ChatMessagePopup = ({ show, anchorRef, onClose, chatId }) => {
  const popupRef = useRef(null);

  useEffect(() => {
    if (!show) return;
    
    function handleClickOutside(event) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target)
      ) {
        onClose();
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, onClose, anchorRef]);

  if (!show) return null;

  return (
    <div
      ref={popupRef}
      className="fixed z-[9999] bg-white border border-[#EAEAEA] shadow-[0px_0px_8px_0px_#00000040] rounded-lg flex flex-col"
      style={{ width: 195, top: 201, left: 860 }}
    >
      <div className="flex flex-col w-full">
        <div
          className="w-full h-[44px] flex flex-row items-center px-[10px] gap-[10px] opacity-100 border-b border-[#D9D9D9] cursor-pointer hover:bg-gray-100"
          onClick={() => {
            let resolvedChatId = chatId;
            if (!resolvedChatId) {
              const match = window.location.pathname.match(/^\/chat\/([^/]+)(?:\/minimal)?$/);
              if (match && match[1] !== 'minimal') {
                resolvedChatId = match[1];
              }
            }
            let url = window.location.origin + '/chat';
            if (resolvedChatId) {
              url += `/${resolvedChatId}/minimal`;
            } else {
              url += '/minimal';
            }
            window.open(url, '_blank', 'noopener');
            onClose();
          }}
        >
          <div className="flex items-center p-[10px] gap-[10px]">
            <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.5 8V16.625C15.5 16.8712 15.4515 17.115 15.3573 17.3425C15.263 17.57 15.1249 17.7767 14.9508 17.9508C14.7767 18.1249 14.57 18.263 14.3425 18.3573C14.115 18.4515 13.8712 18.5 13.625 18.5H2.375C1.87772 18.5 1.40081 18.3025 1.04917 17.9508C0.697544 17.5992 0.5 17.1223 0.5 16.625V5.375C0.5 4.87772 0.697544 4.40081 1.04917 4.04917C1.40081 3.69754 1.87772 3.5 2.375 3.5H10.2256M13.25 0.5H18.5V5.75M8 11L18.125 0.875" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="inter-regular text-[12px] whitespace-nowrap">Open in New Window</span>
        </div>
        
        <div className="w-full h-[44px] flex flex-row items-center px-[10px] gap-[10px] opacity-100 border-b border-[#D9D9D9] cursor-pointer hover:bg-gray-100">
          <div className="flex items-center p-[10px] gap-[10px]">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 19H5C3.93913 19 2.92172 18.5786 2.17157 17.8284C1.42143 17.0783 1 16.0609 1 15V6C1 4.93913 1.42143 3.92172 2.17157 3.17157C2.92172 2.42143 3.93913 2 5 2H16C17.0609 2 18.0783 2.42143 18.8284 3.17157C19.5786 3.92172 20 4.93913 20 6V9M7 1V3M14 1V3M1 7H20M17.5 14.643L16 16.143" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 21C18.7614 21 21 18.7614 21 16C21 13.2386 18.7614 11 16 11C13.2386 11 11 13.2386 11 16C11 18.7614 13.2386 21 16 21Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="inter-regular text-[12px] whitespace-nowrap">Schedule Meeting</span>
        </div>
        
        <div className="w-full h-[44px] flex flex-row items-center px-[10px] gap-[10px] opacity-100 border-b border-[#D9D9D9] cursor-pointer hover:bg-gray-100">
          <div className="flex items-center p-[10px] gap-[10px]">
            <svg width="20" height="22" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 7V16C20 17.1 19.1 18 18 18H4L0 22V4C0 2.9 0.9 2 2 2H12.1C12 2.3 12 2.7 12 3C12 3.3 12 3.7 12.1 4H2V16H18V7.9C18.7 7.8 19.4 7.4 20 7ZM14 3C14 4.7 15.3 6 17 6C18.7 6 20 4.7 20 3C20 1.3 18.7 0 17 0C15.3 0 14 1.3 14 3Z" fill="black"/>
            </svg>
          </div>
          <span className="inter-regular text-[12px] whitespace-nowrap">Mark As Unread</span>
        </div>
        
        <div className="w-full h-[44px] flex flex-row items-center px-[10px] gap-[10px] opacity-100 border-b border-[#D9D9D9] cursor-pointer hover:bg-gray-100">
          <div className="flex items-center p-[10px] gap-[10px]">
            <svg width="20" height="22" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 15H2V16H1V15ZM3 15H2V13H3V7H4V5H5V4H6V3H8V2H9V0H11V2H12V3H14V4H13V5H12V4H8V5H6V7H5V13H4V14H3V15ZM0 16H1V17H0V16ZM13 19V21H12V22H8V21H7V19H13ZM19 16H20V17H19V18H7V17H8V16H17V15H16V13H15V9H16V8H17V13H18V15H19V16ZM20 2V3H19V4H18V5H17V6H16V7H15V8H14V9H13V10H12V11H11V12H10V13H9V14H8V15H7V16H6V17H5V18H4V19H3V20H2V21H1V20H0V19H1V18H2V17H3V16H4V15H5V14H6V13H7V12H8V11H9V10H10V9H11V8H12V7H13V6H14V5H15V4H16V3H17V2H18V1H19V2H20Z" fill="black"/>
            </svg>
          </div>
          <span className="inter-regular text-[12px] whitespace-nowrap">Mute</span>
        </div>
        
        <div className="w-full h-[44px] flex flex-row items-center px-[10px] gap-[10px] opacity-100 cursor-pointer hover:bg-gray-100">
          <div className="flex items-center justify-center p-[10px] gap-[10px]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 18V19.5H16.4297L18.9023 21.9727L17.8477 23.0273L13.5703 18.75L17.8477 14.4727L18.9023 15.5273L16.4297 18H24ZM15.1406 12.9258L14.1094 14.0156C13.4141 13.3594 12.6289 12.8594 11.7539 12.5156C10.8789 12.1719 9.96094 12 9 12C8.3125 12 7.64844 12.0898 7.00781 12.2695C6.36719 12.4492 5.76953 12.6992 5.21484 13.0195C4.66016 13.3398 4.15625 13.7305 3.70312 14.1914C3.25 14.6523 2.85938 15.1602 2.53125 15.7148C2.20312 16.2695 1.94922 16.8672 1.76953 17.5078C1.58984 18.1484 1.5 18.8125 1.5 19.5H0C0 18.5859 0.136719 17.6914 0.410156 16.8164C0.683594 15.9414 1.07812 15.1328 1.59375 14.3906C2.10938 13.6484 2.72266 12.9883 3.43359 12.4102C4.14453 11.832 4.9375 11.3906 5.8125 11.0859C5.375 10.8047 4.98438 10.4805 4.64062 10.1133C4.29688 9.74609 4 9.34375 3.75 8.90625C3.5 8.46875 3.31641 8.00781 3.19922 7.52344C3.08203 7.03906 3.01562 6.53125 3 6C3 5.17188 3.15625 4.39453 3.46875 3.66797C3.78125 2.94141 4.20703 2.30469 4.74609 1.75781C5.28516 1.21094 5.92188 0.78125 6.65625 0.46875C7.39062 0.15625 8.17188 0 9 0C9.82812 0 10.6055 0.15625 11.332 0.46875C12.0586 0.78125 12.6953 1.20703 13.2422 1.74609C13.7891 2.28516 14.2188 2.92188 14.5312 3.65625C14.8438 4.39062 15 5.17188 15 6C15 7.07031 14.7539 8.03906 14.2617 8.90625C13.7695 9.77344 13.0781 10.5 12.1875 11.0859C12.7344 11.2891 13.2539 11.5469 13.7461 11.8594C14.2383 12.1719 14.7031 12.5273 15.1406 12.9258ZM4.5 6C4.5 6.625 4.61719 7.20703 4.85156 7.74609C5.08594 8.28516 5.40625 8.76172 5.8125 9.17578C6.21875 9.58984 6.69531 9.91406 7.24219 10.1484C7.78906 10.3828 8.375 10.5 9 10.5C9.61719 10.5 10.1992 10.3828 10.7461 10.1484C11.293 9.91406 11.7695 9.59375 12.1758 9.1875C12.582 8.78125 12.9062 8.30469 13.1484 7.75781C13.3906 7.21094 13.5078 6.625 13.5 6C13.5 5.38281 13.3828 4.80078 13.1484 4.25391C12.9141 3.70703 12.5938 3.23047 12.1875 2.82422C11.7812 2.41797 11.3008 2.09375 10.7461 1.85156C10.1914 1.60938 9.60938 1.49219 9 1.5C8.375 1.5 7.79297 1.61719 7.25391 1.85156C6.71484 2.08594 6.23828 2.40625 5.82422 2.8125C5.41016 3.21875 5.08594 3.69922 4.85156 4.25391C4.61719 4.80859 4.5 5.39062 4.5 6Z" fill="black"/>
            </svg>
          </div>
          <span className="inter-regular text-[12px] whitespace-nowrap">Leave</span>
        </div>
      </div>
    </div>
  );
};

export const ParticipantsPanel = ({
  groupMembers,
  groupMemberDetails = [],
  groupOnlineEmails,
  memberQuery,
  setMemberQuery,
  memberSearchResults,
  isAddingMember,
  handleAddMember,
  isLeavingGroup,
  handleLeaveGroup,
  stringToPastelColor,
  stringToDarkColor
}) => {
  const [searchResults, setSearchResults] = useState(memberSearchResults);

  useEffect(() => {
    setSearchResults(memberSearchResults);
  }, [memberSearchResults]);

  const handleSearchChange = (e) => {
    setMemberQuery(e.target.value);
  };

  const handleAddClick = (email) => {
    handleAddMember(email);
  };

  // Use groupMemberDetails if available, otherwise fall back to groupMembers
  const participants = (Array.isArray(groupMemberDetails) && groupMemberDetails.length > 0) 
    ? groupMemberDetails 
    : groupMembers;

  return (
    <div className="mt-3">
      
      {/* Show search results only when searching */}
      {memberQuery.length > 0 && searchResults.length > 0 && (
        <div className="mt-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md">
          {searchResults.map((user) => (
            <div
              key={user.email}
              className="flex items-center justify-between px-3 py-2 hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                {user.profile_image ? (
                  <img
                    src={user.profile_image}
                    alt={user.first_name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold uppercase"
                    style={{
                      backgroundColor: stringToPastelColor(user.email),
                      color: stringToDarkColor(user.email)
                    }}
                  >
                    {(user.first_name?.[0] || user.email?.[0] || 'U')}
                  </div>
                )}
                <span className="text-sm">
                  {user.first_name} {user.last_name}
                </span>
                <span className="text-xs text-gray-500">{user.email}</span>
              </div>
              <button
                onClick={() => handleAddClick(user.email)}
                disabled={isAddingMember}
                className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          ))}
        </div>
      )}

      {memberQuery.length >= 1 && searchResults.length === 0 && (
        <div className="mt-2 text-sm text-gray-500 text-center py-2">
          No users found
        </div>
      )}
    </div>
  );
};

export const MessageActionPopup = ({
  menuKey,
  menuRefs,
  buttonRefs,
  onClose,
  onForward,
  onStar,
  onReply,
  onCopyLink,
  onSave,
  onPin,
  onMarkUnread,
  onShare,
  isStarred,
  isStarring,
  messageId,
  canEdit,
  onEdit,
  canDelete,
  onDelete,
  isDeleting,
  isSender
}) => {
  return (
    <PopupMenuPositioner isSender={isSender} buttonRef={{ current: buttonRefs.current[menuKey] }} onClose={onClose}>
      <div
        ref={el => menuRefs.current[menuKey] = el}
        className="bg-[white] border border-[#E8E8E8] rounded-lg shadow-lg"
        style={{
          width: 159,
          height: 290,
          opacity: 1,
          borderWidth: 1,
          borderRadius: 8,
          background: '#FFFFFF',
          border: '1px solid #E8E8E8',
          boxShadow: '0px 4px 4px 0px #A0A0A040',
          zIndex: 1000,
        }}
      >
        <div className="flex flex-col h-full p-2">
          <button 
            className="w-full text-left py-1.5 px-2 rounded hover:bg-gray-100 inter-regular text-[12px] flex items-center gap-2 whitespace-nowrap"
            onClick={onReply}
          >
            <span className="flex items-center">
              <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.1665 12.5V11.1153C11.1665 9.782 11.1665 9.11467 11.0698 8.55667C10.5365 5.484 7.89517 3.07467 4.5285 2.58867C3.9165 2.5 2.6285 2.5 1.1665 2.5" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2.5 0.5C2.09533 0.893333 0.5 1.94 0.5 2.5C0.5 3.06 2.09533 4.10667 2.5 4.5" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            Reply
          </button>
          
          <button
            className="w-full text-left py-1.5 px-2 rounded hover:bg-gray-100 inter-regular text-[12px] flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
            onClick={onForward}
            disabled={!messageId}
          >
            <span className="flex items-center">
              <svg width="13" height="12" viewBox="0 0 13 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.16667 3.50031H7.5V0.964306C7.49994 0.870965 7.52803 0.779774 7.58061 0.702648C7.63318 0.625522 7.7078 0.566045 7.7947 0.531988C7.88161 0.497931 7.97677 0.490877 8.06775 0.511747C8.15873 0.532618 8.24129 0.580442 8.30467 0.648973L12.2733 4.92231C12.4192 5.0793 12.5003 5.28567 12.5003 5.49997C12.5003 5.71428 12.4192 5.92064 12.2733 6.07764L8.30467 10.3523C8.24126 10.4209 8.15863 10.4687 8.06758 10.4896C7.97654 10.5104 7.88133 10.5033 7.79439 10.4692C7.70746 10.435 7.63285 10.3754 7.58032 10.2982C7.5278 10.221 7.4998 10.1297 7.5 10.0363V7.50031C3.79733 7.50031 1.798 10.1776 1.29467 10.957C1.25426 11.0205 1.19867 11.073 1.1329 11.1096C1.06714 11.1463 0.993285 11.166 0.918001 11.167C0.863052 11.167 0.808642 11.1561 0.757885 11.1351C0.707127 11.114 0.661017 11.0832 0.622194 11.0443C0.58337 11.0054 0.552595 10.9593 0.531627 10.9085C0.51066 10.8577 0.499913 10.8033 0.500001 10.7483V10.167C0.500001 6.48497 3.48467 3.50031 7.16667 3.50031Z" stroke="black" strokeLinejoin="round"/>
              </svg>
            </span>
            Forward
          </button>
          
          <hr className="my-2 border-t border-[#E8E8E8]" />
          
          <button 
            className="w-full text-left py-1.5 px-2 rounded hover:bg-gray-100 inter-regular text-[12px] flex items-center gap-2 whitespace-nowrap"
            onClick={onCopyLink}
          >
            <span className="flex items-center">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.1665 9.16699C5.1665 7.28166 5.1665 6.33833 5.7525 5.75299C6.33784 5.16699 7.28117 5.16699 9.1665 5.16699H9.83317C11.7185 5.16699 12.6618 5.16699 13.2472 5.75299C13.8332 6.33833 13.8332 7.28166 13.8332 9.16699V9.83366C13.8332 11.719 13.8332 12.6623 13.2472 13.2477C12.6618 13.8337 11.7185 13.8337 9.83317 13.8337H9.1665C7.28117 13.8337 6.33784 13.8337 5.7525 13.2477C5.1665 12.6623 5.1665 11.719 5.1665 9.83366V9.16699Z" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10.5 5.16667C10.498 3.19533 10.4687 2.174 9.89467 1.47467C9.78394 1.33977 9.66023 1.21606 9.52533 1.10533C8.78667 0.5 7.692 0.5 5.5 0.5C3.30867 0.5 2.21267 0.5 1.47467 1.10533C1.33977 1.21606 1.21606 1.33977 1.10533 1.47467C0.5 2.21333 0.5 3.308 0.5 5.5C0.5 7.69133 0.5 8.78733 1.10533 9.52533C1.21606 9.66023 1.33977 9.78394 1.47467 9.89467C2.17467 10.468 3.19467 10.4987 5.16667 10.5" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            Copy link
          </button>
          
          <button 
            className="w-full text-left py-1.5 px-2 rounded hover:bg-gray-100 inter-regular text-[12px] flex items-center gap-2 whitespace-nowrap"
            onClick={onSave}
          >
            <span className="flex items-center">
              <svg width="12" height="15" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.5 11.1533V5.63933C0.5 3.21667 0.5 2.006 1.28133 1.25267C2.06267 0.499333 3.31933 0.5 5.83333 0.5C8.34733 0.5 9.60467 0.5 10.3853 1.25267C11.1667 2.00467 11.1667 3.216 11.1667 5.63867V11.154C11.1667 12.6913 11.1667 13.46 10.6513 13.7347C9.65333 14.268 7.782 12.49 6.89333 11.9547C6.378 11.6447 6.12 11.4893 5.83333 11.4893C5.54667 11.4893 5.28867 11.6447 4.77333 11.9547C3.88467 12.49 2.01333 14.268 1.01533 13.7347C0.5 13.46 0.5 12.6913 0.5 11.154" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span> 
            Save this message
          </button>
          
          <button 
            className="w-full text-left py-1.5 px-2 rounded hover:bg-gray-100 inter-regular text-[12px] flex items-center gap-2 whitespace-nowrap"
            onClick={onPin}
          >
            <span className="flex items-center">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.5 12.5L3.83333 9.1667M7.33933 11.0807C4.84333 10.514 2.486 8.1567 1.91933 5.6607C1.82933 5.26603 1.78467 5.0687 1.91467 4.74803C2.044 4.42803 2.20333 4.32803 2.52067 4.13003C3.238 3.68203 4.01533 3.53937 4.82133 3.61003C5.95267 3.7107 6.51867 3.7607 6.80133 3.61337C7.08333 3.4667 7.27467 3.1227 7.65867 2.43537L8.144 1.56403C8.464 0.990699 8.624 0.703366 9.00067 0.568033C9.37733 0.432699 9.604 0.514699 10.0573 0.678699C10.5783 0.865775 11.0514 1.16577 11.4429 1.55718C11.8343 1.94859 12.1343 2.42173 12.3213 2.9427C12.4853 3.39603 12.5673 3.6227 12.432 3.99937C12.2967 4.37537 12.01 4.53537 11.436 4.85603L10.5447 5.3527C9.858 5.73537 9.51533 5.92737 9.368 6.21203C9.22133 6.49737 9.27467 7.0507 9.38133 8.15737C9.46 8.9707 9.32467 9.75337 8.87067 10.48C8.672 10.7974 8.57267 10.956 8.252 11.086C7.932 11.2154 7.73467 11.1707 7.33933 11.0807Z" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            Pin this message
          </button>
          
          <hr className="my-2 border-t border-[#E8E8E8]" />
          
          <button 
            className="w-full text-left py-1.5 px-2 rounded hover:bg-gray-100 inter-regular text-[12px] flex items-center gap-2 whitespace-nowrap"
            onClick={onMarkUnread}
          >
            <span className="flex items-center">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.83326 9.50033H9.49993M4.83326 6.16699H7.16659M6.16659 1.16699C6.01681 1.1741 5.86793 1.18233 5.71993 1.19166C2.93059 1.37766 0.709258 3.63433 0.526592 6.46766C0.491136 7.02821 0.491136 7.59044 0.526592 8.15099C0.593258 9.18299 1.04859 10.1377 1.58526 10.9443C1.89659 11.5097 1.69126 12.215 1.36659 12.831C1.13326 13.2743 1.01592 13.4963 1.10992 13.657C1.20326 13.817 1.41326 13.8223 1.83259 13.8323C2.66259 13.8523 3.22193 13.617 3.66593 13.289C3.91726 13.103 4.04326 13.0103 4.12993 12.9997C4.21659 12.989 4.38792 13.0597 4.72926 13.1997C5.03593 13.3263 5.39259 13.405 5.71926 13.4263C6.66926 13.4897 7.66192 13.4903 8.61392 13.4263C11.4026 13.241 13.6239 10.9843 13.8066 8.15099C13.842 7.59044 13.842 7.02821 13.8066 6.46766C13.7924 6.25255 13.767 6.04121 13.7306 5.83366" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10.8335 2.5H10.8395" stroke="black" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13.6968 2.22667C13.7882 2.34867 13.8335 2.41 13.8335 2.5C13.8335 2.59 13.7882 2.65133 13.6968 2.77333C13.2868 3.32 12.2402 4.5 10.8335 4.5C9.42683 4.5 8.38016 3.32 7.97016 2.77333C7.87883 2.65067 7.8335 2.58933 7.8335 2.5C7.8335 2.41067 7.87883 2.34867 7.97016 2.22667C8.38016 1.68 9.42683 0.5 10.8335 0.5C12.2402 0.5 13.2868 1.68 13.6968 2.22667Z" stroke="black"/>
              </svg>
            </span>
            Mark as unread
          </button>
          
          <button 
            className="w-full text-left py-1.5 px-2 rounded hover:bg-gray-100 inter-regular text-[12px] flex items-center gap-2 whitespace-nowrap"
            onClick={onShare}
          >
            <span className="flex items-center">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.31933 5.33333L8.65267 3.33333M4.31933 7L8.65267 9M12.5 2.5C12.5 3.03043 12.2893 3.53914 11.9142 3.91421C11.5391 4.28929 11.0304 4.5 10.5 4.5C9.96957 4.5 9.46086 4.28929 9.08579 3.91421C8.71071 3.53914 8.5 3.03043 8.5 2.5C8.5 1.96957 8.71071 1.46086 9.08579 1.08579C9.46086 0.710714 9.96957 0.5 10.5 0.5C11.0304 0.5 11.5391 0.710714 11.9142 1.08579C12.2893 1.46086 12.5 1.96957 12.5 2.5ZM4.5 6.16667C4.5 6.6971 4.28929 7.20581 3.91421 7.58088C3.53914 7.95595 3.03043 8.16667 2.5 8.16667C1.96957 8.16667 1.46086 7.95595 1.08579 7.58088C0.710714 7.20581 0.5 6.6971 0.5 6.16667C0.5 5.63623 0.710714 5.12753 1.08579 4.75245C1.46086 4.37738 1.96957 4.16667 2.5 4.16667C3.03043 4.16667 3.53914 4.37738 3.91421 4.75245C4.28929 5.12753 4.5 5.63623 4.5 6.16667ZM12.5 9.83333C12.5 10.3638 12.2893 10.8725 11.9142 11.2475C11.5391 11.6226 11.0304 11.8333 10.5 11.8333C9.96957 11.8333 9.46086 11.6226 9.08579 11.2475C8.71071 10.8725 8.5 10.3638 8.5 9.83333C8.5 9.3029 8.71071 8.79419 9.08579 8.41912C9.46086 8.04405 9.96957 7.83333 10.5 7.83333C11.0304 7.83333 11.5391 8.04405 11.9142 8.41912C12.2893 8.79419 12.5 9.3029 12.5 9.83333Z" stroke="black"/>
              </svg>
            </span>
            Share message
          </button>
          
          <button 
            className={`w-full text-left py-1.5 px-2 rounded hover:bg-gray-100 inter-regular text-[12px] flex items-center gap-2 whitespace-nowrap ${isStarring ? 'opacity-50 cursor-wait' : ''}`}
            onClick={onStar}
            disabled={isStarring}
          >
            <span className="flex items-center">
              {isStarring ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-1"></div>
              ) : (
                <svg width="15" height="12" viewBox="0 0 15 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M8.26151 1.25867C8.05684 1.52533 7.82418 1.94067 7.47818 2.56133L7.30284 2.87467L7.26884 2.93667C7.11218 3.21867 6.96684 3.48067 6.73084 3.66C6.49284 3.84067 6.20218 3.906 5.89751 3.974L5.83084 3.98933L5.49084 4.066C4.81751 4.21867 4.37151 4.32067 4.06884 4.44C3.77551 4.556 3.74551 4.638 3.73418 4.67333C3.72084 4.71533 3.70218 4.81 3.87884 5.09067C4.05884 5.376 4.36418 5.73533 4.82218 6.27067L5.05351 6.54133L5.09751 6.59333C5.30818 6.838 5.50084 7.06267 5.58951 7.34733C5.67751 7.63067 5.64818 7.92733 5.61618 8.254L5.60951 8.32267L5.57418 8.684C5.50484 9.39733 5.45951 9.878 5.47484 10.222C5.49018 10.5647 5.56151 10.6233 5.58484 10.6407L5.58551 10.6413C5.60218 10.6547 5.66484 10.7027 5.96284 10.6173C6.27484 10.528 6.69418 10.3367 7.32418 10.0467L7.64151 9.9L7.70551 9.87067C7.98951 9.73933 8.26151 9.61333 8.55951 9.61333C8.85751 9.61333 9.12951 9.73933 9.41284 9.87067L9.47751 9.9L9.79484 10.0467C10.4248 10.3367 10.8442 10.528 11.1562 10.6173C11.4542 10.7027 11.5162 10.6547 11.5328 10.6413L11.5342 10.6407C11.5575 10.6233 11.6288 10.5647 11.6442 10.222C11.6595 9.87867 11.6142 9.39733 11.5448 8.684L11.5102 8.32267L11.5035 8.254C11.4708 7.92733 11.4415 7.63067 11.5302 7.34733C11.6182 7.06267 11.8108 6.838 12.0215 6.59333L12.0655 6.54133L12.2968 6.27133C12.7548 5.73533 13.0602 5.376 13.2402 5.09067C13.4168 4.81 13.3975 4.71533 13.3848 4.674C13.3735 4.638 13.3442 4.556 13.0502 4.44067C12.7475 4.32067 12.3008 4.21867 11.6282 4.066L11.2882 3.98933L11.2215 3.974C10.9168 3.906 10.6262 3.84067 10.3882 3.66C10.1522 3.48067 10.0068 3.21867 9.85018 2.93667L9.81618 2.87467L9.64084 2.56133C9.29551 1.94133 9.06218 1.52533 8.85751 1.25867C8.65884 0.998667 8.57618 1 8.56084 1H8.55818C8.54284 1 8.46018 0.998667 8.26151 1.25867ZM7.46751 0.650667C7.72751 0.310667 8.06751 0 8.55951 0C9.05151 0 9.39218 0.311333 9.65151 0.650667C9.90618 0.982667 10.1742 1.46333 10.4948 2.03867L10.6895 2.388C10.9028 2.77133 10.9462 2.828 10.9922 2.86333C11.0362 2.89667 11.0935 2.92 11.5095 3.014L11.8895 3.1C12.5108 3.24 13.0335 3.35867 13.4168 3.51C13.8182 3.668 14.1948 3.91067 14.3395 4.37667C14.4828 4.83733 14.3182 5.25533 14.0862 5.62333C13.8628 5.97867 13.5082 6.39333 13.0828 6.89L13.0562 6.92067L12.8255 7.19133C12.5442 7.52 12.5042 7.582 12.4848 7.64467C12.4648 7.70933 12.4628 7.788 12.5048 8.22667L12.5442 8.62667C12.6082 9.29067 12.6622 9.84333 12.6428 10.2667C12.6235 10.6987 12.5248 11.144 12.1388 11.4373C11.7455 11.736 11.2915 11.6967 10.8808 11.5787C10.4855 11.4653 9.99618 11.24 9.41484 10.972L9.05884 10.8087C8.66818 10.6287 8.60951 10.6133 8.55951 10.6133C8.50951 10.6133 8.45084 10.6287 8.05951 10.8087L7.70351 10.9727C7.12284 11.24 6.63351 11.466 6.23818 11.5793C5.82751 11.696 5.37418 11.736 4.98018 11.4373C4.59351 11.144 4.49551 10.6987 4.47618 10.2667C4.45684 9.84333 4.51084 9.29067 4.57484 8.62667L4.61351 8.22667C4.65618 7.788 4.65484 7.70933 4.63484 7.64467C4.61484 7.582 4.57484 7.52 4.29351 7.19133L4.03618 6.89C3.61151 6.39333 3.25618 5.97867 3.03218 5.62333C2.80084 5.25533 2.63618 4.83733 2.77884 4.37667C2.92418 3.91067 3.30084 3.668 3.70218 3.51C4.08551 3.35867 4.60884 3.24067 5.22884 3.1L5.60951 3.01333C6.02551 2.92 6.08284 2.896 6.12684 2.86333C6.17351 2.828 6.21618 2.77133 6.42951 2.388L6.62418 2.03867C6.94551 1.46333 7.21284 0.982667 7.46751 0.650667ZM4.99684 1.30133C3.67618 0.921333 2.25884 1.12133 0.89151 1.92267L0.752843 2.004C0.696156 2.03718 0.633488 2.05887 0.568419 2.06783C0.503349 2.07679 0.437151 2.07285 0.373604 2.05623C0.310058 2.03961 0.250408 2.01063 0.19806 1.97096C0.145712 1.93128 0.101691 1.88169 0.0685099 1.825C0.0353292 1.76831 0.0136388 1.70565 0.00467719 1.64058C-0.00428446 1.57551 -0.000341861 1.50931 0.0162798 1.44576C0.0329015 1.38222 0.0618768 1.32256 0.101551 1.27022C0.141226 1.21787 0.190823 1.17385 0.24751 1.14067L0.386177 1.06C1.95951 0.138 3.65818 -0.125333 5.27418 0.34L5.41284 0.38C5.54032 0.416777 5.64797 0.502689 5.71211 0.618836C5.77625 0.734984 5.79162 0.871853 5.75484 0.999333C5.71807 1.12681 5.63215 1.23446 5.51601 1.2986C5.39986 1.36274 5.26299 1.37811 5.13551 1.34133L4.99684 1.30133ZM2.39084 4.45733C2.40211 4.5894 2.36048 4.72054 2.2751 4.82192C2.18971 4.92331 2.06757 4.98664 1.93551 4.998C1.83284 5.00667 1.75551 5.01133 1.68884 5.016C1.58952 5.0193 1.49058 5.02999 1.39284 5.048C1.26218 5.07333 1.09151 5.126 0.782843 5.28067C0.724035 5.3106 0.659883 5.3286 0.594087 5.33362C0.52829 5.33864 0.46215 5.33059 0.39948 5.30993C0.33681 5.28927 0.278849 5.25641 0.22894 5.21324C0.179031 5.17007 0.138161 5.11745 0.108685 5.05841C0.0792095 4.99937 0.0617121 4.93508 0.0572014 4.86925C0.0526908 4.80341 0.0612563 4.73734 0.082404 4.67483C0.103552 4.61232 0.136863 4.55462 0.180418 4.50505C0.223973 4.45548 0.27691 4.41502 0.336177 4.386C0.694177 4.20733 0.95351 4.114 1.20418 4.066C1.36884 4.034 1.53884 4.02333 1.69151 4.01267L1.85018 4.002C1.98224 3.99073 2.11338 4.03236 2.21477 4.11775C2.31615 4.20313 2.37948 4.32527 2.39084 4.45733ZM3.11218 8.404C2.72549 8.31275 2.32328 8.30927 1.93507 8.39384C1.54687 8.4784 1.18254 8.64885 0.868843 8.89267C0.817461 8.93505 0.758129 8.96673 0.694331 8.98587C0.630534 9.005 0.563557 9.01119 0.497332 9.00408C0.431108 8.99697 0.366971 8.97671 0.308688 8.94447C0.250406 8.91223 0.199151 8.86867 0.157935 8.81635C0.116718 8.76403 0.0863702 8.704 0.0686729 8.63979C0.0509757 8.57558 0.0462858 8.50848 0.0548785 8.44244C0.0634713 8.37639 0.0851735 8.31272 0.118711 8.25518C0.152248 8.19763 0.196945 8.14737 0.250177 8.10733C0.681834 7.77063 1.18353 7.53505 1.7183 7.41794C2.25307 7.30083 2.80731 7.30518 3.34018 7.43067C3.46637 7.46361 3.57469 7.54456 3.64205 7.65624C3.7094 7.76793 3.73045 7.90151 3.7007 8.02849C3.67095 8.15547 3.59277 8.26581 3.48282 8.33596C3.37288 8.40611 3.23987 8.43053 3.11218 8.404Z" fill={isStarred ? "#FFD700" : "black"}/>
                </svg>
              )}
            </span>
            {isStarring ? 'Starring...' : (isStarred ? 'Unstar message' : 'Star message')}
          </button>
        </div>
      </div>
    </PopupMenuPositioner>
  );
};

export const ForwardModal = ({
  show,
  onClose,
  forwardingMessage,
  forwardRooms,
  forwardRecipientQuery,
  forwardRecipientCompletedTokens,
  forwardRecipientActiveToken,
  forwardRecipientSuggestions,
  isForwardRoomsLoading,
  invalidForwardRecipientCount,
  validForwardRecipientIds,
  isForwardingMessage,
  forwardStatusMessage,
  forwardStatusType,
  onForwardRecipientInputChange,
  onRemoveForwardRecipientChip,
  onForwardRecipientInputKeyDown,
  onSelectForwardRecipientSuggestion,
  onConfirmForward,
  decodeForwardRecipientLabel,
  getForwardMessagePreview,
  forwardRecipientInputRef
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40 px-3">
      <div className="w-full max-w-[420px] rounded-[10px] bg-white border border-[#E6E6E6] shadow-xl">
        <div className="px-4 py-3 border-b border-[#EFEFEF]">
          <h3 className="text-[14px] font-semibold text-[#111111]">Forward message</h3>
          <p className="text-[11px] text-[#666666] mt-1">Add recipients and review the message preview.</p>
        </div>

        <div className="px-4 py-3">
          <div className="mb-3">
            <label className="block text-[11px] font-semibold text-[#4A4A4A] mb-1">Add recipients</label>
            <div
              className="w-full min-h-[32px] px-2 py-1 text-[11px] border border-[#E3E3E3] rounded-[6px] flex flex-wrap items-center gap-1"
              onClick={() => forwardRecipientInputRef.current?.focus()}
            >
              {forwardRecipientCompletedTokens.map((token, index) => (
                <span
                  key={`forward-chip-${token}-${index}`}
                  className="inline-flex items-center gap-1 rounded-full bg-[#EDF2FF] text-[#1A2A57] px-2 py-0.5"
                >
                  <span className="max-w-[170px] truncate">{decodeForwardRecipientLabel(token)}</span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRemoveForwardRecipientChip(index);
                    }}
                    className="text-[#51608A] hover:text-[#2B3866]"
                    aria-label={`Remove ${decodeForwardRecipientLabel(token)}`}
                  >
                    x
                  </button>
                </span>
              ))}
              <input
                ref={forwardRecipientInputRef}
                type="text"
                value={forwardRecipientActiveToken}
                onChange={(e) => onForwardRecipientInputChange(e.target.value)}
                onKeyDown={onForwardRecipientInputKeyDown}
                placeholder={forwardRecipientCompletedTokens.length > 0 ? '' : 'Enter name, email, group, or room id'}
                className="flex-1 min-w-[120px] bg-transparent outline-none"
              />
            </div>
            <div className="mt-1 text-[10px] text-[#7A7A7A]">
              Search by name, email, or group. Use comma-separated recipients.
            </div>
            {!isForwardRoomsLoading && forwardRecipientSuggestions.length > 0 && (
              <div className="mt-2 max-h-[140px] overflow-y-auto border border-[#EFEFEF] rounded-[6px] bg-white">
                {forwardRecipientSuggestions.slice(0, 8).map((suggestion) => {
                  const roomId = String(suggestion.roomId);
                  const suggestionLabel = suggestion.label;
                  return (
                    <button
                      key={`forward-suggestion-${roomId}`}
                      type="button"
                      onClick={() => onSelectForwardRecipientSuggestion(suggestion)}
                      className="w-full text-left px-2 py-1.5 border-b border-[#F3F3F3] last:border-b-0 hover:bg-[#F8F8F8]"
                    >
                      <div className="text-[11px] text-[#202020]">{suggestionLabel}</div>
                    </button>
                  );
                })}
              </div>
            )}
            {invalidForwardRecipientCount > 0 && (
              <div className="mt-1 text-[10px] text-[#C63737]">
                {invalidForwardRecipientCount} recipient{invalidForwardRecipientCount > 1 ? 's are' : ' is'} invalid.
              </div>
            )}
          </div>

          <div className="mb-3">
            <label className="block text-[11px] font-semibold text-[#4A4A4A] mb-1">Message preview</label>
            <div className="w-full rounded-[8px] border border-[#EFEFEF] bg-[#FAFAFA] px-3 py-2 text-[11px] text-[#303030] whitespace-pre-wrap break-words">
              {getForwardMessagePreview(forwardingMessage)}
            </div>
          </div>

          {isForwardRoomsLoading && (
            <div className="text-[12px] text-[#666666]">Loading rooms...</div>
          )}

          {forwardStatusMessage && (
            <div
              className={`mt-2 text-[11px] ${forwardStatusType === 'error' ? 'text-[#C63737]' : forwardStatusType === 'success' ? 'text-[#1F7A3A]' : 'text-[#555555]'}`}
            >
              {forwardStatusMessage}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-[#EFEFEF] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isForwardingMessage}
            className="h-[32px] px-3 rounded-[6px] border border-[#D9D9D9] text-[12px] text-[#333333] hover:bg-[#F8F8F8] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirmForward}
            disabled={isForwardRoomsLoading || validForwardRecipientIds.length === 0 || isForwardingMessage}
            className="h-[32px] px-3 rounded-[6px] bg-[#040B23] text-white text-[12px] hover:opacity-90 disabled:opacity-50"
          >
            {isForwardingMessage ? 'Forwarding...' : `Forward${validForwardRecipientIds.length > 0 ? ` (${validForwardRecipientIds.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatMessagePopup;

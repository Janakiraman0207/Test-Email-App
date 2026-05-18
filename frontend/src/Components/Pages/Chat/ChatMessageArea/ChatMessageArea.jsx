import React, { useState, useRef, useEffect } from "react";
import ChatMessagePopup, {
  ParticipantsPanel,
  MessageActionPopup,
  ForwardModal,
} from "./ChatMessagePopup";
import {
  ChatProfileCallIcon,
  ChatProfileDropdownIcon,
  ChatProfileSearchIcon,
} from "../../../../assets/icons/Icons1";
import { DeleteIcon, EditIcon } from "../../../../assets/icons/Icons2";
import {
  starMessage,
  startCall,
  searchChatUsers,
  getChatOnlineUsers,
  addChatRoomMembers,
  leaveChatRoom,
  getChatRooms,
  forwardChatMessage,
  editChatMessage,
  deleteChatMessage,
} from "../../../../api/api";

// Utility functions
export function stringToPastelColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 60%, 85%)`;
}

export function stringToDarkColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 60%, 25%)`;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? window.location.origin : "http://localhost:8000");

export const resolveAttachmentUrl = (rawUrl) => {
  if (!rawUrl) return null;
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  const normalizedPath = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const isImageUrl = (url = "") =>
  /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url.split("?")[0]);

const isAttachmentLabelText = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return false;
  return raw.startsWith("📎") || raw.toLowerCase().startsWith("sent a file:");
};

export const getAttachmentDisplayName = (message) => {
  // ALWAYS prefer original filename
  if (message.fileName) {
    return message.fileName;
  }

  if (message.filename) {
    return message.filename;
  }

  if (message.originalName) {
    return message.originalName;
  }

  const text = message.content || "";

  if (text.startsWith("📎 ")) {
    return text.replace("📎 ", "").trim();
  }

  if (text.toLowerCase().startsWith("sent a file:")) {
    return text.split(":").slice(1).join(":").trim();
  }

  // LAST fallback only
  if (message.attachment_url) {
    const parts = message.attachment_url.split("/");
    const rawName = decodeURIComponent(parts[parts.length - 1]);

    // remove django random suffix
    return rawName.replace(/_[A-Za-z0-9]{7}(?=\.)/, "");
  }

  return "File";
};

export const isImageAttachmentMessage = (message) => {
  const rawFileUrl = message?.fileUrl || message?.attachment_url;
  const resolvedFileUrl = resolveAttachmentUrl(rawFileUrl || "");
  const fileName = getAttachmentDisplayName(message || {});
  return (
    !!resolvedFileUrl &&
    (isImageUrl(resolvedFileUrl) ||
      /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fileName))
  );
};

const shouldGroupImageMessages = (currentMessage, prevMessage) => {
  if (!currentMessage || !prevMessage) return false;

  if (
    !isImageAttachmentMessage(currentMessage) ||
    !isImageAttachmentMessage(prevMessage)
  ) {
    return false;
  }

  const sameSender =
    (currentMessage.sender_email || "") === (prevMessage.sender_email || "");

  if (!sameSender) return false;

  if (currentMessage.batchId && prevMessage.batchId) {
    return currentMessage.batchId === prevMessage.batchId;
  }

  const currentTime = new Date(currentMessage.timestamp || 0).getTime();
  const prevTime = new Date(prevMessage.timestamp || 0).getTime();

  if (Number.isNaN(currentTime) || Number.isNaN(prevTime)) return false;

  return Math.abs(currentTime - prevTime) <= 3000;
};

export const buildMessageRenderItems = (dateMessages = []) => {
  const items = [];
  for (const message of dateMessages) {
    const lastItem = items[items.length - 1];
    if (
      lastItem &&
      lastItem.type === "image_batch" &&
      shouldGroupImageMessages(
        message,
        lastItem.messages[lastItem.messages.length - 1],
      )
    ) {
      lastItem.messages.push(message);
      continue;
    }
    if (isImageAttachmentMessage(message)) {
      items.push({ type: "image_batch", messages: [message] });
    } else {
      items.push({ type: "single", message });
    }
  }
  return items;
};

const ChatMessageArea = ({
  headerInfo,
  typingText,
  selectedChat,
  messages,
  groupMessagesByDate,
  isMessageFromCurrentUser,
  getSenderDisplayName,
  handleAttachClick,
  fileInputRef,
  handleFileChange,
  handleRemoveFile,
  textInputRef,
  onStarMessage,
  chatSocket,
  currentUser,
  onDeleteMessage,
  formatMessageTime,
  input,
  handleInputChangeHandler,
  handleKeyDownHandler,
  handleInputFocusHandler,
  handleInputBlurHandler,
  handleSendClick,
  isSendingRef,
  messagesEndRef,
  ChatAttachIcon,
  ChatSendIcon,
  ChatAddReactionIcon,
  uploadedFiles = [],
  isUploading = false,
  setMessages,
  minimalMode = false,
}) => {
  const [showDotsPopup, setShowDotsPopup] = useState(false);
  const dotsRef = useRef(null);
  const EDITED_MESSAGES_STORAGE_KEY = "chat.editedMessageContentById";
  const [openMenuIdx, setOpenMenuIdx] = useState(null);
  const [starredMessages, setStarredMessages] = useState({});
  const [starringInProgress, setStarringInProgress] = useState({});
  const [isCallLoading, setIsCallLoading] = useState(false);

  const [showParticipantsPanel, setShowParticipantsPanel] = useState(false);
  // Add People Popup States
  const [showAddPeoplePopup, setShowAddPeoplePopup] = useState(false);
  const [addPeopleQuery, setAddPeopleQuery] = useState("");
  const [addPeopleChips, setAddPeopleChips] = useState([]); // chips for multiple users
  const [addPeopleSearchResults, setAddPeopleSearchResults] = useState([]);
  const [isAddingPeople, setIsAddingPeople] = useState(false);
  const addPeoplePopupRef = useRef(null);

  // Keep participants panel open when Add People popup is open
  useEffect(() => {
    if (showAddPeoplePopup) {
      setShowParticipantsPanel(true);
    }
  }, [showAddPeoplePopup]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupOnlineEmails, setGroupOnlineEmails] = useState([]);
  const [groupMemberDetails, setGroupMemberDetails] = useState([]);
  const [memberQuery, setMemberQuery] = useState("");
  const [memberSearchResults, setMemberSearchResults] = useState([]);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [forwardRooms, setForwardRooms] = useState([]);
  const [forwardRecipientQuery, setForwardRecipientQuery] = useState("");
  const [isForwardRoomsLoading, setIsForwardRoomsLoading] = useState(false);
  const [isForwardingMessage, setIsForwardingMessage] = useState(false);
  const [forwardStatusMessage, setForwardStatusMessage] = useState("");
  const [forwardStatusType, setForwardStatusType] = useState("info");
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageDraft, setEditingMessageDraft] = useState("");
  const [isSavingEditedMessage, setIsSavingEditedMessage] = useState(false);
  const [deletingMessageIds, setDeletingMessageIds] = useState({});
  const [editedMessageContentById, setEditedMessageContentById] = useState(
    () => {
      try {
        if (typeof window === "undefined") return {};
        const raw = window.localStorage.getItem(EDITED_MESSAGES_STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch (error) {
        return {};
      }
    },
  );
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [failedSenderAvatars, setFailedSenderAvatars] = useState({});
  const [myAvatarLoadFailed, setMyAvatarLoadFailed] = useState(false);

  // (removed duplicate Add People Popup States)

  // Chip input handlers
  const handleChipInputChange = (e) => {
    setAddPeopleQuery(e.target.value);
  };

  const TypingDots = () => (
    <span className="inline-flex ml-1">
      <span className="animate-bounce">.</span>
      <span className="animate-bounce delay-150">.</span>
      <span className="animate-bounce delay-300">.</span>
    </span>
  );

  const handleChipInputKeyDown = (e) => {
    if (["Enter", "Tab", ","].includes(e.key) && addPeopleQuery.trim()) {
      e.preventDefault();
      const value = addPeopleQuery.trim();
      if (value && !addPeopleChips.includes(value)) {
        setAddPeopleChips([...addPeopleChips, value]);
      }
      setAddPeopleQuery("");
    } else if (
      e.key === "Backspace" &&
      !addPeopleQuery &&
      addPeopleChips.length > 0
    ) {
      setAddPeopleChips(addPeopleChips.slice(0, -1));
    }
  };

  const handleRemoveChip = (idx) => {
    setAddPeopleChips(addPeopleChips.filter((_, i) => i !== idx));
  };

  //Edit Group name
  const [showEditGroupName, setShowEditGroupName] = useState(false);
  const [editGroupNameDraft, setEditGroupNameDraft] = useState("");
  const [isSavingGroupName, setIsSavingGroupName] = useState(false);
  const popupRef = useRef(null);

  const handleOpenEditGroupName = () => {
    setEditGroupNameDraft(headerInfo?.name || "");
    setShowEditGroupName(true);
  };

  const handleCloseEditGroupName = () => {
    if (isSavingGroupName) return;
    setShowEditGroupName(false);
    setEditGroupNameDraft("");
  };

  const handleSaveGroupName = async () => {
    const trimmed = editGroupNameDraft.trim();
    if (!trimmed || trimmed === headerInfo?.name) {
      handleCloseEditGroupName();
      return;
    }

    setIsSavingGroupName(true);
    try {
      setShowEditGroupName(false);
      setEditGroupNameDraft("");
    } catch (error) {
      alert("Failed to update group name.");
    } finally {
      setIsSavingGroupName(false);
    }
  };

  useEffect(() => {
    if (!showEditGroupName) return;

    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        handleCloseEditGroupName();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEditGroupName]);

  // Set groupMembers when a group chat is loaded
  useEffect(() => {
    if (selectedChat && selectedChat.is_group) {
      let emails = [];
      if (Array.isArray(selectedChat.participants)) {
        emails = emails.concat(
          selectedChat.participants
            .map((p) =>
              typeof p === "string" ? p : p.email || p.user_email || "",
            )
            .map((e) => String(e).toLowerCase())
            .filter(Boolean),
        );
      }
      if (Array.isArray(selectedChat.participant_details)) {
        emails = emails.concat(
          selectedChat.participant_details
            .map((p) => p?.email || p?.user_email || "")
            .map((e) => String(e).toLowerCase())
            .filter(Boolean),
        );
      }
      emails = Array.from(new Set(emails));
      setGroupMembers(emails);
    }
  }, [selectedChat]);

  // Refs
  const menuRefs = useRef({});
  const buttonRefs = useRef({});
  const participantsButtonRef = useRef(null);
  const participantsPanelRef = useRef(null);
  const forwardRecipientInputRef = useRef(null);

  // Constants
  const FORWARD_RECIPIENT_ROOM_ID_REGEX = /\s*\[#rid:([^\]]+)\]\s*$/i;

  // Helper functions
  const getInitials = (firstName, lastName, fullName) => {
    const first = firstName?.[0] || fullName?.split(/\s+/)?.[0]?.[0] || "";
    const last = lastName?.[0] || fullName?.split(/\s+/)?.[1]?.[0] || "";
    if (first || last) return `${first}${last}`.toUpperCase();
    const name = fullName || headerInfo?.name || "";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const initials = (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
    return initials.toUpperCase();
  };

  const getRoomId = (room) =>
    room?.id || room?._id || room?.roomId || room?.room_id || null;
  const normalizeSearchValue = (value) =>
    String(value || "")
      .trim()
      .toLowerCase();

  const encodeForwardRecipientToken = (label, roomId) => {
    const cleanLabel = String(label || "").trim();
    const cleanRoomId = String(roomId || "").trim();
    if (!cleanLabel) return cleanRoomId;
    if (!cleanRoomId) return cleanLabel;
    return `${cleanLabel} [#rid:${cleanRoomId}]`;
  };

  const decodeForwardRecipientLabel = (token) =>
    String(token || "")
      .replace(FORWARD_RECIPIENT_ROOM_ID_REGEX, "")
      .trim();
  const extractForwardRecipientRoomId = (token) => {
    const match = String(token || "").match(FORWARD_RECIPIENT_ROOM_ID_REGEX);
    return match?.[1] ? String(match[1]).trim() : "";
  };

  const addSearchTerm = (terms, value) => {
    const normalized = normalizeSearchValue(value);
    if (!normalized) return;
    terms.add(normalized);
    normalized.split(/\s+/).forEach((part) => {
      if (part) terms.add(part);
    });
    if (normalized.includes("@")) {
      const [localPart] = normalized.split("@");
      if (localPart) terms.add(localPart);
    }
  };

  // Effects
  useEffect(() => {
    if (!showParticipantsPanel) return;
    const fetchDetails = async () => {
      if (!Array.isArray(groupMembers) || groupMembers.length === 0) {
        setGroupMemberDetails([]);
        return;
      }
      try {
        const results = await Promise.all(
          groupMembers.map(async (email) => {
            const users = await searchChatUsers(email);
            return users.find((u) => {
              const userEmail = (u.email || u.user_email || "").toLowerCase();
              return userEmail === email;
            });
          }),
        );
        setGroupMemberDetails(results.filter(Boolean));
      } catch (error) {
        console.error("Failed to fetch group member details:", error);
        setGroupMemberDetails([]);
      }
    };
    fetchDetails();
  }, [groupMembers, showParticipantsPanel]);

  useEffect(() => {
    const runSearch = async () => {
      if (
        !memberQuery.trim() ||
        memberQuery.trim().length < 1 ||
        !showParticipantsPanel ||
        !selectedChat?.is_group
      ) {
        setMemberSearchResults([]);
        return;
      }
      try {
        const results = await searchChatUsers(memberQuery.trim());
        const filtered = (results || []).filter((u) => {
          const email = (u?.email || "").toLowerCase();
          return email && !groupMembers.includes(email);
        });
        setMemberSearchResults(filtered);
      } catch (error) {
        console.error("Failed to search users:", error);
        setMemberSearchResults([]);
      }
    };
    runSearch();
  }, [
    memberQuery,
    showParticipantsPanel,
    selectedChat?.is_group,
    groupMembers,
  ]);

  // Add People Popup search effect
  useEffect(() => {
    const searchUsers = async () => {
      if (
        !showAddPeoplePopup ||
        !addPeopleQuery.trim() ||
        addPeopleQuery.trim().length < 1
      ) {
        setAddPeopleSearchResults([]);
        return;
      }
      try {
        const results = await searchChatUsers(addPeopleQuery.trim());
        const filtered = (results || []).filter((user) => {
          const email = (user?.email || "").toLowerCase();
          return email && !groupMembers.includes(email);
        });
        setAddPeopleSearchResults(filtered);
      } catch (error) {
        console.error("Failed to search users:", error);
        setAddPeopleSearchResults([]);
      }
    };
    searchUsers();
  }, [addPeopleQuery, showAddPeoplePopup, groupMembers]);

  // Add People Popup click outside effect
  useEffect(() => {
    if (!showAddPeoplePopup) return;

    const handleClickOutside = (event) => {
      if (
        addPeoplePopupRef.current &&
        !addPeoplePopupRef.current.contains(event.target)
      ) {
        setShowAddPeoplePopup(false);
        setAddPeopleQuery("");
        setAddPeopleSearchResults([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddPeoplePopup]);

  useEffect(() => {
    if (!showParticipantsPanel) return;
    const handleOutsideParticipantsClick = (event) => {
      const panelEl = participantsPanelRef.current;
      const buttonEl = participantsButtonRef.current;
      if (panelEl?.contains(event.target) || buttonEl?.contains(event.target))
        return;
      setShowParticipantsPanel(false);
    };
    document.addEventListener("mousedown", handleOutsideParticipantsClick);
    return () =>
      document.removeEventListener("mousedown", handleOutsideParticipantsClick);
  }, [showParticipantsPanel]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuIdx !== null) {
        const menuEl = menuRefs.current[openMenuIdx];
        const buttonEl = buttonRefs.current[openMenuIdx];
        if (
          menuEl &&
          buttonEl &&
          !menuEl.contains(event.target) &&
          !buttonEl.contains(event.target)
        ) {
          setOpenMenuIdx(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuIdx]);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [headerInfo?.image]);

  useEffect(() => {
    setMyAvatarLoadFailed(false);
  }, [currentUser?.profile_image]);

  // Event Handlers
  const handleAddMember = async (userEmail) => {
    const roomId =
      selectedChat?.id || selectedChat?._id || selectedChat?.roomId;
    if (!roomId || !userEmail) return;
    setIsAddingMember(true);
    try {
      const response = await addChatRoomMembers(roomId, [userEmail]);
      const added = Array.isArray(response?.added)
        ? response.added.map((email) => String(email).toLowerCase())
        : [String(userEmail).toLowerCase()];
      setGroupMembers((prev) => {
        const updated = Array.from(new Set([...prev, ...added]));
        return updated;
      });
      setMemberQuery("");
      setMemberSearchResults([]);
    } catch (error) {
      alert("Failed to add participant.");
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleAddPeople = async (userEmail) => {
    const roomId =
      selectedChat?.id || selectedChat?._id || selectedChat?.roomId;
    if (!roomId || !userEmail) return;

    setIsAddingPeople(true);
    try {
      const response = await addChatRoomMembers(roomId, [userEmail]);
      const added = Array.isArray(response?.added)
        ? response.added.map((email) => String(email).toLowerCase())
        : [String(userEmail).toLowerCase()];

      setGroupMembers((prev) => {
        const updated = Array.from(new Set([...prev, ...added]));
        return updated;
      });

      const newMemberDetails = await searchChatUsers(userEmail);
      if (newMemberDetails && newMemberDetails.length > 0) {
        setGroupMemberDetails((prev) => [...prev, newMemberDetails[0]]);
      }

      setAddPeopleQuery("");
      setAddPeopleSearchResults([]);
      setShowAddPeoplePopup(false);
    } catch (error) {
      alert("Failed to add participant.");
    } finally {
      setIsAddingPeople(false);
    }
  };

  const handleLeaveGroup = async () => {
    const roomId =
      selectedChat?.id || selectedChat?._id || selectedChat?.roomId;
    if (!roomId) {
      alert("No valid roomId found. Cannot leave group.");
      return;
    }
    setIsLeavingGroup(true);
    try {
      await leaveChatRoom(roomId);
      setShowParticipantsPanel(false);
      window.location.assign("/chat");
    } catch (error) {
      console.error("[Leave Group] Error:", error);
      alert(
        error?.response?.data?.detail ||
          error?.message ||
          "Failed to leave group. Please try again.",
      );
    } finally {
      setIsLeavingGroup(false);
    }
  };

  const getPersistedMessageStarState = (message) => {
    if (!message) return false;
    if (typeof message.is_starred === "boolean") return message.is_starred;
    if (typeof message.is_saved === "boolean") return message.is_saved;
    if (typeof message.starred === "boolean") return message.starred;
    return false;
  };

  const getMessageStarState = (message) => {
    const messageId = message?.id;
    if (
      messageId !== undefined &&
      messageId !== null &&
      typeof starredMessages[messageId] === "boolean"
    ) {
      return starredMessages[messageId];
    }
    return getPersistedMessageStarState(message);
  };

  const handleStarMessage = async (messageOrId) => {
    const messageId =
      typeof messageOrId === "object" ? messageOrId?.id : messageOrId;
    if (!messageId) return;
    if (starringInProgress[messageId]) return;
    const targetMessage =
      typeof messageOrId === "object"
        ? messageOrId
        : messages?.find((msg) => String(msg?.id) === String(messageId));
    const currentStarredState = getMessageStarState(targetMessage);
    const newStarredState = !currentStarredState;
    setStarredMessages((prev) => ({ ...prev, [messageId]: newStarredState }));
    setStarringInProgress((prev) => ({ ...prev, [messageId]: true }));
    try {
      const response = await starMessage(messageId);
      const persistedStarState =
        typeof response?.is_starred === "boolean"
          ? response.is_starred
          : typeof response?.is_saved === "boolean"
            ? response.is_saved
            : newStarredState;
      setStarredMessages((prev) => ({
        ...prev,
        [messageId]: persistedStarState,
      }));
      setOpenMenuIdx(null);
      if (onStarMessage) onStarMessage(messageId, newStarredState);
      if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
        chatSocket.send(
          JSON.stringify({
            type: "star_message",
            message_id: messageId,
            starred: newStarredState,
          }),
        );
      }
    } catch (error) {
      console.error("Failed to star message:", error);
      setStarredMessages((prev) => ({
        ...prev,
        [messageId]: currentStarredState,
      }));
      alert("Failed to star message. Please try again.");
    } finally {
      setStarringInProgress((prev) => ({ ...prev, [messageId]: false }));
    }
  };

  const getEditableMessageContent = (message) => {
    const messageId = message?.id;
    const rawContent =
      editedMessageContentById[messageId] ??
      message?.content ??
      message?.text ??
      "";
    const hasAttachment = Boolean(
      message?.isFile || message?.fileUrl || message?.attachment_url,
    );
    const normalizedContent = String(rawContent || "");

    // For attachments, we want to edit the accompanying text message, not the file name
    if (hasAttachment && isAttachmentLabelText(normalizedContent)) return "";
    return normalizedContent;
  };

  const handleStartInlineEditMessage = (message) => {
    const messageId = message?.id;
    if (!messageId || message?.is_deleted) return;

    // Always edit the message content, not the file name
    const currentContent = getEditableMessageContent(message);

    setEditingMessageId(messageId);
    setEditingMessageDraft(String(currentContent));
    setOpenMenuIdx(null);
  };

  const handleSaveInlineEditMessage = async () => {
    if (!editingMessageId || isSavingEditedMessage) return;
    const originalMessage = messages?.find(
      (message) => message?.id === editingMessageId,
    );
    const originalContent = getEditableMessageContent(originalMessage).trim();
    const nextContent = String(editingMessageDraft || "").trim();

    if (!nextContent || nextContent === originalContent) {
      handleCancelInlineEditMessage();
      return;
    }

    setIsSavingEditedMessage(true);
    try {
      // Always send content update, never file_name
      const updatedMessage = await editChatMessage(
        editingMessageId,
        nextContent,
      );
      if (setMessages) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) => {
            if (msg.id !== editingMessageId) return msg;

            return {
              ...msg,

              // update only text
              content: updatedMessage?.content ?? nextContent,

              // KEEP ORIGINAL FILE DETAILS
              fileName: msg.fileName,
              originalName: msg.originalName,
              fileUrl: msg.fileUrl,
              attachment_url: msg.attachment_url,
              isFile: msg.isFile,
            };
          }),
        );
      }
      const updatedContent = String(updatedMessage?.content || nextContent);
      setEditedMessageContentById((prev) => ({
        ...prev,
        [editingMessageId]: updatedContent,
      }));
      setEditingMessageId(null);
      setEditingMessageDraft("");
    } catch (error) {
      alert(error?.response?.data?.detail || "Failed to edit message.");
    } finally {
      setIsSavingEditedMessage(false);
    }
  };

  const handleCancelInlineEditMessage = () => {
    if (isSavingEditedMessage) return;
    setEditingMessageId(null);
    setEditingMessageDraft("");
  };

  //   const handleSaveInlineEditMessage = async () => {
  //   if (!editingMessageId || isSavingEditedMessage) return;

  //   const originalMessage = messages?.find((message) => message?.id === editingMessageId);
  //   const isAttachmentMessage = Boolean(originalMessage?.isFile || originalMessage?.fileUrl || originalMessage?.attachment_url);

  //   if (isAttachmentMessage) {
  //     const newFileName = editingMessageDraft.trim();
  //     const oldFileName = getAttachmentDisplayName(originalMessage);

  //     if (!newFileName || newFileName === oldFileName) {
  //       handleCancelInlineEditMessage();
  //       return;
  //     }

  //     setIsSavingEditedMessage(true);
  //     try {
  //       const updatedMessage = await editChatMessage(editingMessageId, null, newFileName);

  //       if (setMessages) {
  //         setMessages(prevMessages => prevMessages.map(msg =>
  //           msg.id === editingMessageId
  //             ? {
  //                 ...msg,
  //                 content: updatedMessage.content,
  //                 fileName: newFileName,
  //                 fileUrl: updatedMessage.attachment_url
  //               }
  //             : msg
  //         ));
  //       }

  //       setEditingMessageId(null);
  //       setEditingMessageDraft('');
  //     } catch (error) {
  //       console.error('Failed to rename file:', error);
  //       alert(error?.response?.data?.detail || 'Failed to rename file. Please try again.');
  //     } finally {
  //       setIsSavingEditedMessage(false);
  //     }
  //     return;
  //   }

  //   const originalContent = getEditableMessageContent(originalMessage).trim();
  //   const nextContent = String(editingMessageDraft || '').trim();

  //   if (!nextContent || nextContent === originalContent) {
  //     handleCancelInlineEditMessage();
  //     return;
  //   }

  //   setIsSavingEditedMessage(true);
  //   try {
  //     const updatedMessage = await editChatMessage(editingMessageId, nextContent);
  //     const updatedContent = String(updatedMessage?.content || nextContent);
  //     setEditedMessageContentById((prev) => ({ ...prev, [editingMessageId]: updatedContent }));
  //     setEditingMessageId(null);
  //     setEditingMessageDraft('');
  //   } catch (error) {
  //     alert(error?.response?.data?.detail || 'Failed to edit message.');
  //   } finally {
  //     setIsSavingEditedMessage(false);
  //   }
  // };

  const handleDeleteMessage = async (message) => {
    const messageId = message?.id;
    if (!messageId || message?.is_deleted || deletingMessageIds[messageId])
      return;
    setDeletingMessageIds((prev) => ({ ...prev, [messageId]: true }));
    try {
      await deleteChatMessage(messageId);
      setOpenMenuIdx(null);
      if (setMessages) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === messageId
              ? { ...msg, is_deleted: true, content: null }
              : msg,
          ),
        );
      }
      if (typeof onDeleteMessage === "function") onDeleteMessage(messageId);
    } catch (error) {
      alert(error?.response?.data?.detail || "Failed to delete message.");
    } finally {
      setDeletingMessageIds((prev) => {
        const next = { ...prev };
        delete next[messageId];
        return next;
      });
    }
  };

  const handleCallClick = async () => {
    if (!selectedChat) {
      alert("No chat selected");
      return;
    }
    const roomId = selectedChat.id || selectedChat._id || selectedChat.roomId;
    if (!roomId) {
      console.error("No room ID found for call");
      alert("Cannot start call: Room ID not found");
      return;
    }
    setIsCallLoading(true);
    try {
      const response = await startCall(roomId);
      if (response && response.link) {
        window.open(response.link, "_blank");
      } else {
        alert("Call started but meeting link not received");
      }
    } catch (error) {
      console.error("Failed to start call:", error);
      alert(
        error.response?.data?.detail ||
          "Failed to start call. Please try again.",
      );
    } finally {
      setIsCallLoading(false);
    }
  };

  // Forward message handlers
  const getForwardRoomDisplayName = (room) => {
    if (!room) return "Unknown room";
    if (room.is_group) return room.name || `Group #${getRoomId(room)}`;
    const currentEmail = (currentUser?.email || "").toLowerCase();
    const participants = Array.isArray(room.participants)
      ? room.participants
      : [];
    const otherParticipant = participants.find((participant) => {
      if (typeof participant === "string")
        return participant.toLowerCase() !== currentEmail;
      const participantEmail = (
        participant?.email ||
        participant?.user_email ||
        ""
      ).toLowerCase();
      return participantEmail && participantEmail !== currentEmail;
    });
    if (!otherParticipant) return room.name || `Chat #${getRoomId(room)}`;
    if (typeof otherParticipant === "string") return otherParticipant;
    const fullName =
      `${otherParticipant.first_name || ""} ${otherParticipant.last_name || ""}`.trim();
    return (
      fullName ||
      otherParticipant.email ||
      room.name ||
      `Chat #${getRoomId(room)}`
    );
  };

  const getForwardMessagePreview = (message) => {
    if (!message) return "No message selected";
    const fileName = getAttachmentDisplayName(message);
    const hasFile =
      message.isFile ||
      !!message.fileUrl ||
      !!message.attachment_url ||
      message.content?.startsWith("📎");
    if (hasFile) return `Attachment: ${fileName}`;
    const text = (message.content || message.text || "").trim();
    if (!text) return "Empty message";
    return text.length > 180 ? `${text.slice(0, 180)}...` : text;
  };

  const getRoomSearchTerms = (room) => {
    const terms = new Set();
    const roomId = String(getRoomId(room) || "").trim();
    if (roomId) addSearchTerm(terms, roomId);
    const displayName = getForwardRoomDisplayName(room);
    addSearchTerm(terms, displayName);
    addSearchTerm(terms, room?.name);
    addSearchTerm(terms, room?.group_name);
    addSearchTerm(terms, room?.title);
    addSearchTerm(terms, room?.display_name);
    const participants = Array.isArray(room?.participants)
      ? room.participants
      : [];
    participants.forEach((participant) => {
      if (!participant) return;
      if (typeof participant === "string") {
        addSearchTerm(terms, participant);
        return;
      }
      const email = participant.email || participant.user_email || "";
      addSearchTerm(terms, email);
      const firstName = participant.first_name || participant.firstName || "";
      const lastName = participant.last_name || participant.lastName || "";
      const fullName = `${firstName} ${lastName}`.trim();
      addSearchTerm(terms, fullName);
      addSearchTerm(terms, firstName);
      addSearchTerm(terms, lastName);
    });
    const participantDetails = Array.isArray(room?.participant_details)
      ? room.participant_details
      : [];
    participantDetails.forEach((participant) => {
      if (!participant) return;
      const email = participant.email || participant.user_email || "";
      addSearchTerm(terms, email);
      const firstName = participant.first_name || participant.firstName || "";
      const lastName = participant.last_name || participant.lastName || "";
      const fullName = `${firstName} ${lastName}`.trim();
      addSearchTerm(terms, fullName);
      addSearchTerm(terms, firstName);
      addSearchTerm(terms, lastName);
    });
    const participantEmails = Array.isArray(room?.participant_emails)
      ? room.participant_emails
      : [];
    participantEmails.forEach((email) => addSearchTerm(terms, email));
    return Array.from(terms);
  };

  const getRoomPeopleForSuggestions = (room) => {
    const people = [];
    const seen = new Set();
    const pushPerson = (firstName, lastName, email) => {
      const normalizedEmail = normalizeSearchValue(email);
      const normalizedFirst = String(firstName || "").trim();
      const normalizedLast = String(lastName || "").trim();
      const fullName = `${normalizedFirst} ${normalizedLast}`.trim();
      const key = `${normalizeSearchValue(fullName)}|${normalizedEmail}`;
      if (seen.has(key)) return;
      seen.add(key);
      people.push({
        firstName: normalizedFirst,
        lastName: normalizedLast,
        fullName,
        email: normalizedEmail,
      });
    };
    const participants = Array.isArray(room?.participants)
      ? room.participants
      : [];
    participants.forEach((participant) => {
      if (!participant || typeof participant === "string") return;
      pushPerson(
        participant.first_name || participant.firstName || "",
        participant.last_name || participant.lastName || "",
        participant.email || participant.user_email || "",
      );
    });
    const participantDetails = Array.isArray(room?.participant_details)
      ? room.participant_details
      : [];
    participantDetails.forEach((participant) => {
      if (!participant) return;
      pushPerson(
        participant.first_name || participant.firstName || "",
        participant.last_name || participant.lastName || "",
        participant.email || participant.user_email || "",
      );
    });
    return people;
  };

  const getForwardSuggestionPrimaryLabel = (room, rawToken) => {
    const token = normalizeSearchValue(rawToken);
    const groupName = String(
      room?.name || room?.group_name || room?.title || room?.display_name || "",
    ).trim();
    const normalizedGroupName = normalizeSearchValue(groupName);
    if (token && normalizedGroupName && normalizedGroupName.includes(token))
      return groupName;
    const people = getRoomPeopleForSuggestions(room);
    const tokenParts = token.split(/\s+/).filter(Boolean);
    const matchedPerson = people.find((person) => {
      const nameTerms = [
        normalizeSearchValue(person.fullName),
        normalizeSearchValue(person.firstName),
        normalizeSearchValue(person.lastName),
        normalizeSearchValue(person.email),
        normalizeSearchValue((person.email || "").split("@")[0]),
      ].filter(Boolean);
      if (tokenParts.length === 0) return false;
      return tokenParts.every((part) =>
        nameTerms.some((value) => value.includes(part)),
      );
    });
    if (matchedPerson) return matchedPerson.fullName || matchedPerson.email;
    if (room?.is_group && groupName) return groupName;
    return getForwardRoomDisplayName(room);
  };

  const getForwardSuggestionMatchMeta = (room, rawToken) => {
    const token = normalizeSearchValue(rawToken);
    if (!token) return null;
    const groupName = String(
      room?.name || room?.group_name || room?.title || room?.display_name || "",
    ).trim();
    const normalizedGroupName = normalizeSearchValue(groupName);
    const tokenParts = token.split(/\s+/).filter(Boolean);
    const people = getRoomPeopleForSuggestions(room);
    const matchedPerson = people.find((person) => {
      const nameTerms = [
        normalizeSearchValue(person.fullName),
        normalizeSearchValue(person.firstName),
        normalizeSearchValue(person.lastName),
        normalizeSearchValue(person.email),
        normalizeSearchValue((person.email || "").split("@")[0]),
      ].filter(Boolean);
      if (tokenParts.length === 0) return false;
      return tokenParts.every((part) =>
        nameTerms.some((value) => value.includes(part)),
      );
    });
    if (room?.is_group) {
      if (normalizedGroupName && normalizedGroupName.includes(token))
        return {
          matchType: "group",
          label: groupName || getForwardRoomDisplayName(room),
        };
      return null;
    }
    if (matchedPerson)
      return {
        matchType: "person",
        label:
          matchedPerson.fullName ||
          matchedPerson.email ||
          getForwardRoomDisplayName(room),
      };
    const displayName = getForwardRoomDisplayName(room);
    if (normalizeSearchValue(displayName).includes(token))
      return { matchType: "person", label: displayName };
    return null;
  };

  const getForwardSuggestionTokenValue = (room, rawToken) => {
    const primaryLabel = String(
      getForwardSuggestionPrimaryLabel(room, rawToken) || "",
    ).trim();
    if (primaryLabel) return primaryLabel;
    const fallbackGroupName = String(
      room?.name || room?.group_name || room?.title || room?.display_name || "",
    ).trim();
    if (fallbackGroupName) return fallbackGroupName;
    return String(getRoomId(room) || "").trim();
  };

  const buildForwardRecipientQuery = (
    completedTokens,
    activeToken = "",
    forceTrailingSeparator = false,
  ) => {
    const cleanCompletedTokens = Array.from(
      new Set(
        (completedTokens || [])
          .map((value) => String(value || "").trim())
          .filter(Boolean),
      ),
    );
    const cleanActiveToken = String(activeToken || "").trim();
    const base = cleanCompletedTokens.join(", ");
    if (cleanActiveToken)
      return base ? `${base}, ${cleanActiveToken}` : cleanActiveToken;
    if (forceTrailingSeparator && base) return `${base}, `;
    return base;
  };

  const handleForwardRecipientInputChange = (value) => {
    setForwardRecipientQuery(
      buildForwardRecipientQuery(forwardRecipientCompletedTokens, value, false),
    );
  };

  const handleRemoveForwardRecipientChip = (indexToRemove) => {
    const remainingTokens = forwardRecipientCompletedTokens.filter(
      (_, index) => index !== indexToRemove,
    );
    setForwardRecipientQuery(
      buildForwardRecipientQuery(
        remainingTokens,
        forwardRecipientActiveToken,
        queryEndsWithSeparator,
      ),
    );
  };

  const handleForwardRecipientInputKeyDown = (event) => {
    if (
      event.key === "Backspace" &&
      !forwardRecipientActiveToken &&
      forwardRecipientCompletedTokens.length > 0
    ) {
      event.preventDefault();
      const nextTokens = forwardRecipientCompletedTokens.slice(0, -1);
      setForwardRecipientQuery(
        buildForwardRecipientQuery(nextTokens, "", queryEndsWithSeparator),
      );
    }
  };

  const matchesRoomByToken = (room, rawToken) => {
    const normalizedToken = normalizeSearchValue(rawToken);
    if (!normalizedToken) return false;
    const tokenParts = normalizedToken.split(/\s+/).filter(Boolean);
    if (tokenParts.length === 0) return false;
    const terms = getRoomSearchTerms(room);
    return tokenParts.every((part) =>
      terms.some((value) => value.includes(part)),
    );
  };

  const resolveRecipientTokenToRoomId = (token, rooms) => {
    const explicitRoomId = extractForwardRecipientRoomId(token);
    if (explicitRoomId) return explicitRoomId;
    const normalizedToken = normalizeSearchValue(token);
    if (!normalizedToken) return null;
    const exactIdMatch = rooms.find(
      (room) => String(getRoomId(room) || "").toLowerCase() === normalizedToken,
    );
    if (exactIdMatch) return String(getRoomId(exactIdMatch));
    const exactMatches = rooms.filter((room) => {
      const terms = getRoomSearchTerms(room);
      return terms.some((value) => value === normalizedToken);
    });
    if (exactMatches.length === 1) return String(getRoomId(exactMatches[0]));
    if (exactMatches.length > 1) return null;
    const containsMatches = rooms.filter((room) =>
      matchesRoomByToken(room, normalizedToken),
    );
    if (containsMatches.length === 1)
      return String(getRoomId(containsMatches[0]));
    return null;
  };

  const closeForwardModal = () => {
    setShowForwardModal(false);
    setForwardingMessage(null);
    setForwardRooms([]);
    setForwardRecipientQuery("");
    setIsForwardRoomsLoading(false);
    setIsForwardingMessage(false);
    setForwardStatusMessage("");
    setForwardStatusType("info");
  };

  const handleOpenForwardModal = async (message) => {
    if (!message?.id) return;
    const activeRoomId = String(getRoomId(selectedChat) || "");
    setOpenMenuIdx(null);
    setForwardingMessage(message);
    setShowForwardModal(true);
    setForwardRecipientQuery("");
    setIsForwardRoomsLoading(true);
    setForwardStatusMessage("");
    setForwardStatusType("info");
    try {
      const rooms = await getChatRooms();
      const availableRooms = (Array.isArray(rooms) ? rooms : []).filter(
        (room) => {
          const id = String(getRoomId(room) || "");
          return id && id !== activeRoomId;
        },
      );
      setForwardRooms(availableRooms);
    } catch (error) {
      setForwardRooms([]);
      setForwardStatusType("error");
      setForwardStatusMessage(
        "Unable to load chats for forwarding. Please try again.",
      );
    } finally {
      setIsForwardRoomsLoading(false);
    }
  };

  const handleConfirmForward = async () => {
    if (!forwardingMessage?.id || validForwardRecipientIds.length === 0) {
      setForwardStatusType("error");
      setForwardStatusMessage(
        "Enter at least one valid recipient in Add recipients.",
      );
      return;
    }
    setIsForwardingMessage(true);
    setForwardStatusMessage("");
    try {
      const results = await Promise.allSettled(
        validForwardRecipientIds.map((roomId) =>
          forwardChatMessage(forwardingMessage.id, roomId),
        ),
      );
      const successCount = results.filter(
        (result) => result.status === "fulfilled",
      ).length;
      const failedCount = results.length - successCount;
      if (successCount > 0 && failedCount === 0) {
        const invalidNotice =
          invalidForwardRecipientCount > 0
            ? ` Skipped ${invalidForwardRecipientCount} invalid recipient${invalidForwardRecipientCount > 1 ? "s" : ""}.`
            : "";
        setForwardStatusType("success");
        setForwardStatusMessage(
          `Message forwarded to ${successCount} recipient${successCount > 1 ? "s" : ""}.${invalidNotice}`,
        );
        closeForwardModal();
        return;
      }
      if (successCount > 0 && failedCount > 0) {
        const invalidNotice =
          invalidForwardRecipientCount > 0
            ? ` Skipped ${invalidForwardRecipientCount} invalid recipient${invalidForwardRecipientCount > 1 ? "s" : ""}.`
            : "";
        setForwardStatusType("error");
        setForwardStatusMessage(
          `Forwarded to ${successCount} recipient${successCount > 1 ? "s" : ""}. Failed for ${failedCount}.${invalidNotice}`,
        );
        setIsForwardingMessage(false);
        return;
      }
      setForwardStatusType("error");
      setForwardStatusMessage("Failed to forward message.");
      setIsForwardingMessage(false);
    } catch (error) {
      setForwardStatusType("error");
      setForwardStatusMessage(
        error?.response?.data?.detail ||
          error?.message ||
          "Failed to forward message.",
      );
      setIsForwardingMessage(false);
    }
  };

  const handleSelectForwardRecipientSuggestion = (suggestion) => {
    if (!suggestion?.room) return;
    const suggestionValue = String(
      suggestion.label ||
        getForwardSuggestionTokenValue(
          suggestion.room,
          forwardRecipientSuggestionToken,
        ),
    ).trim();
    if (!suggestionValue) return;
    const roomId = String(getRoomId(suggestion.room) || "").trim();
    if (!roomId) return;
    const encodedSuggestionValue = encodeForwardRecipientToken(
      suggestionValue,
      roomId,
    );
    const nextCompletedTokens = Array.from(
      new Set([...forwardRecipientCompletedTokens, encodedSuggestionValue]),
    );
    const nextQuery = buildForwardRecipientQuery(nextCompletedTokens, "", true);
    setForwardRecipientQuery(nextQuery);
  };

  // Derived state
  const parsedForwardRecipientTokens = Array.from(
    new Set(
      (forwardRecipientQuery || "")
        .split(/[,;\n]+/)
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
  const forwardRecipientQuerySegments = (forwardRecipientQuery || "")
    .split(/[,;\n]+/)
    .map((value) => value.trim());
  const queryEndsWithSeparator = /[,;\n]\s*$/.test(forwardRecipientQuery || "");
  const forwardRecipientCompletedTokens = Array.from(
    new Set(
      (queryEndsWithSeparator
        ? forwardRecipientQuerySegments
        : forwardRecipientQuerySegments.slice(0, -1)
      ).filter(Boolean),
    ),
  );
  const forwardRecipientActiveToken = queryEndsWithSeparator
    ? ""
    : (
        forwardRecipientQuerySegments[
          forwardRecipientQuerySegments.length - 1
        ] || ""
      ).trim();
  const resolvedRecipientRoomIds = parsedForwardRecipientTokens
    .map((token) => resolveRecipientTokenToRoomId(token, forwardRooms))
    .filter(Boolean);
  const validForwardRecipientIds = Array.from(
    new Set(resolvedRecipientRoomIds),
  );
  const invalidForwardRecipientCount = parsedForwardRecipientTokens.reduce(
    (count, token, index) => {
      const isTrailingToken =
        !queryEndsWithSeparator &&
        index === parsedForwardRecipientTokens.length - 1;
      if (isTrailingToken) return count;
      return resolveRecipientTokenToRoomId(token, forwardRooms)
        ? count
        : count + 1;
    },
    0,
  );
  const forwardRecipientSuggestionToken = normalizeSearchValue(
    decodeForwardRecipientLabel(forwardRecipientActiveToken),
  );
  const forwardRecipientSuggestions = forwardRecipientSuggestionToken
    ? forwardRooms
        .map((room) => {
          const roomId = String(getRoomId(room) || "");
          if (!roomId) return null;
          if (validForwardRecipientIds.includes(roomId)) return null;
          const matchMeta = getForwardSuggestionMatchMeta(
            room,
            forwardRecipientSuggestionToken,
          );
          if (!matchMeta) return null;
          return {
            room,
            roomId,
            label: matchMeta.label,
            matchType: matchMeta.matchType,
          };
        })
        .filter(Boolean)
        .reduce(
          (acc, item) => {
            const dedupeKey =
              item.matchType === "person"
                ? `person:${normalizeSearchValue(item.label)}`
                : `room:${item.roomId}`;
            if (!acc.seen.has(dedupeKey)) {
              acc.seen.add(dedupeKey);
              acc.items.push(item);
            }
            return acc;
          },
          { seen: new Set(), items: [] },
        ).items
    : [];

  const getGroupHeaderInitials = () => {
    if (!headerInfo?.isGroup) return [];
    if (
      Array.isArray(selectedChat?.groupInitials) &&
      selectedChat.groupInitials.length > 0
    )
      return selectedChat.groupInitials.slice(0, 4);
    const initials = [];
    const seen = new Set();
    const addInitial = (value) => {
      const letter = (value || "").trim().charAt(0).toUpperCase();
      if (!letter || seen.has(letter)) return;
      seen.add(letter);
      initials.push(letter);
    };
    if (Array.isArray(selectedChat?.participant_details)) {
      selectedChat.participant_details.forEach((participant) => {
        const fullName =
          `${participant?.first_name || ""} ${participant?.last_name || ""}`.trim();
        if (fullName) addInitial(fullName);
        else addInitial((participant?.email || "").split("@")[0]);
      });
    }
    if (initials.length === 0 && Array.isArray(selectedChat?.participants)) {
      selectedChat.participants.forEach((participant) => {
        if (typeof participant === "string")
          addInitial(participant.split("@")[0]);
        else {
          const fullName =
            `${participant?.first_name || ""} ${participant?.last_name || ""}`.trim();
          addInitial(fullName || (participant?.email || "").split("@")[0]);
        }
      });
    }
    if (initials.length === 0) {
      (headerInfo?.name || "")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 4)
        .forEach((part) => addInitial(part));
    }
    return initials.slice(0, 4);
  };

  const groupHeaderInitials = getGroupHeaderInitials();
  const getGroupHeaderColorKeys = () => {
  if (!headerInfo?.isGroup) return [];
  const keys = [];
  const seenKeys = new Set();

  const addKey = (key) => {
    const k = (key || '').toString().toLowerCase().trim();
    if (!k || seenKeys.has(k)) return;
    seenKeys.add(k);
    keys.push(k);
  };

  if (Array.isArray(selectedChat?.participant_details) && selectedChat.participant_details.length > 0) {
    selectedChat.participant_details.forEach(p => {
      addKey(p?.email || p?.user_email || p?.id || '');
    });
    if (keys.length > 0) return keys.slice(0, 4);
  }

  if (Array.isArray(selectedChat?.participants)) {
    selectedChat.participants.forEach(p => {
      if (typeof p === 'string') addKey(p);
      else addKey(p?.email || p?.user_email || p?.id || '');
    });
  }

  return keys.slice(0, 4);
};

  const groupHeaderColorKeys = getGroupHeaderColorKeys();
  const imagePreviews = uploadedFiles.filter(file => ((file.type && file.type.startsWith('image')) || file.previewUrl) && file.previewUrl);
  const hasImagePreview = imagePreviews.length > 0;
  // Main render
  if (!headerInfo) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-lg mb-2">Welcome to Chats</p>
          <p className="text-sm">
            Select a conversation or search for users to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col flex-1 w-full h-screen min-h-0 border-l border-r"
      style={{ borderLeftColor: "#E2E2E2", borderRightColor: "#E2E2E2" }}
    >
      {/* Header Section */}
      <div className="flex flex-row items-center justify-between w-full h-[64px] bg-[#040B23] px-[25px]">
        <div className="flex flex-row w-full h-[30px] gap-[10px]">
          {headerInfo?.image && !avatarLoadFailed ? (
            <div className="relative w-[30px] h-[30px]">
              <img
                src={headerInfo.image}
                alt={headerInfo.name || "User"}
                onError={() => setAvatarLoadFailed(true)}
                className="w-[30px] h-[30px] rounded-full object-cover"
              />
              <span
                className={`absolute left-1/2 -translate-x-1/2 bottom-0 w-[5px] h-[5px] rounded-full ${headerInfo.isOnline ? "bg-green-500" : "bg-red-500"}`}
                title={headerInfo.isOnline ? "Online" : "Offline"}
              />
            </div>
          ) : headerInfo?.isGroup && groupHeaderInitials.length > 0 ? (
            <div
              className="w-[30px] h-[30px] rounded-full overflow-hidden"
              style={{ position: "relative" }}
            >
              {(() => {
                const count = groupHeaderInitials.length;
                if (count === 3) {
                  return (
                    <div
                      style={{
                        position: "relative",
                        width: "30px",
                        height: "30px",
                        clipPath: "circle(50% at 50% 50%)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        key={`group-header-initial-0`}
                        className="flex items-center justify-center text-[8px] font-semibold"
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          width: "16px",
                          height: "30px",
                          backgroundColor: stringToPastelColor(
                            groupHeaderInitials[0],
                          ),
                          color: stringToDarkColor(groupHeaderInitials[0]),
                          borderTopLeftRadius: "15px",
                          borderBottomLeftRadius: "15px",
                          borderTopRightRadius: 0,
                          borderBottomRightRadius: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {groupHeaderInitials[0] || ""}
                      </div>
                      <div
                        key={`group-header-initial-1`}
                        className="flex items-center justify-center text-[8px] font-semibold"
                        style={{
                          position: "absolute",
                          left: "16px",
                          top: 0,
                          width: "14px",
                          height: "15px",
                          backgroundColor: stringToPastelColor(
                            groupHeaderInitials[1],
                          ),
                          color: stringToDarkColor(groupHeaderInitials[1]),
                          borderTopRightRadius: "15px",
                          borderTopLeftRadius: 0,
                          borderBottomLeftRadius: 0,
                          borderBottomRightRadius: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {groupHeaderInitials[1] || ""}
                      </div>
                      <div
                        key={`group-header-initial-2`}
                        className="flex items-center justify-center text-[8px] font-semibold"
                        style={{
                          position: "absolute",
                          left: "16px",
                          top: "15px",
                          width: "14px",
                          height: "15px",
                          backgroundColor: stringToPastelColor(
                            groupHeaderInitials[2],
                          ),
                          color: stringToDarkColor(groupHeaderInitials[2]),
                          borderBottomRightRadius: "15px",
                          borderTopLeftRadius: 0,
                          borderTopRightRadius: 0,
                          borderBottomLeftRadius: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {groupHeaderInitials[2] || ""}
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    className="w-[30px] h-[30px] rounded-full overflow-hidden border border-[#EAEAEA]"
                    style={{
                      display: "grid",
                      ...(count === 1
                        ? {
                            gridTemplateColumns: "1fr",
                            gridTemplateRows: "1fr",
                          }
                        : count === 2
                          ? {
                              gridTemplateColumns: "1fr 1fr",
                              gridTemplateRows: "1fr",
                            }
                          : {
                              gridTemplateColumns: "1fr 1fr",
                              gridTemplateRows: "1fr 1fr",
                            }),
                    }}
                  >
                    {groupHeaderInitials.slice(0, 4).map((initial, cellIdx) => {
                      let participantKey = "";
                      if (
                        Array.isArray(selectedChat?.participant_details) &&
                        selectedChat.participant_details[cellIdx]
                      ) {
                        const p = selectedChat.participant_details[cellIdx];
                        participantKey = (
                          p?.email ||
                          p?.user_email ||
                          ""
                        ).toLowerCase();
                      } else if (
                        Array.isArray(selectedChat?.participants) &&
                        selectedChat.participants[cellIdx]
                      ) {
                        const p = selectedChat.participants[cellIdx];
                        if (typeof p === "string")
                          participantKey = p.toLowerCase();
                        else if (p && typeof p === "object")
                          participantKey = (
                            p.email ||
                            p.user_email ||
                            ""
                          ).toLowerCase();
                      } else if (initial) participantKey = initial;
                      else
                        participantKey = (
                          selectedChat?.id ||
                          selectedChat?.name ||
                          ""
                        )
                          .toString()
                          .toLowerCase();
                      return (
                        <div
                          key={`group-header-initial-${cellIdx}`}
                          className="flex items-center justify-center text-[8px] font-semibold"
                          style={{
                            backgroundColor:
                              stringToPastelColor(participantKey),
                            color: stringToDarkColor(participantKey),
                            width: "100%",
                            height: "100%",
                          }}
                        >
                          {initial || ""}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="relative w-[30px] h-[30px]">
              <div
                className="w-[30px] h-[30px] rounded-full text-[11px] font-semibold flex items-center justify-center uppercase"
                style={{
                  backgroundColor: stringToPastelColor(
                    (
                      headerInfo?.email ||
                      headerInfo?.id ||
                      headerInfo?.name ||
                      ""
                    )
                      .toString()
                      .toLowerCase(),
                  ),
                  color: stringToDarkColor(
                    (
                      headerInfo?.email ||
                      headerInfo?.id ||
                      headerInfo?.name ||
                      ""
                    )
                      .toString()
                      .toLowerCase(),
                  ),
                }}
              >
                {getInitials() || "U"}
              </div>
              {headerInfo.isOnline === true && (
                <span className="absolute left-[25px] -translate-x-1/2 bottom-0 w-[5px] h-[5px] bg-[#03C582] rounded-full opacity-100  z-20" />
              )}
            </div>
          )}
          <div className="flex flex-col justify-center gap-[2px] w-[150px] h-[29px]">
            <div className="flex items-center gap-[14px] w-[123px] h-[18px]">
              <span className="inter-bold text-[12px] tracking-[0.07em] text-white truncate max-w-[90px]">
                {headerInfo.name}
              </span>
              {headerInfo.isGroup && (
                <button
                  onClick={handleOpenEditGroupName}
                  className="w-[16px] h-[16px] flex items-center justify-center cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M2 13H4.5L13 4.5C13.3 4.2 13.5 3.8 13.5 3.4C13.5 3 13.3 2.6 13 2.3L11.7 1C11.4 0.7 11 0.5 10.6 0.5C10.2 0.5 9.8 0.7 9.5 1L1 9.5V13H2Z"
                      stroke="#6A37F5"
                      strokeWidth="1.5"
                    />
                  </svg>
                </button>
              )}
            </div>
            {/* Online/Offline status below name - only for individual chats */}
            {!headerInfo.isGroup && (
              <span
                className={`inter-regular text-[8px] tracking-[0.07em] max-w-[180px] whitespace-normal break-words ${headerInfo.isOnline === true ? "text-green-500" : "text-[#B6B6B6]"}`}
              >
                {headerInfo.isOnline === true ? "Online" : "Offline"}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-row items-center justify-between w-[200px] h-[20px]">
          <div className="flex flex-row items-center gap-5 h-[20px]">
            {headerInfo.isGroup && (
              <div className="relative">
                <button
                  type="button"
                  ref={participantsButtonRef}
                  onClick={() => setShowParticipantsPanel((prev) => !prev)}
                  className="w-[18px] h-[18px] flex items-center justify-center hover:bg-[#1A2448]"
                  title="Participants"
                >
                  <svg
                    width="23"
                    height="22"
                    viewBox="0 0 23 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6.825 8.45C7.94554 8.45 9.02018 8.00487 9.81253 7.21253C10.6049 6.42018 11.05 5.34554 11.05 4.225C11.05 3.10446 10.6049 2.02981 9.81253 1.23747C9.02018 0.445132 7.94554 0 6.825 0C5.70446 0 4.62981 0.445132 3.83747 1.23747C3.04513 2.02981 2.6 3.10446 2.6 4.225C2.6 5.34554 3.04513 6.42018 3.83747 7.21253C4.62981 8.00487 5.70446 8.45 6.825 8.45ZM20.15 5.2C20.15 6.06195 19.8076 6.8886 19.1981 7.4981C18.5886 8.10759 17.762 8.45 16.9 8.45C16.038 8.45 15.2114 8.10759 14.6019 7.4981C13.9924 6.8886 13.65 6.06195 13.65 5.2C13.65 4.33805 13.9924 3.5114 14.6019 2.9019C15.2114 2.29241 16.038 1.95 16.9 1.95C17.762 1.95 18.5886 2.29241 19.1981 2.9019C19.8076 3.5114 20.15 4.33805 20.15 5.2ZM9.75 15.6C9.75 13.3848 10.7575 11.4036 12.3409 10.0919C11.9477 9.86749 11.5027 9.74963 11.05 9.75H2.6C1.91044 9.75 1.24912 10.0239 0.761522 10.5115C0.273928 10.9991 0 11.6604 0 12.35C0 12.35 0 17.55 6.825 17.55C8.0639 17.55 9.0779 17.3784 9.9073 17.0989C9.80221 16.6062 9.74948 16.1038 9.75 15.6ZM22.75 15.6C22.75 17.1515 22.1337 18.6395 21.0366 19.7366C19.9395 20.8337 18.4515 21.45 16.9 21.45C15.3485 21.45 13.8605 20.8337 12.7634 19.7366C11.6663 18.6395 11.05 17.1515 11.05 15.6C11.05 14.0485 11.6663 12.5605 12.7634 11.4634C13.8605 10.3663 15.3485 9.75 16.9 9.75C18.4515 9.75 19.9395 10.3663 21.0366 11.4634C22.1337 12.5605 22.75 14.0485 22.75 15.6ZM17.55 13C17.55 12.8276 17.4815 12.6623 17.3596 12.5404C17.2377 12.4185 17.0724 12.35 16.9 12.35C16.7276 12.35 16.5623 12.4185 16.4404 12.5404C16.3185 12.6623 16.25 12.8276 16.25 13V14.95H14.3C14.1276 14.95 13.9623 15.0185 13.8404 15.1404C13.7185 15.2623 13.65 15.4276 13.65 15.6C13.65 15.7724 13.7185 15.9377 13.8404 16.0596C13.9623 16.1815 14.1276 16.25 14.3 16.25H16.25V18.2C16.25 18.3724 16.3185 18.5377 16.4404 18.6596C16.5623 18.7815 16.7276 18.85 16.9 18.85C17.0724 18.85 17.2377 18.7815 17.3596 18.6596C17.4815 18.5377 17.55 18.3724 17.55 18.2V16.25H19.5C19.6724 16.25 19.8377 16.1815 19.9596 16.0596C20.0815 15.9377 20.15 15.7724 20.15 15.6C20.15 15.4276 20.0815 15.2623 19.9596 15.1404C19.8377 15.0185 19.6724 14.95 19.5 14.95H17.55V13Z"
                      fill="white"
                    />
                  </svg>
                </button>
                {(showParticipantsPanel || showAddPeoplePopup) && (
                  <div
                    ref={participantsPanelRef}
                    style={{
                      width: 195,
                      height: 288,
                      position: "absolute",
                      top: "250%",
                      left: -100,
                      background: "#fff",
                      color: "#000",
                      borderRadius: 8,
                      border: "1px solid #E6E6E6",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                      zIndex: 9999,
                      padding: 8,
                    }}
                  >
                    <div className="inter-semibold text-[16px] mb-2 tracking-[0.07em]">
                      People
                    </div>
                    <div className="flex flex-col w-[180px] h-[156px] gap-[12px] opacity-100 overflow-y-auto">
                      {Array.isArray(groupMemberDetails) &&
                      groupMemberDetails.length > 0 ? (
                        groupMemberDetails.map((member, idx) => {
                          const firstName =
                            member.first_name || member.firstName || "";
                          const lastName =
                            member.last_name || member.lastName || "";
                          const fullName = (firstName + " " + lastName).trim();
                          const initials =
                            (firstName[0] || "") + (lastName[0] || "");
                          const email = (
                            member.email ||
                            member.user_email ||
                            ""
                          ).toLowerCase();
                          const isOnline = groupOnlineEmails.includes(email);
                          return (
                            <div
                              key={member.id || member.email || idx}
                              className="flex flex-row items-center bg-white text-black text-xs rounded gap-[10px] px-2"
                              style={{
                                width: 135,
                                height: 30,
                                opacity: 1,
                                transform: "rotate(0deg)",
                              }}
                            >
                              {member.profile_image ? (
                                <div className="w-[30px] h-[30px] rounded-full overflow-hidden flex items-center justify-center bg-gray-200 relative">
                                  <img
                                    src={member.profile_image}
                                    alt={fullName || member.email || "User"}
                                    className="w-full h-full object-cover"
                                    style={{ display: "block" }}
                                  />
                                  <span
                                    className={`absolute left-1/2 -translate-x-1/2 bottom-[-4px] w-[10px] h-[10px] rounded-full border-2 border-white ${isOnline ? "bg-green-500" : "bg-red-500"}`}
                                    title={isOnline ? "Online" : "Offline"}
                                  />
                                </div>
                              ) : (
                                <div
                                  className="w-[30px] h-[30px] rounded-full flex items-center justify-center font-semibold text-[11px] uppercase relative"
                                  style={{
                                    minWidth: 30,
                                    minHeight: 30,
                                    backgroundColor: stringToPastelColor(
                                      (
                                        member.email ||
                                        member.id ||
                                        fullName ||
                                        ""
                                      )
                                        .toString()
                                        .toLowerCase(),
                                    ),
                                    color: stringToDarkColor(
                                      (
                                        member.email ||
                                        member.id ||
                                        fullName ||
                                        ""
                                      )
                                        .toString()
                                        .toLowerCase(),
                                    ),
                                  }}
                                >
                                  {initials}
                                  <span
                                    className={`absolute left-[26px] -translate-x-1/2 bottom-[3px] w-[5px] h-[5px] rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`}
                                    title={isOnline ? "Online" : "Offline"}
                                  />
                                </div>
                              )}
                              <span className="truncate inter-regular text-[12px] tracking-[0.07em]">
                                {fullName ||
                                  member.name ||
                                  member.email ||
                                  member.id ||
                                  ""}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-xs text-gray-500 px-2 py-1">
                          No participants
                        </div>
                      )}
                    </div>
                    <div
                      className="w-full mt-[10px] flex flex-col"
                      style={{
                        width: 180,
                        height: 72,
                        opacity: 1,
                        transform: "rotate(0deg)",
                      }}
                    >
                      <button
                        className="w-full h-[36px] flex items-center px-[10px] gap-[10px]"
                        onClick={() => setShowAddPeoplePopup(true)}
                        disabled={isLeavingGroup}
                      >
                        <div className="w-[24px] h-[24px]">
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"
                              fill="black"
                            />
                          </svg>
                        </div>
                        <span className="inter-regular text-[16px] tracking-[0.07em]">
                          Add people
                        </span>
                      </button>
                      <button
                        className="w-full h-[36px] flex items-center px-[10px] gap-[10px]"
                        onClick={handleLeaveGroup}
                        disabled={isLeavingGroup}
                        style={{
                          background: isLeavingGroup ? "#eee" : "#fff",
                          borderRadius: 6,
                          cursor: isLeavingGroup ? "not-allowed" : "pointer",
                        }}
                      >
                        <div className="w-[24px] h-[24px]">
                          <svg
                            width="22"
                            height="22"
                            viewBox="0 0 22 22"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M22 16.5V17.875H15.0605L17.3271 20.1416L16.3604 21.1084L12.4395 17.1875L16.3604 13.2666L17.3271 14.2334L15.0605 16.5H22ZM13.8789 11.8486L12.9336 12.8477C12.2962 12.2461 11.5765 11.7878 10.7744 11.4727C9.97233 11.1576 9.13086 11 8.25 11C7.61979 11 7.01107 11.0824 6.42383 11.2471C5.83659 11.4118 5.28874 11.641 4.78027 11.9346C4.27181 12.2282 3.8099 12.5863 3.39453 13.0088C2.97917 13.4313 2.62109 13.8968 2.32031 14.4053C2.01953 14.9137 1.78678 15.4616 1.62207 16.0488C1.45736 16.6361 1.375 17.2448 1.375 17.875H0C0 17.0371 0.125326 16.2171 0.375977 15.415C0.626628 14.613 0.988281 13.8717 1.46094 13.1914C1.93359 12.5111 2.49577 11.9059 3.14746 11.376C3.79915 10.846 4.52604 10.4414 5.32812 10.1621C4.92708 9.9043 4.56901 9.6071 4.25391 9.27051C3.9388 8.93392 3.66667 8.5651 3.4375 8.16406C3.20833 7.76302 3.04004 7.34049 2.93262 6.89648C2.8252 6.45247 2.76432 5.98698 2.75 5.5C2.75 4.74089 2.89323 4.02832 3.17969 3.3623C3.46615 2.69629 3.85645 2.11263 4.35059 1.61133C4.84473 1.11003 5.42839 0.716146 6.10156 0.429688C6.77474 0.143229 7.49089 0 8.25 0C9.00911 0 9.72168 0.143229 10.3877 0.429688C11.0537 0.716146 11.6374 1.10645 12.1387 1.60059C12.64 2.09473 13.0339 2.67839 13.3203 3.35156C13.6068 4.02474 13.75 4.74089 13.75 5.5C13.75 6.48112 13.5244 7.36914 13.0732 8.16406C12.6221 8.95898 11.9883 9.625 11.1719 10.1621C11.6732 10.3483 12.1494 10.5846 12.6006 10.8711C13.0518 11.1576 13.4779 11.4834 13.8789 11.8486ZM4.125 5.5C4.125 6.07292 4.23242 6.60645 4.44727 7.10059C4.66211 7.59473 4.95573 8.03158 5.32812 8.41113C5.70052 8.79069 6.13737 9.08789 6.63867 9.30273C7.13997 9.51758 7.67708 9.625 8.25 9.625C8.81576 9.625 9.34928 9.51758 9.85059 9.30273C10.3519 9.08789 10.7887 8.79427 11.1611 8.42188C11.5335 8.04948 11.8307 7.61263 12.0527 7.11133C12.2747 6.61003 12.3822 6.07292 12.375 5.5C12.375 4.93424 12.2676 4.40072 12.0527 3.89941C11.8379 3.39811 11.5443 2.96126 11.1719 2.58887C10.7995 2.21647 10.359 1.91927 9.85059 1.69727C9.34212 1.47526 8.80859 1.36784 8.25 1.375C7.67708 1.375 7.14355 1.48242 6.64941 1.69727C6.15527 1.91211 5.71842 2.20573 5.33887 2.57812C4.95931 2.95052 4.66211 3.39095 4.44727 3.89941C4.23242 4.40788 4.125 4.94141 4.125 5.5Z"
                              fill="black"
                            />
                          </svg>
                        </div>
                        <span className="inter-regular text-[16px] tracking-[0.07em]">
                          Leave
                        </span>
                        {isLeavingGroup && (
                          <span className="ml-2 text-xs text-gray-500">
                            Leaving...
                          </span>
                        )}
                      </button>
                    </div>
                    <ParticipantsPanel
                      groupMembers={groupMemberDetails}
                      groupMemberDetails={groupMemberDetails}
                      groupOnlineEmails={groupOnlineEmails}
                      memberQuery={memberQuery}
                      setMemberQuery={setMemberQuery}
                      memberSearchResults={memberSearchResults}
                      isAddingMember={isAddingMember}
                      handleAddMember={handleAddMember}
                      isLeavingGroup={isLeavingGroup}
                      handleLeaveGroup={handleLeaveGroup}
                      stringToPastelColor={stringToPastelColor}
                      stringToDarkColor={stringToDarkColor}
                    />
                  </div>
                )}
              </div>
            )}
            <button
              onClick={handleCallClick}
              disabled={isCallLoading || !selectedChat}
              className={`focus:outline-none ${isCallLoading ? "opacity-50 cursor-wait" : "cursor-pointer hover:opacity-80"}`}
              title={
                selectedChat ? "Start call" : "Select a chat to start a call"
              }
            >
              {isCallLoading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <ChatProfileCallIcon />
              )}
            </button>
            <span
              style={{
                marginLeft: "-10px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <ChatProfileDropdownIcon />
            </span>
            <ChatProfileSearchIcon />
            {headerInfo.isGroup && (
              <>
                <div
                  className="w-[16px] h-[16px] flex items-center justify-center cursor-pointer"
                  ref={dotsRef}
                  onClick={() => setShowDotsPopup((prev) => !prev)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 2 10"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1.5 5C1.5 5.14834 1.45601 5.29334 1.3736 5.41668C1.29119 5.54002 1.17406 5.63614 1.03701 5.69291C0.899968 5.74968 0.749168 5.76453 0.603683 5.73559C0.458197 5.70665 0.32456 5.63522 0.21967 5.53033C0.114781 5.42544 0.0433503 5.2918 0.0144114 5.14632C-0.0145275 5.00083 0.000324965 4.85003 0.0570907 4.71299C0.113856 4.57594 0.209986 4.45881 0.333323 4.3764C0.45666 4.29399 0.601664 4.25 0.750001 4.25C0.948913 4.25 1.13968 4.32902 1.28033 4.46967C1.42098 4.61032 1.5 4.80109 1.5 5ZM0.750001 1.5C0.898337 1.5 1.04334 1.45601 1.16668 1.3736C1.29001 1.29119 1.38614 1.17406 1.44291 1.03701C1.49968 0.899968 1.51453 0.749169 1.48559 0.603683C1.45665 0.458197 1.38522 0.32456 1.28033 0.21967C1.17544 0.114781 1.0418 0.0433503 0.896318 0.0144114C0.750832 -0.0145275 0.600033 0.000324965 0.462988 0.0570907C0.325943 0.113856 0.208809 0.209986 0.126398 0.333323C0.043987 0.45666 4.04494e-07 0.601664 4.04494e-07 0.750001C4.04494e-07 0.948913 0.0790179 1.13968 0.21967 1.28033C0.360323 1.42098 0.551088 1.5 0.750001 1.5ZM0.750001 8.5C0.601664 8.5 0.45666 8.54399 0.333323 8.6264C0.209986 8.70881 0.113856 8.82594 0.0570907 8.96299C0.000324965 9.10003 -0.0145275 9.25083 0.0144114 9.39632C0.0433503 9.5418 0.114781 9.67544 0.21967 9.78033C0.32456 9.88522 0.458197 9.95665 0.603683 9.98559C0.749168 10.0145 0.899968 9.99968 1.03701 9.94291C1.17406 9.88614 1.29119 9.79002 1.3736 9.66668C1.45601 9.54334 1.5 9.39834 1.5 9.25C1.5 9.05109 1.42098 8.86032 1.28033 8.71967C1.13968 8.57902 0.948913 8.5 0.750001 8.5Z"
                      fill="white"
                    />
                  </svg>
                </div>
                <ChatMessagePopup
                  show={showDotsPopup}
                  anchorRef={dotsRef}
                  onClose={() => setShowDotsPopup(false)}
                  chatId={
                    selectedChat?.id ||
                    selectedChat?._id ||
                    selectedChat?.roomId
                  }
                  groupMembers={groupMembers}
                  groupMemberDetails={groupMemberDetails}
                  groupOnlineEmails={groupOnlineEmails}
                  stringToPastelColor={stringToPastelColor}
                  stringToDarkColor={stringToDarkColor}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex flex-col w-full flex-1 min-h-0 px-[20px] pt-[20px] overflow-hidden">
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto pb-[0px] relative chat-scroll-area [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {!selectedChat ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-400">
                  <p className="text-lg mb-2">Welcome to Chats</p>
                  <p className="text-sm">
                    Select a conversation or search for users to start chatting
                  </p>
                </div>
              </div>
            ) : messages && messages.length > 0 ? (
              <>
                {Object.entries(groupMessagesByDate()).map(
                  ([date, dateMessages]) => (
                    <div key={date}>
                      <div className="flex justify-center mb-4">
                        <div className="px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-600">
                          {date}
                        </div>
                      </div>
                      {buildMessageRenderItems(dateMessages).map(
                        (item, idx) => {
                          const message =
                            item.type === "single"
                              ? item.message
                              : item.messages[0];
                          const isFromMe = isMessageFromCurrentUser(message);
                          const isInlineEditing =
                            editingMessageId === message?.id;
                          const hasLocalEditedOverride =
                            message?.id !== undefined && message?.id !== null
                              ? Object.prototype.hasOwnProperty.call(
                                  editedMessageContentById,
                                  message.id,
                                )
                              : false;
                          const isMessageEdited = Boolean(
                            message?.is_edited || hasLocalEditedOverride,
                          );
                          const senderName = getSenderDisplayName(message);
                          const rawFileUrl =
                            message.fileUrl || message.attachment_url;
                          const hasAttachment = Boolean(
                            message?.isFile || rawFileUrl,
                          );
                          const resolvedFileUrl =
                            resolveAttachmentUrl(rawFileUrl);
                          const looksLikeImage =
                            isImageUrl(resolvedFileUrl || "") ||
                            (message.fileName || "").match(
                              /\.(png|jpe?g|gif|webp|bmp|svg)$/i,
                            );
                          const isDeletedMessage = Boolean(message?.is_deleted);
                          const canEditMessage =
                            isFromMe &&
                            !isDeletedMessage &&
                            (message?.isFile ||
                              rawFileUrl ||
                              message?.content ||
                              message?.text);
                          const canDeleteMessage =
                            isFromMe && !isDeletedMessage;
                          const isDeletingMessage = Boolean(
                            deletingMessageIds[message?.id],
                          );
                          const rawRenderedMessageContent = isDeletedMessage
                            ? "This message has been deleted"
                            : (editedMessageContentById[message?.id] ??
                              message?.content ??
                              message?.text);
                          const shouldHideAttachmentLabel =
                            !isDeletedMessage &&
                            hasAttachment &&
                            isAttachmentLabelText(rawRenderedMessageContent);
                          const renderedMessageContent =
                            shouldHideAttachmentLabel
                              ? ""
                              : rawRenderedMessageContent;
                          const menuKey = message.id
                            ? `${message.id}-${message.timestamp || idx}`
                            : `temp-${date}-${idx}`;
                          const isStarred = getMessageStarState(message);
                          const isStarring = starringInProgress[message.id];

                          if (isDeletedMessage) {
                            return (
                              <div
                                key={menuKey}
                                className={`flex mb-5 ${isFromMe ? "justify-end" : "justify-start"} group`}
                              >
                                <div
                                  className={`flex flex-row max-w-[70%] ${isFromMe ? "items-end" : "items-start"} relative`}
                                >
                                  {!isFromMe &&
                                    (message.sender_profile_image &&
                                    !failedSenderAvatars[menuKey] ? (
                                      <img
                                        src={message.sender_profile_image}
                                        alt={senderName}
                                        onError={() =>
                                          setFailedSenderAvatars((prev) => ({
                                            ...prev,
                                            [menuKey]: true,
                                          }))
                                        }
                                        className="w-[30px] h-[30px] rounded-full object-cover mr-3"
                                      />
                                    ) : (
                                      <div
                                        className="w-[30px] h-[30px] rounded-full text-[11px] font-semibold flex items-center justify-center uppercase mr-3"
                                        style={{
                                          backgroundColor: stringToPastelColor(
                                            (
                                              message.sender_email ||
                                              message.senderFirstName ||
                                              message.sender_first_name ||
                                              ""
                                            )
                                              .toString()
                                              .toLowerCase(),
                                          ),
                                          color: stringToDarkColor(
                                            (
                                              message.sender_email ||
                                              message.senderFirstName ||
                                              message.sender_first_name ||
                                              ""
                                            )
                                              .toString()
                                              .toLowerCase(),
                                          ),
                                        }}
                                      >
                                        {getInitials(
                                          message.sender_first_name ||
                                            message.senderFirstName,
                                          message.sender_last_name ||
                                            message.senderLastName,
                                          senderName,
                                        ) || "U"}
                                      </div>
                                    ))}
                                  <div className="flex flex-col flex-1">
                                    {!isFromMe && (
                                      <span className="inter-bold text-[11px] mb-3 ml-2 flex items-center gap-2">
                                        {senderName}
                                        <span className="inter-regular text-[9px] text-[#898989] ml-2">
                                          {message.formattedTime ||
                                            formatMessageTime(
                                              message.timestamp,
                                            )}
                                          {isMessageEdited && " • Edited"}
                                        </span>
                                      </span>
                                    )}
                                    {isFromMe && (
                                      <div className="flex justify-end mb-1 pr-1">
                                        <span className="inter-regular text-[9px] text-[#898989]">
                                          {message.formattedTime ||
                                            formatMessageTime(
                                              message.timestamp,
                                            )}
                                          {isMessageEdited && " • Edited"}
                                        </span>
                                      </div>
                                    )}
                                    <div className="px-4 py-2 rounded-lg relative bg-[#EDEDED] text-[#000000]">
                                      <p className="text-sm break-words whitespace-pre-wrap italic text-[#6B6B6B]">
                                        This message has been deleted
                                      </p>
                                    </div>
                                  </div>
                                  {isFromMe && (
                                    <div className="flex flex-row gap-[10px] items-center ml-2 mb-1">
                                      {currentUser?.profile_image &&
                                      !myAvatarLoadFailed ? (
                                        <img
                                          src={currentUser.profile_image}
                                          alt="You"
                                          onError={() =>
                                            setMyAvatarLoadFailed(true)
                                          }
                                          className="w-[30px] h-[30px] rounded-full object-cover"
                                        />
                                      ) : (
                                        <div
                                          className="w-[30px] h-[30px] rounded-full text-[11px] font-semibold flex items-center justify-center uppercase"
                                          style={{
                                            backgroundColor:
                                              stringToPastelColor(
                                                (
                                                  currentUser?.email ||
                                                  currentUser?.id ||
                                                  currentUser?.fullName ||
                                                  ""
                                                )
                                                  .toString()
                                                  .toLowerCase(),
                                              ),
                                            color: stringToDarkColor(
                                              (
                                                currentUser?.email ||
                                                currentUser?.id ||
                                                currentUser?.fullName ||
                                                ""
                                              )
                                                .toString()
                                                .toLowerCase(),
                                            ),
                                          }}
                                        >
                                          {getInitials(
                                            currentUser?.first_name,
                                            currentUser?.last_name,
                                            currentUser?.fullName,
                                          ) || "U"}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }

                          if (item.type === "image_batch") {
                            const imageMessages = item.messages;
                            const batchKey = `batch-${menuKey}`;
                            const allDeleted = imageMessages.every(
                              (imgMsg) => imgMsg.is_deleted,
                            );
                            if (allDeleted) {
                              return (
                                <div
                                  key={batchKey}
                                  className={`flex mb-5 ${isFromMe ? "justify-end" : "justify-start"} group`}
                                >
                                  <div
                                    className={`flex flex-row max-w-[70%] ${isFromMe ? "items-end" : "items-start"} relative`}
                                  >
                                    {!isFromMe &&
                                      (message.sender_profile_image &&
                                      !failedSenderAvatars[batchKey] ? (
                                        <img
                                          src={message.sender_profile_image}
                                          alt={senderName}
                                          onError={() =>
                                            setFailedSenderAvatars((prev) => ({
                                              ...prev,
                                              [batchKey]: true,
                                            }))
                                          }
                                          className="w-[30px] h-[30px] rounded-full object-cover mr-3"
                                        />
                                      ) : (
                                        <div className="w-[30px] h-[30px] rounded-full bg-gray-500 text-white text-[11px] font-semibold flex items-center justify-center uppercase mr-3">
                                          {getInitials(
                                            message.sender_first_name ||
                                              message.senderFirstName,
                                            message.sender_last_name ||
                                              message.senderLastName,
                                            senderName,
                                          ) || "U"}
                                        </div>
                                      ))}
                                    <div className="flex flex-col flex-1">
                                      {/* Receiver: name + time + three-dot in single row */}
                                      {!isFromMe && (
                                        <div
                                          className="flex items-center mb-2 ml-2 w-full"
                                          style={{ minHeight: 24 }}
                                        >
                                          <span className="inter-bold text-[11px] flex-shrink-0">
                                            {senderName}
                                          </span>
                                          <span className="inter-regular text-[9px] text-[#898989] ml-2 flex-shrink-0 whitespace-nowrap">
                                            {message.formattedTime ||
                                              formatMessageTime(
                                                message.timestamp,
                                              )}
                                            {isMessageEdited && " • Edited"}
                                          </span>
                                          <div
                                            className={`ml-auto pl-3 flex items-center gap-[6px] transition-opacity duration-200 ${openMenuIdx === batchKey ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                                          >
                                            <button
                                              className="w-[16px] h-[16px] flex items-center justify-center focus:outline-none cursor-pointer"
                                              style={{
                                                zIndex:
                                                  openMenuIdx === batchKey
                                                    ? 1
                                                    : 10,
                                              }}
                                              ref={(el) =>
                                                (buttonRefs.current[batchKey] =
                                                  el)
                                              }
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuIdx(
                                                  openMenuIdx === batchKey
                                                    ? null
                                                    : batchKey,
                                                );
                                              }}
                                            >
                                              <svg
                                                width="18"
                                                height="18"
                                                viewBox="0 0 18 18"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                              >
                                                <circle
                                                  cx="3"
                                                  cy="9"
                                                  r="1.5"
                                                  fill="#000000"
                                                />
                                                <circle
                                                  cx="9"
                                                  cy="9"
                                                  r="1.5"
                                                  fill="#000000"
                                                />
                                                <circle
                                                  cx="15"
                                                  cy="9"
                                                  r="1.5"
                                                  fill="#000000"
                                                />
                                              </svg>
                                            </button>
                                            {openMenuIdx === batchKey && (
                                              <MessageActionPopup
                                                menuKey={batchKey}
                                                menuRefs={menuRefs}
                                                buttonRefs={buttonRefs}
                                                onClose={() =>
                                                  setOpenMenuIdx(null)
                                                }
                                                onForward={() =>
                                                  handleOpenForwardModal(
                                                    message,
                                                  )
                                                }
                                                onStar={() =>
                                                  handleStarMessage(message.id)
                                                }
                                                onReply={() => {}}
                                                onCopyLink={() => {}}
                                                onSave={() => {}}
                                                onPin={() => {}}
                                                onMarkUnread={() => {}}
                                                onShare={() => {}}
                                                isStarred={isStarred}
                                                isStarring={isStarring}
                                                messageId={message.id}
                                                canEdit={canEditMessage}
                                                onEdit={() =>
                                                  handleStartInlineEditMessage(
                                                    message,
                                                  )
                                                }
                                                canDelete={canDeleteMessage}
                                                onDelete={() =>
                                                  handleDeleteMessage(message)
                                                }
                                                isDeleting={isDeletingMessage}
                                                isSender={isMessageFromCurrentUser(
                                                  message,
                                                )}
                                              />
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* Sender: time + actions on the right */}
                                      {isFromMe && (
                                        <div
                                          className="flex items-center justify-end mb-2 w-full"
                                          style={{ minHeight: 24 }}
                                        >
                                          <span className="inter-regular text-[9px] text-[#898989] flex-shrink-0 whitespace-nowrap">
                                            {message.formattedTime ||
                                              formatMessageTime(
                                                message.timestamp,
                                              )}
                                            {isMessageEdited && " • Edited"}
                                          </span>
                                          <div
                                            className={`ml-3 flex items-center gap-2 transition-opacity duration-200 ${openMenuIdx === batchKey ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                                          >
                                            <button
                                              className={`w-[16px] h-[16px] flex items-center justify-center focus:outline-none cursor-pointer transition-opacity duration-200 relative ${openMenuIdx === batchKey ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                                              style={{
                                                zIndex:
                                                  openMenuIdx === batchKey
                                                    ? 1
                                                    : 10,
                                              }}
                                              ref={(el) =>
                                                (buttonRefs.current[batchKey] =
                                                  el)
                                              }
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuIdx(
                                                  openMenuIdx === batchKey
                                                    ? null
                                                    : batchKey,
                                                );
                                              }}
                                            >
                                              <svg
                                                width="18"
                                                height="18"
                                                viewBox="0 0 18 18"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                              >
                                                <circle
                                                  cx="3"
                                                  cy="9"
                                                  r="1.5"
                                                  fill="#000000"
                                                />
                                                <circle
                                                  cx="9"
                                                  cy="9"
                                                  r="1.5"
                                                  fill="#000000"
                                                />
                                                <circle
                                                  cx="15"
                                                  cy="9"
                                                  r="1.5"
                                                  fill="#000000"
                                                />
                                              </svg>
                                            </button>
                                            <div className="flex items-center gap-[10px]">
                                              <button
                                                type="button"
                                                className={`w-[16px] h-[16px] cursor-pointer flex items-center justify-center focus:outline-none ${canEditMessage ? "" : "opacity-40 cursor-not-allowed"}`}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (!canEditMessage) return;
                                                  handleStartInlineEditMessage(
                                                    message,
                                                  );
                                                }}
                                                title="Edit"
                                                disabled={!canEditMessage}
                                              >
                                                <EditIcon />
                                              </button>
                                              <button
                                                type="button"
                                                className={`w-[16px] h-[16px] cursor-pointer flex items-center justify-center focus:outline-none ${canDeleteMessage && !isDeletingMessage ? "" : "opacity-40 cursor-not-allowed"}`}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (
                                                    !canDeleteMessage ||
                                                    isDeletingMessage
                                                  )
                                                    return;
                                                  if (
                                                    item.type ===
                                                      "image_batch" &&
                                                    item.messages.length > 1
                                                  ) {
                                                    item.messages.forEach(
                                                      (imgMsg) => {
                                                        if (!imgMsg.is_deleted)
                                                          handleDeleteMessage(
                                                            imgMsg,
                                                          );
                                                      },
                                                    );
                                                  } else {
                                                    handleDeleteMessage(
                                                      message,
                                                    );
                                                  }
                                                }}
                                                title={
                                                  isDeletingMessage
                                                    ? "Deleting..."
                                                    : "Delete"
                                                }
                                                disabled={
                                                  !canDeleteMessage ||
                                                  isDeletingMessage
                                                }
                                              >
                                                <DeleteIcon />
                                              </button>
                                            </div>
                                            {openMenuIdx === batchKey && (
                                              <MessageActionPopup
                                                menuKey={batchKey}
                                                menuRefs={menuRefs}
                                                buttonRefs={buttonRefs}
                                                onClose={() =>
                                                  setOpenMenuIdx(null)
                                                }
                                                onForward={() =>
                                                  handleOpenForwardModal(
                                                    message,
                                                  )
                                                }
                                                onStar={() =>
                                                  handleStarMessage(message.id)
                                                }
                                                onReply={() => {}}
                                                onCopyLink={() => {}}
                                                onSave={() => {}}
                                                onPin={() => {}}
                                                onMarkUnread={() => {}}
                                                onShare={() => {}}
                                                isStarred={isStarred}
                                                isStarring={isStarring}
                                                messageId={message.id}
                                                canEdit={canEditMessage}
                                                onEdit={() =>
                                                  handleStartInlineEditMessage(
                                                    message,
                                                  )
                                                }
                                                canDelete={canDeleteMessage}
                                                onDelete={() =>
                                                  handleDeleteMessage(message)
                                                }
                                                isDeleting={isDeletingMessage}
                                                isSender={isMessageFromCurrentUser(
                                                  message,
                                                )}
                                              />
                                            )}
                                          </div>
                                        </div>
                                      )}
                                      <div
                                        className={`px-4 py-2 rounded-lg bg-[#EDEDED] text-[#000000] w-fit ${isFromMe ? "self-end" : "self-start"}`}
                                      >
                                        <p className="text-sm break-words whitespace-pre-wrap italic text-[#6B6B6B]">
                                          This message has been deleted
                                        </p>
                                      </div>
                                    </div>
                                    {isFromMe && (
                                      <div className="flex flex-row gap-[10px] items-center ml-2 mb-1">
                                        {currentUser?.profile_image &&
                                        !myAvatarLoadFailed ? (
                                          <img
                                            src={currentUser.profile_image}
                                            alt="You"
                                            onError={() =>
                                              setMyAvatarLoadFailed(true)
                                            }
                                            className="w-[30px] h-[30px] rounded-full object-cover"
                                          />
                                        ) : (
                                          <div
                                            className="w-[30px] h-[30px] rounded-full text-[11px] font-semibold flex items-center justify-center uppercase"
                                            style={{
                                              backgroundColor:
                                                stringToPastelColor(
                                                  (
                                                    currentUser?.email ||
                                                    currentUser?.id ||
                                                    currentUser?.fullName ||
                                                    ""
                                                  )
                                                    .toString()
                                                    .toLowerCase(),
                                                ),
                                              color: stringToDarkColor(
                                                (
                                                  currentUser?.email ||
                                                  currentUser?.id ||
                                                  currentUser?.fullName ||
                                                  ""
                                                )
                                                  .toString()
                                                  .toLowerCase(),
                                              ),
                                            }}
                                          >
                                            {getInitials(
                                              currentUser?.first_name,
                                              currentUser?.last_name,
                                              currentUser?.fullName,
                                            ) || "U"}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <div
                                key={batchKey}
                                className={`flex mb-5 ${isFromMe ? "justify-end" : "justify-start"} group`}
                              >
                                <div
                                  className={`flex flex-row max-w-[70%] ${isFromMe ? "items-end" : "items-start"} relative`}
                                >
                                  {!isFromMe &&
                                    (message.sender_profile_image &&
                                    !failedSenderAvatars[batchKey] ? (
                                      <img
                                        src={message.sender_profile_image}
                                        alt={senderName}
                                        onError={() =>
                                          setFailedSenderAvatars((prev) => ({
                                            ...prev,
                                            [batchKey]: true,
                                          }))
                                        }
                                        className="w-[30px] h-[30px] rounded-full object-cover mr-3"
                                      />
                                    ) : (
                                      <div
                                        className="w-[30px] h-[30px] rounded-full text-[11px] font-semibold flex items-center justify-center uppercase mr-3"
                                        style={{
                                          backgroundColor: stringToPastelColor(
                                            (
                                              message.sender_email ||
                                              message.senderFirstName ||
                                              message.sender_first_name ||
                                              ""
                                            )
                                              .toString()
                                              .toLowerCase(),
                                          ),
                                          color: stringToDarkColor(
                                            (
                                              message.sender_email ||
                                              message.senderFirstName ||
                                              message.sender_first_name ||
                                              ""
                                            )
                                              .toString()
                                              .toLowerCase(),
                                          ),
                                        }}
                                      >
                                        {getInitials(
                                          message.sender_first_name ||
                                            message.senderFirstName,
                                          message.sender_last_name ||
                                            message.senderLastName,
                                          senderName,
                                        ) || "U"}
                                      </div>
                                    ))}
                                  <div className="flex flex-col flex-1 min-w-0">
                                    {/* Receiver: name + time + three-dot in single row */}
                                    {!isFromMe && (
                                      <div
                                        className="relative flex items-center mb-2 ml-2 w-full"
                                        style={{ minHeight: 24 }}
                                      >
                                        <span className="inter-bold text-[11px] flex-shrink-0">
                                          {senderName}
                                        </span>
                                        <span className="inter-regular text-[9px] text-[#898989] ml-2">
                                          {message.formattedTime ||
                                            formatMessageTime(
                                              message.timestamp,
                                            )}
                                          {isMessageEdited && " • Edited"}
                                        </span>
                                        <div
                                          className={`absolute flex items-center gap-[6px] transition-opacity duration-200 ${openMenuIdx === batchKey ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                                          style={{
                                            left: `calc(${Math.min(senderName.length, 15) * 7.5}px + 16px)`,
                                          }}
                                        >
                                          <button
                                            className="w-[16px] h-[16px] flex items-center justify-center focus:outline-none cursor-pointer"
                                            style={{
                                              zIndex:
                                                openMenuIdx === batchKey
                                                  ? 1
                                                  : 10,
                                            }}
                                            ref={(el) =>
                                              (buttonRefs.current[batchKey] =
                                                el)
                                            }
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setOpenMenuIdx(
                                                openMenuIdx === batchKey
                                                  ? null
                                                  : batchKey,
                                              );
                                            }}
                                          >
                                            <svg
                                              width="18"
                                              height="18"
                                              viewBox="0 0 18 18"
                                              fill="none"
                                              xmlns="http://www.w3.org/2000/svg"
                                            >
                                              <circle
                                                cx="3"
                                                cy="9"
                                                r="1.5"
                                                fill="#000000"
                                              />
                                              <circle
                                                cx="9"
                                                cy="9"
                                                r="1.5"
                                                fill="#000000"
                                              />
                                              <circle
                                                cx="15"
                                                cy="9"
                                                r="1.5"
                                                fill="#000000"
                                              />
                                            </svg>
                                          </button>
                                          {openMenuIdx === batchKey && (
                                            <MessageActionPopup
                                              menuKey={batchKey}
                                              menuRefs={menuRefs}
                                              buttonRefs={buttonRefs}
                                              onClose={() =>
                                                setOpenMenuIdx(null)
                                              }
                                              onForward={() =>
                                                handleOpenForwardModal(message)
                                              }
                                              onStar={() =>
                                                handleStarMessage(message.id)
                                              }
                                              onReply={() => {}}
                                              onCopyLink={() => {}}
                                              onSave={() => {}}
                                              onPin={() => {}}
                                              onMarkUnread={() => {}}
                                              onShare={() => {}}
                                              isStarred={isStarred}
                                              isStarring={isStarring}
                                              messageId={message.id}
                                              canEdit={canEditMessage}
                                              onEdit={() =>
                                                handleStartInlineEditMessage(
                                                  message,
                                                )
                                              }
                                              canDelete={canDeleteMessage}
                                              onDelete={() =>
                                                handleDeleteMessage(message)
                                              }
                                              isDeleting={isDeletingMessage}
                                              isSender={isMessageFromCurrentUser(
                                                message,
                                              )}
                                            />
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Sender: time + actions on the right */}
                                    {isFromMe && (
                                      <div
                                        className="relative flex items-center justify-end mb-2"
                                        style={{ minHeight: 24 }}
                                      >
                                        <span className="inter-regular text-[9px] text-[#898989]">
                                          {message.formattedTime ||
                                            formatMessageTime(
                                              message.timestamp,
                                            )}
                                          {isMessageEdited && " • Edited"}
                                        </span>
                                        <div
                                          className={`absolute right-0 flex items-center gap-2 transition-opacity duration-200 ${openMenuIdx === batchKey ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                                        >
                                          <button
                                            className={`w-[16px] h-[16px] flex items-center justify-center focus:outline-none cursor-pointer transition-opacity duration-200 relative ${openMenuIdx === batchKey ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                                            style={{
                                              zIndex:
                                                openMenuIdx === batchKey
                                                  ? 1
                                                  : 10,
                                            }}
                                            ref={(el) =>
                                              (buttonRefs.current[batchKey] =
                                                el)
                                            }
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setOpenMenuIdx(
                                                openMenuIdx === batchKey
                                                  ? null
                                                  : batchKey,
                                              );
                                            }}
                                          >
                                            <svg
                                              width="18"
                                              height="18"
                                              viewBox="0 0 18 18"
                                              fill="none"
                                              xmlns="http://www.w3.org/2000/svg"
                                            >
                                              <circle
                                                cx="3"
                                                cy="9"
                                                r="1.5"
                                                fill="#000000"
                                              />
                                              <circle
                                                cx="9"
                                                cy="9"
                                                r="1.5"
                                                fill="#000000"
                                              />
                                              <circle
                                                cx="15"
                                                cy="9"
                                                r="1.5"
                                                fill="#000000"
                                              />
                                            </svg>
                                          </button>
                                          <div className="flex items-center gap-[10px]">
                                            <button
                                              type="button"
                                              className={`w-[16px] h-[16px] cursor-pointer flex items-center justify-center focus:outline-none ${canEditMessage ? "" : "opacity-40 cursor-not-allowed"}`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (!canEditMessage) return;
                                                handleStartInlineEditMessage(
                                                  message,
                                                );
                                              }}
                                              title="Edit"
                                              disabled={!canEditMessage}
                                            >
                                              <EditIcon />
                                            </button>
                                            <button
                                              type="button"
                                              className={`w-[16px] h-[16px] cursor-pointer flex items-center justify-center focus:outline-none ${canDeleteMessage && !isDeletingMessage ? "" : "opacity-40 cursor-not-allowed"}`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (
                                                  !canDeleteMessage ||
                                                  isDeletingMessage
                                                )
                                                  return;
                                                if (
                                                  item.type === "image_batch" &&
                                                  item.messages.length > 1
                                                ) {
                                                  item.messages.forEach(
                                                    (imgMsg) => {
                                                      if (!imgMsg.is_deleted)
                                                        handleDeleteMessage(
                                                          imgMsg,
                                                        );
                                                    },
                                                  );
                                                } else {
                                                  handleDeleteMessage(message);
                                                }
                                              }}
                                              title={
                                                isDeletingMessage
                                                  ? "Deleting..."
                                                  : "Delete"
                                              }
                                              disabled={
                                                !canDeleteMessage ||
                                                isDeletingMessage
                                              }
                                            >
                                              <DeleteIcon />
                                            </button>
                                          </div>
                                          {openMenuIdx === batchKey && (
                                            <MessageActionPopup
                                              menuKey={batchKey}
                                              menuRefs={menuRefs}
                                              buttonRefs={buttonRefs}
                                              onClose={() =>
                                                setOpenMenuIdx(null)
                                              }
                                              onForward={() =>
                                                handleOpenForwardModal(message)
                                              }
                                              onStar={() =>
                                                handleStarMessage(message.id)
                                              }
                                              onReply={() => {}}
                                              onCopyLink={() => {}}
                                              onSave={() => {}}
                                              onPin={() => {}}
                                              onMarkUnread={() => {}}
                                              onShare={() => {}}
                                              isStarred={isStarred}
                                              isStarring={isStarring}
                                              messageId={message.id}
                                              canEdit={canEditMessage}
                                              onEdit={() =>
                                                handleStartInlineEditMessage(
                                                  message,
                                                )
                                              }
                                              canDelete={canDeleteMessage}
                                              onDelete={() =>
                                                handleDeleteMessage(message)
                                              }
                                              isDeleting={isDeletingMessage}
                                              isSender={isMessageFromCurrentUser(
                                                message,
                                              )}
                                            />
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Image message bubble */}
                                    <div
                                      className={`px-4 py-2 rounded-lg bg-[#EDEDED] text-[#000000] w-fit ${isFromMe ? "self-end" : "self-start"}`}
                                    >
                                      <div className="flex flex-col gap-2">
                                        <div className="flex flex-row flex-wrap gap-2">
                                          {imageMessages.map(
                                            (imgMsg, imgIdx) => {
                                              const imgFileUrl =
                                                resolveAttachmentUrl(
                                                  imgMsg.fileUrl ||
                                                    imgMsg.attachment_url,
                                                );
                                              const imgFileName =
                                                getAttachmentDisplayName(
                                                  imgMsg,
                                                );
                                              const imgIsDeleted =
                                                imgMsg.is_deleted;
                                              return imgIsDeleted ? null : (
                                                <a
                                                  key={imgMsg.id || imgIdx}
                                                  href={imgFileUrl}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="block"
                                                  style={{
                                                    width: 56,
                                                    height: 56,
                                                    borderRadius: 8.27,
                                                    opacity: 1,
                                                    transform: "rotate(0deg)",
                                                  }}
                                                  onClick={(e) =>
                                                    e.stopPropagation()
                                                  }
                                                >
                                                  <img
                                                    src={imgFileUrl}
                                                    alt={imgFileName}
                                                    style={{
                                                      width: 56,
                                                      height: 56,
                                                      borderRadius: 8.27,
                                                      opacity: 1,
                                                      objectFit: "cover",
                                                      display: "block",
                                                    }}
                                                  />
                                                </a>
                                              );
                                            },
                                          )}
                                        </div>
                                        {isInlineEditing ? (
                                          <div className="flex flex-col gap-2 mt-2">
                                            {/* <textarea value={editingMessageDraft} onChange={(event) => setEditingMessageDraft(event.target.value)} className="w-full min-h-[64px] text-sm bg-white border border-[#D7D7D7] rounded-[6px] px-2 py-1 outline-none" autoFocus placeholder="Edit image message" onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); handleCancelInlineEditMessage(); } if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleSaveInlineEditMessage(); } }} /> */}
                                            <textarea
                                              value={editingMessageDraft}
                                              onChange={(event) =>
                                                setEditingMessageDraft(
                                                  event.target.value,
                                                )
                                              }
                                              className="w-full min-h-[64px] text-sm bg-white border border-[#D7D7D7] rounded-[6px] px-2 py-1 outline-none"
                                              autoFocus
                                              placeholder="Edit message..." // Always show "Edit message..." not "Edit file name..."
                                              onKeyDown={(event) => {
                                                if (event.key === "Escape") {
                                                  event.preventDefault();
                                                  handleCancelInlineEditMessage();
                                                }
                                                if (
                                                  event.key === "Enter" &&
                                                  !event.shiftKey
                                                ) {
                                                  event.preventDefault();
                                                  handleSaveInlineEditMessage();
                                                }
                                              }}
                                            />
                                            <div className="flex items-center justify-end gap-2">
                                              <button
                                                type="button"
                                                className="h-[24px] px-2 rounded-[4px] border border-[#D9D9D9] text-[10px]"
                                                onClick={
                                                  handleCancelInlineEditMessage
                                                }
                                                disabled={isSavingEditedMessage}
                                              >
                                                Cancel
                                              </button>
                                              <button
                                                type="button"
                                                className="h-[24px] px-2 rounded-[4px] bg-[#040B23] text-white text-[10px] disabled:opacity-50"
                                                onClick={
                                                  handleSaveInlineEditMessage
                                                }
                                                disabled={
                                                  isSavingEditedMessage ||
                                                  !String(
                                                    editingMessageDraft || "",
                                                  ).trim()
                                                }
                                              >
                                                {isSavingEditedMessage
                                                  ? "Saving..."
                                                  : "Save"}
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          // Only show content if not an image batch (prevents 'Sent a file: ...' below images)
                                          (message.content ||
                                            editedMessageContentById[
                                              message.id
                                            ]) &&
                                          !message.content?.startsWith("📎") &&
                                          !message.content
                                            ?.toLowerCase()
                                            .startsWith("sent a file:") && (
                                            <p className="text-sm break-words whitespace-pre-wrap mt-2">
                                              {editedMessageContentById[
                                                message.id
                                              ] || message.content}
                                            </p>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {isFromMe && (
                                    <div className="flex flex-row gap-[10px] items-center ml-2 mb-1">
                                      {currentUser?.profile_image &&
                                      !myAvatarLoadFailed ? (
                                        <img
                                          src={currentUser.profile_image}
                                          alt="You"
                                          onError={() =>
                                            setMyAvatarLoadFailed(true)
                                          }
                                          className="w-[30px] h-[30px] rounded-full object-cover"
                                        />
                                      ) : (
                                        <div
                                          className="w-[30px] h-[30px] rounded-full text-[11px] font-semibold flex items-center justify-center uppercase"
                                          style={{
                                            backgroundColor:
                                              stringToPastelColor(
                                                (
                                                  currentUser?.email ||
                                                  currentUser?.id ||
                                                  currentUser?.fullName ||
                                                  ""
                                                )
                                                  .toString()
                                                  .toLowerCase(),
                                              ),
                                            color: stringToDarkColor(
                                              (
                                                currentUser?.email ||
                                                currentUser?.id ||
                                                currentUser?.fullName ||
                                                ""
                                              )
                                                .toString()
                                                .toLowerCase(),
                                            ),
                                          }}
                                        >
                                          {getInitials(
                                            currentUser?.first_name,
                                            currentUser?.last_name,
                                            currentUser?.fullName,
                                          ) || "U"}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={menuKey}
                              className={`flex mb-5 ${isFromMe ? "justify-end" : "justify-start"} group`}
                            >
                              <div
                                className={`flex flex-row max-w-[70%] ${isFromMe ? "items-end" : "items-start"} relative`}
                              >
                                {!isFromMe &&
                                  (message.sender_profile_image &&
                                  !failedSenderAvatars[menuKey] ? (
                                    <img
                                      src={message.sender_profile_image}
                                      alt={senderName}
                                      onError={() =>
                                        setFailedSenderAvatars((prev) => ({
                                          ...prev,
                                          [menuKey]: true,
                                        }))
                                      }
                                      className="w-[30px] h-[30px] rounded-full object-cover mr-3"
                                    />
                                  ) : (
                                    <div
                                      className="w-[30px] h-[30px] rounded-full text-[11px] font-semibold flex items-center justify-center uppercase mr-3"
                                      style={{
                                        backgroundColor: stringToPastelColor(
                                          (isFromMe
                                            ? currentUser?.email || ""
                                            : message.sender_email ||
                                              message.senderFirstName ||
                                              message.sender_first_name ||
                                              ""
                                          )
                                            .toString()
                                            .toLowerCase(),
                                        ),
                                        color: stringToDarkColor(
                                          (isFromMe
                                            ? currentUser?.email || ""
                                            : message.sender_email ||
                                              message.senderFirstName ||
                                              message.sender_first_name ||
                                              ""
                                          )
                                            .toString()
                                            .toLowerCase(),
                                        ),
                                      }}
                                    >
                                      {getInitials(
                                        message.sender_first_name ||
                                          message.senderFirstName,
                                        message.sender_last_name ||
                                          message.senderLastName,
                                        senderName,
                                      ) || "U"}
                                    </div>
                                  ))}
                                <div className="flex flex-col flex-1 min-w-0">
                                  {/* Receiver: name + time + three-dot in single row */}
                                  {!isFromMe && !isDeletedMessage && (
                                    <div
                                      className="flex items-center mb-2 ml-2 w-full"
                                      style={{ minHeight: 24 }}
                                    >
                                      {/* Name — fixed, never hidden */}
                                      <span className="inter-bold text-[11px] flex-shrink-0">
                                        {senderName}
                                      </span>
                                      {/* Time — always visible underneath */}
                                      <span className="inter-regular text-[9px] text-[#898989] ml-2 flex-shrink-0 whitespace-nowrap">
                                        {message.formattedTime ||
                                          formatMessageTime(message.timestamp)}
                                        {isMessageEdited && " • Edited"}
                                        {message.status === "sending" &&
                                          " • Sending..."}
                                      </span>
                                      {/* ml-auto pushes the dots to the right if the message is long, pl-3 guarantees a small gap if it's short */}
                                      <div
                                        className={`ml-auto pl-3 flex items-center gap-[6px] transition-opacity duration-200 ${openMenuIdx === menuKey ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                                      >
                                        <button
                                          className="w-[16px] h-[16px] flex items-center justify-center focus:outline-none cursor-pointer"
                                          style={{
                                            zIndex:
                                              openMenuIdx === menuKey ? 1 : 10,
                                          }}
                                          ref={(el) =>
                                            (buttonRefs.current[menuKey] = el)
                                          }
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenuIdx(
                                              openMenuIdx === menuKey
                                                ? null
                                                : menuKey,
                                            );
                                          }}
                                        >
                                          <svg
                                            width="18"
                                            height="18"
                                            viewBox="0 0 18 18"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <circle
                                              cx="3"
                                              cy="9"
                                              r="1.5"
                                              fill="#000000"
                                            />
                                            <circle
                                              cx="9"
                                              cy="9"
                                              r="1.5"
                                              fill="#000000"
                                            />
                                            <circle
                                              cx="15"
                                              cy="9"
                                              r="1.5"
                                              fill="#000000"
                                            />
                                          </svg>
                                        </button>
                                        {openMenuIdx === menuKey && (
                                          <MessageActionPopup
                                            menuKey={menuKey}
                                            menuRefs={menuRefs}
                                            buttonRefs={buttonRefs}
                                            onClose={() => setOpenMenuIdx(null)}
                                            onForward={() =>
                                              handleOpenForwardModal(message)
                                            }
                                            onStar={() =>
                                              handleStarMessage(message.id)
                                            }
                                            onReply={() => {}}
                                            onCopyLink={() => {}}
                                            onSave={() => {}}
                                            onPin={() => {}}
                                            onMarkUnread={() => {}}
                                            onShare={() => {}}
                                            isStarred={isStarred}
                                            isStarring={isStarring}
                                            messageId={message.id}
                                            canEdit={canEditMessage}
                                            onEdit={() =>
                                              handleStartInlineEditMessage(
                                                message,
                                              )
                                            }
                                            canDelete={canDeleteMessage}
                                            onDelete={() =>
                                              handleDeleteMessage(message)
                                            }
                                            isDeleting={isDeletingMessage}
                                          />
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Sender: time + actions on the right */}
                                  {isFromMe && !isDeletedMessage && (
                                    <div
                                      className="flex items-center justify-end mb-2 w-full gap-3"
                                      style={{ minHeight: 24 }}
                                    >
                                      {/* Action buttons sit to the LEFT of the time so the time stays in the right corner */}
                                      <div
                                        className={`flex items-center gap-2 transition-opacity duration-200 ${openMenuIdx === menuKey ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                                      >
                                        <button
                                          className="w-[16px] h-[16px] flex items-center justify-center focus:outline-none cursor-pointer"
                                          style={{
                                            zIndex:
                                              openMenuIdx === menuKey ? 1 : 10,
                                          }}
                                          ref={(el) =>
                                            (buttonRefs.current[menuKey] = el)
                                          }
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenuIdx(
                                              openMenuIdx === menuKey
                                                ? null
                                                : menuKey,
                                            );
                                          }}
                                        >
                                          <svg
                                            width="18"
                                            height="18"
                                            viewBox="0 0 18 18"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <circle
                                              cx="3"
                                              cy="9"
                                              r="1.5"
                                              fill="#000000"
                                            />
                                            <circle
                                              cx="9"
                                              cy="9"
                                              r="1.5"
                                              fill="#000000"
                                            />
                                            <circle
                                              cx="15"
                                              cy="9"
                                              r="1.5"
                                              fill="#000000"
                                            />
                                          </svg>
                                        </button>
                                        <div className="flex items-center gap-[10px]">
                                          <button
                                            type="button"
                                            className={`w-[16px] h-[16px] cursor-pointer flex items-center justify-center focus:outline-none ${canEditMessage ? "" : "opacity-40 cursor-not-allowed"}`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (!canEditMessage) return;
                                              handleStartInlineEditMessage(
                                                message,
                                              );
                                            }}
                                            title="Edit"
                                            disabled={!canEditMessage}
                                          >
                                            <EditIcon />
                                          </button>
                                          <button
                                            type="button"
                                            className={`w-[16px] h-[16px] cursor-pointer flex items-center justify-center focus:outline-none ${canDeleteMessage && !isDeletingMessage ? "" : "opacity-40 cursor-not-allowed"}`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (
                                                !canDeleteMessage ||
                                                isDeletingMessage
                                              )
                                                return;
                                              handleDeleteMessage(message);
                                            }}
                                            title={
                                              isDeletingMessage
                                                ? "Deleting..."
                                                : "Delete"
                                            }
                                            disabled={
                                              !canDeleteMessage ||
                                              isDeletingMessage
                                            }
                                          >
                                            <DeleteIcon />
                                          </button>
                                        </div>
                                        {openMenuIdx === menuKey && (
                                          <MessageActionPopup
                                            menuKey={menuKey}
                                            menuRefs={menuRefs}
                                            buttonRefs={buttonRefs}
                                            onClose={() => setOpenMenuIdx(null)}
                                            onForward={() =>
                                              handleOpenForwardModal(message)
                                            }
                                            onStar={() =>
                                              handleStarMessage(message.id)
                                            }
                                            onReply={() => {}}
                                            onCopyLink={() => {}}
                                            onSave={() => {}}
                                            onPin={() => {}}
                                            onMarkUnread={() => {}}
                                            onShare={() => {}}
                                            isStarred={isStarred}
                                            isStarring={isStarring}
                                            messageId={message.id}
                                            canEdit={canEditMessage}
                                            onEdit={() =>
                                              handleStartInlineEditMessage(
                                                message,
                                              )
                                            }
                                            canDelete={canDeleteMessage}
                                            onDelete={() =>
                                              handleDeleteMessage(message)
                                            }
                                            isDeleting={isDeletingMessage}
                                          />
                                        )}
                                      </div>

                                      {/* Timestamp — always on the absolute far right */}
                                      <span className="inter-regular text-[9px] text-[#898989] flex-shrink-0 whitespace-nowrap">
                                        {message.formattedTime ||
                                          formatMessageTime(message.timestamp)}
                                        {isMessageEdited && " • Edited"}
                                        {message.status === "sending" &&
                                          " • Sending..."}
                                      </span>
                                    </div>
                                  )}
                                  <div
                                    className={`w-fit ${isFromMe ? "self-end" : "self-start"} ${message.isFile || message.content?.startsWith("📎") ? "px-4 py-2" : "pl-4 pr-2 py-2"} rounded-lg relative ${message.isFile || message.content?.startsWith("📎") ? "bg-[#EDEDED] text-[#000000] rounded-[10px]" : isFromMe ? "bg-[#EDEDED] text-[#000000] rounded-tr-none" : "bg-[#EDEDED] text-[#000000] rounded-tl-none"} ${message.status === "failed" ? "border border-red-500" : ""}`}
                                  >
                                    {isStarred && (
                                      <div className="absolute -bottom-[1px] -right-2 z-20">
                                        <svg
                                          width="16"
                                          height="16"
                                          viewBox="0 0 16 16"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                        >
                                          <path
                                            d="M8 0L10.472 5.528L16 6.112L12 10.224L13.056 16L8 13.168L2.944 16L4 10.224L0 6.112L5.528 5.528L8 0Z"
                                            fill="#6A37F5"
                                          />
                                        </svg>
                                      </div>
                                    )}
                                    {message.isFile ||
                                    message.content?.startsWith("📎") ||
                                    !!resolvedFileUrl ? (
                                      <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                          <span className="text-lg">📎</span>
                                          <div>
                                            {looksLikeImage &&
                                            resolvedFileUrl ? (
                                              <a
                                                href={resolvedFileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block"
                                                onClick={(e) =>
                                                  e.stopPropagation()
                                                }
                                              >
                                                <img
                                                  src={resolvedFileUrl}
                                                  alt={
                                                    message.fileName ||
                                                    "Attachment"
                                                  }
                                                  className="max-w-[220px] max-h-[220px] rounded-md border border-[#DADADA] object-cover"
                                                />
                                              </a>
                                            ) : resolvedFileUrl ? (
                                              <a
                                                href={resolvedFileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium hover:underline text-blue-600"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (resolvedFileUrl)
                                                    window.open(
                                                      resolvedFileUrl,
                                                      "_blank",
                                                    );
                                                }}
                                              >
                                                {getAttachmentDisplayName(
                                                  message,
                                                )}
                                              </a>
                                            ) : (
                                              <span className="font-medium text-gray-600">
                                                {getAttachmentDisplayName(
                                                  message,
                                                )}
                                              </span>
                                            )}
                                            {message.fileSize &&
                                              !looksLikeImage && (
                                                <div className="text-xs opacity-75 mt-1">
                                                  {typeof message.fileSize ===
                                                  "number"
                                                    ? message.fileSize
                                                    : ""}
                                                </div>
                                              )}
                                            {!resolvedFileUrl && (
                                              <div className="text-xs text-red-500 mt-1">
                                                File not available
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        {isInlineEditing ? (
                                          <div className="flex flex-col gap-2">
                                            <textarea
                                              value={editingMessageDraft}
                                              onChange={(event) =>
                                                setEditingMessageDraft(
                                                  event.target.value,
                                                )
                                              }
                                              className="w-full min-h-[64px] text-sm bg-white border border-[#D7D7D7] rounded-[6px] px-2 py-1 outline-none"
                                              autoFocus
                                              placeholder="Edit image message"
                                              onKeyDown={(event) => {
                                                if (event.key === "Escape") {
                                                  event.preventDefault();
                                                  handleCancelInlineEditMessage();
                                                }
                                                if (
                                                  event.key === "Enter" &&
                                                  !event.shiftKey
                                                ) {
                                                  event.preventDefault();
                                                  handleSaveInlineEditMessage();
                                                }
                                              }}
                                            />
                                            <div className="flex items-center justify-end gap-2">
                                              <button
                                                type="button"
                                                className="h-[24px] px-2 rounded-[4px] border border-[#D9D9D9] text-[10px]"
                                                onClick={
                                                  handleCancelInlineEditMessage
                                                }
                                                disabled={isSavingEditedMessage}
                                              >
                                                Cancel
                                              </button>
                                              <button
                                                type="button"
                                                className="h-[24px] px-2 rounded-[4px] bg-[#040B23] text-white text-[10px] disabled:opacity-50"
                                                onClick={
                                                  handleSaveInlineEditMessage
                                                }
                                                disabled={
                                                  isSavingEditedMessage ||
                                                  !String(
                                                    editingMessageDraft || "",
                                                  ).trim()
                                                }
                                              >
                                                {isSavingEditedMessage
                                                  ? "Saving..."
                                                  : "Save"}
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          String(
                                            renderedMessageContent || "",
                                          ).trim() &&
                                          !String(renderedMessageContent || "")
                                            .trim()
                                            .startsWith("📎") && (
                                            <p className="text-sm break-words whitespace-pre-wrap">
                                              {renderedMessageContent}
                                            </p>
                                          )
                                        )}
                                      </div>
                                    ) : (
                                      <div>
                                        {isInlineEditing ? (
                                          <div className="flex flex-col gap-2">
                                            <textarea
                                              value={editingMessageDraft}
                                              onChange={(event) =>
                                                setEditingMessageDraft(
                                                  event.target.value,
                                                )
                                              }
                                              className="w-full min-h-[64px] text-sm bg-white border border-[#D7D7D7] rounded-[6px] px-2 py-1 outline-none"
                                              autoFocus
                                              onKeyDown={(event) => {
                                                if (event.key === "Escape") {
                                                  event.preventDefault();
                                                  handleCancelInlineEditMessage();
                                                }
                                                if (
                                                  event.key === "Enter" &&
                                                  !event.shiftKey
                                                ) {
                                                  event.preventDefault();
                                                  handleSaveInlineEditMessage();
                                                }
                                              }}
                                            />
                                            <div className="flex items-center justify-end gap-2">
                                              <button
                                                type="button"
                                                className="h-[24px] px-2 rounded-[4px] border border-[#D9D9D9] text-[10px]"
                                                onClick={
                                                  handleCancelInlineEditMessage
                                                }
                                                disabled={isSavingEditedMessage}
                                              >
                                                Cancel
                                              </button>
                                              <button
                                                type="button"
                                                className="h-[24px] px-2 rounded-[4px] bg-[#040B23] text-white text-[10px] disabled:opacity-50"
                                                onClick={
                                                  handleSaveInlineEditMessage
                                                }
                                                disabled={
                                                  isSavingEditedMessage ||
                                                  !String(
                                                    editingMessageDraft || "",
                                                  ).trim()
                                                }
                                              >
                                                {isSavingEditedMessage
                                                  ? "Saving..."
                                                  : "Save"}
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <p className="text-sm break-words whitespace-pre-wrap">
                                            {renderedMessageContent}
                                          </p>
                                        )}
                                        {message.status === "failed" && (
                                          <div className="flex items-center justify-end mt-1">
                                            <span className="text-[10px] text-red-500">
                                              Failed to send
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {message.reactions &&
                                    message.reactions.length > 0 && (
                                      <div className="flex gap-1 mt-1">
                                        {message.reactions.map(
                                          (reaction, i) => (
                                            <div
                                              key={i}
                                              className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-xs"
                                            >
                                              <span>{reaction.emoji}</span>
                                              <span>{reaction.count}</span>
                                            </div>
                                          ),
                                        )}
                                        <button
                                          style={{
                                            width: 38,
                                            height: 22,
                                            borderRadius: 11,
                                            borderWidth: 1,
                                            borderStyle: "solid",
                                            borderColor: "#EDEDED",
                                            background: "#040B23",
                                            opacity: 1,
                                            transform: "rotate(0deg)",
                                          }}
                                          className="flex items-center justify-center"
                                        >
                                          <ChatAddReactionIcon />
                                        </button>
                                      </div>
                                    )}
                                </div>
                                {isFromMe && (
                                  <div className="flex flex-row gap-[10px] items-center ml-2 mb-1">
                                    {currentUser?.profile_image &&
                                    !myAvatarLoadFailed ? (
                                      <img
                                        src={currentUser.profile_image}
                                        alt="You"
                                        onError={() =>
                                          setMyAvatarLoadFailed(true)
                                        }
                                        className="w-[30px] h-[30px] rounded-full object-cover"
                                      />
                                    ) : (
                                      <div
                                        className="w-[30px] h-[30px] rounded-full text-[11px] font-semibold flex items-center justify-center uppercase"
                                        style={{
                                          backgroundColor: stringToPastelColor(
                                            (
                                              currentUser?.email ||
                                              currentUser?.id ||
                                              currentUser?.fullName ||
                                              ""
                                            )
                                              .toString()
                                              .toLowerCase(),
                                          ),
                                          color: stringToDarkColor(
                                            (
                                              currentUser?.email ||
                                              currentUser?.id ||
                                              currentUser?.fullName ||
                                              ""
                                            )
                                              .toString()
                                              .toLowerCase(),
                                          ),
                                        }}
                                      >
                                        {getInitials(
                                          currentUser?.first_name,
                                          currentUser?.last_name,
                                          currentUser?.fullName,
                                        ) || "U"}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  ),
                )}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-400">
                  <p className="text-lg mb-2">No messages yet</p>
                  <p className="text-sm">
                    Send a message to start the conversation!
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="h-[24px] flex items-center px-2">
            {typingText && (
              <div className="flex items-center px-4 pb-2 text-sm text-gray-500 italic">
                <span>{typingText.replace("...", "")}</span>
                <TypingDots />
              </div>
            )}
          </div>

          {/* Horizontal line separator */}
          <div className="w-full h-[1px] bg-[#E2E2E2]" />

          {/* Input Area */}
          <div className="mt-auto pt-4 pb-6">
            <div
              className="w-full rounded-lg p-[14px] bg-[#F4F4F4]"
              style={{ minHeight: hasImagePreview ? "150px" : "52px" }}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                multiple
                accept="image/*,application/pdf,.doc,.docx,.txt,.zip"
                disabled={!selectedChat || isUploading}
              />
              {(hasImagePreview ||
                uploadedFiles.some(
                  (file) =>
                    !(
                      (file.type && file.type.startsWith("image")) ||
                      file.previewUrl
                    ),
                )) && (
                <div className="w-full flex flex-wrap items-center gap-3 mb-3">
                  {imagePreviews.map((file) => (
                    <div
                      key={file.id}
                      className="relative flex w-[112px] flex-col gap-1"
                    >
                      <img
                        src={file.previewUrl}
                        alt={file.name}
                        style={{
                          width: "81px",
                          height: "81px",
                          borderRadius: "11px",
                          objectFit: "cover",
                          opacity: 1,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveFile &&
                          file?.id &&
                          handleRemoveFile(file.id)
                        }
                        className="absolute -top-2 -right-2 flex items-center justify-center bg-[#000000] text-white rounded-full"
                        style={{ width: "18px", height: "18px", opacity: 1 }}
                        aria-label="Remove image"
                        title="Remove image"
                      >
                        <svg
                          width="7"
                          height="7"
                          viewBox="0 0 7 7"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M6.375 0.375L0.375 6.375M6.375 6.375L0.375 0.375"
                            stroke="white"
                            strokeWidth="0.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      <span
                        className="block w-full truncate rounded border border-[#DADADA] bg-white px-2 py-1 text-xs text-gray-800"
                        title={file.name || "Attachment"}
                      >
                        {file.name || "Attachment"}
                      </span>
                    </div>
                  ))}
                  {uploadedFiles
                    .filter(
                      (file) =>
                        !(
                          (file.type && file.type.startsWith("image")) ||
                          file.previewUrl
                        ),
                    )
                    .map((file) => (
                      <div
                        key={file.id}
                        className="relative flex items-center bg-white border border-[#DADADA] rounded-md px-3 py-2 min-w-[120px] max-w-[220px]"
                      >
                        <span className="mr-2">
                          {file.type && file.type.includes("pdf") && (
                            <svg
                              width="20"
                              height="20"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <rect
                                width="20"
                                height="20"
                                x="2"
                                y="2"
                                rx="4"
                                fill="#E53E3E"
                              />
                              <text x="7" y="16" fontSize="10" fill="#fff">
                                PDF
                              </text>
                            </svg>
                          )}
                          {file.type &&
                            (file.type.includes("word") ||
                              file.name?.endsWith(".doc") ||
                              file.name?.endsWith(".docx")) && (
                              <svg
                                width="20"
                                height="20"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <rect
                                  width="20"
                                  height="20"
                                  x="2"
                                  y="2"
                                  rx="4"
                                  fill="#3182CE"
                                />
                                <text x="7" y="16" fontSize="10" fill="#fff">
                                  DOC
                                </text>
                              </svg>
                            )}
                          {file.type && file.type.includes("zip") && (
                            <svg
                              width="20"
                              height="20"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <rect
                                width="20"
                                height="20"
                                x="2"
                                y="2"
                                rx="4"
                                fill="#718096"
                              />
                              <text x="7" y="16" fontSize="10" fill="#fff">
                                ZIP
                              </text>
                            </svg>
                          )}
                          {file.type && file.type.includes("plain") && (
                            <svg
                              width="20"
                              height="20"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <rect
                                width="20"
                                height="20"
                                x="2"
                                y="2"
                                rx="4"
                                fill="#4A5568"
                              />
                              <text x="7" y="16" fontSize="10" fill="#fff">
                                TXT
                              </text>
                            </svg>
                          )}
                          {!file.type && (
                            <svg
                              width="20"
                              height="20"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <rect
                                width="20"
                                height="20"
                                x="2"
                                y="2"
                                rx="4"
                                fill="#A0AEC0"
                              />
                              <text x="7" y="16" fontSize="10" fill="#fff">
                                FILE
                              </text>
                            </svg>
                          )}
                        </span>
                        <span
                          className="min-w-0 flex-1 truncate bg-transparent text-xs font-medium text-gray-800"
                          title={file.name || "Attachment"}
                        >
                          {file.name || "Attachment"}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveFile &&
                            file?.id &&
                            handleRemoveFile(file.id)
                          }
                          className="absolute -top-2 -right-2 flex items-center justify-center bg-[#000000] text-white rounded-full"
                          style={{ width: "18px", height: "18px", opacity: 1 }}
                          aria-label="Remove file"
                          title="Remove file"
                        >
                          <svg
                            width="7"
                            height="7"
                            viewBox="0 0 7 7"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M6.375 0.375L0.375 6.375M6.375 6.375L0.375 0.375"
                              stroke="white"
                              strokeWidth="0.75"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                </div>
              )}
              <div className="flex items-center h-full">
                <button
                  onClick={handleAttachClick}
                  disabled={!selectedChat || isUploading}
                  className={`mr-2 focus:outline-none ${!selectedChat || isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  title={
                    selectedChat
                      ? "Attach file"
                      : "Select a chat to attach files"
                  }
                >
                  <ChatAttachIcon />
                </button>
                <input
                  ref={textInputRef}
                  className="flex-1 bg-transparent outline-none text-sm px-2 placeholder:text-[#000000]"
                  type="text"
                  placeholder={
                    selectedChat
                      ? `Type your message...`
                      : "Select a chat to start messaging"
                  }
                  value={input || ""}
                  onChange={handleInputChangeHandler}
                  onKeyDown={handleKeyDownHandler}
                  onFocus={handleInputFocusHandler}
                  onBlur={handleInputBlurHandler}
                  disabled={!selectedChat || isUploading}
                />
                <span className="mr-5 flex items-center">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 22 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10.75 20.75C16.2728 20.75 20.75 16.2728 20.75 10.75C20.75 5.22715 16.2728 0.75 10.75 0.75C5.22715 0.75 0.75 5.22715 0.75 10.75C0.75 16.2728 5.22715 20.75 10.75 20.75Z"
                      stroke="black"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M6.75 13.75C7.21574 14.371 7.81966 14.875 8.51393 15.2221C9.20821 15.5693 9.97377 15.75 10.75 15.75C11.5262 15.75 12.2918 15.5693 12.9861 15.2221C13.6803 14.875 14.2843 14.371 14.75 13.75"
                      stroke="black"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M6.759 7.75H6.75M14.75 7.75H14.741"
                      stroke="black"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <button
                  onClick={handleSendClick}
                  disabled={
                    !selectedChat ||
                    (!input?.trim() && uploadedFiles.length === 0) ||
                    isUploading ||
                    isSendingRef?.current
                  }
                  className={`focus:outline-none flex flex-row gap-[10px] ${!selectedChat || (!input?.trim() && uploadedFiles.length === 0) || isUploading || isSendingRef?.current ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  title="Send message"
                >
                  <ChatSendIcon />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forward Modal */}
      <ForwardModal
        show={showForwardModal}
        onClose={closeForwardModal}
        forwardingMessage={forwardingMessage}
        forwardRooms={forwardRooms}
        forwardRecipientQuery={forwardRecipientQuery}
        forwardRecipientCompletedTokens={forwardRecipientCompletedTokens}
        forwardRecipientActiveToken={forwardRecipientActiveToken}
        forwardRecipientSuggestions={forwardRecipientSuggestions}
        isForwardRoomsLoading={isForwardRoomsLoading}
        invalidForwardRecipientCount={invalidForwardRecipientCount}
        validForwardRecipientIds={validForwardRecipientIds}
        isForwardingMessage={isForwardingMessage}
        forwardStatusMessage={forwardStatusMessage}
        forwardStatusType={forwardStatusType}
        onForwardRecipientInputChange={handleForwardRecipientInputChange}
        onRemoveForwardRecipientChip={handleRemoveForwardRecipientChip}
        onForwardRecipientInputKeyDown={handleForwardRecipientInputKeyDown}
        onSelectForwardRecipientSuggestion={
          handleSelectForwardRecipientSuggestion
        }
        onConfirmForward={handleConfirmForward}
        decodeForwardRecipientLabel={decodeForwardRecipientLabel}
        getForwardMessagePreview={getForwardMessagePreview}
        forwardRecipientInputRef={forwardRecipientInputRef}
      />

      {/* Add People Popup */}
      {showAddPeoplePopup && (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-black/40">
          <div
            ref={addPeoplePopupRef}
            className="bg-white rounded-lg shadow-lg"
            style={{
              position: "absolute",
              top: "300px",
              left: "250px",
              width: "459px",
              height: "auto",
              minHeight: "190px",
              maxHeight: "400px",
              background: "#FFFFFF",
              boxShadow: "0px 0px 16px 0px #00000040",
              borderRadius: "8px",
            }}
          >
            <div className="p-4 flex flex-col">
              <div className="flex flex-col gap-[10px] mb-3">
                <label className="inter-medium text-[18px] font-medium">
                  Add people
                </label>
                <div className="flex flex-wrap gap-2 mb-2 w-full px-1 py-1 bg-white border border-gray-300 rounded-md focus-within:ring-1 focus-within:ring-blue-500">
                  {addPeopleChips.map((chip, idx) => (
                    <span
                      key={chip}
                      className="flex items-center bg-blue-100 text-blue-800 rounded px-2 py-1 text-xs mr-1 mb-1"
                    >
                      {chip}
                      <button
                        type="button"
                        className="ml-1 text-blue-500 hover:text-blue-700 focus:outline-none"
                        onClick={() => handleRemoveChip(idx)}
                        aria-label="Remove"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={addPeopleQuery}
                    onChange={handleChipInputChange}
                    onKeyDown={handleChipInputKeyDown}
                    onFocus={() => setShowParticipantsPanel(true)}
                    placeholder="Enter a name or email"
                    className="flex-1 min-w-[120px] px-2 py-1 text-sm bg-transparent outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex flex-col px-[10px] gap-[5px] w-full mb-3">
                <div className="flex flex-row gap-[6px] w-full items-center">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect width="16" height="16" rx="8" fill="#EAEAEA" />
                    <rect
                      x="0.5"
                      y="0.5"
                      width="15"
                      height="15"
                      rx="7.5"
                      stroke="black"
                      strokeOpacity="0.25"
                    />
                    <rect
                      x="3"
                      y="3"
                      width="10"
                      height="10"
                      rx="5"
                      fill="#6A37F5"
                    />
                  </svg>
                  <span className="inter-regular text-[12px]">
                    Chat history should not be included.
                  </span>
                </div>
                <div className="flex flex-row gap-[6px] w-full items-center">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect width="16" height="16" rx="8" fill="#EAEAEA" />
                    <rect
                      x="0.5"
                      y="0.5"
                      width="15"
                      height="15"
                      rx="7.5"
                      stroke="black"
                      strokeOpacity="0.25"
                    />
                  </svg>
                  <span className="inter-regular text-[12px]">
                    Show history from the last number of days.
                  </span>
                </div>
                <div className="flex flex-row gap-[6px] w-full items-center">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect width="16" height="16" rx="8" fill="#EAEAEA" />
                    <rect
                      x="0.5"
                      y="0.5"
                      width="15"
                      height="15"
                      rx="7.5"
                      stroke="black"
                      strokeOpacity="0.25"
                    />
                  </svg>
                  <span className="inter-regular text-[12px]">
                    Show all chat history.
                  </span>
                </div>
              </div>

              {/* Search Results */}
              {addPeopleQuery.trim() && (
                <div className="overflow-y-auto max-h-[150px] border-[1px] border-gray-300 rounded-md">
                  {addPeopleSearchResults.length > 0 ? (
                    addPeopleSearchResults.map((user) => (
                      <div
                        key={user.email}
                        className="flex items-center justify-between px-2 py-2 hover:bg-gray-50  last:border-b-0"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {user.profile_image ? (
                            <img
                              src={user.profile_image}
                              alt={user.first_name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold uppercase"
                              style={{
                                backgroundColor: stringToPastelColor(
                                  user.email,
                                ),
                                color: stringToDarkColor(user.email),
                              }}
                            >
                              {user.first_name?.[0] || user.email?.[0] || "U"}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {user.first_name} {user.last_name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {user.email}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            // Add as chip if not already present
                            if (
                              user.email &&
                              !addPeopleChips.includes(user.email)
                            ) {
                              setAddPeopleChips([
                                ...addPeopleChips,
                                user.email,
                              ]);
                              setAddPeopleQuery("");
                            }
                          }}
                          disabled={isAddingPeople}
                          className="px-3 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-sm text-gray-500">
                      No users found
                    </div>
                  )}
                </div>
              )}

              {!addPeopleQuery.trim() && (
                <div className="flex items-center justify-center text-sm text-gray-400 py-4">
                  Type to search for users...
                </div>
              )}

              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => {
                    setShowAddPeoplePopup(false);
                    setAddPeopleQuery("");
                    setAddPeopleSearchResults([]);
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 mr-2"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!addPeopleChips.length) return;
                    setIsAddingPeople(true);
                    try {
                      await addChatRoomMembers(
                        selectedChat?.id,
                        addPeopleChips,
                      );
                      // Update groupMembers state so UI reflects new users immediately
                      setGroupMembers((prev) =>
                        Array.from(
                          new Set([
                            ...prev,
                            ...addPeopleChips.map((e) => e.toLowerCase()),
                          ]),
                        ),
                      );
                      setAddPeopleChips([]);
                      setShowAddPeoplePopup(false);
                      setAddPeopleQuery("");
                      setAddPeopleSearchResults([]);
                    } catch (err) {
                      alert("Failed to add users. Please try again.");
                    } finally {
                      setIsAddingPeople(false);
                    }
                  }}
                  disabled={!addPeopleChips.length || isAddingPeople}
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isAddingPeople ? "Adding..." : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditGroupName && (
        <div className="fixed inset-0 z-[1300] bg-black/30">
          <div
            ref={popupRef}
            className="absolute w-[553px] h-[178px] left-[318px] top-[205px] bg-white border-[1px] border-[#B6B6B6]"
          >
            <div className="flex flex-col items-end gap-[26px] absolute w-[517px] h-[140px] left-[17px] top-[16px]">
              <div className="flex flex-col gap-[18px] w-full">
                <span className="inter font-normal text-[16px] tracking-[0.07em] text-black">
                  Group Name
                </span>
                <div className="flex items-center px-[10px] h-[37px] bg-[#EDEDED] border-b-2 border-[#6A37F5]">
                  <input
                    value={editGroupNameDraft}
                    onChange={(e) => setEditGroupNameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveGroupName();
                      if (e.key === "Escape") handleCloseEditGroupName();
                    }}
                    className="inter font-normal w-full bg-transparent outline-none text-[14px] tracking-[0.07em]"
                  />
                </div>
              </div>
              <div className="flex gap-[16px]">
                <button
                  onClick={handleCloseEditGroupName}
                  className="cursor-pointer w-[100px] h-[40px] border border-[#B6B6B6] flex items-center justify-center text-[20px]"
                >
                  {" "}
                  Cancel{" "}
                </button>
                <button
                  onClick={handleSaveGroupName}
                  className="cursor-pointer w-[100px] h-[40px] bg-[#0078D4] text-white flex items-center justify-center text-[20px]"
                >
                  {" "}
                  {isSavingGroupName ? "Saving..." : "Update"}{" "}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessageArea;

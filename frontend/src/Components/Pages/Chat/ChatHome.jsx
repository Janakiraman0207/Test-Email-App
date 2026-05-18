import { searchChatUsers, getOnlineStatus, getChatOnlineUsers, getRoomMessages, getChatRooms, sendMessageToRoom, createChatRoom, api, chatService, getUserProfile } from "../../../api/api";
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ChatDetails from "./ChatDetails";
import ChatMainArea from "./ChatMainArea";
import ChatStarred from "./ChatStarred";
import Settings from "../Settings/Settings";
import { Navbar } from "../Home/Navbar/Navbar";
import { AppNavBar } from "../Home/Navbar/AppNavBar";
import { RightSidebar } from "../Home/RightSidebar";
import { useSmoothNavigation } from "../../../hooks/useSmoothNavigation";
import chatimg from '../../../assets/images/chatimg.png';
import chatimg1 from '../../../assets/images/chatimg1.png';
import chatimg2 from '../../../assets/images/chatimg2.png';
import chatimg3 from '../../../assets/images/chatimg3.png';
import chatimg4 from '../../../assets/images/chatimg4.png';
import {
  ChatThreeDotIcon,
  ChatInboxIcon,
  ChatEditIcon,
  ChatSearchIcon,
  ChatShortcutsArrowIcon,
  ChatStarIcon,
  ChatAllMessagesArrowIcon,
  ChatAddReactionIcon,
  ChatAttachIcon,
  ChatSendIcon,
  ChatProfileDropdownIcon,
  ChatProfileSearchIcon,
  ChatProfileCallIcon,
} from '../../../assets/icons/Icons1';

function stringToPastelColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 60%, 85%)`;
}

function stringToDarkColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 60%, 25%)`;
}

const ChatHome = () => {
  const { visible } = useSmoothNavigation(1000);
  const navigate = useNavigate();
  const location = useLocation();
  const { roomId } = useParams();

  // State for input and messages
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedChatIdx, setSelectedChatIdx] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedChatId, setSelectedChatId] = useState(roomId || null);
  const SELECTED_CHAT_STORAGE_KEY = "selected_chat_room_id";

  // --- Chats sidebar state ---
  const [chatSearch, setChatSearch] = useState("");
  const [allChatRooms, setAllChatRooms] = useState([]);
  const [chatList, setChatList] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showStarredView, setShowStarredView] = useState(false);
  const [starredViewKey, setStarredViewKey] = useState(0);
  const [groupName, setGroupName] = useState('');
  const [groupMemberQuery, setGroupMemberQuery] = useState('');
  const [groupMemberResults, setGroupMemberResults] = useState([]);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // --- User profile state ---
  const [selectedUser, setSelectedUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // --- WebSocket state ---
  const [chatSocket, setChatSocket] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUserEmails, setOnlineUserEmails] = useState([]);
  const selectedChatRef = useRef(null); // <-- Add this line to define the ref
  const roomSocketsRef = useRef({});
  const typingTimeoutsRef = useRef({});
  const typingClientIdRef = useRef(
    (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `typing-${Date.now()}-${Math.random()}`
  );

  // State to track image load failures
  const [imageLoadErrors, setImageLoadErrors] = useState({});

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await getUserProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    
    fetchUserProfile();
  }, []);

  const currentUser = {
    id: localStorage.getItem("user_id") || userProfile?.id,
    email: (localStorage.getItem("user_email") || userProfile?.email || '').toLowerCase(),
    first_name: localStorage.getItem("user_first_name") || userProfile?.first_name || '',
    last_name: localStorage.getItem("user_last_name") || userProfile?.last_name || '',
    profile_image: localStorage.getItem("user_profile_image") || userProfile?.profile_image || null,
    fullName: (() => {
      const firstName = localStorage.getItem("user_first_name") || userProfile?.first_name || '';
      const lastName = localStorage.getItem("user_last_name") || userProfile?.last_name || '';
      return `${firstName} ${lastName}`.trim() || 'User';
    })()
  };

  useEffect(() => {
    setSelectedChatId(roomId || null);
  }, [roomId]);

  useEffect(() => {
    const routeRoom = location.state?.chatRoom;
    if (!routeRoom) return;

    const normalizedRoom = normalizeRoomDisplayData({
      ...routeRoom,
      id: routeRoom.id || routeRoom._id || routeRoom.room_id || routeRoom.roomId,
      _id: routeRoom._id || routeRoom.id || routeRoom.room_id || routeRoom.roomId,
      unread_count: 0,
      hasMessages: !!routeRoom.last_message,
      lastMessage: routeRoom.last_message?.content || '',
      lastMessageTime: routeRoom.last_message?.timestamp || null,
      formattedLastMessageTime: routeRoom.last_message?.timestamp ? timeAgo(routeRoom.last_message.timestamp) : ''
    });
    const normalizedRoomId = normalizedRoom.id || normalizedRoom._id;

    setAllChatRooms(prevList => {
      const hasRoom = prevList.some(room => isSameRoom(room, normalizedRoomId));
      return hasRoom
        ? prevList.map(room => isSameRoom(room, normalizedRoomId) ? { ...room, ...normalizedRoom } : room)
        : [normalizedRoom, ...prevList];
    });

    if (normalizedRoom.is_group || normalizedRoom.hasMessages) {
      setChatList(prevList => {
        const hasRoom = prevList.some(room => isSameRoom(room, normalizedRoomId));
        return hasRoom
          ? prevList.map(room => isSameRoom(room, normalizedRoomId) ? { ...room, ...normalizedRoom } : room)
          : [normalizedRoom, ...prevList];
      });
      setFilteredChats(prevList => {
        const hasRoom = prevList.some(room => isSameRoom(room, normalizedRoomId));
        return hasRoom
          ? prevList.map(room => isSameRoom(room, normalizedRoomId) ? { ...room, ...normalizedRoom } : room)
          : [normalizedRoom, ...prevList];
      });
    }

    setSelectedChatIdx(null);
    setSelectedChat(normalizedRoom);
    setSelectedUser(null);
    setMessages([]);
    persistSelectedChat(normalizedRoomId);
  }, [location.state, roomId]);

  const getInitials = (firstName, lastName) => {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    
    if (first && last) return `${first}${last}`;
    if (first) return first;
    if (last) return last;
    return '?';
  };

  const getInitialFromText = (text) => {
    if (!text || typeof text !== 'string') return '';
    const cleaned = text.trim();
    if (!cleaned) return '';
    return cleaned.charAt(0).toUpperCase();
  };

  const isPresenceOnline = (presence) => {
    if (typeof presence !== 'string') return false;
    return presence.trim().toLowerCase() !== 'offline';
  };

  const getParticipantInitial = (participant) => {
    if (!participant) return '';

    const firstName = participant.first_name || participant.firstName || '';
    const lastName = participant.last_name || participant.lastName || '';
    const directInitials = getInitials(firstName, lastName);
    if (directInitials && directInitials !== '?') {
      return directInitials.charAt(0);
    }

    const email = participant.email || participant.user_email || '';
    if (email) {
      return getInitialFromText(email.split('@')[0]);
    }

    const name = participant.name || participant.full_name || '';
    return getInitialFromText(name);
  };

  const getGroupInitials = (room) => {
  if (!room?.is_group) return [];
  const initials = [];
  const seenKeys = new Set();

  const addInitial = (value, uniqueKey) => {
    const initial = (value || '').trim().charAt(0).toUpperCase();
    if (!initial) return;
    const key = (uniqueKey || value || '').toString().toLowerCase();
    if (!key || seenKeys.has(key)) return;
    seenKeys.add(key);
    initials.push(initial);
  };

  if (Array.isArray(room.participant_details)) {
    room.participant_details.forEach((participant) => {
      const email = participant?.email || participant?.user_email || '';
      const firstName = participant?.first_name || participant?.firstName || '';
      const lastName = participant?.last_name || participant?.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      const displayValue = fullName || email.split('@')[0] || '';
      addInitial(displayValue, email || participant?.id || displayValue);
    });
  }

  if (Array.isArray(room.participants)) {
    room.participants.forEach((participant) => {
      if (typeof participant === 'string') {
        addInitial(participant.split('@')[0], participant);
        return;
      }
      const email = participant?.email || participant?.user_email || '';
      const firstName = participant?.first_name || participant?.firstName || '';
      const lastName = participant?.last_name || participant?.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      const displayValue = fullName || email.split('@')[0] || '';
      addInitial(displayValue, email || participant?.id || displayValue);
    });
  }

  if (initials.length === 0 && room.name) {
    room.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 4)
      .forEach((part) => addInitial(part, part));
  }

  return initials.slice(0, 4);
};
  const getGroupColorKeys = (room) => {
  if (!room?.is_group) return [];
  const keys = [];
  const seenKeys = new Set();

  const addKey = (key) => {
    const normalized = (key || '').toString().toLowerCase().trim();
    if (!normalized || seenKeys.has(normalized)) return;
    seenKeys.add(normalized);
    keys.push(normalized);
  };

  if (Array.isArray(room.participant_details) && room.participant_details.length > 0) {
    room.participant_details.forEach((p) => {
      const colorKey = p?.email || p?.user_email || p?.id || p?.user_id || '';
      addKey(colorKey);
    });
    if (keys.length > 0) return keys.slice(0, 4);
  }

  if (Array.isArray(room.participants)) {
    room.participants.forEach((p) => {
      if (typeof p === 'string') addKey(p);
      else addKey(p?.email || p?.user_email || p?.id || p?.user_id || '');
    });
  }

  return keys.slice(0, 4);
};

  // Helper function to handle image error
  const handleImageError = (userId) => {
    setImageLoadErrors(prev => ({ ...prev, [userId]: true }));
  };

  const openGroupModal = () => {
    setShowGroupModal(true);
    setGroupName('');
    setGroupMemberQuery('');
    setGroupMemberResults([]);
    setSelectedGroupMembers([]);
    setFilteredChats(chatList.filter(chat => chat.is_group));
    setIsSearchMode(true);
    setShowStarredView(false);
  };

  const closeGroupModal = () => {
    setShowGroupModal(false);
    setGroupName('');
    setGroupMemberQuery('');
    setGroupMemberResults([]);
    setSelectedGroupMembers([]);
    setFilteredChats(chatList);
    setIsSearchMode(false);
  };

  const addGroupMember = (user) => {
    if (!user?.email) return;
    setSelectedGroupMembers(prev => {
      if (prev.some(member => member.email === user.email)) return prev;
      return [...prev, user];
    });
    setGroupMemberQuery('');
    setGroupMemberResults([]);
  };

  const removeGroupMember = (email) => {
    setSelectedGroupMembers(prev => prev.filter(member => member.email !== email));
  };

  const handleCreateGroupFromShortcut = async () => {
    if (selectedGroupMembers.length === 0) {
      alert('Select at least one member to create a group.');
      return;
    }

    setIsCreatingGroup(true);
    try {
      const payload = {
        participant_emails: selectedGroupMembers.map(member => member.email),
        is_group: true,
        name: groupName.trim() || 'New Group'
      };

      const newRoom = await createChatRoom(null, null, payload);
      const newRoomId = newRoom.id || newRoom._id;

      const normalizedRoom = {
        ...newRoom,
        id: newRoom.id,
        _id: newRoomId,
        unread_count: 0,
        hasMessages: !!newRoom.last_message,
        lastMessage: newRoom.last_message?.content || '',
        lastMessageTime: newRoom.last_message?.timestamp || null,
        formattedLastMessageTime: newRoom.last_message?.timestamp ? timeAgo(newRoom.last_message.timestamp) : '',
        displayName: newRoom.name || 'New Group',
        displayEmail: null,
        displayImage: null,
        otherParticipantFirstName: '',
        otherParticipantLastName: '',
        otherParticipantId: null,
        groupColorKeys: getGroupColorKeys(newRoom)
      };

      setChatList(prev => [normalizedRoom, ...prev]);
      setFilteredChats(prev => (isSearchMode ? prev : [normalizedRoom, ...prev]));

      if (newRoomId) {
        navigate(`/chat/${newRoomId}`);
        persistSelectedChat(newRoomId);
      }

      setSelectedUser(null);
      setSelectedChatIdx(0);
      setSelectedChat(normalizedRoom);
      setMessages([]);
      closeGroupModal();
    } catch (error) {
      console.error('Failed to create group chat:', error);
      alert('Failed to create group. Please try again.');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  useEffect(() => {
    const fetchGroupSearchUsers = async () => {
      if (!showGroupModal || groupMemberQuery.trim().length === 0) {
        setGroupMemberResults([]);
        return;
      }

      try {
        const results = await searchChatUsers(groupMemberQuery.trim());
        const filtered = (results || []).filter(user => {
          const email = (user?.email || '').toLowerCase();
          return (
            email &&
            email !== currentUser.email &&
            !selectedGroupMembers.some(member => member.email?.toLowerCase() === email)
          );
        });
        setGroupMemberResults(filtered);
      } catch (error) {
        console.error('Failed to search users for group:', error);
        setGroupMemberResults([]);
      }
    };

    fetchGroupSearchUsers();
  }, [showGroupModal, groupMemberQuery, selectedGroupMembers, currentUser.email]);

  const isRoomUserOnline = (email) => {
    if (!email) return false;
    return onlineUserEmails.includes(email.toLowerCase());
  };

  useEffect(() => {
    const fetchOnlineUsers = async () => {
      const users = await getChatOnlineUsers();
      const emails = users
        .map(user => (user?.email || '').toLowerCase())
        .filter(Boolean);
      setOnlineUserEmails(emails);
    };

    if (!currentUser.email) return;

    fetchOnlineUsers();
    const intervalId = setInterval(fetchOnlineUsers, 10000);

    return () => clearInterval(intervalId);
  }, [currentUser.email]);

  const persistSelectedChat = (roomId) => {
    if (roomId) {
      localStorage.setItem(SELECTED_CHAT_STORAGE_KEY, roomId);
      setSelectedChatId(roomId);
    } else {
      localStorage.removeItem(SELECTED_CHAT_STORAGE_KEY);
      setSelectedChatId(null);
    }
  };

  // Helper function to format time ago
  const timeAgo = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day ago`;
  };

  // Helper function to format message time
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper function to get full name from first and last name
  const getFullName = (firstName, lastName) => {
    const first = firstName ? firstName.trim() : '';
    const last = lastName ? lastName.trim() : '';
    
    if (first && last) {
      const formattedFirst = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
      const formattedLast = last.charAt(0).toUpperCase() + last.slice(1).toLowerCase();
      return `${formattedFirst} ${formattedLast}`;
    }
    
    if (first) {
      return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
    }
    
    if (last) {
      return last.charAt(0).toUpperCase() + last.slice(1).toLowerCase();
    }
    
    return null;
  };

  // Helper function to extract name from email
  const extractNameFromEmail = (email) => {
    if (!email) return { firstName: '', lastName: '', fullName: '' };
    const emailName = email.split('@')[0];
    const parts = emailName.split(/[._-]+/);
    if (parts.length >= 2) {
      const firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
      const lastName = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
      return { firstName, lastName, fullName: `${firstName} ${lastName}` };
    } else if (parts.length === 1) {
      const name = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
      return { firstName: name, lastName: '', fullName: name };
    }
    return { firstName: '', lastName: '', fullName: '' };
  };

  const normalizeRoomDisplayData = (room) => {
    if (!room || room.isSearchResult) return room;

    if (room.is_group) {
      return {
        ...room,
        displayName: room.displayName || room.name || 'Group',
        groupInitials: Array.isArray(room.groupInitials) && room.groupInitials.length > 0
          ? room.groupInitials
          : getGroupInitials(room),
        groupColorKeys: Array.isArray(room.groupColorKeys) && room.groupColorKeys.length > 0
          ? room.groupColorKeys
          : getGroupColorKeys(room)
      };
    }

    let otherParticipantFirstName = room.otherParticipantFirstName || '';
    let otherParticipantLastName = room.otherParticipantLastName || '';
    let otherParticipantEmail = room.displayEmail || room.otherParticipantEmail || '';
    let otherParticipantImage = room.displayImage || room.otherParticipantImage || null;
    let otherParticipantId = room.otherParticipantId || null;
    let otherParticipantName = room.displayName || '';

    if (Array.isArray(room.participant_details) && room.participant_details.length > 0) {
      const other = room.participant_details.find(p => (p?.email || '').toLowerCase() !== currentUser.email);
      if (other) {
        otherParticipantFirstName = other.first_name || otherParticipantFirstName;
        otherParticipantLastName = other.last_name || otherParticipantLastName;
        otherParticipantEmail = other.email || otherParticipantEmail;
        otherParticipantImage = other.profile_image || otherParticipantImage;
        otherParticipantId = other.id || otherParticipantId;
      }
    }

    if ((!otherParticipantEmail || !otherParticipantFirstName) && Array.isArray(room.participants) && room.participants.length > 0) {
      const other = room.participants.find(participant => {
        if (typeof participant === 'string') {
          return participant.toLowerCase() !== currentUser.email;
        }
        const participantEmail = (participant?.email || participant?.user_email || '').toLowerCase();
        return participantEmail && participantEmail !== currentUser.email;
      });

      if (other) {
        if (typeof other === 'string') {
          otherParticipantEmail = otherParticipantEmail || other;
        } else {
          otherParticipantFirstName = other.first_name || otherParticipantFirstName;
          otherParticipantLastName = other.last_name || otherParticipantLastName;
          otherParticipantEmail = other.email || other.user_email || otherParticipantEmail;
          otherParticipantImage = other.profile_image || otherParticipantImage;
          otherParticipantId = other.id || otherParticipantId;
        }
      }
    }

    if ((!otherParticipantEmail || !otherParticipantFirstName) && room.user && room.user.email && room.user.email.toLowerCase() !== currentUser.email) {
      otherParticipantFirstName = room.user.first_name || otherParticipantFirstName;
      otherParticipantLastName = room.user.last_name || otherParticipantLastName;
      otherParticipantEmail = room.user.email || otherParticipantEmail;
      otherParticipantImage = room.user.profile_image || otherParticipantImage;
      otherParticipantId = room.user.id || otherParticipantId;
    }

    if ((!otherParticipantEmail || !otherParticipantFirstName) && room.other_participant) {
      otherParticipantFirstName = room.other_participant.first_name || otherParticipantFirstName;
      otherParticipantLastName = room.other_participant.last_name || otherParticipantLastName;
      otherParticipantEmail = room.other_participant.email || otherParticipantEmail;
      otherParticipantImage = room.other_participant.profile_image || otherParticipantImage;
      otherParticipantId = room.other_participant.id || otherParticipantId;
    }

    const fullName = getFullName(otherParticipantFirstName, otherParticipantLastName);
    if (fullName) {
      otherParticipantName = fullName;
    } else if (otherParticipantEmail) {
      otherParticipantName = extractNameFromEmail(otherParticipantEmail).fullName || otherParticipantEmail.split('@')[0] || 'User';
    }

    if (!otherParticipantName || otherParticipantName === 'User') {
      otherParticipantName = room.name || 'User';
    }

    return {
      ...room,
      displayName: otherParticipantName,
      displayEmail: otherParticipantEmail,
      displayImage: otherParticipantImage,
      otherParticipantFirstName,
      otherParticipantLastName,
      otherParticipantId,
      groupInitials: Array.isArray(room.groupInitials) && room.groupInitials.length > 0
        ? room.groupInitials
        : getGroupInitials(room),
      groupColorKeys: Array.isArray(room.groupColorKeys) && room.groupColorKeys.length > 0
        ? room.groupColorKeys
        : getGroupColorKeys(room)
    };
  };

  // Get sender display name
  const getSenderDisplayName = (message) => {
    if (message.fromMe || message.sender_email === currentUser.email) {
      return 'You';
    }
    
    const fullName = getFullName(message.sender_first_name, message.sender_last_name);
    if (fullName) return fullName;
    
    if (message.sender_email) {
      const extracted = extractNameFromEmail(message.sender_email);
      if (extracted.fullName) return extracted.fullName;
    }
    
    return 'User';
  };

  // Handle WebSocket messages
  const handleWebSocketMessage = (data) => {
    console.log('[WebSocket] Received:', data, 'Current roomId:', roomId, 'SelectedChat:', selectedChatRef.current);
    if (data.type === 'new_message' || (!data.type && data.id && data.content) || data.type === 'MESSAGE_NEW') {
      const incomingRoomId = data.room_id ?? data.roomId;
      const isFromCurrentChat = isSameRoom(selectedChatRef.current, incomingRoomId) || isSameRoom(roomId, incomingRoomId);
      
      const senderEmail = (data.sender_email || '').toLowerCase();
      const senderFirstName = data.sender_first_name || '';
      const senderLastName = data.sender_last_name || '';
      
      const newMessage = {
        id: data.id,
        content: data.content,
        sender_email: senderEmail,
        sender_first_name: senderFirstName,
        sender_last_name: senderLastName,
        timestamp: data.timestamp,
        fromMe: senderEmail === currentUser.email,
        displayName: senderEmail === currentUser.email ? 'You' : getFullName(senderFirstName, senderLastName) || extractNameFromEmail(senderEmail).fullName || 'User',
        formattedTime: formatMessageTime(data.timestamp),
        reactions: data.reactions || [],
        is_forwarded: data.is_forwarded || false,
        parent_id: data.parent_id,
        parent_content: data.parent_content,
        parent_sender: data.parent_sender,
        attachment_url: data.attachment_url,
        isFile: !!data.attachment_url
      };

      const timestampsMatch = (ts1, ts2) => {
        if (!ts1 || !ts2) return false;
        const date1 = new Date(ts1).getTime();
        const date2 = new Date(ts2).getTime();
        if (Number.isNaN(date1) || Number.isNaN(date2)) return false;
        return Math.abs(date1 - date2) < 2000;
      };

      const isDuplicateMessage = (msg) => {
        const msgId = msg.id != null ? String(msg.id) : null;
        const newId = newMessage.id != null ? String(newMessage.id) : null;
        const isTemp = msgId?.startsWith('temp-');

        if (newId && msgId && !isTemp && msgId === newId) {
          return true;
        }

        return (
          msg.fromMe === newMessage.fromMe &&
          (msg.sender_email || '').toLowerCase() === newMessage.sender_email &&
          msg.content === newMessage.content &&
          (msg.timestamp === newMessage.timestamp || timestampsMatch(msg.timestamp, newMessage.timestamp))
        );
      };

      if (isFromCurrentChat) {
        setMessages(prev => {
          if (prev.some(isDuplicateMessage)) {
            return prev;
          }
          return [...prev, newMessage];
        });
      }

      updateChatListWithNewMessage({
        room_id: data.room_id,
        content: data.content,
        timestamp: data.timestamp,
        sender_email: data.sender_email,
        sender_first_name: data.sender_first_name,
        sender_last_name: data.sender_last_name
      });
    } 
    else if (data.type === 'message_update' || data.type === 'MESSAGE_UPDATE' || data.type === 'update') {
      if (isSameRoom(selectedChatRef.current, data.room_id ?? data.roomId)) {
        setMessages(prev => prev.map(msg => 
          String(msg.id) === String(data.id || data.message_id) ? { ...msg, content: data.content } : msg
        ));
      }

      setChatList(prevChats => prevChats.map(chat => {
        if (isSameRoom(chat, data.room_id ?? data.roomId)) {
          return {
            ...chat,
            lastMessage: data.content,
            lastMessageTime: data.timestamp || chat.lastMessageTime,
            formattedLastMessageTime: timeAgo(data.timestamp || chat.lastMessageTime)
          };
        }
        return chat;
      }));

      setFilteredChats(prevFiltered => prevFiltered.map(chat => {
        if (isSameRoom(chat, data.room_id ?? data.roomId)) {
          return {
            ...chat,
            lastMessage: data.content,
            lastMessageTime: data.timestamp || chat.lastMessageTime,
            formattedLastMessageTime: timeAgo(data.timestamp || chat.lastMessageTime)
          };
        }
        return chat;
      }));
    }
    else if (data.type === 'message_delete' || data.type === 'MESSAGE_DELETE') {
      if (isSameRoom(selectedChatRef.current, data.room_id ?? data.roomId)) {
        setMessages(prev => prev.map((msg) => {
          if (String(msg?.id) !== String(data?.id || data?.message_id)) return msg;
          return {
            ...msg,
            is_deleted: true,
            content: 'This message has been deleted',
            text: 'This message has been deleted',
            attachment_url: null,
            fileUrl: null,
            fileName: null,
            isFile: false
          };
        }));
      }
    }
    else if (data.type === 'typing') {
      if (data.client_id && data.client_id === typingClientIdRef.current) {
        return;
      }
      if (String(data.user_id) === String(currentUser.id)) {
        return;
      }

      const typingRoomId = data.room_id ?? data.roomId;
      const selectedRoomId = getRoomKey(selectedChatRef.current) || getRoomKey(roomId);

      if (selectedRoomId && typingRoomId && !isSameRoom(selectedRoomId, typingRoomId)) {
        return;
      }

      const rawTypingKey = data.client_id || data.user_id;
      if (!rawTypingKey) return;

      const typingKey = `${getRoomKey(typingRoomId) || selectedRoomId || 'room'}:${rawTypingKey}`;
      const typingName =
        data.user_name ||
        data.sender_name ||
        data.sender_email?.split('@')[0] ||
        'Someone';

      if (data.is_typing === false) {
        if (typingTimeoutsRef.current[typingKey]) {
          clearTimeout(typingTimeoutsRef.current[typingKey]);
          delete typingTimeoutsRef.current[typingKey];
        }
        setTypingUsers(prev => ({
          ...prev,
          [typingKey]: {
            isTyping: false,
            user_id: data.user_id,
            room_id: typingRoomId,
            name: typingName
          }
        }));
        return;
      }

      setTypingUsers(prev => ({
        ...prev,
        [typingKey]: {
          isTyping: true,
          user_id: data.user_id,
          room_id: typingRoomId,
          name: typingName
        }
      }));

      if (typingTimeoutsRef.current[typingKey]) {
        clearTimeout(typingTimeoutsRef.current[typingKey]);
      }
      typingTimeoutsRef.current[typingKey] = setTimeout(() => {
        setTypingUsers(prev => ({
          ...prev,
          [typingKey]: {
            isTyping: false,
            user_id: data.user_id,
            room_id: typingRoomId,
            name: typingName
          }
        }));
        delete typingTimeoutsRef.current[typingKey];
      }, 5000);
    }
  };

  const getRoomKey = (roomOrId) => {
    if (roomOrId === null || roomOrId === undefined) return '';
    if (typeof roomOrId === 'object') {
      return String(roomOrId.id ?? roomOrId._id ?? roomOrId.roomId ?? roomOrId.room_id ?? '');
    }
    return String(roomOrId);
  };

  const isSameRoom = (roomOrIdA, roomOrIdB) => {
    const keyA = getRoomKey(roomOrIdA);
    const keyB = getRoomKey(roomOrIdB);
    return !!keyA && !!keyB && keyA === keyB;
  };

  const isCurrentUserEmail = (email) => {
    return (email || '').toString().trim().toLowerCase() === currentUser.email;
  };

  // Update chat list with new message
  const updateChatListWithNewMessage = (messageData) => {
    const messageRoomId = getRoomKey(messageData.room_id ?? messageData.roomId);
    if (!messageRoomId) return;

    const senderEmail = (messageData.sender_email || '').toString().trim().toLowerCase();
    const isOwnMessage = isCurrentUserEmail(senderEmail);
    const isActiveRoom = isSameRoom(messageRoomId, selectedChatRef.current);

    const updateRoom = (chat) => {
      if (!isSameRoom(chat, messageRoomId)) return chat;

      return {
        ...chat,
        lastMessage: messageData.content,
        lastMessageTime: messageData.timestamp,
        formattedLastMessageTime: timeAgo(messageData.timestamp),
        lastMessageSender: {
          email: senderEmail,
          first_name: messageData.sender_first_name,
          last_name: messageData.sender_last_name
        },
        unread_count: isOwnMessage || isActiveRoom ? 0 : (Number(chat.unread_count) || 0) + 1
      };
    };

    setChatList(prevChats => {
      const updatedChats = prevChats.map(updateRoom);
      
      return updatedChats.sort((a, b) => {
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime) : new Date(0);
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime) : new Date(0);
        return timeB - timeA;
      });
    });

    setFilteredChats(prevFiltered => {
      const updatedFiltered = prevFiltered.map(updateRoom);
      
      return updatedFiltered.sort((a, b) => {
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime) : new Date(0);
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime) : new Date(0);
        return timeB - timeA;
      });
    });
  };

  useEffect(() => {
    if (!currentUser.id || !Array.isArray(chatList) || chatList.length === 0) return undefined;

    const roomIds = [...new Set(chatList.map((room) => getRoomKey(room)).filter(Boolean))];
    const activeRoomId = getRoomKey(selectedChatRef.current) || getRoomKey(roomId);

    roomIds.forEach((chatRoomId) => {
      if (roomSocketsRef.current[chatRoomId]) {
        if (isSameRoom(chatRoomId, activeRoomId)) {
          setChatSocket(roomSocketsRef.current[chatRoomId]);
        }
        return;
      }

      const socket = chatService.connectChatWebSocket(
        currentUser.id,
        chatRoomId,
        handleWebSocketMessage
      );

      if (socket) {
        roomSocketsRef.current[chatRoomId] = socket;
        if (isSameRoom(chatRoomId, activeRoomId)) {
          setChatSocket(socket);
        }
      }
    });

    const activeSocketRoomId = roomIds.find((chatRoomId) => isSameRoom(chatRoomId, activeRoomId));
    if (activeSocketRoomId && roomSocketsRef.current[activeSocketRoomId]) {
      setChatSocket(roomSocketsRef.current[activeSocketRoomId]);
    } else {
      setChatSocket(null);
    }

    Object.keys(roomSocketsRef.current).forEach((connectedRoomId) => {
      if (roomIds.includes(connectedRoomId)) return;

      chatService.closeChatWebSocket(connectedRoomId);
      delete roomSocketsRef.current[connectedRoomId];
      if (isSameRoom(connectedRoomId, activeRoomId)) {
        setChatSocket(null);
      }
    });

    return undefined;
  }, [chatList, currentUser.id, roomId, selectedChat?.id, selectedChat?._id, selectedChat?.roomId, selectedChat?.room_id]);

  useEffect(() => {
    return () => {
      Object.keys(roomSocketsRef.current).forEach((connectedRoomId) => {
        chatService.closeChatWebSocket(connectedRoomId);
      });
      roomSocketsRef.current = {};
      Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
      typingTimeoutsRef.current = {};
    };
  }, []);

  // Fetch messages for chat
  const fetchMessagesForChat = async (chat) => {
    try {
      const roomId = chat.id || chat._id;
      if (!roomId) {
        setMessages([]);
        return;
      }
      
      const msgs = await getRoomMessages(roomId);
      
      const processedMessages = msgs.map(msg => {
        const senderEmail = (msg.sender_email || '').toLowerCase();
        const senderFirstName = msg.sender_first_name || '';
        const senderLastName = msg.sender_last_name || '';
        const hasAttachment = !!msg.attachment_url;
        
        return {
          ...msg,
          sender_email: senderEmail,
          sender_first_name: senderFirstName,
          sender_last_name: senderLastName,
          isFile: hasAttachment,
          fileUrl: msg.attachment_url || null,
          fromMe: senderEmail === currentUser.email,
          displayName: senderEmail === currentUser.email ? 'You' : getFullName(senderFirstName, senderLastName) || extractNameFromEmail(senderEmail).fullName || 'User',
          formattedTime: formatMessageTime(msg.timestamp)
        };
      });
      
      setMessages(processedMessages);
      
      try {
        await api.post(`/chat/rooms/${roomId}/read`);
      } catch (err) {
        console.error('Failed to mark room as read:', err);
      }
      
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };

  // Fetch chat list on mount
  useEffect(() => {
    const fetchChats = async () => {
      setIsLoading(true);
      try {
        const chats = await getChatRooms();
        
        const chatData = Array.isArray(chats) ? chats : chats?.data || chats?.rooms || [];
        
        const processedRooms = chatData.map((room) => {
          const lastMessage = room.last_message;
          const lastMessageContent = lastMessage?.content || '';
          const lastMessageTime = lastMessage?.timestamp;
          const formattedLastMessageTime = lastMessageTime ? timeAgo(lastMessageTime) : '';
          const hasMessages = !!(room.message_count > 0 || lastMessage);
          
          // Default values
          let otherParticipantName = 'User';
          let otherParticipantEmail = '';
          let otherParticipantImage = null;
          let otherParticipantFirstName = '';
          let otherParticipantLastName = '';
          let otherParticipantId = null;

          if (room.is_group && room.name) {
            otherParticipantName = room.name;
          }
          
          // Method 1: Check participant_details (new format)
          if (!room.is_group && room.participant_details && Array.isArray(room.participant_details) && room.participant_details.length > 0) {
            const otherParticipant = room.participant_details.find(p => 
              p.email !== currentUser.email
            );
            
            if (otherParticipant) {
              otherParticipantFirstName = otherParticipant.first_name || '';
              otherParticipantLastName = otherParticipant.last_name || '';
              otherParticipantName = `${otherParticipantFirstName} ${otherParticipantLastName}`.trim();
              otherParticipantEmail = otherParticipant.email;
              otherParticipantImage = otherParticipant.profile_image || null;
              otherParticipantId = otherParticipant.id;
              
              if (!otherParticipantName) {
                const extracted = extractNameFromEmail(otherParticipantEmail);
                otherParticipantName = extracted.fullName;
                otherParticipantFirstName = extracted.firstName;
                otherParticipantLastName = extracted.lastName;
              }
            }
          }
          
          // Method 2: Check participants array with objects
          if (!room.is_group && (!otherParticipantName || otherParticipantName === 'User') && room.participants && Array.isArray(room.participants) && room.participants.length > 0) {
            const otherParticipant = room.participants.find(participant => {
              if (typeof participant === 'string') {
                return participant !== currentUser.email;
              }
              const participantEmail = (participant?.email || participant?.user_email || '').toLowerCase();
              return participantEmail && participantEmail !== currentUser.email;
            });
            
            if (otherParticipant) {
              if (typeof otherParticipant === 'string') {
                otherParticipantEmail = otherParticipant;
                const extracted = extractNameFromEmail(otherParticipant);
                otherParticipantName = extracted.fullName;
                otherParticipantFirstName = extracted.firstName;
                otherParticipantLastName = extracted.lastName;
              } else {
                otherParticipantFirstName = otherParticipant.first_name || '';
                otherParticipantLastName = otherParticipant.last_name || '';
                otherParticipantName = `${otherParticipantFirstName} ${otherParticipantLastName}`.trim();
                otherParticipantEmail = otherParticipant.email || otherParticipant.user_email || '';
                otherParticipantImage = otherParticipant.profile_image || null;
                otherParticipantId = otherParticipant.id;
                
                if (!otherParticipantName) {
                  const extracted = extractNameFromEmail(otherParticipantEmail);
                  otherParticipantName = extracted.fullName;
                  otherParticipantFirstName = extracted.firstName;
                  otherParticipantLastName = extracted.lastName;
                }
              }
            }
          }
          
          // Method 3: Check room.user
          if (!room.is_group && (!otherParticipantName || otherParticipantName === 'User') && room.user && room.user.email !== currentUser.email) {
            otherParticipantFirstName = room.user.first_name || '';
            otherParticipantLastName = room.user.last_name || '';
            otherParticipantName = `${otherParticipantFirstName} ${otherParticipantLastName}`.trim();
            otherParticipantEmail = room.user.email;
            otherParticipantImage = room.user.profile_image || null;
            otherParticipantId = room.user.id;
            
            if (!otherParticipantName) {
              const extracted = extractNameFromEmail(otherParticipantEmail);
              otherParticipantName = extracted.fullName;
              otherParticipantFirstName = extracted.firstName;
              otherParticipantLastName = extracted.lastName;
            }
          }
          
          // Method 4: Check room.other_participant
          if (!room.is_group && (!otherParticipantName || otherParticipantName === 'User') && room.other_participant) {
            otherParticipantFirstName = room.other_participant.first_name || '';
            otherParticipantLastName = room.other_participant.last_name || '';
            otherParticipantName = `${otherParticipantFirstName} ${otherParticipantLastName}`.trim();
            otherParticipantEmail = room.other_participant.email;
            otherParticipantImage = room.other_participant.profile_image || null;
            otherParticipantId = room.other_participant.id;
            
            if (!otherParticipantName) {
              const extracted = extractNameFromEmail(otherParticipantEmail);
              otherParticipantName = extracted.fullName;
              otherParticipantFirstName = extracted.firstName;
              otherParticipantLastName = extracted.lastName;
            }
          }
          
          // Method 5: Use room name as fallback
          if ((!otherParticipantName || otherParticipantName === 'User') && room.name) {
            otherParticipantName = room.name;
          }
          
          // Final fallback: Extract from email or use default
          if (!otherParticipantName || otherParticipantName === 'User' || otherParticipantName === '') {
            if (otherParticipantEmail) {
              const emailName = otherParticipantEmail.split('@')[0];
              otherParticipantName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
            } else {
              otherParticipantName = 'User';
            }
          }
          
          return {
            ...room,
            id: room.id,
            _id: room._id,
            lastMessage: lastMessageContent,
            lastMessageTime,
            formattedLastMessageTime,
            unread_count: room.unread_count || 0,
            hasMessages,
            displayName: otherParticipantName,
            displayEmail: otherParticipantEmail,
            displayImage: otherParticipantImage,
            groupInitials: getGroupInitials(room),
            groupColorKeys: getGroupColorKeys(room),
            otherParticipantFirstName,
            otherParticipantLastName,
            otherParticipantId
          };
        });
        
        const visibleRooms = processedRooms.filter(room => room.is_group || room.hasMessages);
        const savedRoomId = selectedChatId || localStorage.getItem(SELECTED_CHAT_STORAGE_KEY);
        let restoredSelectedChat = null;
        let restoredIndex = null;

        if (savedRoomId) {
          restoredIndex = visibleRooms.findIndex(room => String(room.id) === String(savedRoomId) || String(room._id) === String(savedRoomId));
          if (restoredIndex !== -1) {
            restoredSelectedChat = visibleRooms[restoredIndex];
          } else {
            restoredSelectedChat = processedRooms.find(room => String(room.id) === String(savedRoomId) || String(room._id) === String(savedRoomId)) || null;
            restoredIndex = null;
          }
        }

        setChatList(visibleRooms);
        setFilteredChats(visibleRooms);
        setAllChatRooms(processedRooms);

        if (restoredSelectedChat) {
          setSelectedChatIdx(restoredIndex);
          setSelectedChat({ ...restoredSelectedChat, unread_count: 0, participant_details: restoredSelectedChat.participant_details || [] });
          persistSelectedChat(restoredSelectedChat.id || restoredSelectedChat._id);
          fetchMessagesForChat(restoredSelectedChat);
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
        setAllChatRooms([]);
        setChatList([]);
        setFilteredChats([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (currentUser.email) {
      fetchChats();
    }
  }, [currentUser.email, currentUser.id]);

  useEffect(() => {
    const restoreSelectedChat = async () => {
      const savedRoomId = selectedChatId || localStorage.getItem(SELECTED_CHAT_STORAGE_KEY);
      if (!savedRoomId || selectedChatIdx !== null) return;
      if (!allChatRooms || allChatRooms.length === 0) return;

      const restoredRoom = allChatRooms.find(room => String(room.id) === String(savedRoomId) || String(room._id) === String(savedRoomId));
      if (!restoredRoom) return;

      const visibleIndex = chatList.findIndex(room => String(room.id) === String(savedRoomId) || String(room._id) === String(savedRoomId));
      setSelectedChatIdx(visibleIndex !== -1 ? visibleIndex : null);
      setSelectedChat({ ...restoredRoom, unread_count: 0, participant_details: restoredRoom.participant_details || [] });
      persistSelectedChat(restoredRoom.id || restoredRoom._id);
      fetchMessagesForChat(restoredRoom);
    };

    restoreSelectedChat();
  }, [allChatRooms, chatList, selectedChatId, selectedChatIdx]);

  // Handle chat selection
  const handleChatSelect = (chat, options = {}) => {
    setShowStarredView(false);
    const { preserveSearchContext = false, searchLabel = '' } = options;
    const roomIdValue = chat.id || chat._id;
    const resolvedIndex = roomIdValue
      ? chatList.findIndex(c => String(c.id || c._id) === String(roomIdValue))
      : -1;

    if (roomIdValue) {
      navigate(`/chat/${roomIdValue}`);
      persistSelectedChat(roomIdValue);
    }
    setSelectedUser(null);
    if (resolvedIndex !== -1) {
      setSelectedChatIdx(resolvedIndex);
    }

    const shouldClearUnread = (c) => {
      if (!roomIdValue) return false;
      return String(c.id || c._id) === String(roomIdValue);
    };

    setChatList(prevList => prevList.map((c) => {
      if (shouldClearUnread(c)) {
        return { ...c, unread_count: 0 };
      }
      return c;
    }));
    setFilteredChats(prevList => prevList.map((c) => {
      if (shouldClearUnread(c)) {
        return { ...c, unread_count: 0 };
      }
      return c;
    }));
setSelectedChat({ ...chat, unread_count: 0 });

    fetchMessagesForChat(chat);

    if (preserveSearchContext) {
      if (searchLabel) {
        setChatSearch(searchLabel);
      }
      setIsSearchMode(true);
      return;
    }

    setIsSearchMode(false);
  };

  // Handle user profile selection
  const handleUserClick = (user) => {
    setShowStarredView(false);
    const targetEmail = (user?.email || '').toLowerCase();
    const selectedUserDisplayName =
      getFullName(user?.first_name, user?.last_name) ||
      extractNameFromEmail(user?.email || '').fullName ||
      user?.email ||
      '';

    if (targetEmail) {
      const existingChatIdx = chatList.findIndex((room) => {
        if (!room || room.is_group) return false;
        const normalizedRoom = normalizeRoomDisplayData(room);
        const roomEmail = (normalizedRoom?.displayEmail || normalizedRoom?.otherParticipantEmail || '').toLowerCase();
        return roomEmail === targetEmail;
      });

      if (existingChatIdx !== -1) {
        const existingRoom = normalizeRoomDisplayData(chatList[existingChatIdx]);
        handleChatSelect(existingRoom, {
          preserveSearchContext: true,
          searchLabel: selectedUserDisplayName
        });
        return;
      }
    }

    navigate('/chat');
    persistSelectedChat(null);
    const immediateOnline =
      user?.is_online_resolved === true ||
      user?.is_online === true ||
      isPresenceOnline(user?.current_status) ||
      isRoomUserOnline(targetEmail);

    setSelectedUser({
      ...user,
      is_online_resolved: immediateOnline
    });

    const statusIdentifier = user?.id || user?.email;
    if (statusIdentifier && targetEmail) {
      getOnlineStatus(statusIdentifier)
        .then((status) => {
          const resolvedOnline =
            status?.is_online === true ||
            status?.is_online === 1 ||
            status?.is_online === '1' ||
            status?.is_online === 'true';

          setSelectedUser((prev) => {
            if (!prev) return prev;
            const prevEmail = (prev.email || '').toLowerCase();
            if (prevEmail !== targetEmail) return prev;
            return {
              ...prev,
              is_online_resolved: prev.is_online_resolved === true || resolvedOnline
            };
          });
        })
        .catch((error) => {
          console.error('Failed to refresh selected user online status:', error);
        });
    }

    setSelectedChatIdx(null);
    setSelectedChat(null);
    setMessages([]);
    if (selectedUserDisplayName) {
      setChatSearch(selectedUserDisplayName);
    }
    setIsSearchMode(true);
  };

  // Handle search
  const handleChatSearchChange = async (e) => {
    const value = e.target.value;
    setChatSearch(value);
    setIsLoading(true);

    try {
      // Show suggestions for any input, including a single character
      if (value.trim().length === 0) {
        setFilteredChats(chatList);
        setIsSearchMode(false);
        setIsLoading(false);
        return;
      }

      if (value.trim().length < 1) {
        setFilteredChats([]);
        setIsLoading(false);
        return;
      }

      const results = await searchChatUsers(value);
      const filteredResults = results.filter(user => user.email !== currentUser.email);
      
      const searchResults = filteredResults.map(user => ({
        ...user,
        isSearchResult: true,
        displayName: getFullName(user.first_name, user.last_name) || extractNameFromEmail(user.email).fullName || user.email.split('@')[0] || 'User',
        displayEmail: user.email,
        displayImage: user.avatar_url || user.profile_image || user.avatar || null,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        is_online_resolved:
          user?.is_online === true ||
          isPresenceOnline(user?.current_status) ||
          isRoomUserOnline(user?.email || '')
      }));
      
      setFilteredChats(searchResults);
      setIsSearchMode(true);
    } catch (error) {
      console.error('Error searching users:', error);
      setFilteredChats([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChatSearch = () => {
    setChatSearch('');
    setFilteredChats(chatList);
    setIsSearchMode(false);
    setIsLoading(false);
  };

  // Handle send message
  const handleSend = async () => {
    if (input.trim() === "") return;
    
    if (selectedUser && !selectedChat) {
      try {
        setIsLoading(true);
        const newRoom = await createChatRoom(selectedUser.id, selectedUser.email);
        
        if (newRoom) {
          const roomId = newRoom.id || newRoom._id;
          const response = await sendMessageToRoom(roomId, { content: input });
          
          const newMessage = {
            id: response.id,
            content: input,
            sender_email: currentUser.email,
            sender_first_name: currentUser.first_name,
            sender_last_name: currentUser.last_name,
            timestamp: response.timestamp,
            fromMe: true,
            displayName: 'You',
            formattedTime: formatMessageTime(response.timestamp)
          };
          
          setMessages([newMessage]);
          setInput("");
          persistSelectedChat(roomId);
          setSelectedChatIdx(0);
          setSelectedChat({ ...newRoom, id: roomId, _id: roomId, unread_count: 0, participant_details: newRoom.participant_details || [] });
          setSelectedUser(null);
          
          const chats = await getChatRooms();
          const chatData = Array.isArray(chats) ? chats : chats?.data || chats?.rooms || [];
          setChatList(prevList => {
            const prevById = new Map(
              prevList.map(room => [String(room.id || room._id), room])
            );

            return chatData.map(room => {
              const roomIdKey = String(room.id || room._id);
              const prevRoom = prevById.get(roomIdKey);
              return prevRoom ? { ...prevRoom, ...room } : room;
            });
          });

          setFilteredChats(prevFiltered => {
            const prevById = new Map(
              prevFiltered.map(room => [String(room.id || room._id), room])
            );

            return chatData.map(room => {
              const roomIdKey = String(room.id || room._id);
              const prevRoom = prevById.get(roomIdKey);
              return prevRoom ? { ...prevRoom, ...room } : room;
            });
          });
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Failed to send message');
      } finally {
        setIsLoading(false);
      }
    } else {
      const currentRoom = selectedChat || (
        selectedChatIdx !== null && selectedChatIdx !== undefined
          ? chatList[selectedChatIdx]
          : null
      );
      if (!currentRoom) return;
      
      const roomId = currentRoom.id || currentRoom._id;
      const messageContent = input;
      const tempId = `temp-${Date.now()}`;
      const sentAt = new Date().toISOString();

      const optimisticMessage = {
        id: tempId,
        content: messageContent,
        sender_email: currentUser.email,
        sender_first_name: currentUser.first_name,
        sender_last_name: currentUser.last_name,
        timestamp: sentAt,
        fromMe: true,
        displayName: 'You',
        formattedTime: formatMessageTime(sentAt)
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      setInput("");
      const applyOwnMessagePreview = (chat) => {
        if (!isSameRoom(chat, roomId)) return chat;
        return {
          ...chat,
          lastMessage: messageContent,
          lastMessageTime: sentAt,
          formattedLastMessageTime: timeAgo(sentAt),
          unread_count: 0
        };
      };
      const optimisticRoom = applyOwnMessagePreview(currentRoom);
      setSelectedChat(optimisticRoom);
      setAllChatRooms(prevList => {
        const hasRoom = prevList.some(chat => isSameRoom(chat, roomId));
        const updatedList = prevList.map(applyOwnMessagePreview);
        return hasRoom ? updatedList : [optimisticRoom, ...updatedList];
      });
      setChatList(prevList => {
        const hasRoom = prevList.some(chat => isSameRoom(chat, roomId));
        const updatedList = prevList.map(applyOwnMessagePreview);
        return hasRoom ? updatedList : [optimisticRoom, ...updatedList];
      });
      setFilteredChats(prevList => {
        const hasRoom = prevList.some(chat => isSameRoom(chat, roomId));
        const updatedList = prevList.map(applyOwnMessagePreview);
        return hasRoom ? updatedList : [optimisticRoom, ...updatedList];
      });

      try {
        const response = await sendMessageToRoom(roomId, { content: messageContent });
        
        const sentMessage = {
          id: response.id,
          content: response.content,
          sender_email: response.sender_email || currentUser.email,
          sender_first_name: response.sender_first_name || currentUser.first_name,
          sender_last_name: response.sender_last_name || currentUser.last_name,
          timestamp: response.timestamp,
          fromMe: true,
          displayName: 'You',
          formattedTime: formatMessageTime(response.timestamp)
        };
        
        setMessages(prev => {
          const cleaned = prev.filter(msg => {
            return !(msg.id?.toString().startsWith('temp-') &&
              msg.fromMe &&
              msg.sender_email === sentMessage.sender_email &&
              msg.content === sentMessage.content);
          });

          const updated = cleaned.map(msg => msg.id === tempId ? sentMessage : msg);
          const hasRealId = updated.some(msg => msg.id === sentMessage.id);

          if (!hasRealId) {
            updated.push(sentMessage);
          }

          return updated.filter((msg, idx, arr) => arr.findIndex(item => item.id === msg.id) === idx);
        });
        const applyConfirmedOwnMessagePreview = (chat) => {
          if (!isSameRoom(chat, roomId)) return chat;
          return {
            ...chat,
            lastMessage: sentMessage.content,
            lastMessageTime: sentMessage.timestamp,
            formattedLastMessageTime: timeAgo(sentMessage.timestamp),
            unread_count: 0
          };
        };
        const confirmedRoom = applyConfirmedOwnMessagePreview(optimisticRoom);
        setSelectedChat(confirmedRoom);
        setAllChatRooms(prevList => {
          const hasRoom = prevList.some(chat => isSameRoom(chat, roomId));
          const updatedList = prevList.map(applyConfirmedOwnMessagePreview);
          return hasRoom ? updatedList : [confirmedRoom, ...updatedList];
        });
        setChatList(prevList => {
          const hasRoom = prevList.some(chat => isSameRoom(chat, roomId));
          const updatedList = prevList.map(applyConfirmedOwnMessagePreview);
          return hasRoom ? updatedList : [confirmedRoom, ...updatedList];
        });
        setFilteredChats(prevList => {
          const hasRoom = prevList.some(chat => isSameRoom(chat, roomId));
          const updatedList = prevList.map(applyConfirmedOwnMessagePreview);
          return hasRoom ? updatedList : [confirmedRoom, ...updatedList];
        });

      } catch (error) {
        console.error('Failed to send message:', error);
        alert('Failed to send message');
      }
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const [activeTab, setActiveTab] = useState("files");
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleCloseSettingsPopup = () => {
    setShowSettingsPopup(false);
    setActiveTab("files");
  };

  const handleViewAllPhotos = () => setShowAllPhotos(true);

  const files = [
    { name: "images.png", icon: "image" },
    { name: "images.png", icon: "image" },
    { name: "Files.pdf", icon: "pdf" }
  ];
  const photos = [chatimg, chatimg1, chatimg2, chatimg3, chatimg4];

  // Ensure selectedChat is set from roomId on mount or when roomId changes
  useEffect(() => {
    if (!roomId || !allChatRooms.length) return;

    const found = allChatRooms.find(
      chat => String(chat.id) === String(roomId) || String(chat._id) === String(roomId)
    );
    if (found) {
      const foundIndex = chatList.findIndex(
        chat => String(chat.id) === String(roomId) || String(chat._id) === String(roomId)
      );
      setSelectedChatIdx(foundIndex !== -1 ? foundIndex : null);
      setSelectedChat(found);
      fetchMessagesForChat(found);
      return;
    }
  }, [roomId, allChatRooms, chatList]);

  return (
    <div className={`w-full min-h-screen flex flex-col transition-all duration-1000 ease-in-out ${visible ? "opacity-100" : "opacity-0"}`}> 
      <Navbar />
      <AppNavBar />
      <div className="flex flex-1 overflow-hidden w-full min-h-0">
        {/* Sidebar */}
        <div className="w-[261px] p-[10px] flex flex-col h-full min-h-0">
          <div className="flex flex-col w-[229px] gap-[24px] flex-1 min-h-0">
            {/* Chats Header */}
            <div className="flex flex-col w-full min-h-[180px] h-auto gap-[24px] flex-shrink-0">
              <div className="flex flex-col w-full h-[77px] gap-[23px]">
                <div className="flex flex-row justify-between items-center w-full h-[20px]">
                  <span className="inter-bold text-[16px] text-[#040B23] tracking-[0.07em]">Chats</span>
                  <div className="flex flex-row items-center w-[100px] justify-center h-[20px] gap-[20px]">
                    <ChatThreeDotIcon />
                    <ChatInboxIcon />
                    <ChatEditIcon onClick={() => {
                      setShowStarredView(false);
                      setFilteredChats(chatList);
                      setIsSearchMode(false);
                      setSelectedUser(null);
                      setSelectedChatIdx(null);
                      setSelectedChat(null);
                      setMessages([]);
                      setInput("");
                      setIsLoading(false);
                    }} className="cursor-pointer hover:opacity-70" />
                  </div>
                </div>

                <div className="relative w-[229px] h-[34px]">
                  <ChatSearchIcon className="absolute left-[10px] top-[50%] translate-y-[-50%]" />
                  <input
                    type="text"
                    placeholder="Search chat"
                    className="w-full h-full pl-[33px] pr-[28px] py-[9px] bg-[#F6F6F6] border border-[#EAEAEA] rounded-[6px] opacity-100 outline-none text-[12px] inter-regular placeholder:text-[#C1C1C1]"
                    value={chatSearch}
                    onChange={handleChatSearchChange}
                  />
                  {chatSearch && (
                    <button
                      type="button"
                      onClick={handleClearChatSearch}
                      className="absolute right-[8px] top-[50%] translate-y-[-50%] text-[#8A8A8A] hover:text-[#4A4A4A] text-[12px] leading-none"
                      aria-label="Clear search"
                      title="Clear search"
                    >
                      x
                    </button>
                  )}
                  {/* Suggestions Popup */}
                  {chatSearch.length > 0 && isSearchMode && filteredChats.filter(item => item.isSearchResult).length > 0 && (
                    <div
                      style={{
                        width: 229,
                        height: 308,
                        position: 'absolute',
                        top: 42,
                        left: 0,
                        background: '#fff',
                        borderRadius: 8,
                        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)',
                        opacity: 1,
                        zIndex: 100,
                        gap: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        padding: 10,
                        overflowY: 'auto',
                      }}
                    >
                      {filteredChats.filter(item => item.isSearchResult).map((item) => {
                        const displayName = item.displayName;
                        const profileImage = item.displayImage;
                        const userId = item.id;
                        const firstName = item.first_name;
                        const lastName = item.last_name;
                        const isUserResultOnline =
                          item.is_online_resolved === true ||
                          (typeof item.is_online === 'boolean' ? item.is_online : false);
                        const hasImageError = imageLoadErrors[userId];
                        const showInitials = !profileImage || hasImageError;
                        return (
                          <div
                            key={item.id || item.email}
                            className={`w-full h-[40px] px-[10px] py-[6px] cursor-pointer hover:bg-gray-100 flex-shrink-0 ${
                              selectedUser?.id === item.id ? 'bg-[#F6F3FF]' : ''
                            }`}
                            onClick={() => handleUserClick(item)}
                          >
                            <div className="flex flex-row items-center w-full h-[30px] gap-[10px]">
                              {!showInitials ? (
                                <div className="flex items-center justify-center" style={{ width: 30, height: 30, minWidth: 30 }}>
                                  <div className="relative flex items-center justify-center" style={{ width: 30, height: 30 }}>
                                    <img
                                      src={profileImage}
                                      alt={displayName}
                                      className="w-[30px] h-[30px] rounded-full object-cover align-middle"
                                      style={{ display: 'inline-block', verticalAlign: 'middle' }}
                                      onError={() => handleImageError(userId)}
                                    />
                                    {isUserResultOnline && (
                                      <span
                                        className="absolute right-0 bottom-0 inline-block w-[8px] h-[8px] rounded-full bg-[#34C759] border border-white"
                                        title="Online"
                                      />
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center" style={{ width: 30, height: 30, minWidth: 30 }}>
                                  <div className="relative flex items-center justify-center" style={{ width: 30, height: 30 }}>
                                    <div
                                      className="w-[30px] h-[30px] rounded-full text-[12px] font-semibold flex items-center justify-center uppercase"
                                      style={{
                                        backgroundColor: stringToPastelColor((item.displayEmail || item.email || '').toLowerCase() || (item.id ? String(item.id) : '')),
                                        color: stringToDarkColor((item.displayEmail || item.email || '').toLowerCase() || (item.id ? String(item.id) : '')),
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        verticalAlign: 'middle',
                                      }}
                                    >
                                      {getInitials(firstName, lastName)}
                                    </div>
                                    {isUserResultOnline && (
                                      <span
                                        className="absolute right-0 bottom-0 inline-block w-[8px] h-[8px] rounded-full bg-[#34C759] border border-white"
                                        title="Online"
                                      />
                                    )}
                                  </div>
                                </div>
                              )}
                              <div className="flex flex-col justify-between w-full h-[30px]">
                                <span className="inter-medium text-[10px] mt-[5px] tracking-[0.07em] whitespace-nowrap overflow-hidden text-ellipsis">
                                  {firstName || ''} {lastName || ''}
                                </span>
                                <span className="inter-regular text-[10px] text-[#8A8A8A] whitespace-nowrap overflow-hidden text-ellipsis -mt-1">
                                  {(item.displayEmail || item.email || '')}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col w-full min-h-[79px] gap-[16px]">
                <div className="flex flex-row items-center justify-between w-full h-[16px]">
                  <span className="inter-bold text-[12px] tracking-[0.07em]">Shortcuts</span>
                  <ChatShortcutsArrowIcon />
                </div>
                <div
                  className="flex flex-row items-center justify-between px-[10px] gap-[12px] w-full h-[25px] cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex flex-row items-center gap-[12px]" onClick={() => {
                    setFilteredChats(chatList.filter(chat => chat.is_group));
                    setIsSearchMode(true);
                    setShowStarredView(false);
                    setShowGroupModal(false);
                  }}>
                    <span className="text-[#5A5A5A]">@</span>
                    <span className="inter-regular text-[12px] tracking-[0.07em] text-[#5A5A5A]">Groups</span>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); openGroupModal(); }}>
                    <path d="M12 6.85714H6.85714V12H5.14286V6.85714H0V5.14286H5.14286V0H6.85714V5.14286H12V6.85714Z" fill="black"/>
                  </svg>
                </div>
                <div
                  className={`flex flex-row items-center px-[10px] gap-[12px] w-full h-[25px] cursor-pointer hover:bg-gray-100 ${showStarredView ? 'bg-gray-100 rounded-[4px]' : ''}`}
                  onClick={() => {
                    setShowStarredView(true);
                    setStarredViewKey(prev => prev + 1);
                    navigate('/chat');
                    persistSelectedChat(null);
                    setSelectedUser(null);
                    setSelectedChatIdx(null);
                    setSelectedChat(null);
                    setMessages([]);
                    setInput('');
                    setIsLoading(false);
                  }}
                >
                  <ChatStarIcon />
                  <span className="inter-regular text-[12px] tracking-[0.07em] text-[#5A5A5A]">Starred</span>
                </div>
              </div>
            </div>

            {/* All Messages Section */}
            <div className="flex flex-col w-full flex-1 gap-[22px] h-full overflow-hidden">
              <div className="flex flex-row items-center justify-between w-full h-[16px] flex-shrink-0">
                <span className="inter-bold text-[12px] tracking-[0.07em]">
                  {isSearchMode ? 'Search Results' : 'All Messages'}
                </span>
                <ChatAllMessagesArrowIcon />
              </div>

              <div className="flex flex-col w-[229px] flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1 max-h-[390px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {isLoading ? (
                  <div className="flex items-center justify-center w-full h-full text-[#B6B6B6] text-[12px]">
                    Loading...
                  </div>
                ) : (isSearchMode ? filteredChats.length === 0 : chatList.length === 0) ? (
                  <div className="flex flex-col items-center justify-center w-full h-full text-[#B6B6B6] text-[12px] gap-2">
                    <p>No conversations yet.</p>
                    <p className="text-center text-[10px]">Search for users to start chatting</p>
                  </div>
                ) : (
                  <div className="flex flex-col w-full pb-1">
                    {(isSearchMode ? filteredChats : chatList).map((item, idx) => {
                      const roomData = normalizeRoomDisplayData(item);
                      let chatDisplayName = roomData.displayName;
                      if (!chatDisplayName || chatDisplayName === 'User') {
                        if (roomData.displayEmail) {
                          const emailName = roomData.displayEmail.split('@')[0];
                          chatDisplayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
                        } else {
                          chatDisplayName = 'User';
                        }
                      }

                      const roomIdValue = roomData.id || roomData._id;
                      const isSelectedRoom = roomIdValue && selectedChatId
                        ? String(roomIdValue) === String(selectedChatId)
                        : false;

                      const firstName = roomData.otherParticipantFirstName;
                      const lastName = roomData.otherParticipantLastName;
                      const profileImage = roomData.displayImage;
                      const userId = roomData.otherParticipantId;
                      const hasImageError = imageLoadErrors[userId];
                      const showInitials = !profileImage || hasImageError;
                      const showGroupCollage = roomData.is_group && !profileImage && Array.isArray(roomData.groupInitials) && roomData.groupInitials.length > 0;

                      return (
                        <div
                          key={roomData.id || roomData._id || idx}
                          className={`w-full h-[50px] ${isSelectedRoom ? "bg-[#F0EAFF] rounded-[6px] border border-[#DCD0FF]" : ""} px-[10px] py-[10px] cursor-pointer hover:bg-gray-100 flex-shrink-0`}
                          onClick={() => handleChatSelect(roomData)}
                        >
                          <div className="flex flex-row items-center justify-between w-[201px] h-[30px]">
                            <div className="flex flex-row w-[115px] h-[30px] gap-[10px]">
                              {!showInitials ? (
                                <div className="w-[50px] h-[30px] flex items-center justify-center">
                                  <div className="relative w-[30px] h-[30px]">
                                    <img 
                                      src={profileImage} 
                                      alt={chatDisplayName} 
                                      className="w-[30px] h-[30px] rounded-[50%] object-cover"
                                      onError={() => handleImageError(userId)}
                                    />
                                    {isRoomUserOnline(roomData.displayEmail) && (
                                      <span
                                        className="absolute right-0 bottom-0 inline-block w-[8px] h-[8px] rounded-full bg-[#34C759] border border-white"
                                        title="Online"
                                      />
                                    )}
                                  </div>
                                </div>
                              ) : showGroupCollage ? (
                                <div className="w-[50px] h-[30px] flex items-center justify-center">
                                  <div
                                    className="w-[30px] h-[30px] rounded-full overflow-hidden border border-[#EAEAEA]"
                                    style={{
                                      display: 'grid',
                                      ...(
                                        roomData.groupInitials.length === 1
                                          ? { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' }
                                          : roomData.groupInitials.length === 2
                                            ? { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr' }
                                            : { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' }
                                      )
                                    }}
                                  >
                                    {(() => {
                                        const count = roomData.groupInitials.length;

                                        if (count === 1) {
                                          const colorKey = roomData.groupColorKeys?.[0] || roomData.groupInitials[0] || '';
                                          return [
                                            <div
                                              key={`group-initial-${roomData.id || roomData._id}-0`}
                                              className="flex items-center justify-center text-[8px] font-semibold w-full h-full"
                                              style={{
                                                backgroundColor: stringToPastelColor(colorKey),
                                                color: stringToDarkColor(colorKey),
                                              }}
                                            >
                                              {roomData.groupInitials[0] || ''}
                                            </div>
                                          ];

                                        } else if (count === 2) {
                                          return [0, 1].map(cellIdx => {
                                            const colorKey = roomData.groupColorKeys?.[cellIdx] || roomData.groupInitials[cellIdx] || '';
                                            return (
                                              <div
                                                key={`group-initial-${roomData.id || roomData._id}-${cellIdx}`}
                                                className="flex items-center justify-center text-[8px] font-semibold w-full h-full"
                                                style={{
                                                  backgroundColor: stringToPastelColor(colorKey),
                                                  color: stringToDarkColor(colorKey),
                                                }}
                                              >
                                                {roomData.groupInitials[cellIdx] || ''}
                                              </div>
                                            );
                                          });

                                        } else if (count === 3) {
                                          return (
                                            <div
                                              className="relative w-[30px] h-[30px] overflow-hidden"
                                              style={{ clipPath: 'circle(50% at 50% 50%)' }}
                                            >
                                              <div
                                                key={`group-initial-${roomData.id || roomData._id}-0`}
                                                className="absolute left-0 top-0 w-4 h-[30px] flex items-center justify-center text-[8px] font-semibold rounded-l-[15px]"
                                                style={{
                                                  backgroundColor: stringToPastelColor(roomData.groupColorKeys?.[0] || roomData.groupInitials[0] || ''),
                                                  color: stringToDarkColor(roomData.groupColorKeys?.[0] || roomData.groupInitials[0] || ''),
                                                }}
                                              >
                                                {roomData.groupInitials[0] || ''}
                                              </div>

                                              <div
                                                key={`group-initial-${roomData.id || roomData._id}-1`}
                                                className="absolute top-0 w-[14px] h-[15px] flex items-center justify-center text-[8px] font-semibold rounded-tr-[15px]"
                                                style={{
                                                  left: '16px',
                                                  backgroundColor: stringToPastelColor(roomData.groupColorKeys?.[1] || roomData.groupInitials[1] || ''),
                                                  color: stringToDarkColor(roomData.groupColorKeys?.[1] || roomData.groupInitials[1] || ''),
                                                }}
                                              >
                                                {roomData.groupInitials[1] || ''}
                                              </div>

                                              <div
                                                key={`group-initial-${roomData.id || roomData._id}-2`}
                                                className="absolute w-[14px] h-[15px] flex items-center justify-center text-[8px] font-semibold rounded-br-[15px]"
                                                style={{
                                                  left: '16px',
                                                  top: '15px',
                                                  backgroundColor: stringToPastelColor(roomData.groupColorKeys?.[2] || roomData.groupInitials[2] || ''),
                                                  color: stringToDarkColor(roomData.groupColorKeys?.[2] || roomData.groupInitials[2] || ''),
                                                }}
                                              >
                                                {roomData.groupInitials[2] || ''}
                                              </div>
                                            </div>
                                          );

                                        } else {
                                          return [0, 1, 2, 3].map(cellIdx => {
                                            const colorKey = roomData.groupColorKeys?.[cellIdx] || roomData.groupInitials[cellIdx] || '';
                                            return (
                                              <div
                                                key={`group-initial-${roomData.id || roomData._id}-${cellIdx}`}
                                                className="flex items-center justify-center text-[8px] font-semibold w-full h-full"
                                                style={{
                                                  backgroundColor: stringToPastelColor(colorKey),
                                                  color: stringToDarkColor(colorKey),
                                                }}
                                              >
                                                {roomData.groupInitials[cellIdx] || ''}
                                              </div>
                                            );
                                          });
                                        }
                                      })()}
                                  </div>
                                </div>
                              ) : (
                                <div className="w-[50px] h-[30px] flex items-center justify-center">
                                  <div className="relative w-[30px] h-[30px]">
                                    <div
                                      className="w-[30px] h-[30px] rounded-full text-[12px] font-semibold flex items-center justify-center uppercase"
                                      style={{
                                        backgroundColor: stringToPastelColor((roomData.displayEmail || roomData.otherParticipantId || roomData.id || '').toLowerCase()),
                                        color: stringToDarkColor((roomData.displayEmail || roomData.otherParticipantId || roomData.id || '').toLowerCase())
                                      }}
                                    >
                                      {getInitials(firstName, lastName)}
                                    </div>
                                    {isRoomUserOnline(roomData.displayEmail) && (
                                      <span
                                        className="absolute right-0 bottom-0 inline-block w-[8px] h-[8px] rounded-full bg-[#34C759] border border-white"
                                        title="Online"
                                      />
                                    )}
                                  </div>
                                </div>
                              )}
                              <div className="flex flex-col justify-between w-full h-[30px]">
                                <span className={`${roomData.unread_count > 0 ? 'inter-bold' : 'inter-regular'} text-[12px] tracking-[0.07em] whitespace-nowrap overflow-hidden text-ellipsis`}>
                                  {chatDisplayName}
                                </span>
                                <span className={`${roomData.unread_count > 0 ? 'inter-bold text-[#6A37F5]' : 'inter-regular text-[#B6B6B6]'} text-[8px] leading-[100%] tracking-[0.07em] align-middle`}>
                                  {roomData.formattedLastMessageTime}
                                </span>
                              </div>
                            </div>
                            {Number(roomData.unread_count) > 0 && (
                              <div className="flex items-center justify-center w-4 h-4 rounded-full bg-[#6A37F5] flex-shrink-0">
                                <span className="inter-regular text-[10px] text-white">{Number(roomData.unread_count)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 h-full min-h-0">
          {showStarredView ? (
            <ChatStarred key={starredViewKey} />
          ) : (
            <ChatMainArea
              chatList={chatList}
              selectedChatIdx={selectedChatIdx}
              selectedChatOverride={selectedChat}
              input={input}
              handleInputChange={handleInputChange}
              handleKeyDown={handleKeyDown}
              handleSend={handleSend}
              messages={messages}
              setMessages={setMessages}
              selectedUser={selectedUser}
              setInput={setInput}
              currentUser={currentUser}
              getSenderDisplayName={getSenderDisplayName}
              formatMessageTime={formatMessageTime}
              typingUsers={typingUsers}
              chatSocket={chatSocket}
              onlineUserEmails={onlineUserEmails}
              typingClientId={typingClientIdRef.current}
            />
          )}
          <ChatDetails
            roomId={selectedChat?.id || selectedChat?._id || selectedChat?.roomId || selectedChat?.room_id}
            selectedChat={selectedChat}
            activeTab={activeTab}
            handleTabClick={handleTabClick}
            files={files}
            photos={photos}
            showAllPhotos={showAllPhotos}
            handleViewAllPhotos={handleViewAllPhotos}
          />
        </div>

        <RightSidebar />
      </div>

      {showGroupModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="w-full max-w-[420px] bg-white rounded-lg p-4 shadow-xl">
            <h3 className="inter-bold text-[16px] text-[#000000] mb-3">Create Group</h3>
            
             <div className="flex flex-col w-full px-[15px] gap-[5px]">
            <label className="inter-regular text-[12px] text-[#000000] mb-1">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="w-full h-[36px] px-3 border border-[#D6D6D6] rounded-[6px] text-[12px] mb-3 outline-none"
            />
            </div>

            <div className="flex flex-col w-full px-[15px] gap-[5px]">
            <label className="inter-regular text-[12px] text-[#000000] mb-1">Add participants</label>
            <input
              type="text"
              value={groupMemberQuery}
              onChange={(e) => setGroupMemberQuery(e.target.value)}
              placeholder="Search name or email"
              className="w-full h-[36px] px-3 border border-[#D6D6D6] rounded-[6px] text-[12px] mb-2 outline-none"
            />
            </div>

            {groupMemberResults.length > 0 && (
              <div className="max-h-[140px] overflow-y-auto border border-[#EFEFEF] rounded-[6px] py-[10px] ml-[15px] mr-[15px] mb-3">
                {groupMemberResults.map(user => (
                  <button
                    key={user.id || user.email}
                    type="button"
                    onClick={() => addGroupMember(user)}
                    className="w-full text-left px-3 py-2 hover:bg-[#F7F7F7] border-b border-[#F3F3F3] last:border-b-0 flex items-center gap-2"
                  >
                    {user.profile_image ? (
                      <img
                        src={user.profile_image}
                        alt={user.first_name || user.email}
                        className="w-7 h-7 rounded-full object-cover mr-2"
                        style={{ minWidth: 28 }}
                      />
                    ) : (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold uppercase mr-2"
                        style={{
                          backgroundColor: stringToPastelColor(user.email),
                          color: stringToDarkColor(user.email),
                          minWidth: 28
                        }}
                      >
                        {(user.first_name?.[0] || user.email?.[0] || 'U')}
                      </div>
                    )}
                    <div>
                      <div className="text-[12px] text-[#040B23]">{`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email}</div>
                      <div className="text-[10px] text-[#7A7A7A]">{user.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-4 ml-[15px] min-h-[28px]">
              {selectedGroupMembers.map(member => (
                <span key={member.email} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#F0EAFF] text-[#4B2AA7] text-[11px]">
                  {`${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email}
                  <button type="button" onClick={() => removeGroupMember(member.email)} className="text-[#4B2AA7]">x</button>
                </span>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeGroupModal}
                className="px-3 h-[25px] rounded-[6px] text-[12px] border border-[#E2E2E2]"
                disabled={isCreatingGroup}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateGroupFromShortcut}
                disabled={isCreatingGroup}
                className="px-3 h-[25px] text-[12px] bg-[#0078D4] text-white disabled:opacity-50"
              >
                {isCreatingGroup ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettingsPopup && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
          onClick={handleCloseSettingsPopup}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <Settings centered />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHome;

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import ChatMinimalView from "./ChatMinimalView";
import { getChatRooms, getRoomMessages, getUserProfile, chatService } from "../../../api/api";

const MinimalChatWrapper = () => {
  const { roomId } = useParams();

  const [chat, setChat] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [chatSocket, setChatSocket] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeoutsRef = useRef({});
  const typingClientIdRef = useRef(
    (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : `typing-${Date.now()}-${Math.random()}`
  );

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const profile = await getUserProfile();
        const [msgs, rooms] = await Promise.all([
          getRoomMessages(roomId),
          getChatRooms().catch(() => []),
        ]);
        const roomDetails = Array.isArray(rooms)
          ? rooms.find((room) => String(room.id || room._id) === String(roomId))
          : null;

        const processedMessages = msgs.map((m) => ({
          ...m,
          id: m.id,
          content: m.content,
          sender_email: (m.sender_email || "").toLowerCase(),
          sender_first_name: m.sender_first_name || "",
          sender_last_name: m.sender_last_name || "",
          timestamp: m.timestamp,
          attachment_url: m.attachment_url,
          fileUrl: m.attachment_url,
          link_url: m.link_url,
          link_title: m.link_title,
          link_description: m.link_description,
          link_image: m.link_image,
          isFile: !!m.attachment_url,
          fromMe:
            (m.sender_email || "").toLowerCase() ===
            (profile.email || "").toLowerCase(),
          formattedTime: formatMessageTime(m.timestamp),
        }));

        const normalizedCurrentUser = {
          ...profile,
          email: (profile.email || "").toLowerCase(),
          fullName: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User",
        };

        setCurrentUser(normalizedCurrentUser);

        setChat({
          ...(roomDetails || {}),
          id: roomId,
          _id: roomId,
          name: roomDetails?.name || roomDetails?.displayName || "Chat",
          displayName: roomDetails?.displayName || roomDetails?.name || "Chat",
          participant_details: roomDetails?.participant_details || [],
          participants: roomDetails?.participants || [],
          is_group: !!roomDetails?.is_group,
          messages: processedMessages,
        });
      } catch (err) {
        console.error("Minimal chat load error:", err);
      }
    };

    if (roomId) loadData();
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !currentUser?.id) return undefined;

    const isDuplicateMessage = (existingMessage, incomingMessage) => {
      const existingId = existingMessage?.id != null ? String(existingMessage.id) : null;
      const incomingId = incomingMessage?.id != null ? String(incomingMessage.id) : null;
      const existingIsTemp = existingId?.startsWith("temp-");

      if (existingId && incomingId && !existingIsTemp && existingId === incomingId) {
        return true;
      }

      const existingTime = new Date(existingMessage?.timestamp || 0).getTime();
      const incomingTime = new Date(incomingMessage?.timestamp || 0).getTime();
      const timestampsClose =
        !Number.isNaN(existingTime) &&
        !Number.isNaN(incomingTime) &&
        Math.abs(existingTime - incomingTime) < 2000;

      return (
        (existingMessage?.sender_email || "").toLowerCase() ===
          (incomingMessage?.sender_email || "").toLowerCase() &&
        existingMessage?.content === incomingMessage?.content &&
        (existingMessage?.timestamp === incomingMessage?.timestamp || timestampsClose)
      );
    };

    const getTypingKey = (messageData) => {
      const typingRoomId = messageData.room_id ?? messageData.roomId ?? roomId;
      return `${typingRoomId}:${messageData.client_id || messageData.user_id}`;
    };

    const clearTyping = (typingKey, userId) => {
      if (!typingKey) return;
      if (typingTimeoutsRef.current[typingKey]) {
        clearTimeout(typingTimeoutsRef.current[typingKey]);
        delete typingTimeoutsRef.current[typingKey];
      }
      setTypingUsers((prev) => ({
        ...prev,
        [typingKey]: { isTyping: false, user_id: userId, room_id: roomId },
      }));
    };

    const markTyping = (messageData) => {
  if (messageData.client_id === typingClientIdRef.current) return;
  if (String(messageData.user_id) === String(currentUser.id)) return;

  const typingKey = messageData.client_id || messageData.user_id;

  const userName =
    messageData.user_name ||
    messageData.sender_name ||
    messageData.sender_email?.split("@")[0] ||
    "Someone";

  setTypingUsers((prev) => ({
    ...prev,
    [typingKey]: {
      isTyping: true,
      user_id: messageData.user_id,
      name: userName,
      room_id: messageData.room_id ?? messageData.roomId ?? roomId,
    },
  }));

  if (typingTimeoutsRef.current[typingKey]) {
    clearTimeout(typingTimeoutsRef.current[typingKey]);
  }

  typingTimeoutsRef.current[typingKey] = setTimeout(() => {
    setTypingUsers((prev) => ({
      ...prev,
      [typingKey]: {
        isTyping: false,
        user_id: messageData.user_id,
        name: userName,
        room_id: messageData.room_id ?? messageData.roomId ?? roomId,
      },
    }));
  }, 3000);
};

    const socket = chatService.connectChatWebSocket(
      currentUser.id,
      roomId,
      (messageData) => {
        if (!messageData) return;

        if (messageData.type === "typing") {
          if (messageData.client_id && messageData.client_id === typingClientIdRef.current) return;
          if (String(messageData.user_id) === String(currentUser.id)) return;

          const typingKey = getTypingKey(messageData);
          if (messageData.is_typing === false) {
            clearTyping(typingKey, messageData.user_id);
          } else {
            markTyping(messageData);
          }
          return;
        }

        if (["message_update", "MESSAGE_UPDATE", "update"].includes(messageData.type)) {
          setChat((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              messages: prev.messages.map((message) =>
                String(message.id) === String(messageData.id || messageData.message_id)
                  ? {
                      ...message,
                      ...messageData,
                      content: messageData.content ?? message.content,
                      is_edited: messageData.is_edited ?? true,
                    }
                  : message
              ),
            };
          });
          return;
        }

        if (["message_delete", "MESSAGE_DELETE", "delete"].includes(messageData.type)) {
          setChat((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              messages: prev.messages.map((message) =>
                String(message.id) === String(messageData.id || messageData.message_id)
                  ? {
                      ...message,
                      is_deleted: true,
                      content: "This message has been deleted",
                      text: "This message has been deleted",
                      attachment_url: null,
                      fileUrl: null,
                      fileName: null,
                      isFile: false,
                    }
                  : message
              ),
            };
          });
          return;
        }

        if (["star_update", "reaction", "reaction_update", "REACTION_UPDATE"].includes(messageData.type)) {
          setChat((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              messages: prev.messages.map((message) =>
                String(message.id) === String(messageData.message_id || messageData.id)
                  ? {
                      ...message,
                      is_starred: messageData.is_starred ?? message.is_starred,
                      reactions: messageData.reactions ?? message.reactions,
                    }
                  : message
              ),
            };
          });
          return;
        }

        if (
          messageData.type &&
          !["new_message", "MESSAGE_NEW"].includes(messageData.type)
        ) {
          return;
        }

        setChat((prev) => {
          if (!prev) return prev;
          if (prev.messages.some((message) => isDuplicateMessage(message, messageData))) {
            return prev;
          }

          return {
            ...prev,
            messages: [
              ...prev.messages,
              {
                ...messageData,
                fromMe:
                  (messageData.sender_email || "").toLowerCase() ===
                  (currentUser.email || "").toLowerCase(),
                formattedTime: messageData.formattedTime || formatMessageTime(messageData.timestamp),
              },
            ],
          };
        });
      }
    );
    setChatSocket(socket);

    return () => {
      if (socket) {
        chatService.closeChatWebSocket(roomId);
      }
      setChatSocket(null);
    };
  }, [roomId, currentUser?.id, currentUser?.email]);

  useEffect(() => {
    return () => {
      Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
      typingTimeoutsRef.current = {};
    };
  }, []);

  if (!chat || !currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <ChatMinimalView
      selectedChat={chat}
      setSelectedChat={setChat}
      currentUser={currentUser}
      chatSocket={chatSocket}
      typingUsers={typingUsers}
      typingClientId={typingClientIdRef.current}
      formatMessageTime={formatMessageTime}
    />
  );
};

export default MinimalChatWrapper;

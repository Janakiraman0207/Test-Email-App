import React, { useState } from "react";
import ChatMainArea from "./ChatMainArea";

const ChatMinimalView = ({
  selectedChat,
  setSelectedChat,
  currentUser,
  chatSocket,
  typingUsers,
  typingClientId,
  formatMessageTime,
}) => {
  const [input, setInput] = useState("");

  const setMessages = (updater) => {
    setSelectedChat((prev) => {
      if (!prev) return prev;

      const nextMessages =
        typeof updater === "function" ? updater(prev.messages || []) : updater;

      return {
        ...prev,
        messages: Array.isArray(nextMessages)
          ? nextMessages
          : prev.messages,
      };
    });
  };

  // ChatMainArea owns the typing socket events.
  const handleInputChange = (event) => {
    setInput(event.target.value);
  };

  // ✅ ADVANCED TYPING TEXT
  const getTypingText = () => {
    const activeTypers = Object.values(typingUsers || {}).filter(
      (t) =>
        t?.isTyping &&
        String(t.user_id) !== String(currentUser.id)
    );

    if (activeTypers.length === 0) return null;

    const names = activeTypers.map((t) => t.name || "Someone");

    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2)
      return `${names[0]} and ${names[1]} are typing...`;

    return "Several people are typing...";
  };

  const typingText = getTypingText();

  const getSenderDisplayName = (message) => {
    if (!message) return "User";

    if (
      (message.sender_email || "").toLowerCase() ===
      (currentUser.email || "").toLowerCase()
    ) {
      return "You";
    }

    return (
      `${message.sender_first_name || ""} ${
        message.sender_last_name || ""
      }`.trim() ||
      message.sender_email?.split("@")[0] ||
      "User"
    );
  };

  if (!selectedChat) {
    return (
      <div className="flex items-center justify-center h-screen">
        No chat found
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-white">
      <ChatMainArea
        chatList={[selectedChat]}
        selectedChatIdx={0}
        selectedChatOverride={selectedChat}
        input={input}
        handleInputChange={handleInputChange}
        handleKeyDown={undefined}
        handleSend={undefined}
        messages={selectedChat.messages || []}
        setMessages={setMessages}
        selectedUser={null}
        setInput={setInput}
        currentUser={currentUser}
        getSenderDisplayName={getSenderDisplayName}
        formatMessageTime={formatMessageTime}
        typingUsers={typingUsers}
        typingText={typingText}
        chatSocket={chatSocket}
        onlineUserEmails={[]}
        typingClientId={typingClientId}
        minimalMode
      />
    </div>
  );
};

export default ChatMinimalView;
